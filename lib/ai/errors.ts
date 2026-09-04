/**
 * lib/ai/errors.ts
 *
 * Typed error hierarchy for the Kinkeeper AI resilience subsystem.
 *
 * Design rules:
 *   - Every error is a typed subclass of AIProviderError.
 *   - `isRetryable` and `countsAsCircuitFailure` are set at construction time
 *     by each subclass — they are NOT computed by the caller.
 *   - The router reads these flags to decide: skip-and-continue vs abort.
 *   - This file is the ONLY place that encodes "what does this error mean"
 *     for routing purposes.
 *
 * Error classification table (authoritative):
 *
 *   Error class               | isRetryable | countsAsCircuitFailure | Action
 *   --------------------------|-------------|------------------------|-------------------
 *   QuotaExhaustedError       | false       | NO                     | Skip, try next
 *   RateLimitedError (429)    | true        | YES                    | Skip, try next
 *   ProviderUnavailableError  | true        | YES                    | Skip, try next
 *   TimeoutError              | true        | YES                    | Skip, try next
 *   ServerError (500/502)     | true        | YES                    | Skip, try next
 *   SchemaValidationError     | true        | NO                     | Skip, try next
 *   AuthError (401/403)       | false       | NO                     | Fatal — abort
 *   BadRequestError (400)     | false       | NO                     | Fatal — return 400
 *   ModelNotFoundError (404)  | false       | NO                     | Fatal — log alert
 *   UnsupportedCapabilityError| false       | NO                     | Fatal — code bug
 *   NetworkFailureError       | true        | YES                    | Skip, try next
 */

// ---------------------------------------------------------------------------
// 1. Error Type Enum
// ---------------------------------------------------------------------------

/**
 * Exhaustive set of classified error types.
 * Every AIProviderError carries exactly one of these.
 */
export type AIErrorType =
  | "QUOTA_EXHAUSTED"
  | "RATE_LIMITED_429"
  | "SERVICE_UNAVAILABLE_503"
  | "SERVER_ERROR_500_502"
  | "TIMEOUT"
  | "SCHEMA_VALIDATION_FAILED"
  | "AUTH_ERROR_401_403"
  | "BAD_REQUEST_400"
  | "MODEL_NOT_FOUND_404"
  | "UNSUPPORTED_CAPABILITY"
  | "NETWORK_FAILURE";

// ---------------------------------------------------------------------------
// 2. Base Error Class
// ---------------------------------------------------------------------------

/**
 * Base class for all AI provider errors in the resilience subsystem.
 *
 * Do not throw this class directly — always throw a typed subclass so
 * the router can branch on `instanceof` without inspecting error strings.
 */
export class AIProviderError extends Error {
  /** Discriminant type tag for routing decisions. */
  readonly errorType: AIErrorType;

  /** The model ID that was being called when the error occurred. */
  readonly modelId: string;

  /** The provider that was being called. */
  readonly providerId: "gemini" | "groq";

  /**
   * The HTTP status code, if available.
   * For non-HTTP errors (timeout, network), use the conventional code:
   *   TIMEOUT     → 504
   *   NETWORK     → 0
   */
  readonly httpStatus: number;

  /**
   * When true: the router should skip this model and attempt the next.
   * When false: the router should abort — do not attempt any further model.
   */
  readonly isRetryable: boolean;

  /**
   * When true: this error counts toward the circuit-breaker failure threshold.
   * When false: the circuit-breaker state is unaffected by this error.
   *
   * QUOTA_EXHAUSTED and SCHEMA_VALIDATION_FAILED must NEVER count as circuit failures.
   */
  readonly countsAsCircuitFailure: boolean;

  constructor(params: {
    errorType: AIErrorType;
    modelId: string;
    providerId: "gemini" | "groq";
    httpStatus: number;
    isRetryable: boolean;
    countsAsCircuitFailure: boolean;
    message: string;
    cause?: unknown;
  }) {
    super(params.message, params.cause !== undefined ? { cause: params.cause } : undefined);
    this.name = "AIProviderError";
    this.errorType = params.errorType;
    this.modelId = params.modelId;
    this.providerId = params.providerId;
    this.httpStatus = params.httpStatus;
    this.isRetryable = params.isRetryable;
    this.countsAsCircuitFailure = params.countsAsCircuitFailure;
  }
}

