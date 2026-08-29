/**
 * lib/ai/router.ts
 *
 * Adaptive AI Model Router & Orchestration Layer for Scam Shield.
 *
 * Responsibilities:
 *   1. Model registry & capability routing (via getEligibleModels from config.ts).
 *   2. Enforces absolute 20-second global AI deadline (via DeadlineTracker).
 *   3. Enforces Redis-backed circuit breaker (canAttempt, recordSuccess, recordFailure).
 *   4. Enforces atomic quota reservation per model (tryReserveQuota).
 *   5. Calculates bounded individual attempt timeouts: min(maxTimeoutMs, remainingMs).
 *   6. Dispatches to AIProvider adapters (geminiProvider, groqProvider).
 *   7. Handles typed error classification and circuit failure reporting.
 *   8. Automatic same-provider and cross-provider model fallback.
 *   9. Degraded deterministic fallback adapter when all AI attempts fail.
 *  10. Telemetry generation (metadata-only, strictly redacting all user content).
 *
 * Design rules:
 *   - NEVER hardcodes model lists or priorities (consumes config.ts).
 *   - NEVER directly imports @google/genai or invokes fetch() (uses AIProvider interface).
 *   - NEVER creates independent 20s timers per model.
 *   - NEVER records circuit failures for QuotaExhaustedError or SchemaValidationError.
 *   - Degraded mode always returns analysisMode: "degraded-deterministic" with complaintDraft: "".
 *   - Full dependency injection support for headless/mock unit testing.
 */

import type {
  AIAnalysisResponse,
  AnalysisMode,
  NormalizedInput,
  RequestTelemetry,
} from "./types";
import {
  AIProviderError,
  isAIProviderError,
  isCircuitFailure,
  ProviderUnavailableError,
  QuotaExhaustedError,
  TimeoutError,
} from "./errors";
import {
  getEligibleModels,
  type ModelDefinition,
} from "./config";
import {
  createDeadlineTracker,
  type DeadlineTracker,
} from "./deadline";
import {
  tryReserveQuota,
} from "./quota-manager";
import {
  canAttempt,
  recordFailure,
  recordSuccess,
  revertHalfOpen,
  type AttemptDecision,
} from "./circuit-breaker";
import type { AIProvider } from "./providers/base";
import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";

// ---------------------------------------------------------------------------
// 1. Telemetry Types & Skip / Error Definitions
// ---------------------------------------------------------------------------

export type ModelSkipReason =
  | "UNCONFIGURED"
  | "CIRCUIT_OPEN"
  | "CIRCUIT_PROBE_BUSY"
  | "QUOTA_EXHAUSTED"
  | "DEADLINE_EXHAUSTED"
  | "UNSUPPORTED_CAPABILITY";

export interface ModelSkipRecord {
  modelId: string;
  provider: "gemini" | "groq";
  reason: ModelSkipReason;
}

/**
 * Metadata-only record of a failed provider attempt.
 * Strictly excludes any user text, prompt contents, URLs, phone numbers,
 * provider response payloads, or credentials.
 */
export interface AttemptErrorRecord {
  modelId: string;
  errorType: string;
  httpStatus?: number;
  isRetryable?: boolean;
  countsAsCircuitFailure?: boolean;
}

export interface RouterTelemetry extends RequestTelemetry {
  modelsConsidered: string[];
  modelsSkipped: ModelSkipRecord[];
  attemptErrors: AttemptErrorRecord[];
}

/**
 * Metadata-only telemetry record for multimodal operations (OCR and audio transcription).
 */
export interface MultimodalTelemetry {
  requestId: string;
  operation: "ocr" | "transcription";
  timestamp: string;
  modelsConsidered: string[];
  modelsAttempted: string[];
  modelsSkipped: ModelSkipRecord[];
  attemptErrors: AttemptErrorRecord[];
  modelSelected: string | null;
  providerSelected: "gemini" | "groq" | null;
  attemptCount: number;
  totalLatencyMs: number;
  status: "SUCCESS" | "ERROR";
}

// ---------------------------------------------------------------------------
// 2. Deterministic Fallback Contract
// ---------------------------------------------------------------------------

/**
 * Functional contract for deterministic fallback synthesis.
 * Can be overridden via RouterOptions for rich heuristic evaluation in later phases.
 */
