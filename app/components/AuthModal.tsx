"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { useAuth } from "@/app/providers/AuthProvider";

type Mode = "sign-in" | "sign-up";

interface AuthModalProps {
  onClose: () => void;
  theme?: "light" | "dark";
}

export function AuthModal({ onClose, theme = "dark" }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { refreshAuth } = useAuth();
  const backdropRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  // Close on Escape key
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

      // Success — refresh AuthProvider context and close modal
      await refreshAuth();
      onClose();
    });
  }

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Modal Card Container */}
      <div
        className={`relative w-full max-w-3xl rounded-[32px] sm:rounded-[36px] shadow-2xl overflow-hidden border transition-all duration-300 min-h-[520px] md:min-h-[500px] flex ${
          isDark
            ? "bg-[#060911] text-white border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
            : "bg-[#FFFFFF] text-slate-900 border-slate-200/80 shadow-[0_25px_70px_rgba(0,0,0,0.14)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className={`absolute top-4 right-4 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-[#141B2D] text-white hover:bg-[#1E293B] border border-slate-700/60"
              : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ========================================================================= */}
        {/* DESKTOP & TABLET DUAL-PANE WITH SLIDING OVERLAY (md:flex hidden on mobile) */}
        {/* ========================================================================= */}
        <div className="hidden md:block w-full h-full relative min-h-[500px]">
          {/* 1. LEFT FORM PANE: Sign In Form */}
          <div
            className={`w-1/2 absolute left-0 top-0 bottom-0 p-8 sm:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${
              mode === "sign-in"
                ? "opacity-100 z-10 translate-x-0 pointer-events-auto"
                : "opacity-0 z-0 -translate-x-8 pointer-events-none"
            }`}
          >
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Sign in
                </h2>
              </div>

              <form action={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <input
                    id="desktop-signin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="Email"
                    className={`w-full rounded-2xl px-4 py-3.5 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <input
                    id="desktop-signin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Password"
                    minLength={6}
                    className={`w-full rounded-2xl px-4 py-3.5 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Error Message */}
                {error && mode === "sign-in" && (
                  <div className="rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                    {error}
                  </div>
                )}

                {/* Submit Pill Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-10 py-3 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPending ? "Signing in…" : "SIGN IN"}
                  </button>
                </div>
              </form>

              {/* Bottom Switcher */}
              <div className={`pt-1 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("sign-up")}
                  className="text-[#1D68FF] font-bold hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>

          {/* 2. RIGHT FORM PANE: Create Account Form */}
          <div
            className={`w-1/2 absolute right-0 top-0 bottom-0 p-8 sm:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${
              mode === "sign-up"
                ? "opacity-100 z-10 translate-x-0 pointer-events-auto"
                : "opacity-0 z-0 translate-x-8 pointer-events-none"
            }`}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Create Account
                </h2>
              </div>

              <form action={handleSubmit} className="space-y-3.5">
                {/* Display Name */}
                <div>
                  <input
                    id="desktop-signup-name"
                    name="display_name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Name"
                    maxLength={60}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <input
                    id="desktop-signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email"
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <input
                    id="desktop-signup-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Password"
                    minLength={6}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Error Message */}
                {error && mode === "sign-up" && (
                  <div className="rounded-xl px-3.5 py-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                    {error}
                  </div>
                )}

                {/* Submit Pill Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-10 py-3 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPending ? "Creating account…" : "SIGN UP"}
                  </button>
                </div>
              </form>

              {/* Bottom Switcher */}
              <div className={`pt-1 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("sign-in")}
                  className="text-[#1D68FF] font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>

          {/* 3. SLIDING HERO OVERLAY PANEL (Travels horizontally between 0% and 100%) */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-1/2 p-3 sm:p-3.5 z-30 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              mode === "sign-in" ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <div
              className={`w-full h-full rounded-[26px] sm:rounded-[30px] p-8 sm:p-10 flex flex-col items-center justify-center text-center text-white shadow-xl relative overflow-hidden ${
                isDark
                  ? "bg-gradient-to-br from-[#1D68FF] via-[#1253d4] to-[#083696] border border-blue-400/20"
                  : "bg-gradient-to-br from-[#1D68FF] via-[#165DF0] to-[#0A4BD6]"
              }`}
            >
              {/* Decorative background glows */}
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-black/20 blur-xl pointer-events-none" />

              {/* PROMO CONTENT A (Sign In state: Welcome To Scam Shield! -> Sign Up ghost) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ease-in-out ${
                  mode === "sign-in"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="space-y-2 max-w-xs">
                  <h3 className="text-3xl font-black tracking-tight leading-tight">
                    Welcome To<br />Scam Shield!
                  </h3>
                  <p className="text-sm font-medium text-blue-100 pt-1">
                    New Here?
                  </p>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="px-9 py-2.5 rounded-full border-2 border-white text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase hover:bg-white hover:text-[#1D68FF] active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    SIGN UP
                  </button>
                </div>
              </div>

              {/* PROMO CONTENT B (Sign Up state: Welcome back To Scam Shield! -> Sign In ghost) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ease-in-out ${
                  mode === "sign-up"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="space-y-2 max-w-xs">
                  <h3 className="text-3xl font-black tracking-tight leading-tight">
                    Welcome back To<br />Scam Shield!
                  </h3>
                  <p className="text-sm font-medium text-blue-100 pt-1">
                    Already have an account?
                  </p>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="px-9 py-2.5 rounded-full border-2 border-white text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase hover:bg-white hover:text-[#1D68FF] active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    SIGN IN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE LAYOUT (< md) WITH SMOOTH SLIDE/CROSSFADE                         */}
        {/* ========================================================================= */}
        <div className="block md:hidden w-full p-6 sm:p-8 space-y-6">
          {/* Mobile Promo Header Card */}
          <div
            className={`w-full rounded-2xl p-6 text-center text-white shadow-lg relative overflow-hidden transition-all duration-500 ${
              isDark
                ? "bg-gradient-to-br from-[#1D68FF] via-[#1253d4] to-[#083696] border border-blue-400/20"
                : "bg-gradient-to-br from-[#1D68FF] via-[#165DF0] to-[#0A4BD6]"
            }`}
          >
            <h3 className="text-xl font-black tracking-tight leading-tight">
              {mode === "sign-in" ? "Welcome To Scam Shield!" : "Welcome back To Scam Shield!"}
            </h3>
            <p className="text-xs font-medium text-blue-100 pt-1">
              {mode === "sign-in" ? "New Here?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="mt-4 px-6 py-1.5 rounded-full border border-white text-white font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-[#1D68FF] transition-all shadow-sm"
            >
              {mode === "sign-in" ? "Switch to Sign Up" : "Switch to Sign In"}
            </button>
          </div>

          {/* Mobile Form */}
          <div className="space-y-4">
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {mode === "sign-in" ? "Sign in" : "Create Account"}
            </h2>

            <form action={handleSubmit} className="space-y-3.5">
              {mode === "sign-up" && (
                <div>
                  <input
                    id="mobile-signup-name"
                    name="display_name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Name"
                    maxLength={60}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                      isDark
                        ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                        : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>
              )}

              <div>
                <input
                  id="mobile-auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete={mode === "sign-up" ? "email" : "username"}
                  placeholder="Email"
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                    isDark
                      ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                      : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <input
                  id="mobile-auth-password"
                  name="password"
                  type="password"
                  required
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  placeholder="Password"
                  minLength={6}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] ${
                    isDark
                      ? "bg-[#0E1422] border border-slate-700/80 text-white placeholder-slate-400 focus:bg-[#141C30]"
                      : "bg-[#EDF2F7] border border-slate-300/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {error && (
                <div className="rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending
                    ? mode === "sign-up"
                      ? "Creating account…"
                      : "Signing in…"
                    : mode === "sign-up"
                    ? "SIGN UP"
                    : "SIGN IN"}
                </button>
              </div>
            </form>

            <div className={`pt-1 text-center text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {mode === "sign-in" ? (
                <>
                  Need an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="text-[#1D68FF] font-bold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="text-[#1D68FF] font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
