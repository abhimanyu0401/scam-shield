/**
 * scripts/test-phase-11-1-votes.ts
 *
 * Automated test suite for Phase 11.1 Confirm/Deny Voting Data Layer (lib/redis/votes.ts).
 * Tests:
 *   1. Initializing and recording votes ("confirm" & "deny").
 *   2. Single vote per user & atomic vote switching (overwriting).
 *   3. Aggregation in getVoteSummary and getVotes.
 *   4. Individual getUserVote query.
 *   5. deleteVotes clearing the vote record.
 *   6. Dynamic TTL alignment with parent report.
 */

import {
  setVote,
  getVotes,
  getVoteSummary,
  getUserVote,
  deleteVotes,
  getVoteKey,
  DEFAULT_REPORT_TTL_SECONDS,
  type VoteType,
} from "../lib/redis/votes";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

// In-memory mock Redis for deterministic unit testing
class MockRedis {
  private hashes: Map<string, Map<string, string>> = new Map();
  private ttls: Map<string, number> = new Map();

  async hset(key: string, obj: Record<string, string>) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const map = this.hashes.get(key)!;
    for (const [k, v] of Object.entries(obj)) {
      map.set(k, String(v));
    }
    return Object.keys(obj).length;
  }

  async hgetall(key: string) {
    const map = this.hashes.get(key);
    if (!map) return null;
    const obj: Record<string, string> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  async hget(key: string, field: string) {
    const map = this.hashes.get(key);
    if (!map) return null;
    return map.get(field) ?? null;
  }

  async del(key: string) {
    this.hashes.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async ttl(key: string) {
    if (!this.ttls.has(key) && !this.hashes.has(key)) {
      return -2; // Key doesn't exist
    }
    return this.ttls.get(key) ?? -1;
  }

  async expire(key: string, seconds: number) {
    this.ttls.set(key, seconds);
    return 1;
  }

  setMockParentReport(reportId: string, remainingTtl: number) {
    this.ttls.set(`report:${reportId}`, remainingTtl);
  }

  getTtl(key: string): number | undefined {
    return this.ttls.get(key);
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("PHASE 11.1 — CONFIRM/DENY VOTING DATA LAYER VERIFICATION");
  console.log("==================================================================\n");

  const mockRedis = new MockRedis() as any;
  const reportId = "report-test-uuid-001";
  const userA = "user-alice-111";
  const userB = "user-bob-222";
  const userC = "user-charlie-333";

  // Simulate parent report created with 45 days remaining TTL
  const simulatedRemainingTtl = 45 * 24 * 60 * 60; // 3,888,000 seconds
  mockRedis.setMockParentReport(reportId, simulatedRemainingTtl);

  // -------------------------------------------------------------------------
  // Test 1: Key Generation
  // -------------------------------------------------------------------------
  console.log("Test 1: Redis Key Naming Convention");
  assert(getVoteKey(reportId) === `report:${reportId}:votes`, "Key matches pattern report:${reportId}:votes");

  // -------------------------------------------------------------------------
  // Test 2: Casting Initial Votes
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Casting Votes & Dynamic Parent TTL Sync");
  await setVote(reportId, userA, "confirm", mockRedis);
  await setVote(reportId, userB, "confirm", mockRedis);
  await setVote(reportId, userC, "deny", mockRedis);

  const votes = await getVotes(reportId, mockRedis);
  assert(votes[userA] === "confirm", "Alice voted 'confirm'");
  assert(votes[userB] === "confirm", "Bob voted 'confirm'");
  assert(votes[userC] === "deny", "Charlie voted 'deny'");
  assert(Object.keys(votes).length === 3, "Exactly 3 distinct user votes recorded");

  const voteKeyTtl = mockRedis.getTtl(getVoteKey(reportId));
  assert(voteKeyTtl === simulatedRemainingTtl, "Vote hash TTL synchronized to exact parent report TTL (45 days)");

  // -------------------------------------------------------------------------
  // Test 3: Vote Switching (Atomic Overwrite)
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Vote Switching / Re-voting");
  // Charlie changes vote from "deny" to "confirm"
  await setVote(reportId, userC, "confirm", mockRedis);

  const updatedVotes = await getVotes(reportId, mockRedis);
  assert(updatedVotes[userC] === "confirm", "Charlie's vote changed from 'deny' to 'confirm'");
  assert(Object.keys(updatedVotes).length === 3, "Total vote count remains 3 after vote switch (no duplicate entry)");

  // -------------------------------------------------------------------------
  // Test 4: Aggregation & Summary
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Vote Summary Calculation");
  const summary = await getVoteSummary(reportId, mockRedis);
  assert(summary.confirms === 3, "Summary confirms count is 3");
  assert(summary.denies === 0, "Summary denies count is 0");
  assert(summary.total === 3, "Summary total count is 3");

  // Bob changes vote to "deny"
  await setVote(reportId, userB, "deny", mockRedis);
  const summary2 = await getVoteSummary(reportId, mockRedis);
  assert(summary2.confirms === 2, "Updated confirms count is 2 (Alice, Charlie)");
  assert(summary2.denies === 1, "Updated denies count is 1 (Bob)");
  assert(summary2.total === 3, "Updated total count is 3");

  // -------------------------------------------------------------------------
  // Test 5: Single User Lookup
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Individual User Vote Lookup");
  const aliceVote = await getUserVote(reportId, userA, mockRedis);
  const bobVote = await getUserVote(reportId, userB, mockRedis);
  const nonVoter = await getUserVote(reportId, "user-stranger-999", mockRedis);

  assert(aliceVote === "confirm", "getUserVote returns 'confirm' for Alice");
  assert(bobVote === "deny", "getUserVote returns 'deny' for Bob");
  assert(nonVoter === null, "getUserVote returns null for non-voter");

  // -------------------------------------------------------------------------
  // Test 6: TTL Fallback when Parent Report Has No Expiry or Key Missing
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Fallback TTL Handling");
  const orphanReportId = "report-orphan-uuid-999";
  // Orphan report has no parent mock record in Redis (parentTtl = -2)
  await setVote(orphanReportId, userA, "confirm", mockRedis);
  const orphanKeyTtl = mockRedis.getTtl(getVoteKey(orphanReportId));
  assert(orphanKeyTtl === DEFAULT_REPORT_TTL_SECONDS, "Defaults to 60 days (5,184,000s) when parent TTL is unavailable");

  // -------------------------------------------------------------------------
  // Test 7: Deletion of Vote Hash
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Deleting Vote Hash (Report Clean-up)");
  await deleteVotes(reportId, mockRedis);
  const votesAfterDel = await getVotes(reportId, mockRedis);
  assert(Object.keys(votesAfterDel).length === 0, "Vote hash successfully deleted from Redis");

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
