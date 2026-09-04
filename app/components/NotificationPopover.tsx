"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import type { NotificationRow } from "@/lib/notifications/types";

interface NotificationPopoverProps {
  isDark: boolean;
  onNavigateToCircle?: (circleId: string) => void;
  // Shared state from useLiveNotifications
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  desktopPermission?: NotificationPermission | "unsupported";
  onRequestDesktopPermission?: () => Promise<NotificationPermission | "unsupported">;
  onRefresh?: () => Promise<void>;
}

export default function NotificationPopover({
  isDark,
  onNavigateToCircle,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllRead,
  desktopPermission = "unsupported",
  onRequestDesktopPermission,
  onRefresh,
}: NotificationPopoverProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Refetch / sync when popover opens
  useEffect(() => {
    if (isOpen && onRefresh) {
      onRefresh();
    }
  }, [isOpen, onRefresh]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Click a notification
  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.is_read) {
      onMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // Deep linking to Circle
    if (notif.circle_id && onNavigateToCircle) {
      onNavigateToCircle(notif.circle_id);
    }
  };

  // Helper to get time ago
  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Helper for notification icon
  const getIcon = (type: string) => {
    switch (type) {
      case "REPORT_SHARED":
        return "🚨";
      case "MEMBER_JOINED":
        return "👋";
      case "MEMBER_LEFT":
        return "🚶";
      case "REPORT_CONFIRMED":
        return "✅";
      case "SCAM_CLUSTER_DETECTED":
        return "🔗";
      case "CIRCLE_UPDATED":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isDark
            ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
        aria-label="Notifications"
      >
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1D68FF] ring-2 ring-white dark:ring-[#0B0F19]" />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl border origin-top-right z-50 overflow-hidden flex flex-col ${
            isDark
              ? "bg-[#111625] border-slate-800/80 shadow-black/50"
              : "bg-[#EDF3FB] border-blue-200/90 shadow-[0_8px_30px_rgba(30,58,138,0.14)]"
          }`}
          style={{ maxHeight: "calc(100vh - 100px)", minHeight: "200px" }}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b ${
              isDark ? "border-slate-800/80" : "border-blue-200/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1D68FF] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[13px] font-medium text-[#1D68FF] hover:text-[#1558db] cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Desktop Notification Opt-in / Status bar */}
            {desktopPermission !== "unsupported" && (
              <div className="mt-2 pt-2 border-t border-slate-700/30 dark:border-slate-800/50 flex items-center justify-between text-xs">
                {desktopPermission === "default" && onRequestDesktopPermission && (
                  <button
                    onClick={onRequestDesktopPermission}
                    className="text-[11px] font-semibold text-[#1D68FF] hover:text-[#1558db] flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔔</span>
                    <span>Enable Desktop Alerts</span>
                  </button>
                )}
                {desktopPermission === "granted" && (
                  <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                    <span>✓</span>
                    <span>Desktop alerts active</span>
                  </span>
                )}
                {desktopPermission === "denied" && (
                  <span
                    className="text-[11px] text-slate-400"
                    title="Browser alerts were blocked. Enable in your browser's site settings."
                  >
                    Alerts blocked in browser
                  </span>
                )}
              </div>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className={`w-8 h-8 rounded-full ${isDark ? "bg-slate-800" : "bg-blue-200/60"}`} />
                    <div className="flex-1 space-y-2 py-1">
                      <div className={`h-3 w-3/4 rounded ${isDark ? "bg-slate-800" : "bg-blue-200/60"}`} />
                      <div className={`h-2.5 w-1/2 rounded ${isDark ? "bg-slate-800" : "bg-blue-200/60"}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isDark ? "bg-slate-800/50 text-slate-500" : "bg-white border border-blue-200/80 text-slate-400 shadow-2xs"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                  You&apos;re all caught up
                </p>
                <p className={`text-[13px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  No new Circle activity yet.
                </p>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? "divide-slate-800/50" : "divide-blue-200/60"}`}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3.5 flex gap-3 cursor-pointer transition-colors ${
                      notif.is_read
                        ? isDark
                          ? "hover:bg-white/[0.02]"
                          : "hover:bg-blue-100/40"
                        : isDark
                        ? "bg-[#1D68FF]/5 hover:bg-[#1D68FF]/10"
                        : "bg-white/60 hover:bg-white/90"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 text-lg">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p
                            className={`text-sm tracking-tight truncate ${
                              notif.is_read
                                ? isDark
                                  ? "text-slate-300 font-medium"
                                  : "text-slate-800 font-medium"
                                : isDark
                                ? "text-white font-bold"
                                : "text-slate-900 font-bold"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {notif.circle_name && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold truncate max-w-[90px] ${
                                isDark
                                  ? "bg-blue-500/15 text-[#1D68FF]"
                                  : "bg-blue-100 text-[#1D68FF]"
                              }`}
                            >
                              {notif.circle_name}
                            </span>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1D68FF] mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-[13px] leading-snug line-clamp-2 ${
                          notif.is_read
                            ? isDark
                              ? "text-slate-500"
                              : "text-slate-500"
                            : isDark
                            ? "text-slate-400"
                            : "text-slate-600"
                        }`}
                      >
                        {notif.message}
                      </p>
                      <p className={`text-[11px] mt-1.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        {getTimeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
