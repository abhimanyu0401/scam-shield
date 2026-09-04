import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

// ─── Flag → Human-readable Category mapping ──────────────────────────────────
// Derived from existing AI-analysis flags already stored on reports
const FLAG_CATEGORY_MAP: Record<string, string> = {
  banking_fraud: "Banking & Finance",
  kyc_fraud: "Banking & Finance",
  bank_account_fraud: "Banking & Finance",
  investment_scam: "Investment & Trading",
  investment_fraud: "Investment & Trading",
  trading_scam: "Investment & Trading",
  crypto_scam: "Investment & Trading",
  job_scam: "Job & Work from Home",
  work_from_home: "Job & Work from Home",
  employment_fraud: "Job & Work from Home",
  phishing: "Phishing",
  phishing_link: "Phishing",
  url_phishing: "Phishing",
  lottery_fraud: "Lottery & Prize",
  prize_scam: "Lottery & Prize",
  lottery_scam: "Lottery & Prize",
  romance_scam: "Romance Scam",
  romance_fraud: "Romance Scam",
  tech_support_scam: "Tech Support",
  tech_support: "Tech Support",
  impersonation: "Impersonation",
  identity_impersonation: "Impersonation",
  government_impersonation: "Impersonation",
  financial_fraud: "Financial Fraud",
  otp_fraud: "OTP & UPI Fraud",
  upi_fraud: "OTP & UPI Fraud",
  malicious_link: "Malicious Links",
  suspicious_link: "Malicious Links",
  social_engineering: "Social Engineering",
  urgency_pressure: "Social Engineering",
  emotional_manipulation: "Social Engineering",
};

// Category display color palette (hex, matched to existing blue/teal theme)
const CATEGORY_COLORS: Record<string, string> = {
  "Banking & Finance": "#1D68FF",
  "Investment & Trading": "#6C63FF",
  "Job & Work from Home": "#10B981",
  "Phishing": "#F59E0B",
  "Lottery & Prize": "#EF4444",
  "Romance Scam": "#EC4899",
  "Tech Support": "#14B8A6",
  "Impersonation": "#8B5CF6",
  "Financial Fraud": "#3B82F6",
  "OTP & UPI Fraud": "#F97316",
  "Malicious Links": "#EF4444",
  "Social Engineering": "#06B6D4",
  "Other": "#64748B",
};

export type ActivityType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "ALERT_SHARED"
  | "ALERT_CONFIRMED"
  | "CIRCLE_UPDATED";

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  actorName: string;
  title: string;
  desc: string;
  timestamp: string;
  circleName: string;
  circleId: string;
}

export interface TopCategory {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

export interface DashboardCircle {
  id: string;
  name: string;
  memberCount: number;
  reportCount: number;
  role: string;
  inviteCode: string;
}

export interface DashboardResponse {
  userId: string;
  groupCount: number;
  reportCount: number;
  confirmationCount: number;
  uniqueMemberCount: number;
  topCategories: TopCategory[];
  recentActivity: DashboardActivity[];
  circles: DashboardCircle[];
}

export async function GET() {
  try {
    // ── 1. Authenticate user ──────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.id;

    // ── 2. Fetch user's groups from Supabase ─────────────────────────────────
    const { data: memberRows, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, role, groups(id, name, invite_code)")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Dashboard: Failed to fetch group memberships:", memberError);
      return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
    }

    const groupRows = (memberRows || []).filter(
      (row: any) => row.groups?.id
    );
    const groupIds = groupRows.map((row: any) => row.groups.id as string);

    if (groupIds.length === 0) {
      // User has no circles — return empty dashboard
      return NextResponse.json<DashboardResponse>({
        userId,
        groupCount: 0,
        reportCount: 0,
        confirmationCount: 0,
        uniqueMemberCount: 0,
        topCategories: [],
        recentActivity: [],
        circles: [],
      });
    }

    // ── 3. Fetch unique member count across ALL circles (Option B) ────────────
    const { data: allMemberRows } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds);

    const uniqueUserIds = new Set<string>(
      (allMemberRows || []).map((r: any) => r.user_id as string)
    );
    const uniqueMemberCount = uniqueUserIds.size;

