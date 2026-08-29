/**
 * lib/ai/types.ts
 *
 * Core shared contracts for the Scam Shield AI resilience subsystem.
 *
 * Design rules:
 *   - No runtime side-effects — pure type declarations only.
 *   - No imports from other lib/ai modules (this is the root contract file).
 *   - All other lib/ai modules import from here, never cross-import types.
 */

// ---------------------------------------------------------------------------
// 1. Input & Language Contracts
// ---------------------------------------------------------------------------

/** The raw modality of the user's input, before normalization. */
export type InputSourceType = "text" | "image" | "audio";

/** Supported UI languages for explanation generation. */
export type LanguageCode = "en" | "hi";

/**
 * The unified representation of user input after multimodal normalization.
 * All downstream scam reasoning operates on this type — it has no knowledge
 * of whether the original input was text, an image, or an audio recording.
 */
export interface NormalizedInput {
  /** The plain text that will be submitted to the reasoning model. */
  text: string;

  /** The original input modality, preserved for telemetry and routing hints. */
  sourceType: InputSourceType;

  /** The language code for explanation generation. */
  language: LanguageCode;

  /** The human-readable language label injected into the AI prompt. */
  languageLabel: "English" | "Hindi";

  /** Preserved raw audio data for multimodal acoustic analysis (if input was audio). */
  audioData?: {
    data: string;
    mimeType: string;
  } | null;

  /** Metadata extracted during normalization, available to enrichment steps. */
  extractedMetadata?: {
    /** All URLs found in the normalized text. */
    urls: string[];

    /** Phone numbers found in the normalized text (if any). */
    phoneNumbers?: string[];

    /** Character length of the raw OCR output (for image inputs). */
    rawOcrLength?: number;

    /** Audio duration in milliseconds (for audio inputs). */
    audioDurationMs?: number;
  };
}

// ---------------------------------------------------------------------------
// 2. Model Capability Contracts
// ---------------------------------------------------------------------------

/**
 * Declares which input modalities a model natively supports.
 * The router filters the model registry by requiredCapability before
 * dispatching — a model is never selected for a modality it cannot handle.
 */
export interface ModelCapabilities {
  /** Can perform text-based scam reasoning. */
  text: boolean;

  /** Can perform inline image OCR (base64 + mimeType). */
  image: boolean;

  /** Can perform inline audio transcription (base64 + mimeType). */
  audio: boolean;
}

// ---------------------------------------------------------------------------
// 3. AI Analysis Response Contracts
// ---------------------------------------------------------------------------

/**
 * Indicates whether the result was produced by an AI model or by the
 * deterministic fallback engine.
 *
 * IMPORTANT: This field must never be omitted or defaulted.
 *   "ai"                    → response from a live AI model
 *   "degraded-deterministic"→ response from rule-based fallback only
 *
 * The UI uses this field to render the appropriate result state and must
 * never treat a degraded result as an AI result.
 */
export type AnalysisMode = "ai" | "degraded-deterministic";

/**
 * The fully typed AI analysis result returned by any provider adapter,
 * the adaptive router, or the deterministic fallback engine.
 *
 * Fields match the existing /api/check external response contract exactly.
 * `analysisMode` is the only intentionally new consumer-visible field.
 */
export interface AIAnalysisResponse {
  /** Integer 0–100. Risk estimate. In degraded mode: rule-based severity band. */
  riskScore: number;

  /** Specific red flags detected. In degraded mode: rule-triggered flags only. */
  flags: string[];

  /**
   * Plain-language explanation.
   * In degraded mode: a fixed template string indicating AI is unavailable.
   * Language-aware.
   */
  explanation: string;

  /**
   * True ONLY when the message text strongly suggests the recipient HAS ALREADY
   * suffered a financial loss. Always false in degraded mode (insufficient signal).
   */
  financialLossLikely: boolean;

  /**
   * Fraud complaint draft text.
   * Present when riskScore >= 75 and analysisMode === "ai".
   * Always "" when analysisMode === "degraded-deterministic".
   */
  complaintDraft: string;

