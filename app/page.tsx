"use client";

import { useState, useRef, useEffect } from "react";

interface CheckResult {
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  embedding?: number[] | null;
  complaintDraft?: string;
  financialLossLikely?: boolean;
}

interface CircleReport {
  id: string;
  circleId: string;
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  timestamp: string;
  clusterCount: number;
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

function MiniRiskBadge({ score }: { score: number }) {
  let colorClass = "";
  if (score < 40) colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  else if (score <= 70) colorClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
  else colorClass = "bg-red-500/20 text-red-400 border-red-500/40";

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${colorClass} text-sm font-bold`}>
      {score}
    </div>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState<"personal" | "radar">("personal");
  
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reporting
  const [reportCircleId, setReportCircleId] = useState<string>("sharma-family");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Radar Feed
  const [selectedCircle, setSelectedCircle] = useState<string>("sharma-family");
  const [feedReports, setFeedReports] = useState<CircleReport[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Copy button states
  const [shareAlertCopied, setShareAlertCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  }

  async function handleCheck() {
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "image" && !imageFile) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setReportStatus("idle");

    try {
      let payload: any = {};
      
      if (activeTab === "text") {
        payload = { text, language };
      } else if (activeTab === "image" && imageFile && imagePreview) {
        // Strip data:image/...;base64,
        const base64Data = imagePreview.split(",")[1];
        payload = {
          imageBase64: base64Data,
          mimeType: imageFile.type,
          language,
        };
      }

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function handleReport() {
    if (!result) return;
    setReportStatus("loading");
    try {
      const res = await fetch(`/api/circles/${reportCircleId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.text,
          riskScore: result.riskScore,
          flags: result.flags,
          explanation: result.explanation,
          embedding: result.embedding,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to report");
      }
      setReportStatus("success");
    } catch (e) {
      console.error(e);
      setReportStatus("error");
    }
  }

  async function fetchFeed() {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/circles/${selectedCircle}/reports`);
      if (!res.ok) {
        throw new Error("Failed to fetch feed");
      }
      const data = await res.json();
      setFeedReports(data.reports || []);
    } catch (e: any) {
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
    }
  }

  // Fetch feed when switching to radar mode or changing circle
  useEffect(() => {
    if (appMode === "radar") {
      fetchFeed();
    }
  }, [appMode, selectedCircle]);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-100 font-sans">
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-red-700/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-red-400 bg-clip-text text-transparent">
              Scam Shield
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
            Instantly analyse suspicious messages, and warn your circle before they fall for the same scam.
          </p>

          {/* App Mode Toggle */}
          <div className="flex justify-center gap-2 border border-white/10 rounded-xl p-1 bg-white/5 inline-flex backdrop-blur-sm">
            <button
              onClick={() => setAppMode("personal")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                appMode === "personal"
                  ? "bg-violet-500/20 text-violet-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              Personal Check
            </button>
            <button
              onClick={() => setAppMode("radar")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex gap-2 items-center ${
                appMode === "radar"
                  ? "bg-violet-500/20 text-violet-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              Scam Radar
            </button>
          </div>
        </header>

        {appMode === "personal" ? (
          <>
            {/* Input card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl mb-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "text"
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "image"
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  Upload Screenshot
                </button>
              </div>

              {activeTab === "text" ? (
                <div>
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
                    placeholder={`Paste the suspicious message here… e.g. "Your bank account will be blocked. Call 9999-XXXX immediately."`}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Suspicious screenshot
                  </label>
                  <div 
                    className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-white/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-slate-400 text-sm">
                      {imageFile ? (
                        <span className="text-violet-300 font-medium">{imageFile.name}</span>
                      ) : (
                        <span>Click to browse or drag a screenshot here</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Language toggle */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language</span>
                <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                  <button
                    id="lang-en"
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      language === "en"
                        ? "bg-violet-500/30 text-violet-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    id="lang-hi"
                    onClick={() => setLanguage("hi")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      language === "hi"
                        ? "bg-violet-500/30 text-violet-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    हिं
                  </button>
                </div>
              </div>

              <button
                id="check-button"
                onClick={handleCheck}
                disabled={loading || (activeTab === "text" ? !text.trim() : !imageFile)}
                className="mt-6 w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analysing…
                  </span>
                ) : (
                  "Check for Scam"
                )}
              </button>
            </div>

            {/* Image Preview */}
            {activeTab === "image" && imagePreview && result && (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 shadow-xl mb-6 flex justify-center animate-fade-in">
                <img src={imagePreview} alt="Screenshot preview" className="max-h-48 rounded-lg border border-white/20 object-contain" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6 animate-fade-in">
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
                <div className="flex flex-col items-center gap-3">
                  <RiskBadge score={result.riskScore} />
                  {/* Copy Alert to Share button */}
                  <button
                    id="copy-alert-button"
                    onClick={async () => {
                      const verdictLabel = result.riskScore < 40 ? "Low Risk" : result.riskScore <= 70 ? "Medium Risk" : "High Risk";
                      const flagLines = result.flags.length > 0
                        ? result.flags.map(f => `• ${f}`).join("\n")
                        : "• None detected";
                      const preview = result.text.length > 200
                        ? result.text.slice(0, 200) + "…"
                        : result.text;
                      const shareText = [
                        `🚨 SCAM ALERT — Scam Shield Analysis`,
                        ``,
                        `Risk Score: ${result.riskScore}/100 (${verdictLabel})`,
                        ``,
                        `Key Red Flags:`,
                        flagLines,
                        ``,
                        `What this means: ${result.explanation}`,
                        ``,
                        `Analysed message:`,
                        `"${preview}"`,
                        ``,
                        `— Checked with Scam Shield (scamshield.vercel.app)`,
                      ].join("\n");
                      try {
                        await navigator.clipboard.writeText(shareText);
                        setShareAlertCopied(true);
                        setTimeout(() => setShareAlertCopied(false), 2000);
                      } catch {
                        // fallback: select a hidden textarea — browser may block clipboard without gesture
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100 transition-all active:scale-95"
                  >
                    {shareAlertCopied ? "✓ Copied!" : "📤 Copy Alert to Share"}
                  </button>
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

                {/* Chakshu complaint draft — shown when riskScore >= 75 and draft is non-empty */}
                {result.riskScore >= 75 && result.complaintDraft && result.complaintDraft.trim() !== "" && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        📋 Chakshu Complaint Draft
                      </h3>
                      <button
                        id="copy-draft-button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(result.complaintDraft!);
                            setDraftCopied(true);
                            setTimeout(() => setDraftCopied(false), 2000);
                          } catch {
                            // clipboard blocked
                          }
                        }}
                        className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all active:scale-95"
                      >
                        {draftCopied ? "✓ Copied!" : "Copy Draft"}
                      </button>
                    </div>

                    {/* Channel routing note */}
                    {result.financialLossLikely ? (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 leading-relaxed">
                        ⚠️ <strong>This message suggests money may have already been sent or lost.</strong> The right channel is the{" "}
                        <strong>Cyber Crime Helpline: 1930</strong> or{" "}
                        <a
                          href="https://cybercrime.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-red-200"
                        >
                          cybercrime.gov.in
                        </a>
                        {" "}— not Chakshu. File the draft below as supporting documentation.
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <strong className="text-slate-300">Chakshu</strong> is the Government of India's portal (under DoT's Sanchar Saathi) for reporting <em>suspected</em> telecom fraud — designed exactly for cases like this where no financial loss has occurred yet.{" "}
                        <a
                          href="https://sancharsaathi.gov.in/Home/ss-feedback.jsp"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 underline"
                        >
                          File at Sanchar Saathi →
                        </a>
                      </p>
                    )}

                    {/* The draft text itself */}
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-black/30 rounded-lg px-3 py-3 border border-white/10 leading-relaxed">
                      {result.complaintDraft}
                    </pre>
                  </div>
                )}

                <hr className="border-white/10" />

                {/* Report to Circle section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">
                    Warn Your Circle
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    If this is a scam, share it with your community to protect others from falling for it.
                  </p>
                  <div className="flex gap-2 items-center">
                    <select
                      value={reportCircleId}
                      onChange={(e) => setReportCircleId(e.target.value)}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="sharma-family" className="bg-slate-900">Sharma Family Group</option>
                      <option value="green-valley-rwa" className="bg-slate-900">Green Valley RWA</option>
                    </select>
                    <button
                      onClick={handleReport}
                      disabled={reportStatus === "loading" || reportStatus === "success"}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reportStatus === "loading" ? "Reporting..." : reportStatus === "success" ? "✓ Reported" : "Report"}
                    </button>
                  </div>
                  {reportStatus === "success" && (
                    <p className="text-xs text-emerald-400 mt-2">
                      Successfully reported! View it in the Scam Radar tab.
                    </p>
                  )}
                  {reportStatus === "error" && (
                    <p className="text-xs text-red-400 mt-2">
                      Failed to report. Please try again.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* RADAR VIEW */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <select
                value={selectedCircle}
                onChange={(e) => setSelectedCircle(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xl"
              >
                <option value="sharma-family" className="bg-slate-900">Sharma Family Group</option>
                <option value="green-valley-rwa" className="bg-slate-900">Green Valley RWA</option>
              </select>
              
              <button
                onClick={fetchFeed}
                disabled={feedLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 transition-colors"
              >
                {feedLoading ? "Refreshing..." : "↻ Refresh Feed"}
              </button>
            </div>

            {feedError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6">
                ⚠️ {feedError}
              </div>
            )}

            <div className="space-y-4">
              {feedReports.length === 0 && !feedLoading ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-slate-400 text-sm">No reports in this circle yet.</p>
                </div>
              ) : (
                feedReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-4 backdrop-blur-sm shadow-xl">
                    <div className="flex-shrink-0">
                      <MiniRiskBadge score={report.riskScore} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs text-slate-400">
                        Reported {new Date(report.timestamp).toLocaleString()}
                      </p>
                      
                      {report.clusterCount > 1 && (
                        <div className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase">
                          <span>⚠️</span>
                          {report.clusterCount} people in this circle reported similar messages
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-200 line-clamp-3 italic opacity-80 border-l-2 border-white/20 pl-2">
                        "{report.text}"
                      </p>

                      <div className="bg-black/20 rounded-lg p-3 text-sm text-slate-300">
                        {report.explanation}
                      </div>

                      {report.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {report.flags.map((flag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
