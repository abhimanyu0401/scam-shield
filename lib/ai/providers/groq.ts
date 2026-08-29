/**
 * lib/ai/providers/groq.ts
 *
 * Groq provider adapter for the Scam Shield AI resilience subsystem.
 *
 * Uses native fetch — no new dependencies beyond what is already in package.json.
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 *
 * Design rules:
 *   - This provider only implements callScamAnalysis.
 *   - callOCR and callTranscription throw UnsupportedCapabilityError immediately
 *     (GPT-OSS 120B is text-only in the current registry).
 *   - The AbortSignal from the deadline layer is passed directly to fetch's
 *     `signal` option — fetch natively honours it.
 *   - If fetch throws a DOMException/AbortError because the signal fired, we
 *     rethrow as TimeoutError.
 *   - The Retry-After header from 429 responses is parsed and passed to
 *     RateLimitedError. The provider does NOT delay or retry — that is the
 *     router's responsibility.
 *   - Uses the exact same scam-analysis prompt as the Gemini provider.
 *     No Groq-specific prompt instructions are added.
 *   - Only the five-field ParsedAIResponse is returned; router metadata
 *     (modelId, providerId, latencyMs, isFallback, isDegraded, analysisMode)
 *     is attached by the router, never here.
 *   - No credentials, no user message content is logged.
 */

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
// 1. Prompt Builder (identical to gemini.ts — same source of truth)
// ---------------------------------------------------------------------------

/**
 * Builds the production scam-analysis prompt.
 *
 * This is a verbatim copy of the template literal in
 * app/api/check/route.ts lines 244–270.
 *
 * Both providers use the same prompt — any divergence is a bug.
 * DO NOT add Groq-specific system prompts or instructions here.
 */
