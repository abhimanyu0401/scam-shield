import type { Redis } from "@upstash/redis";

const CLAIM_TTL_SECONDS = 120;
const USED_TTL_SECONDS = 900;

export type ClaimResult = "claimed" | "missing" | "used";

export async function claimAnalysis(redis: Redis, analysisId: string): Promise<ClaimResult> {
  const result = await redis.eval<string[], number>(
    "if redis.call('EXISTS', KEYS[3]) == 1 then return 2 end if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end if redis.call('SET', KEYS[2], ARGV[1], 'NX', 'EX', ARGV[2]) then return 1 end return 2",
    [`analysis:${analysisId}`, `analysis:claim:${analysisId}`, `analysis:used:${analysisId}`], ["1", String(CLAIM_TTL_SECONDS)],
  );
  return result === 1 ? "claimed" : result === 2 ? "used" : "missing";
}

export async function releaseAnalysisClaim(redis: Redis, analysisId: string): Promise<void> {
  await redis.del(`analysis:claim:${analysisId}`);
}

export async function commitReport(redis: Redis, analysisId: string, circleId: string, report: string): Promise<boolean> {
  const result = await redis.eval<string[], number>(
    "if redis.call('EXISTS', KEYS[2]) == 0 or redis.call('EXISTS', KEYS[3]) == 0 then return 0 end redis.call('RPUSH', KEYS[1], ARGV[1]); redis.call('LTRIM', KEYS[1], -200, -1); redis.call('DEL', KEYS[2]); redis.call('DEL', KEYS[3]); redis.call('SET', KEYS[4], '1', 'EX', ARGV[2]); return 1",
    [`circle:${circleId}`, `analysis:${analysisId}`, `analysis:claim:${analysisId}`, `analysis:used:${analysisId}`], [report, String(USED_TTL_SECONDS)],
  );
  return result === 1;
}
