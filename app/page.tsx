"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGroups } from '@/hooks/useGroups';
import { AuthModal } from "@/app/components/AuthModal";
import { AudioInput } from "@/app/components/AudioInput";
import { CircleDetailView } from "@/app/components/CircleDetailView";
import { HomeDashboard } from "@/app/components/HomeDashboard";
import NotificationPopover from "./components/NotificationPopover";

interface CheckResult {
  analysisId?: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  embedding?: number[] | null;
  complaintDraft?: string;
  financialLossLikely?: boolean;
}

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

interface CircleReport {
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

// Multi-harmonic organic wave polygon generator for fluid theme transitions
function generateOrganicWavePoints(
  originX: number,
  originY: number,
  radius: number,
  phase: number = 0,
  numPoints: number = 48
): string {
  if (radius <= 0) {
    return Array.from({ length: numPoints }, () => `${originX.toFixed(1)}px ${originY.toFixed(1)}px`).join(", ");
  }

  const points: string[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    // Multi-harmonic curved wave profile with sweeping organic crests
    const waveModifier =
      1 +
      0.16 * Math.sin(3 * angle + phase) +
      0.09 * Math.cos(5 * angle - phase * 1.5) +
      0.05 * Math.sin(7 * angle + phase * 2);

    const r = radius * waveModifier;
    const x = originX + r * Math.cos(angle);
    const y = originY + r * Math.sin(angle);
    points.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
  }

  return points.join(", ");
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const isTransitioningTheme = useRef(false);
  const [waveOverlay, setWaveOverlay] = useState<{
    color: string;
    originX: number;
    originY: number;
  } | null>(null);

  const handleThemeToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioningTheme.current) return;

      const nextTheme = theme === "light" ? "dark" : "light";
      const rect = e.currentTarget.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      // Use native View Transitions API when available (Chrome, Edge, Safari 18+)
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        isTransitioningTheme.current = true;

        const maxDist = Math.hypot(
          Math.max(originX, window.innerWidth - originX),
          Math.max(originY, window.innerHeight - originY)
        );

        // Frame polygons (48 vertices each for smooth GPU interpolation)
        const startPoly = `polygon(${generateOrganicWavePoints(originX, originY, 0, 0)})`;
        const midPoly1 = `polygon(${generateOrganicWavePoints(originX, originY, maxDist * 0.4, 0.8)})`;
        const midPoly2 = `polygon(${generateOrganicWavePoints(originX, originY, maxDist * 0.95, 1.6)})`;
        const endPoly = `polygon(${generateOrganicWavePoints(originX, originY, maxDist * 1.8, 2.4)})`;

