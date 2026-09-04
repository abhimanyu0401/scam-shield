/**
 * PATCH /api/notifications/[notificationId]
 *
 * Mark a single notification as read.
 *
 * Security:
 *  - Authenticated server-side. RLS enforces the user can only update
 *    their own notification rows.
 *  - Only `is_read` may be changed. Other fields are ignored.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
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

    // 2. Validate notification ID
    const { notificationId } = await params;
    if (!notificationId || !UUID_REGEX.test(notificationId.trim())) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }
    const cleanId = notificationId.trim();

    // 3. Update is_read = true — RLS prevents touching other users' rows
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", cleanId)
      .eq("user_id", user.id); // extra defense on top of RLS

    if (updateError) {
      console.error("[/api/notifications PATCH] Update failed:", updateError.message);
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/notifications PATCH] Unexpected error:", message);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
