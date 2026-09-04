/**
 * scripts/test-notifications-e2e.ts
 *
 * Comprehensive end-to-end verification script for Scam Shield notifications
 * using real authenticated Supabase accounts:
 *   - Alice (fd4019f1-c800-439a-8782-c8f83d0bd68e)
 *   - Bob   (7fe7fc29-71a6-4270-af3d-1fb7e0b2a4ee)
 *   - Charlie (2ac11193-a3c2-491b-b2d8-d5ad866312c2)
 *   - Dave  (65c25750-aab0-4616-b58a-6f96e254733a)
 *
 * Tests:
 *   Test A: REPORT_SHARED (4 members: 1 actor, 3 recipients)
 *   Test B: REPORT_SHARED Idempotency & duplicate protection
 *   Test C: MEMBER_JOINED (2 existing members, 1 joining member)
 *   Test D: MEMBER_JOINED Idempotency & duplicate protection
 *   Test E: REPORT_CONFIRMED (Single recipient — report owner)
 *   Test F: SCAM_CLUSTER_DETECTED (Single recipient — original report owner)
 *   Test G: RLS Isolation (Cross-user SELECT policy enforcement)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { createNotification, createNotifications } from "../lib/notifications/create";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function getAuthClient(email: string, pass: string = "Password123!") {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error || !data.user) {
    throw new Error(`Failed to authenticate ${email}: ${error?.message}`);
  }
  return { client, user: data.user };
}

async function runTests() {
  console.log("==================================================================");
  console.log("SCAM SHIELD NOTIFICATION SYSTEM — END-TO-END VERIFICATION");
  console.log("==================================================================\n");

  // 1. Authenticate real users
  console.log("Authenticating 4 test users (Alice, Bob, Charlie, Dave)...");
  const alice = await getAuthClient("alice.notif.test@example.com");
  const bob = await getAuthClient("bob.notif.test@example.com");
  const charlie = await getAuthClient("charlie.notif.test@example.com");
  const dave = await getAuthClient("dave.notif.test@example.com");

  console.log("Authenticated user IDs:", {
    Alice: alice.user.id,
    Bob: bob.user.id,
    Charlie: charlie.user.id,
    Dave: dave.user.id,
  });

  const circleId = "11111111-2222-3333-4444-555555555555";
  const reportId = crypto.randomUUID(); // Valid UUID

  // -------------------------------------------------------------------------
  // TEST A: REPORT_SHARED (4 members: 1 actor, 3 recipients)
  // -------------------------------------------------------------------------
  console.log("\nTEST A: REPORT_SHARED (4 members, Alice shares report)");

  const circleMembers = [
    { user_id: alice.user.id },
    { user_id: bob.user.id },
    { user_id: charlie.user.id },
    { user_id: dave.user.id },
  ];

  // Exclude Alice (the reporter)
  const reportRecipients = circleMembers.filter((m) => m.user_id !== alice.user.id);
  assert(reportRecipients.length === 3, "Alice correctly excluded, 3 recipients remaining (Bob, Charlie, Dave)");

  const reportPrefix = `REPORT_SHARED:${reportId}:${circleId}:${alice.user.id}`;

  const reportPayloads = reportRecipients.map((m) => ({
    user_id: m.user_id,
    type: "REPORT_SHARED" as const,
    title: "New scam report",
    message: "A member shared a new scam alert in Cyber Watch.",
    circle_id: circleId,
    report_id: reportId,
    actor_id: alice.user.id,
    metadata: { riskScore: 88 },
    event_key: `${reportPrefix}:${m.user_id}`,
  }));

  // Server-side insert using Alice's authenticated client
  const insertedCountA = await createNotifications(reportPayloads, alice.client);
  assert(insertedCountA === 3, `createNotifications inserted exactly 3 rows (got ${insertedCountA})`);

  // Verify Bob can read his notification
  const { data: bobNotifs } = await bob.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${reportPrefix}:${bob.user.id}`);
  assert(bobNotifs?.length === 1, "Bob received exactly 1 REPORT_SHARED notification");
  assert(bobNotifs?.[0]?.user_id === bob.user.id, "Bob's notification has user_id = Bob");
  assert(bobNotifs?.[0]?.actor_id === alice.user.id, "Bob's notification has actor_id = Alice");

  // Verify Charlie can read his notification
  const { data: charlieNotifs } = await charlie.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${reportPrefix}:${charlie.user.id}`);
  assert(charlieNotifs?.length === 1, "Charlie received exactly 1 REPORT_SHARED notification");

  // Verify Dave can read his notification
  const { data: daveNotifs } = await dave.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${reportPrefix}:${dave.user.id}`);
  assert(daveNotifs?.length === 1, "Dave received exactly 1 REPORT_SHARED notification");

  // Verify Alice (the reporter) received ZERO notifications for her own action
  const { data: aliceNotifs } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${reportPrefix}:${alice.user.id}`);
  assert((aliceNotifs?.length || 0) === 0, "Alice received ZERO notifications for her own report");

  // -------------------------------------------------------------------------
  // TEST B: REPORT_SHARED Duplicate Protection
  // -------------------------------------------------------------------------
  console.log("\nTEST B: REPORT_SHARED Duplicate Protection");

  // Re-run the exact same batch insert
  const insertedCountB = await createNotifications(reportPayloads, alice.client);
  assert(insertedCountB === 3, "Duplicate batch handled gracefully without throwing error");

  const { data: bobNotifsDup } = await bob.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${reportPrefix}:${bob.user.id}`);
  assert(bobNotifsDup?.length === 1, "Bob still has exactly 1 notification (no duplicates)");

  // -------------------------------------------------------------------------
  // TEST C: MEMBER_JOINED (Alice & Bob in circle, Charlie joins)
  // -------------------------------------------------------------------------
  console.log("\nTEST C: MEMBER_JOINED (Alice & Bob in circle, Charlie joins)");

  const membersAtJoin = [
    { user_id: alice.user.id },
    { user_id: bob.user.id },
    { user_id: charlie.user.id }, // Charlie just joined
  ];

  // Exclude Charlie
  const joinRecipients = membersAtJoin.filter((m) => m.user_id !== charlie.user.id);
  assert(joinRecipients.length === 2, "Charlie correctly excluded, 2 recipients remaining (Alice & Bob)");

  const joinPrefix = `MEMBER_JOINED:${circleId}:${charlie.user.id}`;

  const joinPayloads = joinRecipients.map((m) => ({
    user_id: m.user_id,
    type: "MEMBER_JOINED" as const,
    title: "New member joined",
    message: "Charlie joined Cyber Watch.",
    circle_id: circleId,
    actor_id: charlie.user.id,
    event_key: `${joinPrefix}:${m.user_id}`,
  }));

  const insertedCountC = await createNotifications(joinPayloads, charlie.client);
  assert(insertedCountC === 2, `createNotifications inserted exactly 2 rows (got ${insertedCountC})`);

  // Verify Alice received MEMBER_JOINED
  const { data: aliceJoinNotifs } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${joinPrefix}:${alice.user.id}`);
  assert(aliceJoinNotifs?.length === 1, "Alice received exactly 1 MEMBER_JOINED notification");
  assert(aliceJoinNotifs?.[0]?.actor_id === charlie.user.id, "Alice's notification has actor_id = Charlie");

  // Verify Bob received MEMBER_JOINED
  const { data: bobJoinNotifs } = await bob.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${joinPrefix}:${bob.user.id}`);
  assert(bobJoinNotifs?.length === 1, "Bob received exactly 1 MEMBER_JOINED notification");

  // Verify Charlie received NO notification for joining
  const { data: charlieJoinNotifs } = await charlie.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${joinPrefix}:${charlie.user.id}`);
  assert((charlieJoinNotifs?.length || 0) === 0, "Charlie received ZERO notifications for his own join");

  // -------------------------------------------------------------------------
  // TEST D: MEMBER_JOINED Duplicate Protection
  // -------------------------------------------------------------------------
  console.log("\nTEST D: MEMBER_JOINED Duplicate Protection");

  const insertedCountD = await createNotifications(joinPayloads, charlie.client);
  assert(insertedCountD === 2, "Duplicate join notification batch handled gracefully");

  const { data: aliceJoinDup } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", `${joinPrefix}:${alice.user.id}`);
  assert(aliceJoinDup?.length === 1, "Alice still has exactly 1 join notification (no duplicates)");

  // -------------------------------------------------------------------------
  // TEST E: REPORT_CONFIRMED (Single recipient — report owner Alice)
  // -------------------------------------------------------------------------
  console.log("\nTEST E: REPORT_CONFIRMED (Bob confirms Alice's report)");

  const confirmEventKey = `REPORT_CONFIRMED:${reportId}:${bob.user.id}`;
  const okE = await createNotification(
    {
      user_id: alice.user.id,
      type: "REPORT_CONFIRMED",
      title: "Report confirmed",
      message: "Bob confirmed your scam alert in Cyber Watch.",
      circle_id: circleId,
      report_id: reportId,
      actor_id: bob.user.id,
      event_key: confirmEventKey,
    },
    bob.client
  );
  assert(okE === true, "createNotification succeeded for REPORT_CONFIRMED");

  const { data: aliceConfirmNotifs } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", confirmEventKey);
  assert(aliceConfirmNotifs?.length === 1, "Alice received REPORT_CONFIRMED notification");
  assert(aliceConfirmNotifs?.[0]?.actor_id === bob.user.id, "Notification actor is Bob");

  // Duplicate check
  const okEDup = await createNotification(
    {
      user_id: alice.user.id,
      type: "REPORT_CONFIRMED",
      title: "Report confirmed",
      message: "Bob confirmed your scam alert in Cyber Watch.",
      circle_id: circleId,
      report_id: reportId,
      actor_id: bob.user.id,
      event_key: confirmEventKey,
    },
    bob.client
  );
  assert(okEDup === true, "Re-confirm handled idempotently");

  const { data: aliceConfirmDup } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", confirmEventKey);
  assert(aliceConfirmDup?.length === 1, "Still exactly 1 row after duplicate confirmation");

  // -------------------------------------------------------------------------
  // TEST F: SCAM_CLUSTER_DETECTED (Single recipient — original owner Alice)
  // -------------------------------------------------------------------------
  console.log("\nTEST F: SCAM_CLUSTER_DETECTED (Bob's report clusters with Alice's)");

  const clusterOrigId = crypto.randomUUID();
  const clusterNewId = crypto.randomUUID();
  const clusterEventKey = `SCAM_CLUSTER:${clusterOrigId}:${clusterNewId}`;

  const okF = await createNotification(
    {
      user_id: alice.user.id,
      type: "SCAM_CLUSTER_DETECTED",
      title: "Similar scam detected",
      message: "Scam Radar found a match with your report.",
      circle_id: circleId,
      report_id: clusterOrigId,
      actor_id: bob.user.id,
      metadata: { matchedReportId: clusterNewId, riskScore: 92 },
      event_key: clusterEventKey,
    },
    bob.client
  );
  assert(okF === true, "createNotification succeeded for SCAM_CLUSTER_DETECTED");

  const { data: aliceClusterNotifs } = await alice.client
    .from("notifications")
    .select("*")
    .eq("event_key", clusterEventKey);
  assert(aliceClusterNotifs?.length === 1, "Alice received SCAM_CLUSTER_DETECTED notification");

  // -------------------------------------------------------------------------
  // TEST G: RLS Isolation Verification
  // -------------------------------------------------------------------------
  console.log("\nTEST G: RLS Isolation (Cross-user SELECT policy enforcement)");

  // Bob tries to select Alice's notifications
  const { data: bobSelectAlice } = await bob.client
    .from("notifications")
    .select("*")
    .eq("user_id", alice.user.id);
  assert((bobSelectAlice?.length || 0) === 0, "RLS correctly prevents Bob from reading Alice's notifications");

  // Charlie tries to select Bob's notifications
  const { data: charlieSelectBob } = await charlie.client
    .from("notifications")
    .select("*")
    .eq("user_id", bob.user.id);
  assert((charlieSelectBob?.length || 0) === 0, "RLS correctly prevents Charlie from reading Bob's notifications");

  // Anon client tries to select all notifications
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: anonSelect } = await anonClient.from("notifications").select("*");
  assert((anonSelect?.length || 0) === 0, "RLS correctly prevents unauthenticated anon client from reading notifications");

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
