"use client";

import React, { useState, useEffect, useRef } from "react";

interface NotificationOnboardingModalProps {
  isDark: boolean;
  onEnable: () => Promise<NotificationPermission | "unsupported">;
  onDismiss: () => void;
}

export default function NotificationOnboardingModal({
  isDark,
  onEnable,
  onDismiss,
}: NotificationOnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDismiss();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  const handleEnableClick = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await onEnable();
      if (result === "denied") {
        setStatusMessage("Alerts blocked in browser. You can enable them anytime in site settings.");
        setTimeout(() => {
          onDismiss();
        }, 2200);
      } else {
        setStatusMessage("Alerts enabled! Staying protected.");
        setTimeout(() => {
          onDismiss();
        }, 850);
      }
    } catch {
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onDismiss();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in text-left"
    >
      <div
        className={`relative w-full max-w-lg rounded-[32px] sm:rounded-[36px] border shadow-2xl overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-[#0B0F19] text-white border-slate-800/90 shadow-[0_25px_80px_rgba(0,0,0,0.9)]"
            : "bg-white text-slate-900 border-slate-200/90 shadow-[0_25px_70px_rgba(29,104,255,0.12)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle, #1D68FF 0%, rgba(29,104,255,0) 70%)",
          }}
        />

        {/* Floating close button */}
        <button
          onClick={onDismiss}
          aria-label="Close notification prompt"
          className={`absolute top-4 right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? "bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header with Glowing Icon */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D68FF] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#0B0F19]" />
              </span>
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#1D68FF] bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                Early Warning Shield
              </span>
              <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                Enable Threat Alerts
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Scam Shield protects your inner circle with real-time detection. Turn on alerts so you’re warned instantly before responding to new threats.
          </p>

          {/* Value Props */}
          <div className="space-y-3 pt-1">
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? "bg-[#111726] border-slate-800" : "bg-[#F3F7FD] border-blue-100"
            }`}>
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                ⚡
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Real-time Circle Alerts
                </h4>
                <p className={`text-[11px] sm:text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Get immediate alerts when members in your circles flag or share a suspicious message.
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? "bg-[#111726] border-slate-800" : "bg-[#F3F7FD] border-blue-100"
            }`}>
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                🛡️
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Urgent Phishing & Scam Waves
                </h4>
                <p className={`text-[11px] sm:text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Receive rapid alerts on active digital arrest, bank fraud, and APK malware scams.
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? "bg-[#111726] border-slate-800" : "bg-[#F3F7FD] border-blue-100"
            }`}>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                ✓
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Community Verifications
                </h4>
                <p className={`text-[11px] sm:text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Know right away when your circle confirms or resolves a suspicious case you reported.
                </p>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold text-center border animate-fade-in ${
              statusMessage.includes("blocked")
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={onDismiss}
              disabled={loading}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isDark
                  ? "border border-slate-800 hover:bg-slate-800/80 text-slate-400 hover:text-white"
                  : "border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              Maybe Later
            </button>

            <button
              onClick={handleEnableClick}
              disabled={loading}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Requesting…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span>Enable Notifications</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
