/**
 * POST /api/notifications/mark-all-read
 *
 * Mark ALL unread notifications for the authenticated user as read.
 *
 * Security:
 *  - Authenticated server-side. Only updates user_id = auth.uid() rows.
 *  - RLS provides defense in depth.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Bulk update: only this user's unread rows
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (updateError) {
      console.error("[/api/notifications/mark-all-read] Update failed:", updateError.message);
      return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/notifications/mark-all-read] Unexpected error:", message);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
