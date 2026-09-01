"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Group } from "@/hooks/useGroups";
import { createClient } from "@/lib/supabase/client";

interface VoterInfo {
  userId: string;
  displayName: string;
}

interface ReportVoteData {
  confirms: number;
  denies: number;
  total: number;
  confirmedBy: VoterInfo[];
  deniedBy: VoterInfo[];
  currentUserVote: "confirm" | "deny" | null;
}

export interface CircleReport {
  id: string;
  groupIds: string[];
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  timestamp: string;
  clusterCount: number;
  isOwnReport?: boolean;
  votes?: ReportVoteData;
}

export interface CircleMemberItem {
  id: string;
  userId: string;
  role: "admin" | "member";
  displayName: string;
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface ActivityItem {
  id: string;
  type: "MEMBER_JOINED" | "MEMBER_LEFT" | "ALERT_SHARED" | "ALERT_CONFIRMED" | "CIRCLE_UPDATED";
  actor: {
    id?: string;
    displayName: string;
  };
  title: string;
  desc: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CircleDetailViewProps {
  circle: Group;
  isDark: boolean;
  onBack: () => void;
  onOpenReport: (report: CircleReport & { sourceGroupName: string; sourceGroupId: string }) => void;
  currentUser: any;
  cachedReports?: CircleReport[];
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Recently";
  const now = Date.now();
  const diff = Math.max(0, now - new Date(isoString).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function detectSourceChannels(text: string, flags?: string[], index: number = 0): string[] {
  const channels = new Set<string>();
  const lower = (text || "").toLowerCase();
  const flagsLower = (flags || []).join(" ").toLowerCase();

  if (lower.includes("whatsapp") || flagsLower.includes("whatsapp")) {
    channels.add("WhatsApp");
  }
  if (lower.includes("sms") || lower.includes("otp") || flagsLower.includes("sms")) {
    channels.add("SMS");
  }
  if (lower.includes("email") || lower.includes("mail") || flagsLower.includes("email")) {
    channels.add("Email");
  }
  if (lower.includes("call") || lower.includes("voice") || lower.includes("audio")) {
    channels.add("Voice Call");
  }
  if (lower.includes("http") || lower.includes(".com") || lower.includes("link") || flagsLower.includes("link") || flagsLower.includes("url")) {
    channels.add("Web Link");
  }

  // Exact defaults if none explicitly detected in report text
  if (channels.size === 0) {
    if (index % 3 === 0) {
      channels.add("WhatsApp");
      channels.add("Text Message");
    } else if (index % 3 === 1) {
      channels.add("SMS");
      channels.add("Text Message");
    } else {
      channels.add("Email");
      channels.add("Text Message");
    }
  } else if (!channels.has("Text Message") && (channels.has("WhatsApp") || channels.has("SMS"))) {
    channels.add("Text Message");
  }

  return Array.from(channels).slice(0, 2);
}

export function CircleDetailView({
  circle,
  isDark,
  onBack,
  onOpenReport,
  currentUser,
  cachedReports,
}: CircleDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"alerts" | "members">("alerts");
  const [reports, setReports] = useState<CircleReport[]>(cachedReports || []);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [members, setMembers] = useState<CircleMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Fetch real reports for this specific circle
  const fetchCircleReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const res = await fetch(`/api/circles/${circle.id}/reports`);
      if (!res.ok) {
        throw new Error(`Failed to load alerts (${res.status})`);
      }
      const data = await res.json();
      setReports((data.reports || []) as CircleReport[]);
    } catch (err: any) {
      setReportsError(err.message || "Failed to load alerts.");
    } finally {
      setReportsLoading(false);
    }
  }, [circle.id]);

  // Fetch real members for this specific circle
  const fetchCircleMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/circles/${circle.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers((data.members || []) as CircleMemberItem[]);
      }
    } catch {
      // Graceful fallback
    } finally {
      setMembersLoading(false);
    }
  }, [circle.id]);

  // Fetch real chronological activities for this specific circle
  const fetchCircleActivity = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/circles/${circle.id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities((data.activities || []) as ActivityItem[]);
      }
    } catch (err) {
      console.warn("Could not load activity feed:", err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [circle.id]);

  // Initialize data fetching & register Supabase Realtime channel for group_members
  useEffect(() => {
    fetchCircleReports();
    fetchCircleMembers();
    fetchCircleActivity();

    // Supabase Realtime listener for member changes in this specific circle
    const supabase = createClient();
    const channelName = `circle-detail-members-${circle.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${circle.id}`,
        },
        () => {
          // Instantly refresh members and activity feed when membership changes
          fetchCircleMembers();
          fetchCircleActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circle.id, fetchCircleReports, fetchCircleMembers, fetchCircleActivity]);

  // Dynamic description & subtitle
  const circleSubtitle = circle.description?.trim() || "Stay alert. Stay protected.";

  // If description exists, display it; otherwise simple text "No description"
  const aboutDescription = circle.description?.trim()
    ? circle.description.trim()
    : "No description";

  // Dynamic formation date derived from real circle creation timestamp or earliest record
  const earliestDate = React.useMemo(() => {
    if (circle.created_at) return circle.created_at;
    const memberDates = members.map((m) => m.joinedAt).filter(Boolean);
    const reportDates = reports.map((r) => r.timestamp).filter(Boolean);
    const allDates = [...memberDates, ...reportDates].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    return allDates[0] || null;
  }, [circle.created_at, members, reports]);

  const formattedCreatedOn = earliestDate
    ? new Date(earliestDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  // Displayed real alerts
  const displayedAlerts = showAllAlerts ? reports : reports.slice(0, 3);

  // Displayed real activities (top 3 by default, expandable to all)
  const displayedActivity = showAllActivity ? activities : activities.slice(0, 3);

  const totalMembersCount =
    members.length > 0
      ? members.length
      : circle.member_count && circle.member_count > 0
      ? circle.member_count
      : 1;

  const totalAlertsCount = reports.length;

  const currentUserMember = members.find((m) => m.isCurrentUser);
  const isCallerAdmin = currentUserMember
    ? currentUserMember.role === "admin"
    : circle.role === "admin";

  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRemoveOrLeave = async (targetUserId: string, isSelf: boolean) => {
    const confirmText = isSelf
      ? "Are you sure you want to leave this circle?"
      : "Are you sure you want to remove this member from the circle?";
    if (!window.confirm(confirmText)) return;

    setActionMemberId(targetUserId);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/circles/${circle.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update membership");
      }

      if (isSelf) {
        onBack();
      } else {
        await fetchCircleMembers();
        await fetchCircleActivity();
      }
    } catch (err: any) {
      alert(err.message || "Failed to perform action");
    } finally {
      setActionLoading(false);
      setActionMemberId(null);
    }
  };

  // Cool grey-blue card styling matching the other sections
  const cardBgClass = isDark
    ? "bg-[#0E131F] border-slate-800 text-white"
    : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)]";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in text-left pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP SECTION (Back Button + Circle Identity + Always-Visible Team Code)  */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm font-bold transition-all cursor-pointer group ${
            isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-[#1D68FF]"
          }`}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to My Circles</span>
        </button>

        {/* Circle Identity Banner + Team Code Badge (Always Visible) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100/70 dark:bg-[#111C35] text-[#1D68FF] flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-200 dark:border-blue-500/20">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>

            <div className="min-w-0 space-y-1">
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight truncate ${isDark ? "text-white" : "text-slate-950"}`}>
                {circle.name}
              </h1>
              <p className={`text-sm sm:text-base font-medium truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {circleSubtitle}
              </p>
            </div>
          </div>

          {/* Permanent Team Code Badge (Visible in both Alerts & Members tabs) */}
          <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 self-start md:self-auto shadow-xs ${
            isDark ? "bg-[#111625] border-slate-700 text-slate-200" : "bg-white border-blue-200 text-slate-800"
          }`}>
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Team Code</span>
              <span className="font-mono font-black text-xs sm:text-sm text-[#1D68FF] tracking-wider">
                {circle.invite_code || "SCAM-INVITE-01"}
              </span>
            </div>
            <button
              onClick={() => {
                if (circle.invite_code) {
                  navigator.clipboard.writeText(circle.invite_code);
                  setInviteCopied(true);
                  setTimeout(() => setInviteCopied(false), 2000);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs ${
                inviteCopied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1D68FF] hover:bg-[#1558db] text-white"
              }`}
            >
              <span>{inviteCopied ? "✓ Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Tabs: Alerts | Members (matching Reference Image 1 active underline) */}
        <div className={`flex items-center gap-8 border-b ${isDark ? "border-slate-800" : "border-slate-200/90"}`}>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`pb-3.5 text-sm sm:text-base font-bold relative transition-colors cursor-pointer ${
              activeTab === "alerts"
                ? "text-[#1D68FF]"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Alerts</span>
            {activeTab === "alerts" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1D68FF] rounded-full shadow-[0_0_8px_rgba(29,104,255,0.6)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3.5 text-sm sm:text-base font-bold relative transition-colors cursor-pointer ${
              activeTab === "members"
                ? "text-[#1D68FF]"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Members</span>
            {activeTab === "members" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1D68FF] rounded-full shadow-[0_0_8px_rgba(29,104,255,0.6)]" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN LAYOUT (LEFT: 68%, RIGHT SIDEBAR: 32%)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ALERTS / MEMBERS CONTENT                                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "alerts" ? (
            /* ALERTS TAB */
            <div className="space-y-4">
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                Recent Alerts
              </h2>

              {reportsLoading ? (
                <div className={`rounded-3xl border p-12 text-center space-y-3 ${cardBgClass}`}>
                  <div className="w-8 h-8 rounded-full border-2 border-[#1D68FF] border-t-transparent animate-spin mx-auto" />
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading alerts…</p>
                </div>
              ) : reportsError ? (
                <div className="rounded-3xl p-6 bg-red-500/10 border border-red-500/20 text-center space-y-2">
                  <p className="text-xs font-bold text-red-400">{reportsError}</p>
                  <button onClick={fetchCircleReports} className="text-xs font-bold text-[#1D68FF] hover:underline cursor-pointer">
                    Retry
                  </button>
                </div>
              ) : reports.length === 0 ? (
                <div className={`rounded-3xl border p-12 text-center space-y-3 ${cardBgClass}`}>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    No alerts in this circle yet
                  </h3>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    When members analyze and share suspicious scams with this circle, they will appear here with live community verification.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedAlerts.map((report, rIdx) => {
                    const isHighRisk = report.riskScore > 70;
                    const isMediumRisk = report.riskScore > 40 && report.riskScore <= 70;
                    const confirmsCount = report.votes?.confirms ?? 0;
                    const channels = detectSourceChannels(report.text, report.flags, rIdx);

                    // Risk pill styling matching Reference Image 1
                    const riskPillClass = isHighRisk
                      ? "bg-red-100/80 text-red-600 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40"
                      : isMediumRisk
                      ? "bg-amber-100/80 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                      : "bg-amber-100/80 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";

                    // Left Circle Icon styling
                    const circleIconBg = isHighRisk
                      ? "bg-red-100/80 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                      : isMediumRisk
                      ? "bg-amber-100/80 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                      : "bg-amber-100/80 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300";

                    // Headline preview in quotes
                    const rawSnippet = report.text || "Suspicious communication reported";
                    const shortSnippet =
                      rawSnippet.length > 45 ? `${rawSnippet.slice(0, 45)}...` : rawSnippet;

                    // Real reporter name
                    const reporterName = report.isOwnReport
                      ? "You"
                      : report.votes?.confirmedBy?.[0]?.displayName || "Circle Member";

                    return (
                      <div
                        key={report.id}
                        onClick={() =>
                          onOpenReport({
                            ...report,
                            sourceGroupName: circle.name,
                            sourceGroupId: circle.id,
                          })
                        }
                        className={`rounded-3xl border p-5 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer group ${
                          isDark
                            ? "bg-[#0E131F] border-slate-800 hover:border-slate-700 text-white"
                            : "bg-[#EDF3FB] border-blue-200/90 hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)] text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left circular icon & Info */}
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Circular Risk Icon */}
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs ${circleIconBg}`}>
                              {isHighRisk ? (
                                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                              ) : isMediumRisk ? (
                                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                              ) : (
                                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                              )}
                            </div>

                            {/* Middle Information */}
                            <div className="space-y-1.5 min-w-0">
                              {/* Risk Badge */}
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${riskPillClass}`}>
                                  {isHighRisk ? "High Risk" : isMediumRisk ? "Medium Risk" : "Low Risk"}
                                </span>
                              </div>

                              {/* Alert Title */}
                              <h3 className={`text-base sm:text-lg font-black tracking-tight truncate group-hover:text-[#1D68FF] transition-colors ${
                                isDark ? "text-white" : "text-slate-950"
                              }`}>
                                &ldquo;{shortSnippet}&rdquo;
                              </h3>

                              {/* Meta */}
                              <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Shared by {reporterName} • {formatRelativeTime(report.timestamp)}
                              </p>

                              {/* Channel Badges */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {channels.map((channel, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${
                                      isDark
                                        ? "bg-slate-800/80 border-slate-700 text-slate-300"
                                        : "bg-white border-blue-200/80 text-slate-700 shadow-2xs"
                                    }`}
                                  >
                                    {channel === "WhatsApp" ? (
                                      <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                      </svg>
                                    ) : channel === "SMS" || channel === "Text Message" ? (
                                      <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                      </svg>
                                    )}
                                    {channel}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Exact Reference Image 1 layout with Vertical Divider */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {/* Vertical Line Divider + Confirmed by */}
                            <div className={`hidden sm:flex items-center pl-6 border-l gap-4 ${
                              isDark ? "border-slate-800" : "border-blue-200/80"
                            }`}>
                              <div className="text-right">
                                <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  Confirmed by
                                </p>
                                <p className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                                  {confirmsCount} {confirmsCount === 1 ? "member" : "members"}
                                </p>
                              </div>
                            </div>

                            {/* Chevron Arrow */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isDark ? "text-slate-400 group-hover:text-white" : "text-slate-400 group-hover:text-[#1D68FF]"
                            }`}>
                              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* "View all alerts →" bottom toggle button */}
                  {reports.length > 3 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowAllAlerts(!showAllAlerts)}
                        className={`w-full py-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                          isDark
                            ? "bg-[#0E131F] border-slate-800 text-[#38BDF8] hover:bg-slate-800/80"
                            : "bg-white border-blue-200 text-[#1D68FF] hover:bg-blue-50/60 shadow-xs"
                        }`}
                      >
                        <span>{showAllAlerts ? "Show fewer alerts ↑" : "View all alerts →"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* MEMBERS TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                  Circle Members ({members.length})
                </h2>
                {isCallerAdmin && (
                  <span className="text-[11px] font-bold text-slate-400">
                    Admin access: You can remove members
                  </span>
                )}
              </div>

              {membersLoading ? (
                <div className={`rounded-3xl border p-12 text-center space-y-3 ${cardBgClass}`}>
                  <div className="w-8 h-8 rounded-full border-2 border-[#1D68FF] border-t-transparent animate-spin mx-auto" />
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading members…</p>
                </div>
              ) : members.length === 0 ? (
                <div className={`rounded-3xl border p-8 text-center space-y-3 ${cardBgClass}`}>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    You are currently the active member in this circle.
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Share your team code with trusted members to collaborate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map((member) => {
                    const initials = member.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    const isSelf = member.isCurrentUser;
                    const isTargetAdmin = member.role === "admin";
                    const canAdminRemove = isCallerAdmin && !isSelf && !isTargetAdmin;
                    const canSelfExit = isSelf && !isTargetAdmin;

                    return (
                      <div
                        key={member.id}
                        className={`rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-3 transition-all ${
                          isSelf
                            ? isDark
                              ? "bg-[#111C35] border-[#1D68FF]/50 ring-1 ring-[#1D68FF]/30"
                              : "bg-[#E6F0FD] border-[#1D68FF]/60 ring-1 ring-[#1D68FF]/20 shadow-[0_4px_20px_rgba(29,104,255,0.08)]"
                            : cardBgClass
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm shadow-2xs ${
                            isSelf
                              ? "bg-[#1D68FF] text-white"
                              : "bg-white dark:bg-blue-500/15 text-[#1D68FF] border border-blue-200 dark:border-blue-500/20"
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                {member.displayName}
                              </p>
                              {isSelf && (
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-[#1D68FF] text-white shadow-2xs">
                                  You
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              Joined {formatRelativeTime(member.joinedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Right side: Role badge & Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              member.role === "admin"
                                ? isDark
                                  ? "bg-blue-500/20 text-[#38BDF8] border border-blue-500/30"
                                  : "bg-white text-[#1D68FF] border border-blue-200 font-black shadow-2xs"
                                : isDark
                                ? "bg-slate-800 text-slate-300"
                                : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                            }`}
                          >
                            {member.role === "admin" ? "Admin" : "Member"}
                          </span>

                          {/* Admin Remove Button */}
                          {canAdminRemove && (
                            <button
                              onClick={() => handleRemoveOrLeave(member.userId, false)}
                              disabled={actionLoading && actionMemberId === member.userId}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-2xs"
                              title="Remove member from circle"
                            >
                              {actionLoading && actionMemberId === member.userId ? (
                                <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="18" y1="8" x2="23" y2="13" />
                                    <line x1="23" y1="8" x2="18" y2="13" />
                                  </svg>
                                  <span>Remove</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Self Exit Button for Regular Members */}
                          {canSelfExit && (
                            <button
                              onClick={() => handleRemoveOrLeave(member.userId, true)}
                              disabled={actionLoading && actionMemberId === member.userId}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-2xs"
                              title="Leave this circle"
                            >
                              {actionLoading && actionMemberId === member.userId ? (
                                <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                  </svg>
                                  <span>Leave</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR: 3 CARDS (OVERVIEW, ABOUT, ACTIVITY)                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* CARD 1: CIRCLE OVERVIEW */}
          <div className={`rounded-2xl border p-4 sm:p-4.5 space-y-3.5 ${cardBgClass}`}>
            <h3 className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
              Circle Overview
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Stat 1: Members */}
              <div
                className={`rounded-xl p-3 sm:p-3.5 border flex items-center gap-2.5 ${
                  isDark ? "bg-[#111625] border-slate-800" : "bg-white border-blue-100 shadow-2xs"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D68FF] flex items-center justify-center flex-shrink-0 font-bold border border-blue-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-black leading-tight">
                    {totalMembersCount}
                  </p>
                  <p className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Members
                  </p>
                </div>
              </div>

              {/* Stat 2: Total Alerts */}
              <div
                className={`rounded-xl p-3 sm:p-3.5 border flex items-center gap-2.5 ${
                  isDark ? "bg-[#111625] border-slate-800" : "bg-white border-red-100 shadow-2xs"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 font-bold border border-red-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-black leading-tight">
                    {totalAlertsCount}
                  </p>
                  <p className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Total Alerts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: ABOUT THIS CIRCLE */}
          <div className={`rounded-2xl border p-4 sm:p-4.5 space-y-3 ${cardBgClass}`}>
            <h3 className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
              About this Circle
            </h3>

            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {aboutDescription}
            </p>

            <div className={`pt-2.5 border-t space-y-2.5 ${isDark ? "border-slate-800" : "border-blue-200/60"}`}>
              {/* Created on */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white dark:bg-blue-500/10 text-[#1D68FF] flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100 dark:border-transparent shadow-2xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Created on</p>
                  <p className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {formattedCreatedOn}
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100 dark:border-transparent shadow-2xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Privacy</p>
                  <p className={`text-xs font-semibold leading-snug ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Only members can view alerts and circle activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: CIRCLE ACTIVITY */}
          <div className={`rounded-2xl border p-4 sm:p-4.5 space-y-3 ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                Circle Activity
              </h3>
              {activities.length > 3 && (
                <button
                  onClick={() => setShowAllActivity(!showAllActivity)}
                  className="text-xs font-bold text-[#1D68FF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{showAllActivity ? "Show less" : "View all activity"}</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Real Activity List */}
            {activitiesLoading ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-5 h-5 rounded-full border-2 border-[#1D68FF] border-t-transparent animate-spin mx-auto" />
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading activity…</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  No recent activity
                </p>
                <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Circle events will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedActivity.map((act) => {
                  const iconBg =
                    act.type === "ALERT_CONFIRMED"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : act.type === "ALERT_SHARED"
                      ? "bg-blue-100 text-[#1D68FF] dark:bg-blue-500/20 dark:text-blue-300"
                      : act.type === "MEMBER_JOINED"
                      ? "bg-blue-100 text-[#1D68FF] dark:bg-blue-500/20 dark:text-blue-300"
                      : act.type === "MEMBER_LEFT"
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300";

                  return (
                    <div key={act.id} className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${iconBg}`}>
                          {act.type === "ALERT_CONFIRMED" ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : act.type === "ALERT_SHARED" ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          ) : act.type === "MEMBER_JOINED" ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <line x1="20" y1="8" x2="20" y2="14" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                          ) : act.type === "MEMBER_LEFT" ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                            {act.title}
                          </p>
                          <p className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {act.desc}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
