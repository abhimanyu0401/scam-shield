import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyCircleMembership } from "@/lib/auth/verify-circle-membership";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CircleReport {
  id: string;
  circleId: string;
  clusterId: string;
  userId?: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  embedding: number[] | null;
  timestamp: string;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
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

    // 1. Authenticate user and verify circle membership
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    // 2. Parse request JSON body safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 3. Require and validate analysisId
    if (!body.analysisId || typeof body.analysisId !== "string" || !UUID_REGEX.test(body.analysisId.trim())) {
      return NextResponse.json(
        { error: "Invalid or expired analysis ID. Please run a fresh scam check before reporting." },
        { status: 400 }
      );
    }
    const cleanAnalysisId = body.analysisId.trim();

    // 4. Retrieve server-verified analysis from Redis
    let cachedData: any = null;
    try {
      cachedData = await redis.get(`analysis:${cleanAnalysisId}`);
    } catch (redisErr) {
      console.error("Error retrieving analysis from Redis:", redisErr);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    if (!cachedData) {
      return NextResponse.json(
        { error: "Invalid or expired analysis ID. Please run a fresh scam check before reporting." },
        { status: 400 }
      );
    }

    const analysis = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    if (
      !analysis ||
      typeof analysis.text !== "string" ||
      typeof analysis.riskScore !== "number" ||
      !Array.isArray(analysis.flags) ||
      typeof analysis.explanation !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid or expired analysis ID. Please run a fresh scam check before reporting." },
        { status: 400 }
      );
    }

    // 5. Use server-stored verified analysis fields exclusively
    const cleanText = analysis.text.trim();
    const cleanRiskScore = analysis.riskScore;
    const cleanFlags = analysis.flags;
    const cleanExplanation = analysis.explanation;
    const cleanEmbedding: number[] | null = Array.isArray(analysis.embedding) ? analysis.embedding : null;

    // 6. Read existing reports for cosine similarity clustering
    let existingReports: CircleReport[] = [];
    try {
      const rawData = await redis.lrange(`circle:${auth.circleId}`, 0, -1);
      existingReports = rawData.map((item: any) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    } catch (err: any) {
      console.warn("Could not read reports from Redis:", err);
    }

    // 7. Secure ID generation and clustering
    const newId = crypto.randomUUID();
    let assignedClusterId = newId;

    if (cleanEmbedding) {
      let highestSim = -1;
      let bestMatch: CircleReport | null = null;

      for (const report of existingReports) {
        if (
          report.circleId === auth.circleId &&
          Array.isArray(report.embedding) &&
          report.embedding.length === cleanEmbedding.length
        ) {
          const sim = cosineSimilarity(cleanEmbedding, report.embedding);
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

    // 8. Build new report with server-controlled identity & timestamp
    const newReport: CircleReport = {
      id: newId,
      circleId: auth.circleId,
      clusterId: assignedClusterId,
      userId: auth.user.id,
      text: cleanText,
      riskScore: cleanRiskScore,
      flags: cleanFlags,
      explanation: cleanExplanation,
      embedding: cleanEmbedding,
      timestamp: new Date().toISOString(),
    };

    // 9. Push to Redis and trim to keep last 200 reports
    await redis.rpush(`circle:${auth.circleId}`, JSON.stringify(newReport));
    await redis.ltrim(`circle:${auth.circleId}`, -200, -1);

    // 10. Consume analysis key so it cannot be reused
    try {
      await redis.del(`analysis:${cleanAnalysisId}`);
    } catch (delErr) {
      console.warn("Failed to delete consumed analysis key:", delErr);
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("Error saving report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}