    // ── 4. Fetch per-group member counts for circle cards ────────────────────
    const groupMemberCountMap: Record<string, number> = {};
    for (const row of allMemberRows || []) {
      // We need per-group counts, so re-query per group from the same data
    }
    // Re-use a single extra query for per-group counts
    const { data: perGroupCounts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    for (const row of perGroupCounts || []) {
      groupMemberCountMap[row.group_id] =
        (groupMemberCountMap[row.group_id] || 0) + 1;
    }

    // ── 5. Fetch all reports for all circles from Redis in parallel ───────────
    const reportsByGroup = await Promise.all(
      groupIds.map(async (gid) => {
        try {
          const rawData = await redis.lrange(`circle:${gid}`, 0, -1);
          const reports = rawData.map((item: any) =>
            typeof item === "string" ? JSON.parse(item) : item
          );
          return { groupId: gid, reports };
        } catch {
          return { groupId: gid, reports: [] };
        }
      })
    );

    // ── 6. Aggregate report statistics ───────────────────────────────────────
    const seenReportIds = new Set<string>();
    const allReports: Array<{ report: any; groupId: string }> = [];

    for (const { groupId, reports } of reportsByGroup) {
      for (const report of reports) {
        if (!seenReportIds.has(report.id)) {
          seenReportIds.add(report.id);
          allReports.push({ report, groupId });
        }
      }
    }

    // Own reports count
    const reportCount = allReports.filter(
      ({ report }) => report.userId === userId
    ).length;

    // Confirmation count — reports the current user confirmed (voted "confirm")
    // We need to check votes for reports the user did NOT author
    const nonOwnReports = allReports.filter(({ report }) => report.userId !== userId);

    let confirmationCount = 0;
    if (nonOwnReports.length > 0) {
      const votesResults = await Promise.all(
        nonOwnReports.slice(0, 100).map(async ({ report }) => {
          try {
            const raw = await redis.hget<unknown>(`report:${report.id}:votes`, userId);
            if (!raw) return false;
            if (raw === "confirm") return true;
            if (typeof raw === "string") {
              try {
                const p = JSON.parse(raw);
                return p?.vote === "confirm";
              } catch {
                return false;
              }
            }
            if (typeof raw === "object" && raw !== null) {
              return (raw as any).vote === "confirm";
            }
            return false;
          } catch {
            return false;
          }
        })
      );
      confirmationCount = votesResults.filter(Boolean).length;
    }

    // ── 7. Compute Top Scam Categories from real flags ────────────────────────
    const categoryCounts: Record<string, number> = {};

    for (const { report } of allReports) {
      const flags: string[] = Array.isArray(report.flags) ? report.flags : [];
      let assignedCategory: string | null = null;

      // Find the first flag that maps to a meaningful category
      for (const flag of flags) {
        const category = FLAG_CATEGORY_MAP[flag.toLowerCase().replace(/[\s-]/g, "_")];
        if (category) {
          assignedCategory = category;
          break;
        }
      }

      if (assignedCategory) {
        categoryCounts[assignedCategory] = (categoryCounts[assignedCategory] || 0) + 1;
      } else if (flags.length > 0) {
        categoryCounts["Other"] = (categoryCounts["Other"] || 0) + 1;
      }
    }

    const totalCategorized = Object.values(categoryCounts).reduce((s, c) => s + c, 0);
    const topCategories: TopCategory[] = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        color: CATEGORY_COLORS[name] ?? "#64748B",
        percentage: totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0,
      }));

    // ── 8. Fetch activity from all circles in parallel (capped per circle) ────
    const groupNameMap: Record<string, string> = {};
    for (const row of groupRows) {
      const g = (row as any).groups;
      const gId: string = Array.isArray(g) ? g[0]?.id : g?.id;
      const gName: string = Array.isArray(g) ? g[0]?.name : g?.name;
      if (gId && gName) groupNameMap[gId] = gName;
    }

    const activityByGroup = await Promise.all(
      groupIds.slice(0, 8).map(async (gid) => {
        try {
          // Fetch explicit activity events
          const rawActs = await redis.lrange(`circle:activity:${gid}`, 0, 19);
          const explicitActs = rawActs.map((item: any) =>
            typeof item === "string" ? JSON.parse(item) : item
          );

          // Fetch recent reports for this group (for ALERT_SHARED events)
          const rawReports = await redis.lrange(`circle:${gid}`, 0, 9);
          const recentReports = rawReports.map((item: any) =>
            typeof item === "string" ? JSON.parse(item) : item
          );

          return {
            groupId: gid,
            circleName: groupNameMap[gid] || "Unknown Circle",
            explicitActs,
            recentReports,
          };
        } catch {
          return {
            groupId: gid,
            circleName: groupNameMap[gid] || "Unknown Circle",
            explicitActs: [],
            recentReports: [],
          };
        }
      })
    );

    // Collect all user IDs needed for profile name resolution
    const userIdsToResolve = new Set<string>();
    for (const { explicitActs, recentReports } of activityByGroup) {
      for (const act of explicitActs) {
        if (act.actorId) userIdsToResolve.add(act.actorId);
      }
      for (const report of recentReports) {
        if (report.userId) userIdsToResolve.add(report.userId);
      }
    }

    // Batch-resolve display names
    const profileMap: Record<string, string> = {};
    if (userIdsToResolve.size > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", Array.from(userIdsToResolve));

        for (const p of profiles || []) {
          if (p.id && p.display_name?.trim()) {
            profileMap[p.id] = p.display_name.trim();
          }
        }
      } catch {
        /* fail-open */
      }
    }

    // Build unified activity list
    const activities: DashboardActivity[] = [];

    for (const { groupId, circleName, explicitActs, recentReports } of activityByGroup) {
      // Derive ALERT_SHARED from recent reports
      for (const report of recentReports) {
        const isMe = report.userId === userId;
        const actorName = isMe
          ? "You"
          : profileMap[report.userId] || "A member";

        activities.push({
          id: `act-shared-${report.id}`,
          type: "ALERT_SHARED",
          actorName,
          title: "New report shared",
          desc: `${actorName} shared a report in ${circleName}`,
          timestamp: report.timestamp || new Date().toISOString(),
          circleName,
          circleId: groupId,
        });
      }

      // Process explicit lifecycle events
      for (const exp of explicitActs) {
        if (!exp?.type) continue;
        const isMe = exp.actorId === userId;
        const actorName = isMe
          ? "You"
          : profileMap[exp.actorId] || exp.actorName || "A member";

        if (exp.type === "MEMBER_JOINED") {
          activities.push({
            id: exp.id || `act-join-${exp.actorId}-${exp.timestamp}`,
            type: "MEMBER_JOINED",
            actorName,
            title: "New member joined",
            desc: `${actorName} joined ${circleName}`,
            timestamp: exp.timestamp || new Date().toISOString(),
            circleName,
            circleId: groupId,
          });
        } else if (exp.type === "MEMBER_LEFT") {
          activities.push({
            id: exp.id || `act-left-${exp.actorId}-${exp.timestamp}`,
            type: "MEMBER_LEFT",
            actorName,
            title: "Member left",
            desc: `${actorName} left ${circleName}`,
            timestamp: exp.timestamp || new Date().toISOString(),
            circleName,
            circleId: groupId,
          });
        } else if (exp.type === "CIRCLE_UPDATED") {
          activities.push({
            id: exp.id || `act-update-${exp.timestamp}`,
            type: "CIRCLE_UPDATED",
            actorName,
            title: "Circle updated",
            desc: exp.message || `${circleName} was updated`,
            timestamp: exp.timestamp || new Date().toISOString(),
            circleName,
            circleId: groupId,
          });
        }
      }
    }

    // Deduplicate and sort newest-first
    const seenActIds = new Set<string>();
    const dedupedActivities = activities
      .filter((act) => {
        if (seenActIds.has(act.id)) return false;
        seenActIds.add(act.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);

    // ── 9. Build circles list for dashboard ───────────────────────────────────
    const reportCountByGroup: Record<string, number> = {};
    for (const { groupId, reports } of reportsByGroup) {
      reportCountByGroup[groupId] = reports.length;
    }

    const circles: DashboardCircle[] = groupRows.map((row: any) => ({
      id: row.groups.id,
      name: row.groups.name,
      memberCount: groupMemberCountMap[row.groups.id] || 1,
      reportCount: reportCountByGroup[row.groups.id] || 0,
      role: row.role,
      inviteCode: row.groups.invite_code,
    }));

    // ── 10. Respond ───────────────────────────────────────────────────────────
    return NextResponse.json<DashboardResponse>({
      userId,
      groupCount: groupIds.length,
      reportCount,
      confirmationCount,
      uniqueMemberCount,
      topCategories,
      recentActivity: dedupedActivities,
      circles,
    });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
