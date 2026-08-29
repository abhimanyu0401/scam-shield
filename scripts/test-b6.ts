/**
 * scripts/test-b6.ts
 *
 * Test suite verifying all 44 test cases and assertions for Phase B6.
 */

import { createDeadlineTracker } from "../lib/ai/deadline";
import {
  runDeterministicAnalysis,
  createDeterministicFallbackEngine,
  type ScamCategory,
} from "../lib/ai/deterministic-engine";

let testCasesCount = 0;
let assertionsCount = 0;
let passedCount = 0;
let failedCount = 0;

function startTestCase(name: string) {
  testCasesCount++;
}

function assert(condition: boolean, testName: string, detail?: string): void {
  assertionsCount++;
  if (condition) {
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failedCount++;
  }
}

async function runTests(): Promise<void> {
  console.log("\n=======================================================");
  console.log("    Running Phase B6 Deterministic Deepening Tests     ");
  console.log("=======================================================\n");

  const dummyTracker = createDeadlineTracker(20_000);

  // Pre-loaded mockup patterns matching scam-patterns.json categories
  const mockPatterns = [
    { id: "digital-arrest", name: "Digital Arrest Scam", text: "CBI officer Aadhaar drug arrest", embedding: [0.1, 0.2, 0.3] },
    { id: "upi-refund", name: "Fake UPI Refund", text: "UPI PIN collect request refund", embedding: [0.4, 0.5, 0.6] },
  ];

  // -------------------------------------------------------------------------
  // Group A: Positive Scam Cases (English) - 10 cases (10 assertions)
  // -------------------------------------------------------------------------
  
  // 1
  startTestCase("B6-01: OTP credential theft");
  const res1 = await runDeterministicAnalysis(
    { text: "Please send me the OTP that just came on your phone immediately", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res1.riskScore >= 75 && Boolean(res1.detectedCategories?.includes("OTP_CREDENTIAL_THEFT")), "B6-01: OTP credential theft");

  // 2
  startTestCase("B6-02: Bank KYC link");
  const res2 = await runDeterministicAnalysis(
    { text: "KYC update pending. Click: http://bit.ly/sbi-kyc or account blocked today", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res2.riskScore >= 75 && Boolean(res2.detectedCategories?.includes("BANK_KYC_PHISHING")), "B6-02: Bank KYC link");

  // 3
  startTestCase("B6-03: Refund UPI collect");
  const res3 = await runDeterministicAnalysis(
    { text: "Your refund of Rs 4500 approved. Open GPay, enter PIN to approve collect request now", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res3.riskScore >= 80 && Boolean(res3.detectedCategories?.includes("UPI_PAYMENT_FRAUD")), "B6-03: Refund UPI collect");

  // 4
  startTestCase("B6-04: Digital arrest");
  const res4 = await runDeterministicAnalysis(
    { text: "CBI officer speaking. Your Aadhaar linked to drug case. Do not disconnect. Digital arrest.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res4.riskScore >= 85 && Boolean(res4.detectedCategories?.includes("DIGITAL_ARREST_POLICE")), "B6-04: Digital arrest");

  // 5
  startTestCase("B6-05: Utility disconnection");
  const res5 = await runDeterministicAnalysis(
    { text: "Electricity disconnected tonight 9pm. Call 9876543210 to pay. Last warning.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res5.riskScore >= 65 && Boolean(res5.detectedCategories?.includes("UTILITY_DISCONNECTION")), "B6-05: Utility disconnection");

  // 6
  startTestCase("B6-06: Task job offer");
  const res6 = await runDeterministicAnalysis(
    { text: "Work from home, earn Rs 5000 daily liking videos. Pay Rs 500 registration fee on Telegram", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res6.riskScore >= 65 && Boolean(res6.detectedCategories?.includes("JOB_RECRUITMENT")), "B6-06: Task job offer");

  // 7
  startTestCase("B6-07: Loan approval upfront fee");
  const res7 = await runDeterministicAnalysis(
    { text: "Loan of Rs 5 lakh approved at 0% PM scheme. Pay file charge Rs 2150 upfront refundable", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res7.riskScore >= 70 && Boolean(res7.detectedCategories?.includes("LOAN_FINANCIAL")), "B6-07: Loan approval upfront fee");

  // 8
  startTestCase("B6-08: Remote access AnyDesk");
  const res8 = await runDeterministicAnalysis(
    { text: "Download AnyDesk and share the 9-digit code with our technical executive to fix", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res8.riskScore >= 85 && Boolean(res8.detectedCategories?.includes("REMOTE_ACCESS")), "B6-08: Remote access AnyDesk");

  // 9
  startTestCase("B6-09: Video extortion threat");
  const res9 = await runDeterministicAnalysis(
    { text: "Pay Rs 50,000 within 10 minutes or I upload video to YouTube and send to your family", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res9.riskScore >= 80 && Boolean(res9.detectedCategories?.includes("EXTORTION_THREAT")), "B6-09: Video extortion threat");

  // 10
  startTestCase("B6-10: Investment 300% return");
  const res10 = await runDeterministicAnalysis(
    { text: "Guaranteed 300% return. Deposit ₹10,000 now to activate account.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(res10.riskScore >= 65 && Boolean(res10.detectedCategories?.includes("INVESTMENT_SCAM")), "B6-10: Investment 300% return");

  // -------------------------------------------------------------------------
  // Group B: Benign Cases - 6 cases (6 assertions)
  // -------------------------------------------------------------------------

  // 11
  startTestCase("B6-B01: Benign OTP delivery");
  const resB1 = await runDeterministicAnalysis(
    { text: "Your OTP is 482910. Do not share with anyone. Valid 5 min.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB1.riskScore <= 5, "B6-B01: Benign OTP delivery");

  // 12
  startTestCase("B6-B02: Legit Debit SMS");
  const resB2 = await runDeterministicAnalysis(
    { text: "SBI: ₹5000 debited from your account via UPI to Zomato.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB2.riskScore <= 5, "B6-B02: Legit Debit SMS");

  // 13
  startTestCase("B6-B03: Utility bill notification");
  const resB3 = await runDeterministicAnalysis(
    { text: "Your electricity bill for October: ₹1,450. Due by Dec 15.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB3.riskScore <= 5, "B6-B03: Utility bill notification");

  // 14
  startTestCase("B6-B04: Order delivered confirmation");
  const resB4 = await runDeterministicAnalysis(
    { text: "Your Amazon order #1234 shipped. Expected delivery: Dec 10.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB4.riskScore <= 5, "B6-B04: Order delivered confirmation");

  // 15
  startTestCase("B6-B05: Investment discussion");
  const resB5 = await runDeterministicAnalysis(
    { text: "Let's discuss investment options at 3pm meeting.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB5.riskScore <= 15, "B6-B05: Investment discussion");

  // 16
  startTestCase("B6-B06: Dinner pay GPay");
  const resB6 = await runDeterministicAnalysis(
    { text: "Hi, are you coming for dinner? I'll pay via GPay", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resB6.riskScore <= 15, "B6-B06: Dinner pay GPay");

  // -------------------------------------------------------------------------
  // Group C: Hindi Cases - 3 cases (3 assertions)
  // -------------------------------------------------------------------------

  // 17
  startTestCase("B6-H01: Hindi OTP Request");
  const resH1 = await runDeterministicAnalysis(
    { text: "तुरंत ओटीपी बताएं, खाता बंद हो जाएगा", sourceType: "text", language: "hi", languageLabel: "Hindi" },
    dummyTracker
  );
  assert(resH1.riskScore >= 75, "B6-H01: Hindi OTP Request");

  // 18
  startTestCase("B6-H02: Hindi Electricity Disconnect");
  const resH2 = await runDeterministicAnalysis(
    { text: "बिजली आज रात कट जाएगी। अभी कॉल करें: 9876543210", sourceType: "text", language: "hi", languageLabel: "Hindi" },
    dummyTracker
  );
  assert(resH2.riskScore >= 60, "B6-H02: Hindi Electricity Disconnect");

  // 19
  startTestCase("B6-H03: Hindi OTP Delivery");
  const resH3 = await runDeterministicAnalysis(
    { text: "आपका ओटीपी 482910 है। किसी को न बताएं।", sourceType: "text", language: "hi", languageLabel: "Hindi" },
    dummyTracker
  );
  assert(resH3.riskScore <= 5, "B6-H03: Hindi OTP Delivery");

  // -------------------------------------------------------------------------
  // Group D: Hinglish / Transliteration / Typo - 3 cases (3 assertions)
  // -------------------------------------------------------------------------

  // 20
  startTestCase("B6-HIN01: Hinglish OTP Phishing");
  const resHin1 = await runDeterministicAnalysis(
    { text: "OTP aaya hai, jaldi batao. Account band ho jayega", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resHin1.riskScore >= 75, "B6-HIN01: Hinglish OTP Phishing");

  // 21
  startTestCase("B6-T01: Hinglish Transliterated OTP");
  const resT1 = await runDeterministicAnalysis(
    { text: "Jaldi otp send karo", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resT1.riskScore >= 65, "B6-T01: Hinglish Transliterated OTP");

  // 22
  startTestCase("B6-A01: Adversarial Spelling Typo");
  const resA1 = await runDeterministicAnalysis(
    { text: "Plz snd me ur otpp immdiatly", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resA1.riskScore >= 55, "B6-A01: Adversarial Spelling Typo");

  // -------------------------------------------------------------------------
  // Group E: URL Semantics - 4 cases (4 assertions)
  // -------------------------------------------------------------------------

  // 23
  startTestCase("B6-L01: Legit URL alone");
  const resL1 = await runDeterministicAnalysis(
    { text: "Visit https://sbi.co.in", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resL1.riskScore <= 10, "B6-L01: Legit URL alone");

  // 24
  startTestCase("B6-L02: Suspicious shortened URL");
  const resL2 = await runDeterministicAnalysis(
    { text: "Verify KYC: http://bit.ly/sbi-kyc", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resL2.riskScore >= 40 && resL2.riskScore <= 75, "B6-L02: Suspicious shortened URL");

  // 25
  startTestCase("B6-L03: SB Positive Malicious URL");
  const resL3 = await runDeterministicAnalysis(
    { text: "Verify now: http://malicious.example", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    { safeBrowsingFn: async () => true }
  );
  assert(resL3.riskScore === 95, "B6-L03: SB Positive Malicious URL");

  // 26
  startTestCase("B6-L04: SB Clean Domain URL");
  const resL4 = await runDeterministicAnalysis(
    { text: "Visit our website: https://sbi.co.in", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    { safeBrowsingFn: async () => false }
  );
  assert(resL4.riskScore <= 5, "B6-L04: SB Clean Domain URL");

  // -------------------------------------------------------------------------
  // Group F: Degraded Contract - 3 cases (5 assertions)
  // -------------------------------------------------------------------------

  // 27
  startTestCase("B6-U01: Degraded analysisMode");
  const fallbackEngine = createDeterministicFallbackEngine();
  const engineRes = await fallbackEngine(
    { text: "CBI arrest immediately", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    { requestId: "req-123", timestamp: "", sourceType: "text", language: "en", modelsAttempted: [], modelSelected: "", attemptCount: 1, fallbackUsed: true, isDegraded: true, analysisMode: "degraded-deterministic", totalLatencyMs: 0, riskScore: 0, flagsCount: 0, status: "DEGRADED" } as any
  );
  assert(engineRes.analysisMode === "degraded-deterministic", "B6-U01: Degraded analysisMode");

  // 28
  startTestCase("B6-U02: Degraded results properties");
  assert(engineRes.complaintDraft === "" && engineRes.financialLossLikely === false, "B6-U02: Degraded properties blank/false");

  // 29
  startTestCase("B6-U03: Degraded fallback identity flags");
  assert(engineRes.isDegraded === true && engineRes.isFallback === true, "B6-U03: Degraded identity flags");

  // -------------------------------------------------------------------------
  // Group G: Deadline / Unavailability - 3 cases (3 assertions)
  // -------------------------------------------------------------------------

  // 30
  startTestCase("B6-D01: No SB call on low budget");
  const lowTracker = createDeadlineTracker(100); // 100ms total budget -> under MIN_REMAINING_MS_TO_ATTEMPT (250ms)
  let sbAttempted = false;
  await runDeterministicAnalysis(
    { text: "Verify http://bit.ly/sbi-kyc", sourceType: "text", language: "en", languageLabel: "English" },
    lowTracker,
    { safeBrowsingFn: async () => { sbAttempted = true; return true; } }
  );
  assert(sbAttempted === false, "B6-D01: No SB call on low budget");

  // 31
  startTestCase("B6-D02: SB mock error fallback");
  const resD2 = await runDeterministicAnalysis(
    { text: "Verify http://bit.ly/sbi-kyc", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    { safeBrowsingFn: async () => { throw new Error("API Limit"); } }
  );
  assert(resD2.riskScore >= 40 && resD2.riskScore <= 75, "B6-D02: SB mock error fallback");

  // 32
  startTestCase("B6-D03: embedFn mock error fallback");
  const resD3 = await runDeterministicAnalysis(
    { text: "Send me the OTP immediately", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    { embedFn: async () => { throw new Error("Embed timeout"); }, patterns: mockPatterns }
  );
  assert(resD3.riskScore >= 75, "B6-D03: embedFn mock error fallback");

  // -------------------------------------------------------------------------
  // Group H: Stage 1 Regressions - 5 cases (9 assertions)
  // -------------------------------------------------------------------------

  // 33
  startTestCase("B6-R01: TC-01 OTP takeover");
  const resR1 = await runDeterministicAnalysis(
    { text: "Hello, can you please send me the 6-digit verification code sent to your phone immediately? I accidentally entered your number.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resR1.riskScore >= 75, "B6-R01 TC-01 risk >= 75");
  assert(Boolean(resR1.detectedCategories?.includes("OTP_CREDENTIAL_THEFT")), "B6-R01 TC-01 category");

  // 34
  startTestCase("B6-R02: TC-03 Electricity disconnect");
  const resR2 = await runDeterministicAnalysis(
    { text: "Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM from the electricity office because your previous month bill was not updated. Please immediately contact our electricity officer on 9876543210 to update your bill.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resR2.riskScore >= 65, "B6-R02 TC-03 risk >= 65");
  assert(Boolean(resR2.detectedCategories?.includes("UTILITY_DISCONNECTION")), "B6-R02 TC-03 category");

  // 35
  startTestCase("B6-R03: TC-05 KYC Phishing");
  const resR3 = await runDeterministicAnalysis(
    { text: "Dear SBI/HDFC Customer, your bank account will be blocked today due to pending PAN-Aadhaar KYC update. Click the link below to verify your details immediately: http://bit.ly/fake-bank-link", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resR3.riskScore >= 75, "B6-R03 TC-05 risk >= 75");
  assert(Boolean(resR3.detectedCategories?.includes("BANK_KYC_PHISHING")), "B6-R03 TC-05 category");

  // 36
  startTestCase("B6-R04: TC-16 Hinglish digital arrest");
  const resR4 = await runDeterministicAnalysis(
    { text: "Aapka Aadhaar card drug smuggling case me paya gaya hai. CBI officer bol raha hoon. Video call se disconnect mat karna warna digital arrest hogi.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resR4.riskScore >= 80, "B6-R04 TC-16 risk >= 80");
  assert(Boolean(resR4.detectedCategories?.includes("DIGITAL_ARREST_POLICE")), "B6-R04 TC-16 category");

  // 37
  startTestCase("B6-R05: TC-22 Benign family conversation");
  const resR5 = await runDeterministicAnalysis(
    { text: "Hey Mom, did you receive the packet I sent? Let me know once you get it. Love you.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resR5.riskScore <= 15, "B6-R05 TC-22 risk <= 15");

  // -------------------------------------------------------------------------
  // Group I: Contrastive Pairs (Scam Versions) - 4 cases (4 assertions)
  // -------------------------------------------------------------------------

  // 38
  startTestCase("B6-C01: UPI refund collect scam");
  const resC1 = await runDeterministicAnalysis(
    { text: "Refund ₹5000. Enter your UPI PIN to receive it.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resC1.riskScore >= 75, "B6-C01 UPI refund scam");

  // 39
  startTestCase("B6-C02: Electricity cut threat scam");
  const resC2 = await runDeterministicAnalysis(
    { text: "Electricity will be disconnected tonight. Call this number.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resC2.riskScore >= 65, "B6-C02 Electricity disconnect scam");

  // 40
  startTestCase("B6-C03: Digital arrest threat scam");
  const resC3 = await runDeterministicAnalysis(
    { text: "CBI officer. You are under digital arrest.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resC3.riskScore >= 80, "B6-C03 Digital arrest scam");

  // 41
  startTestCase("B6-C04: Remote AnyDesk share scam");
  const resC4 = await runDeterministicAnalysis(
    { text: "Download AnyDesk and share the 9-digit code with our technical executive to fix", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resC4.riskScore >= 85, "B6-C04 Remote access AnyDesk scam");

  // -------------------------------------------------------------------------
  // Group J: Precedence & Embedding - 3 cases (4 assertions)
  // -------------------------------------------------------------------------

  // 42
  startTestCase("B6-P01: Precedence demand > suppressor");
  const resP1 = await runDeterministicAnalysis(
    { text: "Do not share this OTP with anyone else. Send it to me immediately.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resP1.riskScore >= 75, "B6-P01: Suppressor vs demand risk >= 75");
  assert(Boolean(resP1.detectedCategories?.includes("OTP_CREDENTIAL_THEFT")), "B6-P01: Suppressor vs demand category");

  // 43
  startTestCase("B6-E01: Embedding conditionality benign text");
  const resE1 = await runDeterministicAnalysis(
    { text: "This is a legitimate conversation that has some similar embedding properties.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker,
    {
      embedFn: async () => [0.1, 0.2, 0.3], // highly matches digital-arrest mock pattern
      patterns: mockPatterns
    }
  );
  assert(resE1.riskScore <= 20, "B6-E01: Embedding similarity benign check");

  // 44
  startTestCase("B6-C05: Investment 300% return demand");
  const resC5 = await runDeterministicAnalysis(
    { text: "Guaranteed 300% return. Deposit now.", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resC5.riskScore >= 65, "B6-C05: Investment 300% return demand");

  // -------------------------------------------------------------------------
  // TEST A: Ordinary URL must not create a scam signal
  // -------------------------------------------------------------------------

  // 45
  startTestCase("B6-TA01: Legit URL — no scam category, score <= 10");
  const resTA1 = await runDeterministicAnalysis(
    { text: "Visit https://sbi.co.in", sourceType: "text", language: "en", languageLabel: "English" },
    dummyTracker
  );
  assert(resTA1.riskScore <= 10, "B6-TA01: riskScore <= 10 for plain URL");
  assert(
    !Boolean(resTA1.detectedCategories?.includes("SUSPICIOUS_LINK")),
    "B6-TA01: SUSPICIOUS_LINK not present"
  );
  // No scam category — detectedCategories must be empty or contain only BENIGN
  const hasSpuriousScamCategory = (resTA1.detectedCategories ?? []).some(
    (c) => c !== "BENIGN" && c !== "SUSPICIOUS_LINK"
  );
  assert(!hasSpuriousScamCategory, "B6-TA01: no spurious scam category from plain URL");

  // -------------------------------------------------------------------------
  // TEST B: Embedding similarity > 0.85 when baseScore < 25
  //         — no riskScore increase, no BENIGN pollution in detectedCategories
  // -------------------------------------------------------------------------

  // 46
  startTestCase("B6-TB01: Embedding not applied when baseScore < 25");
  // Benign text → baseScore will be 0 (<25). embedFn returns a vector that matches
  // the mock pattern at >0.85 cosine similarity.
  const benignEmbedding = [0.1, 0.2, 0.3]; // exact match with digital-arrest mock pattern
  const resTB1Before = await runDeterministicAnalysis(
    { text: "This is a completely harmless message with no scam keywords at all.", sourceType: "text", language: "en", languageLabel: "English" },
    createDeadlineTracker(20_000)
  );
  const resTB1 = await runDeterministicAnalysis(
    { text: "This is a completely harmless message with no scam keywords at all.", sourceType: "text", language: "en", languageLabel: "English" },
    createDeadlineTracker(20_000),
    {
      embedFn: async () => benignEmbedding, // sim = 1.0 with [0.1,0.2,0.3] mock pattern
      patterns: mockPatterns
    }
  );
  // Score must not increase when baseScore < 25
  assert(resTB1.riskScore === resTB1Before.riskScore, "B6-TB01: embedding does not boost score when baseScore < 25");
  // BENIGN must NOT appear in detectedCategories as a result of embedding match
  // (detectedCategories should be empty for a genuinely benign message)
  assert(
    !(resTB1.detectedCategories ?? []).includes("BENIGN"),
    "B6-TB01: BENIGN not falsely added to detectedCategories by embedding"
  );
  // matchedPattern should still be populated (> 0.7 sim) regardless of baseScore
  assert(resTB1.matchedPattern === "Digital Arrest Scam", "B6-TB01: matchedPattern populated for sim > 0.7");

  // -------------------------------------------------------------------------
  // TEST C: Embedding similarity > 0.85 when baseScore >= 25
  //         — +10 adjustment, matchedPattern set, no false BENIGN in detectedCategories
  // -------------------------------------------------------------------------

  // 47
  startTestCase("B6-TC01: Embedding +10 boost applies when baseScore >= 25");
  // A scam message with baseScore >= 25. Use a message that produces a MODERATE
  // OTP signal (score 30) so baseScore = 30 >= 25, making the embedding eligible.
  const scamEmbedding = [0.1, 0.2, 0.3]; // sim = 1.0 with digital-arrest mock pattern
  const resTC1Without = await runDeterministicAnalysis(
    { text: "Please verify your otp for account update.", sourceType: "text", language: "en", languageLabel: "English" },
    createDeadlineTracker(20_000)
  );
  const resTC1With = await runDeterministicAnalysis(
    { text: "Please verify your otp for account update.", sourceType: "text", language: "en", languageLabel: "English" },
    createDeadlineTracker(20_000),
    {
      embedFn: async () => scamEmbedding,
      patterns: mockPatterns
    }
  );
  // +10 adjustment must have been applied
  assert(resTC1With.riskScore === resTC1Without.riskScore + 10, "B6-TC01: +10 embedding adjustment applied when baseScore >= 25");
  // matchedPattern must be populated
  assert(resTC1With.matchedPattern === "Digital Arrest Scam", "B6-TC01: matchedPattern populated");
  // BENIGN must NOT appear in detectedCategories from embedding — the engine has no category
  // field on ScamPatternEmbedding so it must never inject a fake BENIGN entry
  assert(
    !(resTC1With.detectedCategories ?? []).includes("BENIGN"),
    "B6-TC01: BENIGN not injected into detectedCategories by embedding match"
  );

  // Print Summary
  console.log("\n=======================================================");
  console.log(`Executed ${testCasesCount} test cases with ${assertionsCount} assertions.`);
  console.log(`Passed: ${passedCount}, Failed: ${failedCount}`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
