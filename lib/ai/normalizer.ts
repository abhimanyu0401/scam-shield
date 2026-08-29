/**
 * lib/ai/normalizer.ts
 *
 * Request Normalization & Multimodal Convergence Layer for Scam Shield.
 *
 * Responsibilities:
 *   1. Accepts raw incoming request payloads across all supported modalities:
 *        - Text: { text, language }
 *        - Image: { imageBase64, mimeType, language }
 *        - Audio: { audioBase64, mimeType, language }
 *   2. Validates payload sizes and MIME requirements.
 *   3. Dispatches OCR and audio transcription via the B4 router (routeOCR, routeTranscription)
 *      using the single request-level DeadlineTracker (never creating an independent tracker).
 *   4. Validates extracted text against domain sentinels (e.g. NOT_A_MESSAGE, NOT_A_CALL).
 *   5. Emits a clean, canonical NormalizedInput ready for downstream AI reasoning or fallback.
 *
 * Invariants:
 *   - Exactly ONE DeadlineTracker controls the entire request. Preprocessing consumes from it.
 *   - Preserves exact legacy error messages and status codes for backward compatibility.
 *   - Never sends empty or failed OCR/transcription text into scam analysis.
 */

import type { NormalizedInput, InputSourceType, LanguageCode } from "./types";
import type { DeadlineTracker } from "./deadline";
import { routeOCR, routeTranscription, type RouterOptions } from "./router";

// ---------------------------------------------------------------------------
// 1. Validation & Preprocessing Constants
// ---------------------------------------------------------------------------

/**
 * Maximum allowed base64 string length (~3.8MB, corresponding to ~2.5MB binary payload).
 * Preserves the exact limit enforced in legacy production.
 */
export const MAX_BASE64_PAYLOAD_LENGTH = 3.8 * 1024 * 1024;

/** Minimum length of readable text required after OCR/transcription. */
export const MIN_EXTRACTED_TEXT_LENGTH = 3;

/** Normalizes audio MIME types for Gemini API compatibility. */
export function normalizeAudioMimeType(mime: string): string {
  const clean = mime.toLowerCase().trim();
  const map: Record<string, string> = {
    "audio/mp3": "audio/mp3",
    "audio/mpeg": "audio/mp3",
    "audio/wav": "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/ogg": "audio/ogg",
    "audio/opus": "audio/ogg",
    "audio/webm": "audio/webm",
    "audio/aac": "audio/aac",
    "audio/m4a": "audio/aac",
    "audio/x-m4a": "audio/aac",
    "audio/mp4": "audio/mp4",
    "audio/flac": "audio/flac",
    "audio/x-flac": "audio/flac",
  };
  return map[clean] || clean;
}

// ---------------------------------------------------------------------------
// 2. Normalization Error Hierarchy
// ---------------------------------------------------------------------------

/**
 * Base class for all normalization and preprocessing validation errors.
 */
export abstract class NormalizationError extends Error {
  abstract readonly statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = "NormalizationError";
  }
}

/**
 * Thrown when an uploaded image or audio payload exceeds size limits.
 * Preserves legacy HTTP 413 responses.
 */
export class PayloadTooLargeError extends NormalizationError {
  readonly statusCode = 413;
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

/**
 * Thrown when request payload fields are missing, empty, or have invalid types.
 * Preserves legacy HTTP 400 responses.
 */
export class InvalidInputError extends NormalizationError {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

/**
 * Thrown when OCR or audio transcription returns a recognized rejection sentinel
 * (e.g. NOT_A_MESSAGE, NO_TEXT_FOUND, NOT_A_CALL, NO_SPEECH_DETECTED).
 * Preserves legacy HTTP 400 responses and exact user-facing advice strings.
 */
export class SentinelDetectedError extends NormalizationError {
  readonly statusCode = 400;
  readonly sentinel: string;

