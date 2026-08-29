/**
 * lib/ai/providers/base.ts
 *
 * Abstract interface that every AI provider adapter must implement.
 *
 * Design rules:
 *   - The router and normalizer depend ONLY on this interface.
 *   - Provider implementation details (SDK, fetch, auth) never leak upward.
 *   - AbortSignal is passed IN by the router — providers must honour it.
 *   - Providers never set their own timeouts; they receive the signal from
 *     the deadline layer, which has already applied min(maxTimeoutMs, remaining).
 *   - All methods return the raw validated string (scam analysis) or raw
 *     transcription/OCR text; router-level metadata is attached by the router.
 *   - All error paths throw a typed subclass from lib/ai/errors.ts.
 */

import type { ParsedAIResponse } from "../schema-validator";

// ---------------------------------------------------------------------------
// 1. Provider Interface
// ---------------------------------------------------------------------------

/**
 * The contract every AI provider adapter must satisfy.
 *
 * Three call types correspond to the three modalities that flow through the
 * AI resilience layer:
 *
 *   callScamAnalysis  — text reasoning (all models)
 *   callOCR           — image-to-text extraction (Gemini only for now)
 *   callTranscription — audio-to-text extraction (Gemini only for now)
 *
 * Models that do not support OCR or transcription must throw
 * UnsupportedCapabilityError from those methods, never silently no-op.
 */
export interface AIProvider {
  /**
   * Identifies this provider in logs and telemetry.
   * Must never contain credentials or keys.
   */
  readonly providerId: "gemini" | "groq";

  /**
   * Returns true if the provider's API key is present in the environment.
   * The router calls this before dispatching — if false, the model is skipped
   * without counting as a circuit failure.
   */
  isConfigured(): boolean;

  /**
   * Runs the scam-analysis prompt against the specified model and returns
   * a validated ParsedAIResponse.
   *
   * @param modelId   - The exact model identifier from MODEL_REGISTRY.
   * @param text      - The normalized plain text to analyze.
   * @param language  - Language code for explanation generation.
   * @param languageLabel - Human-readable label injected into the prompt.
   * @param signal    - AbortSignal owned by the deadline layer. The provider
   *                    must propagate this to the underlying network call.
   *                    An abort caused by this signal must be rethrown as
   *                    TimeoutError, not as a generic error.
   *
   * @returns ParsedAIResponse — the validated five-field object.
   * @throws  TimeoutError              — signal aborted
   * @throws  RateLimitedError          — provider HTTP 429
   * @throws  ProviderUnavailableError  — provider HTTP 503
   * @throws  ServerError               — provider HTTP 500 / 502
   * @throws  AuthError                 — provider HTTP 401 / 403
   * @throws  BadRequestError           — provider HTTP 400
   * @throws  ModelNotFoundError        — provider HTTP 404
   * @throws  SchemaValidationError     — HTTP 200 but schema mismatch
   * @throws  NetworkFailureError       — pre-HTTP network problem
   */
  callScamAnalysis(
    modelId: string,
    text: string,
    language: "en" | "hi",
    languageLabel: "English" | "Hindi",
    signal: AbortSignal,
  ): Promise<ParsedAIResponse>;

  /**
   * Extracts all visible text from a base64-encoded image.
   *
   * Returns the raw OCR string. Sentinel validation (NOT_A_MESSAGE,
   * NO_TEXT_FOUND) is performed by the normalizer, not this method.
   *
   * @param modelId       - Must be a model with capabilities.image === true.
   * @param imageBase64   - Raw base64 payload (no data-URI prefix).
   * @param mimeType      - MIME type of the image (e.g. "image/jpeg").
   * @param signal        - AbortSignal from the deadline layer.
   *
   * @returns Raw OCR text string (may contain sentinel keywords).
   * @throws  UnsupportedCapabilityError — if this provider does not support OCR.
   * @throws  TimeoutError | RateLimitedError | ... (same as callScamAnalysis)
   */
  callOCR(
    modelId: string,
    imageBase64: string,
    mimeType: string,
    signal: AbortSignal,
  ): Promise<string>;

  /**
   * Transcribes spoken content from a base64-encoded audio clip.
   *
   * Returns the raw transcription string. Sentinel validation (NOT_A_CALL,
   * NO_SPEECH_DETECTED) is performed by the normalizer, not this method.
   *
   * @param modelId       - Must be a model with capabilities.audio === true.
   * @param audioBase64   - Raw base64 payload (no data-URI prefix).
   * @param mimeType      - MIME type of the audio (e.g. "audio/mpeg").
   * @param signal        - AbortSignal from the deadline layer.
   *
   * @returns Raw transcription string (may contain sentinel keywords).
   * @throws  UnsupportedCapabilityError — if this provider does not support audio.
   * @throws  TimeoutError | RateLimitedError | ... (same as callScamAnalysis)
   */
  callTranscription(
    modelId: string,
    audioBase64: string,
    mimeType: string,
    signal: AbortSignal,
  ): Promise<string>;
}
