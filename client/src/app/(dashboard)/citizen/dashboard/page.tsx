"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Activity,
  CheckCircle,
  Bell,
  Map,
  Plus,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { useNotificationStore } from "@/store/notificationStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, timeAgo, getStatusColor } from "@/lib/utils";
import type { Complaint } from "@/lib/types";

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, appUser, isLoaded, isSignedIn } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();

  const { data: complaintsData, isLoading: loadingComplaints } = useComplaints();
  const complaints: Complaint[] = Array.isArray(complaintsData) ? complaintsData : [];

  // Filter complaints submitted by this citizen if available
  const myComplaints = useMemo(() => {
    if (!user?.id) return complaints;
    return complaints.filter((c: any) => {
      const subId = typeof c.submittedBy === "object" ? c.submittedBy?._id || c.submittedBy?.clerkId : c.submittedBy;
      return subId === user.id || subId === appUser?._id;
    });
  }, [complaints, user?.id, appUser?._id]);

  const displayComplaints = myComplaints.length > 0 ? myComplaints : complaints.slice(0, 5);

  useEffect(() => {
    if (isSignedIn) {
      void fetchNotifications();
    }
  }, [isSignedIn, fetchNotifications]);

  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    displayComplaints.forEach((c) => {
      if (c.status === "pending") pending++;
      else if (c.status === "in_progress") inProgress++;
      else if (c.status === "resolved") resolved++;
    });
    return {
      total: displayComplaints.length,
      pending,
      inProgress,
      resolved,
    };
  }, [displayComplaints]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.fullName || appUser?.name || "Citizen"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Track and manage your civic grievance reports in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/citizen/submit">
            <Button className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider">
              <Plus className="size-3.5 mr-1.5" />
              File New Issue
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          onClick={() => router.push("/citizen/complaints")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-stone-200 hover:border-orange-300 rounded-2xl"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Reports</span>
              <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=pending")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-stone-200 hover:border-orange-300 rounded-2xl"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Review</span>
              <span className="text-2xl font-extrabold text-slate-900">{stats.pending}</span>
            </div>
            <div className="h-10 w-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=in_progress")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-stone-200 hover:border-orange-300 rounded-2xl"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">In Progress</span>
              <span className="text-2xl font-extrabold text-slate-900">{stats.inProgress}</span>
            </div>
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl">
              <Activity className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=resolved")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-stone-200 hover:border-orange-300 rounded-2xl"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Resolved</span>
              <span className="text-2xl font-extrabold text-emerald-600">{stats.resolved}</span>
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl">
              <CheckCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Recent Reports */}
        <section className="lg:col-span-2">
          <Card className="bg-white border border-stone-200 rounded-3xl shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="border-b border-stone-100 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Civic Grievances
              </CardTitle>
              <Button
                variant="link"
                onClick={() => router.push("/citizen/complaints")}
                className="text-xs text-[#D95D0F] font-bold uppercase tracking-wider"
              >
                View All &rarr;
              </Button>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              {loadingComplaints ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : displayComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3">
                  <FileText className="size-8 text-stone-300" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">No complaints filed yet</p>
                    <p className="text-xs text-slate-500">Help improve your neighborhood by reporting local issues.</p>
                  </div>
                  <Button onClick={() => router.push("/citizen/submit")} size="sm" className="bg-[#D95D0F] text-white text-xs font-bold">
                    File First Report
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {displayComplaints.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => router.push(`/complaints/${c._id}`)}
                      className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-stone-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                          <img
                            src={c.images?.before || "https://placehold.co/100x100?text=Issue"}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{c.title}</h4>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 text-[#D95D0F] shrink-0" />
                            {c.location?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`capitalize font-bold text-[10px] ${getStatusColor(c.status)}`}
                        >
                          {c.status.replace("_", " ")}
                        </Badge>
                        <ChevronRight className="size-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: Notifications & Quick Actions */}
        <section className="space-y-6">
          <Card className="bg-white border border-stone-200 rounded-3xl shadow-sm">
            <CardHeader className="border-b border-stone-100 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Bell className="size-4 text-slate-400" />
                Live Updates
              </CardTitle>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#D95D0F]">
                  {unreadCount} Unread
                </span>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (n.complaintId) router.push(`/complaints/${n.complaintId}`);
                        void markAsRead(n._id);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:bg-stone-50 transition ${
                        !n.read ? "bg-orange-50/40 border-orange-200 font-semibold" : "border-stone-100 text-slate-600"
                      }`}
                    >
                      <p className="line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{timeAgo(n.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
