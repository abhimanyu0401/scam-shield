/**
 * lib/notifications/create.ts
 *
 * Centralized server-side notification creation helpers.
 *
 * RULES:
 *  - All functions are async and fire-and-forget safe. They NEVER throw
 *    an error that would bubble up and abort the calling operation.
 *  - Notification failures are logged but do not affect the parent mutation.
 *  - user_id is always derived server-side; never trusted from the client.
 *  - Idempotency: duplicate notifications are blocked via a unique constraint
 *    on the `event_key` column (where provided).
 */

import { createClient } from "@/lib/supabase/server";
import type { CreateNotificationPayload, NotificationType } from "./types";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

// ─── Internal single-row insert ───────────────────────────────────────────────

/**
 * Insert one notification row into Supabase.
 * Returns true on success, false on failure (never throws).
 */
export async function createNotification(
  payload: CreateNotificationPayload,
  client?: ServerSupabaseClient
): Promise<boolean> {
  if (!payload.user_id || !payload.type || !payload.title || !payload.message) {
    console.warn("[Notifications] createNotification: missing required fields", payload);
    return false;
  }

  try {
    const supabase = client ?? (await createClient());

    const row: Record<string, unknown> = {
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      circle_id: payload.circle_id ?? null,
      report_id: payload.report_id ?? null,
      actor_id: payload.actor_id ?? null,
      is_read: false,
      metadata: payload.metadata ?? {},
    };

    if (payload.event_key) {
      row.event_key = payload.event_key;
    }

    const { error } = await supabase.from("notifications").insert(row);

    if (error) {
      // Code 23505 = unique_violation: duplicate event_key — silently skip
      if ((error as { code?: string }).code === "23505") {
        return true; // idempotent success
      }
      console.error("[Notifications] Insert failed:", error.message, { payload });
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Notifications] Unexpected error in createNotification:", err);
    return false;
  }
}

// ─── Batch insert helper ──────────────────────────────────────────────────────

/**
 * Insert multiple notifications in a single DB round trip.
 * Returns the number of rows successfully inserted.
 * Silently skips duplicates (23505) without aborting the batch.
 */
export async function createNotifications(
  payloads: CreateNotificationPayload[],
  client?: ServerSupabaseClient
): Promise<number> {
  if (payloads.length === 0) return 0;

  try {
    const supabase = client ?? (await createClient());

    const rows = payloads.map((p) => ({
      user_id: p.user_id,
      type: p.type,
      title: p.title,
      message: p.message,
      circle_id: p.circle_id ?? null,
      report_id: p.report_id ?? null,
      actor_id: p.actor_id ?? null,
      is_read: false,
      metadata: p.metadata ?? {},
      ...(p.event_key ? { event_key: p.event_key } : {}),
    }));

    // CRITICAL: Do NOT append .select("id") here.
    // In PostgREST, .select() forces Prefer: return=representation which evaluates
    // the SELECT RLS policy ("auth.uid() = user_id") on the returned rows.
    // Since notifications for circle members belong to other users (user_id != auth.uid()),
    // PostgREST triggers PostgreSQL error 42501 ("new row violates row-level security policy").
    // Without .select(), PostgREST sends Prefer: return=minimal, bypassing the SELECT RLS check.
    const { error } = await supabase
      .from("notifications")
      .insert(rows);

    if (error) {
      // On unique violation in batch, fall back to individual inserts so valid recipients succeed
      if ((error as { code?: string }).code === "23505") {
        let successCount = 0;
        for (const payload of payloads) {
          const ok = await createNotification(payload, supabase);
          if (ok) successCount++;
        }
        return successCount;
      }
      console.error("[Notifications] Batch insert failed:", error.message, { code: (error as { code?: string })?.code });
      return 0;
    }

    return rows.length;
  } catch (err) {
    console.error("[Notifications] Unexpected error in createNotifications:", err);
    return 0;
  }
}

// ─── Circle member helper ─────────────────────────────────────────────────────

/**
 * Fetch all user_ids in a circle, then send a notification to each member
 * EXCEPT the excluded user (typically the actor).
 *
 * Uses a single Supabase query for all member IDs.
 * Ensures event_key is unique per-recipient.
 */
export async function notifyCircleMembers(
  circleId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  extras: {
    report_id?: string | null;
    actor_id?: string | null;
    metadata?: Record<string, unknown>;
    event_key_prefix?: string;
    circle_name?: string;
  } = {},
  client?: ServerSupabaseClient
): Promise<void> {
  try {
    const supabase = client ?? (await createClient());

    const { data: members, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", circleId)
      .neq("user_id", excludeUserId);

    if (error) {
      console.warn(`[notifications] ${type} member fetch failed:`, error.message, { circleId });
      return;
    }

    if (!members || members.length === 0) {
      console.log(`[notifications] ${type}`, {
        circleId,
        actorId: extras.actor_id ?? excludeUserId,
        recipientCount: 0,
        recipientIds: [],
        note: "No other members in circle to notify",
      });
      return;
    }

    const recipientIds = members.map((m: { user_id: string }) => m.user_id);
    console.log(`[notifications] ${type}`, {
      circleId,
      actorId: extras.actor_id ?? excludeUserId,
      recipientCount: recipientIds.length,
      recipientIds,
    });

    const payloads: CreateNotificationPayload[] = members.map((m: { user_id: string }) => ({
      user_id: m.user_id,
      type,
      title,
      message,
      circle_id: circleId,
      report_id: extras.report_id ?? null,
      actor_id: extras.actor_id ?? null,
      metadata: extras.metadata ?? {},
      // Deterministic per-recipient event_key: <prefix>:<recipientId>
      ...(extras.event_key_prefix
        ? { event_key: `${extras.event_key_prefix}:${m.user_id}` }
        : {}),
    }));

    const insertedCount = await createNotifications(payloads, supabase);
    console.log(`[notifications] ${type} insertResult`, {
      circleId,
      recipientCount: recipientIds.length,
      insertedCount,
    });
  } catch (err) {
    console.error(`[notifications] Unexpected error in notifyCircleMembers (${type}):`, err);
  }
}

// ─── Report owner helper ──────────────────────────────────────────────────────

/**
 * Send a notification to the owner of a report.
 * Requires the report userId (not refetched here for performance).
 * Does NOT notify if reportOwnerId === actorId.
 */
export async function notifyReportOwner(
  reportOwnerId: string,
  actorId: string,
  type: NotificationType,
  title: string,
  message: string,
  extras: {
    circle_id?: string | null;
    report_id?: string | null;
    metadata?: Record<string, unknown>;
    event_key?: string;
  } = {},
  client?: ServerSupabaseClient
): Promise<void> {
  // Never notify a user about their own action
  if (!reportOwnerId || reportOwnerId === actorId) return;

  await createNotification({
    user_id: reportOwnerId,
    type,
    title,
    message,
    circle_id: extras.circle_id ?? null,
    report_id: extras.report_id ?? null,
    actor_id: actorId,
    metadata: extras.metadata ?? {},
    event_key: extras.event_key,
  }, client);
}
