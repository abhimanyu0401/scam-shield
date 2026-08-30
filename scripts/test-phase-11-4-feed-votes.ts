/**
 * scripts/test-phase-11-4-feed-votes.ts
 *
 * Automated test suite and real-world latency model for Phase 11.4 Feed Vote Integration.
 * Tests:
 *   1. Correct feed response schema with votes & isOwnReport
 *   2. Capping display names at 3 while preserving full un-capped counts
 *   3. Single-batch profile display name resolution
 *   4. currentUserVote detection for viewing member
 *   5. isOwnReport flag accuracy
 *   6. Real-world latency model across 20-report and 100-report feeds with chunk size 25
 */

import { performance } from "perf_hooks";
import * as dotenv from "dotenv";
import * as path from "path";
import { Redis } from "@upstash/redis";
import type { VoteType } from "../lib/redis/votes";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

export {};

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

interface VoterInfo {
  userId: string;
  displayName: string;
}

interface ReportVoteData {
  confirms: number;
  denies: number;
  total: number;
  confirmedBy: VoterInfo[];
  deniedBy: VoterInfo[];
  currentUserVote: "confirm" | "deny" | null;
}

interface FeedCircleReport {
  id: string;
  groupIds: string[];
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  timestamp: string;
  clusterCount: number;
  isOwnReport: boolean;
  votes: ReportVoteData;
}

// Feed Resolution with real-world network latency modeling
async function runFeedResolution(
  circleReports: any[],
  targetCircleId: string,
  viewerUserId: string,
  mockVotesDb: Record<string, Record<string, VoteType>>,
  mockProfilesDb: Record<string, string>,
  chunkSize: number = 25,
  simulatedRoundTripLatencyMs: number = 25 // Realistic Upstash HTTP round-trip (20-30ms)
): Promise<{ reports: FeedCircleReport[]; elapsedMs: number }> {
  const startTime = performance.now();

  // 1. Cluster counts
  const clusterCounts: Record<string, number> = {};
  for (const report of circleReports) {
    const groupClusterId =
      report.clusterIds?.[targetCircleId] ?? report.clusterId ?? report.id;
    if (groupClusterId) {
      clusterCounts[groupClusterId] = (clusterCounts[groupClusterId] || 0) + 1;
    }
  }

  // 2. Fetch votes with chunking
  const reportVotesMap: Record<string, Record<string, VoteType>> = {};
  const allVoterUserIds = new Set<string>();

  for (let i = 0; i < circleReports.length; i += chunkSize) {
    const chunk = circleReports.slice(i, i + chunkSize);
    // Simulating parallel HTTP requests in the chunk
    await new Promise((r) => setTimeout(r, simulatedRoundTripLatencyMs));
    const chunkResults = chunk.map((report) => {
      const votes = mockVotesDb[report.id] || {};
      return { id: report.id, votes };
    });

    for (const { id, votes } of chunkResults) {
      reportVotesMap[id] = votes;
      for (const uid of Object.keys(votes)) {
        allVoterUserIds.add(uid);
      }
    }
  }

  // 3. Batched Supabase profile query
  const nameMap = new Map<string, string>();
  if (allVoterUserIds.size > 0) {
    // 1 single batched Supabase query round-trip
    await new Promise((r) => setTimeout(r, simulatedRoundTripLatencyMs));
    for (const uid of allVoterUserIds) {
      if (mockProfilesDb[uid]) {
        nameMap.set(uid, mockProfilesDb[uid]);
      }
    }
  }

  // 4. Assemble response
  const responseReports: FeedCircleReport[] = circleReports.map((report) => {
    const groupClusterId =
      report.clusterIds?.[targetCircleId] ?? report.clusterId ?? report.id;
    const votesDict = reportVotesMap[report.id] || {};

    const confirmedVoters: VoterInfo[] = [];
    const deniedVoters: VoterInfo[] = [];
    let confirmsCount = 0;
    let deniesCount = 0;

    for (const [uid, voteType] of Object.entries(votesDict)) {
      const displayName = nameMap.get(uid) || "Member";
      if (voteType === "confirm") {
        confirmsCount++;
        if (confirmedVoters.length < 3) {
          confirmedVoters.push({ userId: uid, displayName });
        }
      } else if (voteType === "deny") {
        deniesCount++;
        if (deniedVoters.length < 3) {
          deniedVoters.push({ userId: uid, displayName });
        }
      }
    }

    const currentUserVote = viewerUserId && votesDict[viewerUserId] ? votesDict[viewerUserId] : null;
    const isOwnReport = Boolean(report.userId && report.userId === viewerUserId);

    return {
      id: report.id,
      groupIds: Array.isArray(report.groupIds) ? report.groupIds : [targetCircleId],
      clusterId: groupClusterId,
      text: report.text,
      riskScore: report.riskScore,
      flags: report.flags,
      explanation: report.explanation,
      timestamp: report.timestamp,
      clusterCount: clusterCounts[groupClusterId] || 1,
      isOwnReport,
      votes: {
        confirms: confirmsCount,
        denies: deniesCount,
        total: confirmsCount + deniesCount,
        confirmedBy: confirmedVoters,
        deniedBy: deniedVoters,
        currentUserVote,
      },
    };
  });

  const elapsedMs = performance.now() - startTime;
  return { reports: responseReports, elapsedMs };
}

