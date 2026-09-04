"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "ALERT_SHARED"
  | "ALERT_CONFIRMED"
  | "CIRCLE_UPDATED";

interface TopCategory {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

interface DashboardActivity {
  id: string;
  type: ActivityType;
  actorName: string;
  title: string;
  desc: string;
  timestamp: string;
  circleName: string;
  circleId: string;
}

interface DashboardCircle {
  id: string;
  name: string;
  memberCount: number;
  reportCount: number;
  role: string;
  inviteCode: string;
}

interface DashboardData {
  userId: string;
  groupCount: number;
  reportCount: number;
  confirmationCount: number;
  uniqueMemberCount: number;
  topCategories: TopCategory[];
  recentActivity: DashboardActivity[];
  circles: DashboardCircle[];
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface HomeDashboardProps {
  displayName: string | null;
  isDark: boolean;
  onNavigateToCircle: () => void;
  onNavigateToAnalyse: () => void;
  refreshTrigger?: number;
}

// ─── Utility: relative time ───────────────────────────────────────────────────
function formatRelTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 5) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "Recently";
  }
}

// ─── Skeleton component ───────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Activity icon ────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: ActivityType }) {
  const base =
    "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center";

  if (type === "ALERT_SHARED") {
    return (
      <span className={`${base} bg-blue-500/15`}>
        <svg
          className="w-4 h-4 text-[#1D68FF]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </span>
    );
  }
  if (type === "ALERT_CONFIRMED") {
    return (
      <span className={`${base} bg-emerald-500/15`}>
        <svg
          className="w-4 h-4 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (type === "MEMBER_JOINED") {
    return (
      <span className={`${base} bg-violet-500/15`}>
        <svg
          className="w-4 h-4 text-violet-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      </span>
    );
  }
  if (type === "MEMBER_LEFT") {
    return (
      <span className={`${base} bg-slate-500/15`}>
        <svg
          className="w-4 h-4 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`${base} bg-cyan-500/15`}>
      <svg
        className="w-4 h-4 text-cyan-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </span>
  );
}

// ─── Circle avatar (letter-based) ────────────────────────────────────────────
function CircleAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const letter = name.trim()[0]?.toUpperCase() || "?";
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
      ? "w-14 h-14 text-xl"
      : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-bold border-2 border-white/10 flex-shrink-0`}
      style={{
        background: `hsl(${hue}, 55%, 32%)`,
        color: `hsl(${hue}, 80%, 85%)`,
      }}
    >
      {letter}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HomeDashboard({
  displayName,
  isDark,
  onNavigateToCircle,
  onNavigateToAnalyse,
  refreshTrigger = 0,
}: HomeDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json: DashboardData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    hasFetchedRef.current = true;
  }, [fetchDashboard]);

  // Re-fetch on refreshTrigger change (e.g., after sharing a report)
  useEffect(() => {
    if (hasFetchedRef.current && refreshTrigger > 0) {
      fetchDashboard();
    }
  }, [refreshTrigger, fetchDashboard]);

  // Derived display name
  const greeting =
    displayName ||
    (data?.userId ? data.userId.slice(0, 8) : "there");

  // Stats cards config
  const stats = [
    {
      id: "groups",
      label: "My Circles",
      sub: "You're part of",
      value: data?.groupCount ?? 0,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="12" r="2.5" />
          <path d="M2 21a2.5 2.5 0 0 1 5 0" />
          <path d="M17 21a2.5 2.5 0 0 1 5 0" />
        </svg>
      ),
      gradient: "from-blue-600/20 to-blue-900/10",
      iconBg: "bg-blue-500/10",
      iconColor: "text-[#1D68FF]",
      onClick: onNavigateToCircle,
    },
    {
      id: "reports",
      label: "Reports",
      sub: "You have shared",
      value: data?.reportCount ?? 0,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      gradient: "from-violet-600/20 to-violet-900/10",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      onClick: onNavigateToCircle,
    },
    {
      id: "confirmations",
      label: "Confirmations",
      sub: "Reports you confirmed",
      value: data?.confirmationCount ?? 0,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      gradient: "from-emerald-600/20 to-emerald-900/10",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      onClick: onNavigateToCircle,
    },
    {
      id: "members",
      label: "Members",
      sub: "Across your circles",
      value: data?.uniqueMemberCount ?? 0,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      gradient: "from-amber-600/20 to-amber-900/10",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      onClick: onNavigateToCircle,
    },
  ];

  const cardBase =
    "relative rounded-2xl border border-white/[0.07] bg-[#0D1424] shadow-xl overflow-hidden";

  const visibleActivity = showAllActivity
    ? data?.recentActivity ?? []
    : (data?.recentActivity ?? []).slice(0, 5);

  // Max bar width for chart
  const maxCount =
    data && data.topCategories.length > 0
      ? Math.max(...data.topCategories.map((c) => c.count), 1)
      : 1;

  return (
    <div className="w-full space-y-5 animate-fade-in">

      {/* ── Row 1: Welcome + Safety Card ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-stretch">

        {/* Welcome block */}
        <div className="flex flex-col justify-center space-y-1 py-3 px-1">
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Good to see you again,
          </p>
          {loading && !data ? (
            <Skeleton className="h-9 w-48 mt-1" />
          ) : (
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {greeting}
              <span className="ml-2 text-3xl select-none">👋</span>
            </h1>
          )}
          <p className="text-slate-500 text-sm sm:text-base pt-1 font-medium">
            Stay informed. Stay alert. Stay safer with your Circles.
          </p>
        </div>

        {/* Safety card */}
        <div
          className="relative rounded-2xl overflow-hidden border border-blue-800/30 shadow-xl flex-shrink-0 min-w-0 lg:min-w-[340px] xl:min-w-[400px]"
          style={{
            background:
              "linear-gradient(135deg, #0A1428 0%, #0D1F44 50%, #091633 100%)",
          }}
        >
          {/* Subtle glow orb */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #1D68FF 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="relative flex items-center gap-4 p-5 pr-6">
            {/* Shield icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-[#1D68FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-white font-bold text-base sm:text-lg leading-tight">
                A safer tomorrow
                <br />
                <span className="text-slate-300 font-semibold text-sm sm:text-base">
                  starts with stronger communities.
                </span>
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xs">
                Your Circles detect and stop scams—keeping you and everyone around you safer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <button
            key={stat.id}
            id={`dashboard-stat-${stat.id}`}
            onClick={stat.onClick}
            className={`${cardBase} text-left group cursor-pointer transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-2xl active:scale-95`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`}
            />
            <div className="relative p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  {stat.icon}
                </div>
                <svg
                  className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <div className="mt-3">
                {loading && !data ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-white leading-none">
                    {stat.value.toLocaleString()}
                  </span>
                )}
                <p className="text-white font-semibold text-sm mt-1">
                  {stat.label}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Row 3: Intelligence + Activity ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

        {/* Top Scam Categories */}
        <div className={`${cardBase} p-5 sm:p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#1D68FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h2 className="text-white font-bold text-base sm:text-lg">
                  Top Scam Categories
                </h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 ml-9">
                Most reported types across your Circles
              </p>
            </div>
          </div>

          {/* Chart area */}
          {loading && !data ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-6" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">Failed to load categories.</p>
              <button
                onClick={fetchDashboard}
                className="text-[#1D68FF] text-sm font-semibold mt-2 hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data && data.topCategories.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">No scam insights yet</p>
              <p className="text-slate-600 text-xs mt-1">Share a report in one of your Circles to see category trends.</p>
              <button
                onClick={onNavigateToAnalyse}
                className="mt-3 text-[#1D68FF] text-xs font-semibold hover:underline cursor-pointer"
              >
                Analyse your first scam →
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data?.topCategories.map((cat) => {
                const barWidth =
                  maxCount > 0
                    ? `${Math.round((cat.count / maxCount) * 100)}%`
                    : "0%";
                return (
                  <div key={cat.name} className="flex items-center gap-3 group">
                    {/* Category label */}
                    <div className="w-36 sm:w-44 flex-shrink-0">
                      <span className="text-slate-300 text-xs sm:text-sm font-medium leading-tight line-clamp-1">
                        {cat.name}
                      </span>
                    </div>

                    {/* Bar track */}
                    <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: barWidth,
                          background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color}88)`,
                          boxShadow: `0 0 8px ${cat.color}40`,
                        }}
                      />
                    </div>

                    {/* Count */}
                    <span className="text-slate-400 text-xs font-semibold w-6 text-right tabular-nums flex-shrink-0">
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {data && data.topCategories.length > 0 && (
            <button
              onClick={onNavigateToCircle}
              className="mt-5 flex items-center gap-1.5 text-[#1D68FF] text-xs sm:text-sm font-semibold hover:gap-2 transition-all cursor-pointer group"
            >
              <span>View all insights</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>

        {/* My Activity */}
        <div className={`${cardBase} p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-base sm:text-lg">
                My Activity
              </h2>
            </div>
            {(data?.recentActivity?.length ?? 0) > 5 && (
              <button
                onClick={() => setShowAllActivity((p) => !p)}
                className="text-[#1D68FF] text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                {showAllActivity ? "Show less" : "View all →"}
              </button>
            )}
          </div>

          {/* Activity list */}
          <div className="flex-1 space-y-0 overflow-hidden">
            {loading && !data ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-3 w-12 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Failed to load activity.</p>
              </div>
            ) : visibleActivity.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">No recent activity</p>
                <p className="text-slate-600 text-xs mt-1">Activity will appear here as your Circles stay active.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {visibleActivity.map((act, idx) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <ActivityIcon type={act.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-semibold leading-tight truncate">
                        {act.title}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 leading-snug line-clamp-2">
                        {act.desc}
                      </p>
                    </div>
                    <span className="text-slate-600 text-xs flex-shrink-0 pt-0.5 tabular-nums">
                      {formatRelTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && !error && (data?.recentActivity?.length ?? 0) > 0 && (
            <button
              onClick={onNavigateToCircle}
              className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-1.5 text-[#1D68FF] text-xs font-semibold hover:gap-2 transition-all cursor-pointer group w-full"
            >
              <span>Open My Circle</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Row 4: Your Circles ────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-white/[0.07] shadow-xl"
        style={{
          background:
            "linear-gradient(135deg, #090F1E 0%, #0D1530 55%, #08111F 100%)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, #1D68FF 0%, transparent 70%)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shadow-lg flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#1D68FF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-base sm:text-xl">
                  Your Circles
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Stronger together against scams
                </p>
              </div>
            </div>

            <button
              id="dashboard-view-circles-btn"
              onClick={onNavigateToCircle}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/20 flex-shrink-0 self-start sm:self-auto"
            >
              <span>View My Circles</span>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Circles grid */}
          {loading && !data ? (
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">Failed to load your Circles.</p>
              <button
                onClick={fetchDashboard}
                className="text-[#1D68FF] text-sm font-semibold mt-1 hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data && data.circles.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-slate-300 font-semibold text-sm">
                You're not in any Circles yet
              </p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                Join or create a Circle to build community scam protection with people you trust.
              </p>
              <button
                onClick={onNavigateToCircle}
                className="mt-4 px-5 py-2 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] text-white font-bold text-sm cursor-pointer transition-all active:scale-95"
              >
                Explore Circles →
              </button>
            </div>
          ) : (
            <>
              {/* Circles list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {(data?.circles ?? []).slice(0, 6).map((circle) => (
                  <button
                    key={circle.id}
                    onClick={onNavigateToCircle}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group text-left active:scale-95"
                  >
                    <CircleAvatar name={circle.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate group-hover:text-[#1D68FF] transition-colors">
                        {circle.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">
                          {circle.memberCount}{" "}
                          {circle.memberCount === 1 ? "member" : "members"}
                        </span>
                        {circle.reportCount > 0 && (
                          <>
                            <span className="text-slate-700 text-xs">·</span>
                            <span className="text-slate-500 text-xs">
                              {circle.reportCount}{" "}
                              {circle.reportCount === 1 ? "report" : "reports"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {circle.role === "admin" && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-blue-500/15 text-[#1D68FF] text-[10px] font-bold">
                        Admin
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Summary row */}
              {(data?.circles?.length ?? 0) > 0 && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#1D68FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-slate-400 text-xs">
                      <span className="text-white font-bold">{data?.groupCount}</span>{" "}
                      {(data?.groupCount ?? 0) === 1 ? "Circle" : "Circles"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span className="text-slate-400 text-xs">
                      <span className="text-white font-bold">{data?.uniqueMemberCount}</span>{" "}
                      unique members
                    </span>
                  </div>
                  {(data?.circles?.reduce((s, c) => s + c.reportCount, 0) ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-slate-400 text-xs">
                        <span className="text-white font-bold">
                          {data?.circles.reduce((s, c) => s + c.reportCount, 0)}
                        </span>{" "}
                        threats tracked
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Row 5: Analyse CTA ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1424] overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#1D68FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base sm:text-lg leading-tight">
                Spot a scam? Analyse it now.
              </p>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Check messages, links, images or voice notes with AI before you take any action.
              </p>
            </div>
          </div>

          <button
            id="dashboard-analyse-cta"
            onClick={onNavigateToAnalyse}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/20 flex-shrink-0 whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span>Analyse a Scam →</span>
          </button>
        </div>
      </div>

    </div>
  );
}
