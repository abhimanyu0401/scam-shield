/**
 * lib/ai/providers/gemini.ts
 *
 * Gemini provider adapter for the Scam Shield AI resilience subsystem.
 *
 * Uses the existing @google/genai SDK (already in package.json).
 * Wraps the three call types: scam analysis, OCR, and audio transcription.
 *
 * Design rules:
 *   - The AbortSignal comes from the deadline layer. This provider honours it
 *     by wrapping the SDK promise in a signal-aware race. If the signal fires,
 *     the error is rethrown as TimeoutError — not as a generic SDK error.
 *   - The SDK does not natively accept AbortSignal on generateContent.
 *     We implement abort by racing against a signal-triggered rejection.
 *   - Prompts are copied EXACTLY from app/api/check/route.ts. No alterations.
 *   - Only the five-field ParsedAIResponse is returned; router metadata
 *     (modelId, providerId, latencyMs, isFallback, isDegraded, analysisMode)
 *     is attached by the router, never here.
 *   - No credentials, no base64 payloads, no user message content is logged.
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { AIProvider } from "./base";
import type { ParsedAIResponse } from "../schema-validator";
import { validateAIResponse } from "../schema-validator";
import {
  AuthError,
  BadRequestError,
  ModelNotFoundError,
  NetworkFailureError,
  ProviderUnavailableError,
  RateLimitedError,
  SchemaValidationError,
  ServerError,
  TimeoutError,
  UnsupportedCapabilityError,
} from "../errors";

// ---------------------------------------------------------------------------
// 1. Prompt Constants (copied EXACTLY from production app/api/check/route.ts)
// ---------------------------------------------------------------------------

/**
 * Audio analysis instructions and strict guardrails for acoustic/cadence reasoning.
 */
const AUDIO_ANALYSIS_GUIDANCE = `
AUDIO ANALYSIS INSTRUCTIONS:
The attached audio is provided alongside the transcript above. In addition to analyzing the spoken words, evaluate the delivery, tone, cadence, and acoustic characteristics of the speech:

1. Audio-Specific Flags Vocabulary:
   - "Scripted or robotic delivery": The speaker sounds unnaturally mechanical, monotone, reading from a rigid script without natural human inflections, or exhibits artificial cadence.
   - "Generic call-center ambience": Background sounds characteristic of a call-center environment — overlapping call chatter, hold-queue noise, headset audio quality — rather than a single person's normal calling environment.
   - "Delivery inconsistent with message urgency": Specifically when the tone is flat, calm, or disengaged while the words describe severe/urgent consequences (e.g. claiming imminent arrest or account freeze in a routine, unemotional, or clearly prerecorded manner). Do not flag the reverse — a genuinely distressed or emotional speaker describing a real problem is not itself suspicious.

2. Guardrails (Strict):
   - Do NOT flag accent, non-native pronunciation, regional speech patterns, or speech impediments as robotic or scripted.
   - Do NOT attempt to identify, verify, or describe who the speaker is — no voice-biometric or speaker-identity judgments, only delivery characteristics of the speech itself.
   - Legitimate automated systems (bank IVR, appointment reminders) can sound robotic without being scams — treat delivery as one signal among several feeding the overall score, not a standalone verdict, and avoid flagging clearly-labeled automated/IVR systems just for sounding automated.
`;

/**
 * Builds the production scam-analysis prompt.
 */
function buildScamAnalysisPrompt(
  text: string,
  languageLabel: "English" | "Hindi",
  hasAudio = false,
): string {
  const audioGuidance = hasAudio ? AUDIO_ANALYSIS_GUIDANCE : "";

  return `Analyze the following message for scam patterns.
Return a JSON object with EXACTLY the following structure:
{
  "riskScore": number (0 to 100, where 100 is definite scam and 0 is completely safe),
  "flags": array of strings (specific red flags found, e.g., "Requests sensitive info"),
  "explanation": string (plain-language explanation of why it looks risky or safe),
  "financialLossLikely": boolean (true ONLY if the message text strongly suggests the recipient has ALREADY sent money, made a payment, or suffered a financial loss — e.g. "I already transferred", "money was deducted". False for suspected/attempted scams where no loss has occurred yet.),
  "complaintDraft": string (if riskScore >= 75, produce a filled-in fraud complaint draft in this format:
"Suspected Scam Type: [type, e.g. Bank KYC Fraud / OTP Scam / Lottery Fraud / Investment Scam / etc.]

Description: [2-3 sentence plain description of what the fraudulent message claimed and what it asked the recipient to do]

Entities Involved:
[List ONLY entities that actually appear in the message text — phone numbers, WhatsApp numbers, URLs/links, UPI IDs, email addresses, amounts of money mentioned. If none are present in the text, write: None identified in this message.]

Recommended Action: [one sentence on what the recipient should do next]"

If riskScore is below 75, return an empty string for this field. Extract entities only from what is literally present in the message — do not invent or guess.)
}
${audioGuidance}
IMPORTANT: Write the "explanation" field in ${languageLabel}. Keep all "flags" array values in English. Write "complaintDraft" in English regardless of language setting.

Message to analyze:
"""
${text}
"""
`;
}

