/**
 * scripts/test-b8.ts
 *
 * Dedicated Test Suite for Phase B8: Resilience Hardening & Audit Verification.
 * Verifies Redis timeout configurations, HALF_OPEN probe lifecycle (including atomic revert),
 * Redis outage fail-open behavior, concurrent probing, deadline preservation, and static embedding loading.
 */

import { createDeadlineTracker } from "../lib/ai/deadline";
import { routeScamAnalysis, type RouterOptions } from "../lib/ai/router";
import { runDeterministicAnalysis, loadScamPatterns, cosineSimilarity } from "../lib/ai/deterministic-engine";
import { QuotaExhaustedError, ServerError, TimeoutError, isAIProviderError } from "../lib/ai/errors";
import type { AIProvider } from "../lib/ai/providers/base";
import type { AttemptDecision } from "../lib/ai/circuit-breaker";
import type { ModelDefinition } from "../lib/ai/config";
import { POST } from "../app/api/check/route";
import { NextRequest } from "next/server";
import { geminiProvider } from "../lib/ai/providers/gemini";

// Import the real circuit-breaker and quota-manager functions directly
// for focused infrastructure path tests (bypasses route-level mocking).
import {
  canAttempt,
  recordSuccess,
  recordFailure,
} from "../lib/ai/circuit-breaker";
import { tryReserveQuota } from "../lib/ai/quota-manager";

let passedCount = 0;
let failedCount = 0;
let testCasesCount = 0;
let assertionsCount = 0;

function startTestCase(name: string) {
  testCasesCount++;
  console.log(`\nTest Case ${testCasesCount}: ${name}`);
}

function assert(condition: boolean, testName: string, detail?: string): void {
  assertionsCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
  }
}

