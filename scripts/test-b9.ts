/**
 * scripts/test-b9.ts
 *
 * Phase B9: Safe Browsing Production Wiring - Test Suite.
 *
 * The Safe Browsing HTTP implementation lives exclusively in
 * deterministic-engine.ts (checkSafeBrowsing(), lines 307-339).
 * route.ts adds only a test seam object: _safeBrowsingTestSeam.
 *
 * When _safeBrowsingTestSeam.fn is set, createDeterministicFallbackEngine()
 * receives it as options.safeBrowsingFn, activating the overrideFn branch of
 * checkSafeBrowsing(). This lets us exercise every Safe Browsing outcome
 * without real network calls and without duplicating implementation logic.
 *
 * B9-03 (missing API key) and B9-08 (insufficient deadline) use
 * runDeterministicAnalysis() directly to control env/tracker below the route.
 *
 * All AI providers are stubbed to throw ServerError so every route-level
 * test reaches the deterministic fallback path.
 */

import { POST, _safeBrowsingTestSeam } from "../app/api/check/route";
import { NextRequest } from "next/server";
import { ServerError } from "../lib/ai/errors";
import { geminiProvider } from "../lib/ai/providers/gemini";
import { groqProvider } from "../lib/ai/providers/groq";
import { createDeadlineTracker } from "../lib/ai/deadline";
import { runDeterministicAnalysis } from "../lib/ai/deterministic-engine";

let testCasesCount = 0;
let assertionsCount = 0;
let passedCount = 0;
let failedCount = 0;

function startTestCase(name: string): void {
  testCasesCount++;
  console.log("\nTest Case " + testCasesCount + ": " + name);
}

function assert(condition: boolean, label: string, detail?: string): void {
  assertionsCount++;
  if (condition) {
    passedCount++;
    console.log("  PASS: " + label);
  } else {
    failedCount++;
    const suffix = detail ? " (" + detail + ")" : "";
    console.error("  FAIL: " + label + suffix);
  }
}

function makeUrlRequest(urlsInText: boolean = true): NextRequest {
  const text = urlsInText
    ? "Your account is blocked. Verify now: https://fake-bank.example.com/kyc"
    : "Your account is blocked. Call us immediately.";
  return new NextRequest("http://localhost:3000/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: "en" }),
  });
}

