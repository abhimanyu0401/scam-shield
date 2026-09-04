/**
 * lib/ai/quota-manager.ts
 *
 * Atomic pre-call quota reservation for the Kinkeeper AI resilience subsystem.
 *
 * Enforces per-model RPM and RPD limits using Redis Lua scripts to guarantee
 * atomicity under concurrent requests.
 *
 * WHY LUA SCRIPTS:
 *   A plain INCR-then-check sequence is race-prone:
 *
 *     Req A: INCR → limit+1 → rejected (but slot consumed)
 *     Req B: INCR → limit+2 → rejected (but slot consumed)
 *     Req C: INCR → limit+3 → rejected (slot consumed again)
 *
 *   With a Lua script the CHECK and INCR execute atomically inside Redis.
 *   No concurrent request can observe or consume a slot that was not
 *   genuinely available.
 *
 * ATOMICITY STRATEGY:
 *   Two Lua scripts are used:
 *
 *   1. RESERVE_BOTH_SCRIPT — attempts to reserve one RPM slot AND one RPD
 *      slot in a single atomic Lua execution using a single KEYS/ARGV call.
 *      Returns:
 *        1  → both reserved (ALLOWED)
 *        0  → RPM exhausted
 *       -1  → RPD exhausted
 *
 *   This means neither counter is incremented if either limit is full.
 *   There is no partial reservation that needs rollback.
 *
 * KEY NAMING:
 *   ai:quota:{modelId}:rpm:{minuteBucket}   TTL = 65 s
 *   ai:quota:{modelId}:rpd:{dayBucket}      TTL = 86 410 s (~24 h + 10 s buffer)
 *
 *   minuteBucket = Math.floor(Date.now() / 60_000)  (changes every minute)
 *   dayBucket    = new Date().toISOString().slice(0, 10)  (YYYY-MM-DD in UTC)
 *
 *   Keys expire automatically — no permanent Redis keys accumulate.
 *   Model IDs are isolated by key prefix.
 *
 * ERROR HANDLING:
 *   If Redis itself is unavailable, the quota manager FAILS OPEN (allows the
 *   request through) to prevent a Redis outage from taking down the entire AI
 *   service.  This behaviour is logged distinctly so it is observable.
 *
 *   A Redis outage is NOT represented as QuotaExhaustedError.  These are two
 *   distinct conditions with different operational meanings.
 *
 * CIRCUIT BREAKER IMPACT:
 *   QuotaExhaustedError.countsAsCircuitFailure === false (set in errors.ts).
 *   The circuit breaker never sees quota errors.
 */

import { Redis } from "@upstash/redis";
import { QuotaExhaustedError } from "./errors";
import type { QuotaStatus } from "./types";
import type { ModelDefinition } from "./config";

// ---------------------------------------------------------------------------
// 1. Redis Client (module-scoped singleton)
// ---------------------------------------------------------------------------

/**
 * Shared Redis client.  Constructed lazily on first use so that missing env
 * vars during module import (e.g. in unit tests) do not crash the process.
 */
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.REDIS_KV_REST_API_URL!,
      token: process.env.REDIS_KV_REST_API_TOKEN!,
      retry: false,
      signal: () => AbortSignal.timeout(500),
    });
  }
  return _redis;
}

// ---------------------------------------------------------------------------
// 2. Key Builders
// ---------------------------------------------------------------------------

/**
 * Returns the current one-minute bucket integer.
 * Changes every 60 000 ms.  Used as part of the RPM key.
 */
function minuteBucket(): number {
  return Math.floor(Date.now() / 60_000);
}

/**
 * Returns the current UTC date string (YYYY-MM-DD).
 * Changes at UTC midnight.  Used as part of the RPD key.
 */
function dayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Redis key for the RPM counter of a given model in the current minute.
 */
export function rpmKey(modelId: string): string {
  return `ai:quota:${modelId}:rpm:${minuteBucket()}`;
}

/**
 * Redis key for the RPD counter of a given model on the current UTC day.
 */
export function rpdKey(modelId: string): string {
  return `ai:quota:${modelId}:rpd:${dayBucket()}`;
}

// ---------------------------------------------------------------------------
// 3. Atomic Lua Script
// ---------------------------------------------------------------------------

