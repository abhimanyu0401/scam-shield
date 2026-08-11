import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export interface CircleReport {
  id: string;
  circleId: string;
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  embedding: number[] | null;
  timestamp: string;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;
    const body = await req.json();
    const { text, riskScore, flags, explanation, embedding } = body;

    if (!text || typeof riskScore !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Read existing reports
    let existingReports: CircleReport[] = [];
    try {
      const rawData = await redis.lrange(`circle:${circleId}`, 0, -1);
      existingReports = rawData.map((item: any) => 
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err: any) {
      console.warn("Could not read reports from Redis:", err);
    }

    const newId = Math.random().toString(36).substring(2, 9);
    let assignedClusterId = newId;

    // Clustering logic
    if (embedding && Array.isArray(embedding)) {
      let highestSim = -1;
      let bestMatch: CircleReport | null = null;

      for (const report of existingReports) {
        if (report.circleId === circleId && report.embedding) {
          const sim = cosineSimilarity(embedding, report.embedding);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = report;
          }
        }
      }

      if (bestMatch && highestSim > 0.75) {
        assignedClusterId = bestMatch.clusterId;
      }
    }

    const newReport: CircleReport = {
      id: newId,
      circleId,
      clusterId: assignedClusterId,
      text,
      riskScore,
      flags: flags || [],
      explanation,
      embedding: embedding || null,
      timestamp: new Date().toISOString(),
    };

    await redis.rpush(`circle:${circleId}`, JSON.stringify(newReport));

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("Error saving report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