/**
 * OCR extraction prompt.
 * Copied EXACTLY from app/api/check/route.ts line 109.
 */
const OCR_PROMPT =
  'Extract and return all the text visible in this image. If there is no text at all, output EXACTLY the word: NO_TEXT_FOUND. Do not add any extra commentary. If this image is not a screenshot of a text message, chat, or email — for example if it\'s a photo of a person, an object, or unrelated text like clothing or signage — respond with exactly NOT_A_MESSAGE instead of extracting the text.';

/**
 * Audio transcription prompt.
 * Copied EXACTLY from app/api/check/route.ts line 69.
 */
const TRANSCRIPTION_PROMPT =
  "Transcribe the spoken content of this audio accurately and completely. Do not judge or filter based on topic — transcribe any clear human speech regardless of subject matter, length, or whether it seems scam-related. If there is no discernible speech at all — for example silence, instrumental music with no vocals, or unintelligible noise — output EXACTLY the word: NO_SPEECH_DETECTED. Only if the audio is unambiguously not a voice recording at all — for example pure background/ambient noise, a sound effect, or music — respond with exactly NOT_A_CALL instead of transcribing. Any audio containing actual spoken words, on any topic, should be transcribed normally.";

// ---------------------------------------------------------------------------
// 2. Abort-aware SDK Call Helper
// ---------------------------------------------------------------------------

/**
 * Races a promise against an AbortSignal.
 *
 * The Gemini SDK's generateContent does not natively accept AbortSignal.
 * This helper wraps it in a race: if the signal fires before the SDK promise
 * resolves, we reject immediately with an "aborted" marker.
 *
 * Returns "aborted" sentinel (null) when the signal fires; throws on signal
 * already-aborted at call time.
 *
 * We use a sentinel rather than rejecting inside the race so the caller can
 * distinguish our abort from an SDK throw, allowing correct cleanup.
 */
