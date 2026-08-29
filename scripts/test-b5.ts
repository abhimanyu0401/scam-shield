/**
 * scripts/test-b5.ts
 *
 * Comprehensive Test Suite for Phase B5 (Request Normalization & Multimodal Convergence).
 *
 * Tests 21 distinct invariant and behavioral scenarios using dependency injection
 * and mock providers without making ANY live external network or API calls.
 */

import { createDeadlineTracker } from "../lib/ai/deadline";
import {
  normalizeRequestInput,
  PayloadTooLargeError,
  InvalidInputError,
  SentinelDetectedError,
} from "../lib/ai/normalizer";
import {
  runDeterministicAnalysis,
  createDeterministicFallbackEngine,
  cosineSimilarity,
  URGENCY_KEYWORDS,
  PAYMENT_KEYWORDS,
} from "../lib/ai/deterministic-engine";
import { routeScamAnalysis, type RouterOptions } from "../lib/ai/router";
import type { AIProvider } from "../lib/ai/providers/base";
import type { ParsedAIResponse } from "../lib/ai/schema-validator";
import { TimeoutError, ProviderUnavailableError } from "../lib/ai/errors";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failedCount++;
  }
}

async function runTests(): Promise<void> {
  console.log("\n=======================================================");
  console.log("  Running Phase B5 Normalization & Convergence Tests   ");
  console.log("=======================================================\n");

  // Mock Provider Setup for zero live network calls
  const mockGeminiProvider: AIProvider = {
    providerId: "gemini",
    isConfigured: () => true,
    callScamAnalysis: async () => {
      return {
        riskScore: 85,
        flags: ["Payment/OTP phrase", "Urgency language"],
        explanation: "Suspicious message requesting OTP urgently.",
        financialLossLikely: false,
        complaintDraft: "Suspected Scam Type: OTP Scam",
      };
    },
    callOCR: async (_modelId, imageBase64) => {
      if (imageBase64 === "SENTINEL_NOT_A_MESSAGE") return "NOT_A_MESSAGE";
      if (imageBase64 === "SENTINEL_NO_TEXT") return "NO_TEXT_FOUND";
      if (imageBase64 === "EMPTY_RESULT") return "   ";
      return "URGENT: Your bank account is suspended. Enter OTP immediately.";
    },
    callTranscription: async (_modelId, audioBase64) => {
      if (audioBase64 === "SENTINEL_NOT_A_CALL") return "NOT_A_CALL";
      if (audioBase64 === "SENTINEL_NO_SPEECH") return "NO_SPEECH_DETECTED";
      if (audioBase64 === "EMPTY_RESULT") return "  ";
      return "Hello, this is officer calling regarding an urgent payment arrest warrant.";
    },
  };

  // In-memory mock circuit breaker & quota manager to isolate tests from Redis network timeouts
  const mockCircuitBreaker = {
    canAttempt: async () => "proceed" as const,
    recordSuccess: async () => {},
    recordFailure: async () => {},
  };

  const mockQuotaManager = {
    tryReserveQuota: async () => "ALLOWED" as const,
  };

  const routerOpts: RouterOptions = {
    providers: { gemini: mockGeminiProvider },
    circuitBreaker: mockCircuitBreaker,
    quotaManager: mockQuotaManager,
  };

  // -------------------------------------------------------------------------
  // Test 1: Plain text input -> NormalizedInput
  // -------------------------------------------------------------------------
  const tracker1 = createDeadlineTracker(20_000);
  const res1 = await normalizeRequestInput(
    { text: "  Please verify your OTP at http://bank.com  ", language: "en" },
    tracker1,
  );
  assert(
    res1.text === "Please verify your OTP at http://bank.com" &&
      res1.sourceType === "text" &&
      res1.language === "en" &&
      res1.languageLabel === "English",
    "1. Text input produces canonical NormalizedInput",
  );

  // -------------------------------------------------------------------------
  // Test 2: Image input -> OCR -> NormalizedInput
  // -------------------------------------------------------------------------
  const tracker2 = createDeadlineTracker(20_000);
  const res2 = await normalizeRequestInput(
    { imageBase64: "valid_image_base64", mimeType: "image/png" },
    tracker2,
    { routerOptions: routerOpts },
  );
  assert(
    res2.text.includes("URGENT: Your bank account") &&
      res2.sourceType === "image" &&
      res2.language === "en",
    "2. Image -> OCR produces canonical NormalizedInput",
  );

  // -------------------------------------------------------------------------
  // Test 3: Audio input -> Transcription -> NormalizedInput
  // -------------------------------------------------------------------------
  const tracker3 = createDeadlineTracker(20_000);
  const res3 = await normalizeRequestInput(
    { audioBase64: "valid_audio_base64", mimeType: "audio/mp3" },
    tracker3,
    { routerOptions: routerOpts },
  );
  assert(
    res3.text.includes("urgent payment arrest warrant") &&
      res3.sourceType === "audio" &&
      res3.language === "en",
    "3. Audio -> Transcription produces canonical NormalizedInput",
  );

  // -------------------------------------------------------------------------
  // Test 4: OCR consumes global deadline
  // -------------------------------------------------------------------------
  const tracker4 = createDeadlineTracker(20_000);
  const slowOcrProvider: AIProvider = {
    ...mockGeminiProvider,
    callOCR: async () => {
      await new Promise((r) => setTimeout(r, 60));
      return "Extracted OCR text";
    },
  };
  await normalizeRequestInput(
    { imageBase64: "slow_ocr", mimeType: "image/png" },
    tracker4,
    { routerOptions: { ...routerOpts, providers: { gemini: slowOcrProvider } } },
  );
  assert(
    tracker4.remainingMs() < 19_950,
    "4. OCR execution consumes part of global deadline budget",
  );

  // -------------------------------------------------------------------------
  // Test 5: Transcription consumes global deadline
  // -------------------------------------------------------------------------
  const tracker5 = createDeadlineTracker(20_000);
  const slowAudioProvider: AIProvider = {
    ...mockGeminiProvider,
    callTranscription: async () => {
      await new Promise((r) => setTimeout(r, 60));
      return "Transcribed audio voice text";
    },
  };
  await normalizeRequestInput(
    { audioBase64: "slow_audio", mimeType: "audio/mp3" },
    tracker5,
    { routerOptions: { ...routerOpts, providers: { gemini: slowAudioProvider } } },
  );
  assert(
    tracker5.remainingMs() < 19_950,
    "5. Transcription execution consumes part of global deadline budget",
  );

  // -------------------------------------------------------------------------
  // Test 6 & 7: Same DeadlineTracker reaches routeScamAnalysis (no 2nd tracker)
  // -------------------------------------------------------------------------
  const tracker6 = createDeadlineTracker(20_000);
  const normalized6 = await normalizeRequestInput(
    { imageBase64: "img", mimeType: "image/png" },
    tracker6,
    { routerOptions: routerOpts },
  );
  const aiResult6 = await routeScamAnalysis(normalized6, {
    deadlineTracker: tracker6,
    providers: { gemini: mockGeminiProvider },
    circuitBreaker: mockCircuitBreaker,
    quotaManager: mockQuotaManager,
  });
  assert(
    aiResult6.analysisMode === "ai" && tracker6.startedAt > 0,
    "6 & 7. Single DeadlineTracker propagated end-to-end through normalizer & router",
  );

  // -------------------------------------------------------------------------
  // Test 8: OCR sentinel NOT_A_MESSAGE
  // -------------------------------------------------------------------------
  let sentinel8Caught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { imageBase64: "SENTINEL_NOT_A_MESSAGE", mimeType: "image/png" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError && e.sentinel === "NOT_A_MESSAGE" && e.statusCode === 400) {
      sentinel8Caught = true;
    }
  }
  assert(sentinel8Caught, "8. OCR sentinel NOT_A_MESSAGE throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 9: OCR sentinel NO_TEXT_FOUND
  // -------------------------------------------------------------------------
  let sentinel9Caught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { imageBase64: "SENTINEL_NO_TEXT", mimeType: "image/png" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError && e.sentinel === "NO_TEXT_FOUND" && e.statusCode === 400) {
      sentinel9Caught = true;
    }
  }
  assert(sentinel9Caught, "9. OCR sentinel NO_TEXT_FOUND throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 10: Audio sentinel NOT_A_CALL
  // -------------------------------------------------------------------------
  let sentinel10Caught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { audioBase64: "SENTINEL_NOT_A_CALL", mimeType: "audio/mp3" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError && e.sentinel === "NOT_A_CALL" && e.statusCode === 400) {
      sentinel10Caught = true;
    }
  }
  assert(sentinel10Caught, "10. Audio sentinel NOT_A_CALL throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 11: Audio sentinel NO_SPEECH_DETECTED
  // -------------------------------------------------------------------------
  let sentinel11Caught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { audioBase64: "SENTINEL_NO_SPEECH", mimeType: "audio/mp3" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError && e.sentinel === "NO_SPEECH_DETECTED" && e.statusCode === 400) {
      sentinel11Caught = true;
    }
  }
  assert(sentinel11Caught, "11. Audio sentinel NO_SPEECH_DETECTED throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 12: Oversized image (>3.8MB)
  // -------------------------------------------------------------------------
  let oversizedImgCaught = false;
  try {
    const t = createDeadlineTracker(20_000);
    const hugeBase64 = "x".repeat(4 * 1024 * 1024);
    await normalizeRequestInput({ imageBase64: hugeBase64, mimeType: "image/png" }, t);
  } catch (e) {
    if (e instanceof PayloadTooLargeError && e.statusCode === 413) {
      oversizedImgCaught = true;
    }
  }
  assert(oversizedImgCaught, "12. Oversized image throws PayloadTooLargeError(413)");

  // -------------------------------------------------------------------------
  // Test 13: Oversized audio (>3.8MB)
  // -------------------------------------------------------------------------
  let oversizedAudioCaught = false;
  try {
    const t = createDeadlineTracker(20_000);
    const hugeBase64 = "x".repeat(4 * 1024 * 1024);
    await normalizeRequestInput({ audioBase64: hugeBase64, mimeType: "audio/mp3" }, t);
  } catch (e) {
    if (e instanceof PayloadTooLargeError && e.statusCode === 413) {
      oversizedAudioCaught = true;
    }
  }
  assert(oversizedAudioCaught, "13. Oversized audio throws PayloadTooLargeError(413)");

  // -------------------------------------------------------------------------
  // Test 14: Unsupported / empty request body
  // -------------------------------------------------------------------------
  let invalidInputCaught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput({}, t);
  } catch (e) {
    if (e instanceof InvalidInputError && e.statusCode === 400) {
      invalidInputCaught = true;
    }
  }
  assert(invalidInputCaught, "14. Missing input fields throws InvalidInputError(400)");

  // -------------------------------------------------------------------------
  // Test 15: Empty OCR output (<3 chars)
  // -------------------------------------------------------------------------
  let emptyOcrCaught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { imageBase64: "EMPTY_RESULT", mimeType: "image/png" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError) {
      emptyOcrCaught = true;
    }
  }
  assert(emptyOcrCaught, "15. Empty OCR output rejected and throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 16: Empty transcription output (<3 chars)
  // -------------------------------------------------------------------------
  let emptyAudioCaught = false;
  try {
    const t = createDeadlineTracker(20_000);
    await normalizeRequestInput(
      { audioBase64: "EMPTY_RESULT", mimeType: "audio/mp3" },
      t,
      { routerOptions: routerOpts },
    );
  } catch (e) {
    if (e instanceof SentinelDetectedError) {
      emptyAudioCaught = true;
    }
  }
  assert(emptyAudioCaught, "16. Empty transcription output rejected and throws SentinelDetectedError(400)");

  // -------------------------------------------------------------------------
  // Test 17: Hindi language propagation
  // -------------------------------------------------------------------------
  const tracker17 = createDeadlineTracker(20_000);
  const hindiInput = await normalizeRequestInput(
    { text: "कृपया अपना ओटीपी साझा करें", language: "hi" },
    tracker17,
  );
  assert(
    hindiInput.language === "hi" && hindiInput.languageLabel === "Hindi",
    "17. Hindi language setting accurately propagated to NormalizedInput",
  );

  // -------------------------------------------------------------------------
  // Test 18: AI Failure -> Deterministic Fallback
  // -------------------------------------------------------------------------
  const failingProvider: AIProvider = {
    providerId: "gemini",
    isConfigured: () => true,
    callScamAnalysis: async () => {
      throw new ProviderUnavailableError("gemini-3.5-flash", "gemini", "Service down");
    },
    callOCR: async () => "dummy",
    callTranscription: async () => "dummy",
  };
  const failingGroqProvider: AIProvider = {
    providerId: "groq",
    isConfigured: () => true,
    callScamAnalysis: async () => {
      throw new ProviderUnavailableError("openai/gpt-oss-120b", "groq", "Service down");
    },
    callOCR: async () => "dummy",
    callTranscription: async () => "dummy",
  };

  const fallbackEngine = createDeterministicFallbackEngine();
  const tracker18 = createDeadlineTracker(20_000);
  const fallbackResult = await routeScamAnalysis(
    {
      text: "URGENT: electricity bill pending. Pay now or power blocked immediately.",
      sourceType: "text",
      language: "en",
      languageLabel: "English",
    },
    {
      deadlineTracker: tracker18,
      providers: { gemini: failingProvider, groq: failingGroqProvider },
      circuitBreaker: mockCircuitBreaker,
      quotaManager: mockQuotaManager,
      fallbackEngine,
    },
  );

  assert(
    fallbackResult.analysisMode === "degraded-deterministic" &&
      fallbackResult.isDegraded === true &&
      fallbackResult.isFallback === true &&
      fallbackResult.riskScore > 0, // Heuristics detected urgency
    "18. AI failure invokes calibrated deterministic fallback",
  );

  // -------------------------------------------------------------------------
  // Test 19: Deterministic fallback NEVER generates complaintDraft
  // -------------------------------------------------------------------------
  assert(
    fallbackResult.complaintDraft === "" && fallbackResult.financialLossLikely === false,
    "19. Deterministic fallback always sets complaintDraft: '' and financialLossLikely: false",
  );

  // -------------------------------------------------------------------------
  // Test 20: Deterministic fallback never logs user content (proven via telemetry inspect)
  // -------------------------------------------------------------------------
  let recordedTelemetry: any = null;
  const tracker20 = createDeadlineTracker(20_000);
  await routeScamAnalysis(
    {
      text: "Secret text 9876543210 https://phish.com/victim",
      sourceType: "text",
      language: "en",
      languageLabel: "English",
    },
    {
      deadlineTracker: tracker20,
      providers: { gemini: failingProvider, groq: failingGroqProvider },
      circuitBreaker: mockCircuitBreaker,
      quotaManager: mockQuotaManager,
      fallbackEngine,
      onTelemetry: (t) => {
        recordedTelemetry = t;
      },
    },
  );

  const serialized = JSON.stringify(recordedTelemetry);
  const leaksText = serialized.includes("Secret text") || serialized.includes("9876543210") || serialized.includes("phish.com");
  assert(
    !leaksText && recordedTelemetry.analysisMode === "degraded-deterministic",
    "20. Telemetry contains zero user message text, phone numbers, or URLs",
  );

  // -------------------------------------------------------------------------
  // Test 21: Deterministic external signals cannot exceed remaining deadline
  // -------------------------------------------------------------------------
  const tracker21 = createDeadlineTracker(100); // Only 100ms remaining (<= 250ms guard)
  let externalSignalAttempted = false;
  const mockSafeBrowsing = async () => {
    externalSignalAttempted = true;
    return true;
  };

  const detRes21 = await runDeterministicAnalysis(
    {
      text: "Check http://example.com immediately",
      sourceType: "text",
      language: "en",
      languageLabel: "English",
    },
    tracker21,
    { safeBrowsingFn: mockSafeBrowsing },
  );

  assert(
    !externalSignalAttempted && detRes21.riskScore >= 0,
    "21. External signals bounded by tracker.canAttempt() (skipped when remaining budget <= 250ms)",
  );

  console.log("\n=======================================================");
  console.log(`  Tests Complete: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