export type DeterministicFallbackEngine = (
  input: NormalizedInput,
  tracker: DeadlineTracker,
  telemetry: RouterTelemetry,
) => Promise<AIAnalysisResponse> | AIAnalysisResponse;

/**
 * B4 fallback adapter / placeholder.
 *
 * NOTE ON SEMANTICS:
 *   - This is a minimal B4 fallback adapter to fulfill the degraded contract.
 *   - The rich deterministic heuristic analysis (regex patterns, Safe Browsing,
 *     embeddings) will be integrated in the later fallback/normalization phase (B5/B6).
 *   - In this minimal adapter, riskScore: 0 and flags: [] signify:
 *     "AI is unavailable and no downstream deterministic analysis has been executed yet."
 *     It does NOT signify that the message has been proven safe.
 */
function defaultFallbackEngine(
  input: NormalizedInput,
  tracker: DeadlineTracker,
  _telemetry: RouterTelemetry,
): AIAnalysisResponse {
  const elapsedMs = Date.now() - tracker.startedAt;
  const isHindi = input.language === "hi";

  return {
    riskScore: 0,
    flags: [],
    explanation: isHindi
      ? "एआई विश्लेषण वर्तमान में अनुपलब्ध है। कृपया सावधानी बरतें।"
      : "AI analysis is temporarily unavailable. Please exercise caution with this message.",
    financialLossLikely: false,
    complaintDraft: "",
    modelId: "deterministic-fallback",
    providerId: "deterministic",
    latencyMs: elapsedMs,
    isFallback: true,
    isDegraded: true,
    analysisMode: "degraded-deterministic",
  };
}

// ---------------------------------------------------------------------------
// 3. Router Options & Dependency Injection
// ---------------------------------------------------------------------------

export interface RouterOptions {
  /** Optional pre-existing deadline tracker for this request lifecycle. */
  deadlineTracker?: DeadlineTracker;

  /** Optional request ID for telemetry correlation. */
  requestId?: string;

  /** Dependency injection for provider implementations. */
  providers?: Partial<Record<"gemini" | "groq", AIProvider>>;

  /** Dependency injection for circuit breaker operations. */
  circuitBreaker?: {
    canAttempt: (modelId: string) => Promise<AttemptDecision>;
    recordSuccess: (modelId: string) => Promise<void>;
    recordFailure: (modelId: string, error: AIProviderError) => Promise<void>;
    revertHalfOpen?: (modelId: string) => Promise<void>;
  };

  /** Dependency injection for quota manager. */
  quotaManager?: {
    tryReserveQuota: (model: ModelDefinition) => Promise<unknown>;
  };

  /** Dependency injection for deterministic fallback engine. */
  fallbackEngine?: DeterministicFallbackEngine;

  /** Optional callback invoked when router telemetry is finalized for scam analysis. */
  onTelemetry?: (telemetry: RouterTelemetry) => void;

  /** Optional callback invoked when multimodal telemetry is finalized (OCR / audio). */
  onMultimodalTelemetry?: (telemetry: MultimodalTelemetry) => void;
}

// Default provider map
const DEFAULT_PROVIDERS: Record<"gemini" | "groq", AIProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
};

// ---------------------------------------------------------------------------
// 4. Primary Scam Analysis Routing (`routeScamAnalysis`)
// ---------------------------------------------------------------------------

/**
 * Orchestrates scam analysis across eligible models in priority order.
 *
 * Sequence for each candidate model:
 *   1. Check remaining global deadline (> 250ms).
 *   2. Check if provider API key is configured.
 *   3. Check circuit breaker state (CLOSED / HALF_OPEN probe vs OPEN).
 *   4. Atomically reserve RPM/RPD quota slot (fails open on Redis down).
 *   5. Create bounded AbortSignal = min(model.maxTimeoutMs, remainingBudget).
 *   6. Dispatch call to provider adapter.
 *   7. On success: record circuit success, return immediately with analysisMode: "ai".
 *   8. On failure: record circuit failure if retryable/circuit-worthy, then try next model.
 *
 * If all AI models fail or deadline expires:
 *   Synthesizes a response with analysisMode: "degraded-deterministic", isDegraded: true,
 *   and complaintDraft: "".
 */