async function raceWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T | "__ABORTED__"> {
  if (signal.aborted) {
    return "__ABORTED__";
  }
  return new Promise<T | "__ABORTED__">((resolve, reject) => {
    const onAbort = () => resolve("__ABORTED__");
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then((value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// 3. HTTP-status-to-error Mapper (for SDK errors that expose status)
// ---------------------------------------------------------------------------

/**
 * Maps a raw SDK or network error to the appropriate typed AIProviderError.
 *
 * The Gemini SDK throws Error objects whose message contains the HTTP status
 * string. We pattern-match conservatively — prefer checking known status
 * strings rather than treating all unknown errors as network failures.
 */
function classifyGeminiError(
  err: unknown,
  modelId: string,
): never {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // Abort is handled by raceWithAbort; if it leaks through, treat as timeout
  if (lower.includes("abort") || lower.includes("cancel")) {
    throw new TimeoutError(modelId, "gemini", 0);
  }

  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    throw new AuthError(modelId, "gemini", lower.includes("403") ? 403 : 401, `Gemini auth error: ${msg}`);
  }

  if (lower.includes("400") || lower.includes("bad request")) {
    throw new BadRequestError(modelId, "gemini", `Gemini bad request: ${msg}`);
  }

  if (lower.includes("404") || lower.includes("not found")) {
    throw new ModelNotFoundError(modelId, "gemini");
  }

  if (lower.includes("429") || lower.includes("resource_exhausted") || lower.includes("quota")) {
    throw new RateLimitedError(modelId, "gemini", null, `Gemini rate limited: ${msg}`);
  }

  if (lower.includes("503") || lower.includes("overloaded") || lower.includes("service unavailable")) {
    throw new ProviderUnavailableError(modelId, "gemini", `Gemini service unavailable: ${msg}`);
  }

  if (lower.includes("500") || lower.includes("502") || lower.includes("internal") || lower.includes("bad gateway")) {
    const status = lower.includes("502") ? 502 : 500;
    throw new ServerError(modelId, "gemini", status as 500 | 502, `Gemini server error: ${msg}`);
  }

  // Default: network-level failure
  throw new NetworkFailureError(modelId, "gemini", `Gemini network failure: ${msg}`, err);
}

// ---------------------------------------------------------------------------
// 4. GeminiProvider
// ---------------------------------------------------------------------------

export class GeminiProvider implements AIProvider {
  readonly providerId = "gemini" as const;

  /**
   * The SDK client is instantiated lazily on first use so that missing
   * GEMINI_API_KEY at module-load time does not crash the process.
   */
  private _client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this._client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }
      this._client = new GoogleGenAI({ apiKey });
    }
    return this._client;
  }

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  // -------------------------------------------------------------------------
  // callScamAnalysis
  // -------------------------------------------------------------------------

  async callScamAnalysis(
    modelId: string,
    text: string,
    _language: "en" | "hi",
    languageLabel: "English" | "Hindi",
    signal: AbortSignal,
    audioData?: { data: string; mimeType: string } | null,
  ): Promise<ParsedAIResponse> {
    const client = this.getClient();
    const hasAudio = Boolean(audioData?.data && audioData?.mimeType);
    const prompt = buildScamAnalysisPrompt(text, languageLabel, hasAudio);

    const contents = hasAudio && audioData
      ? [
          {
            inlineData: {
              mimeType: audioData.mimeType,
              data: audioData.data,
            },
          },
          {
            text: prompt,
          },
        ]
      : prompt;

    const sdkPromise = client.models.generateContent({
      model: modelId,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            financialLossLikely: { type: Type.BOOLEAN },
            complaintDraft: { type: Type.STRING },
          },
          required: [
            "riskScore",
            "flags",
            "explanation",
            "financialLossLikely",
            "complaintDraft",
          ],
        },
      },
    });

    let result: Awaited<typeof sdkPromise> | "__ABORTED__";
    try {
      result = await raceWithAbort(sdkPromise, signal);
    } catch (err) {
      classifyGeminiError(err, modelId); // always throws
    }

    if (result === "__ABORTED__") {
      throw new TimeoutError(modelId, "gemini", 0);
    }

    const rawText = (result as Awaited<typeof sdkPromise>).text ?? "";
    const validation = validateAIResponse(rawText);

    if (!validation.valid) {
      throw new SchemaValidationError(
        modelId,
        "gemini",
        validation.errors,
        rawText,
      );
    }

    return validation.parsed;
  }

  // -------------------------------------------------------------------------
  // callOCR
  // -------------------------------------------------------------------------

  async callOCR(
    modelId: string,
    imageBase64: string,
    mimeType: string,
    signal: AbortSignal,
  ): Promise<string> {
    const client = this.getClient();

    const sdkPromise = client.models.generateContent({
      model: modelId,
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        { text: OCR_PROMPT },
      ],
    });

    let result: Awaited<typeof sdkPromise> | "__ABORTED__";
    try {
      result = await raceWithAbort(sdkPromise, signal);
    } catch (err) {
      classifyGeminiError(err, modelId);
    }

    if (result === "__ABORTED__") {
      throw new TimeoutError(modelId, "gemini", 0);
    }

    return (result as Awaited<typeof sdkPromise>).text ?? "";
  }

  // -------------------------------------------------------------------------
  // callTranscription
  // -------------------------------------------------------------------------

  async callTranscription(
    modelId: string,
    audioBase64: string,
    mimeType: string,
    signal: AbortSignal,
  ): Promise<string> {
    const client = this.getClient();

    const sdkPromise = client.models.generateContent({
      model: modelId,
      contents: [
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
        { text: TRANSCRIPTION_PROMPT },
      ],
    });

    let result: Awaited<typeof sdkPromise> | "__ABORTED__";
    try {
      result = await raceWithAbort(sdkPromise, signal);
    } catch (err) {
      classifyGeminiError(err, modelId);
    }

    if (result === "__ABORTED__") {
      throw new TimeoutError(modelId, "gemini", 0);
    }

    return (result as Awaited<typeof sdkPromise>).text ?? "";
  }

  // -------------------------------------------------------------------------
  // callEmbedding
  // -------------------------------------------------------------------------

  /**
   * Generates a 3072-dimension semantic vector embedding for the given text using
   * the gemini-embedding-001 model with RETRIEVAL_QUERY task type.
   *
   * Designed to match the precomputed scam-pattern embeddings in scam-pattern-embeddings.json
   * (which were generated with gemini-embedding-001 and RETRIEVAL_DOCUMENT).
   *
   * Bounded by the passed AbortSignal.
   * Returns null if unconfigured, aborted, timed out, or on SDK failure (fail-open).
   */
  async callEmbedding(
    text: string,
    signal: AbortSignal,
    modelId: string = "gemini-embedding-001",
    taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
  ): Promise<number[] | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const client = this.getClient();
      const sdkPromise = client.models.embedContent({
        model: modelId,
        contents: trimmed,
        config: {
          taskType,
        },
      });

      const result = await raceWithAbort(sdkPromise, signal);
      if (result === "__ABORTED__") {
        return null;
      }

      const resObj = result as {
        embedding?: { values?: number[] };
        embeddings?: Array<{ values?: number[] }>;
      };

      const values =
        resObj?.embedding?.values ??
        resObj?.embeddings?.[0]?.values ??
        null;

      if (Array.isArray(values) && values.length > 0) {
        return values;
      }

      return null;
    } catch {
      // Fail-open: embedding generation failure must never block or crash the request
      return null;
    }
  }
}

/**
 * Singleton instance for use throughout the application.
 * Do not construct GeminiProvider ad-hoc — always import this.
 */
export const geminiProvider = new GeminiProvider();

// Prevent accidental OCR/audio calls via text-only paths.
// (Not needed for Gemini since it supports all modalities, but exported for
//  consistency with the UnsupportedCapabilityError convention.)
export { UnsupportedCapabilityError };
