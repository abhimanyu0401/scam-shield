"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGroups } from '@/hooks/useGroups';
import { AuthModal } from "@/app/components/AuthModal";
import { AudioInput } from "@/app/components/AudioInput";

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { user, displayName, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"text" | "image" | "audio">("text");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string; fileName?: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reporting
  const [reportCircleId, setReportCircleId] = useState<string>("");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Radar Feed
  const [selectedCircle, setSelectedCircle] = useState<string>("");
  const [feedReports, setFeedReports] = useState<CircleReport[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  const [showGroupActionForm, setShowGroupActionForm] = useState<"none"|"join"|"create">("none");

  // Groups State from Hook
  const {
    groups,
    loading: groupsLoading,
    createGroupName,
    joinInviteCode,
    actionStatus: groupActionStatus,
    actionMessage: groupActionMessage,
    newInviteCode,
    dispatch,
    handleCreateGroup,
    handleJoinGroup
  } = useGroups(user);

  useEffect(() => {
    if (groups.length > 0) {
      if (!reportCircleId || !groups.find(g => g.id === reportCircleId)) setReportCircleId(groups[0].id);
      if (!selectedCircle || !groups.find(g => g.id === selectedCircle)) setSelectedCircle(groups[0].id);
    } else {
      setReportCircleId("");
      setSelectedCircle("");
    }
  }, [groups]);




  // Copy button states
  const [shareAlertCopied, setShareAlertCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setError(`Image file too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 2.5MB.`);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setError(null);
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
    if (activeTab === "audio" && !audioData) return;

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
      } else if (activeTab === "audio" && audioData) {
        payload = {
          audioBase64: audioData.base64,
          mimeType: audioData.mimeType,
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
    <div className="min-h-screen bg-[#fbf9e4] text-slate-100 font-sans flex flex-col justify-between" onClick={() => profileMenuOpen && setProfileMenuOpen(false)}>
      {/* Black Wavy Navbar with Profile Dropdown on Extreme Left */}
      <div className="w-full relative select-none">
        {/* Solid Black Header */}
        <nav className="w-full bg-[#232323] text-white px-5 sm:px-8 pt-3 pb-1 flex items-center justify-between relative z-30">
          {/* Shield Logo on Left */}
          <div className="flex items-center">
            <img
              src="/assets/shield-logo.png"
              alt="Scam Shield Logo"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Auth-aware profile button & dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  setAuthModalOpen(true);
                } else {
                  setProfileMenuOpen((prev) => !prev);
                }
              }}
              className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform p-0.5"
              aria-label={user ? "Profile and Settings Menu" : "Sign in or sign up"}
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-[#EDE8D0] flex items-center justify-center shadow-sm">
                {user ? (
                  /* Logged-in: show initials */
                  <span className="text-[#232323] text-xs font-bold leading-none select-none">
                    {(displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                ) : (
                  /* Logged-out: person icon */
                  <svg className="w-4 h-4 text-[#232323]" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Label or chevron */}
              {!authLoading && !user ? (
                <span className="text-[#EDE8D0] text-xs font-semibold hidden sm:inline">
                  Sign In
                </span>
              ) : (
                <svg
                  className={`w-3.5 h-3.5 transition-transform text-[#EDE8D0] ${profileMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Logged-in dropdown */}
            {user && profileMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 bg-[#232323] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-lg"
              >
                {/* Identity header */}
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-bold text-white truncate">
                    {displayName ?? "Shield Account"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <div className="space-y-0.5 text-xs text-slate-200 font-medium">
                  <button
                    onClick={() => {
                      setAppMode("radar");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                  >
                    <span>🛡️</span> My Circles
                  </button>
                </div>

                {/* Sign out */}
                <div className="pt-1 mt-1 border-t border-white/10">
                  {signOutError && (
                    <div className="px-3 mb-2">
                      <p className="text-[10px] text-red-400">{signOutError}</p>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      setSignOutError(null);
                      try {
                        const { createClient } = await import("@/lib/supabase/client");
                        const supabase = createClient();
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        setProfileMenuOpen(false);
                      } catch (err: any) {
                        setSignOutError(err.message || "Failed to sign out");
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-red-500/20 text-red-400 text-xs font-semibold text-left transition-colors cursor-pointer"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Flowing Black Wave */}
        <div className="w-full relative z-10 -mt-0.5 pointer-events-none">
          <svg
            className="w-full h-8 sm:h-12 md:h-14 block overflow-visible"
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.18))" }}
          >
            <path
              d="M 0,0 L 1440,0 L 1440,24 C 1240,48 980,10 680,32 C 380,52 160,8 0,28 Z"
              fill="#232323"
            />
          </svg>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pt-2 sm:pt-4 pb-6 sm:pb-8 w-full flex-1">
        {/* Main Title: 2-Line Stacked SCAM / SHEILD with Ultra-Tight Line Spacing & Box Overlap */}
        <div className="text-center -mb-12 sm:-mb-20 md:-mb-28 lg:-mb-36 select-none relative z-0 flex flex-col items-center">
          <h1 className="font-tall text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] xl:text-[12.5rem] font-bold tracking-[0.12em] sm:tracking-[0.16em] text-[#232323]/65 uppercase flex flex-col items-center leading-[0.76] sm:leading-[0.78]">
            <span>SCAM</span>
            <span>SHIELD</span>
          </h1>
        </div>

        {/* 3D Overlapping Box Layout */}
        <section className="mb-10 sm:mb-14 relative z-10 w-full max-w-4xl mx-auto h-[460px] sm:h-[560px] md:h-[680px] lg:h-[720px] select-none translate-x-[2.5%] sm:translate-x-0">
          {/* Layer 0: Background Layer Dark Slate Pads (#31487A) */}
          <div
            className="absolute rounded-3xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none"
            style={{ top: "8%", left: "36%", width: "28%", height: "26%", zIndex: 4 }}
          />
          <div
            className="absolute rounded-3xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none"
            style={{ top: "34%", left: "4%", width: "24%", height: "26%", zIndex: 4 }}
          />
          <div
            className="absolute rounded-3xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none"
            style={{ top: "44%", left: "56%", width: "32%", height: "36%", zIndex: 4 }}
          />
          {/* Bottom-Left Pad (widened & shifted to cleanly frame Box 8) */}
          <div
            className="absolute rounded-2xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none top-[81%] md:top-[75%] left-[-5%] w-[23%] h-[24%]"
            style={{ zIndex: 4 }}
          />
          {/* 1. Vertical dark blue box under Personal Checker */}
          <div
            className="absolute rounded-3xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none"
            style={{ top: "48%", left: "22%", width: "22%", height: "38%", zIndex: 3 }}
          />
          {/* 2. Small dark blue box in between Scam Radar and Bilingual AI (to the right) */}
          <div
            className="absolute rounded-2xl bg-[#31487A] box-3d-shadow-dark opacity-90 transition-all pointer-events-none"
            style={{ top: "10%", left: "84%", width: "15%", height: "18%", zIndex: 4 }}
          />

          {/* Layer 1: Foreground Floating Light (#CFEBF1) & Hero (#7CB8F2) Boxes */}

          {/* 1. Top-Right Peak Box (#CFEBF1) — z-index 14 so Scam Radar overlaps it */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "2%", left: "74%", width: "22%", zIndex: 14 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-3xl box-3d-shadow flex items-center justify-center p-3 sm:p-4 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>

          {/* 2. Top-Left Peak Small Box (#CFEBF1) */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "8%", left: "24%", width: "20%", zIndex: 22 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-2xl box-3d-shadow flex items-center justify-center p-2.5 sm:p-3.5 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>

          {/* 3. Upper-Left Medium Box (#CFEBF1) */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "24%", left: "14%", width: "28%", zIndex: 20 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-3xl box-3d-shadow flex items-center justify-center p-3 sm:p-5 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>

          {/* 4. Top-Right Large Hero Box (#7CB8F2) — SCAM RADAR (overlaps Top-Right Light Box) */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "18%", left: "48%", width: "48%", zIndex: 28 }}
          >
            <div
              className={`floating-card bg-[#7CB8F2] rounded-3xl p-4 sm:p-6 md:p-7 box-3d-shadow flex flex-col justify-between border transition-all ${
                appMode === "radar"
                  ? "border-[#31487A] ring-4 ring-[#31487A]/30 shadow-2xl"
                  : "border-[#7CB8F2]/70 hover:border-[#31487A]/50"
              }`}
            >
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/50 text-[#0f172a] text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live Feed
                  </div>
                </div>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                  Scam Radar
                </h3>
                <p className="text-[#1e293b]/90 text-[11px] sm:text-xs md:text-sm leading-relaxed hidden sm:block">
                  Crowd-sourced scam alerts to protect your family, housing societies & friends.
                </p>
              </div>
              <div className="mt-3 sm:mt-5 pt-1">
                <button
                  onClick={() => {
                    setAppMode("radar");
                    document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    appMode === "radar"
                      ? "bg-[#232323] text-[#CFEBF1] ring-2 ring-white/20"
                      : "bg-[#31487A] text-white hover:bg-[#232323]"
                  }`}
                >
                  <span>{appMode === "radar" ? "✓ Active: Scam Radar" : "Scam Radar →"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Bottom-Left Large Hero Box (#7CB8F2) — PERSONAL CHECKER */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "44%", left: "2%", width: "48%", zIndex: 24 }}
          >
            <div
              className={`floating-card bg-[#7CB8F2] rounded-3xl p-4 sm:p-6 md:p-7 box-3d-shadow flex flex-col justify-between border transition-all ${
                appMode === "personal"
                  ? "border-[#31487A] ring-4 ring-[#31487A]/30 shadow-2xl"
                  : "border-[#7CB8F2]/70 hover:border-[#31487A]/50"
              }`}
            >
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/50 text-[#0f172a] text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                    <span>🛡️</span> Defense
                  </div>
                </div>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                  Personal Checker
                </h3>
                <p className="text-[#1e293b]/90 text-[11px] sm:text-xs md:text-sm leading-relaxed hidden sm:block">
                  Instant AI threat detection on suspicious SMS, WhatsApp chats & phishing links.
                </p>
              </div>
              <div className="mt-3 sm:mt-5 pt-1">
                <button
                  onClick={() => {
                    setAppMode("personal");
                    document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    appMode === "personal"
                      ? "bg-[#232323] text-[#CFEBF1] ring-2 ring-white/20"
                      : "bg-[#31487A] text-white hover:bg-[#232323]"
                  }`}
                >
                  <span>{appMode === "personal" ? "✓ Active: Personal Checker" : "Personal Checker →"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. Center Medium Box (#CFEBF1) */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "50%", left: "50%", width: "26%", zIndex: 22 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-3xl box-3d-shadow flex items-center justify-center p-3 sm:p-4 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>

          {/* 7. Center Small Box (#CFEBF1) — moved to right a bit so it doesn't overlap Box 6 */}
          <div
            className="absolute floating-box-wrapper"
            style={{ top: "68%", left: "62%", width: "19%", zIndex: 22 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-2xl box-3d-shadow flex items-center justify-center p-2 sm:p-3 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>

          {/* 8. Bottom-Left Small Box (#CFEBF1) — moved left by ~20% of its width & lower on phone */}
          <div
            className="absolute floating-box-wrapper top-[84%] md:top-[78%] left-[-4.5%] w-[17%]"
            style={{ zIndex: 26 }}
          >
            <div className="floating-card w-full aspect-square bg-[#CFEBF1] rounded-2xl box-3d-shadow flex items-center justify-center p-2 sm:p-3 border border-[#CFEBF1]/60 text-center text-[#0f172a] font-medium transition-all overflow-hidden" />
          </div>
        </section>

        {/* Active Tool View */}
        <div id="active-tool-view" className="max-w-2xl mx-auto w-full">
        {appMode === "personal" ? (
          <>
            {/* Input card */}
            <div className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl mb-8">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "text"
                      ? "bg-[#7CB8F2] text-[#0f172a] shadow-sm"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "image"
                      ? "bg-[#7CB8F2] text-[#0f172a] shadow-sm"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
                  }`}
                >
                  Upload Screenshot
                </button>
                <button
                  onClick={() => setActiveTab("audio")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "audio"
                      ? "bg-[#7CB8F2] text-[#0f172a] shadow-sm"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
                  }`}
                >
                  Upload Audio
                </button>
              </div>

              {activeTab === "text" ? (
                <div>
                  <label
                    htmlFor="message-input"
                    className="block text-sm font-semibold text-slate-200 mb-3"
                  >
                    Suspicious message
                  </label>
                  <textarea
                    id="message-input"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Paste the suspicious message here… e.g. "Your bank account will be blocked. Call 9999-XXXX immediately."`}
                    className="w-full rounded-2xl bg-[#181818] border border-white/15 text-slate-100 placeholder-slate-400 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7CB8F2] resize-none transition"
                  />
                </div>
              ) : activeTab === "image" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Suspicious screenshot
                  </label>
                  <div 
                    className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-[#7CB8F2] hover:bg-white/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-slate-300 text-sm">
                      {imageFile ? (
                        <span className="text-[#7CB8F2] font-semibold">{imageFile.name}</span>
                      ) : (
                        <span>Click to browse or drag a screenshot here (Max 2.5MB)</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <AudioInput
                  onAudioReady={(data) => setAudioData(data)}
                  onError={(err) => setError(err)}
                />
              )}

              {/* Language toggle */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language</span>
                <div className="flex gap-1 rounded-xl border border-white/15 bg-[#181818] p-1">
                  <button
                    id="lang-en"
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      language === "en"
                        ? "bg-[#7CB8F2] text-[#0f172a]"
                        : "text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    id="lang-hi"
                    onClick={() => setLanguage("hi")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      language === "hi"
                        ? "bg-[#7CB8F2] text-[#0f172a]"
                        : "text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    हिं
                  </button>
                </div>
              </div>

              <button
                id="check-button"
                onClick={handleCheck}
                disabled={
                  loading ||
                  (activeTab === "text"
                    ? !text.trim()
                    : activeTab === "image"
                    ? !imageFile
                    : !audioData)
                }
                className="mt-6 w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all
                  bg-gradient-to-r from-[#7CB8F2] via-[#5A97D9] to-[#31487A] text-white hover:opacity-95
                  disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                  shadow-lg active:scale-[0.98]"
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
              <div className="rounded-3xl border border-black/10 bg-[#232323] p-4 shadow-2xl mb-6 flex justify-center animate-fade-in">
                <img src={imagePreview} alt="Screenshot preview" className="max-h-48 rounded-xl border border-white/20 object-contain" />
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
                className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl space-y-6 mb-8 animate-fade-in"
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
                        // fallback
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100 transition-all active:scale-95 cursor-pointer"
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
                  <p className="text-slate-200 text-sm leading-relaxed bg-[#181818] rounded-2xl px-4 py-3 border border-white/10">
                    {result.explanation}
                  </p>
                </div>

                {/* Chakshu complaint draft — shown when riskScore >= 75 and draft is non-empty */}
                {result.riskScore >= 75 && result.complaintDraft && result.complaintDraft.trim() !== "" && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-3">
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
                        className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all active:scale-95 cursor-pointer"
                      >
                        {draftCopied ? "✓ Copied!" : "Copy Draft"}
                      </button>
                    </div>

                    {/* Channel routing note */}
                    {result.financialLossLikely ? (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 leading-relaxed">
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
                          className="text-[#7CB8F2] hover:underline"
                        >
                          File at Sanchar Saathi →
                        </a>
                      </p>
                    )}

                    {/* The draft text itself */}
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-black/40 rounded-xl px-3.5 py-3 border border-white/10 leading-relaxed">
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
                      className="flex-1 rounded-xl bg-[#181818] border border-white/15 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7CB8F2]"
                      disabled={groups.length === 0}
                    >
                      {groups.length === 0 ? (
                        <option value="" className="bg-[#232323]">No groups available</option>
                      ) : (
                        groups.map(group => (
                          <option key={group.id} value={group.id} className="bg-[#232323]">{group.name}</option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={handleReport}
                      disabled={reportStatus === "loading" || reportStatus === "success" || !reportCircleId}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-[#31487A] hover:bg-[#7CB8F2] hover:text-[#0f172a] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {reportStatus === "loading" ? "Reporting..." : reportStatus === "success" ? "✓ Reported" : "Report"}
                    </button>
                  </div>
                  {groups.length === 0 && !groupsLoading && (
                    <div className="mt-4 p-4 rounded-xl border border-dashed border-white/20 bg-white/5 text-center space-y-2">
                      <p className="text-sm text-slate-300">You need to join or create a circle before reporting.</p>
                      <button 
                        onClick={() => { setAppMode("radar"); document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="text-[#7CB8F2] text-xs font-bold hover:underline"
                      >
                        Go to Scam Radar to manage groups →
                      </button>
                    </div>
                  )}
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
          <div className="animate-fade-in mb-8">
            {!user ? (
              <div className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl mb-8 space-y-8 text-center">
                <h2 className="text-xl font-bold text-slate-100 mb-2">Sign in to use Scam Radar</h2>
                <p className="text-sm text-slate-400 mb-6">Join circles and report scams with your community.</p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#31487A] hover:bg-[#7CB8F2] hover:text-[#0f172a] text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <select
                      value={selectedCircle}
                      onChange={(e) => {
                        setSelectedCircle(e.target.value);
                        setShowInviteInfo(false);
                        dispatch({ type: 'DISMISS_INVITE_CODE' });
                        dispatch({ type: 'DISMISS_ACTION_MESSAGE' });
                      }}
                      className="flex-1 sm:flex-none rounded-2xl bg-[#232323] border border-black/10 text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7CB8F2] shadow-xl"
                      disabled={groups.length === 0}
                    >
                      {groups.length === 0 ? (
                        <option value="" className="bg-[#232323]">No groups available</option>
                      ) : (
                        groups.map(group => (
                          <option key={group.id} value={group.id} className="bg-[#232323]">{group.name}</option>
                        ))
                      )}
                    </select>
                    
                    {groups.length > 0 && (
                      <button
                        onClick={() => {
                          setShowInviteInfo(!showInviteInfo);
                          dispatch({ type: 'DISMISS_INVITE_CODE' });
                          dispatch({ type: 'DISMISS_ACTION_MESSAGE' });
                        }}
                        className="px-3 py-2.5 rounded-2xl text-sm font-bold bg-[#232323] hover:bg-[#31487A] text-white border border-black/10 shadow-xl transition-colors cursor-pointer"
                      >
                        {showInviteInfo ? "Hide Invite" : "Invite Others"}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                      onClick={() => setShowGroupActionForm(prev => prev === "join" ? "none" : "join")}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer border shadow-xl ${showGroupActionForm === "join" ? "bg-[#31487A] text-white border-[#7CB8F2]" : "bg-[#232323] text-slate-300 border-black/10 hover:bg-[#31487A] hover:text-white"}`}
                    >
                      Join Group
                    </button>
                    <button
                      onClick={() => setShowGroupActionForm(prev => prev === "create" ? "none" : "create")}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer border shadow-xl ${showGroupActionForm === "create" ? "bg-[#31487A] text-white border-[#7CB8F2]" : "bg-[#232323] text-slate-300 border-black/10 hover:bg-[#31487A] hover:text-white"}`}
                    >
                      Create Group
                    </button>
                    <button
                      onClick={fetchFeed}
                      disabled={feedLoading}
                      className="px-4 py-2.5 rounded-2xl text-sm font-bold bg-[#232323] hover:bg-[#31487A] text-white border border-black/10 shadow-xl disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {feedLoading ? "↻" : "↻"}
                    </button>
                  </div>
                </div>

            {/* Persistent Invite Info */}
            {showInviteInfo && groups.find(g => g.id === selectedCircle)?.invite_code && (
              <div className="p-5 rounded-2xl border border-[#7CB8F2]/30 bg-[#7CB8F2]/10 text-center space-y-3 mb-6 animate-fade-in">
                <p className="text-sm font-semibold text-[#7CB8F2]">Invite others to {groups.find(g => g.id === selectedCircle)?.name}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono bg-black/40 px-4 py-2 rounded-xl text-slate-200 border border-white/10">
                    {groups.find(g => g.id === selectedCircle)?.invite_code}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(groups.find(g => g.id === selectedCircle)?.invite_code ?? '')}
                    className="px-3 py-2 bg-[#7CB8F2]/20 hover:bg-[#7CB8F2]/30 text-[#7CB8F2] rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400">Share this code with people you want to join your circle.</p>
              </div>
            )}

            {/* Action Message (Join/Create Success or Error) */}
            {groupActionMessage && (
              <div className={`p-4 rounded-xl text-sm mb-6 flex justify-between items-center animate-fade-in ${groupActionStatus === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                <span>{groupActionMessage}</span>
                <button onClick={() => dispatch({ type: 'DISMISS_ACTION_MESSAGE' })} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}

            {/* Success Creation Invite Info */}
            {newInviteCode && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3 mb-6 animate-fade-in">
                <p className="text-sm font-semibold text-amber-300">Group created! Here is your invite code:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono bg-black/40 px-4 py-2 rounded-xl text-slate-200 border border-white/10">
                    {newInviteCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newInviteCode)}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400">Share this code with people you want to join your circle.</p>
                <button
                  onClick={() => dispatch({ type: 'DISMISS_INVITE_CODE' })}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {feedError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6">
                ⚠️ {feedError}
              </div>
            )}

            {/* Permanent Join Group Inline Form */}
            {showGroupActionForm === "join" && (
              <div className="mb-6 p-5 rounded-2xl bg-[#181818] border border-white/5 animate-fade-in">
                <h3 className="font-semibold text-slate-200 mb-4">Have an invite code?</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => dispatch({ type: 'SET_INPUT', field: 'joinInviteCode', value: e.target.value })}
                    placeholder="Paste invite code here"
                    className="flex-1 rounded-xl bg-[#232323] border border-white/10 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:border-[#7CB8F2]"
                  />
                  <button
                    onClick={handleJoinGroup}
                    disabled={groupActionStatus === "loading" || !joinInviteCode.trim()}
                    className="sm:w-32 py-2.5 rounded-xl text-sm font-bold bg-[#232323] border border-white/15 hover:border-white/30 text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {groupActionStatus === "loading" ? "Joining..." : "Join Group"}
                  </button>
                </div>
              </div>
            )}

            {/* Permanent Create Group Inline Form */}
            {showGroupActionForm === "create" && (
              <div className="mb-6 p-5 rounded-2xl bg-[#181818] border border-white/5 animate-fade-in">
                <h3 className="font-semibold text-slate-200 mb-4">Create a New Group</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={createGroupName}
                    onChange={(e) => dispatch({ type: 'SET_INPUT', field: 'createGroupName', value: e.target.value })}
                    placeholder="e.g. Sharma Family Group"
                    className="flex-1 rounded-xl bg-[#232323] border border-white/10 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:border-[#7CB8F2]"
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={groupActionStatus === "loading" || !createGroupName.trim()}
                    className="sm:w-32 py-2.5 rounded-xl text-sm font-bold bg-[#31487A] hover:bg-[#7CB8F2] hover:text-[#0f172a] text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {groupActionStatus === "loading" ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </div>
            )}

            {groups.length === 0 && !groupsLoading ? (
              <div className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl mb-8 space-y-8 text-center animate-fade-in">
                <h2 className="text-xl font-bold text-slate-100 mb-2">Welcome to Scam Radar</h2>
                <p className="text-sm text-slate-400">You are not in any groups yet. Use the buttons above to join a circle or create your own to start sharing reports with your community.</p>
              </div>
            ) : (

            <div className="space-y-4">
              {feedReports.length === 0 && !feedLoading ? (
                <div className="text-center py-12 border border-dashed border-black/15 bg-[#232323] rounded-3xl text-white">
                  <p className="text-slate-300 text-sm">No reports in this circle yet.</p>
                </div>
              ) : (
                feedReports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-black/10 bg-[#232323] text-white p-5 flex gap-4 shadow-xl">
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
                      
                      <p className="text-sm text-slate-200 line-clamp-3 italic opacity-90 border-l-2 border-[#7CB8F2] pl-2.5">
                        "{report.text}"
                      </p>

                      <div className="bg-[#181818] rounded-xl p-3 text-sm text-slate-300 border border-white/10">
                        {report.explanation}
                      </div>

                      {report.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {report.flags.map((flag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
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
            )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* 2-Layer Organic Wave Footer (Caramel #C68B59 & Black #232323 - Seamless Overlap) */}
      <footer className="w-full mt-12 overflow-hidden pointer-events-none select-none">
        <div className="w-full relative">
          <svg
            className="w-full h-24 sm:h-32 md:h-40 block overflow-visible"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Layer 1: Caramel #C68B59 Upper Wave */}
            <path
              d="M 0,38 C 260,85 460,8 800,42 C 1100,78 1280,18 1440,42 L 1440,161 L 0,161 Z"
              fill="#C68B59"
            />
            {/* Layer 2: Black #232323 Base Wave (Directly Overlapping Caramel Layer) */}
            <path
              d="M 0,62 C 320,24 600,90 940,48 C 1180,16 1340,64 1440,50 L 1440,161 L 0,161 Z"
              fill="#232323"
              style={{ filter: "drop-shadow(0px -4px 6px rgba(0, 0, 0, 0.25))" }}
            />
          </svg>
          {/* Solid Black Base Foundation */}
          <div className="w-full bg-[#232323] h-14 sm:h-20 md:h-28 -mt-1 relative" />
        </div>
      </footer>

      {/* Auth modal — rendered as an overlay, outside all layout containers */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
}
