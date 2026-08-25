"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ThumbsUp,
  HardHat,
  Scale,
  ArrowRight,
  Filter,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

type NotificationFilter = "all" | "unread" | "status" | "sla" | "upvote";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    const typeStr = (n.type as string) || "";
    if (filter === "unread") return !n.read;
    if (filter === "status") return typeStr.includes("status") || typeStr === "resolution";
    if (filter === "sla") return typeStr.includes("sla") || typeStr === "escalation";
    if (filter === "upvote") return typeStr.includes("upvote") || typeStr.includes("milestone");
    return true;
  });

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "resolution":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "sla_warning":
      case "sla_breach":
      case "escalation":
        return <Flame className="size-4 text-red-500" />;
      case "upvote_milestone":
      case "milestone":
        return <ThumbsUp className="size-4 text-[#D95D0F]" />;
      case "contractor_assigned":
        return <HardHat className="size-4 text-blue-600" />;
      default:
        return <Bell className="size-4 text-amber-500" />;
    }
  };

  const getNotificationBadge = (type?: string) => {
    switch (type) {
      case "resolution":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">Resolved</Badge>;
      case "sla_warning":
      case "sla_breach":
      case "escalation":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] uppercase font-bold">SLA Alert</Badge>;
      case "upvote_milestone":
      case "milestone":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] uppercase font-bold">Milestone</Badge>;
      case "contractor_assigned":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase font-bold">Contractor</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-bold border-stone-200">Update</Badge>;
    }
  };

  const handleMarkAll = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-100/70 text-[#D95D0F]">
              <Bell className="size-6 text-[#D95D0F]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Notification Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Real-time alerts on complaint milestones, SLA tracking, and ward resolutions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNotifications()}
            className="text-xs font-bold border-stone-300 rounded-xl"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAll}
              className="bg-[#D95D0F] hover:bg-[#c2510b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
            >
              <CheckCheck className="size-3.5 mr-1.5" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200/90 shadow-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-[#D95D0F] text-white shadow-xs"
              : "text-slate-600 hover:bg-stone-100"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "unread"
              ? "bg-[#D95D0F] text-white shadow-xs"
              : "text-slate-600 hover:bg-stone-100"
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter("status")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "status"
              ? "bg-[#D95D0F] text-white shadow-xs"
              : "text-slate-600 hover:bg-stone-100"
          }`}
        >
          Status &amp; Fixes
        </button>

        <button
          type="button"
          onClick={() => setFilter("sla")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "sla"
              ? "bg-[#D95D0F] text-white shadow-xs"
              : "text-slate-600 hover:bg-stone-100"
          }`}
        >
          SLA &amp; Escalations
        </button>

        <button
          type="button"
          onClick={() => setFilter("upvote")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "upvote"
              ? "bg-[#D95D0F] text-white shadow-xs"
              : "text-slate-600 hover:bg-stone-100"
          }`}
        >
          Upvote Milestones
        </button>
      </div>

      {/* 3. Notification List */}
      <Card className="border border-stone-200/90 bg-white rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
              <span className="text-xs font-semibold">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="size-16 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Bell className="size-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">No Notifications</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {filter === "unread"
                  ? "You have zero unread notifications. You are all caught up!"
                  : "No notifications match this category yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredNotifications.map((n) => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n._id}
                    onClick={() => {
                      if (n.complaintId) router.push(`/complaints/${n.complaintId}`);
                      void markAsRead(n._id);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl hover:bg-[#FAF8F5] cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isUnread
                        ? "bg-orange-50/40 border border-orange-200/60 shadow-xs"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-stone-100 shrink-0 mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getNotificationBadge(n.type)}
                          <span className="text-[11px] text-slate-400 font-medium">
                            {timeAgo(n.createdAt)}
                          </span>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-[#D95D0F]" />
                          )}
                        </div>

                        <p className={`text-xs sm:text-sm leading-snug ${isUnread ? "font-bold text-slate-900" : "text-slate-700"}`}>
                          {n.message}
                        </p>

                        {n.complaintId && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D95D0F] hover:underline pt-0.5">
                            View complaint details <ArrowRight className="size-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