export async function routeScamAnalysis(
  input: NormalizedInput,
  options: RouterOptions = {},
): Promise<AIAnalysisResponse> {
  const tracker = options.deadlineTracker ?? createDeadlineTracker();
  const requestId = options.requestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : "req-unknown");

  const providers = { ...DEFAULT_PROVIDERS, ...options.providers };
  const cb = options.circuitBreaker ?? { canAttempt, recordSuccess, recordFailure, revertHalfOpen };
  const qm = options.quotaManager ?? { tryReserveQuota };
  const fallback = options.fallbackEngine ?? defaultFallbackEngine;

  // Retrieve candidate models ordered by priority for 'text' capability
  const eligibleModels = getEligibleModels("text");

  const telemetry: RouterTelemetry = {
    requestId,
    timestamp: new Date().toISOString(),
    sourceType: input.sourceType,
    language: input.language,
    modelsConsidered: eligibleModels.map((m) => m.modelId),
    modelsAttempted: [],
    modelsSkipped: [],
    attemptErrors: [],
    modelSelected: "deterministic-fallback",
    attemptCount: 0,
    fallbackUsed: false,
    isDegraded: true,
    analysisMode: "degraded-deterministic",
    totalLatencyMs: 0,
    riskScore: 0,
    flagsCount: 0,
    status: "DEGRADED",
  };

  let attemptIndex = 0;

  for (const model of eligibleModels) {
    // 1. Deadline guard — must have at least 250ms left to open a new connection
    if (!tracker.canAttempt()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "DEADLINE_EXHAUSTED",
      });
      break;
    }

    const provider = providers[model.provider];
    if (!provider) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "UNCONFIGURED",
      });
      continue;
    }

    // 2. Provider configuration guard (e.g. missing GROQ_API_KEY)
    if (!provider.isConfigured()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "UNCONFIGURED",
      });
      continue;
    }

    // 3. Circuit breaker permission check
    const decision = await cb.canAttempt(model.modelId);
    if (decision === "blocked") {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "CIRCUIT_OPEN",
      });
      continue;
    }

    let callDispatched = false;
    try {
      // 4. Pre-call atomic quota reservation
      try {
        await qm.tryReserveQuota(model);
      } catch (quotaErr: unknown) {
        if (quotaErr instanceof QuotaExhaustedError) {
          telemetry.modelsSkipped.push({
            modelId: model.modelId,
            provider: model.provider,
            reason: "QUOTA_EXHAUSTED",
          });
          // Quota exhaustion MUST NOT count as a circuit failure — proceed to next model
          continue;
        }

        // Unexpected quota manager error:
        // Do NOT classify as QUOTA_EXHAUSTED.
        // Do NOT record circuit failure unless it is an AIProviderError with countsAsCircuitFailure=true.
        telemetry.attemptErrors.push({
          modelId: model.modelId,
          errorType: quotaErr instanceof Error ? quotaErr.name : "QUOTA_MANAGER_ERROR",
          countsAsCircuitFailure: false,
          isRetryable: true,
        });

        console.warn(
          `[router] Unexpected quota manager error for model ${model.modelId}. Skipping model without tripping circuit.`,
        );
        continue;
      }

      // 5. Create bounded timeout handle
      const abortHandle = tracker.createAbortHandle(model.maxTimeoutMs);
      const attemptStart = Date.now();
      telemetry.modelsAttempted.push(model.modelId);
      telemetry.attemptCount++;
      attemptIndex++;

      try {
        callDispatched = true;
        const parsed = await provider.callScamAnalysis(
          model.modelId,
          input.text,
          input.language,
          input.languageLabel,
          abortHandle.signal,
        );

        // Clean up timer handle
        abortHandle.cancel();

        // 6. Record circuit success (especially critical for HALF_OPEN probes)
        await cb.recordSuccess(model.modelId);

        const attemptLatencyMs = Date.now() - attemptStart;
        const totalLatencyMs = Date.now() - tracker.startedAt;
        const isFallback = attemptIndex > 1;

        // Update telemetry
        telemetry.modelSelected = model.modelId;
        telemetry.fallbackUsed = isFallback;
        telemetry.isDegraded = false;
        telemetry.analysisMode = "ai";
        telemetry.totalLatencyMs = totalLatencyMs;
        telemetry.riskScore = parsed.riskScore;
        telemetry.flagsCount = parsed.flags.length;
        telemetry.status = "SUCCESS";

        if (options.onTelemetry) {
          options.onTelemetry(telemetry);
        }

        return {
          riskScore: parsed.riskScore,
          flags: parsed.flags,
          explanation: parsed.explanation,
          financialLossLikely: parsed.financialLossLikely,
          complaintDraft: parsed.complaintDraft,
          modelId: model.modelId,
          providerId: model.provider,
          latencyMs: attemptLatencyMs,
          isFallback,
          isDegraded: false,
          analysisMode: "ai",
        };
      } catch (err: unknown) {
        // Clean up timer handle
        abortHandle.cancel();

        if (isAIProviderError(err)) {
          // Record metadata-only attempt error
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err.errorType,
            httpStatus: err.httpStatus,
            isRetryable: err.isRetryable,
            countsAsCircuitFailure: err.countsAsCircuitFailure,
          });

          // Record circuit failure ONLY if error classifies as circuit-worthy
          if (isCircuitFailure(err)) {
            await cb.recordFailure(model.modelId, err);
          }

          // Fatal request-level errors: abort cascade immediately
          // (e.g. BadRequestError indicates the prompt/input is fundamentally malformed)
          if (err.errorType === "BAD_REQUEST_400" || err.errorType === "UNSUPPORTED_CAPABILITY") {
            telemetry.status = "ERROR";
            telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
            if (options.onTelemetry) {
              options.onTelemetry(telemetry);
            }
            throw err;
          }
        } else {
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err instanceof Error ? err.name : "UNKNOWN_ERROR",
            countsAsCircuitFailure: false,
            isRetryable: true,
          });
        }

        // Retryable or provider-specific configuration error: continue to next candidate
        continue;
      }
    } finally {
      if (decision === "probe" && !callDispatched) {
        if (cb.revertHalfOpen) {
          await cb.revertHalfOpen(model.modelId);
        }
      }
    }
  }

  // 7. All AI models failed or deadline elapsed — trigger degraded deterministic fallback
  const totalLatencyMs = Date.now() - tracker.startedAt;
  telemetry.totalLatencyMs = totalLatencyMs;

  const degradedResult = await fallback(input, tracker, telemetry);

  telemetry.riskScore = degradedResult.riskScore;
  telemetry.flagsCount = degradedResult.flags.length;
  telemetry.status = "DEGRADED";

  if (options.onTelemetry) {
    options.onTelemetry(telemetry);
  }

  return {
    ...degradedResult,
    analysisMode: "degraded-deterministic",
    isDegraded: true,
    isFallback: true,
    providerId: "deterministic",
    modelId: "deterministic-fallback",
    complaintDraft: "",
    financialLossLikely: false,
  };
}

