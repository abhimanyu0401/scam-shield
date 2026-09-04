/**
 * lib/ai/circuit-breaker.ts
 *
 * Redis-backed circuit breaker for the Kinkeeper AI resilience subsystem.
 *
 * STATE MACHINE:
 *
 *   CLOSED ──(≥ failureThreshold consecutive retryable failures)──▶ OPEN
 *     ▲                                                                │
 *     │                                                  (cooldownMs elapses)
 *     │                                                                ▼
 *     └──(probe success)───────────────────────────────────────── HALF_OPEN
 *                                              (probe failure) ──▶ OPEN
 *                                                              (cooldown resets)
 *
 * KEY & STATE PERSISTENCE DESIGN:
 *   ai:cb:{modelId}  →  JSON string, TTL = 86 400 s (24 hours)
 *
 *   The full CircuitRecord is stored as JSON in a single Redis key with a
 *   generous 24-hour TTL (CIRCUIT_RECORD_TTL_SEC).  This ensures the key DOES
 *   NOT expire upon cooldown completion (e.g. after 30 seconds), enabling
 *   canAttempt to atomically inspect the `openedAt` timestamp, detect that the
 *   cooldown has elapsed, and transition the state from OPEN to HALF_OPEN while
 *   granting exactly ONE exclusive probe slot.
 *
 * CONCURRENCY — HALF_OPEN PROBE EXCLUSIVITY:
 *   When cooldownMs has elapsed and multiple concurrent requests arrive
 *   simultaneously, only ONE request is granted the probe slot (returns "probe").
 *   All concurrent requests arriving while state is HALF_OPEN observe state == "HALF_OPEN"
 *   and are immediately blocked (returns "blocked").
 *
 *   This is enforced by CAN_ATTEMPT_LUA atomically:
 *     1. Reads key. If absent or CLOSED → returns 2 (proceed).
 *     2. If HALF_OPEN → returns 0 (blocked, probe in-flight).
 *     3. If OPEN:
 *        - If nowMs - openedAt < cooldownMs → returns -1 (blocked, cooldown active).
 *        - If nowMs - openedAt >= cooldownMs → transitions to HALF_OPEN, updates
 *          Redis record atomically, and returns 1 (probe acquired).
 *
 * FAILURE SEMANTICS:
 *   Only errors with AIProviderError.countsAsCircuitFailure === true affect
 *   the circuit.  This is read from the error object — not re-classified here.
 *   QuotaExhaustedError, SchemaValidationError, AuthError, BadRequestError,
 *   ModelNotFoundError, and UnsupportedCapabilityError do NOT affect the circuit.
 *
 * REDIS FAILURE BEHAVIOR (FAIL-OPEN):
 *   If Redis is unavailable at ANY point (including during client construction
 *   via getRedis() or network commands):
 *   - canAttempt: logs an infrastructure warning and returns "proceed" (fail-open).
 *   - recordSuccess / recordFailure: logs an infrastructure warning and silently drops
 *     the update without converting the error into a provider/circuit failure.
 *
 *   Redis unavailability is NEVER represented as a circuit-breaker trip or quota error.
 */

import { Redis } from "@upstash/redis";
import { CIRCUIT_BREAKER_CONFIG } from "./config";
import { isCircuitFailure } from "./errors";
import type { AIProviderError } from "./errors";
import type { CircuitRecord, CircuitState } from "./types";

// ---------------------------------------------------------------------------
// 1. Redis Client
// ---------------------------------------------------------------------------

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
// 2. Key Builder & Constants
// ---------------------------------------------------------------------------

/**
 * Redis key for the circuit breaker state of a given model.
 */
export function circuitKey(modelId: string): string {
  return `ai:cb:${modelId}`;
}

/**
 * Retention TTL for circuit breaker state records (24 hours).
 * Long enough to ensure OPEN records persist well past the cooldown duration,
 * allowing atomic detection of cooldown expiry and transition to HALF_OPEN.
 */
