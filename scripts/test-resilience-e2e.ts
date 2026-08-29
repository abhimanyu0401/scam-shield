/**
 * scripts/test-resilience-e2e.ts
 *
 * Phase B10 Localhost Production-Path Resilience Verification Suite.
 *
 * Scope & Seam Disambiguation:
 * ----------------------------
 * 1. REAL POST /api/check Route E2E Tests (Tests 1, 2, 4, 7):
 *    - Exercise the full production Next.js POST handler in app/api/check/route.ts.
 *    - Use provider singleton stubs (geminiProvider, groqProvider) and Safe Browsing seam.
 *
 * 2. Router-Level Integration Tests (Tests 3, 5, 6):
 *    - Exercise routeScamAnalysis() directly with injected quotaManager and circuitBreaker mocks.
 *    - Rationale: Production POST /api/check currently instantiates fallbackEngine and tracker,
 *      but does NOT expose a route-level quotaManager seam. Per prompt instructions, we do NOT
 *      modify production code to add a seam. These tests are explicitly labeled as
 *      Router-Level Integration.
 */

import { POST, _safeBrowsingTestSeam } from "../app/api/check/route";
import { NextRequest } from "next/server";
import { ServerError, QuotaExhaustedError } from "../lib/ai/errors";
import { geminiProvider } from "../lib/ai/providers/gemini";
import { groqProvider } from "../lib/ai/providers/groq";
import { createDeadlineTracker } from "../lib/ai/deadline";
import { routeScamAnalysis } from "../lib/ai/router";

let testCasesCount = 0;
let assertionsCount = 0;
let passedCount = 0;
let failedCount = 0;

function startTestCase(name: string): void {
  testCasesCount++;
  console.log("\n-------------------------------------------------------");
  console.log("Test Case " + testCasesCount + ": " + name);
  console.log("-------------------------------------------------------");
}

function assert(condition: boolean, label: string, detail?: string): void {
  assertionsCount++;
  if (condition) {
    passedCount++;
    console.log("  [PASS] " + label);
  } else {
    failedCount++;
    const suffix = detail ? " (" + detail + ")" : "";
    console.error("  [FAIL] " + label + suffix);
  }
}

function makeRequest(text: string = "Your account is blocked. Update KYC immediately: https://sbi-phish.com/login"): NextRequest {
  return new NextRequest("http://localhost:3000/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: "en" }),
  });
}

