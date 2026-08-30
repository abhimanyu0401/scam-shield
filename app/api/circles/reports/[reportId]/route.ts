import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";
import { deleteVotes } from "@/lib/redis/votes";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
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

    const rawReportString = typeof cachedData === "string" ? cachedData : JSON.stringify(cachedData);
    const report = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    // 4. Authorization: ONLY report author may delete (admin delete deferred per roadmap)
    if (!report.userId || report.userId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can delete this report.", code: "NOT_REPORT_OWNER" },
        { status: 403 }
      );
    }

    // 5. Remove from EVERY circle list in report.groupIds
    const targetGroupIds: string[] = Array.isArray(report.groupIds) ? report.groupIds : [];
    const failedGroups: string[] = [];

    for (const gid of targetGroupIds) {
      try {
        const circleKey = `circle:${gid}`;

        // Pass A: Exact string match LREM (fast, handles majority of cases)
        const removedCount = await redis.lrem(circleKey, 0, rawReportString);

        // Pass B: Safety-net verification by ID
        // In case historical serialization / formatting differed, inspect the list (max 200 items).
        if (removedCount === 0) {
          const rawItems = await redis.lrange(circleKey, 0, -1);
          let foundResidual = false;

          const filtered = rawItems.filter((item: any) => {
            try {
              const parsed = typeof item === "string" ? JSON.parse(item) : item;
              if (parsed && parsed.id === cleanReportId) {
                foundResidual = true;
                return false;
              }
            } catch {
              // keep unparseable item
            }
            return true;
          });

          if (foundResidual) {
            // RACE CONDITION NOTE (Hackathon MVP trade-off):
            // The read-filter-rewrite safety net is non-atomic. A concurrent RPUSH from another
            // user reporting to circle:${gid} at the exact same millisecond could theoretically
            // be overwritten if this rewrite finishes last. We accept this rare window for the
            // hackathon MVP rather than introducing Redis WATCH/MULTI/EXEC transaction overhead,
            // since Pass A (LREM) handles standard deletions atomically without rewrite.
            await redis.del(circleKey);
            if (filtered.length > 0) {
              const stringified = filtered.map((f: any) =>
                typeof f === "string" ? f : JSON.stringify(f)
              );
              await redis.rpush(circleKey, ...stringified);
              await redis.ltrim(circleKey, -200, -1);
            }
          }
        }
      } catch (groupErr) {
        console.error(`Failed to remove report from circle:${gid}:`, groupErr);
        failedGroups.push(gid);
      }
    }

    // 6. Delete canonical report key
    try {
      await redis.del(`report:${cleanReportId}`);
    } catch (delErr) {
      console.error(`Failed to delete canonical report:${cleanReportId}:`, delErr);
    }

    // 7. Delete associated community vote hash
    try {
      await deleteVotes(cleanReportId);
    } catch (voteDelErr) {
      console.error(`Failed to delete votes for report:${cleanReportId}:`, voteDelErr);
    }

    // 8. Handle partial failures explicitly
    if (failedGroups.length > 0) {
      return NextResponse.json(
        {
          error: "Report deleted from canonical storage, but failed to clean up some circle feeds.",
          code: "PARTIAL_DELETE_FAILURE",
          failedGroups,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting report:", err);
    return NextResponse.json(
      { error: "Failed to delete report", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
