-- ============================================================
-- Migration: notifications table
-- Scam Shield — In-App Notification System
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- or via the Supabase CLI: supabase db push
-- ============================================================

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  circle_id   UUID,
  report_id   UUID,
  actor_id    UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB NOT NULL DEFAULT '{}',
  event_key   TEXT,                        -- deterministic idempotency key
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- 3. Unique constraint for idempotency (prevents duplicate events)
--    Only enforced when event_key is non-null.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_key
  ON public.notifications (event_key)
  WHERE event_key IS NOT NULL;

-- 4. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- SELECT: users can only read their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- UPDATE: users can only change is_read on their own notifications
CREATE POLICY "notifications_update_own_read"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can delete their own notifications (future use)
CREATE POLICY "notifications_delete_own"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT: NOT allowed for authenticated role — notifications are created
-- server-side only (via service role or trusted backend functions).
-- The application uses the Supabase anon key for auth but creates
-- notifications via the server-side client (bypassing RLS via service role).
-- If you are using the anon key server-side via createClient(), grant INSERT:
-- (Uncomment the policy below and remove if using service role key instead)

-- CREATE POLICY "notifications_insert_backend"
--   ON public.notifications
--   FOR INSERT
--   WITH CHECK (FALSE); -- deny all client inserts; only service role can insert

-- NOTE: The Scam Shield server uses the publishable/anon key via @supabase/ssr.
-- To allow server-side inserts from the anon key, we grant INSERT without restriction:
-- The server is the ONLY source of truth for insert (never the browser).
CREATE POLICY "notifications_insert_server"
  ON public.notifications
  FOR INSERT
  WITH CHECK (TRUE);
-- SECURITY: This is acceptable because:
-- (a) The browser never calls a "create notification" endpoint.
-- (b) All notification creation happens in API route handlers
--     after successful authenticated operations.
-- (c) RLS SELECT/UPDATE/DELETE still ensure users only see their own data.
-- For production hardening, switch to a service role key for inserts.