/**
 * Lua script that atomically reserves one RPM slot AND one RPD slot.
 *
 * KEYS[1] = RPM key   (ai:quota:{modelId}:rpm:{minuteBucket})
 * KEYS[2] = RPD key   (ai:quota:{modelId}:rpd:{dayBucket})
 * ARGV[1] = RPM limit (integer)
 * ARGV[2] = RPD limit (integer)
 * ARGV[3] = RPM TTL   (integer, seconds — 65)
 * ARGV[4] = RPD TTL   (integer, seconds — 86410)
 *
 * Returns:
 *    1  → both limits have room; both counters incremented
 *    0  → RPM limit reached; nothing incremented
 *   -1  → RPD limit reached; nothing incremented (RPM was within limit)
 *
 * No partial reservation: if RPM is within limit but RPD is full,
 * the RPM counter is NOT incremented.
 */
const RESERVE_BOTH_LUA = `
local rpmKey  = KEYS[1]
local rpdKey  = KEYS[2]
local rpmLimit = tonumber(ARGV[1])
local rpdLimit = tonumber(ARGV[2])
local rpmTTL   = tonumber(ARGV[3])
local rpdTTL   = tonumber(ARGV[4])

-- Check RPM
local rpmCurrent = tonumber(redis.call('GET', rpmKey) or 0)
if rpmCurrent >= rpmLimit then
  return 0
end

-- Check RPD
local rpdCurrent = tonumber(redis.call('GET', rpdKey) or 0)
if rpdCurrent >= rpdLimit then
  return -1
end

-- Both limits have room — reserve both
local newRpm = redis.call('INCR', rpmKey)
if newRpm == 1 then
  redis.call('EXPIRE', rpmKey, rpmTTL)
end

local newRpd = redis.call('INCR', rpdKey)
if newRpd == 1 then
  redis.call('EXPIRE', rpdKey, rpdTTL)
end

return 1
`.trim();

// TTLs
const RPM_TTL_SECONDS = 65;       // slightly longer than a minute to handle boundary slippage
const RPD_TTL_SECONDS = 86_410;   // 24 h + 10 s buffer

// ---------------------------------------------------------------------------
// 4. Public API
// ---------------------------------------------------------------------------

/**
 * Attempts to atomically reserve one RPM and one RPD quota slot for a model.
 *
 * Returns "ALLOWED" if both limits have capacity and the slots are reserved.
 * Throws QuotaExhaustedError if either limit is full.
 *
 * If Redis is unavailable, logs the infrastructure error and returns "ALLOWED"
 * (fail-open) so a Redis outage does not block all AI requests.
 *
 * NEVER throws QuotaExhaustedError on a Redis connection failure.
 *
 * @param model - The ModelDefinition from MODEL_REGISTRY.
 * @returns QuotaStatus ("ALLOWED")
 * @throws QuotaExhaustedError — when the model's RPM or RPD limit is full.
 */
export async function tryReserveQuota(
  model: ModelDefinition,
): Promise<QuotaStatus> {
  const kRpm = rpmKey(model.modelId);
  const kRpd = rpdKey(model.modelId);

  let result: number;
  try {
    const redis = getRedis();
    result = await redis.eval<string[], number>(
      RESERVE_BOTH_LUA,
      [kRpm, kRpd],
      [
        String(model.maxRpm),
        String(model.maxRpd),
        String(RPM_TTL_SECONDS),
        String(RPD_TTL_SECONDS),
      ],
    );
  } catch (redisErr: unknown) {
    // Redis infrastructure failure — fail-open, not QuotaExhaustedError.
    // The router/telemetry layer can observe this via the logged warning.
    console.warn(
      `[quota-manager] Redis unavailable for model ${model.modelId}; failing open. Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
    return "ALLOWED";
  }

  if (result === 0) {
    throw new QuotaExhaustedError(model.modelId, model.provider, "rpm");
  }
  if (result === -1) {
    throw new QuotaExhaustedError(model.modelId, model.provider, "rpd");
  }

  // result === 1 → both reserved
  return "ALLOWED";
}

/**
 * Returns the current RPM and RPD counter values for a model without
 * modifying them.  Intended for observability/debugging only.
 *
 * Returns null values if Redis is unavailable.
 */
export async function getQuotaUsage(modelId: string): Promise<{
  rpm: number | null;
  rpd: number | null;
}> {
  try {
    const redis = getRedis();
    const [rpmRaw, rpdRaw] = await Promise.all([
      redis.get<string>(rpmKey(modelId)),
      redis.get<string>(rpdKey(modelId)),
    ]);
    return {
      rpm: rpmRaw !== null ? Number(rpmRaw) : 0,
      rpd: rpdRaw !== null ? Number(rpdRaw) : 0,
    };
  } catch {
    return { rpm: null, rpd: null };
  }
}
