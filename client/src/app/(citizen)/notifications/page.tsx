"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell, CheckCheck, Loader2, BellOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { timeAgo } from "@/lib/utils";
import type { INotification } from "@/types/user";

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  status_update: {
    label: "Status Update",
    color: "#2563EB",
    bg: "#EFF6FF",
    dot: "#2563EB",
  },
  resolution: {
    label: "Resolved",
    color: "#059669",
    bg: "#F0FDF4",
    dot: "#059669",
  },
  escalation: {
    label: "Escalated",
    color: "#DC2626",
    bg: "#FEF2F2",
    dot: "#DC2626",
  },
  upvote_milestone: {
    label: "Upvote Milestone",
    color: "#D95D0F",
    bg: "#FFF7ED",
    dot: "#D95D0F",
  },
  sla_warning: {
    label: "SLA Warning",
    color: "#D97706",
    bg: "#FFFBEB",
    dot: "#D97706",
  },
};

function getConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      label: "Notification",
      color: "#6B7280",
      bg: "#F9FAFB",
      dot: "#9CA3AF",
    }
  );
}

function NotificationCard({ notification, onRead }: { notification: INotification; onRead: (id: string) => void }) {
  const cfg = getConfig(notification.type);

  return (
    <div
      className="flex gap-4 rounded-xl border p-4 transition-all"
      style={{
        backgroundColor: notification.read ? "#FFFFFF" : cfg.bg,
        borderColor: notification.read ? "#E5E7EB" : cfg.color + "40",
      }}
    >
      {/* Dot indicator */}
      <div className="mt-1.5 flex-shrink-0">
        <span
          className="block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: notification.read ? "#D1D5DB" : cfg.dot }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
            >
              {cfg.label}
            </span>
          </div>
          <span className="flex-shrink-0 text-[11px]" style={{ color: "#9CA3AF" }}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "#1F2937" }}>
          {notification.message}
        </p>
        {!notification.read && (
          <button
            onClick={() => onRead(notification._id)}
            className="mt-2 text-xs font-medium hover:underline"
            style={{ color: cfg.color }}
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead } =
    useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (isSignedIn) void fetchNotifications();
  }, [isSignedIn, fetchNotifications]);

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F7F4" }}>
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm hover:opacity-70"
            style={{ color: "#6B7280" }}
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#FFF3EB" }}
              >
                <Bell className="size-5" style={{ color: "#D95D0F" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#1F2937" }}>Notifications</h1>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs"
                style={{ borderColor: "#D95D0F", color: "#D95D0F" }}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="mb-4 flex gap-1 rounded-xl p-1"
          style={{ backgroundColor: "#ECE7DE" }}
        >
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all"
              style={{
                backgroundColor: filter === tab ? "#FFFFFF" : "transparent",
                color: filter === tab ? "#D95D0F" : "#6B7280",
                boxShadow: filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab === "unread" ? `Unread (${unreadCount})` : "All"}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin" style={{ color: "#D95D0F" }} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff className="size-12 mb-3" style={{ color: "#D1D5DB" }} />
            <p className="font-medium" style={{ color: "#6B7280" }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
              You'll see complaint updates and milestones here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
