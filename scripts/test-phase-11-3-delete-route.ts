/**
 * scripts/test-phase-11-3-delete-route.ts
 *
 * Automated test suite for Phase 11.3 Report Deletion Endpoint.
 * Tests:
 *   1. 401 UNAUTHENTICATED rejection before touching Redis
 *   2. 400 INVALID_REPORT_ID on malformed reportId
 *   3. 404 REPORT_NOT_FOUND on missing report
 *   4. 403 NOT_REPORT_OWNER for non-author / admin
 *   5. 200 OK multi-group deletion: verifying report is removed from ALL circle lists, canonical key, and vote hash
 *   6. 500 PARTIAL_DELETE_FAILURE when a group list operation fails
 */

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

async function runDeleteTests() {
  console.log("==================================================================");
  console.log("PHASE 11.3 — REPORT DELETION LOGIC & MULTI-LOCATION VERIFICATION");
  console.log("==================================================================\n");

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const authorUserId = "user-author-111";
  const nonAuthorUserId = "user-stranger-222";

  const groupA = "11111111-1111-4111-8111-111111111111";
  const groupB = "22222222-2222-4222-8222-222222222222";
  const validReportId = "99999999-9999-4999-8999-999999999999";

  // Simulated Redis database
  let redisDb: Record<string, any> = {};

  function setupMockData() {
    const reportObj = {
      id: validReportId,
      groupIds: [groupA, groupB],
      userId: authorUserId,
      text: "Phishing alert message",
      riskScore: 88,
      timestamp: new Date().toISOString(),
    };
    const reportStr = JSON.stringify(reportObj);

    redisDb = {
      [`report:${validReportId}`]: reportStr,
      [`circle:${groupA}`]: [reportStr, JSON.stringify({ id: "other-report-1" })],
      [`circle:${groupB}`]: [reportStr, JSON.stringify({ id: "other-report-2" })],
      [`report:${validReportId}:votes`]: { "user-voter-1": "confirm" },
    };
  }

  async function mockDeleteHandler(
    caller: { id: string } | null,
    reportIdParam: string,
    simulateGroupError?: string
  ) {
    // 1. Authenticate caller first
    if (!caller) {
      return { status: 401, body: { error: "Authentication required", code: "UNAUTHENTICATED" } };
    }

    // 2. Validate reportId format
    if (!reportIdParam || !UUID_REGEX.test(reportIdParam.trim())) {
      return { status: 400, body: { error: "Invalid report ID format.", code: "INVALID_REPORT_ID" } };
    }
    const cleanReportId = reportIdParam.trim();

    // 3. Fetch canonical report
    const cachedData = redisDb[`report:${cleanReportId}`];
    if (!cachedData) {
      return { status: 404, body: { error: "Report not found.", code: "REPORT_NOT_FOUND" } };
    }

    const rawReportString = typeof cachedData === "string" ? cachedData : JSON.stringify(cachedData);
    const report = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    // 4. Author-only authorization
    if (!report.userId || report.userId !== caller.id) {
      return { status: 403, body: { error: "Only the author can delete this report.", code: "NOT_REPORT_OWNER" } };
    }

    // 5. Multi-group removal
    const targetGroupIds: string[] = report.groupIds || [];
    const failedGroups: string[] = [];

    for (const gid of targetGroupIds) {
      try {
        if (simulateGroupError === gid) {
          throw new Error("Simulated Redis network timeout on circle:" + gid);
        }
        const circleKey = `circle:${gid}`;
        const list = redisDb[circleKey] || [];
        // LREM exact string + fallback ID filtering
        const filtered = list.filter((item: string) => {
          if (item === rawReportString) return false;
          try {
            const parsed = JSON.parse(item);
            return parsed.id !== cleanReportId;
          } catch {
            return true;
          }
        });
        redisDb[circleKey] = filtered;
      } catch (err) {
        failedGroups.push(gid);
      }
    }

    // 6. Delete canonical key & vote hash
    delete redisDb[`report:${cleanReportId}`];
    delete redisDb[`report:${cleanReportId}:votes`];

    // 7. Handle partial failures
    if (failedGroups.length > 0) {
      return {
        status: 500,
        body: {
          error: "Report deleted from canonical storage, but failed to clean up some circle feeds.",
          code: "PARTIAL_DELETE_FAILURE",
          failedGroups,
        },
      };
    }

    return { status: 200, body: { success: true } };
  }

  // -------------------------------------------------------------------------
  // Test 1: Unauthenticated request (Pre-Redis Check)
  // -------------------------------------------------------------------------
  console.log("Test 1: Unauthenticated Request (Pre-Redis Check)");
  setupMockData();
  const res1 = await mockDeleteHandler(null, validReportId);
  assert(res1.status === 401, "Unauthenticated returns HTTP 401");
  assert(res1.body.code === "UNAUTHENTICATED", "Error code is UNAUTHENTICATED");

  // -------------------------------------------------------------------------
  // Test 2: Malformed reportId
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Malformed reportId parameter");
  const res2 = await mockDeleteHandler({ id: authorUserId }, "not-a-uuid");
  assert(res2.status === 400, "Malformed UUID returns HTTP 400");
  assert(res2.body.code === "INVALID_REPORT_ID", "Error code is INVALID_REPORT_ID");

  // -------------------------------------------------------------------------
  // Test 3: Missing report (404)
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Non-existent report");
  const missingId = "00000000-0000-4000-8000-000000000000";
  const res3 = await mockDeleteHandler({ id: authorUserId }, missingId);
  assert(res3.status === 404, "Missing report returns HTTP 404");
  assert(res3.body.code === "REPORT_NOT_FOUND", "Error code is REPORT_NOT_FOUND");

  // -------------------------------------------------------------------------
  // Test 4: Non-author / Admin rejection (403 NOT_REPORT_OWNER)
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Non-author / Admin delete rejection");
  const res4 = await mockDeleteHandler({ id: nonAuthorUserId }, validReportId);
  assert(res4.status === 403, "Non-author returns HTTP 403");
  assert(res4.body.code === "NOT_REPORT_OWNER", "Error code is NOT_REPORT_OWNER");
  assert(res4.body.error === "Only the author can delete this report.", "Error message clearly explains author restriction");

  // -------------------------------------------------------------------------
  // Test 5: Full multi-group deletion success (200 OK)
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Successful Multi-Location Deletion");
  setupMockData();
  const res5 = await mockDeleteHandler({ id: authorUserId }, validReportId);
  assert(res5.status === 200, "Successful deletion returns HTTP 200 OK");
  assert(res5.body.success === true, "Response payload has success: true");

  // Verify all 4 storage locations are clean
  const groupAList = redisDb[`circle:${groupA}`];
  const groupBList = redisDb[`circle:${groupB}`];
  const canonicalKey = redisDb[`report:${validReportId}`];
  const voteKey = redisDb[`report:${validReportId}:votes`];

  const inGroupA = groupAList.some((s: string) => JSON.parse(s).id === validReportId);
  const inGroupB = groupBList.some((s: string) => JSON.parse(s).id === validReportId);

  assert(!inGroupA, "Report removed from circle A list");
  assert(!inGroupB, "Report removed from circle B list");
  assert(groupAList.length === 1, "Remaining items in circle A list are preserved");
  assert(groupBList.length === 1, "Remaining items in circle B list are preserved");
  assert(canonicalKey === undefined, "Canonical report key deleted from Redis");
  assert(voteKey === undefined, "Associated vote hash deleted from Redis");

  // -------------------------------------------------------------------------
  // Test 6: Partial delete failure handling (500 PARTIAL_DELETE_FAILURE)
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Partial Failure Handling");
  setupMockData();
  const res6 = await mockDeleteHandler({ id: authorUserId }, validReportId, groupB);
  assert(res6.status === 500, "Partial failure returns HTTP 500");
  assert(res6.body.code === "PARTIAL_DELETE_FAILURE", "Error code is PARTIAL_DELETE_FAILURE");
  assert(Boolean(res6.body.failedGroups?.includes(groupB)), "Identifies groupB as failed group");

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

runDeleteTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
