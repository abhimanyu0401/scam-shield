"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { useAuth } from "@/app/providers/AuthProvider";

type Mode = "sign-in" | "sign-up";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { refreshAuth } = useAuth();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const action = mode === "sign-up" ? signUp : signIn;
      const result = await action(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Success — refresh the AuthProvider context and close the modal
      await refreshAuth();
      onClose();
    });
  }

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#EDE8D0]/60 mb-1">
              Scam Shield
            </p>
            <h2 className="text-lg font-bold text-white">
              {mode === "sign-in" ? "Sign in to your account" : "Create your account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Display name — sign-up only */}
          {mode === "sign-up" && (
            <div className="space-y-1.5">
              <label htmlFor="auth-display-name" className="block text-xs font-semibold text-white/70">
                Display name <span className="text-red-400">*</span>
              </label>
              <input
                id="auth-display-name"
                name="display_name"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Priya Sharma"
                maxLength={60}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#EDE8D0]/40 focus:bg-white/8 transition-colors"
              />
              <p className="text-[11px] text-white/35">
                Shown to circle members when you confirm or flag a scam
              </p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xs font-semibold text-white/70">
              Email address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              autoComplete={mode === "sign-up" ? "email" : "username"}
              placeholder="you@example.com"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#EDE8D0]/40 focus:bg-white/8 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block text-xs font-semibold text-white/70">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              placeholder={mode === "sign-up" ? "At least 6 characters" : "Your password"}
              minLength={6}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#EDE8D0]/40 focus:bg-white/8 transition-colors"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl px-3.5 py-2.5 text-xs text-red-300 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#EDE8D0",
              color: "#1a1a1a",
            }}
          >
            {isPending
              ? mode === "sign-up" ? "Creating account…" : "Signing in…"
              : mode === "sign-up" ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="px-6 pb-5 text-center text-xs text-white/40">
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchMode("sign-up")}
                className="text-[#EDE8D0] font-semibold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchMode("sign-in")}
                className="text-[#EDE8D0] font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