        const transition = (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });

        transition.ready
          .then(() => {
            const anim = document.documentElement.animate(
              {
                clipPath: [startPoly, midPoly1, midPoly2, endPoly],
              },
              {
                duration: 1100,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );

            anim.onfinish = () => {
              isTransitioningTheme.current = false;
            };
          })
          .catch(() => {
            isTransitioningTheme.current = false;
          });

        transition.finished.finally(() => {
          isTransitioningTheme.current = false;
        });
      } else {
        // Fallback for browsers without View Transitions API
        isTransitioningTheme.current = true;
        setWaveOverlay({
          color: nextTheme === "dark" ? "#060911" : "#FFFFFF",
          originX,
          originY,
        });
        setTimeout(() => {
          setTheme(nextTheme);
        }, 550);
        setTimeout(() => {
          setWaveOverlay(null);
          isTransitioningTheme.current = false;
        }, 1100);
      }
    },
    [theme]
  );
  const [activeNav, setActiveNav] = useState<"home" | "analyse" | "circle" | "about" | "features">("home");
  const [appMode, setAppMode] = useState<"personal" | "radar">("personal");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [selectedCircleDetailId, setSelectedCircleDetailId] = useState<string | null>(null);
  const [circleRefreshTrigger, setCircleRefreshTrigger] = useState<number>(0);
  const { user, displayName, loading: authLoading } = useAuth();

  // Navigation indicator & scroll spy refs
  const navCapsuleRef = useRef<HTMLDivElement>(null);
  const navButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isClickScrollingRef = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    const currentBtn = navButtonRefs.current[activeNav];
    const capsule = navCapsuleRef.current;
    if (currentBtn && capsule) {
      const btnRect = currentBtn.getBoundingClientRect();
      const capsuleRect = capsule.getBoundingClientRect();
      const left = btnRect.left - capsuleRect.left + 10;
      const width = Math.max(0, btnRect.width - 20);
      setIndicatorStyle({ left, width, opacity: 1 });
    }
  }, [activeNav]);

  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  const handleNavClick = useCallback((sectionId: "home" | "analyse" | "circle" | "features" | "about") => {
    setActiveNav(sectionId);
    isClickScrollingRef.current = true;

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "analyse") {
      document.getElementById("analyse-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "circle") {
      document.getElementById("circle-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "features") {
      document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "about") {
      document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" });
    }

    setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);
  }, []);

  // Automatic scroll tracking (Scroll Spy)
  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // When reaching near the bottom of page, activate about section
      if (windowHeight + scrollY >= docHeight - 80) {
        setActiveNav("about");
        return;
      }

      // At top of page, activate home
      if (scrollY < 120) {
        setActiveNav("home");
        return;
      }

      const analyseElem = document.getElementById("analyse-section");
      const circleElem = document.getElementById("circle-section");
      const featuresElem = document.getElementById("features-section");
      const aboutElem = document.getElementById("about-section");

      const sections = [
        { id: "analyse" as const, elem: analyseElem },
        { id: "circle" as const, elem: circleElem },
        { id: "features" as const, elem: featuresElem },
        { id: "about" as const, elem: aboutElem },
      ].filter((s): s is { id: "analyse" | "circle" | "features" | "about"; elem: HTMLElement } => s.elem !== null);

      let current: "home" | "analyse" | "circle" | "features" | "about" = "home";
      for (const section of sections) {
        const rect = section.elem.getBoundingClientRect();
        // Section top has crossed upper third of the viewport
        if (rect.top <= 260) {
          current = section.id;
        }
      }

      setActiveNav(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const [activeTab, setActiveTab] = useState<"text" | "image" | "audio">("text");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string; fileName?: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string>("");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareCircles, setSelectedShareCircles] = useState<string[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Reporting
  const [selectedReportGroupIds, setSelectedReportGroupIds] = useState<string[]>([]);
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Radar Feed & Circles UI (Reference Image 1)
  const [selectedCircle, setSelectedCircle] = useState<string>("");
  const [feedReports, setFeedReports] = useState<CircleReport[]>([]);
  const [allCircleReports, setAllCircleReports] = useState<(CircleReport & { sourceGroupName: string; sourceGroupId: string })[]>([]);
  const [groupReportsMap, setGroupReportsMap] = useState<Record<string, number>>({});
  const [groupLastActivityMap, setGroupLastActivityMap] = useState<Record<string, string>>({});
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  const [showGroupActionForm, setShowGroupActionForm] = useState<"none"|"join"|"create">("none");
  const [showCreateCircleModal, setShowCreateCircleModal] = useState(false);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [showAllCircles, setShowAllCircles] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivityReport, setSelectedActivityReport] = useState<(CircleReport & { sourceGroupName: string; sourceGroupId: string }) | null>(null);
  const [copiedInviteCircleId, setCopiedInviteCircleId] = useState<string | null>(null);

  // Groups State from Hook
  const {
    groups,
    loading: groupsLoading,
    createGroupName,
    createGroupDescription,
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
      if (!selectedCircle || !groups.find(g => g.id === selectedCircle)) {
        setSelectedCircle(groups[0].id);
      }
      setSelectedReportGroupIds((prev) => {
        const validPrev = prev.filter((id) => groups.some((g) => g.id === id));
        if (validPrev.length > 0) return validPrev;
        const defaultId = selectedCircle && groups.some((g) => g.id === selectedCircle) ? selectedCircle : groups[0].id;
        return [defaultId];
      });
      setSelectedShareCircles((prev) => {
        const validPrev = prev.filter((id) => groups.some((g) => g.id === id));
        if (validPrev.length > 0) return validPrev;
        return [groups[0].id];
      });
    } else {
      setSelectedReportGroupIds([]);
      setSelectedShareCircles([]);
      setSelectedCircle("");
    }
  }, [groups, selectedCircle]);




  // Copy button states
  const [shareAlertCopied, setShareAlertCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  // Voting & Deletion states (Phase 11)
  const [votingReportId, setVotingReportId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<{ reportId: string; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ reportId: string; message: string } | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearAnalysisState = useCallback(() => {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setAudioData(null);
    setResult(null);
    setShowDetailedAnalysis(false);
    setError(null);
    setReportStatus("idle");
  }, []);

  useEffect(() => {
    if (activeNav !== "analyse" && reportStatus === "success") {
      clearAnalysisState();
    }
  }, [activeNav, reportStatus, clearAnalysisState]);

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
      setShowDetailedAnalysis(false);
      setAnalysisTimestamp(new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    if (!result || !result.analysisId || selectedReportGroupIds.length === 0) return;
    setReportStatus("loading");
    try {
      const activeGroupContext = selectedReportGroupIds[0] || selectedCircle || "default";
      const res = await fetch(`/api/circles/${activeGroupContext}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: result.analysisId,
          groupIds: selectedReportGroupIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to report");
      }
      setReportStatus("success");
      setCircleRefreshTrigger(Date.now());
      fetchAllCirclesFeed();
    } catch (e) {
      console.error(e);
      setReportStatus("error");
    }
  }

  function formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (isNaN(diffSec) || diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hr" : "hrs"} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  }

  const fetchAllCirclesFeed = useCallback(async () => {
    if (!user || groups.length === 0) {
      setAllCircleReports([]);
      setFeedReports([]);
      setGroupReportsMap({});
      setGroupLastActivityMap({});
      setFeedLoading(false);
      return;
    }
    setFeedLoading(true);
    setFeedError(null);
    try {
      const results = await Promise.all(
        groups.map(async (group) => {
          try {
            const res = await fetch(`/api/circles/${group.id}/reports`);
            if (!res.ok) return { groupId: group.id, groupName: group.name, reports: [] };
            const data = await res.json();
            return { groupId: group.id, groupName: group.name, reports: (data.reports || []) as CircleReport[] };
          } catch {
            return { groupId: group.id, groupName: group.name, reports: [] };
          }
        })
      );

      const aggregated: (CircleReport & { sourceGroupName: string; sourceGroupId: string })[] = [];
      const counts: Record<string, number> = {};
      const lastAct: Record<string, string> = {};

      for (const { groupId, groupName, reports } of results) {
        counts[groupId] = reports.length;
        if (reports.length > 0) {
          lastAct[groupId] = reports[0].timestamp;
        }
        for (const r of reports) {
          aggregated.push({
            ...r,
            sourceGroupName: groupName,
            sourceGroupId: groupId,
          });
        }
      }

      aggregated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Deduplicate by report ID
      const seen = new Set<string>();
      const deduped = aggregated.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      setAllCircleReports(deduped);
      setGroupReportsMap(counts);
      setGroupLastActivityMap(lastAct);

      setSelectedActivityReport(prev => {
        if (!prev) return prev;
        const updated = deduped.find(r => r.id === prev.id);
        if (updated) {
           return { ...updated, sourceGroupName: prev.sourceGroupName, sourceGroupId: prev.sourceGroupId };
        }
        return prev;
      });

      const targetReports = selectedCircle
        ? (results.find((r) => r.groupId === selectedCircle)?.reports || [])
        : (results[0]?.reports || []);
      setFeedReports(targetReports);
    } catch (err: any) {
      setFeedError(err.message || "Failed to load circles feed");
    } finally {
      setFeedLoading(false);
    }
  }, [user, groups, selectedCircle]);

  async function fetchFeed(circleIdOverride?: string) {
    const targetCircle = circleIdOverride ?? selectedCircle;
    if (!targetCircle) {
      setFeedReports([]);
      setFeedLoading(false);
      return;
    }
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/circles/${targetCircle}/reports`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch feed (${res.status})`);
      }
      const data = await res.json();
      const reports = (data.reports || []) as CircleReport[];
      setFeedReports(reports);
      setGroupReportsMap((prev) => ({ ...prev, [targetCircle]: reports.length }));
      if (reports.length > 0) {
        setGroupLastActivityMap((prev) => ({ ...prev, [targetCircle]: reports[0].timestamp }));
      }
    } catch (e: any) {
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleVote(reportId: string, vote: "confirm" | "deny") {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setVotingReportId(reportId);
    setVoteError(null);
    try {
      const res = await fetch(`/api/circles/reports/${reportId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "IS_REPORTER") {
          setVoteError({ reportId, message: "You cannot vote on your own report." });
        } else if (data.code === "NOT_A_MEMBER") {
          setVoteError({ reportId, message: "You are not a member of any circle this report was shared to." });
        } else {
          setVoteError({ reportId, message: data.error || "Failed to submit vote." });
        }
        return;
      }

      if (data.success && data.summary) {
        const voteUpdater = <T extends CircleReport>(r: T): T => {
          if (r.id !== reportId) return r;
          const currentVotes = r.votes || {
            confirms: 0,
            denies: 0,
            total: 0,
            confirmedBy: [],
            deniedBy: [],
            currentUserVote: null,
          };

          let updatedConfirmed = [...currentVotes.confirmedBy].filter((v) => v.userId !== user.id);
          let updatedDenied = [...currentVotes.deniedBy].filter((v) => v.userId !== user.id);

          const myVoterInfo = { userId: user.id, displayName: displayName || "You" };

          if (vote === "confirm") {
            if (updatedConfirmed.length < 3) {
              updatedConfirmed.unshift(myVoterInfo);
            }
          } else if (vote === "deny") {
            if (updatedDenied.length < 3) {
              updatedDenied.unshift(myVoterInfo);
            }
          }

          return {
            ...r,
            votes: {
              confirms: data.summary.confirms,
              denies: data.summary.denies,
              total: data.summary.total,
              confirmedBy: updatedConfirmed.slice(0, 3),
              deniedBy: updatedDenied.slice(0, 3),
              currentUserVote: vote,
            },
          };
        };

        setFeedReports((prev) => prev.map((r) => voteUpdater(r)));
        setAllCircleReports((prev) =>
          prev.map((r) => ({
            ...voteUpdater(r),
            sourceGroupName: r.sourceGroupName,
            sourceGroupId: r.sourceGroupId,
          }))
        );
        setSelectedActivityReport((prev) =>
          prev && prev.id === reportId
            ? {
                ...voteUpdater(prev),
                sourceGroupName: prev.sourceGroupName,
                sourceGroupId: prev.sourceGroupId,
              }
            : prev
        );
        setCircleRefreshTrigger(Date.now());
        fetchAllCirclesFeed();
      }
    } catch (err: any) {
      setVoteError({ reportId, message: err.message || "Failed to submit vote." });
    } finally {
      setVotingReportId(null);
    }
  }

  async function handleDeleteReport(reportId: string) {
    setDeletingId(reportId);
    setDeleteWarning(null);
    try {
      const res = await fetch(`/api/circles/reports/${reportId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PARTIAL_DELETE_FAILURE") {
          setFeedReports((prev) => prev.filter((r) => r.id !== reportId));
          setAllCircleReports((prev) => prev.filter((r) => r.id !== reportId));
          setDeleteWarning({
            reportId,
            message: "Report removed from feed, but cleanup across some groups was incomplete.",
          });
        } else {
          setDeleteWarning({
            reportId,
            message: data.error || "Failed to delete report.",
          });
        }
        return;
      }
      setFeedReports((prev) => prev.filter((r) => r.id !== reportId));
      setAllCircleReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedActivityReport?.id === reportId) {
        setSelectedActivityReport(null);
      }
      setConfirmDeleteId(null);
      setCircleRefreshTrigger(Date.now());
      fetchAllCirclesFeed();
    } catch (err: any) {
      setDeleteWarning({ reportId, message: err.message || "Failed to delete report." });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (user) {
      fetchAllCirclesFeed();
    }
  }, [user, groups, fetchAllCirclesFeed]);

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
        isDark ? "dark bg-[#060911] text-slate-100" : "bg-[#FFFFFF] text-slate-900"
      }`}
      onClick={() => profileMenuOpen && setProfileMenuOpen(false)}
    >
      {/* Navbar Container (rounded-2xl, matching Reference Image 2) */}
      <header className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 z-50 sticky top-0 select-none">
        <nav
          className={`w-full rounded-[22px] px-6 sm:px-10 py-3.5 sm:py-4 flex items-center justify-between gap-4 relative transition-all duration-200 ${
            isDark
              ? "bg-[#0B0F19]/95 text-white border border-slate-800 shadow-2xl backdrop-blur-md"
              : "bg-white/95 text-slate-800 border border-slate-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.06)] backdrop-blur-md"
          }`}
        >
          {/* Brand Logo on Left (Backgroundless) */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => handleNavClick("home")}
              className="cursor-pointer focus:outline-none flex items-center"
              aria-label="Scam Shield Home"
            >
              <img
                src={isDark ? "/assets/Dark.png" : "/assets/LIGHT1.png"}
                alt="Scam Shield"
                className="h-12 sm:h-14 md:h-16 lg:h-[68px] xl:h-[76px] w-auto object-contain transition-all duration-200"
              />
            </button>
          </div>

          {/* Center Navigation Capsule */}
          <div
            ref={navCapsuleRef}
            className={`hidden md:flex items-center relative rounded-full px-7 py-2.5 text-sm sm:text-base font-semibold tracking-tight transition-colors ${
              isDark
                ? "bg-[#111625] border border-slate-800 text-slate-300"
                : "bg-[#F8F9FA] border border-slate-200/90 text-slate-700"
            }`}
          >
            {/* Sliding Underline Indicator */}
            <div
              className="absolute bottom-1.5 h-[3px] bg-[#1D68FF] rounded-full transition-all duration-300 ease-out pointer-events-none shadow-[0_0_8px_rgba(29,104,255,0.6)]"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {/* Home Link */}
            <button
              ref={(el) => { navButtonRefs.current["home"] = el; }}
              onClick={() => handleNavClick("home")}
              className={`relative px-3 py-1 cursor-pointer transition-colors ${
                activeNav === "home" ? "text-[#1D68FF] font-bold" : isDark ? "text-slate-300 hover:text-[#1D68FF]" : "text-slate-700 hover:text-[#1D68FF]"
              }`}
            >
              <span>Home</span>
            </button>

            <span className={`mx-2 select-none font-light ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>

            {/* Analyse Link */}
            <button
              ref={(el) => { navButtonRefs.current["analyse"] = el; }}
              onClick={() => handleNavClick("analyse")}
              className={`relative px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeNav === "analyse" ? "text-[#1D68FF] font-bold" : isDark ? "text-slate-300 hover:text-[#1D68FF]" : "text-slate-700 hover:text-[#1D68FF]"
              }`}
            >
              <span>Analyse</span>
            </button>

            <span className={`mx-2 select-none font-light ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>

            {/* My Circle Link (Always available) */}
            <button
              ref={(el) => { navButtonRefs.current["circle"] = el; }}
              onClick={() => handleNavClick("circle")}
              className={`relative px-3 py-1 transition-colors cursor-pointer font-semibold ${
                activeNav === "circle" || appMode === "radar"
                  ? "text-[#1D68FF] font-bold"
                  : isDark ? "text-slate-300 hover:text-[#1D68FF]" : "text-slate-700 hover:text-[#1D68FF]"
              }`}
            >
              <span>My Circle</span>
            </button>

            <span className={`mx-2 select-none font-light ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>

            {/* Features Link */}
            <button
              ref={(el) => { navButtonRefs.current["features"] = el; }}
              onClick={() => handleNavClick("features")}
              className={`relative px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeNav === "features" ? "text-[#1D68FF] font-bold" : isDark ? "text-slate-300 hover:text-[#1D68FF]" : "text-slate-700 hover:text-[#1D68FF]"
              }`}
            >
              <span>Features</span>
            </button>

            <span className={`mx-2 select-none font-light ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>

            {/* About Link */}
            <button
              ref={(el) => { navButtonRefs.current["about"] = el; }}
              onClick={() => handleNavClick("about")}
              className={`relative px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeNav === "about" ? "text-[#1D68FF] font-bold" : isDark ? "text-slate-300 hover:text-[#1D68FF]" : "text-slate-700 hover:text-[#1D68FF]"
              }`}
            >
              <span>About</span>
            </button>
          </div>

          {/* Right Section: Theme Toggle + Sign In / Profile */}
          <div className="relative flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle Pill (Matching User Reference Image) */}
            <button
              onClick={handleThemeToggle}
              className={`relative w-[76px] h-[38px] rounded-full p-1 transition-colors duration-300 flex items-center justify-between border cursor-pointer select-none focus:outline-none ${
                isDark
                  ? "bg-[#0E1526] border-slate-700/80 shadow-inner"
                  : "bg-[#F1F4F9] border-blue-200/80 shadow-xs"
              }`}
              aria-label="Toggle dark / light theme"
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {/* Sliding Circular Indicator */}
              <div
                className={`absolute top-[3px] bottom-[3px] w-[30px] rounded-full transition-transform duration-300 flex items-center justify-center ${
                  isDark
                    ? "translate-x-[38px] bg-[#1E293B] shadow-md border border-slate-600/50"
                    : "translate-x-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-slate-100"
                }`}
              />

              {/* Sun Icon (Left) */}
              <div className="w-[30px] h-[30px] flex items-center justify-center z-10">
                <svg
                  className={`w-4 h-4 transition-colors duration-200 ${
                    !isDark ? "text-[#1D68FF]" : "text-slate-500"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="M4.93 4.93l1.41 1.41" />
                  <path d="M17.66 17.66l1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="M6.34 17.66l-1.41 1.41" />
                  <path d="M19.07 4.93l-1.41 1.41" />
                </svg>
              </div>

              {/* Moon Icon (Right) */}
              <div className="w-[30px] h-[30px] flex items-center justify-center z-10">
                <svg
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isDark ? "text-sky-400" : "text-slate-700"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
            </button>

            {!authLoading && !user ? (
              /* Public User: Royal Blue Button */
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center whitespace-nowrap"
              >
                Sign In / Sign Up
              </button>
            ) : (
              /* Authenticated User: Notifications & Profile Badge */
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationPopover
                  isDark={isDark}
                  onNavigateToCircle={(circleId) => {
                    setSelectedCircle(circleId);
                    handleNavClick("circle");
                  }}
                  refreshTrigger={circleRefreshTrigger}
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-2.5 cursor-pointer p-1.5 rounded-full active:scale-95 transition-all ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-50"
                  }`}
                  aria-label="Profile and Settings Menu"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-[#1D68FF] flex items-center justify-center shadow-2xs">
                    <span className="text-[#1D68FF] text-xs sm:text-sm font-bold leading-none select-none">
                      {(() => {
                        const name = (displayName || user?.email || "dev1").trim();
                        const parts = name.split(/[\s_.-]+/);
                        if (parts.length >= 2 && parts[0] && parts[1]) {
                          return (parts[0][0] + parts[1][0]).toUpperCase();
                        }
                        return name.slice(0, 2).toUpperCase();
                      })()}
                    </span>
                  </div>

                  <span className={`text-sm sm:text-base font-bold max-w-[120px] truncate ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    {displayName || user?.email?.split("@")[0] || "dev1"}
                  </span>

                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    } ${profileMenuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute right-0 top-full mt-2.5 w-64 rounded-2xl shadow-2xl p-3.5 z-50 animate-fade-in text-left border ${
                      isDark ? "bg-[#0E131F] border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="px-3 pt-2 pb-2">
                      <p className="text-base font-bold truncate">{displayName || user?.email?.split("@")[0] || "dev1"}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Analyst ID: SS-{user?.id ? user.id.replace(/-/g, "").slice(0, 4).toUpperCase() : "7F2A"}
                      </p>
                    </div>

                    <div className={`h-px my-2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />

                    <div className="space-y-1 text-sm font-semibold">
                      <button
                        onClick={() => {
                          handleNavClick("circle");
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isDark ? "hover:bg-white/10 text-slate-200" : "hover:bg-blue-50/70 text-slate-800"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#1D68FF] flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold">My Circle</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick("analyse");
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isDark ? "hover:bg-white/10 text-slate-200" : "hover:bg-blue-50/70 text-slate-800"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#1D68FF] flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold">Report a Scam</span>
                      </button>
                    </div>

                    <div className={`h-px my-2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />

                    <div>
                      {signOutError && (
                        <div className="px-3 mb-1">
                          <p className="text-[11px] text-red-500">{signOutError}</p>
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
                            clearAnalysisState();
                            setProfileMenuOpen(false);
                          } catch (err: any) {
                            setSignOutError(err.message || "Failed to sign out");
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 pb-28 sm:pb-36">
        {/* 1. HOME SECTION — Dashboard for authenticated users, Hero for public */}
        <section id="home-section" className="scroll-mt-24 pt-2 sm:pt-4">
          {user ? (
            /* ── Authenticated: Premium Dashboard ── */
            <HomeDashboard
              displayName={displayName}
              isDark={isDark}
              onNavigateToCircle={() => handleNavClick("circle")}
              onNavigateToAnalyse={() => handleNavClick("analyse")}
              refreshTrigger={circleRefreshTrigger}
            />
          ) : (
            /* ── Public: Original Hero Section ── */
            <div className="min-h-[calc(85vh-100px)] flex items-center pb-2 sm:pb-4">
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
                {/* Left Column: Title, Description, Buttons, Trust Line */}
                <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-8 text-left">

                  {/* Main Headline */}
                  <h1
                    className={`text-5xl sm:text-6xl md:text-7xl lg:text-[72px] xl:text-[80px] font-black tracking-tight leading-[1.05] ${
                      isDark ? "text-white" : "text-slate-950"
                    }`}
                  >
                    Stay Ahead of <br className="hidden sm:inline" />
                    Every <span className="text-[#1D68FF]">Scam</span>
                  </h1>

                  {/* Description */}
                  <p className={`text-base sm:text-lg md:text-xl lg:text-[21px] leading-relaxed max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Scam Shield uses multi-signal AI to detect and analyze suspicious messages, links, images and voice notes before you fall victim.
                  </p>

                  {/* Dual Action Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => handleNavClick("analyse")}
                      className={`px-8 sm:px-9 py-4 sm:py-4.5 rounded-2xl active:scale-95 font-extrabold text-base sm:text-lg tracking-wide shadow-2xs flex items-center gap-3 cursor-pointer transition-all border-2 ${
                        isDark
                          ? "bg-[#111625] hover:bg-white/5 border-slate-800 text-slate-200"
                          : "bg-white hover:bg-slate-50 border-blue-200/90 text-slate-800"
                      }`}
                    >
                      <svg className="w-5 h-5 text-[#1D68FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Analyse a Scam</span>
                    </button>

                    <button
                      onClick={() => handleNavClick("circle")}
                      className="px-8 sm:px-9 py-4 sm:py-4.5 rounded-2xl bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white font-extrabold text-base sm:text-lg tracking-wide shadow-xl shadow-blue-500/25 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>My Circles</span>
                    </button>
                  </div>

                  {/* Trust Line */}
                  <div className={`flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base md:text-lg font-medium pt-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#1D68FF] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className={isDark ? "text-slate-300" : "text-slate-600"}>100% Private</span>
                    </div>
                    <span className="text-slate-300 select-none">•</span>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#1D68FF] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className={isDark ? "text-slate-300" : "text-slate-600"}>Secure</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Hero image */}
                <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center">
                  <img
                    src="/assets/Mainlogo.png"
                    alt="Scam Shield 3D AI Protection"
                    className="w-full max-w-[700px] lg:max-w-[780px] xl:max-w-[860px] h-auto object-contain select-none pointer-events-none filter drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. ANALYSE SECTION */}
        <section id="analyse-section" className="w-full max-w-5xl mx-auto scroll-mt-24">
          <div className="space-y-6">
              {/* Section Heading & Subtitle (Centered) */}
              <div className="text-center space-y-2">
                <h2 className={`text-4xl sm:text-5xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Analyse
                </h2>
                <p className={`text-sm sm:text-base font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Upload or paste a message, image or voice note to analyse for scams.
                </p>
              </div>

              {/* Main Card Container */}
              <div className="flex flex-col items-center">
                {/* Modality Tabs (Docked on Top) */}
                <div
                  className={`inline-flex items-center rounded-t-2xl sm:rounded-t-3xl border border-b-0 px-3 sm:px-6 py-2 sm:py-2.5 transition-colors duration-200 ${
                    isDark
                      ? "bg-[#0B0F19] border-slate-800 text-slate-300 shadow-lg"
                      : "bg-white border-slate-200/90 text-slate-700 shadow-sm"
                  }`}
                >
                  {/* Message Tab */}
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                      activeTab === "text"
                        ? "text-[#1D68FF]"
                        : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="12" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                    </svg>
                    <span>Message</span>
                    {activeTab === "text" && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1D68FF] rounded-full" />
                    )}
                  </button>

                  {/* Image Tab */}
                  <button
                    onClick={() => setActiveTab("image")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                      activeTab === "image"
                        ? "text-[#1D68FF]"
                        : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Image</span>
                    {activeTab === "image" && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1D68FF] rounded-full" />
                    )}
                  </button>

                  {/* Voice Tab */}
                  <button
                    onClick={() => setActiveTab("audio")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                      activeTab === "audio"
                        ? "text-[#1D68FF]"
                        : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    <span>Voice</span>
                    {activeTab === "audio" && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1D68FF] rounded-full" />
                    )}
                  </button>
                </div>

                {/* Main Card Body */}
                <div
                  className={`w-full rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl border transition-all ${
                    isDark
                      ? "bg-[#0B0F19] border-slate-800 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
                      : "bg-[#101624] border-slate-800 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Textarea / Dropzone Inset Box (8/12 col on md, 9/12 on lg) */}
                    <div className="md:col-span-8 lg:col-span-9">
                      {activeTab === "text" ? (
                        <div className="relative rounded-2xl bg-[#182030] dark:bg-[#070A12] border border-slate-700/60 dark:border-slate-800 p-4 sm:p-5 min-h-[220px] shadow-inner flex flex-col justify-between focus-within:border-[#1D68FF] focus-within:ring-2 focus-within:ring-[#1D68FF]/30 transition-all">
                          <textarea
                            id="message-input"
                            rows={6}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your message here..."
                            className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base leading-relaxed focus:outline-none resize-none flex-1"
                          />
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-xs font-mono text-slate-400">
                              {text.length}/5000
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("image");
                                setTimeout(() => fileInputRef.current?.click(), 100);
                              }}
                              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-white/10"
                              title="Attach screenshot or image"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : activeTab === "image" ? (
                        <div className="space-y-4">
                          <div
                            className="w-full border-2 border-dashed border-slate-700/70 hover:border-[#1D68FF] rounded-2xl p-8 sm:p-10 text-center cursor-pointer bg-[#182030] dark:bg-[#070A12] hover:bg-white/5 transition-all shadow-inner"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <div className="space-y-2 text-slate-300 text-sm">
                              {imageFile ? (
                                <span className="text-[#1D68FF] font-bold text-base block">{imageFile.name}</span>
                              ) : (
                                <div>
                                  <span className="font-semibold block text-base text-white">Click to browse or drag screenshot here</span>
                                  <span className="text-xs text-slate-400 mt-1 block">Supports PNG, JPG, WEBP (Max 2.5MB)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {imagePreview && (
                            <div className="rounded-2xl border border-slate-700/60 bg-[#182030] dark:bg-[#070A12] p-4 flex justify-center animate-fade-in shadow-inner">
                              <img src={imagePreview} alt="Screenshot preview" className="max-h-48 rounded-xl border border-white/15 object-contain" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-[#182030] dark:bg-[#070A12] border border-slate-700/60 dark:border-slate-800 p-4 sm:p-5 shadow-inner">
                          <AudioInput
                            onAudioReady={(data) => setAudioData(data)}
                            onError={(err) => setError(err)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Column: Controls (Language Select & Analyse Now Button) */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col justify-between space-y-6 w-full">
                      {/* Language Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-200">
                          Language
                        </label>
                        <div className="relative flex items-center">
                          {/* White Vector SVG Globe Icon */}
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </div>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
                            className="w-full appearance-none rounded-xl bg-[#182030] dark:bg-[#070A12] border border-slate-700/70 dark:border-slate-800 text-white pl-10 pr-10 py-3.5 text-sm font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1D68FF] cursor-pointer"
                          >
                            <option value="en" className="bg-[#182030] text-white">English</option>
                            <option value="hi" className="bg-[#182030] text-white">हिन्दी (Hindi)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Primary Button: Analyse Now */}
                      <div className="pt-2">
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
                          className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base tracking-wide bg-[#1D68FF] hover:bg-[#1558db] active:scale-95 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Analysing…
                            </span>
                          ) : (
                            <>
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              <span>Analyse Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lock note at the bottom */}
                  <div className="pt-6 text-center">
                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Your data is secured</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 animate-fade-in text-center font-semibold">
                  ⚠️ {error}
                </div>
              )}

              {/* Results View (Progressive Disclosure matching Reference Image) */}
              {result && (
                <div id="results-card" className="space-y-6 pt-6 animate-fade-in text-left">
                  {/* Top Bar: Back link, Title, Status badge, Timestamp, Copy Share button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setResult(null);
                          setShowDetailedAnalysis(false);
                          document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1D68FF] hover:underline cursor-pointer mb-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Back to Analyse</span>
                      </button>

                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                          Analysis Result
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Completed
                        </span>
                      </div>

                      <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Analyzed on {analysisTimestamp || "Recently"}
                      </p>
                    </div>

                    <div>
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
                            `— Checked with Scam Shield`,
                          ].join("\n");
                          try {
                            await navigator.clipboard.writeText(shareText);
                            setShareAlertCopied(true);
                            setTimeout(() => setShareAlertCopied(false), 2000);
                          } catch {}
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                          isDark
                            ? "bg-[#111625] border-slate-700 text-slate-200 hover:text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <svg className="w-4 h-4 text-[#1D68FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>{shareAlertCopied ? "✓ Copied!" : "Copy alert to share"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Main Score / Risk Banner Card */}
                  <div
                    className={`rounded-3xl p-8 sm:p-12 text-center border transition-all ${
                      result.riskScore > 70
                        ? isDark
                          ? "bg-gradient-to-b from-red-500/15 via-rose-950/20 to-[#0B0F19] border-red-500/40 text-white shadow-2xl shadow-red-500/10"
                          : "bg-gradient-to-b from-red-50 via-rose-50/50 to-white border-red-200 text-slate-900 shadow-xl shadow-red-500/5"
                        : result.riskScore >= 40
                        ? isDark
                          ? "bg-gradient-to-b from-amber-500/15 via-yellow-950/20 to-[#0B0F19] border-amber-500/40 text-white shadow-2xl shadow-amber-500/10"
                          : "bg-gradient-to-b from-amber-50 via-yellow-50/50 to-white border-amber-200 text-slate-900 shadow-xl shadow-amber-500/5"
                        : isDark
                        ? "bg-gradient-to-b from-emerald-500/15 via-teal-950/20 to-[#0B0F19] border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10"
                        : "bg-gradient-to-b from-emerald-50 via-teal-50/50 to-white border-emerald-200 text-slate-900 shadow-xl shadow-emerald-500/5"
                    }`}
                  >
                    {/* Severity Icon Badge */}
                    <div className="flex justify-center mb-6">
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg ${
                          result.riskScore > 70
                            ? "bg-[#DC2626] text-white shadow-red-500/40"
                            : result.riskScore >= 40
                            ? "bg-amber-500 text-slate-950 shadow-amber-500/40"
                            : "bg-emerald-500 text-white shadow-emerald-500/40"
                        }`}
                      >
                        {result.riskScore > 70 ? (
                          <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        ) : result.riskScore >= 40 ? (
                          <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <polyline points="9 12 11 14 15 10" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Verdict Title */}
                    <h2
                      className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-4 uppercase ${
                        result.riskScore > 70
                          ? "text-[#DC2626]"
                          : result.riskScore >= 40
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {result.riskScore > 70
                        ? "HIGH RISK: THIS LOOKS LIKE A SCAM."
                        : result.riskScore >= 40
                        ? "MEDIUM RISK: SUSPICIOUS ACTIVITY DETECTED."
                        : "LOW RISK: NO IMMEDIATE THREAT DETECTED."}
                    </h2>

                    {/* Verdict Summary Text */}
                    <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {result.explanation}
                    </p>

                    {/* Action Buttons for High / Medium Risk */}
                    {result.riskScore >= 40 && (
                      <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                        <button
                          onClick={() => setShowComplaintModal(true)}
                          className="px-7 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-500/30 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span>File Complaint</span>
                        </button>

                        <button
                          onClick={() => {
                            setShareSuccess(false);
                            if (groups.length > 0) {
                              setSelectedShareCircles(groups.map(g => g.id));
                            }
                            setShowShareModal(true);
                          }}
                          className={`px-7 py-3.5 rounded-full border text-sm font-bold tracking-wide flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 ${
                            isDark
                              ? "border-red-500/50 bg-red-950/20 text-red-300 hover:bg-red-900/30"
                              : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          <span>Share alert to circle</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. Center Toggle Button: See Detailed Analysis */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                      className={`px-6 py-2.5 rounded-full border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer ${
                        isDark
                          ? "bg-[#111625] border-slate-700/80 text-slate-200 hover:bg-[#182030] hover:text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{showDetailedAnalysis ? "Hide Detailed Analysis" : "See Detailed Analysis"}</span>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${showDetailedAnalysis ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* 3. Steps & Detailed Analysis Container */}
                  {!showDetailedAnalysis ? (
                    /* Initial View: If red score, show steps centered */
                    result.riskScore > 70 ? (
                      <div className="max-w-2xl mx-auto pt-4 transition-all duration-500 animate-fade-in">
                        <div
                          className={`rounded-3xl p-7 sm:p-9 border space-y-6 shadow-sm ${
                            isDark
                              ? "bg-[#0B0F19] border-slate-800 text-white"
                              : "bg-[#F8FAFD] border-slate-200/90 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 dark:border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#1D68FF] flex items-center justify-center font-bold">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <h3 className={`text-base font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                              What To Do Next
                            </h3>
                          </div>

                          <div className="space-y-6 text-left">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                1
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Do not click any links
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Interacting can compromise your device or confirm your number is active to scammers.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                2
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Block the sender
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Use your phone's built-in feature to block the number immediately.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                3
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Report to Cyber Crime
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Filing a report helps authorities track down the network.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    /* Expanded 2-Column View: Detailed Analysis on Left, Steps on Right */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 transition-all duration-500 animate-fade-in">
                      {/* Left Column: Pattern Matching & Flags Detected (7/12 col) */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Card A: Pattern Matching */}
                        <div
                          className={`rounded-3xl p-6 sm:p-8 border space-y-4 shadow-sm ${
                            isDark ? "bg-[#0B0F19] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-[#1D68FF] flex items-center justify-center">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                            </div>
                            <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                              Pattern Matching
                            </h4>
                          </div>

                          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            The message matches <span className="font-bold text-[#1D68FF] dark:text-[#38BDF8]">{Math.max(result.riskScore, 85)}%</span> of known &quot;{result.flags[0] || "Urgent Phishing"}&quot; scam patterns reported in your region.
                          </p>

                          {result.text && (
                            <div className={`p-4 rounded-2xl border text-xs sm:text-sm italic leading-relaxed ${
                              isDark ? "bg-[#141A28] border-slate-700/60 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}>
                              &ldquo;{result.text.length > 220 ? result.text.slice(0, 220) + "…" : result.text}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Card B: Flags Detected */}
                        <div
                          className={`rounded-3xl p-6 sm:p-8 border space-y-4 shadow-sm ${
                            isDark ? "bg-[#0B0F19] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-[#1D68FF] flex items-center justify-center font-bold">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                              </svg>
                            </div>
                            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                              Flags Detected
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {result.flags.length > 0 ? (
                              result.flags.map((flag, idx) => {
                                const isHigh = idx % 2 === 0 || result.riskScore > 70;
                                const lower = flag.toLowerCase();
                                
                                return (
                                  <div
                                    key={flag}
                                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all shadow-xs ${
                                      isDark
                                        ? "bg-[#0B0F19] border-slate-800/90 hover:border-slate-700"
                                        : "bg-[#F8FAFD] border-slate-200/90 hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div>
                                        {lower.includes("link") || lower.includes("url") || lower.includes("domain") ? (
                                          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                          </svg>
                                        ) : lower.includes("contact") || lower.includes("sender") || lower.includes("unknown") || lower.includes("impersonat") ? (
                                          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                          </svg>
                                        ) : lower.includes("greeting") || lower.includes("message") || lower.includes("language") || lower.includes("tone") ? (
                                          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            <circle cx="9" cy="10" r="1" fill="currentColor" />
                                            <circle cx="12" cy="10" r="1" fill="currentColor" />
                                            <circle cx="15" cy="10" r="1" fill="currentColor" />
                                          </svg>
                                        ) : lower.includes("mail") || lower.includes("email") || lower.includes("mismatch") || lower.includes("header") ? (
                                          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                          </svg>
                                        ) : lower.includes("pressure") || lower.includes("immediate") || lower.includes("expire") || lower.includes("urgent") ? (
                                          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                          </svg>
                                        )}
                                      </div>
                                      <p className={`text-xs sm:text-sm font-bold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                                        {flag}
                                      </p>
                                    </div>
                                    <div>
                                      <span
                                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                                          isHigh
                                            ? "bg-red-500/10 text-red-500 border border-red-500/30"
                                            : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                        }`}
                                      >
                                        {isHigh ? "High Risk" : "Medium Risk"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-full text-center py-6 text-xs text-slate-400">
                                No suspicious flags detected in this message.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Steps ('What To Do Next') (5/12 col) */}
                      <div className="lg:col-span-5">
                        <div
                          className={`rounded-3xl p-7 sm:p-9 border space-y-6 shadow-sm sticky top-28 ${
                            isDark
                              ? "bg-[#0B0F19] border-slate-800 text-white"
                              : "bg-[#F8FAFD] border-slate-200/90 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 dark:border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#1D68FF] flex items-center justify-center font-bold">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <h3 className={`text-base font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                              What To Do Next
                            </h3>
                          </div>

                          <div className="space-y-6 text-left">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                1
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Do not click any links
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Interacting can compromise your device or confirm your number is active to scammers.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                2
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Block the sender
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Use your phone's built-in feature to block the number immediately.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#0E1A38] dark:bg-[#111C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-xs">
                                3
                              </div>
                              <div className="space-y-1">
                                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  Report to Cyber Crime
                                </h4>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  Filing a report helps authorities track down the network.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </section>

        {/* 3. MY CIRCLE SECTION */}
        <section id="circle-section" className="w-full max-w-5xl mx-auto scroll-mt-24 space-y-8 animate-fade-in text-left">
              {!user ? (
                <div
                  className={`rounded-[28px] sm:rounded-[32px] p-8 sm:p-12 text-center border shadow-sm space-y-5 ${
                    isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_25px_rgba(30,58,138,0.07)]"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Sign in to access My Circles
                  </h3>
                  <p className={`text-sm sm:text-base max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Join private invite-only circles and share real-time threat alerts with your family, college groups, and friends.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="px-8 py-3.5 rounded-full text-sm font-bold bg-[#1D68FF] hover:bg-[#1558db] text-white transition-all cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              ) : selectedCircleDetailId && groups.some(g => g.id === selectedCircleDetailId) ? (
                <CircleDetailView
                  circle={groups.find(g => g.id === selectedCircleDetailId)!}
                  isDark={isDark}
                  currentUser={user}
                  cachedReports={allCircleReports.filter(r => r.sourceGroupId === selectedCircleDetailId)}
                  onBack={() => setSelectedCircleDetailId(null)}
                  onOpenReport={(report) => setSelectedActivityReport(report)}
                  refreshTrigger={circleRefreshTrigger}
                  onReportsUpdated={fetchAllCirclesFeed}
                />
              ) : (
                <>
                  {/* 1. Header with Title, Subtitle, and Action Buttons (Matching Reference Image 1) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        My Circles
                      </h2>
                      <p className={`text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Stay connected with people you trust and help each other stay safe from scams.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          dispatch({ type: "DISMISS_ACTION_MESSAGE" });
                          dispatch({ type: "DISMISS_INVITE_CODE" });
                          setShowCreateCircleModal(true);
                        }}
                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                          isDark
                            ? "border-[#1D68FF]/60 text-[#38BDF8] hover:bg-blue-500/10 bg-[#0E131F]"
                            : "border-[#1D68FF] text-[#1D68FF] bg-white hover:bg-blue-50/70 shadow-2xs"
                        }`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Create Circle</span>
                      </button>

                      <button
                        onClick={() => {
                          dispatch({ type: "DISMISS_ACTION_MESSAGE" });
                          dispatch({ type: "DISMISS_INVITE_CODE" });
                          setShowJoinCircleModal(true);
                        }}
                        className="px-5 py-2.5 rounded-full bg-[#1D68FF] hover:bg-[#1558db] text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>Join Circle</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Total Groups & Total Reports Summary Banner (Requirement 5) */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border flex flex-wrap items-center justify-between gap-4 ${
                      isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-[#E6F0FA] border-blue-200/90 text-slate-900 shadow-xs"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? "bg-[#1D68FF]/15 text-[#1D68FF]" : "bg-white text-[#1D68FF] border border-blue-200/70 shadow-2xs"}`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-black">{groups.length}</p>
                          <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {groups.length === 1 ? "Active Circle" : "Active Circles"}
                          </p>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block" />

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? "bg-red-500/15 text-red-500" : "bg-white text-red-600 border border-red-200/70 shadow-2xs"}`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-black">{allCircleReports.length}</p>
                          <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {allCircleReports.length === 1 ? "Threat Report" : "Total Threat Reports"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                        Live Circle Radar
                      </span>
                    </div>
                  </div>

                  {/* 3. Circles Cards Grid (Matching Reference Image 1) */}
                  {groups.length === 0 ? (
                    <div
                      className={`rounded-3xl p-10 border text-center space-y-4 ${
                        isDark ? "bg-[#0E131F] border-slate-800" : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_20px_rgba(30,58,138,0.06)]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                        </svg>
                      </div>
                      <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        No Circles Joined Yet
                      </h4>
                      <p className={`text-xs sm:text-sm max-w-sm mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Create a private circle for your family or college, or join an existing circle with an invite code.
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          onClick={() => setShowCreateCircleModal(true)}
                          className="px-5 py-2.5 rounded-full bg-[#1D68FF] hover:bg-[#1558db] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          + Create First Circle
                        </button>
                        <button
                          onClick={() => setShowJoinCircleModal(true)}
                          className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          Join with Code
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(showAllCircles ? groups : groups.slice(0, 2)).map((group, index) => {
                          const reportsCount = groupReportsMap[group.id] ?? 0;
                          const lastActivityIso = groupLastActivityMap[group.id];
                          const lastActivityText = lastActivityIso ? formatRelativeTime(lastActivityIso) : "Recently";
                          const isEven = index % 2 === 0;

                          // Themed card icons matching reference image
                          const iconBg = isEven
                            ? isDark ? "bg-blue-500/20 text-[#38BDF8]" : "bg-white text-[#1D68FF] shadow-2xs border border-blue-200/80"
                            : isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-emerald-600 shadow-2xs border border-emerald-200/80";

                          const tagline = group.description?.trim()
                            ? group.description.trim()
                            : isEven
                            ? "Stay alert. Stay protected."
                            : "Looking out for each other.";

                          return (
                            <div
                              key={group.id}
                              className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-xl ${
                                isDark
                                  ? "bg-[#0E131F] border-slate-800 text-white hover:border-slate-700"
                                  : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)] hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)]"
                              }`}
                            >
                              {/* Top Identity Row */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconBg}`}>
                                    {isEven ? (
                                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                    )}
                                  </div>

                                  <div className="min-w-0 space-y-1">
                                    <h3 className={`text-lg sm:text-xl font-black tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {group.name}
                                    </h3>
                                    <p className={`text-xs sm:text-sm font-medium truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                      {tagline}
                                    </p>
                                    <div className="pt-0.5">
                                      <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                        isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700 border border-blue-200/80 shadow-2xs"
                                      }`}>
                                        {group.role === "admin" ? "Admin" : "Member"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center flex-shrink-0">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                    isDark
                                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                </div>
                              </div>

                              {/* Middle Stats Row (Members from DB, Reports from Feed, Last Activity) */}
                              <div
                                className={`pt-4 border-t grid grid-cols-3 gap-2 text-left ${
                                  isDark ? "border-slate-800" : "border-blue-200/70"
                                }`}
                              >
                                {/* Stat 1: Real Members from Database */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-[#1D68FF] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                    </svg>
                                    <span className={`font-black text-sm sm:text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {group.member_count ?? 1}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                    Members
                                  </p>
                                </div>

                                {/* Stat 2: Reports */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    </svg>
                                    <span className={`font-black text-sm sm:text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {reportsCount}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                    Reports
                                  </p>
                                </div>

                                {/* Stat 3: Last Activity */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className={`font-bold text-xs sm:text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {lastActivityText}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                    Last activity
                                  </p>
                                </div>
                              </div>

                              {/* Bottom Button (Open Circle Detail View) */}
                              <button
                                onClick={() => setSelectedCircleDetailId(group.id)}
                                className={`w-full py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                                  isDark
                                    ? "border border-blue-500/40 text-[#38BDF8] hover:bg-blue-500/10 bg-[#111625]"
                                    : "border-2 border-[#1D68FF] text-[#1D68FF] hover:bg-[#1D68FF] hover:text-white bg-white shadow-xs"
                                }`}
                              >
                                <span>Open Circle →</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* "See more" Toggle Button if more than 2 groups exist */}
                      {groups.length > 2 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setShowAllCircles(!showAllCircles)}
                            className={`px-5 py-2 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                              isDark
                                ? "bg-[#0E131F] border-slate-800 text-slate-300 hover:bg-slate-800"
                                : "bg-[#E6F0FA] border-blue-200 text-slate-700 hover:bg-white hover:text-[#1D68FF] hover:border-[#1D68FF] shadow-xs"
                            }`}
                          >
                            <span>
                              {showAllCircles
                                ? "See less ↑"
                                : `See more (${groups.length - 2} more circles) ↓`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Recent Activity Section (Matching Reference Image 1) */}
                  <div
                    className={`rounded-3xl border p-6 sm:p-8 space-y-6 ${
                      isDark ? "bg-[#0E131F] border-slate-800" : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)]"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        Recent Activity
                      </h3>
                      {allCircleReports.length > 3 && (
                        <button
                          onClick={() => setShowAllActivities(!showAllActivities)}
                          className="text-xs sm:text-sm font-bold text-[#1D68FF] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{showAllActivities ? "Show less" : "View all activity"}</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>

                    {/* Activity List */}
                    {feedLoading ? (
                      <div className="text-center py-10 space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#1D68FF] border-t-transparent animate-spin mx-auto" />
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Loading recent activity across your circles…
                        </p>
                      </div>
                    ) : feedError ? (
                      <div className="text-center py-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                        <p className="text-xs font-bold text-red-400">{feedError}</p>
                        <button
                          onClick={() => fetchAllCirclesFeed()}
                          className="text-xs font-bold text-[#1D68FF] hover:underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : allCircleReports.length === 0 ? (
                      <div
                        className={`text-center py-12 border border-dashed rounded-2xl space-y-2 ${
                          isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <p className="text-sm font-semibold">No recent activity across your circles yet.</p>
                        <p className="text-xs">
                          When members report suspicious messages or scams, they will appear here in real-time.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`divide-y rounded-2xl overflow-hidden ${
                          isDark ? "divide-slate-800/80" : "divide-blue-200/70"
                        }`}
                      >
                        {(showAllActivities ? allCircleReports : allCircleReports.slice(0, 4)).map((report) => {
                          const isHighRisk = report.riskScore > 70;
                          const isMediumRisk = report.riskScore > 40 && report.riskScore <= 70;
                          const hasConfirms = (report.votes?.confirms ?? 0) > 0;

                          // Activity Icon styling matching reference image
                          const badgeBg = hasConfirms
                            ? isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                            : isHighRisk
                            ? isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                            : isMediumRisk
                            ? isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                            : isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700";

                          // Formatted title preview
                          const confirmsCount = report.votes?.confirms ?? 0;
                          const activityTitle = confirmsCount > 0
                            ? `Report confirmed by ${confirmsCount} ${confirmsCount === 1 ? 'member' : 'members'}`
                            : report.flags?.[0]
                            ? `${report.flags[0]} reported`
                            : "Suspicious WhatsApp message reported";

                          return (
                            <div
                              key={report.id}
                              onClick={() => setSelectedActivityReport(report)}
                              className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-all cursor-pointer group ${
                                isDark ? "hover:bg-white/5" : "hover:bg-white/80 hover:shadow-2xs rounded-xl"
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${badgeBg}`}>
                                  {hasConfirms ? (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      <polyline points="9 12 11 14 15 10" />
                                    </svg>
                                  ) : isHighRisk ? (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                      <line x1="12" y1="9" x2="12" y2="13" />
                                      <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="12" y1="8" x2="12" y2="12" />
                                      <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                  )}
                                </div>

                                <div className="min-w-0 space-y-0.5">
                                  <h4 className={`text-sm sm:text-base font-bold truncate group-hover:text-[#1D68FF] transition-colors ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}>
                                    {activityTitle}
                                  </h4>
                                  <p className={`text-xs font-medium truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    {report.sourceGroupName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  {formatRelativeTime(report.timestamp)}
                                </span>
                                <svg
                                  className="w-4 h-4 text-slate-400 group-hover:text-[#1D68FF] group-hover:translate-x-0.5 transition-all"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
        </section>

        {/* 4. FEATURES SECTION (Matching Reference Image) */}
        <section id="features-section" className="space-y-8 sm:space-y-10 text-left scroll-mt-24">
          {/* Header */}
          <div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Built for Complete Scam Detection
            </h2>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Card 1: Multi-signal AI */}
            <div
              className={`rounded-[24px] sm:rounded-[28px] p-7 sm:p-8 border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#070A12] sm:bg-[#080D18] border-slate-800/80 text-white shadow-xl hover:border-blue-500/40 hover:shadow-2xl"
                  : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)] hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)]"
              }`}
            >
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs mb-6 transition-colors ${
                  isDark
                    ? "bg-[#0F1C38] border border-blue-500/30 text-[#38BDF8]"
                    : "bg-white border border-blue-200/80 text-[#1D68FF] shadow-2xs"
                }`}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold tracking-tight mb-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                Multi-signal AI
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Advanced AI analyzes patterns, language, links, and behavior to catch scams others miss.
              </p>
            </div>

            {/* Card 2: Link Safety Check */}
            <div
              className={`rounded-[24px] sm:rounded-[28px] p-7 sm:p-8 border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#070A12] sm:bg-[#080D18] border-slate-800/80 text-white shadow-xl hover:border-blue-500/40 hover:shadow-2xl"
                  : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)] hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)]"
              }`}
            >
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs mb-6 transition-colors ${
                  isDark
                    ? "bg-[#0F1C38] border border-blue-500/30 text-[#38BDF8]"
                    : "bg-white border border-blue-200/80 text-[#1D68FF] shadow-2xs"
                }`}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold tracking-tight mb-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                Link Safety Check
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Instantly verifies URLs for phishing, malware, and other online threats.
              </p>
            </div>

            {/* Card 3: Voice & Image Analysis */}
            <div
              className={`rounded-[24px] sm:rounded-[28px] p-7 sm:p-8 border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#070A12] sm:bg-[#080D18] border-slate-800/80 text-white shadow-xl hover:border-blue-500/40 hover:shadow-2xl"
                  : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)] hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)]"
              }`}
            >
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs mb-6 transition-colors ${
                  isDark
                    ? "bg-[#0F1C38] border border-blue-500/30 text-[#38BDF8]"
                    : "bg-white border border-blue-200/80 text-[#1D68FF] shadow-2xs"
                }`}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold tracking-tight mb-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                Voice & Image Analysis
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Detects scams in voice notes and images using smart content understanding.
              </p>
            </div>

            {/* Card 4: Community Shield */}
            <div
              className={`rounded-[24px] sm:rounded-[28px] p-7 sm:p-8 border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#070A12] sm:bg-[#080D18] border-slate-800/80 text-white shadow-xl hover:border-blue-500/40 hover:shadow-2xl"
                  : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_24px_rgba(30,58,138,0.07)] hover:border-[#1D68FF]/60 hover:shadow-[0_8px_30px_rgba(29,104,255,0.12)]"
              }`}
            >
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs mb-6 transition-colors ${
                  isDark
                    ? "bg-[#0F1C38] border border-blue-500/30 text-[#38BDF8]"
                    : "bg-white border border-blue-200/80 text-[#1D68FF] shadow-2xs"
                }`}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold tracking-tight mb-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                Community Shield
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Powered by real-time reports from our community to keep everyone safer.
              </p>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS (Matching Reference Image) */}
        <section id="about-section" className="w-full max-w-4xl mx-auto scroll-mt-24">
          <div
            className={`rounded-[28px] sm:rounded-[36px] p-8 sm:p-12 md:p-14 border transition-all ${
              isDark
                ? "bg-[#070A12] sm:bg-[#080D18] border-slate-800/80 text-white shadow-2xl"
                : "bg-[#EDF3FB] border-blue-200/90 text-slate-900 shadow-[0_4px_25px_rgba(30,58,138,0.07)]"
            }`}
          >
            {/* Header */}
            <div className="space-y-3 mb-10 sm:mb-12 text-left">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase ${
                  isDark
                    ? "bg-[#0C1B33] border border-[#1D68FF]/50 text-[#38BDF8] shadow-[0_0_15px_rgba(29,104,255,0.3)]"
                    : "bg-blue-50/90 border border-blue-200/90 text-[#1D68FF] shadow-xs"
                }`}
              >
                <span className="text-xs">✦</span>
                <span>HOW IT WORKS</span>
              </div>
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Simple Steps, Strong Protection
              </h2>
            </div>

            {/* Steps Timeline with Dotted Connecting Line */}
            <div className="relative pl-2 sm:pl-4 space-y-9 sm:space-y-11 text-left">
              {/* Dotted Vertical Connecting Line */}
              <div className="absolute top-6 bottom-6 left-8 sm:left-10 w-0.5 border-l-2 border-dashed border-blue-400/50 dark:border-blue-400/30 -translate-x-1/2 pointer-events-none" />

              {/* Step 1: Submit */}
              <div className="flex items-start gap-4 sm:gap-6 relative group">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-xs ${
                    isDark
                      ? "bg-[#0F1C38] border border-blue-500/40 text-[#38BDF8]"
                      : "bg-white border border-blue-200/90 text-[#1D68FF] shadow-xs"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </div>
                <div className="space-y-1 pt-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    1. Submit
                  </h3>
                  <p className={`text-xs sm:text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Share text, image or audio that seems suspicious.
                  </p>
                </div>
              </div>

              {/* Step 2: Analyze */}
              <div className="flex items-start gap-4 sm:gap-6 relative group">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-xs ${
                    isDark
                      ? "bg-[#0F1C38] border border-blue-500/40 text-[#38BDF8]"
                      : "bg-white border border-blue-200/90 text-[#1D68FF] shadow-xs"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="space-y-1 pt-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    2. Analyze
                  </h3>
                  <p className={`text-xs sm:text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Our AI runs multi-layered checks in seconds.
                  </p>
                </div>
              </div>

              {/* Step 3: Get Results */}
              <div className="flex items-start gap-4 sm:gap-6 relative group">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-xs ${
                    isDark
                      ? "bg-[#0F1C38] border border-blue-500/40 text-[#38BDF8]"
                      : "bg-white border border-blue-200/90 text-[#1D68FF] shadow-xs"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="space-y-1 pt-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    3. Get Results
                  </h3>
                  <p className={`text-xs sm:text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Know the risk level, reasons and recommended actions.
                  </p>
                </div>
              </div>

              {/* Step 4: Share to Groups (New requested step) */}
              <div className="flex items-start gap-4 sm:gap-6 relative group">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-xs ${
                    isDark
                      ? "bg-[#0F1C38] border border-blue-500/40 text-[#38BDF8]"
                      : "bg-white border border-blue-200/90 text-[#1D68FF] shadow-xs"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div className="space-y-1 pt-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    4. Share to Groups
                  </h3>
                  <p className={`text-xs sm:text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Alert your family and community circles with one click to keep everyone protected.
                  </p>
                </div>
              </div>

              {/* Step 5: Stay Safe */}
              <div className="flex items-start gap-4 sm:gap-6 relative group">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-xs ${
                    isDark
                      ? "bg-[#0F1C38] border border-blue-500/40 text-[#38BDF8]"
                      : "bg-white border border-blue-200/90 text-[#1D68FF] shadow-xs"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="space-y-1 pt-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    5. Stay Safe
                  </h3>
                  <p className={`text-xs sm:text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Take action and help others by reporting scams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Blank Footer with Spacing */}
      <footer className="w-full py-12 select-none" />

      {/* Chakshu Complaint Draft Modal (Matching Reference Image 2) */}
      {showComplaintModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all text-left animate-fade-in ${
              isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 sm:p-7 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Chakshu Complaint Draft
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Recommendation Notice */}
              <div className={`rounded-2xl p-4 border flex items-start gap-3 text-xs sm:text-sm ${
                isDark ? "bg-blue-500/10 border-blue-500/25" : "bg-blue-50 border-blue-200"
              }`}>
                <div className="w-5 h-5 rounded-full bg-[#1D68FF] text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[11px]">
                  i
                </div>
                <div className="space-y-0.5">
                  <span className={`font-bold ${isDark ? "text-blue-300" : "text-blue-900"}`}>
                    Recommended reporting route
                  </span>
                  <p className={`text-xs ${isDark ? "text-blue-200/80" : "text-blue-800/90"}`}>
                    <span className="font-semibold">Sanchar Saathi (Chakshu)</span> — For suspected fraud where no financial loss has occurred.
                  </p>
                </div>
              </div>

              {/* Description & Link */}
              <div className="space-y-2">
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Chakshu is the Government of India&apos;s portal (under DoT&apos;s Sanchar Saathi) for reporting suspected telecom fraud — designed exactly for cases like this.
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <a
                    href="https://sancharsaathi.gov.in/sfc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#1D68FF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>File at Sanchar Saathi</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>

                  <button
                    onClick={async () => {
                      const draftText = result.complaintDraft || [
                        `Suspected Scam Type: ${result.flags[0] || "Urgent Deceptive Scam"}`,
                        ``,
                        `Description: The message attempts to deceive the recipient through fraudulent claims, urgency, or suspicious links.`,
                        ``,
                        `Entities Involved: ${result.text ? (result.text.length > 200 ? result.text.slice(0, 200) + "..." : result.text) : "Suspicious communication"}`,
                        ``,
                        `Recommended Action: Do not click any links, block sender, and report to authorities.`
                      ].join("\n");
                      try {
                        await navigator.clipboard.writeText(draftText);
                        setDraftCopied(true);
                        setTimeout(() => setDraftCopied(false), 2000);
                      } catch {}
                    }}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark ? "border-slate-700 bg-[#141A28] text-slate-200 hover:text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#1D68FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{draftCopied ? "✓ Copied!" : "Copy Draft"}</span>
                  </button>
                </div>
              </div>

              {/* Preformatted Complaint Box */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isDark ? "bg-[#070A12] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200/90 text-slate-800"
                }`}
              >
                {result.complaintDraft || [
                  `Suspected Scam Type: ${result.flags[0] || "Urgent Deceptive Scam"}`,
                  ``,
                  `Description: The message attempts to deceive the recipient through fraudulent claims, urgency, or suspicious links.`,
                  ``,
                  `Entities Involved: ${result.text ? (result.text.length > 200 ? result.text.slice(0, 200) + "..." : result.text) : "Suspicious communication"}`,
                  ``,
                  `Recommended Action: Do not click any links, block sender, and report to authorities.`
                ].join("\n")}
              </div>
            </div>

            {/* Footer */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 border-t ${
              isDark ? "border-slate-800 bg-[#0E131F]" : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Your data is not stored or submitted by Scam Shield.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className={`px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <a
                  href="https://sancharsaathi.gov.in/sfc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-colors cursor-pointer"
                >
                  <span>File Complaint</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Alert to Circle Modal (Matching Reference Image) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all text-left animate-fade-in ${
              isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className={`p-6 sm:p-7 space-y-2 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 text-[#1D68FF] flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Share alert to circle
                  </h3>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Help others stay safe by sharing this scam alert with your circles.
              </p>
            </div>

            {/* Circles Selection List */}
            <div className="p-6 sm:p-7 space-y-4 max-h-[62vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Select Circles
              </h4>

              {groups.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                  isDark ? "bg-[#0B0F19] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 text-[#1D68FF] flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                    </svg>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    No Circles Found
                  </h4>
                  <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    You haven&apos;t joined or created any circles yet. Create or join a circle in My Circle to share scam alerts.
                  </p>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setAppMode("radar");
                      document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1D68FF] hover:bg-[#1558db] text-white transition-colors cursor-pointer"
                  >
                    Go to My Circle
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {groups.map((group) => {
                    const isSelected = selectedShareCircles.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedShareCircles(selectedShareCircles.filter(id => id !== group.id));
                          } else {
                            setSelectedShareCircles([...selectedShareCircles, group.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? isDark ? "bg-blue-500/10 border-blue-500/50 shadow-xs" : "bg-blue-50/60 border-[#1D68FF]/40 shadow-xs"
                            : isDark ? "bg-[#0B0F19] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isSelected ? "bg-[#1D68FF] text-white" : isDark ? "border border-slate-700 bg-black/20" : "border border-slate-300 bg-white"
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center font-bold">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                          </div>

                          <div>
                            <h4 className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {group.name}
                            </h4>
                            <p className={`text-[11px] sm:text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {group.role ? `${group.role.charAt(0).toUpperCase() + group.role.slice(1)}` : "Active Member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isDark ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            Circle
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Privacy Guarantee Note */}
              <div className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs ${
                isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-900"
              }`}>
                <svg className="w-4 h-4 text-[#1D68FF] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Your personal data or the original message content won&apos;t be shared.</span>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-5 sm:p-6 border-t flex items-center justify-end gap-3 ${
              isDark ? "border-slate-800 bg-[#0E131F]" : "border-slate-200 bg-white"
            }`}>
              <button
                onClick={() => setShowShareModal(false)}
                className={`px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (selectedShareCircles.length === 0) return;
                  setShareLoading(true);
                  try {
                    if (!user) {
                      setAuthModalOpen(true);
                      setShowShareModal(false);
                      return;
                    }
                    const validIds = selectedShareCircles.filter(id => groups.some(g => g.id === id));
                    if (validIds.length === 0) {
                      throw new Error("Please select at least one valid circle from your groups.");
                    }
                    if (!result?.analysisId) {
                      throw new Error("No analysis ID found. Please re-run the scam analysis first.");
                    }
                    const activeContext = validIds[0];
                    const res = await fetch(`/api/circles/${activeContext}/report`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        analysisId: result.analysisId,
                        groupIds: validIds,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || "Failed to post report to circle.");
                    }
                    
                    // Refresh feed for all active circles
                    await fetchFeed(selectedCircle);

                    setShareSuccess(true);
                    setTimeout(() => {
                      setShareSuccess(false);
                      setShowShareModal(false);
                    }, 1200);
                  } catch (err: any) {
                    console.error("Share error:", err);
                    alert(err.message || "Failed to share report to circle.");
                  } finally {
                    setShareLoading(false);
                  }
                }}
                disabled={selectedShareCircles.length === 0 || shareLoading}
                className="px-6 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>{shareSuccess ? "✓ Shared to circles!" : shareLoading ? "Sharing…" : "Share Report"}</span>
                {!shareLoading && !shareSuccess && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Circle Pop-up Modal (Requirement 1) */}
      {showCreateCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in text-left">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all animate-fade-in ${
              isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Create a Circle
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Start a trusted threat-sharing group
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateCircleModal(false);
                  dispatch({ type: "DISMISS_ACTION_MESSAGE" });
                  dispatch({ type: "DISMISS_INVITE_CODE" });
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {newInviteCode ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base">Circle Created!</h4>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Share this invite code with members you trust to join:
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-lg font-mono px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-white/15 font-bold tracking-wider">
                      {newInviteCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(newInviteCode)}
                      className="px-4 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Circle Name
                    </label>
                    <input
                      type="text"
                      value={createGroupName}
                      onChange={(e) => dispatch({ type: "SET_INPUT", field: "createGroupName", value: e.target.value })}
                      placeholder="e.g. College Cyber Security or Family Circle"
                      className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D68FF] border transition-all ${
                        isDark ? "bg-[#090D16] border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Circle Description
                      </label>
                      <span className="text-[11px] text-slate-400">(Optional)</span>
                    </div>
                    <textarea
                      rows={3}
                      value={createGroupDescription}
                      onChange={(e) => dispatch({ type: "SET_INPUT", field: "createGroupDescription", value: e.target.value })}
                      placeholder="e.g. A community of members working together to identify and stop scams. Share alerts, learn, and keep each other safe online."
                      className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D68FF] border transition-all resize-none ${
                        isDark ? "bg-[#090D16] border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  {groupActionMessage && groupActionStatus === "error" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {groupActionMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-5 border-t flex justify-end gap-2.5 ${isDark ? "border-slate-800 bg-[#0E131F]" : "border-slate-200 bg-white"}`}>
              {newInviteCode ? (
                <button
                  onClick={() => {
                    setShowCreateCircleModal(false);
                    dispatch({ type: "DISMISS_INVITE_CODE" });
                    fetchAllCirclesFeed();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowCreateCircleModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isDark ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleCreateGroup();
                      await fetchAllCirclesFeed();
                    }}
                    disabled={groupActionStatus === "loading" || !createGroupName.trim()}
                    className="px-6 py-2 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    {groupActionStatus === "loading" ? "Creating…" : "Create Circle"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Circle Pop-up Modal (Requirement 2) */}
      {showJoinCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in text-left">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all animate-fade-in ${
              isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[#1D68FF] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Join a Circle
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Enter the invite code from a circle admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowJoinCircleModal(false);
                  dispatch({ type: "DISMISS_ACTION_MESSAGE" });
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  12-Character Invite Code
                </label>
                <input
                  type="text"
                  value={joinInviteCode}
                  onChange={(e) => dispatch({ type: "SET_INPUT", field: "joinInviteCode", value: e.target.value })}
                  placeholder="Paste invite code here"
                  className={`w-full rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1D68FF] border transition-all ${
                    isDark ? "bg-[#090D16] border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              {groupActionMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium border ${
                    groupActionStatus === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {groupActionMessage}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-5 border-t flex justify-end gap-2.5 ${isDark ? "border-slate-800 bg-[#0E131F]" : "border-slate-200 bg-white"}`}>
              <button
                onClick={() => setShowJoinCircleModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleJoinGroup();
                  await fetchAllCirclesFeed();
                  if (groupActionStatus === "success") {
                    setTimeout(() => setShowJoinCircleModal(false), 1200);
                  }
                }}
                disabled={groupActionStatus === "loading" || !joinInviteCode.trim()}
                className="px-6 py-2 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {groupActionStatus === "loading" ? "Joining…" : "Join Circle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Overview Pop-up Screen (Requirement 4) */}
      {selectedActivityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in text-left">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all animate-fade-in ${
              isDark ? "bg-[#0E131F] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-3.5">
                <MiniRiskBadge score={selectedActivityReport.riskScore} />
                <div>
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Report Overview
                  </h3>
                  <div className="flex items-center gap-2 text-xs pt-0.5">
                    <span className="font-bold text-[#1D68FF]">{selectedActivityReport.sourceGroupName}</span>
                    <span className={isDark ? "text-slate-500" : "text-slate-400"}>•</span>
                    <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {new Date(selectedActivityReport.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedActivityReport(null)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                  isDark
                    ? "hover:bg-slate-800 text-slate-400 hover:text-white bg-white/5 border border-white/10"
                    : "hover:bg-slate-200 text-slate-700 hover:text-slate-950 bg-slate-100 border border-slate-300"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Message Content */}
              <div className="space-y-1.5">
                <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                  Reported Message
                </label>
                <div
                  className={`p-4 sm:p-5 rounded-2xl border text-sm italic leading-relaxed ${
                    isDark ? "bg-[#090D16] border-slate-800 text-slate-200" : "bg-slate-50 border-2 border-slate-200 text-slate-900 font-medium"
                  }`}
                >
                  &ldquo;{selectedActivityReport.text}&rdquo;
                </div>
              </div>

              {/* AI Explanation */}
              {selectedActivityReport.explanation && (
                <div className="space-y-1.5">
                  <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                    AI Risk Analysis
                  </label>
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                      isDark ? "bg-blue-500/10 border-blue-500/20 text-slate-200" : "bg-blue-50/80 border-2 border-blue-200 text-slate-900 font-medium"
                    }`}
                  >
                    {selectedActivityReport.explanation}
                  </div>
                </div>
              )}

              {/* Flags Detected */}
              {selectedActivityReport.flags && selectedActivityReport.flags.length > 0 && (
                <div className="space-y-1.5">
                  <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                    Threat Indicators
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivityReport.flags.map((flag: string, idx: number) => (
                      <span
                        key={idx}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                          isDark
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : "bg-red-100 text-red-800 border-2 border-red-300 shadow-2xs"
                        }`}
                      >
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Intelligence (Scam Radar Clustering) */}
              {typeof selectedActivityReport.clusterCount === "number" && selectedActivityReport.clusterCount > 1 && (
                <div className="space-y-1.5">
                  <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                    Community Intelligence
                  </label>
                  <div
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 text-sm font-bold ${
                      isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-800"
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {selectedActivityReport.clusterCount - 1} similar {selectedActivityReport.clusterCount - 1 === 1 ? "report" : "reports"} detected
                  </div>
                </div>
              )}

              {/* Community Feedback & Voting */}
              <div className={`space-y-2.5 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                    Community Verification
                  </label>
                  {selectedActivityReport.isOwnReport && (
                    <span className="text-xs font-extrabold text-[#1D68FF] bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      Your Report
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleVote(selectedActivityReport.id, "confirm")}
                    disabled={votingReportId === selectedActivityReport.id || selectedActivityReport.isOwnReport}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
                      selectedActivityReport.votes?.currentUserVote === "confirm"
                        ? "bg-emerald-600 text-white font-black shadow-md border-2 border-emerald-600"
                        : isDark
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-emerald-100 text-emerald-900 border-2 border-emerald-400 hover:bg-emerald-200 shadow-xs"
                    }`}
                  >
                    <span>✓ Confirm</span>
                    <span>({selectedActivityReport.votes?.confirms ?? 0})</span>
                  </button>

                  <button
                    onClick={() => handleVote(selectedActivityReport.id, "deny")}
                    disabled={votingReportId === selectedActivityReport.id || selectedActivityReport.isOwnReport}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
                      selectedActivityReport.votes?.currentUserVote === "deny"
                        ? "bg-rose-600 text-white font-black shadow-md border-2 border-rose-600"
                        : isDark
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                        : "bg-rose-100 text-rose-900 border-2 border-rose-400 hover:bg-rose-200 shadow-xs"
                    }`}
                  >
                    <span>✕ Deny</span>
                    <span>({selectedActivityReport.votes?.denies ?? 0})</span>
                  </button>

                  {selectedActivityReport.isOwnReport && (
                    <button
                      onClick={() => handleDeleteReport(selectedActivityReport.id)}
                      disabled={deletingId === selectedActivityReport.id}
                      className={`ml-auto px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                        isDark
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                          : "bg-red-100 hover:bg-red-200 text-red-900 border-2 border-red-300 shadow-xs"
                      }`}
                    >
                      {deletingId === selectedActivityReport.id ? "Deleting…" : "🗑️ Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with "View Detailed Analysis" Action */}
            <div className={`p-5 sm:p-6 border-t flex items-center justify-between gap-3 ${isDark ? "border-slate-800 bg-[#0E131F]" : "border-slate-200 bg-white"}`}>
              <button
                onClick={() => setSelectedActivityReport(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? "border border-slate-700 text-slate-300 hover:bg-slate-800 bg-[#111625]"
                    : "border-2 border-slate-300 text-slate-700 hover:bg-slate-100 bg-white shadow-xs"
                }`}
              >
                Close
              </button>

              <button
                onClick={() => {
                  const selectedCheckResult: CheckResult = {
                    text: selectedActivityReport.text,
                    riskScore: selectedActivityReport.riskScore,
                    flags: selectedActivityReport.flags || ["Suspicious pattern detected"],
                    explanation: selectedActivityReport.explanation,
                    embedding: null,
                    complaintDraft: `I am reporting a suspicious communication containing: "${selectedActivityReport.text}". Risk assessment: ${selectedActivityReport.riskScore}/100. Flags: ${(selectedActivityReport.flags || []).join(", ")}.`,
                    financialLossLikely: selectedActivityReport.riskScore > 75,
                    analysisId: selectedActivityReport.id,
                  };
                  setResult(selectedCheckResult);
                  setShowDetailedAnalysis(true);
                  setSelectedActivityReport(null);
                  setAppMode("personal");
                  document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1D68FF] hover:bg-[#1558db] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95"
              >
                <span>View Detailed Analysis</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {authModalOpen && (
        <AuthModal theme={theme} onClose={() => setAuthModalOpen(false)} />
      )}

      {/* Fallback Wave Overlay for browsers without View Transitions API */}
      {waveOverlay && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          style={{
            backgroundColor: waveOverlay.color,
            clipPath: `polygon(${generateOrganicWavePoints(
              waveOverlay.originX,
              waveOverlay.originY,
              typeof window !== "undefined"
                ? Math.hypot(window.innerWidth, window.innerHeight) * 1.8
                : 2000,
              1.5
            )})`,
            animation: "wave-fallback-expand 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        />
      )}
    </div>
  );
}
