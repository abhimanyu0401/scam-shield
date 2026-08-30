import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyCircleMembership } from "@/lib/auth/verify-circle-membership";
import { createClient } from "@/lib/supabase/server";
import { getVotes, type VoteType } from "@/lib/redis/votes";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export interface VoterInfo {
  userId: string;
  displayName: string;
}

export interface ReportVoteData {
  confirms: number;
  denies: number;
  total: number;
  confirmedBy: VoterInfo[]; // Capped at top 3 voters
  deniedBy: VoterInfo[];   // Capped at top 3 voters
  currentUserVote: "confirm" | "deny" | null;
}

export interface FeedCircleReport {
  id: string;
  groupIds: string[];
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  timestamp: string;
  clusterCount: number;
  isOwnReport: boolean;
  votes: ReportVoteData;
}

const VOTE_FETCH_CHUNK_SIZE = 25;
const MAX_DISPLAY_NAMES = 3;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    // 1. Authenticate user and verify circle membership
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    const targetCircleId = auth.circleId;
    const viewerUserId = auth.user.id;

    // 2. Fetch reports for the authorized circle from Redis
    let existingReports: any[] = [];
    try {
      const rawData = await redis.lrange(`circle:${targetCircleId}`, 0, -1);
      existingReports = rawData.map((item: any) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err: any) {
      console.warn("Could not read reports from Redis:", err);
    }

    const circleReports = existingReports;

    // 3. Calculate per-group cluster counts (strictly isolated per circle)
    const clusterCounts: Record<string, number> = {};
    for (const report of circleReports) {
      const groupClusterId =
        report.clusterIds?.[targetCircleId] ?? report.clusterId ?? report.id;
      if (groupClusterId) {
        clusterCounts[groupClusterId] = (clusterCounts[groupClusterId] || 0) + 1;
      }
    }

    // 4. Fetch votes for all reports with bounded concurrency (chunks of 25)
    const reportVotesMap: Record<string, Record<string, VoteType>> = {};
    const allVoterUserIds = new Set<string>();

    for (let i = 0; i < circleReports.length; i += VOTE_FETCH_CHUNK_SIZE) {
      const chunk = circleReports.slice(i, i + VOTE_FETCH_CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (report) => {
          try {
            const votes = await getVotes(report.id);
            return { id: report.id, votes };
          } catch {
            return { id: report.id, votes: {} as Record<string, VoteType> };
          }
        })
      );

      for (const { id, votes } of chunkResults) {
        reportVotesMap[id] = votes;
        for (const uid of Object.keys(votes)) {
          allVoterUserIds.add(uid);
        }
      }
    }

    // 5. Batch-resolve voter display names in ONE Supabase query
    const nameMap = new Map<string, string>();
    if (allVoterUserIds.size > 0) {
      try {
        const supabase = await createClient();
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", Array.from(allVoterUserIds));

        for (const p of profiles || []) {
          if (p.display_name?.trim()) {
            nameMap.set(p.id, p.display_name.trim());
          }
        }
      } catch (profileErr) {
        console.warn("Failed to batch-fetch voter profiles:", profileErr);
      }
    }

    // 6. Assemble feed reports with cluster info, vote summary, and ownership flag
    const responseReports: FeedCircleReport[] = circleReports.map((report) => {
      const groupClusterId =
        report.clusterIds?.[targetCircleId] ?? report.clusterId ?? report.id;
      const votesDict = reportVotesMap[report.id] || {};

      const confirmedVoters: VoterInfo[] = [];
      const deniedVoters: VoterInfo[] = [];
      let confirmsCount = 0;
      let deniesCount = 0;

      for (const [uid, voteType] of Object.entries(votesDict)) {
        const displayName = nameMap.get(uid) || "Member";
        if (voteType === "confirm") {
          confirmsCount++;
          if (confirmedVoters.length < MAX_DISPLAY_NAMES) {
            confirmedVoters.push({ userId: uid, displayName });
          }
        } else if (voteType === "deny") {
          deniesCount++;
          if (deniedVoters.length < MAX_DISPLAY_NAMES) {
            deniedVoters.push({ userId: uid, displayName });
          }
        }
      }

      const currentUserVote = viewerUserId && votesDict[viewerUserId] ? votesDict[viewerUserId] : null;
      const isOwnReport = Boolean(report.userId && report.userId === viewerUserId);

      return {
        id: report.id,
        groupIds: Array.isArray(report.groupIds) ? report.groupIds : [targetCircleId],
        clusterId: groupClusterId,
        text: report.text,
        riskScore: report.riskScore,
        flags: report.flags,
        explanation: report.explanation,
        timestamp: report.timestamp,
        clusterCount: clusterCounts[groupClusterId] || 1,
        isOwnReport,
        votes: {
          confirms: confirmsCount,
          denies: deniesCount,
          total: confirmsCount + deniesCount,
          confirmedBy: confirmedVoters,
          deniedBy: deniedVoters,
          currentUserVote,
        },
      };
    });

    // 7. Sort by timestamp descending
    responseReports.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ reports: responseReports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