  constructor(sentinel: string, userMessage: string) {
    super(userMessage);
    this.name = "SentinelDetectedError";
    this.sentinel = sentinel;
  }
}

// ---------------------------------------------------------------------------
// 3. Raw Request Body Contract
// ---------------------------------------------------------------------------

export interface RawRequestBody {
  text?: unknown;
  imageBase64?: unknown;
  audioBase64?: unknown;
  mimeType?: unknown;
  language?: unknown;
}

// ---------------------------------------------------------------------------
// 4. Normalization Pipeline
// ---------------------------------------------------------------------------

/**
 * Options for normalizing request input.
 */
export interface NormalizerOptions {
  /** Injectable router options for OCR/audio transcription (e.g. for mock testing). */
  routerOptions?: RouterOptions;
}

/**
 * Normalizes any incoming request body into a canonical NormalizedInput.
 *
 * Sequence:
 *   1. Determine language selection (defaults to "en", supports "hi").
 *   2. Identify modality:
 *      - Audio: validate size, dispatch routeTranscription(tracker), inspect sentinels.
 *      - Image: validate size, dispatch routeOCR(tracker), inspect sentinels.
 *      - Text: validate non-empty string.
 *   3. Return minimal canonical NormalizedInput.
 *
 * @param body     - The unvalidated JSON body from the incoming HTTP request.
 * @param tracker  - The single request-level DeadlineTracker initialized at request start.
 * @param options  - Optional configuration or mock overrides.
 *
 * @throws PayloadTooLargeError   - Payload exceeds 3.8MB base64 limit (HTTP 413).
 * @throws InvalidInputError      - Missing fields or empty text (HTTP 400).
 * @throws SentinelDetectedError  - Modality sentinel detected (HTTP 400).
 * @throws AIProviderError        - Underlying AI preprocessing failure (e.g. TimeoutError).
 */
export async function normalizeRequestInput(
  body: RawRequestBody | null | undefined,
  tracker: DeadlineTracker,
  options: NormalizerOptions = {},
): Promise<NormalizedInput> {
  if (!body || typeof body !== "object") {
    throw new InvalidInputError(
      "Missing 'text', 'imageBase64', or 'audioBase64' field in request body.",
    );
  }

  // --- 1. Language Resolution ---
  const language: LanguageCode = body.language === "hi" ? "hi" : "en";
  const languageLabel: "English" | "Hindi" = language === "hi" ? "Hindi" : "English";

  let textToAnalyze = "";
  let sourceType: InputSourceType = "text";
  let audioData: { data: string; mimeType: string } | null = null;

  // --- 2. Modality Intake & Preprocessing ---
  if (body.audioBase64 && body.mimeType) {
    sourceType = "audio";

    if (typeof body.audioBase64 !== "string" || typeof body.mimeType !== "string") {
      throw new InvalidInputError("Invalid audioBase64 or mimeType format.");
    }

    if (body.audioBase64.length > MAX_BASE64_PAYLOAD_LENGTH) {
      throw new PayloadTooLargeError(
        "Audio file too large. Please keep it under 2.5MB.",
      );
    }

    const normalizedMimeType = normalizeAudioMimeType(body.mimeType);

    audioData = {
      data: body.audioBase64,
      mimeType: normalizedMimeType,
    };

    // Call transcription through the AI router, reusing the single request DeadlineTracker
    const transcription = await routeTranscription(
      body.audioBase64,
      normalizedMimeType,
      {
        deadlineTracker: tracker,
        ...options.routerOptions,
      },
    );

    const cleanAudioText = transcription.trim();

    // Sentinel inspections matching exact legacy behavior
    if (cleanAudioText.includes("NOT_A_CALL")) {
      throw new SentinelDetectedError(
        "NOT_A_CALL",
        "This doesn't look like a voice note or call recording. Try uploading a suspicious voice message or call excerpt.",
      );
    }

    const isTimestampOrSilenceArtifact =
      /^\s*(\[?\d{1,2}:\d{2}(?::\d{2})?\]?|\.{1,4}|--:--)\s*$/i.test(cleanAudioText) ||
      /^[\s\W\d_]+$/.test(cleanAudioText);

    if (
      !cleanAudioText ||
      cleanAudioText.includes("NO_SPEECH_DETECTED") ||
      cleanAudioText.includes("NO_SPEECH_FOUND") ||
      cleanAudioText.length < MIN_EXTRACTED_TEXT_LENGTH ||
      isTimestampOrSilenceArtifact
    ) {
      throw new SentinelDetectedError(
        "NO_SPEECH_DETECTED",
        "No readable speech was detected in this audio. Try a clearer voice note or call recording.",
      );
    }

    textToAnalyze = cleanAudioText;
  } else if (body.imageBase64 && body.mimeType) {
    sourceType = "image";

    if (typeof body.imageBase64 !== "string" || typeof body.mimeType !== "string") {
      throw new InvalidInputError("Invalid imageBase64 or mimeType format.");
    }

    if (body.imageBase64.length > MAX_BASE64_PAYLOAD_LENGTH) {
      throw new PayloadTooLargeError(
        "Image file too large. Please keep it under 2.5MB.",
      );
    }

    // Call OCR through the AI router, reusing the single request DeadlineTracker
    const ocrText = await routeOCR(
      body.imageBase64,
      body.mimeType,
      {
        deadlineTracker: tracker,
        ...options.routerOptions,
      },
    );

    const cleanText = ocrText.trim();

    // Sentinel inspections matching exact legacy behavior
    if (cleanText.includes("NOT_A_MESSAGE")) {
      throw new SentinelDetectedError(
        "NOT_A_MESSAGE",
        "This doesn't look like a message screenshot. Try uploading a screenshot of a text, chat, or email.",
      );
    }

    if (
      !cleanText ||
      cleanText.includes("NO_TEXT_FOUND") ||
      cleanText.length < MIN_EXTRACTED_TEXT_LENGTH
    ) {
      throw new SentinelDetectedError(
        "NO_TEXT_FOUND",
        "No readable text was found in this image. Try a clearer screenshot.",
      );
    }

    textToAnalyze = cleanText;
  } else if (body.text) {
    sourceType = "text";

    if (typeof body.text !== "string") {
      throw new InvalidInputError("Field 'text' must be a string.");
    }

    textToAnalyze = body.text;
  } else {
    throw new InvalidInputError(
      "Missing 'text', 'imageBase64', or 'audioBase64' field in request body.",
    );
  }

  // --- 3. Final Validation ---
  const trimmedText = textToAnalyze.trim();
  if (trimmedText === "") {
    throw new InvalidInputError("Missing or empty text.");
  }

  return {
    text: trimmedText,
    sourceType,
    language,
    languageLabel,
    audioData,
  };
}
