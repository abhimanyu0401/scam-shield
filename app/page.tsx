"use client";

import { useState } from "react";

interface CheckResult {
  riskScore: number;
  flags: string[];
  explanation: string;
}

function RiskBadge({ score }: { score: number }) {
  let colorClass = "";
  let label = "";

  if (score < 40) {
    colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    label = "Low Risk";
  } else if (score <= 70) {
    colorClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    label = "Medium Risk";
  } else {
    colorClass = "bg-red-500/20 text-red-400 border-red-500/40";
    label = "High Risk";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex items-center justify-center w-28 h-28 rounded-full border-2 ${colorClass} text-4xl font-bold`}
      >
        {score}
      </div>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${colorClass}`}>
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Something went wrong.");
      }

      const data: CheckResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-100 font-sans">
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-red-700/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-red-400 bg-clip-text text-transparent">
              Scam Shield
            </h1>
          </div>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Paste any suspicious message below and we&apos;ll analyse it for
            scam red flags — instantly.
          </p>
        </header>

        {/* Input card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl mb-6">
          <label
            htmlFor="message-input"
            className="block text-sm font-semibold text-slate-300 mb-3"
          >
            Suspicious message
          </label>
          <textarea
            id="message-input"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste the suspicious message here… e.g. "Your bank account will be blocked. Call 9999-XXXX immediately and share your OTP to verify."`}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition"
          />

          <button
            id="check-button"
            onClick={handleCheck}
            disabled={loading || !text.trim()}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all
              bg-gradient-to-r from-violet-600 to-red-500 hover:from-violet-500 hover:to-red-400
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Analysing…
              </span>
            ) : (
              "Check for Scam"
            )}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div
            id="error-banner"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6"
          >
            ⚠️ {error}
          </div>
        )}

        {/* Results card */}
        {result && (
          <div
            id="results-card"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl space-y-6 animate-fade-in"
          >
            <h2 className="text-lg font-bold text-slate-100">Analysis Result</h2>

            {/* Risk score */}
            <div className="flex justify-center">
              <RiskBadge score={result.riskScore} />
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Red Flags Detected
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {result.flags.map((flag) => (
                    <li
                      key={flag}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30"
                    >
                      🚩 {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explanation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Explanation
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                {result.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
