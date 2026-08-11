import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "circle-reports.json");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    let existingReports: any[] = [];
    try {
      const rawData = await fs.readFile(FILE_PATH, "utf8");
      existingReports = JSON.parse(rawData);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.warn("Could not read reports file:", err);
      }
    }

    // Filter by circleId
    const circleReports = existingReports.filter(r => r.circleId === circleId);

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
