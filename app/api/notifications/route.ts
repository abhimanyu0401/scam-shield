/**
 * GET /api/notifications
 *
 * Returns the authenticated user's recent notifications (newest first)
 * along with the unread count.
 *
 * Security:
 *  - User is always authenticated server-side via Supabase SSR.
 *  - RLS on the `notifications` table ensures users only see their own rows.
 *  - user_id is NEVER accepted from the request body or query params.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NotificationsApiResponse } from "@/lib/notifications/types";

const NOTIFICATION_LIMIT = 30;

export async function GET() {
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

    // 2. Fetch recent notifications for this user only (RLS enforces user_id)
    const { data: rows, error: fetchError } = await supabase
      .from("notifications")
      .select(
        "id, user_id, type, title, message, circle_id, report_id, actor_id, is_read, metadata, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT);

    if (fetchError) {
      console.error("[/api/notifications GET] Fetch failed:", fetchError.message);
      return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }

    const notifications = rows ?? [];

    // 3. Resolve circle names and actor names in a single batch each
    const circleIds = Array.from(
      new Set(notifications.map((n) => n.circle_id).filter(Boolean) as string[])
    );
    const actorIds = Array.from(
      new Set(notifications.map((n) => n.actor_id).filter(Boolean) as string[])
    );

    const circleNameMap: Record<string, string> = {};
    const actorNameMap: Record<string, string> = {};

    if (circleIds.length > 0) {
      try {
        const { data: circles } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", circleIds);
        for (const c of circles ?? []) {
          if (c.id && c.name) circleNameMap[c.id] = c.name;
        }
      } catch (e) {
        console.warn("[/api/notifications GET] Circle name resolution failed:", e);
      }
    }

    if (actorIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", actorIds);
        for (const p of profiles ?? []) {
          if (p.id && p.display_name) actorNameMap[p.id] = p.display_name;
        }
      } catch (e) {
        console.warn("[/api/notifications GET] Actor name resolution failed:", e);
      }
    }

    // 4. Annotate notifications with resolved names
    const enriched = notifications.map((n) => ({
      ...n,
      circle_name: n.circle_id ? (circleNameMap[n.circle_id] ?? null) : null,
      actor_name: n.actor_id ? (actorNameMap[n.actor_id] ?? null) : null,
    }));

    // 5. Unread count (cheaply computed from the already-fetched slice)
    //    For exact total, query separately:
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    const response: NotificationsApiResponse = {
      notifications: enriched as NotificationsApiResponse["notifications"],
      unread_count: unreadCount ?? 0,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/notifications GET] Unexpected error:", message);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
