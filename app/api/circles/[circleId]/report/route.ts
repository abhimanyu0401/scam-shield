import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyMultipleCircleMemberships } from "@/lib/auth/verify-circle-membership";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CircleReport {
  id: string;
  groupIds: string[];
  clusterIds: Record<string, string>;
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

    // 1. Parse request JSON body safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 2. Authoritative target group resolution & immediate deduplication
    const rawGroupIds: string[] =
      Array.isArray(body?.groupIds) && body.groupIds.length > 0
        ? body.groupIds
        : [circleId];

    const cleanGroupIds = Array.from(
      new Set(
        rawGroupIds
          .map((g: any) => (typeof g === "string" ? g.trim() : ""))
          .filter(Boolean)
      )
    );

    if (cleanGroupIds.length === 0 || cleanGroupIds.some((gid) => !UUID_REGEX.test(gid))) {
      return NextResponse.json(
        { error: "Invalid group ID format." },
        { status: 400 }
      );
    }

    // 3. Authenticate user and verify membership across ALL target groups
    const auth = await verifyMultipleCircleMemberships(cleanGroupIds);
    if (!auth.success) {
      return auth.errorResponse;
    }

    // 4. Require and validate analysisId
    if (!body.analysisId || typeof body.analysisId !== "string" || !UUID_REGEX.test(body.analysisId.trim())) {
      return NextResponse.json(
        { error: "Invalid or expired analysis ID. Please run a fresh scam check before reporting." },
        { status: 400 }
      );
    }
    const cleanAnalysisId = body.analysisId.trim();

    // 5. Retrieve server-verified analysis from Redis
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

    // 6. Use server-stored verified analysis fields exclusively
    const cleanText = analysis.text.trim();
    const cleanRiskScore = analysis.riskScore;
    const cleanFlags = analysis.flags;
    const cleanExplanation = analysis.explanation;
    const cleanEmbedding: number[] | null = Array.isArray(analysis.embedding) ? analysis.embedding : null;

    const newId = crypto.randomUUID();

    // 7. Strictly per-group similarity clustering — NO cross-group correlation
    const clusterIds: Record<string, string> = {};

    for (const gid of cleanGroupIds) {
      let groupExistingReports: CircleReport[] = [];
      try {
        const rawData = await redis.lrange(`circle:${gid}`, 0, -1);
        groupExistingReports = rawData.map((item: any) =>
          typeof item === "string" ? JSON.parse(item) : item
        );
      } catch (err: any) {
        console.warn(`Could not read reports for circle:${gid} from Redis:`, err);
      }

      let assignedClusterId = newId;

      if (cleanEmbedding) {
        let highestSim = -1;
        let bestMatch: CircleReport | null = null;

        for (const report of groupExistingReports) {
          if (
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
          assignedClusterId = bestMatch.clusterIds?.[gid] ?? bestMatch.id;
        }
      }

      clusterIds[gid] = assignedClusterId;
    }

    // 8. Build single canonical report with server-controlled identity & timestamp
    const newReport: CircleReport = {
      id: newId,
      groupIds: cleanGroupIds,
      clusterIds,
      userId: auth.user.id,
      text: cleanText,
      riskScore: cleanRiskScore,
      flags: cleanFlags,
      explanation: cleanExplanation,
      embedding: cleanEmbedding,
      timestamp: new Date().toISOString(),
    };

    const serializedReport = JSON.stringify(newReport);

    // 9. Push to Redis for each target group and store canonical report with 60-day TTL
    // NOTE for Phase 11 (delete): this report exists as a copy in circle:${gid} for EACH gid in groupIds, plus the canonical report:${id} key. Any delete operation must remove it from every one of these locations, not just one group's list.
    for (const gid of cleanGroupIds) {
      await redis.rpush(`circle:${gid}`, serializedReport);
      await redis.ltrim(`circle:${gid}`, -200, -1);
    }

    // Canonical report key with 60-day TTL (60 * 24 * 60 * 60 seconds)
    try {
      await redis.set(`report:${newId}`, serializedReport, { ex: 60 * 24 * 60 * 60 });
    } catch (setErr) {
      console.warn("Failed to set canonical report TTL key:", setErr);
    }

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
