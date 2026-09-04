"use client";

/**
 * lib/hooks/useLiveNotifications.ts
 *
 * Single client-side source of truth for Scam Shield notifications:
 *  - Live notification list & unread count
 *  - Smart background polling (active tab: 20s, background tab: 60s)
 *  - Baseline initialization (existing notifications do NOT fire popups)
 *  - Detection of genuinely new notifications
 *  - In-app toast queue (max 3 visible)
 *  - Web Notification API integration (optional OS desktop popups)
 *  - Synchronized mark-as-read and mark-all-read operations
 *
 * NOTE ON ARCHITECTURE:
 * This implementation uses smart polling over standard HTTP.
 * When the browser or tab is open, polling detects incoming notifications.
 * If the browser is completely closed, polling cannot run and no notifications
 * will be detected. Web Push with Service Workers can be added separately
 * if true closed-browser notifications are needed in the future.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { NotificationRow, NotificationsApiResponse } from "@/lib/notifications/types";

// Polling intervals in milliseconds
export const ACTIVE_POLL_INTERVAL = 20_000;      // 20 seconds when tab is active/visible
export const BACKGROUND_POLL_INTERVAL = 60_000;  // 60 seconds when tab is hidden/in background
export const MAX_VISIBLE_TOASTS = 3;

export interface ToastItem {
  id: string;
  notification: NotificationRow;
  createdAt: number;
}

export interface UseLiveNotificationsOptions {
  user: { id: string; email?: string } | null;
  refreshTrigger?: number;
  onNavigateToCircle?: (circleId: string) => void;
}

export interface UseLiveNotificationsReturn {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  toasts: ToastItem[];
  desktopPermission: NotificationPermission | "unsupported";
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestDesktopPermission: () => Promise<NotificationPermission | "unsupported">;
  refresh: () => Promise<void>;
}

export function useLiveNotifications({
  user,
  refreshTrigger = 0,
  onNavigateToCircle,
}: UseLiveNotificationsOptions): UseLiveNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [desktopPermission, setDesktopPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  // Keep references to prevent stale closures and overlapping requests
  const userRef = useRef(user);
  const onNavigateToCircleRef = useRef(onNavigateToCircle);

  useEffect(() => {
    userRef.current = user;
    onNavigateToCircleRef.current = onNavigateToCircle;
  }, [user, onNavigateToCircle]);

  // Baseline tracking & Session-local deduplication sets
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);
  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust state during render when user changes or logs out (React recommended pattern)
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
    }
  }

  // Clear baseline and tracking refs on logout
  useEffect(() => {
    if (!user) {
      knownNotificationIdsRef.current.clear();
      notifiedIdsRef.current.clear();
      initialFetchDoneRef.current = false;
    }
  }, [user]);

  // Main fetch & detection function
  const fetchNotifications = useCallback(async () => {
    if (!userRef.current) return;
    if (isFetchingRef.current) return; // prevent overlapping requests

    isFetchingRef.current = true;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;

      const data: NotificationsApiResponse = await res.json();
      const fetchedNotifications = data.notifications || [];
      const fetchedUnreadCount = data.unread_count ?? 0;

      // Update state for popover and badge
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);

      // ── Step 1: Initial Baseline ──────────────────────────────────────────
      // On the first load, record all existing notification IDs into known sets.
      // Do NOT show toasts for notifications that existed prior to page load.
      if (!initialFetchDoneRef.current) {
        fetchedNotifications.forEach((n) => {
          knownNotificationIdsRef.current.add(n.id);
          notifiedIdsRef.current.add(n.id);
        });
        initialFetchDoneRef.current = true;
        return;
      }

      // ── Step 2: Genuinely New Notifications Detection ─────────────────────
      // Filter for items not present in our baseline / previously seen sets.
      const genuinelyNew: NotificationRow[] = [];
      for (const n of fetchedNotifications) {
        if (
          !knownNotificationIdsRef.current.has(n.id) &&
          !notifiedIdsRef.current.has(n.id)
        ) {
          // Immediately mark as known to prevent race conditions and duplicate dispatches
          knownNotificationIdsRef.current.add(n.id);
          notifiedIdsRef.current.add(n.id);
          genuinelyNew.push(n);
        }
      }

      if (genuinelyNew.length > 0) {
        // Sort newest first by created_at
        genuinelyNew.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // 1. Enqueue in-app toast notifications (capped at MAX_VISIBLE_TOASTS)
        const newToastEntries: ToastItem[] = genuinelyNew
          .slice(0, MAX_VISIBLE_TOASTS)
          .map((n) => ({
            id: n.id,
            notification: n,
            createdAt: Date.now(),
          }));

        setToasts((prev) => {
          const combined = [...newToastEntries, ...prev];
          return combined.slice(0, MAX_VISIBLE_TOASTS);
        });

        // 2. Dispatch OS / Browser Native Notifications if permission was granted
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          for (const notif of genuinelyNew.slice(0, MAX_VISIBLE_TOASTS)) {
            try {
              const osNotif = new window.Notification(
                `Scam Shield: ${notif.title}`,
                {
                  body: notif.message,
                  icon: "/assets/Dark.png",
                  tag: notif.id, // prevents OS-level duplicates
                }
              );

              osNotif.onclick = () => {
                try {
                  window.focus();
                } catch {}
                osNotif.close();
                if (notif.circle_id && onNavigateToCircleRef.current) {
                  onNavigateToCircleRef.current(notif.circle_id);
                }
              };
            } catch (err) {
              console.warn("Could not fire desktop notification:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("[useLiveNotifications] Fetch error:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Polling Lifecycle with Page Visibility handling
  useEffect(() => {
    if (!user) return;

    // Initial fetch on mount (deferred to next tick to avoid cascading renders)
    const initialTimer = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    const getInterval = () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? ACTIVE_POLL_INTERVAL
        : BACKGROUND_POLL_INTERVAL;

    const schedulePoll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await fetchNotifications();
        schedulePoll();
      }, getInterval());
    };

    schedulePoll();

    const handleVisibilityChange = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // When tab becomes visible again, poll immediately and resume active interval
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
      schedulePoll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchNotifications]);

  // Handle local refresh triggers (e.g., when a user shares a report in the current tab)
  useEffect(() => {
    if (refreshTrigger && user && initialFetchDoneRef.current) {
      const triggerTimer = setTimeout(() => {
        void fetchNotifications();
      }, 0);
      return () => clearTimeout(triggerTimer);
    }
  }, [refreshTrigger, user, fetchNotifications]);

  // Dismiss an individual toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setToasts((prev) => prev.filter((t) => t.id !== id));

      try {
        await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      } catch (err) {
        console.error("Failed to mark notification read:", err);
        fetchNotifications(); // revert/sync on failure
      }
    },
    [fetchNotifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setToasts([]);

    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
      fetchNotifications(); // revert/sync on failure
    }
  }, [unreadCount, fetchNotifications]);

  // Request browser notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      return perm;
    } catch (err) {
      console.warn("Permission request error:", err);
      return "denied";
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    toasts,
    desktopPermission,
    dismissToast,
    markAsRead,
    markAllAsRead,
    requestDesktopPermission,
    refresh: fetchNotifications,
  };
}
