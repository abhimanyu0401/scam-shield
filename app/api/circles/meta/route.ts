import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export interface CircleMeta {
  description?: string | null;
  createdAt?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { circleId, inviteCode, description, createdAt } = body;

    const meta: CircleMeta = {
      description: description ? String(description).trim() : null,
      createdAt: createdAt || new Date().toISOString(),
    };

    if (circleId) {
      await redis.set(`circle:meta:${circleId}`, JSON.stringify(meta));
    }

    if (inviteCode) {
      await redis.set(`circle:meta:code:${inviteCode}`, JSON.stringify({ ...meta, circleId }));
    }

    return NextResponse.json({ success: true, meta });
  } catch (err: any) {
    console.error("Failed to save circle meta:", err);
    return NextResponse.json({ error: err.message || "Failed to save circle meta" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circleIdsParam = searchParams.get("circleIds");
    const inviteCodesParam = searchParams.get("inviteCodes");

    const circleIds = circleIdsParam ? circleIdsParam.split(",").filter(Boolean) : [];
    const inviteCodes = inviteCodesParam ? inviteCodesParam.split(",").filter(Boolean) : [];

    const resultMap: Record<string, CircleMeta> = {};

    for (const cid of circleIds) {
      try {
        const raw = await redis.get<string | CircleMeta>(`circle:meta:${cid}`);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          resultMap[cid] = parsed;
        }
      } catch {}
    }

    for (const code of inviteCodes) {
      try {
        const raw = await redis.get<string | (CircleMeta & { circleId?: string })>(`circle:meta:code:${code}`);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (parsed.circleId) {
            resultMap[parsed.circleId] = {
              ...resultMap[parsed.circleId],
              ...parsed,
              description: parsed.description ?? resultMap[parsed.circleId]?.description ?? null,
            };
          }
          resultMap[code] = parsed;
        }
      } catch {}
    }

    // Try reading created_at from Supabase groups table for any circles without metadata
    const missingIds = circleIds.filter((id) => !resultMap[id]?.createdAt);
    if (missingIds.length > 0) {
      try {
        const supabase = await createClient();
        const { data: dbGroups } = await supabase
          .from("groups")
          .select("id, created_at, invite_code")
          .in("id", missingIds);

        for (const g of dbGroups || []) {
          if (g.created_at) {
            if (!resultMap[g.id]) resultMap[g.id] = {};
            if (!resultMap[g.id].createdAt) resultMap[g.id].createdAt = g.created_at;
          }
          if (g.invite_code && resultMap[g.invite_code]) {
            if (!resultMap[g.id]) resultMap[g.id] = {};
            if (resultMap[g.id].description === undefined && resultMap[g.invite_code].description !== undefined) {
              resultMap[g.id].description = resultMap[g.invite_code].description;
            }
          }
        }
      } catch (dbErr) {
        console.warn("Could not query groups table for created_at:", dbErr);
      }
    }

    return NextResponse.json({ meta: resultMap });
  } catch (err: any) {
    console.error("Failed to fetch circle meta:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch circle meta" }, { status: 500 });
  }
}
