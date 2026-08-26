import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyCircleMembership } from "@/lib/auth/verify-circle-membership";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export async function GET(
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

    // 2. Fetch reports for the authorized circle from Redis
    let existingReports: any[] = [];
    try {
      const rawData = await redis.lrange(`circle:${auth.circleId}`, 0, -1);
      existingReports = rawData.map((item: any) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err: any) {
      console.warn("Could not read reports from Redis:", err);
    }

    const circleReports = existingReports;

    // 3. Calculate cluster counts
    const clusterCounts: Record<string, number> = {};
    for (const report of circleReports) {
      if (report.clusterId) {
        clusterCounts[report.clusterId] = (clusterCounts[report.clusterId] || 0) + 1;
      }
    }

    // 4. Add clusterCount and strip raw embedding before sending response
    const responseReports = circleReports.map((report) => ({
      id: report.id,
      circleId: report.circleId,
      clusterId: report.clusterId,
      text: report.text,
      riskScore: report.riskScore,
      flags: report.flags,
      explanation: report.explanation,
      timestamp: report.timestamp,
      clusterCount: clusterCounts[report.clusterId] || 1,
    }));

    // 5. Sort by timestamp descending
    responseReports.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ reports: responseReports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

