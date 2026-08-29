/**
 * lib/ai/schema-validator.ts
 *
 * Strict server-side validator for the Scam Shield AI response schema.
 *
 * Responsibilities:
 *   - Parses the raw JSON string from any AI provider.
 *   - Validates that the response contains EXACTLY the five required fields,
 *     no more and no less.
 *   - Validates the type and value constraints of each field.
 *   - Returns a typed ValidationResult — never throws.
 *
 * This module is extracted from the Phase A.2 benchmark harness (run-benchmark.ts)
 * and adapted to production use. The validation logic is identical to the harness
 * so benchmark and production agree on what constitutes a valid response.
 *
 * No imports from other lib/ai modules — this module must be usable standalone.
 */

// ---------------------------------------------------------------------------
// 1. Result Types
// ---------------------------------------------------------------------------

/** The valid parsed response shape expected from any AI provider. */
export interface ParsedAIResponse {
  riskScore: number;
  flags: string[];
  explanation: string;
  financialLossLikely: boolean;
  complaintDraft: string;
}

/** Returned by validateAIResponse. Success carries the typed parsed object. */
export type ValidationResult =
  | { valid: true; parsed: ParsedAIResponse; errors: [] }
  | { valid: false; parsed: null; errors: string[] };

// ---------------------------------------------------------------------------
// 2. Allowed Keys (source of truth)
// ---------------------------------------------------------------------------

/**
 * Exactly these five top-level keys are permitted.
 * Any extra key or any missing key is a validation failure.
 */
const REQUIRED_KEYS: ReadonlyArray<string> = [
  "riskScore",
  "flags",
  "explanation",
  "financialLossLikely",
  "complaintDraft",
] as const;

const ALLOWED_KEYS_SET = new Set(REQUIRED_KEYS);

// ---------------------------------------------------------------------------
// 3. Core Validator
// ---------------------------------------------------------------------------

/**
 * Parses and validates a raw JSON string from an AI provider.
 *
 * Validation rules (all must pass for valid === true):
 *   1. The string is valid JSON.
 *   2. The root value is a non-null, non-array object.
 *   3. All five required keys are present.
 *   4. No extra top-level keys are present.
 *   5. riskScore is an integer in [0, 100].
 *   6. flags is a non-null array where every element is a string.
 *   7. explanation is a string.
 *   8. financialLossLikely is a boolean.
 *   9. complaintDraft is a string.
 *
 * Strips Markdown code fences before parsing (some models wrap JSON in ```json).
 *
 * @param rawResponse - The raw string from the AI provider response.
 * @returns A ValidationResult — never throws.
 */
export function validateAIResponse(rawResponse: string): ValidationResult {
  const errors: string[] = [];

  // --- Step 1: Strip Markdown code fence wrappers ---
  const cleaned = rawResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // --- Step 2: Parse JSON ---
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr: unknown) {
    const msg =
      parseErr instanceof SyntaxError ? parseErr.message : String(parseErr);
    return {
      valid: false,
      parsed: null,
      errors: [`Malformed JSON: ${msg}`],
    };
  }

  // --- Step 3: Root value must be a non-null, non-array object ---
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {
      valid: false,
      parsed: null,
      errors: ["Response is not a JSON object"],
    };
  }

  const obj = parsed as Record<string, unknown>;

  // --- Step 4: Check for missing required keys ---
  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) {
      errors.push(`Missing required field: '${key}'`);
    }
  }

  // --- Step 5: Check for unexpected extra keys ---
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_KEYS_SET.has(key)) {
      errors.push(`Unexpected extra top-level field: '${key}'`);
    }
  }

  // --- Step 6: riskScore — must be an integer in [0, 100] ---
  const rs = obj["riskScore"];
  if (
    typeof rs !== "number" ||
    !Number.isInteger(rs) ||
    rs < 0 ||
    rs > 100
  ) {
    errors.push(
      `Invalid riskScore: must be an integer 0–100, received ${JSON.stringify(rs)}`,
    );
  }

  // --- Step 7: flags — must be an array of strings ---
  const flags = obj["flags"];
  if (
    !Array.isArray(flags) ||
    !(flags as unknown[]).every((f) => typeof f === "string")
  ) {
    errors.push("Invalid flags: must be an array of strings");
  }

  // --- Step 8: explanation — must be a string ---
  if (typeof obj["explanation"] !== "string") {
    errors.push("Invalid explanation: must be a string");
  }

  // --- Step 9: financialLossLikely — must be a boolean ---
  if (typeof obj["financialLossLikely"] !== "boolean") {
    errors.push(
      "Invalid financialLossLikely: must be a boolean",
    );
  }

  // --- Step 10: complaintDraft — must be a string ---
  if (typeof obj["complaintDraft"] !== "string") {
    errors.push("Invalid complaintDraft: must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, parsed: null, errors };
  }

  // All checks passed — safe to cast
  return {
    valid: true,
    parsed: {
      riskScore: obj["riskScore"] as number,
      flags: obj["flags"] as string[],
      explanation: obj["explanation"] as string,
      financialLossLikely: obj["financialLossLikely"] as boolean,
      complaintDraft: obj["complaintDraft"] as string,
    },
    errors: [],
  };
}