const CIRCUIT_RECORD_TTL_SEC = 86_400;

// ---------------------------------------------------------------------------
// 3. Lua Scripts
// ---------------------------------------------------------------------------

/**
 * Atomic canAttempt check + HALF_OPEN probe acquisition.
 *
 * KEYS[1]  = circuit state key
 * ARGV[1]  = current Unix-ms timestamp (as string)
 * ARGV[2]  = cooldown duration in ms (as string)
 * ARGV[3]  = record TTL in seconds (as string)
 *
 * Returns:
 *   2  → CLOSED (or key absent) — proceed normally
 *   1  → was OPEN, cooldown elapsed, probe acquired → now HALF_OPEN
 *   0  → already HALF_OPEN, probe taken by another request → block
 *  -1  → OPEN, cooldown has NOT elapsed → block
 */
const CAN_ATTEMPT_LUA = `
local key        = KEYS[1]
local nowMs      = tonumber(ARGV[1])
local cooldownMs = tonumber(ARGV[2])
local recordTTL  = tonumber(ARGV[3])

local raw = redis.call('GET', key)
if not raw then
  return 2
end

local rec = cjson.decode(raw)
local state = rec['state']

if state == 'CLOSED' then
  return 2
end

if state == 'HALF_OPEN' then
  return 0
end

-- state == OPEN
local openedAt = tonumber(rec['openedAt'] or 0)
if nowMs - openedAt < cooldownMs then
  return -1
end

-- Cooldown elapsed: atomically transition to HALF_OPEN and acquire probe
rec['state'] = 'HALF_OPEN'
rec['openedAt'] = nil
redis.call('SET', key, cjson.encode(rec), 'EX', recordTTL)
return 1
`.trim();

/**
 * Atomic record-success: transition to CLOSED and reset failureCount.
 *
 * KEYS[1] = circuit state key
 */
const RECORD_SUCCESS_LUA = `
local key = KEYS[1]
local raw = redis.call('GET', key)
if not raw then
  return 0
end
local rec = cjson.decode(raw)
rec['state']        = 'CLOSED'
rec['failureCount'] = 0
rec['openedAt']     = nil
redis.call('SET', key, cjson.encode(rec))
redis.call('PERSIST', key)
return 1
`.trim();

/**
 * Atomic record-failure: increment failureCount; open circuit when threshold reached
 * or when probe fails during HALF_OPEN.
 *
 * KEYS[1]  = circuit state key
 * ARGV[1]  = failure threshold (integer, as string)
 * ARGV[2]  = record TTL in seconds (as string)
 * ARGV[3]  = current Unix-ms timestamp (as string)
 *
 * Returns the new failureCount.
 */
const RECORD_FAILURE_LUA = `
local key       = KEYS[1]
local threshold = tonumber(ARGV[1])
local ttlSec    = tonumber(ARGV[2])
local nowMs     = tonumber(ARGV[3])

local raw = redis.call('GET', key)
local rec
if raw then
  rec = cjson.decode(raw)
else
  rec = { state = 'CLOSED', failureCount = 0 }
end

-- If probe failed in HALF_OPEN, reopen circuit and reset cooldown
if rec['state'] == 'HALF_OPEN' then
  rec['state']        = 'OPEN'
  rec['openedAt']     = nowMs
  rec['failureCount'] = threshold
  redis.call('SET', key, cjson.encode(rec), 'EX', ttlSec)
  return threshold
end

-- Do not increment further when already OPEN (avoid counter bloat)
if rec['state'] == 'OPEN' then
  return tonumber(rec['failureCount'] or 0)
end

-- State is CLOSED: increment failure count
rec['failureCount'] = (tonumber(rec['failureCount'] or 0)) + 1

if rec['failureCount'] >= threshold then
  rec['state']    = 'OPEN'
  rec['openedAt'] = nowMs
  redis.call('SET', key, cjson.encode(rec), 'EX', ttlSec)
else
  redis.call('SET', key, cjson.encode(rec), 'EX', ttlSec)
end

return rec['failureCount']
`.trim();

