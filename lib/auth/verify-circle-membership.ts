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