async function runB9Tests(): Promise<void> {
  console.log("\n=======================================================");
  console.log("   Running Phase B9 Safe Browsing Production Wiring   ");
  console.log("=======================================================\n");

  const origGeminiAnalyze = geminiProvider.callScamAnalysis;
  const origGroqAnalyze = groqProvider.callScamAnalysis;
  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origGroqKey = process.env.GROQ_API_KEY;
  const origRedisUrl = process.env.REDIS_KV_REST_API_URL;
  const origRedisToken = process.env.REDIS_KV_REST_API_TOKEN;
  const origSafeBrowsingKey = process.env.SAFE_BROWSING_API_KEY;

  // Stub AI providers so every route test falls through to deterministic engine.
  geminiProvider.callScamAnalysis = async (modelId) => {
    throw new ServerError(modelId, "gemini", 500, "B9 stub: AI unavailable");
  };
  groqProvider.callScamAnalysis = async (modelId) => {
    throw new ServerError(modelId, "groq", 500, "B9 stub: AI unavailable");
  };

  process.env.GEMINI_API_KEY = "mock-gemini-b9";
  process.env.GROQ_API_KEY = "mock-groq-b9";
  process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
  process.env.REDIS_KV_REST_API_TOKEN = "mock-redis-b9";
  _safeBrowsingTestSeam.fn = undefined;

  try {
    // -------------------------------------------------------------------------
    // B9-01: Malicious URL detected by Safe Browsing
    //
    // Seam returns true -> checkSafeBrowsing() overrideFn branch returns true
    // -> CFN-04 fires -> riskScore = 95, flags contain known-malicious-link.
    // -------------------------------------------------------------------------
    startTestCase("B9-01: Malicious Safe Browsing result");

    let seamCalledB9_01 = false;
    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal) => {
      seamCalledB9_01 = true;
      return true as boolean | null;
    };

    const res01 = await POST(makeUrlRequest(true));
    const json01 = await res01.json();

    assert(res01.status === 200, "B9-01: status 200");
    assert(json01.analysisMode === "degraded-deterministic", "B9-01: analysisMode degraded-deterministic");
    assert(seamCalledB9_01, "B9-01: safeBrowsingFn was invoked");
    assert(json01.riskScore === 95, "B9-01: riskScore is 95 (CFN-04)", "got " + json01.riskScore);
    assert(
      Array.isArray(json01.flags) && json01.flags.some((f: string) => f.includes("malicious link")),
      "B9-01: flags contain known-malicious-link",
    );
    assert(json01.isDegraded === true, "B9-01: isDegraded is true");
    assert(json01.complaintDraft === "", "B9-01: complaintDraft empty in degraded mode");
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-02: Clean URL returned by Safe Browsing
    //
    // Seam returns false -> isMaliciousLink = false -> score adjusted down 10.
    // -------------------------------------------------------------------------
    startTestCase("B9-02: Clean Safe Browsing result");

    let seamCalledB9_02 = false;
    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal) => {
      seamCalledB9_02 = true;
      return false as boolean | null;
    };

    const res02 = await POST(makeUrlRequest(true));
    const json02 = await res02.json();

    assert(res02.status === 200, "B9-02: status 200");
    assert(seamCalledB9_02, "B9-02: safeBrowsingFn was invoked");
    assert(json02.riskScore < 95, "B9-02: riskScore below CFN-04 ceiling", "got " + json02.riskScore);
    assert(
      !json02.flags?.some((f: string) => f.includes("malicious link")),
      "B9-02: no malicious-link flag for clean URL",
    );
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-03: Missing API key -> null / fail-open (engine internal path)
    //
    // Tested via runDeterministicAnalysis() with no safeBrowsingFn so the
    // engine reads SAFE_BROWSING_API_KEY internally. Key is deleted -> null.
    // -------------------------------------------------------------------------
    startTestCase("B9-03: Missing SAFE_BROWSING_API_KEY -> null / fail-open");

    delete process.env.SAFE_BROWSING_API_KEY;

    let b9_03Threw = false;
    let b9_03Result: Awaited<ReturnType<typeof runDeterministicAnalysis>> | null = null;
    const tracker03 = createDeadlineTracker(20000);
    try {
      b9_03Result = await runDeterministicAnalysis(
        {
          text: "Blocked account. Verify: https://fake-phish.example.com/login",
          sourceType: "text",
          language: "en",
          languageLabel: "English",
        },
        tracker03,
        {},
      );
    } catch {
      b9_03Threw = true;
    }

    assert(!b9_03Threw, "B9-03: no throw when key is missing");
    assert(b9_03Result !== null, "B9-03: result is non-null");
    assert(b9_03Result?.isMaliciousLink === null, "B9-03: isMaliciousLink is null");
    assert(typeof b9_03Result?.riskScore === "number", "B9-03: riskScore is still a number");

    if (origSafeBrowsingKey !== undefined) {
      process.env.SAFE_BROWSING_API_KEY = origSafeBrowsingKey;
    }

    // -------------------------------------------------------------------------
    // B9-04: HTTP 4xx/5xx -> null (seam returns null to mirror !response.ok)
    // -------------------------------------------------------------------------
    startTestCase("B9-04: HTTP error -> null -> analysis continues");

    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => null;

    const res04 = await POST(makeUrlRequest(true));
    const json04 = await res04.json();

    assert(res04.status === 200, "B9-04: status 200 after HTTP error");
    assert(
      !json04.flags?.some((f: string) => f.includes("malicious link")),
      "B9-04: no malicious-link flag on null return",
    );
    assert(json04.analysisMode === "degraded-deterministic", "B9-04: analysisMode degraded-deterministic");
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-05: AbortError thrown from seam
    //
    // checkSafeBrowsing() overrideFn branch (lines 297-304) wraps the call in
    // try/catch: any exception from overrideFn -> handle.cancel() -> null.
    // -------------------------------------------------------------------------
    startTestCase("B9-05: AbortError thrown by safeBrowsingFn -> null -> fail-open");

    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => {
      throw new DOMException("The operation was aborted.", "AbortError");
    };

    const res05 = await POST(makeUrlRequest(true));
    const json05 = await res05.json();

    assert(res05.status === 200, "B9-05: status 200 after AbortError");
    assert(json05.analysisMode === "degraded-deterministic", "B9-05: analysisMode degraded-deterministic");
    assert(
      !json05.flags?.some((f: string) => f.includes("malicious link")),
      "B9-05: no malicious-link flag on AbortError",
    );
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-06: Malformed JSON -> SyntaxError caught
    //
    // The same catch block in the internal path that handles response.json()
    // SyntaxError is exercised via the seam (overrideFn catch block).
    // -------------------------------------------------------------------------
    startTestCase("B9-06: Malformed JSON -> SyntaxError -> null -> fail-open");

    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => {
      throw new SyntaxError("Unexpected token in JSON");
    };

    const res06 = await POST(makeUrlRequest(true));
    const json06 = await res06.json();

    assert(res06.status === 200, "B9-06: status 200 after SyntaxError");
    assert(json06.analysisMode === "degraded-deterministic", "B9-06: analysisMode degraded-deterministic");
    assert(
      !json06.flags?.some((f: string) => f.includes("malicious link")),
      "B9-06: no malicious-link flag on malformed response",
    );
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-07: No URLs in text -> safeBrowsingFn must NOT be invoked
    //
    // runDeterministicAnalysis() line 917:
    //   if (foundUrls.length > 0 && tracker.canAttempt()) { ... }
    // checkSafeBrowsing() line 292: if (urls.length === 0) return null;
    // -------------------------------------------------------------------------
    startTestCase("B9-07: No URLs in text -> safeBrowsingFn not invoked");

    let seamCalledB9_07 = false;
    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => {
      seamCalledB9_07 = true;
      return true;
    };

    const res07 = await POST(makeUrlRequest(false));
    const json07 = await res07.json();

    assert(res07.status === 200, "B9-07: status 200");
    assert(!seamCalledB9_07, "B9-07: safeBrowsingFn NOT invoked (no URLs in text)");
    assert(
      !json07.flags?.some((f: string) => f.includes("malicious link")),
      "B9-07: no malicious-link flag",
    );
    _safeBrowsingTestSeam.fn = undefined;

    // -------------------------------------------------------------------------
    // B9-08: Insufficient deadline budget -> safeBrowsingFn not invoked
    //
    // MIN_REMAINING_MS_TO_ATTEMPT = 250ms (config.ts line 56).
    // tracker08 starts at 100ms total; after 150ms sleep it has expired.
    // tracker.canAttempt() returns false -> the Safe Browsing block is skipped.
    // -------------------------------------------------------------------------
    startTestCase("B9-08: Insufficient deadline budget -> safeBrowsingFn not invoked");

    let seamCalledB9_08 = false;
    const tightBudgetFn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => {
      seamCalledB9_08 = true;
      return true;
    };

    const tracker08 = createDeadlineTracker(100);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const result08 = await runDeterministicAnalysis(
      {
        text: "Verify KYC: https://phish.example.com/bank",
        sourceType: "text",
        language: "en",
        languageLabel: "English",
      },
      tracker08,
      { safeBrowsingFn: tightBudgetFn },
    );

    assert(!seamCalledB9_08, "B9-08: safeBrowsingFn NOT called when deadline exhausted");
    assert(result08.isMaliciousLink === null, "B9-08: isMaliciousLink is null (Safe Browsing skipped)");
    assert(typeof result08.riskScore === "number", "B9-08: riskScore still computed from heuristics");

    // -------------------------------------------------------------------------
    // B9-09: SAFE_BROWSING_API_KEY is server-only (no NEXT_PUBLIC_ prefix)
    //
    // Two checks:
    //   1. Static: variable name does not start with NEXT_PUBLIC_.
    //   2. Dynamic: sentinel set in env is not echoed in route response body.
    // -------------------------------------------------------------------------
    startTestCase("B9-09: SAFE_BROWSING_API_KEY is server-only (no NEXT_PUBLIC_ prefix)");

    const varName = "SAFE_BROWSING_API_KEY";
    assert(!varName.startsWith("NEXT_PUBLIC_"), "B9-09: variable name has no NEXT_PUBLIC_ prefix");

    const sentinelKey = "SENTINEL_B9_TEST_" + Math.random().toString(36).slice(2);
    process.env.SAFE_BROWSING_API_KEY = sentinelKey;
    // Prevent real HTTP call; return null to keep test deterministic.
    _safeBrowsingTestSeam.fn = async (_urls: string[], _signal: AbortSignal): Promise<boolean | null> => null;

    const res09 = await POST(makeUrlRequest(true));
    const raw09 = await res09.text();

    assert(!raw09.includes(sentinelKey), "B9-09: API key sentinel not present in route response body");

    _safeBrowsingTestSeam.fn = undefined;
    if (origSafeBrowsingKey !== undefined) {
      process.env.SAFE_BROWSING_API_KEY = origSafeBrowsingKey;
    } else {
      delete process.env.SAFE_BROWSING_API_KEY;
    }

  } finally {
    // Restore all originals unconditionally.
    _safeBrowsingTestSeam.fn = undefined;
    geminiProvider.callScamAnalysis = origGeminiAnalyze;
    groqProvider.callScamAnalysis = origGroqAnalyze;
    if (origGeminiKey !== undefined) { process.env.GEMINI_API_KEY = origGeminiKey; }
    else { delete process.env.GEMINI_API_KEY; }
    if (origGroqKey !== undefined) { process.env.GROQ_API_KEY = origGroqKey; }
    else { delete process.env.GROQ_API_KEY; }
    if (origRedisUrl !== undefined) { process.env.REDIS_KV_REST_API_URL = origRedisUrl; }
    else { delete process.env.REDIS_KV_REST_API_URL; }
    if (origRedisToken !== undefined) { process.env.REDIS_KV_REST_API_TOKEN = origRedisToken; }
    else { delete process.env.REDIS_KV_REST_API_TOKEN; }
    if (origSafeBrowsingKey !== undefined) { process.env.SAFE_BROWSING_API_KEY = origSafeBrowsingKey; }
    else { delete process.env.SAFE_BROWSING_API_KEY; }
  }

  console.log("\n=======================================================");
  console.log("Executed " + testCasesCount + " test cases with " + assertionsCount + " assertions.");
  console.log("Passed: " + passedCount + ", Failed: " + failedCount);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runB9Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
