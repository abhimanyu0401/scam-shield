import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";
import { setVote, getVoteSummary, type VoteType } from "@/lib/redis/votes";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // 1. Authenticate caller first — never touch Redis if unauthenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // 2. Validate reportId parameter format
    const { reportId } = await params;
    if (!reportId || typeof reportId !== "string" || !UUID_REGEX.test(reportId.trim())) {
      return NextResponse.json(
        { error: "Invalid report ID format.", code: "INVALID_REPORT_ID" },
        { status: 400 }
      );
    }
    const cleanReportId = reportId.trim();

    // 3. Fetch canonical report from Redis
    let cachedData: any = null;
    try {
      cachedData = await redis.get(`report:${cleanReportId}`);
    } catch (redisErr) {
      console.error("Error retrieving report from Redis:", redisErr);
      return NextResponse.json(
        { error: "Failed to retrieve report", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    if (!cachedData) {
      return NextResponse.json(
        { error: "Report not found.", code: "REPORT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const report = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    // 4. Reject if caller is the author of the report
    if (report.userId && report.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot confirm or deny your own report.", code: "IS_REPORTER" },
        { status: 403 }
      );
    }

    // 5. Verify caller is a member of AT LEAST ONE group in report.groupIds
    const targetGroupIds = Array.isArray(report.groupIds) ? report.groupIds : [];
    if (targetGroupIds.length === 0) {
      return NextResponse.json(
        { error: "Report has no associated circles.", code: "NO_ASSOCIATED_CIRCLES" },
        { status: 400 }
      );
    }

    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", targetGroupIds)
      .eq("user_id", user.id);

    if (memberError) {
      return NextResponse.json(
        { error: "Failed to verify circle membership", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        {
          error: "You are not a member of any circle this report was shared to.",
          code: "NOT_A_MEMBER",
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request JSON body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload.", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const vote = body?.vote;
    if (vote !== "confirm" && vote !== "deny") {
      return NextResponse.json(
        {
          error: "Invalid vote. Vote must be either 'confirm' or 'deny'.",
          code: "INVALID_VOTE",
        },
        { status: 400 }
      );
    }

    // 7. Record vote in Redis (atomic per-user overwrite + parent TTL sync)
    await setVote(cleanReportId, user.id, vote as VoteType);

    // 8. Return updated summary immediately
    const summary = await getVoteSummary(cleanReportId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    console.error("Error processing vote:", err);
    return NextResponse.json(
      { error: "Failed to process vote", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