// ---------------------------------------------------------------------------
// 5. Multimodal Image OCR Routing (`routeOCR`)
// ---------------------------------------------------------------------------

/**
 * Dispatches image OCR through image-capable models in priority order.
 * GPT-OSS 120B is automatically excluded because capabilities.image === false.
 *
 * @throws AIProviderError on failure (never returns empty string as a sentinel).
 */
export async function routeOCR(
  imageBase64: string,
  mimeType: string,
  options: RouterOptions = {},
): Promise<string> {
  const tracker = options.deadlineTracker ?? createDeadlineTracker();
  const requestId = options.requestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : "ocr-unknown");
  const providers = { ...DEFAULT_PROVIDERS, ...options.providers };
  const cb = options.circuitBreaker ?? { canAttempt, recordSuccess, recordFailure, revertHalfOpen };
  const qm = options.quotaManager ?? { tryReserveQuota };

  const eligibleModels = getEligibleModels("image");

  const telemetry: MultimodalTelemetry = {
    requestId,
    operation: "ocr",
    timestamp: new Date().toISOString(),
    modelsConsidered: eligibleModels.map((m) => m.modelId),
    modelsAttempted: [],
    modelsSkipped: [],
    attemptErrors: [],
    modelSelected: null,
    providerSelected: null,
    attemptCount: 0,
    totalLatencyMs: 0,
    status: "ERROR",
  };

  if (eligibleModels.length === 0) {
    telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
    if (options.onMultimodalTelemetry) {
      options.onMultimodalTelemetry(telemetry);
    }
    throw new ProviderUnavailableError(
      "ocr-pipeline",
      "gemini",
      "No image-capable models are configured in the model registry.",
    );
  }

  let lastError: AIProviderError | null = null;

  for (const model of eligibleModels) {
    if (!tracker.canAttempt()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "DEADLINE_EXHAUSTED",
      });
      break;
    }

    const provider = providers[model.provider];
    if (!provider || !provider.isConfigured()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "UNCONFIGURED",
      });
      continue;
    }

    const decision = await cb.canAttempt(model.modelId);
    if (decision === "blocked") {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "CIRCUIT_OPEN",
      });
      continue;
    }

    let callDispatched = false;
    try {
      try {
        await qm.tryReserveQuota(model);
      } catch (quotaErr: unknown) {
        if (quotaErr instanceof QuotaExhaustedError) {
          telemetry.modelsSkipped.push({
            modelId: model.modelId,
            provider: model.provider,
            reason: "QUOTA_EXHAUSTED",
          });
          continue;
        }
        telemetry.attemptErrors.push({
          modelId: model.modelId,
          errorType: quotaErr instanceof Error ? quotaErr.name : "QUOTA_MANAGER_ERROR",
          countsAsCircuitFailure: false,
          isRetryable: true,
        });
        continue;
      }

      const abortHandle = tracker.createAbortHandle(model.maxTimeoutMs);
      telemetry.modelsAttempted.push(model.modelId);
      telemetry.attemptCount++;

      try {
        callDispatched = true;
        const extractedText = await provider.callOCR(
          model.modelId,
          imageBase64,
          mimeType,
          abortHandle.signal,
        );

        abortHandle.cancel();
        await cb.recordSuccess(model.modelId);

        telemetry.modelSelected = model.modelId;
        telemetry.providerSelected = model.provider;
        telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
        telemetry.status = "SUCCESS";

        if (options.onMultimodalTelemetry) {
          options.onMultimodalTelemetry(telemetry);
        }

        return extractedText;
      } catch (err: unknown) {
        abortHandle.cancel();

        if (isAIProviderError(err)) {
          lastError = err;
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err.errorType,
            httpStatus: err.httpStatus,
            isRetryable: err.isRetryable,
            countsAsCircuitFailure: err.countsAsCircuitFailure,
          });

          if (isCircuitFailure(err)) {
            await cb.recordFailure(model.modelId, err);
          }
          if (err.errorType === "BAD_REQUEST_400" || err.errorType === "UNSUPPORTED_CAPABILITY") {
            telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
            if (options.onMultimodalTelemetry) {
              options.onMultimodalTelemetry(telemetry);
            }
            throw err;
          }
        } else {
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err instanceof Error ? err.name : "UNKNOWN_ERROR",
            countsAsCircuitFailure: false,
            isRetryable: true,
          });
        }
        continue;
      }
    } finally {
      if (decision === "probe" && !callDispatched) {
        if (cb.revertHalfOpen) {
          await cb.revertHalfOpen(model.modelId);
        }
      }
    }
  }

  telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
  if (options.onMultimodalTelemetry) {
    options.onMultimodalTelemetry(telemetry);
  }

  if (lastError) {
    throw lastError;
  }

  throw new TimeoutError("image-ocr", "gemini", tracker.remainingMs());
}