function buildScamAnalysisPrompt(
  text: string,
  languageLabel: "English" | "Hindi",
): string {
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

IMPORTANT: Write the "explanation" field in ${languageLabel}. Keep all "flags" array values in English. Write "complaintDraft" in English regardless of language setting.

Message to analyze:
"""
${text}
"""
`;
}

// ---------------------------------------------------------------------------
// 2. Groq Structured Output Schema
// ---------------------------------------------------------------------------

/**
 * Strict JSON schema for GPT-OSS 120B on Groq.
 *
 * Uses `strict: true` and `additionalProperties: false` to prevent the model
 * from adding extra top-level keys that would fail schema validation.
 *
 * This object is passed verbatim as `response_format` in the request body.
 */
const GROQ_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "scam_shield_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        riskScore: {
          type: "integer",
          description: "Risk score from 0 to 100",
        },
        flags: {
          type: "array",
          items: { type: "string" },
          description: "Red flags detected",
        },
        explanation: {
          type: "string",
          description: "Plain language explanation",
        },
        financialLossLikely: {
          type: "boolean",
          description: "Whether financial loss has already occurred",
        },
        complaintDraft: {
          type: "string",
          description: "Chakshu fraud complaint draft",
        },
      },
      required: [
        "riskScore",
        "flags",
        "explanation",
        "financialLossLikely",
        "complaintDraft",
      ],
      additionalProperties: false,
    },
  },
} as const;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ---------------------------------------------------------------------------
// 3. HTTP Error Mapper
// ---------------------------------------------------------------------------

/**
 * Maps an HTTP status code from the Groq API to the correct typed error.
 *
 * @param status       - HTTP response status code.
 * @param modelId      - Model that was being called.
 * @param retryAfterS  - Parsed Retry-After header value (seconds), or null.
 * @param body         - Raw response body text (for error messages — never logged to console).
 */
function mapGroqHttpError(
  status: number,
  modelId: string,
  retryAfterS: number | null,
  body: string,
): never {
  // Truncate body for error messages — avoid accidentally leaking large payloads.
  const bodyPreview = body.length > 120 ? body.slice(0, 120) + "…" : body;

  switch (true) {
    case status === 401 || status === 403:
      throw new AuthError(
        modelId,
        "groq",
        status as 401 | 403,
        `Groq auth error (${status})`,
      );
    case status === 400:
      throw new BadRequestError(
        modelId,
        "groq",
        `Groq bad request: ${bodyPreview}`,
      );
    case status === 404:
      throw new ModelNotFoundError(modelId, "groq");
    case status === 429:
      throw new RateLimitedError(
        modelId,
        "groq",
        retryAfterS,
        `Groq rate limited (429)`,
      );
    case status === 503:
      throw new ProviderUnavailableError(
        modelId,
        "groq",
        `Groq service unavailable (503)`,
      );
    case status === 500 || status === 502:
      throw new ServerError(
        modelId,
        "groq",
        status as 500 | 502,
        `Groq server error (${status})`,
      );
    default:
      throw new NetworkFailureError(
        modelId,
        "groq",
        `Groq unexpected HTTP ${status}`,
      );
  }
}

/**
 * Parses the Retry-After header value into seconds.
 * Returns null if the header is absent or unparseable.
 *
 * The header can be either a delta-seconds integer or an HTTP-date string.
 * We only handle the delta-seconds form here (most common for API rate limits).
 */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = parseInt(value, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

// ---------------------------------------------------------------------------
// 4. GroqProvider
// ---------------------------------------------------------------------------

export class GroqProvider implements AIProvider {
  readonly providerId = "groq" as const;

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
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
    _audioData?: { data: string; mimeType: string } | null,
  ): Promise<ParsedAIResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Treat missing key as AuthError — router will skip Groq gracefully
      throw new AuthError(
        modelId,
        "groq",
        401,
        "GROQ_API_KEY is not configured",
      );
    }

    const prompt = buildScamAnalysisPrompt(text, languageLabel);

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization header is never logged — only constructed inline here
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
          response_format: GROQ_RESPONSE_FORMAT,
        }),
      });
    } catch (fetchErr: unknown) {
      // Distinguish AbortError (signal fired) from network failure
      if (
        fetchErr instanceof Error &&
        (fetchErr.name === "AbortError" ||
          fetchErr.message.toLowerCase().includes("aborted") ||
          (signal.aborted))
      ) {
        throw new TimeoutError(modelId, "groq", 0);
      }
      throw new NetworkFailureError(
        modelId,
        "groq",
        `Groq network failure: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
        fetchErr,
      );
    }

    const retryAfterS = parseRetryAfter(response.headers.get("retry-after"));

    if (!response.ok) {
      let body = "";
      try { body = await response.text(); } catch { /* ignore read failure */ }
      mapGroqHttpError(response.status, modelId, retryAfterS, body);
    }

    // Parse the OpenAI-compatible response envelope
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new SchemaValidationError(
        modelId,
        "groq",
        ["Response body is not valid JSON"],
        "",
      );
    }

    const rawContent: string =
      (data as { choices?: Array<{ message?: { content?: string } }> })
        ?.choices?.[0]?.message?.content ?? "";

    const validation = validateAIResponse(rawContent);
    if (!validation.valid) {
      throw new SchemaValidationError(
        modelId,
        "groq",
        validation.errors,
        rawContent,
      );
    }

    return validation.parsed;
  }

  // -------------------------------------------------------------------------
  // callOCR — not supported
  // -------------------------------------------------------------------------

  async callOCR(
    modelId: string,
    _imageBase64: string,
    _mimeType: string,
    _signal: AbortSignal,
  ): Promise<string> {
    throw new UnsupportedCapabilityError(modelId, "groq", "image");
  }

  // -------------------------------------------------------------------------
  // callTranscription — not supported
  // -------------------------------------------------------------------------

  async callTranscription(
    modelId: string,
    _audioBase64: string,
    _mimeType: string,
    _signal: AbortSignal,
  ): Promise<string> {
    throw new UnsupportedCapabilityError(modelId, "groq", "audio");
  }
}

/**
 * Singleton instance for use throughout the application.
 * Do not construct GroqProvider ad-hoc — always import this.
 */
export const groqProvider = new GroqProvider();
