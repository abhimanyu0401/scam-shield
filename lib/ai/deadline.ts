/**
 * lib/ai/deadline.ts
 *
 * Global AI orchestration deadline tracker for the Scam Shield resilience subsystem.
 *
 * CRITICAL SEMANTICS:
 *   The deadline is an ABSOLUTE TIMESTAMP — not a sum of model timeouts.
 *
 *   deadlineAt = startedAt + GLOBAL_AI_DEADLINE_MS
 *   remainingMs = deadlineAt - Date.now()   // recomputed at every call site
 *
 *   4 × maxTimeoutMs might sum to less than 20 000 ms, but the hard ceiling
 *   is always the absolute deadline timestamp, whichever is reached first.
 *   A fast primary success at 2 s returns immediately — the 20 s budget is
 *   the worst-case maximum, not a guaranteed wait.
 *
 * Design rules:
 *   - DeadlineTracker is created ONCE per /api/check request, at the start
 *     of AI orchestration, and passed into the router, normalizer, and every
 *     provider call site.
 *   - `remainingMs()` calls `Date.now()` every time it is invoked — never
 *     caches the value — so each call reflects real elapsed time.
 *   - Providers do NOT create their own timeouts.  They receive an AbortSignal
 *     from `createAbortHandle()` and honour it.  The signal is already bound
 *     to min(model.maxTimeoutMs, remaining).
 *   - Callers must call `cancel()` on the returned handle after a successful
 *     response so the timer does not linger in the event loop.
 */

import { GLOBAL_AI_DEADLINE_MS, MIN_REMAINING_MS_TO_ATTEMPT } from "./config";

// ---------------------------------------------------------------------------
// 1. AbortHandle — returned by createAbortHandle()
// ---------------------------------------------------------------------------

/**
 * Wraps an AbortController and its cleanup timer together.
 *
 * Callers must call `cancel()` after a successful response to prevent the
 * timer from firing after the request has already completed.
 */
export interface AbortHandle {
  /** Pass this to the provider call. */
  readonly signal: AbortSignal;

  /**
   * The effective timeout that was applied, in milliseconds.
   * Equal to min(model.maxTimeoutMs, remainingMs at time of creation).
   * Used for telemetry / error messages.
   */
  readonly effectiveTimeoutMs: number;

  /**
   * Cancels the internal timer.  Call this immediately after the provider
   * call resolves (success OR typed error) to avoid timer leaks.
   * Safe to call multiple times.
   */
  cancel(): void;
}

// ---------------------------------------------------------------------------
// 2. DeadlineTracker interface
// ---------------------------------------------------------------------------

export interface DeadlineTracker {
  /** Unix-ms timestamp when the DeadlineTracker was created. */
  readonly startedAt: number;

  /**
   * Unix-ms timestamp at which the global AI orchestration budget expires.
   * Equal to startedAt + GLOBAL_AI_DEADLINE_MS.
   *
   * This is the source of truth.  Do not compute remaining budget from
   * anything else.
   */
  readonly deadlineAt: number;

  /**
   * Returns the number of milliseconds remaining before the absolute deadline.
   * Recomputes Date.now() on every call — never cached.
   * May return a negative value if the deadline has already passed.
   */
  remainingMs(): number;

  /**
   * Returns true if the absolute deadline has passed.
   * Equivalent to remainingMs() <= 0.
   */
  isExpired(): boolean;

  /**
   * Returns true if there is enough budget remaining to justify opening a new
   * provider network connection.
   *
   * Returns false when remainingMs() <= MIN_REMAINING_MS_TO_ATTEMPT.
   * The router must call this before every model attempt.
   */
  canAttempt(): boolean;

  /**
   * Returns the effective timeout to use for a single model attempt:
   *   Math.min(modelMaxTimeoutMs, remainingMs())
   *
   * This is a CEILING — not a guaranteed wait.  If the model responds in
   * 1 s, the caller returns immediately.
   *
   * Returns 0 if remainingMs() is already <= 0.
   */
  effectiveTimeoutMs(modelMaxTimeoutMs: number): number;

  /**
   * Creates an AbortHandle for a single provider attempt.
   *
   * The signal will abort after effectiveTimeoutMs(modelMaxTimeoutMs) have
   * elapsed from the moment this method is called.  This correctly enforces
   * the global deadline even when it is tighter than the model's own
   * maxTimeoutMs.
   *
   * Example:
   *   Global remaining = 4 200 ms
   *   Model maxTimeout = 6 000 ms
   *   → signal aborts after 4 200 ms   (NOT 6 000 ms)
   *
   * @param modelMaxTimeoutMs - The model's maxTimeoutMs from MODEL_REGISTRY.
   * @returns AbortHandle — caller must call handle.cancel() after the attempt.
   */
  createAbortHandle(modelMaxTimeoutMs: number): AbortHandle;
}

// ---------------------------------------------------------------------------
// 3. Factory
// ---------------------------------------------------------------------------

/**
 * Creates a new DeadlineTracker for one /api/check AI orchestration lifecycle.
 *
 * Call this ONCE, at the start of AI orchestration, before any model attempts.
 * Pass the returned tracker to the router and normalizer.
 *
 * @param deadlineMs - The global budget in ms.  Defaults to GLOBAL_AI_DEADLINE_MS.
 *                     Overridable for tests.
 */
export function createDeadlineTracker(
  deadlineMs: number = GLOBAL_AI_DEADLINE_MS,
): DeadlineTracker {
  const startedAt = Date.now();
  const deadlineAt = startedAt + deadlineMs;

  return {
    startedAt,
    deadlineAt,

    remainingMs(): number {
      return deadlineAt - Date.now();
    },

    isExpired(): boolean {
      return Date.now() >= deadlineAt;
    },

    canAttempt(): boolean {
      return deadlineAt - Date.now() > MIN_REMAINING_MS_TO_ATTEMPT;
    },

    effectiveTimeoutMs(modelMaxTimeoutMs: number): number {
      const remaining = deadlineAt - Date.now();
      if (remaining <= 0) return 0;
      return Math.min(modelMaxTimeoutMs, remaining);
    },

    createAbortHandle(modelMaxTimeoutMs: number): AbortHandle {
      const remaining = deadlineAt - Date.now();
      // If the deadline has already passed, return a pre-aborted signal.
      if (remaining <= MIN_REMAINING_MS_TO_ATTEMPT) {
        const controller = new AbortController();
        controller.abort();
        return {
          signal: controller.signal,
          effectiveTimeoutMs: 0,
          cancel: () => { /* nothing to cancel */ },
        };
      }

      const effective = Math.min(modelMaxTimeoutMs, remaining);
      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), effective);

      return {
        signal: controller.signal,
        effectiveTimeoutMs: effective,
        cancel(): void {
          clearTimeout(timerId);
        },
      };
    },
  };
}
