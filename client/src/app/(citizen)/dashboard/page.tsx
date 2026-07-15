"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
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
  Info,
  Loader2,
  MapPin,
} from "lucide-react"

import { useUserStore } from "@/store/userStore"
import { useNotificationStore } from "@/store/notificationStore"
import { usersAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, timeAgo, getCategoryLabel, getStatusColor } from "@/lib/utils"
import type { IComplaint } from "@/types/complaint"

export default function CitizenDashboard() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const storeUser = useUserStore((state) => state.user)
  const fetchMe = useUserStore((state) => state.fetchMe)
  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    fetchNotifications,
    markAsRead,
    markAllRead,
  } = useNotificationStore()

  const [myComplaints, setMyComplaints] = useState<IComplaint[]>([])
  const [loadingComplaints, setLoadingComplaints] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  // 1. Role Guard Checks
  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = (clerkUser.publicMetadata?.role as string) || "citizen"
      if (role !== "citizen") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  // 2. Fetch User, Complaints, and Notifications
  useEffect(() => {
    if (clerkUser) {
      const loadDashboardData = async () => {
        setLoadingComplaints(true)
        setLocalError(null)
        try {
          await fetchMe()
          await fetchNotifications()
          const complaintsRes = await usersAPI.getMyComplaints({ page: 1, limit: 5 })
          setMyComplaints(complaintsRes.data.complaints || [])
        } catch (err) {
          setLocalError("Failed to fetch dashboard data. Please try again.")
        } finally {
          setLoadingComplaints(false)
        }
      }
      void loadDashboardData()
    }
  }, [clerkUser, fetchMe, fetchNotifications])

  // 3. Compute Stats
  const stats = useMemo(() => {
    let pending = 0
    let inProgress = 0
    let resolved = 0
    myComplaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else if (c.status === "resolved") resolved++
    })
    return {
      total: myComplaints.length,
      pending,
      inProgress,
      resolved,
    }
  }, [myComplaints])

  const handleMarkAsRead = async (id: string, complaintId: string) => {
    try {
      await markAsRead(id)
      router.push(`/complaints/${complaintId}`)
    } catch (err) {
      router.push(`/complaints/${complaintId}`)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await usersAPI.sync({ email: clerkUser?.primaryEmailAddress?.emailAddress || "", name: clerkUser?.fullName || "" })
      markAllRead()
    } catch {
      markAllRead()
    }
  }

  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="space-y-6">
      {/* Toast Error Alert */}
      {localError && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow-md border border-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-4 rounded-md">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{localError}</span>
          <button onClick={() => setLocalError(null)} className="text-white hover:text-red-100 font-bold ml-2 text-xs uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {storeUser?.name || clerkUser.fullName} 👋
          </h1>
          <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your reports</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full self-start md:self-auto">
          {formatDate(new Date().toISOString())}
        </span>
      </header>

      {/* Stats Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          onClick={() => router.push("/citizen/complaints")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-gray-100 hover:border-blue-300"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Submitted</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.total}</span>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=pending")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-gray-100 hover:border-orange-300"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pending</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.pending}</span>
            </div>
            <div className="h-10 w-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-lg">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=in_progress")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-gray-100 hover:border-indigo-300"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">In Progress</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.inProgress}</span>
            </div>
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg">
              <Activity className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/citizen/complaints?status=resolved")}
          className="hover:shadow-md transition cursor-pointer bg-white border border-gray-100 hover:border-green-300"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Resolved</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.resolved}</span>
            </div>
            <div className="h-10 w-10 bg-green-50 text-green-600 flex items-center justify-center rounded-lg">
              <CheckCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Recent Reports */}
        <section className="lg:col-span-2">
          <Card className="bg-white border border-gray-200/50 shadow-sm flex flex-col h-full">
            <CardHeader className="border-b border-gray-100 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                My Recent Reports
              </CardTitle>
              <Button
                variant="link"
                onClick={() => router.push("/citizen/complaints")}
                className="text-xs text-primary font-bold uppercase tracking-wider"
              >
                View All &rarr;
              </Button>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              {loadingComplaints ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : myComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 gap-4">
                  <div className="h-12 w-12 bg-gray-50 border flex items-center justify-center rounded-full">
                    <FileText className="size-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">No complaints submitted yet</p>
                    <p className="text-xs text-gray-500 mt-0.5">Let&apos;s improve our community by flagging local issues.</p>
                  </div>
                  <Button onClick={() => router.push("/citizen/submit")} size="sm" className="font-semibold">
                    Report Your First Issue
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myComplaints.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => router.push(`/complaints/${c._id}`)}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 shrink-0 bg-blue-50 text-blue-700 flex items-center justify-center rounded-full text-xs font-bold uppercase border">
                          {c.category[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{c.title}</h4>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin className="size-3 shrink-0" />
                            {c.location.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`capitalize font-semibold text-[10px] ${getStatusColor(c.status)}`}
                        >
                          {c.status.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-gray-400 font-semibold">{timeAgo(c.createdAt)}</span>
                        <ChevronRight className="size-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4 mt-auto">
              <Button
                onClick={() => router.push("/citizen/submit")}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold"
              >
                Report New Issue
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* RIGHT COLUMN: Notifications + Quick Actions */}
        <section className="space-y-6">
          {/* Notifications Card */}
          <Card className="bg-white border border-gray-200/50 shadow-sm">
            <CardHeader className="border-b border-gray-100 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Bell className="size-4 text-gray-400" />
                Recent Notifications
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {loadingNotifications ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-2">
                  <Bell className="size-8 text-gray-300" />
                  <span className="text-xs font-semibold">No notifications yet</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id, n.complaintId)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border hover:bg-gray-50 cursor-pointer transition ${
                        !n.read ? "bg-blue-50/20 border-blue-100" : "bg-white border-gray-100"
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          !n.read ? "bg-blue-600 animate-pulse" : "bg-gray-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-gray-700 leading-normal ${!n.read ? "font-semibold" : ""}`}>
                          {n.message}
                        </p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {unreadCount > 0 && (
              <CardFooter className="border-t p-3 text-center bg-gray-50/50 justify-center">
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Mark all as read
                </button>
              </CardFooter>
            )}
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-white border border-gray-200/50 shadow-sm">
            <CardHeader className="border-b border-gray-100 py-4 px-6 bg-gray-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={() => router.push("/citizen/submit")}
                variant="outline"
                className="w-full justify-start text-xs font-semibold uppercase tracking-wider h-11 border-gray-200 hover:bg-blue-50/30"
              >
                <Plus className="size-4 mr-2 text-primary" />
                📍 Report New Issue
              </Button>
              <Button
                onClick={() => router.push("/map")}
                variant="outline"
                className="w-full justify-start text-xs font-semibold uppercase tracking-wider h-11 border-gray-200 hover:bg-emerald-50/30"
              >
                <Map className="size-4 mr-2 text-green-700" />
                🗺️ View City Map
              </Button>
              <Button
                onClick={() => router.push("/complaints")}
                variant="outline"
                className="w-full justify-start text-xs font-semibold uppercase tracking-wider h-11 border-gray-200 hover:bg-purple-50/30"
              >
                <ClipboardList className="size-4 mr-2 text-purple-700" />
                📋 All Complaints
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