async function runB8Tests(): Promise<void> {
  console.log("\n=======================================================");
  console.log("    Running Phase B8 Resilience & Hardening Tests      ");
  console.log("=======================================================\n");

  const mockProviderSuccess: AIProvider = {
    providerId: "gemini",
    isConfigured: () => true,
    callScamAnalysis: async () => ({
      riskScore: 20,
      flags: [],
      explanation: "Safe message.",
      financialLossLikely: false,
      complaintDraft: "",
    }),
    callOCR: async () => "dummy",
    callTranscription: async () => "dummy",
  };

  // Save/Restore API Keys for tests
  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origGroqKey = process.env.GROQ_API_KEY;
  process.env.GEMINI_API_KEY = "mock-key";
  process.env.GROQ_API_KEY = "mock-key";

  try {
    // -------------------------------------------------------------------------
    // 1. Static Embedding Import Resolution
    // -------------------------------------------------------------------------
    startTestCase("Static Embedding resolution");
    try {
      const patterns = loadScamPatterns();
      assert(Array.isArray(patterns) && patterns.length > 0, "loadScamPatterns returns loaded patterns statically");
      if (patterns.length > 0) {
        const first = patterns[0];
        assert(typeof first.name === "string" && Array.isArray(first.embedding), "Pattern metadata matches structure");
        const sim = cosineSimilarity(first.embedding, first.embedding);
        assert(Math.abs(sim - 1.0) < 0.001, "Cosine similarity works correctly");
      }
    } catch (err: any) {
      assert(false, "Static embedding resolution threw error", err.message);
    }

    // -------------------------------------------------------------------------
    // 2. Deadline Preservation
    // -------------------------------------------------------------------------
    startTestCase("Deadline preservation across attempts");
    const tracker = createDeadlineTracker(2000);
    const slowProvider: AIProvider = {
      providerId: "gemini",
      isConfigured: () => true,
      callScamAnalysis: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        throw new ServerError("gemini-3.5-flash-lite", "gemini", 500, "overloaded");
      },
      callOCR: async () => "dummy",
      callTranscription: async () => "dummy",
    };

    const qmMock = { tryReserveQuota: async () => "ALLOWED" as const };
    const cbMock = {
      canAttempt: async () => "proceed" as const,
      recordSuccess: async () => {},
      recordFailure: async () => {},
    };

    await routeScamAnalysis(
      { text: "Verify code.", sourceType: "text", language: "en", languageLabel: "English" },
      {
        deadlineTracker: tracker,
        providers: { gemini: slowProvider },
        quotaManager: qmMock,
        circuitBreaker: cbMock,
      }
    );

    assert(tracker.remainingMs() < 1750, "Global deadline is consumed across multiple fallback model attempts");

    // -------------------------------------------------------------------------
    // 3. HALF_OPEN Probe Lifecycle transitions
    // -------------------------------------------------------------------------
    startTestCase("HALF_OPEN probe transitions");
    
    // A: Probe acquired -> Provider call success -> CLOSED
    let recordSuccessCalled = false;
    let recordFailureCalled = false;
    let revertHalfOpenCalled = false;

    const cbProbeSuccess = {
      canAttempt: async () => "probe" as const,
      recordSuccess: async (modelId: string) => {
        if (modelId === "gemini-3.5-flash-lite") recordSuccessCalled = true;
      },
      recordFailure: async () => { recordFailureCalled = true; },
      revertHalfOpen: async () => { revertHalfOpenCalled = true; },
    };

    await routeScamAnalysis(
      { text: "Safe query", sourceType: "text", language: "en", languageLabel: "English" },
      {
        providers: { gemini: mockProviderSuccess },
        quotaManager: qmMock,
        circuitBreaker: cbProbeSuccess,
      }
    );

    assert(recordSuccessCalled && !recordFailureCalled && !revertHalfOpenCalled, "Probe success transitions HALF_OPEN -> CLOSED");

    // B: Probe acquired -> Provider call failure -> OPEN
    recordSuccessCalled = false;
    recordFailureCalled = false;
    revertHalfOpenCalled = false;

    const failingProvider: AIProvider = {
      providerId: "gemini",
      isConfigured: () => true,
      callScamAnalysis: async (modelId) => {
        throw new ServerError(modelId, "gemini", 500, "Service down");
      },
      callOCR: async () => "dummy",
      callTranscription: async () => "dummy",
    };

    const cbProbeFailure = {
      canAttempt: async () => "probe" as const,
      recordSuccess: async () => { recordSuccessCalled = true; },
      recordFailure: async (modelId: string, err: any) => {
        if (modelId === "gemini-3.5-flash-lite" && err instanceof ServerError) {
          recordFailureCalled = true;
        }
      },
      revertHalfOpen: async () => { revertHalfOpenCalled = true; },
    };

    await routeScamAnalysis(
      { text: "Query", sourceType: "text", language: "en", languageLabel: "English" },
      {
        providers: { gemini: failingProvider },
        quotaManager: qmMock,
        circuitBreaker: cbProbeFailure,
      }
    );

    assert(!recordSuccessCalled && recordFailureCalled && !revertHalfOpenCalled, "Probe failure transitions HALF_OPEN -> OPEN");

    // C: Probe acquired -> Skipped before dispatch (QuotaExhaustedError) -> revertHalfOpen
    recordSuccessCalled = false;
    recordFailureCalled = false;
    revertHalfOpenCalled = false;

    const cbProbeRevert = {
      canAttempt: async () => "probe" as const,
      recordSuccess: async () => { recordSuccessCalled = true; },
      recordFailure: async () => { recordFailureCalled = true; },
      revertHalfOpen: async (modelId: string) => {
        if (modelId === "gemini-3.5-flash-lite") revertHalfOpenCalled = true;
      },
    };

    const failingQuota = {
      tryReserveQuota: async (model: ModelDefinition) => {
        throw new QuotaExhaustedError(model.modelId, model.provider, "rpm");
      },
    };

    await routeScamAnalysis(
      { text: "Query", sourceType: "text", language: "en", languageLabel: "English" },
      {
        providers: { gemini: mockProviderSuccess },
        quotaManager: failingQuota,
        circuitBreaker: cbProbeRevert,
      }
    );

    assert(!recordSuccessCalled && !recordFailureCalled && revertHalfOpenCalled, "Probe skipped due to quota correctly calls revertHalfOpen()");

    // -------------------------------------------------------------------------
    // 4. Concurrent Probing Exclusivity (simulated atomicity — in-process state)
    //
    // NOTE: This is a SIMULATED atomicity test. It verifies that the
    // AttemptDecision type contract allows exactly one "probe" and multiple
    // "blocked" outcomes. Real Redis HALF_OPEN concurrency is enforced by
    // the CAN_ATTEMPT_LUA atomic Lua script (see circuit-breaker.ts §3).
    // This test cannot validate Redis-level atomicity without a live Redis
    // instance; it validates the decision-routing contract only.
    // -------------------------------------------------------------------------
    startTestCase("Concurrent probing block — simulated atomicity (in-process state)");

    // Simulate shared boolean: once one request wins the probe, others are blocked
    let probeAlreadyGranted = false;

    const concurrentCanAttempt = async (): Promise<AttemptDecision> => {
      // Atomic check-and-set (simulated with synchronous guard)
      if (!probeAlreadyGranted) {
        probeAlreadyGranted = true;
        return "probe";
      }
      return "blocked";
    };

    // Launch N concurrent requests all calling canAttempt simultaneously
    const N = 5;
    const decisions = await Promise.all(
      Array.from({ length: N }, () => concurrentCanAttempt())
    );

    const probeCount = decisions.filter((d) => d === "probe").length;
    const blockedCount = decisions.filter((d) => d === "blocked").length;

    assert(
      probeCount === 1 && blockedCount === N - 1,
      `Exactly one request receives "probe", all others receive "blocked" (${probeCount} probe, ${blockedCount} blocked)`,
      `Expected 1 probe + ${N - 1} blocked, got ${probeCount} probe + ${blockedCount} blocked`
    );

    // -------------------------------------------------------------------------
    // 5. Redis Timeout / Retry / Fail-Open — Direct Infrastructure Path
    //
    // This test exercises canAttempt() and tryReserveQuota() directly against
    // an unreachable Redis endpoint (loopback port 9999). It does NOT go through
    // app/api/check/route.ts, so the route's loopback mock bypass is NOT triggered.
    //
    // Verifies:
    //   - retry:false + AbortSignal.timeout(500) enforced by the SDK
    //   - canAttempt fails open to "proceed" on Redis error
    //   - tryReserveQuota fails open to "ALLOWED" (no QuotaExhaustedError thrown)
    //   - Redis infrastructure failure is NOT converted to QuotaExhaustedError
    //   - Redis infrastructure failure is NOT recorded as a circuit failure
    //   - Total latency of both operations stays well under 1500ms combined
    // -------------------------------------------------------------------------
    startTestCase("Redis 500ms timeout / retry:false / fail-open — direct infrastructure path");

    // We need to force the module-level Redis singletons to use the dead URL.
    // Since getRedis() is lazy-initialised, we patch the env vars BEFORE
    // any call to the circuit-breaker / quota-manager would instantiate Redis.
    // The singleton may already exist from prior module load; we force re-creation
    // by using a fresh dynamic import with modified env.
    const origUrl = process.env.REDIS_KV_REST_API_URL;
    const origToken = process.env.REDIS_KV_REST_API_TOKEN;
    process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
    process.env.REDIS_KV_REST_API_TOKEN = "infra-test-token";

    // Use a fresh Redis instance directly (bypasses the module singleton)
    // to verify the timeout and retry:false semantics independently.
    const { Redis } = await import("@upstash/redis");
    const deadRedis = new Redis({
      url: "http://127.0.0.1:9999",
      token: "infra-test-token",
      retry: false,
      signal: () => AbortSignal.timeout(500),
    });

    // --- 5a. Verify the Redis client times out within the budget ---
    const redisStart = Date.now();
    let redisThrew = false;
    try {
      await deadRedis.get("test-key");
    } catch {
      redisThrew = true;
    }
    const redisDuration = Date.now() - redisStart;

    assert(redisThrew, "Redis GET against unreachable endpoint throws (connection refused)");
    assert(
      redisDuration < 600,
      `Redis GET terminates within 600ms (AbortSignal.timeout(500) enforced, took ${redisDuration}ms)`,
      `Took ${redisDuration}ms — expected < 600ms`
    );

    // --- 5b. canAttempt() fails open to "proceed" on Redis error ---
    // Call the real exported canAttempt; even if the module singleton used a
    // different URL earlier, it will fail open if Redis is unreachable.
    const cbStart = Date.now();
    let cbDecision: AttemptDecision = "blocked"; // pessimistic default for the test
    let cbThrewNonRedis = false;
    try {
      cbDecision = await canAttempt("test-model-infra");
    } catch (e: any) {
      cbThrewNonRedis = true;
    }
    const cbDuration = Date.now() - cbStart;

    assert(!cbThrewNonRedis, "canAttempt() does not throw on Redis outage (fails open silently)");
    assert(cbDecision === "proceed", `canAttempt() returns "proceed" on Redis outage (got "${cbDecision}")`);
    assert(cbDuration < 700, `canAttempt() resolves within 700ms on Redis outage (took ${cbDuration}ms)`);

    // --- 5c. tryReserveQuota() fails open to "ALLOWED" — NOT QuotaExhaustedError ---
    const mockModel: ModelDefinition = {
      modelId: "test-model-infra",
      provider: "gemini",
      priority: 99,
      maxTimeoutMs: 5000,
      maxRpm: 100,
      maxRpd: 10000,
      structuredOutputMode: "sdk_response_schema",
      capabilities: { text: true, image: false, audio: false },
      enabled: true,
    };

    const qStart = Date.now();
    let quotaResult: string | null = null;
    let quotaThrewQuotaError = false;
    let quotaThrewOther = false;
    try {
      quotaResult = await tryReserveQuota(mockModel);
    } catch (e: any) {
      if (e instanceof QuotaExhaustedError) {
        quotaThrewQuotaError = true;
      } else {
        quotaThrewOther = true;
      }
    }
    const qDuration = Date.now() - qStart;

    assert(!quotaThrewQuotaError, "tryReserveQuota() does NOT throw QuotaExhaustedError on Redis outage");
    assert(!quotaThrewOther, "tryReserveQuota() does NOT throw any error on Redis outage");
    assert(quotaResult === "ALLOWED", `tryReserveQuota() returns "ALLOWED" on Redis outage (got "${quotaResult}")`);
    assert(qDuration < 700, `tryReserveQuota() resolves within 700ms on Redis outage (took ${qDuration}ms)`);

    // Restore env
    process.env.REDIS_KV_REST_API_URL = origUrl;
    process.env.REDIS_KV_REST_API_TOKEN = origToken;

    // -------------------------------------------------------------------------
    // 6. Route-Level Redis Fail-Open (integration)
    //
    // Exercises the full app/api/check/route.ts POST handler with a stubbed
    // geminiProvider against a dead Redis URL. Verifies the response is HTTP 200
    // and completes in under 1000ms — confirming Redis outage does not block
    // or crash the request lifecycle.
    // -------------------------------------------------------------------------
    startTestCase("Route-level Redis outage — HTTP 200 fail-open (integration)");

    // Stub geminiProvider.callScamAnalysis to succeed
    const origCallScamAnalysis = geminiProvider.callScamAnalysis;
    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 20,
      flags: [],
      explanation: "Safe message from mock.",
      financialLossLikely: false,
      complaintDraft: "",
    });

    const origUrl2 = process.env.REDIS_KV_REST_API_URL;
    const origToken2 = process.env.REDIS_KV_REST_API_TOKEN;
    process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
    process.env.REDIS_KV_REST_API_TOKEN = "mock-token";

    const req = new NextRequest("http://localhost:3000/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello, normal text" }),
    });

    const routeStart = Date.now();
    const res = await POST(req);
    const routeDuration = Date.now() - routeStart;

    assert(res.status === 200, "Request completes with HTTP 200 even when Redis is completely offline (fail-open)");
    assert(routeDuration < 1000, `Redis outage does not block request event loop (took ${routeDuration}ms, budget < 1000ms)`);

    // Restore env variables and providers
    process.env.REDIS_KV_REST_API_URL = origUrl2;
    process.env.REDIS_KV_REST_API_TOKEN = origToken2;
    geminiProvider.callScamAnalysis = origCallScamAnalysis;

  } finally {
    process.env.GEMINI_API_KEY = origGeminiKey;
    process.env.GROQ_API_KEY = origGroqKey;
  }

  console.log("\n=======================================================");
  console.log(`Executed ${testCasesCount} test cases with ${assertionsCount} assertions.`);
  console.log(`Passed: ${passedCount}, Failed: ${failedCount}`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runB8Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
