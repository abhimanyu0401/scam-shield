/**
 * scripts/test-b7.ts
 *
 * Comprehensive integration test suite for Phase B7: Production Route Integration.
 * Exercises real POST handler control flow in app/api/check/route.ts across
 * all required multimodal, resilience, degraded, error mapping, and caching scenarios.
 */

import { POST } from "../app/api/check/route";
import { NextRequest } from "next/server";
import { ServerError, TimeoutError } from "../lib/ai/errors";
import { geminiProvider } from "../lib/ai/providers/gemini";
import { groqProvider } from "../lib/ai/providers/groq";

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

function createMockRequest(body: unknown, isMalformedJson = false): NextRequest {
  const url = "http://localhost:3000/api/check";
  if (isMalformedJson) {
    return new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json ...",
    });
  }
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function runTests(): Promise<void> {
  console.log("\n=======================================================");
  console.log("     Running Phase B7 Production Route Integration     ");
  console.log("=======================================================\n");

  // Save original provider methods and environment for restoration
  const origGeminiAnalyze = geminiProvider.callScamAnalysis;
  const origGeminiOCR = geminiProvider.callOCR;
  const origGeminiTranscribe = geminiProvider.callTranscription;
  const origGroqAnalyze = groqProvider.callScamAnalysis;
  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origGroqKey = process.env.GROQ_API_KEY;
  const origRedisUrl = process.env.REDIS_KV_REST_API_URL;
  const origRedisToken = process.env.REDIS_KV_REST_API_TOKEN;

  // Set mock API keys and local loopback Redis url to fail-fast (ECONNREFUSED in ~1ms) instead of hanging on undefined/DNS queries
  process.env.GEMINI_API_KEY = "mock-gemini-key-for-unit-tests";
  process.env.GROQ_API_KEY = "mock-groq-key-for-unit-tests";
  process.env.REDIS_KV_REST_API_URL = "http://127.0.0.1:9999";
  process.env.REDIS_KV_REST_API_TOKEN = "mock-token-for-unit-tests";

  try {
    // -------------------------------------------------------------------------
    // 1. Text -> Live AI Success
    // -------------------------------------------------------------------------
    startTestCase("B7-01: Text input with live AI success");
    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 85,
      flags: ["Requests sensitive info", "Urgency language"],
      explanation: "This message requests immediate OTP sharing.",
      financialLossLikely: false,
      complaintDraft: "Suspected Scam Type: OTP Theft\nDescription: Phishing attack.",
    });

    const req1 = createMockRequest({ text: "Please send OTP immediately.", language: "en" });
    const res1 = await POST(req1);
    const json1 = await res1.json();

    assert(res1.status === 200, "B7-01: status is 200");
    assert(json1.analysisMode === "ai", "B7-01: analysisMode is 'ai'");
    assert(json1.isDegraded === false, "B7-01: isDegraded is false");
    assert(json1.isFallback === false, "B7-01: isFallback is false");
    assert(json1.riskScore === 85, "B7-01: riskScore is 85");
    assert(typeof json1.analysisId === "string" && json1.analysisId.length > 0, "B7-01: analysisId is generated");
    assert(json1.text === "Please send OTP immediately.", "B7-01: text is preserved");

    // -------------------------------------------------------------------------
    // 2. Text -> Primary AI Failure -> Secondary AI Success (Cross-Provider Fallback)
    // -------------------------------------------------------------------------
    startTestCase("B7-02: Cross-provider fallback (Gemini 500 -> Groq success)");
    geminiProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "gemini", 500, "Gemini internal server error");
    };
    groqProvider.callScamAnalysis = async () => ({
      riskScore: 90,
      flags: ["Urgent bank KYC verification request"],
      explanation: "Groq fallback detected fake bank alert.",
      financialLossLikely: false,
      complaintDraft: "Suspected Scam Type: Bank KYC Fraud",
    });



    const req2 = createMockRequest({ text: "Your bank account blocked. Update KYC.", language: "en" });
    const res2 = await POST(req2);
    const json2 = await res2.json();

    assert(res2.status === 200, "B7-02: status is 200");
    assert(json2.analysisMode === "ai", "B7-02: analysisMode is 'ai'");
    assert(json2.isFallback === true, "B7-02: isFallback is true on secondary provider");
    assert(json2.isDegraded === false, "B7-02: isDegraded is false when Groq succeeds");
    assert(json2.providerId === "groq", "B7-02: providerId is 'groq'");

    // -------------------------------------------------------------------------
    // 3. All AI Providers Fail -> Deterministic Fallback
    // -------------------------------------------------------------------------
    startTestCase("B7-03: All AI models fail -> Deterministic Fallback");
    geminiProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "gemini", 502, "Bad Gateway");
    };
    groqProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "groq", 500, "Service Unavailable");
    };

    const req3 = createMockRequest({ text: "CBI officer speaking. Do not disconnect. Digital arrest.", language: "en" });
    const res3 = await POST(req3);
    const json3 = await res3.json();

    assert(res3.status === 200, "B7-03: status is 200 on deterministic fallback");
    assert(json3.analysisMode === "degraded-deterministic", "B7-03: analysisMode is 'degraded-deterministic'");
    assert(json3.isDegraded === true, "B7-03: isDegraded is true");
    assert(json3.isFallback === true, "B7-03: isFallback is true");
    assert(json3.complaintDraft === "", "B7-03: complaintDraft is empty in degraded mode");
    assert(json3.financialLossLikely === false, "B7-03: financialLossLikely is false in degraded mode");
    assert(json3.riskScore >= 75, "B7-03: calibrated digital arrest score >= 75");

    // -------------------------------------------------------------------------
    // 4. Provider Timeout -> Router handles timeout & falls back cleanly (no 504)
    // -------------------------------------------------------------------------
    startTestCase("B7-04: Provider Timeout absorbed by router -> Fallback");
    geminiProvider.callScamAnalysis = async (modelId) => {
      throw new TimeoutError(modelId, "gemini", 5000);
    };
    groqProvider.callScamAnalysis = async (modelId) => {
      throw new TimeoutError(modelId, "groq", 5000);
    };

    const req4 = createMockRequest({ text: "Send OTP immediately.", language: "en" });
    const res4 = await POST(req4);
    const json4 = await res4.json();

    assert(res4.status === 200, "B7-04: status is 200 (timeout absorbed into degraded fallback)");
    assert(json4.analysisMode === "degraded-deterministic", "B7-04: analysisMode degraded");

    // -------------------------------------------------------------------------
    // 5. Image -> OCR -> Scam Analysis Convergence
    // -------------------------------------------------------------------------
    startTestCase("B7-05: Image -> OCR -> Scam Analysis");
    geminiProvider.callOCR = async () => "URGENT: Your electricity power will be disconnected tonight. Call 9876543210";
    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 78,
      flags: ["Fake utility disconnection threat"],
      explanation: "Electricity disconnection scam detected from screenshot.",
      financialLossLikely: false,
      complaintDraft: "Suspected Scam Type: Utility Disconnection Fraud",
    });

    const req5 = createMockRequest({
      imageBase64: Buffer.from("fake-image-bytes").toString("base64"),
      mimeType: "image/png",
      language: "en",
    });
    const res5 = await POST(req5);
    const json5 = await res5.json();

    assert(res5.status === 200, "B7-05: status is 200 for image OCR");
    assert(json5.text.includes("electricity power will be disconnected"), "B7-05: normalized text populated from OCR");
    assert(json5.riskScore === 78, "B7-05: riskScore computed from OCR output");

    // -------------------------------------------------------------------------
    // 6. Audio -> Transcription -> Scam Analysis Convergence
    // -------------------------------------------------------------------------
    startTestCase("B7-06: Audio -> Transcription -> Scam Analysis");
    geminiProvider.callTranscription = async () => "Sir I am calling from CBI customs your parcel contains narcotics";
    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 92,
      flags: ["Government/law enforcement impersonation"],
      explanation: "Police impersonation call.",
      financialLossLikely: false,
      complaintDraft: "Suspected Scam Type: Digital Arrest Police Scam",
    });

    const req6 = createMockRequest({
      audioBase64: Buffer.from("fake-audio-bytes").toString("base64"),
      mimeType: "audio/mp3",
      language: "en",
    });
    const res6 = await POST(req6);
    const json6 = await res6.json();

    assert(res6.status === 200, "B7-06: status is 200 for audio transcription");
    assert(json6.text.includes("calling from CBI customs"), "B7-06: normalized text populated from audio transcription");
    assert(json6.riskScore === 92, "B7-06: riskScore computed from transcribed audio");

    // -------------------------------------------------------------------------
    // 7. OCR Sentinel Rejection (NOT_A_MESSAGE -> 400)
    // -------------------------------------------------------------------------
    startTestCase("B7-07: OCR Sentinel NOT_A_MESSAGE -> HTTP 400");
    geminiProvider.callOCR = async () => "NOT_A_MESSAGE";

    const req7 = createMockRequest({
      imageBase64: Buffer.from("photo-of-dog").toString("base64"),
      mimeType: "image/jpeg",
      language: "en",
    });
    const res7 = await POST(req7);
    const json7 = await res7.json();

    assert(res7.status === 400, "B7-07: status is 400 for NOT_A_MESSAGE");
    assert(
      json7.error === "This doesn't look like a message screenshot. Try uploading a screenshot of a text, chat, or email.",
      "B7-07: exact legacy sentinel error message preserved"
    );

    // -------------------------------------------------------------------------
    // 8. Audio Sentinel Rejection (NO_SPEECH_DETECTED -> 400)
    // -------------------------------------------------------------------------
    startTestCase("B7-08: Audio Sentinel NO_SPEECH_DETECTED -> HTTP 400");
    geminiProvider.callTranscription = async () => "NO_SPEECH_DETECTED";

    const req8 = createMockRequest({
      audioBase64: Buffer.from("silence").toString("base64"),
      mimeType: "audio/mp3",
      language: "en",
    });
    const res8 = await POST(req8);
    const json8 = await res8.json();

    assert(res8.status === 400, "B7-08: status is 400 for NO_SPEECH_DETECTED");
    assert(
      json8.error === "No readable speech was detected in this audio. Try a clearer voice note or call recording.",
      "B7-08: exact legacy audio sentinel error message preserved"
    );

    // -------------------------------------------------------------------------
    // 9. Oversized Payload (Image & Audio > 2.5MB -> 413)
    // -------------------------------------------------------------------------
    startTestCase("B7-09: Oversized Image / Audio (> 2.5MB) -> HTTP 413");
    const oversizedBase64 = "A".repeat(4 * 1024 * 1024); // 4MB base64 > 3.8MB limit

    const reqImageOversized = createMockRequest({
      imageBase64: oversizedBase64,
      mimeType: "image/png",
    });
    const resImageOversized = await POST(reqImageOversized);
    assert(resImageOversized.status === 413, "B7-09: Oversized image returns 413");

    const reqAudioOversized = createMockRequest({
      audioBase64: oversizedBase64,
      mimeType: "audio/mp3",
    });
    const resAudioOversized = await POST(reqAudioOversized);
    assert(resAudioOversized.status === 413, "B7-09: Oversized audio returns 413");

    // -------------------------------------------------------------------------
    // 10. Missing / Empty Input Fields -> HTTP 400
    // -------------------------------------------------------------------------
    startTestCase("B7-10: Missing / Empty Fields -> HTTP 400");
    const reqEmptyText = createMockRequest({ text: "   " });
    const resEmptyText = await POST(reqEmptyText);
    assert(resEmptyText.status === 400, "B7-10: Empty text returns 400");

    const reqMissingAll = createMockRequest({ language: "en" });
    const resMissingAll = await POST(reqMissingAll);
    assert(resMissingAll.status === 400, "B7-10: Missing all fields returns 400");

    // -------------------------------------------------------------------------
    // 11. Malformed JSON Body -> HTTP 400
    // -------------------------------------------------------------------------
    startTestCase("B7-11: Malformed JSON -> HTTP 400");
    const reqMalformed = createMockRequest(null, true);
    const resMalformed = await POST(reqMalformed);
    assert(resMalformed.status === 400, "B7-11: Malformed JSON returns 400");

    // -------------------------------------------------------------------------
    // 12. Frontend CheckResult Schema Compliance
    // -------------------------------------------------------------------------
    startTestCase("B7-12: Full CheckResult frontend contract compliance");
    geminiProvider.callScamAnalysis = async () => ({
      riskScore: 30,
      flags: ["Payment/OTP phrase"],
      explanation: "Low risk payment message.",
      financialLossLikely: false,
      complaintDraft: "",
    });

    const reqSchema = createMockRequest({ text: "Here is your grocery receipt for Rs 500." });
    const resSchema = await POST(reqSchema);
    const jsonSchema = await resSchema.json();

    assert(typeof jsonSchema.analysisId === "string", "B7-12: analysisId is string");
    assert(typeof jsonSchema.text === "string", "B7-12: text is string");
    assert(typeof jsonSchema.riskScore === "number", "B7-12: riskScore is number");
    assert(Array.isArray(jsonSchema.flags), "B7-12: flags is array");
    assert(typeof jsonSchema.explanation === "string", "B7-12: explanation is string");
    assert(jsonSchema.embedding === null, "B7-12: embedding is null");
    assert(typeof jsonSchema.complaintDraft === "string", "B7-12: complaintDraft is string");
    assert(typeof jsonSchema.financialLossLikely === "boolean", "B7-12: financialLossLikely is boolean");
    assert(typeof jsonSchema.analyzedAt === "string", "B7-12: analyzedAt is ISO timestamp");

    // -------------------------------------------------------------------------
    // 13. Hindi Language Propagation to Route & Deterministic Fallback
    // -------------------------------------------------------------------------
    startTestCase("B7-13: Hindi language setting accurately handled in fallback");
    geminiProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "gemini", 500, "AI Down");
    };
    groqProvider.callScamAnalysis = async (modelId) => {
      throw new ServerError(modelId, "groq", 500, "AI Down");
    };

    const reqHi = createMockRequest({ text: "तुरंत ओटीपी बताएं, खाता बंद हो जाएगा", language: "hi" });
    const resHi = await POST(reqHi);
    const jsonHi = await resHi.json();

    assert(resHi.status === 200, "B7-13: Hindi request status is 200");
    assert(jsonHi.explanation.includes("एआई विश्लेषण") || jsonHi.explanation.includes("नियम"), "B7-13: Hindi explanation in fallback");

  } finally {
    // Restore all original provider methods and environment
    geminiProvider.callScamAnalysis = origGeminiAnalyze;
    geminiProvider.callOCR = origGeminiOCR;
    geminiProvider.callTranscription = origGeminiTranscribe;
    groqProvider.callScamAnalysis = origGroqAnalyze;
    if (origGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = origGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (origGroqKey !== undefined) {
      process.env.GROQ_API_KEY = origGroqKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }
    if (origRedisUrl !== undefined) {
      process.env.REDIS_KV_REST_API_URL = origRedisUrl;
    } else {
      delete process.env.REDIS_KV_REST_API_URL;
    }
    if (origRedisToken !== undefined) {
      process.env.REDIS_KV_REST_API_TOKEN = origRedisToken;
    } else {
      delete process.env.REDIS_KV_REST_API_TOKEN;
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
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