async function runResilienceTests(): Promise<void> {
  console.log("=======================================================");
  console.log("   Phase B10 Localhost Production-Path Resilience     ");
  console.log("=======================================================");

  // Save originals
  const origGeminiAnalyze = geminiProvider.callScamAnalysis;
  const origGroqAnalyze = groqProvider.callScamAnalysis;
  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origGroqKey = process.env.GROQ_API_KEY;
  const origRedisUrl = process.env.REDIS_KV_REST_API_URL;
  const origRedisToken = process.env.REDIS_KV_REST_API_TOKEN;

  // Set mock API keys for testing candidate traversal
  process.env.GEMINI_API_KEY = "mock-gemini-resilience-key";
  process.env.GROQ_API_KEY = "mock-groq-resilience-key";
  process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
  process.env.REDIS_KV_REST_API_TOKEN = "mock-token";

  try {
    // -------------------------------------------------------------------------
    // TEST 1 — NORMAL AI SUCCESS (REAL POST /api/check HTTP Route)
    // -------------------------------------------------------------------------
    startTestCase("TEST 1 — Normal AI Success Path [REAL HTTP ROUTE E2E]");

    geminiProvider.callScamAnalysis = async (modelId) => {
      if (modelId === "gemini-3.5-flash-lite") {
        return {
          riskScore: 85,
          flags: ["Urgent action required", "Bank KYC link"],
          explanation: "Message demands immediate bank KYC update.",
          financialLossLikely: false,
          complaintDraft: "Suspected Scam Type: Bank KYC Fraud",
        };
      }
      throw new Error("Unexpected model called: " + modelId);
    };

    const res1 = await POST(makeRequest());
    const json1 = await res1.json();

    assert(res1.status === 200, "Test 1: HTTP 200 status code returned");
    assert(json1.analysisMode === "ai", "Test 1: analysisMode is 'ai'");
    assert(json1.isFallback === false, "Test 1: isFallback is false for primary model");
    assert(json1.isDegraded === false, "Test 1: isDegraded is false for normal AI success");
    assert(json1.providerId === "gemini", "Test 1: providerId is 'gemini'");
    assert(json1.modelId === "gemini-3.5-flash-lite", "Test 1: modelId is 'gemini-3.5-flash-lite'");

    // -------------------------------------------------------------------------
    // TEST 2 — PRIMARY MODEL FAILURE -> NEXT MODEL (REAL POST /api/check HTTP Route)
    // -------------------------------------------------------------------------
    startTestCase("TEST 2 — Primary Model Failure -> Next Model [REAL HTTP ROUTE E2E]");

    let attemptedModels2: string[] = [];

    geminiProvider.callScamAnalysis = async (modelId) => {
      attemptedModels2.push(modelId);
      if (modelId === "gemini-3.5-flash-lite") {
        throw new ServerError(modelId, "gemini", 500, "Primary model 500 internal error");
      }
      if (modelId === "gemini-3.5-flash") {
        return {
          riskScore: 85,
          flags: ["Urgent action required"],
          explanation: "Secondary Gemini model analyzed message.",
          financialLossLikely: false,
          complaintDraft: "",
        };
      }
      throw new Error("Unexpected model called: " + modelId);
    };

    const res2 = await POST(makeRequest());
    const json2 = await res2.json();

    assert(res2.status === 200, "Test 2: HTTP 200 status code returned");
    assert(attemptedModels2.includes("gemini-3.5-flash-lite"), "Test 2: Primary model gemini-3.5-flash-lite was attempted");
    assert(attemptedModels2.includes("gemini-3.5-flash"), "Test 2: Secondary model gemini-3.5-flash was attempted after primary failed");
    assert(json2.modelId === "gemini-3.5-flash", "Test 2: Final modelId is 'gemini-3.5-flash'");
    assert(json2.analysisMode === "ai", "Test 2: analysisMode is 'ai'");
    assert(json2.isFallback === true, "Test 2: isFallback is true on secondary model");
    assert(json2.isDegraded === false, "Test 2: isDegraded is false when secondary model succeeds");

    // -------------------------------------------------------------------------
    // TEST 3 — QUOTA EXHAUSTION -> NEXT MODEL [ROUTER-LEVEL INTEGRATION]
    // -------------------------------------------------------------------------
    startTestCase("TEST 3 — Quota Exhaustion -> Next Model [ROUTER-LEVEL INTEGRATION]");

    let circuitFailuresRecorded3: string[] = [];
    let modelsAttempted3: string[] = [];

    const mockQuota3 = {
      tryReserveQuota: async (model: any) => {
        if (model.modelId === "gemini-3.5-flash-lite") {
          throw new QuotaExhaustedError(model.modelId, model.provider, "rpm");
        }
        return "ALLOWED" as const;
      },
    };

    const mockCircuit3 = {
      canAttempt: async () => "proceed" as const,
      recordSuccess: async () => {},
      recordFailure: async (modelId: string) => {
        circuitFailuresRecorded3.push(modelId);
      },
      revertHalfOpen: async () => {},
    };

    geminiProvider.callScamAnalysis = async (modelId) => {
      modelsAttempted3.push(modelId);
      return {
        riskScore: 80,
        flags: ["KYC link"],
        explanation: "Analyzed by gemini-3.5-flash after primary quota exhausted.",
        financialLossLikely: false,
        complaintDraft: "",
      };
    };

    const tracker3 = createDeadlineTracker(20000);
    const result3 = await routeScamAnalysis(
      { text: "Bank KYC blocked: https://phish.example.com", sourceType: "text", language: "en", languageLabel: "English" },
      {
        deadlineTracker: tracker3,
        quotaManager: mockQuota3,
        circuitBreaker: mockCircuit3,
      }
    );

    assert(!modelsAttempted3.includes("gemini-3.5-flash-lite"), "Test 3: Primary model gemini-3.5-flash-lite skipped before call");
    assert(modelsAttempted3.includes("gemini-3.5-flash"), "Test 3: Second model gemini-3.5-flash dispatched successfully");
    assert(result3.modelId === "gemini-3.5-flash", "Test 3: Selected model is 'gemini-3.5-flash'");
    assert(!circuitFailuresRecorded3.includes("gemini-3.5-flash-lite"), "Test 3: QuotaExhaustedError did NOT record circuit failure");

    // -------------------------------------------------------------------------
    // TEST 4 — ALL AI PROVIDERS FAIL -> DETERMINISTIC FALLBACK (REAL POST /api/check HTTP Route)
    // -------------------------------------------------------------------------
    startTestCase("TEST 4 — All AI Providers Fail -> Deterministic Fallback [REAL HTTP ROUTE E2E]");

    geminiProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "gemini", 500, "Gemini 500 Server Error");
    };
    groqProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "groq", 500, "Groq 500 Server Error");
    };

    const res4 = await POST(makeRequest("CBI officer speaking. Do not disconnect. Digital arrest in progress."));
    const json4 = await res4.json();

    assert(res4.status === 200, "Test 4: HTTP 200 returned when all AI providers fail");
    assert(json4.analysisMode === "degraded-deterministic", "Test 4: analysisMode is 'degraded-deterministic'");
    assert(json4.isFallback === true, "Test 4: isFallback is true");
    assert(json4.isDegraded === true, "Test 4: isDegraded is true");
    assert(json4.providerId === "deterministic", "Test 4: providerId is 'deterministic'");
    assert(json4.modelId === "deterministic-fallback", "Test 4: modelId is 'deterministic-fallback'");
    assert(json4.complaintDraft === "", "Test 4: complaintDraft is empty string in degraded mode");
    assert(json4.financialLossLikely === false, "Test 4: financialLossLikely is false in degraded mode");
    assert(json4.riskScore >= 75, "Test 4: Calibrated digital arrest riskScore >= 75", "got " + json4.riskScore);
    assert(typeof json4.explanation === "string" && json4.explanation.length > 0, "Test 4: Explanation populated with rule disclaimer");

    // -------------------------------------------------------------------------
    // TEST 5 — QUOTA ISOLATION [ROUTER-LEVEL INTEGRATION]
    // -------------------------------------------------------------------------
    startTestCase("TEST 5 — Quota Isolation (Zero Circuit Failures) [ROUTER-LEVEL INTEGRATION]");

    let circuitFailures5Count = 0;
    const mockQuota5 = {
      tryReserveQuota: async (model: any) => {
        if (model.modelId === "gemini-3.5-flash-lite") {
          throw new QuotaExhaustedError(model.modelId, model.provider, "rpm");
        }
        return "ALLOWED" as const;
      },
    };

    const mockCircuit5 = {
      canAttempt: async () => "proceed" as const,
      recordSuccess: async () => {},
      recordFailure: async () => {
        circuitFailures5Count++;
      },
      revertHalfOpen: async () => {},
    };

    geminiProvider.callScamAnalysis = async (modelId) => {
      return {
        riskScore: 75,
        flags: ["Urgent link"],
        explanation: "Success on secondary model.",
        financialLossLikely: false,
        complaintDraft: "",
      };
    };

    const tracker5 = createDeadlineTracker(20000);
    const result5 = await routeScamAnalysis(
      { text: "Check account status", sourceType: "text", language: "en", languageLabel: "English" },
      {
        deadlineTracker: tracker5,
        quotaManager: mockQuota5,
        circuitBreaker: mockCircuit5,
      }
    );

    assert(circuitFailures5Count === 0, "Test 5: Zero circuit failures recorded for quota-exhausted model");
    assert(result5.modelId === "gemini-3.5-flash", "Test 5: Router continued to next model gemini-3.5-flash");

    // -------------------------------------------------------------------------
    // TEST 6 — DEADLINE EXHAUSTION [DEADLINE PROPAGATION VERIFIED (SHORTENED BUDGET)]
    // -------------------------------------------------------------------------
    startTestCase("TEST 6 — Deadline Propagation & Guard [SHORTENED BUDGET VERIFICATION]");

    const deadlineTracker6 = createDeadlineTracker(1000); // 1000ms shortened budget for test speed
    let attemptsCount6 = 0;

    geminiProvider.callScamAnalysis = async (modelId) => {
      attemptsCount6++;
      await new Promise((r) => setTimeout(r, 400));
      throw new ServerError(modelId, "gemini", 500, "Slow provider failure");
    };

    groqProvider.callScamAnalysis = async (modelId) => {
      attemptsCount6++;
      await new Promise((r) => setTimeout(r, 400));
      throw new ServerError(modelId, "groq", 500, "Slow provider failure");
    };

    const startMs6 = Date.now();
    const result6 = await routeScamAnalysis(
      { text: "Urgent security update required", sourceType: "text", language: "en", languageLabel: "English" },
      { deadlineTracker: deadlineTracker6 }
    );
    const elapsedMs6 = Date.now() - startMs6;

    assert(result6.analysisMode === "degraded-deterministic", "Test 6: Degraded deterministic fallback reached");
    assert(elapsedMs6 <= 1150, "Test 6: Execution stopped within budget", "took " + elapsedMs6 + "ms, budget 1000ms");
    assert(deadlineTracker6.remainingMs() <= 250, "Test 6: Remaining deadline tracked <= MIN_REMAINING_MS_TO_ATTEMPT threshold (250ms)");
    console.log("  [NOTE] Verified deadline budget propagation & 250ms guard. (Tested with 1000ms test budget)");

    // -------------------------------------------------------------------------
    // TEST 7 — REDIS FAIL-OPEN (REAL POST /api/check HTTP Route)
    // -------------------------------------------------------------------------
    startTestCase("TEST 7 — Redis Failure Fail-Open [REAL HTTP ROUTE E2E]");

    process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
    process.env.REDIS_KV_REST_API_TOKEN = "invalid-token";

    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 40,
      flags: [],
      explanation: "Normal analysis despite Redis outage.",
      financialLossLikely: false,
      complaintDraft: "",
    });

    const res7 = await POST(makeRequest("Normal message check during Redis outage."));
    const json7 = await res7.json();

    assert(res7.status === 200, "Test 7: HTTP 200 returned during total Redis outage");
    assert(json7.riskScore === 40, "Test 7: Analysis payload completes successfully despite Redis outage");
    assert(json7.analysisMode === "ai", "Test 7: analysisMode is 'ai'");

  } finally {
    // Unconditional restoration of all stubs and environment variables
    geminiProvider.callScamAnalysis = origGeminiAnalyze;
    groqProvider.callScamAnalysis = origGroqAnalyze;

    if (origGeminiKey !== undefined) { process.env.GEMINI_API_KEY = origGeminiKey; } else { delete process.env.GEMINI_API_KEY; }
    if (origGroqKey !== undefined) { process.env.GROQ_API_KEY = origGroqKey; } else { delete process.env.GROQ_API_KEY; }
    if (origRedisUrl !== undefined) { process.env.REDIS_KV_REST_API_URL = origRedisUrl; } else { delete process.env.REDIS_KV_REST_API_URL; }
    if (origRedisToken !== undefined) { process.env.REDIS_KV_REST_API_TOKEN = origRedisToken; } else { delete process.env.REDIS_KV_REST_API_TOKEN; }
    _safeBrowsingTestSeam.fn = undefined;
  }

  console.log("\n=======================================================");
  console.log("Executed " + testCasesCount + " test cases with " + assertionsCount + " assertions.");
  console.log("Passed: " + passedCount + ", Failed: " + failedCount);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runResilienceTests().catch((err) => {
  console.error("Resilience test execution failed:", err);
  process.exit(1);
});