  /** The exact modelId that produced this result (or "deterministic-fallback"). */
  modelId: string;

  /** The provider that produced this result. */
  providerId: "gemini" | "groq" | "deterministic";

  /** Wall-clock milliseconds from dispatch to response for this model attempt. */
  latencyMs: number;

  /**
   * True when a lower-priority model was used because higher-priority models
   * failed, timed out, or had exhausted quota.
   */
  isFallback: boolean;

  /**
   * True when the result was produced by the deterministic fallback engine,
   * meaning no AI model was available.
   */
  isDegraded: boolean;

  /**
   * Explicit, never-implied field distinguishing AI from deterministic results.
   *
   * "ai"                     → any live AI model responded
   * "degraded-deterministic" → all AI models failed; rule-based engine used
   */
  analysisMode: AnalysisMode;
}

/**
 * The complete response payload returned by POST /api/check.
 * Extends AIAnalysisResponse with the fields added by the route orchestrator.
 */
export interface FinalCheckResponse extends AIAnalysisResponse {
  /** The normalized text that was analyzed (the text the AI actually saw). */
  text: string;

  /** Server-generated UUID for community report linking (15-min TTL in Redis). */
  analysisId: string;

  /**
   * The 3072-dimension query embedding generated by gemini-embedding-001.
   * Null when embedding generation failed (never blocks the main analysis).
   */
  embedding: number[] | null;

  /** ISO-8601 timestamp of when the analysis was completed. */
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// 4. Quota & Circuit Contracts
// ---------------------------------------------------------------------------

/**
 * Result of an atomic pre-call quota reservation attempt.
 *
 * ALLOWED         → a quota slot was successfully reserved; proceed with the call.
 * QUOTA_EXHAUSTED → no slot available; skip this model.
 *                   MUST NOT trip the provider circuit breaker.
 *                   MUST NOT be exposed in the public API response.
 *                   Log/telemetry only.
 */
export type QuotaStatus = "ALLOWED" | "QUOTA_EXHAUSTED";

/**
 * The three canonical circuit breaker states.
 *
 * CLOSED    → model is healthy; requests flow normally.
 * OPEN      → model is in cooldown after repeated failures; requests are blocked.
 * HALF_OPEN → cooldown has elapsed; one probe request is allowed through.
 *             - Probe success → CLOSED (reset failure count)
 *             - Probe failure → OPEN (restart cooldown timer)
 */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/** The full circuit breaker record stored in Redis. */
export interface CircuitRecord {
  state: CircuitState;

  /** Consecutive retryable failure count. Reset to 0 on any success. */
  failureCount: number;

  /**
   * Unix-ms timestamp when the circuit moved to OPEN.
   * Present only when state === "OPEN".
   */
  openedAt?: number;
}

// ---------------------------------------------------------------------------
// 5. Telemetry Contract
// ---------------------------------------------------------------------------

/**
 * Structured telemetry record emitted after each /api/check request.
 * All fields containing user content are excluded (redaction policy).
 */
export interface RequestTelemetry {
  requestId: string;
  timestamp: string;
  sourceType: InputSourceType;
  language: LanguageCode;

  /** All model IDs that were attempted, in order. */
  modelsAttempted: string[];

  /** The model ID that produced the final result (or "deterministic-fallback"). */
  modelSelected: string;

  /** Number of model attempts before a result was obtained. */
  attemptCount: number;

  /** True if any fallback model was used. */
  fallbackUsed: boolean;

  /** True if the deterministic fallback engine produced the final result. */
  isDegraded: boolean;

  analysisMode: AnalysisMode;

  /** Total elapsed ms from request start to response (includes all phases). */
  totalLatencyMs: number;

  /** Final risk score (integer 0–100). */
  riskScore: number;

  /** Number of flags in the final result. */
  flagsCount: number;

  status: "SUCCESS" | "DEGRADED" | "ERROR";
}
