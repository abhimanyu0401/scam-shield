import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CircleAuthResult =
  | { success: true; user: User; role: string; circleId: string }
  | { success: false; errorResponse: NextResponse };

/**
 * Server-side helper to validate circleId format, authenticate caller via Supabase SSR,
 * and verify membership in the requested circle via the `group_members` table.
 */
export async function verifyCircleMembership(circleId: string): Promise<CircleAuthResult> {
  // 1. Validate circleId format before using in DB/Redis
  if (!circleId || typeof circleId !== "string" || !UUID_REGEX.test(circleId.trim())) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Invalid circle ID" },
        { status: 400 }
      ),
    };
  }

  const cleanCircleId = circleId.trim();

  // 2. Server-side Supabase authentication
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    // 3. Server-side circle authorization check in group_members table
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", cleanCircleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "You are not a member of this circle" },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user,
      role: membership.role,
      circleId: cleanCircleId,
    };
  } catch (err) {
    console.error("Circle membership verification error:", err);
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

export type MultiCircleAuthResult =
  | { success: true; user: User; groupIds: string[] }
  | { success: false; errorResponse: NextResponse };

/**
 * Server-side helper to validate multiple groupIds, authenticate caller via Supabase SSR,
 * and verify membership across all requested groups in a single query to `group_members`.
 */
export async function verifyMultipleCircleMemberships(
  groupIds: string[]
): Promise<MultiCircleAuthResult> {
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "At least one group must be specified." },
        { status: 400 }
      ),
    };
  }

  // De-duplicate immediately
  const cleanGroupIds = Array.from(
    new Set(groupIds.map((g) => (typeof g === "string" ? g.trim() : "")).filter(Boolean))
  );

  if (cleanGroupIds.length === 0 || cleanGroupIds.some((gid) => !UUID_REGEX.test(gid))) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Invalid group ID format." },
        { status: 400 }
      ),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", cleanGroupIds)
      .eq("user_id", user.id);

    if (memberError) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Failed to verify group membership" },
          { status: 500 }
        ),
      };
    }

    const verifiedSet = new Set((memberships || []).map((m) => m.group_id));
    const allAuthorized = cleanGroupIds.every((gid) => verifiedSet.has(gid));

    if (!allAuthorized || (memberships || []).length < cleanGroupIds.length) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "You are not a member of one or more selected groups." },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user,
      groupIds: cleanGroupIds,
    };
  } catch (err) {
    console.error("Multi-group membership verification error:", err);
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

export type AnyCircleAuthResult =
  | { success: true; user: User; authorizedGroupIds: string[] }
  | { success: false; errorResponse: NextResponse };

/**
 * Server-side helper to validate groupIds, authenticate caller via Supabase SSR,
 * and verify membership in AT LEAST ONE of the specified groups in `group_members`.
 */
export async function verifyAnyCircleMembership(
  groupIds: string[]
): Promise<AnyCircleAuthResult> {
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "At least one group must be specified.", code: "INVALID_GROUPS" },
        { status: 400 }
      ),
    };
  }

  // De-duplicate immediately
  const cleanGroupIds = Array.from(
    new Set(groupIds.map((g) => (typeof g === "string" ? g.trim() : "")).filter(Boolean))
  );

  if (cleanGroupIds.length === 0 || cleanGroupIds.some((gid) => !UUID_REGEX.test(gid))) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Invalid group ID format.", code: "INVALID_GROUP_ID" },
        { status: 400 }
      ),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Authentication required", code: "UNAUTHENTICATED" },
          { status: 401 }
        ),
      };
    }

    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", cleanGroupIds)
      .eq("user_id", user.id);

    if (memberError) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Failed to verify group membership", code: "DATABASE_ERROR" },
          { status: 500 }
        ),
      };
    }

    const authorized = (memberships || []).map((m) => m.group_id);

    if (authorized.length === 0) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          {
            error: "You are not a member of any circle this report was shared to.",
            code: "NOT_A_MEMBER",
          },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user,
      authorizedGroupIds: authorized,
    };
  } catch (err) {
    console.error("verifyAnyCircleMembership error:", err);
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Authentication failed", code: "AUTH_FAILED" },
        { status: 500 }
      ),
    };
  }
}


