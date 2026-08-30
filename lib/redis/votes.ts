/**
 * lib/redis/votes.ts
 *
 * Data Access Layer for Community Confirm/Deny Voting on Scam Reports (Phase 11).
 *
 * Redis Storage Model:
 *   - Key: `report:${reportId}:votes`
 *   - Type: Hash (`HSET`, `HGETALL`, `HGET`, `DEL`)
 *   - Shape: `{ [userId: string]: "confirm" | "deny" }`
 *
 * Guarantees:
 *   - Atomic single-vote per user (each userId is a hash field).
 *   - Free vote switching (re-voting overwrites the existing field).
 *   - TTL sync: vote hash expiration matches the parent `report:${reportId}` remaining lifespan (default 60 days).
 */

import { Redis } from "@upstash/redis";

export type VoteType = "confirm" | "deny";

export interface VoteSummary {
  confirms: number;
  denies: number;
  total: number;
  userVotes: Record<string, VoteType>;
}

export const DEFAULT_REPORT_TTL_SECONDS = 60 * 24 * 60 * 60; // 60 days

let _redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!_redisClient) {
    _redisClient = new Redis({
      url: process.env.REDIS_KV_REST_API_URL!,
      token: process.env.REDIS_KV_REST_API_TOKEN!,
    });
  }
  return _redisClient;
}

/**
 * Custom redis instance setter for unit testing / mocking.
 */
export function setRedisClient(client: Redis | null): void {
  _redisClient = client;
}

/**
 * Generates the Redis key for a report's vote hash.
 */
export function getVoteKey(reportId: string): string {
  return `report:${reportId}:votes`;
}

/**
 * Records or updates a user's vote ("confirm" | "deny") on a report.
 *
 * Atomically writes the vote to `report:${reportId}:votes` and synchronizes
 * the vote hash's TTL with the parent report's remaining TTL.
 */
export async function setVote(
  reportId: string,
  userId: string,
  vote: VoteType,
  redisInstance?: Redis
): Promise<void> {
  const redis = redisInstance || getRedisClient();
  const voteKey = getVoteKey(reportId);

  // 1. Write the vote into the hash (overwrites if user already voted)
  await redis.hset(voteKey, { [userId]: vote });

  // 2. Query remaining TTL of parent canonical report key (`report:${reportId}`)
  //
  // NOTE for Phase 11.2 (Vote Route):
  // redis.ttl() returns:
  //   - positive integer: remaining TTL in seconds
  //   - -1: key exists but has no associated expire
  //   - -2: key does not exist
  // If parentTtl === -2, it indicates setVote was called on a report that no longer
  // exists or has already expired. The pre-flight report existence check and circle
  // membership validation belong in the Phase 11.2 API route before calling setVote.
  let effectiveTtl = DEFAULT_REPORT_TTL_SECONDS;
  try {
    const parentTtl = await redis.ttl(`report:${reportId}`);
    if (parentTtl > 0) {
      effectiveTtl = parentTtl;
    }
  } catch (err) {
    console.warn(`Could not read parent report TTL for report:${reportId}:`, err);
  }

  // 3. Align vote hash TTL to match parent report lifespan exactly
  try {
    await redis.expire(voteKey, effectiveTtl);
  } catch (err) {
    console.warn(`Could not set TTL on vote key ${voteKey}:`, err);
  }
}

/**
 * Retrieves all votes for a report as a record mapping userId to vote type.
 */
export async function getVotes(
  reportId: string,
  redisInstance?: Redis
): Promise<Record<string, VoteType>> {
  const redis = redisInstance || getRedisClient();
  const voteKey = getVoteKey(reportId);

  try {
    const raw = await redis.hgetall(voteKey);
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const votes: Record<string, VoteType> = {};
    for (const [uid, v] of Object.entries(raw)) {
      if (v === "confirm" || v === "deny") {
        votes[uid] = v;
      }
    }
    return votes;
  } catch (err) {
    console.warn(`Could not fetch votes for report:${reportId}:`, err);
    return {};
  }
}

/**
 * Retrieves an aggregated summary of votes for a report.
 */
export async function getVoteSummary(
  reportId: string,
  redisInstance?: Redis
): Promise<VoteSummary> {
  const userVotes = await getVotes(reportId, redisInstance);
  let confirms = 0;
  let denies = 0;

  for (const vote of Object.values(userVotes)) {
    if (vote === "confirm") confirms++;
    else if (vote === "deny") denies++;
  }

  return {
    confirms,
    denies,
    total: confirms + denies,
    userVotes,
  };
}

/**
 * Retrieves a single user's vote on a report, or null if they have not voted.
 */
export async function getUserVote(
  reportId: string,
  userId: string,
  redisInstance?: Redis
): Promise<VoteType | null> {
  const redis = redisInstance || getRedisClient();
  const voteKey = getVoteKey(reportId);

  try {
    const vote = await redis.hget<VoteType>(voteKey, userId);
    if (vote === "confirm" || vote === "deny") {
      return vote;
    }
    return null;
  } catch (err) {
    console.warn(`Could not get user vote for report:${reportId}, user:${userId}:`, err);
    return null;
  }
}

/**
 * Deletes all votes associated with a report.
 * Called when deleting a report in Phase 11.
 */
export async function deleteVotes(
  reportId: string,
  redisInstance?: Redis
): Promise<void> {
  const redis = redisInstance || getRedisClient();
  const voteKey = getVoteKey(reportId);

  try {
    await redis.del(voteKey);
  } catch (err) {
    console.warn(`Could not delete votes for report:${reportId}:`, err);
  }
}
