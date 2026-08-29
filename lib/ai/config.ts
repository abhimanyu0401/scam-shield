/**
 * lib/ai/config.ts
 *
 * Model registry, deadline constants, and circuit-breaker configuration
 * for the Scam Shield AI resilience subsystem.
 *
 * Design rules:
 *   - This is the ONLY place model IDs, timeouts, quotas, and capabilities
 *     are declared. Business logic never hardcodes these values.
 *   - `maxTimeoutMs` is the MAXIMUM individual-attempt budget.
 *     The actual effective timeout is always:
 *       effectiveTimeoutMs = Math.min(model.maxTimeoutMs, remainingMs)
 *     where remainingMs is computed from the absolute deadline timestamp.
 *   - Adding, removing, or updating a model requires ONLY a change to
 *     MODEL_REGISTRY — no other files need to change.
 *   - GPT-OSS 120B is text-only until multimodal capability is explicitly
 *     verified and this config is updated.
 *
 * Deadline semantics (CRITICAL):
 *   The global deadline is an ABSOLUTE TIMESTAMP, not a sum of timeouts.
 *
 *   deadlineAt = startedAt + GLOBAL_AI_DEADLINE_MS
 *   remainingMs = deadlineAt - Date.now()  // recalculated before EVERY operation
 *
 *   4 × maxTimeoutMs might sum to less than 20 000, but the ceiling is the
 *   absolute deadline — whichever is reached first.
 *
 *   This constant is consumed by lib/ai/deadline.ts.
 */

import type { ModelCapabilities } from "./types";

// ---------------------------------------------------------------------------
// 1. Global Deadline & Minimum Budget Guard
// ---------------------------------------------------------------------------

/**
 * Hard ceiling on the total AI orchestration phase (normalization + all model
 * attempts combined). The deadline tracker enforces this as an absolute
 * timestamp, not a sum of individual model timeouts.
 *
 * Return immediately on success — this is the maximum, not a target wait.
 */
export const GLOBAL_AI_DEADLINE_MS = 20_000;

/**
 * Minimum remaining budget required before initiating a new provider network
 * request. If the remaining global budget is at or below this value, the router
 * must NOT open a new connection and must proceed directly to the deterministic
 * fallback.
 *
 * Rationale: opening a TCP connection + TLS handshake + DNS lookup already
 * consumes tens of milliseconds. A request that cannot possibly complete
 * before the deadline wastes resources and delays the fallback.
 */
export const MIN_REMAINING_MS_TO_ATTEMPT = 250;

// ---------------------------------------------------------------------------
// 2. ModelDefinition Interface
// ---------------------------------------------------------------------------

/**
 * Complete definition of a single model in the production fallback hierarchy.
 *
 * All fields are required — no optional fields, no defaults computed at
 * runtime from other fields.
 */
export interface ModelDefinition {
  /**
   * The exact model identifier string to pass to the provider API.
   * Must match the provider's own model name exactly (case-sensitive).
   */
  modelId: string;

  /** Which provider hosts this model. */
  provider: "gemini" | "groq";

  /**
   * Selection priority. Lower value = higher priority.
   * Values must be unique across the registry.
   * The router evaluates models in ascending priority order.
   */
  priority: number;

  /**
   * Maximum individual-attempt timeout in milliseconds.
   *
   * This is a CEILING, not a fixed wait. The router always computes:
   *   effectiveTimeoutMs = Math.min(maxTimeoutMs, remainingBudget)
   *
   * A successful response is returned immediately regardless of this value.
   */
  maxTimeoutMs: number;

  /** Maximum requests per minute the router is allowed to dispatch to this model. */
  maxRpm: number;

  /** Maximum requests per day the router is allowed to dispatch to this model. */
  maxRpd: number;

  /**
   * How structured output is requested from this model.
   *
   * "sdk_response_schema"  → Gemini @google/genai native JSON schema
   * "strict_json_schema"   → Groq json_schema with strict:true
   * "json_object"          → Groq json_object mode (not used in production registry)
   */
  structuredOutputMode:
    | "sdk_response_schema"
    | "strict_json_schema"
    | "json_object";

  /**
   * Input modality capabilities.
   * The router filters by required capability before dispatching.
   * A model is NEVER selected for a modality where the capability is false.
   */
  capabilities: ModelCapabilities;

