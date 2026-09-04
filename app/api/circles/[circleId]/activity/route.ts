import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyCircleMembership } from "@/lib/auth/verify-circle-membership";
import { createClient } from "@/lib/supabase/server";
import { getVotesDetailed, type VoteRecord } from "@/lib/redis/votes";
import { notifyCircleMembers } from "@/lib/notifications/create";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export type ActivityType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "ALERT_SHARED"
  | "ALERT_CONFIRMED"
  | "CIRCLE_UPDATED";

export interface NormalizedActivityItem {
  id: string;
  type: ActivityType;
  actor: {
    id?: string;
    displayName: string;
  };
  title: string;
  desc: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    // 1. Authenticate user and verify circle membership (Security: HTTP 403 for non-members)
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    const targetCircleId = auth.circleId;
    const currentUserId = auth.user.id;

    // 2. Fetch explicit circle activity logs from Redis append-only list
    let explicitActivities: any[] = [];
    try {
      const rawActivities = await redis.lrange(`circle:activity:${targetCircleId}`, 0, 49);
      explicitActivities = (rawActivities || []).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err) {
      console.warn("Could not load explicit activity logs:", err);
    }

    // 3. Fetch real reports for this circle from Redis
    let circleReports: any[] = [];
    try {
      const rawReports = await redis.lrange(`circle:${targetCircleId}`, 0, 49);
      circleReports = (rawReports || []).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err) {
      console.warn("Could not load reports for activity derivation:", err);
    }

    // 4. Batch-fetch votes for reports to derive confirmation events with timestamps
    const reportVotesMap: Record<string, Record<string, VoteRecord>> = {};
    for (const r of circleReports) {
      try {
        const votes = await getVotesDetailed(r.id);
        reportVotesMap[r.id] = votes;
      } catch {
        reportVotesMap[r.id] = {};
      }
    }

    // 5. Gather all actor user IDs to resolve real display names from Supabase profiles
    const userIdsToLookup = new Set<string>();
    for (const r of circleReports) {
      if (r.userId) userIdsToLookup.add(r.userId);
    }
    for (const act of explicitActivities) {
      if (act.actorId) userIdsToLookup.add(act.actorId);
    }

    const profileMap: Record<string, string> = {};
    if (userIdsToLookup.size > 0) {
      try {
        const supabase = await createClient();
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", Array.from(userIdsToLookup));

        for (const p of profiles || []) {
          if (p.id && p.display_name?.trim()) {
            profileMap[p.id] = p.display_name.trim();
          }
        }
      } catch (err) {
        console.warn("Could not batch-resolve profile display names for activity:", err);
      }
    }

    const activities: NormalizedActivityItem[] = [];

    // 6. Derive ALERT_SHARED and ALERT_CONFIRMED from real reports
    for (const report of circleReports) {
      const isMe = report.userId === currentUserId;
      const reporterName = isMe ? "You" : profileMap[report.userId] || "A member";

      // Event: ALERT_SHARED
      activities.push({
        id: `act-alert-${report.id}`,
        type: "ALERT_SHARED",
        actor: {
          id: report.userId,
          displayName: reporterName,
        },
        title: "New alert shared",
        desc: `${reporterName} shared an alert`,
        timestamp: report.timestamp || new Date().toISOString(),
        metadata: {
          reportId: report.id,
          riskScore: report.riskScore,
          flags: report.flags,
          text: report.text,
        },
      });

      // Event: ALERT_CONFIRMED (only if confirmed votes exist)
      const votes = reportVotesMap[report.id] || {};
      const confirmVotes = Object.values(votes).filter((v) => v.vote === "confirm");
      const confirms = confirmVotes.length;
      if (confirms > 0) {
        // Deterministic confirmation timestamp: the earliest/qualifying confirmation vote
        // that caused the alert to become confirmed.
        const validTimestamps = confirmVotes
          .map((v) => v.timestamp)
          .filter((ts) => Boolean(ts) && !isNaN(new Date(ts).getTime()))
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const confirmationTimestamp =
          validTimestamps[0] || report.timestamp || new Date().toISOString();

        activities.push({
          id: `act-confirm-${report.id}`,
          type: "ALERT_CONFIRMED",
          actor: {
            displayName: `${confirms} ${confirms === 1 ? "member" : "members"}`,
          },
          title: "Alert confirmed",
          desc: `${confirms} ${confirms === 1 ? "member" : "members"} confirmed an alert`,
          timestamp: confirmationTimestamp,
          metadata: {
            reportId: report.id,
            confirms,
          },
        });
      }
    }