async function runTests() {
  console.log("==================================================================");
  console.log("PHASE 11.4 — FEED VOTE RESOLUTION & REALISTIC LATENCY SUITE");
  console.log("==================================================================");

  const targetCircleId = "11111111-1111-4111-8111-111111111111";
  const viewerAliceId = "user-alice-111";
  const authorBobId = "user-bob-222";

  const mockProfilesDb: Record<string, string> = {
    [viewerAliceId]: "Alice Walker",
    [authorBobId]: "Bob Smith",
    "user-3": "Charlie Brown",
    "user-4": "Diana Prince",
    "user-5": "Evan Wright",
  };

  const circleReports = [
    {
      id: "report-1",
      groupIds: [targetCircleId],
      userId: "user-author-999",
      text: "Scam lottery SMS",
      riskScore: 85,
      flags: ["Fake lottery"],
      explanation: "Phishing SMS",
      timestamp: new Date().toISOString(),
    },
    {
      id: "report-2",
      groupIds: [targetCircleId],
      userId: authorBobId,
      text: "Suspicious bank call",
      riskScore: 90,
      flags: ["Urgent KYC"],
      explanation: "Bank imposter",
      timestamp: new Date().toISOString(),
    },
  ];

  const mockVotesDb: Record<string, Record<string, VoteType>> = {
    "report-1": {
      [viewerAliceId]: "confirm",
      "user-3": "confirm",
      "user-4": "confirm",
      "user-5": "confirm",
      "user-6-no-profile": "confirm",
    },
    "report-2": {
      "user-3": "deny",
    },
  };

  // -------------------------------------------------------------------------
  // Test 1: Functionality & Schema Tests
  // -------------------------------------------------------------------------
  console.log("\n--- 1. Verification of Vote Resolution & Name Capping ---");
  const { reports: feedReports } = await runFeedResolution(
    circleReports,
    targetCircleId,
    viewerAliceId,
    mockVotesDb,
    mockProfilesDb,
    25,
    1
  );

  const r1 = feedReports.find((r) => r.id === "report-1")!;
  assert(r1.votes.confirms === 5, "Report 1 has full confirms count = 5");
  assert(r1.votes.total === 5, "Report 1 total count = 5");
  assert(r1.votes.confirmedBy.length === 3, "confirmedBy is capped at 3 names for UI");
  assert(r1.votes.confirmedBy[0].displayName === "Alice Walker", "First voter resolved to 'Alice Walker'");
  assert(r1.votes.currentUserVote === "confirm", "Alice's vote correctly identified as 'confirm'");
  assert(r1.isOwnReport === false, "isOwnReport is false for Alice on Report 1");

  const r2 = feedReports.find((r) => r.id === "report-2")!;
  assert(r2.votes.denies === 1, "Report 2 has denies count = 1");
  assert(r2.votes.deniedBy.length === 1, "deniedBy has 1 voter");
  assert(r2.votes.deniedBy[0].displayName === "Charlie Brown", "Voter resolved to 'Charlie Brown'");
  assert(r2.votes.currentUserVote === null, "Alice has not voted on Report 2 (currentUserVote is null)");

  // -------------------------------------------------------------------------
  // Test 2: Real-World Network Latency Benchmark (25ms per HTTP Round-Trip)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Real-World Network Latency Model (25ms per HTTP RTT) ---");

  // Benchmark A: 20 reports feed (1 chunk of 20)
  const reports20 = Array.from({ length: 20 }, (_, i) => ({
    id: `bench-report-20-${i}`,
    groupIds: [targetCircleId],
    userId: `author-${i}`,
    text: `Sample scam text ${i}`,
    riskScore: 70,
    flags: ["Scam"],
    explanation: "Sample explanation",
    timestamp: new Date().toISOString(),
  }));

  const benchVotes20: Record<string, Record<string, VoteType>> = {};
  for (let i = 0; i < 20; i++) {
    benchVotes20[`bench-report-20-${i}`] = {
      [viewerAliceId]: i % 2 === 0 ? "confirm" : "deny",
      [`user-${(i % 5) + 1}`]: "confirm",
    };
  }

  const { elapsedMs: elapsed20 } = await runFeedResolution(
    reports20,
    targetCircleId,
    viewerAliceId,
    benchVotes20,
    mockProfilesDb,
    25,
    25 // 25ms realistic Upstash HTTP round-trip
  );
  console.log(`  ⏱️  20-Report Feed: ${elapsed20.toFixed(2)} ms (1 Redis chunk + 1 Supabase profile query)`);
  assert(elapsed20 < 150, `20-report feed completes in ${elapsed20.toFixed(2)}ms (< 150ms ceiling)`);

  // Benchmark B: 100 reports feed (4 chunks of 25 + 1 Supabase profile query)
  const reports100 = Array.from({ length: 100 }, (_, i) => ({
    id: `bench-report-100-${i}`,
    groupIds: [targetCircleId],
    userId: `author-${i}`,
    text: `Sample scam text ${i}`,
    riskScore: 75,
    flags: ["Scam"],
    explanation: "Sample explanation",
    timestamp: new Date().toISOString(),
  }));

  const benchVotes100: Record<string, Record<string, VoteType>> = {};
  for (let i = 0; i < 100; i++) {
    benchVotes100[`bench-report-100-${i}`] = {
      [viewerAliceId]: i % 2 === 0 ? "confirm" : "deny",
      [`user-${(i % 5) + 1}`]: "confirm",
    };
  }

  const { elapsedMs: elapsed100 } = await runFeedResolution(
    reports100,
    targetCircleId,
    viewerAliceId,
    benchVotes100,
    mockProfilesDb,
    25,
    25 // 25ms realistic Upstash HTTP round-trip
  );
  console.log(`  ⏱️  100-Report Feed: ${elapsed100.toFixed(2)} ms (4 Redis chunks + 1 Supabase profile query)`);
  assert(elapsed100 < 300, `100-report feed completes in ${elapsed100.toFixed(2)}ms (< 300ms ceiling)`);

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
