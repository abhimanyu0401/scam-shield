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

    const targetCircleId = auth.circleId;

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

    // 4. Add clusterCount, resolve group-specific clusterId, and strip raw embedding
    const responseReports = circleReports.map((report) => {
      const groupClusterId =
        report.clusterIds?.[targetCircleId] ?? report.clusterId ?? report.id;
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
      };
    });

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