  /**
   * When false the router skips this model entirely, as if it were not in
   * the registry. Use to disable a model without removing its configuration.
   */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// 3. Production Model Registry
// ---------------------------------------------------------------------------

/**
 * The authoritative ordered fallback hierarchy for Scam Shield production.
 *
 * Evaluation order: priority 1 → 2 → 3 → 4.
 *
 * DO NOT add models here without explicit approval.
 * DO NOT hardcode model IDs anywhere else in the codebase.
 *
 * Capability matrix:
 *   Gemini models:   text ✅  image ✅  audio ✅
 *   GPT-OSS 120B:    text ✅  image ❌  audio ❌  (text-only until verified)
 */
export const MODEL_REGISTRY: ReadonlyArray<ModelDefinition> = [
  // ---------------------------------------------------------------------------
  // Priority 1 — Primary model (low-latency, high-throughput)
  // ---------------------------------------------------------------------------
  {
    modelId: "gemini-3.5-flash-lite",
    provider: "gemini",
    priority: 1,
    maxTimeoutMs: 6_000,
    maxRpm: 30,
    maxRpd: 1_500,
    structuredOutputMode: "sdk_response_schema",
    capabilities: { text: true, image: true, audio: true },
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Priority 2 — Same-provider secondary (higher quality, same provider)
  // ---------------------------------------------------------------------------
  {
    modelId: "gemini-3.5-flash",
    provider: "gemini",
    priority: 2,
    maxTimeoutMs: 6_000,
    maxRpm: 15,
    maxRpd: 1_000,
    structuredOutputMode: "sdk_response_schema",
    capabilities: { text: true, image: true, audio: true },
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Priority 3 — Same-provider tertiary (capacity fallback)
  // ---------------------------------------------------------------------------
  {
    modelId: "gemini-3.1-flash-lite",
    provider: "gemini",
    priority: 3,
    maxTimeoutMs: 5_000,
    maxRpm: 30,
    maxRpd: 1_500,
    structuredOutputMode: "sdk_response_schema",
    capabilities: { text: true, image: true, audio: true },
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Priority 4 — Cross-provider fallback (Groq, text-only)
  //
  // GPT-OSS 120B does NOT support image or audio inputs.
  // capabilities.image and capabilities.audio are explicitly false.
  // The capability filter in the router ensures this model is NEVER selected
  // for image OCR or audio transcription workloads.
  // ---------------------------------------------------------------------------
  {
    modelId: "openai/gpt-oss-120b",
    provider: "groq",
    priority: 4,
    maxTimeoutMs: 5_000,
    maxRpm: 30,
    maxRpd: 1_000,
    structuredOutputMode: "strict_json_schema",
    capabilities: { text: true, image: false, audio: false },
    enabled: true,
  },
] as const;

// ---------------------------------------------------------------------------
// 4. Circuit Breaker Configuration
// ---------------------------------------------------------------------------

export interface CircuitBreakerConfig {
  /**
   * Number of consecutive retryable failures required to trip a circuit
   * from CLOSED to OPEN.
   */
  failureThreshold: number;

  /**
   * Duration in milliseconds that a circuit stays OPEN before transitioning
   * to HALF_OPEN for a probe attempt.
   */
  cooldownMs: number;

  /**
   * Number of probe requests allowed through in HALF_OPEN state.
   * The first real production request acts as the probe.
   */
  halfOpenProbeCount: number;
}

export const CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownMs: 30_000,
  halfOpenProbeCount: 1,
};

// ---------------------------------------------------------------------------
// 5. Registry Accessor Utilities
// ---------------------------------------------------------------------------

/**
 * Returns models from the registry that:
 *   1. Are enabled.
 *   2. Support the required input capability.
 *
 * Results are sorted in ascending priority order (lowest number first).
 *
 * The router calls this at the start of each orchestration to obtain its
 * candidate list — it never filters the registry itself.
 */
export function getEligibleModels(
  requiredCapability: keyof ModelCapabilities,
): ModelDefinition[] {
  return MODEL_REGISTRY.filter(
    (m) => m.enabled && m.capabilities[requiredCapability] === true,
  ).sort((a, b) => a.priority - b.priority);
}

/**
 * Returns the ModelDefinition for a specific modelId.
 * Returns undefined if the model is not in the registry (or is disabled).
 */
export function getModelById(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((m) => m.modelId === modelId);
}