    // 7. Process explicit lifecycle events (MEMBER_JOINED, MEMBER_LEFT, CIRCLE_UPDATED)
    for (const exp of explicitActivities) {
      if (!exp || !exp.type) continue;
      const isMe = exp.actorId === currentUserId;
      const actorName = isMe ? "You" : profileMap[exp.actorId] || exp.actorName || "A member";

      if (exp.type === "MEMBER_JOINED") {
        activities.push({
          id: exp.id || `act-join-${exp.actorId}-${exp.timestamp}`,
          type: "MEMBER_JOINED",
          actor: {
            id: exp.actorId,
            displayName: actorName,
          },
          title: "New member joined",
          desc: `${actorName} joined the circle`,
          timestamp: exp.timestamp || new Date().toISOString(),
        });
      } else if (exp.type === "MEMBER_LEFT") {
        activities.push({
          id: exp.id || `act-left-${exp.actorId}-${exp.timestamp}`,
          type: "MEMBER_LEFT",
          actor: {
            id: exp.actorId,
            displayName: actorName,
          },
          title: "Member left",
          desc: `${actorName} left the circle`,
          timestamp: exp.timestamp || new Date().toISOString(),
        });
      } else if (exp.type === "CIRCLE_UPDATED") {
        activities.push({
          id: exp.id || `act-update-${exp.timestamp}`,
          type: "CIRCLE_UPDATED",
          actor: {
            id: exp.actorId,
            displayName: actorName,
          },
          title: "Circle update",
          desc: exp.message || "Circle description updated",
          timestamp: exp.timestamp || new Date().toISOString(),
        });
      }
    }

    // 8. Deduplicate by unique ID
    const seen = new Set<string>();
    const deduplicatedActivities = activities.filter((act) => {
      if (seen.has(act.id)) return false;
      seen.add(act.id);
      return true;
    });

    // 9. Sort strictly chronologically: newest -> oldest
    deduplicatedActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      activities: deduplicatedActivities,
    });
  } catch (err: any) {
    console.error("Failed to load circle activity:", err);
    return NextResponse.json({ error: err.message || "Failed to load circle activity" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    // 1. Authenticate user and verify circle membership
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    const body = await req.json();
    const { type, message, metadata } = body;

    if (!type || !["MEMBER_JOINED", "MEMBER_LEFT", "CIRCLE_UPDATED"].includes(type)) {
      return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
    }

    const eventItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      circleId: auth.circleId,
      type,
      actorId: auth.user.id,
      actorName: auth.user.user_metadata?.display_name || auth.user.email?.split("@")[0] || "Member",
      message: message || undefined,
      metadata: metadata || undefined,
      timestamp: new Date().toISOString(),
    };

    // Append to Redis list and keep latest 100 events
    await redis.lpush(`circle:activity:${auth.circleId}`, JSON.stringify(eventItem));
    await redis.ltrim(`circle:activity:${auth.circleId}`, 0, 99);

    // Fire notifications (awaited — failures never abort the activity recording)
    if (type === "MEMBER_JOINED" || type === "CIRCLE_UPDATED") {
      try {
        const supabase = await createClient();
        const { data: circleRow } = await supabase
          .from("groups")
          .select("name")
          .eq("id", auth.circleId)
          .single();
        const circleName = circleRow?.name ?? "your Circle";
        const actorName =
          auth.user.user_metadata?.display_name ||
          auth.user.email?.split("@")[0] ||
          "A member";

        if (type === "MEMBER_JOINED") {
          // Unique per recipient: MEMBER_JOINED:<circleId>:<newMemberId>:<recipientId>
          await notifyCircleMembers(
            auth.circleId,
            auth.user.id,
            "MEMBER_JOINED",
            "New member joined",
            `${actorName} joined ${circleName}.`,
            {
              actor_id: auth.user.id,
              event_key_prefix: `MEMBER_JOINED:${auth.circleId}:${auth.user.id}`,
            },
            supabase
          );
        } else if (type === "CIRCLE_UPDATED") {
          await notifyCircleMembers(
            auth.circleId,
            auth.user.id,
            "CIRCLE_UPDATED",
            "Circle updated",
            `${circleName} was updated by an admin.`,
            {
              actor_id: auth.user.id,
              event_key_prefix: `CIRCLE_UPDATED:${auth.circleId}:${auth.user.id}`,
            },
            supabase
          );
        }
      } catch (notifErr) {
        console.error("[Notifications] Activity notification failed (non-fatal):", notifErr);
      }
    }

    return NextResponse.json({ success: true, event: eventItem });
  } catch (err: any) {
    console.error("Failed to record circle activity:", err);
    return NextResponse.json({ error: err.message || "Failed to record activity" }, { status: 500 });
  }
}
