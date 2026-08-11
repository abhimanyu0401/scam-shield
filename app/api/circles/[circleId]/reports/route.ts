import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

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

    let existingReports: any[] = [];
    try {
      const rawData = await redis.lrange(`circle:${circleId}`, 0, -1);
      existingReports = rawData.map((item: any) => 
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err: any) {
      console.warn("Could not read reports from Redis:", err);
    }

    const circleReports = existingReports;

    // Calculate cluster counts
    const clusterCounts: Record<string, number> = {};
    for (const report of circleReports) {
      clusterCounts[report.clusterId] = (clusterCounts[report.clusterId] || 0) + 1;
    }

    // Add clusterCount and remove embedding from response to save bandwidth
    const responseReports = circleReports.map(report => ({
      ...report,
      embedding: undefined, // remove before sending
      clusterCount: clusterCounts[report.clusterId] || 1
    }));

    // Sort by timestamp descending
    responseReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ reports: responseReports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
