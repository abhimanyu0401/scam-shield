/**
 * lib/notifications/types.ts
 *
 * Strongly typed notification event model for Kinkeeper.
 *
 * These notification types map to real Circle/application events.
 * New types should only be added when a corresponding backend mutation exists.
 */

// ─── Notification Event Types ──────────────────────────────────────────────────

export type NotificationType =
  | "REPORT_SHARED"          // Another member shared a scam report to a Circle
  | "MEMBER_JOINED"          // A new member joined a Circle
  | "MEMBER_LEFT"            // A member left a Circle
  | "REPORT_CONFIRMED"       // Someone confirmed the current user's report
  | "SCAM_CLUSTER_DETECTED"  // Scam Radar found a similar report to the user's existing one
  | "CIRCLE_UPDATED";        // Circle metadata was meaningfully updated

// ─── DB Row Shape (read from Supabase) ────────────────────────────────────────

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  circle_id: string | null;
  report_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  // Resolved fields (joined during API fetch, not stored in DB)
  circle_name?: string | null;
  actor_name?: string | null;
}

// ─── API Response Shape ───────────────────────────────────────────────────────

export interface NotificationsApiResponse {
  notifications: NotificationRow[];
  unread_count: number;
}

// ─── Payload for creating a single notification ────────────────────────────────

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  circle_id?: string | null;
  report_id?: string | null;
  actor_id?: string | null;
  metadata?: Record<string, unknown>;
  /** Deterministic deduplication key. Same event key = no duplicate row. */
  event_key?: string;
}
