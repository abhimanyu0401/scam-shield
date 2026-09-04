"use client";

import { useState, useEffect, useRef } from "react";
import type { ToastItem } from "@/lib/hooks/useLiveNotifications";

const TOAST_LIFETIME_MS = 6000; // 6 seconds auto-dismiss

interface NotificationToastProps {
  toast: ToastItem;
  isDark: boolean;
  onDismiss: (id: string) => void;
  onNavigateToCircle?: (circleId: string) => void;
  onMarkAsRead: (id: string) => Promise<void>;
}

function getIcon(type: string) {
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
}

function ToastCard({
  toast,
  isDark,
  onDismiss,
  onNavigateToCircle,
  onMarkAsRead,
}: NotificationToastProps) {
  const [remainingTime, setRemainingTime] = useState(TOAST_LIFETIME_MS);
  const [isHovered, setIsHovered] = useState(false);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  // Handle countdown timer with pause-on-hover
  useEffect(() => {
    if (isHovered) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsedSinceResume = Date.now() - startTimeRef.current;
      const totalElapsed = elapsedBeforePauseRef.current + elapsedSinceResume;
      const remaining = Math.max(0, TOAST_LIFETIME_MS - totalElapsed);
      setRemainingTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimeRef.current = Date.now();
  };

  const handleActionClick = async () => {
    await onMarkAsRead(toast.id);
    if (toast.notification.circle_id && onNavigateToCircle) {
      onNavigateToCircle(toast.notification.circle_id);
    }
    onDismiss(toast.id);
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, (remainingTime / TOAST_LIFETIME_MS) * 100)
  );

  const { notification } = toast;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative rounded-2xl p-4 transition-all duration-300 transform translate-y-0 opacity-100 overflow-hidden shadow-2xl ${
        isDark
          ? "bg-[#0D1424]/95 backdrop-blur-md border border-blue-500/30 text-white shadow-black/70"
          : "bg-[#EDF3FB]/95 backdrop-blur-md border border-blue-200/90 text-slate-900 shadow-[0_8px_30px_rgba(30,58,138,0.12)]"
      }`}
      role="alert"
    >
      {/* Top row: Icon, title, circle badge, and close button */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-xl select-none mt-0.5">
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h4
              className={`font-bold text-sm tracking-tight truncate ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {notification.title}
            </h4>
            {notification.circle_name && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold truncate max-w-[120px] ${
                  isDark
                    ? "bg-blue-500/15 text-[#1D68FF] border border-blue-500/20"
                    : "bg-blue-100 text-[#1D68FF] border border-blue-200/80"
                }`}
              >
                {notification.circle_name}
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed line-clamp-2 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {notification.message}
          </p>

          {/* Action button */}
          {notification.circle_id && (
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={handleActionClick}
                className="text-xs font-bold text-[#1D68FF] hover:text-[#1558db] cursor-pointer flex items-center gap-1 transition-colors group"
              >
                <span>View Circle</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
            isDark
              ? "text-slate-400 hover:text-white hover:bg-white/10"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Countdown progress line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 overflow-hidden ${
          isDark ? "bg-white/5" : "bg-blue-200/40"
        }`}
      >
        <div
          className="h-full bg-[#1D68FF] transition-all ease-linear"
          style={{ width: `${progressPercent}%`, transitionDuration: "50ms" }}
        />
      </div>
    </div>
  );
}

interface NotificationToastContainerProps {
  toasts: ToastItem[];
  isDark: boolean;
  onDismiss: (id: string) => void;
  onNavigateToCircle?: (circleId: string) => void;
  onMarkAsRead: (id: string) => Promise<void>;
}

export default function NotificationToastContainer({
  toasts,
  isDark,
  onDismiss,
  onNavigateToCircle,
  onMarkAsRead,
}: NotificationToastContainerProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 sm:right-6 z-[10000] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none animate-fade-in"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          isDark={isDark}
          onDismiss={onDismiss}
          onNavigateToCircle={onNavigateToCircle}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}