// ---------------------------------------------------------------------------
// 6. Multimodal Audio Transcription Routing (`routeTranscription`)
// ---------------------------------------------------------------------------

/**
 * Dispatches audio transcription through audio-capable models in priority order.
 * GPT-OSS 120B is automatically excluded because capabilities.audio === false.
 *
 * @throws AIProviderError on failure (never returns empty string as a sentinel).
 */
export async function routeTranscription(
  audioBase64: string,
  mimeType: string,
  options: RouterOptions = {},
): Promise<string> {
  const tracker = options.deadlineTracker ?? createDeadlineTracker();
  const requestId = options.requestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : "audio-unknown");
  const providers = { ...DEFAULT_PROVIDERS, ...options.providers };
  const cb = options.circuitBreaker ?? { canAttempt, recordSuccess, recordFailure, revertHalfOpen };
  const qm = options.quotaManager ?? { tryReserveQuota };

  const eligibleModels = getEligibleModels("audio");

  const telemetry: MultimodalTelemetry = {
    requestId,
    operation: "transcription",
    timestamp: new Date().toISOString(),
    modelsConsidered: eligibleModels.map((m) => m.modelId),
    modelsAttempted: [],
    modelsSkipped: [],
    attemptErrors: [],
    modelSelected: null,
    providerSelected: null,
    attemptCount: 0,
    totalLatencyMs: 0,
    status: "ERROR",
  };

  if (eligibleModels.length === 0) {
    telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
    if (options.onMultimodalTelemetry) {
      options.onMultimodalTelemetry(telemetry);
    }
    throw new ProviderUnavailableError(
      "transcription-pipeline",
      "gemini",
      "No audio-capable models are configured in the model registry.",
    );
  }

  let lastError: AIProviderError | null = null;

  for (const model of eligibleModels) {
    if (!tracker.canAttempt()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "DEADLINE_EXHAUSTED",
      });
      break;
    }

    const provider = providers[model.provider];
    if (!provider || !provider.isConfigured()) {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "UNCONFIGURED",
      });
      continue;
    }

    const decision = await cb.canAttempt(model.modelId);
    if (decision === "blocked") {
      telemetry.modelsSkipped.push({
        modelId: model.modelId,
        provider: model.provider,
        reason: "CIRCUIT_OPEN",
      });
      continue;
    }

    let callDispatched = false;
    try {
      try {
        await qm.tryReserveQuota(model);
      } catch (quotaErr: unknown) {
        if (quotaErr instanceof QuotaExhaustedError) {
          telemetry.modelsSkipped.push({
            modelId: model.modelId,
            provider: model.provider,
            reason: "QUOTA_EXHAUSTED",
          });
          continue;
        }
        telemetry.attemptErrors.push({
          modelId: model.modelId,
          errorType: quotaErr instanceof Error ? quotaErr.name : "QUOTA_MANAGER_ERROR",
          countsAsCircuitFailure: false,
          isRetryable: true,
        });
        continue;
      }

      const abortHandle = tracker.createAbortHandle(model.maxTimeoutMs);
      telemetry.modelsAttempted.push(model.modelId);
      telemetry.attemptCount++;

      try {
        callDispatched = true;
        const transcription = await provider.callTranscription(
          model.modelId,
          audioBase64,
          mimeType,
          abortHandle.signal,
        );

        abortHandle.cancel();
        await cb.recordSuccess(model.modelId);

        telemetry.modelSelected = model.modelId;
        telemetry.providerSelected = model.provider;
        telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
        telemetry.status = "SUCCESS";

        if (options.onMultimodalTelemetry) {
          options.onMultimodalTelemetry(telemetry);
        }

        return transcription;
      } catch (err: unknown) {
        abortHandle.cancel();

        if (isAIProviderError(err)) {
          lastError = err;
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err.errorType,
            httpStatus: err.httpStatus,
            isRetryable: err.isRetryable,
            countsAsCircuitFailure: err.countsAsCircuitFailure,
          });

          if (isCircuitFailure(err)) {
            await cb.recordFailure(model.modelId, err);
          }
          if (err.errorType === "BAD_REQUEST_400" || err.errorType === "UNSUPPORTED_CAPABILITY") {
            telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
            if (options.onMultimodalTelemetry) {
              options.onMultimodalTelemetry(telemetry);
            }
            throw err;
          }
        } else {
          telemetry.attemptErrors.push({
            modelId: model.modelId,
            errorType: err instanceof Error ? err.name : "UNKNOWN_ERROR",
            countsAsCircuitFailure: false,
            isRetryable: true,
          });
        }
        continue;
      }
    } finally {
      if (decision === "probe" && !callDispatched) {
        if (cb.revertHalfOpen) {
          await cb.revertHalfOpen(model.modelId);
        }
      }
    }
  }

  telemetry.totalLatencyMs = Date.now() - tracker.startedAt;
  if (options.onMultimodalTelemetry) {
    options.onMultimodalTelemetry(telemetry);
  }

  if (lastError) {
    throw lastError;
  }

  throw new TimeoutError("audio-transcription", "gemini", tracker.remainingMs());
}

