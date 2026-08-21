"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export default function CitizenNotificationsPage() {
  const router = useRouter();
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Bell className="size-6 text-[#D95D0F]" />
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Live alerts regarding status updates, SLA breaches, and contractor assignments</p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead()}
            className="text-xs font-bold border-stone-300 self-start sm:self-auto"
          >
            <CheckCheck className="size-3.5 mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="border border-stone-200 bg-white rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#D95D0F]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Bell className="size-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400">You don't have any unread notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (n.complaintId) router.push(`/complaints/${n.complaintId}`);
                    void markAsRead(n._id);
                  }}
                  className={`p-4 rounded-2xl hover:bg-stone-50 cursor-pointer transition flex items-start justify-between gap-4 ${
                    !n.read ? "bg-orange-50/40 font-semibold" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-slate-900">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block">{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D95D0F] shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