// ---------------------------------------------------------------------------
// 4. canAttempt
// ---------------------------------------------------------------------------

/**
 * Determines whether the router should attempt this model.
 *
 * Returns one of three outcomes:
 *   "proceed"      — CLOSED or HALF_OPEN probe acquired; dispatch the request.
 *   "blocked"      — OPEN (cooldown not elapsed) or HALF_OPEN already taken.
 *   "probe"        — This request has been granted the exclusive HALF_OPEN probe.
 *
 * The router treats "blocked" as skip-to-next-model.
 * The router treats "proceed" and "probe" as dispatch-to-provider.
 *
 * On Redis failure: returns "proceed" (fail-open) and logs a warning.
 */
export type AttemptDecision = "proceed" | "probe" | "blocked";

export async function canAttempt(modelId: string): Promise<AttemptDecision> {
  const key = circuitKey(modelId);
  const nowMs = Date.now();

  let result: number;
  try {
    const redis = getRedis();
    result = await redis.eval<string[], number>(
      CAN_ATTEMPT_LUA,
      [key],
      [
        String(nowMs),
        String(CIRCUIT_BREAKER_CONFIG.cooldownMs),
        String(CIRCUIT_RECORD_TTL_SEC),
      ],
    );
  } catch (redisErr: unknown) {
    console.warn(
      `[circuit-breaker] Redis unavailable for canAttempt(${modelId}); failing open. Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
    return "proceed";
  }

  switch (result) {
    case 2:  return "proceed";  // CLOSED
    case 1:  return "probe";    // HALF_OPEN probe acquired
    case 0:  return "blocked";  // HALF_OPEN already taken
    case -1: return "blocked";  // OPEN, cooldown not elapsed
    default: return "proceed";  // defensive
  }
}

// ---------------------------------------------------------------------------
// 5. recordSuccess
// ---------------------------------------------------------------------------

/**
 * Records a successful response from a model.
 *
 * - Resets failureCount to 0.
 * - Transitions state to CLOSED from any state (CLOSED, OPEN, HALF_OPEN).
 * - Removes the key TTL so the record persists until next failure.
 *
 * This must be called after every successful provider call, including
 * HALF_OPEN probes.
 *
 * On Redis failure: silently dropped and logged.
 */
export async function recordSuccess(modelId: string): Promise<void> {
  const key = circuitKey(modelId);
  try {
    const redis = getRedis();
    await redis.eval<string[], number>(
      RECORD_SUCCESS_LUA,
      [key],
      [],
    );
  } catch (redisErr: unknown) {
    console.warn(
      `[circuit-breaker] Redis unavailable for recordSuccess(${modelId}); circuit state not updated. Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
  }
}

// ---------------------------------------------------------------------------
// 6. recordFailure
// ---------------------------------------------------------------------------

/**
 * Records a provider failure for a model.
 *
 * Only errors with `countsAsCircuitFailure === true` (from errors.ts) are
 * counted.  All other errors (QuotaExhaustedError, SchemaValidationError,
 * AuthError, etc.) are silently ignored.
 *
 * When the consecutive failure count reaches CIRCUIT_BREAKER_CONFIG.failureThreshold,
 * or if a probe fails during HALF_OPEN, the circuit transitions to OPEN and
 * `openedAt` is set to the current timestamp.
 *
 * On Redis failure: silently dropped and logged.
 *
 * @param modelId - Model that failed.
 * @param error   - The typed AIProviderError from the provider.
 */
export async function recordFailure(
  modelId: string,
  error: AIProviderError,
): Promise<void> {
  // Only retryable circuit failures affect the circuit breaker.
  if (!isCircuitFailure(error)) {
    return;
  }

  const key = circuitKey(modelId);
  try {
    const redis = getRedis();
    await redis.eval<string[], number>(
      RECORD_FAILURE_LUA,
      [key],
      [
        String(CIRCUIT_BREAKER_CONFIG.failureThreshold),
        String(CIRCUIT_RECORD_TTL_SEC),
        String(Date.now()),
      ],
    );
  } catch (redisErr: unknown) {
    console.warn(
      `[circuit-breaker] Redis unavailable for recordFailure(${modelId}); circuit state not updated. Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
  }
}

// ---------------------------------------------------------------------------
// 7. getState (read-only, for telemetry / tests)
// ---------------------------------------------------------------------------

/**
 * Returns the current raw circuit state for a model.
 * Intended for observability, testing, and the router's telemetry path.
 *
 * Does NOT mutate state.
 * Returns a default CLOSED record if the key is absent or Redis is unavailable.
 */
export async function getCircuitState(modelId: string): Promise<CircuitRecord> {
  const key = circuitKey(modelId);

  const CLOSED_DEFAULT: CircuitRecord = {
    state: "CLOSED",
    failureCount: 0,
  };

  try {
    const redis = getRedis();
    const raw = await redis.get<string>(key);
    if (!raw) return CLOSED_DEFAULT;
    const parsed = JSON.parse(raw) as Partial<CircuitRecord>;
    return {
      state: (parsed.state ?? "CLOSED") as CircuitState,
      failureCount: parsed.failureCount ?? 0,
      openedAt: parsed.openedAt,
    };
  } catch {
    return CLOSED_DEFAULT;
  }
}

/**
 * Resets a circuit breaker to CLOSED state with zero failures.
 * Intended for testing and manual operator intervention only.
 * Not called by the router or providers.
 */
export async function resetCircuit(modelId: string): Promise<void> {
  try {
    const redis = getRedis();
    const record: CircuitRecord = { state: "CLOSED", failureCount: 0 };
    await redis.set(circuitKey(modelId), JSON.stringify(record));
  } catch (redisErr: unknown) {
    console.warn(
      `[circuit-breaker] Redis unavailable for resetCircuit(${modelId}). Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
  }
}

/**
 * Atomic LUA script to revert HALF_OPEN to OPEN.
 *
 * KEYS[1]  = circuit state key
 * ARGV[1]  = past openedAt timestamp (nowMs - cooldownMs)
 * ARGV[2]  = record TTL in seconds
 *
 * Returns 1 if reverted, 0 otherwise.
 */
const REVERT_HALF_OPEN_LUA = `
local key        = KEYS[1]
local pastTimeMs = tonumber(ARGV[1])
local recordTTL  = tonumber(ARGV[2])

local raw = redis.call('GET', key)
if not raw then
  return 0
end

local rec = cjson.decode(raw)
local state = rec['state']

if state == 'HALF_OPEN' then
  rec['state'] = 'OPEN'
  rec['openedAt'] = pastTimeMs
  redis.call('SET', key, cjson.encode(rec), 'EX', recordTTL)
  return 1
end

return 0
`.trim();

/**
 * Reverts the circuit from HALF_OPEN back to OPEN in an atomic, consistent state,
 * preserving the cooldown window (allowing other requests to probe immediately).
 *
 * Fails open on Redis outages.
 */
export async function revertHalfOpen(modelId: string): Promise<void> {
  const key = circuitKey(modelId);
  const pastTimeMs = Date.now() - CIRCUIT_BREAKER_CONFIG.cooldownMs;
  try {
    const redis = getRedis();
    await redis.eval<string[], number>(
      REVERT_HALF_OPEN_LUA,
      [key],
      [String(pastTimeMs), String(CIRCUIT_RECORD_TTL_SEC)],
    );
  } catch (redisErr: unknown) {
    console.warn(
      `[circuit-breaker] Redis unavailable for revertHalfOpen(${modelId}); circuit state not updated. Error type: ${
        redisErr instanceof Error ? redisErr.name : typeof redisErr
      }`,
    );
  }
}