// ---------------------------------------------------------------------------
// 3. Typed Subclasses
// ---------------------------------------------------------------------------

/**
 * Our own atomic quota reservation was denied before making any network call.
 *
 * isRetryable: false (skip this model; the slot isn't available)
 * countsAsCircuitFailure: false (the provider is healthy — WE are at capacity)
 *
 * MUST NOT be exposed in the public API response.
 * MUST NOT trip the circuit breaker.
 */
export class QuotaExhaustedError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", quotaType: "rpm" | "rpd") {
    super({
      errorType: "QUOTA_EXHAUSTED",
      modelId,
      providerId,
      httpStatus: 0,
      isRetryable: false,
      countsAsCircuitFailure: false,
      message: `Quota exhausted for ${modelId} (${quotaType.toUpperCase()} limit reached). Skipping model.`,
    });
    this.name = "QuotaExhaustedError";
  }
}

/**
 * The provider returned HTTP 429 — the provider itself is rate-limiting us.
 * This is distinct from our own pre-call quota reservation being denied.
 *
 * isRetryable: true (try the next model)
 * countsAsCircuitFailure: true (the provider is under load)
 */
export class RateLimitedError extends AIProviderError {
  /** Value of the Retry-After header, if provided by the provider. */
  readonly retryAfterSeconds: number | null;

  constructor(
    modelId: string,
    providerId: "gemini" | "groq",
    retryAfterSeconds: number | null,
    message: string,
  ) {
    super({
      errorType: "RATE_LIMITED_429",
      modelId,
      providerId,
      httpStatus: 429,
      isRetryable: true,
      countsAsCircuitFailure: true,
      message,
    });
    this.name = "RateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * The provider returned HTTP 503 — the provider is overloaded or temporarily unavailable.
 *
 * isRetryable: true
 * countsAsCircuitFailure: true
 */
export class ProviderUnavailableError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", message: string) {
    super({
      errorType: "SERVICE_UNAVAILABLE_503",
      modelId,
      providerId,
      httpStatus: 503,
      isRetryable: true,
      countsAsCircuitFailure: true,
      message,
    });
    this.name = "ProviderUnavailableError";
  }
}

/**
 * The provider call exceeded its AbortController deadline.
 * This includes both per-model maxTimeoutMs and the global AI deadline.
 *
 * isRetryable: true
 * countsAsCircuitFailure: true
 */
export class TimeoutError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", effectiveTimeoutMs: number) {
    super({
      errorType: "TIMEOUT",
      modelId,
      providerId,
      httpStatus: 504,
      isRetryable: true,
      countsAsCircuitFailure: true,
      message: `Request to ${modelId} timed out after ${effectiveTimeoutMs}ms.`,
    });
    this.name = "TimeoutError";
  }
}

/**
 * The provider returned HTTP 500 or 502 — a server-side error at the provider.
 *
 * isRetryable: true
 * countsAsCircuitFailure: true
 */
export class ServerError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", httpStatus: 500 | 502, message: string) {
    super({
      errorType: "SERVER_ERROR_500_502",
      modelId,
      providerId,
      httpStatus,
      isRetryable: true,
      countsAsCircuitFailure: true,
      message,
    });
    this.name = "ServerError";
  }
}

/**
 * The provider returned HTTP 200 but the response body does not conform to
 * the expected 5-field Kinkeeper JSON schema.
 *
 * isRetryable: true (try the next model — this model may be misconfigured)
 * countsAsCircuitFailure: false (the provider is reachable and responded)
 */
export class SchemaValidationError extends AIProviderError {
  /** The list of specific schema violations found by the validator. */
  readonly schemaErrors: string[];

  /** The raw response string that failed validation, for debugging. */
  readonly rawResponse: string;

  constructor(
    modelId: string,
    providerId: "gemini" | "groq",
    schemaErrors: string[],
    rawResponse: string,
  ) {
    super({
      errorType: "SCHEMA_VALIDATION_FAILED",
      modelId,
      providerId,
      httpStatus: 200,
      isRetryable: true,
      countsAsCircuitFailure: false,
      message: `Schema validation failed for ${modelId}: ${schemaErrors.join("; ")}`,
    });
    this.name = "SchemaValidationError";
    this.schemaErrors = schemaErrors;
    this.rawResponse = rawResponse;
  }
}

/**
 * The provider returned HTTP 401 or 403 — authentication or authorization failure.
 * This is a configuration problem, not a transient failure.
 *
 * isRetryable: false (abort — other models will likely have the same credential)
 * countsAsCircuitFailure: false (not a provider health issue)
 */
export class AuthError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", httpStatus: 401 | 403, message: string) {
    super({
      errorType: "AUTH_ERROR_401_403",
      modelId,
      providerId,
      httpStatus,
      isRetryable: false,
      countsAsCircuitFailure: false,
      message,
    });
    this.name = "AuthError";
  }
}

/**
 * The provider returned HTTP 400 — the request was malformed.
 * This is a programming error or an unexpected prompt issue.
 *
 * isRetryable: false (abort — return HTTP 400 to client)
 * countsAsCircuitFailure: false
 */
export class BadRequestError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", message: string) {
    super({
      errorType: "BAD_REQUEST_400",
      modelId,
      providerId,
      httpStatus: 400,
      isRetryable: false,
      countsAsCircuitFailure: false,
      message,
    });
    this.name = "BadRequestError";
  }
}

/**
 * The provider returned HTTP 404 — the model ID is wrong.
 * This is a configuration error, not a transient failure.
 *
 * isRetryable: false (abort — log configuration alert)
 * countsAsCircuitFailure: false
 */
export class ModelNotFoundError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq") {
    super({
      errorType: "MODEL_NOT_FOUND_404",
      modelId,
      providerId,
      httpStatus: 404,
      isRetryable: false,
      countsAsCircuitFailure: false,
      message: `Model not found: ${modelId} on provider ${providerId}. Check MODEL_REGISTRY configuration.`,
    });
    this.name = "ModelNotFoundError";
  }
}

/**
 * A model was asked to handle an input modality it does not support.
 * This should never happen in production — the router filters by capability before dispatch.
 * If this error is thrown, it is a code bug in the routing logic.
 *
 * isRetryable: false
 * countsAsCircuitFailure: false
 */
export class UnsupportedCapabilityError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", capability: string) {
    super({
      errorType: "UNSUPPORTED_CAPABILITY",
      modelId,
      providerId,
      httpStatus: 0,
      isRetryable: false,
      countsAsCircuitFailure: false,
      message: `Model ${modelId} does not support capability: ${capability}. This is a routing bug.`,
    });
    this.name = "UnsupportedCapabilityError";
  }
}

/**
 * A network-level failure occurred before any HTTP response was received
 * (DNS failure, connection refused, fetch abort for non-timeout reasons, etc.).
 *
 * isRetryable: true
 * countsAsCircuitFailure: true
 */
export class NetworkFailureError extends AIProviderError {
  constructor(modelId: string, providerId: "gemini" | "groq", message: string, cause?: unknown) {
    super({
      errorType: "NETWORK_FAILURE",
      modelId,
      providerId,
      httpStatus: 0,
      isRetryable: true,
      countsAsCircuitFailure: true,
      message,
      cause,
    });
    this.name = "NetworkFailureError";
  }
}

// ---------------------------------------------------------------------------
// 4. Type Guard Utilities
// ---------------------------------------------------------------------------

/** Returns true if err is any subclass of AIProviderError. */
export function isAIProviderError(err: unknown): err is AIProviderError {
  return err instanceof AIProviderError;
}

/** Returns true if this error type should trip the circuit breaker. */
export function isCircuitFailure(err: AIProviderError): boolean {
  return err.countsAsCircuitFailure;
}

/** Returns true if the router should abort all further attempts. */
export function isFatalError(err: AIProviderError): boolean {
  return !err.isRetryable;
}
