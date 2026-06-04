"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  ClipboardList,
  Clock as ClockIcon,
  Activity,
  CheckCircle,
  AlertTriangle,
  ThumbsUp,
  Loader2,
  ChevronRight,
} from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { useUserStore } from "@/store/userStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getSLATimeLeft, getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/utils"
import type { IComplaint } from "@/types/complaint"

export default function AuthorityDashboard() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const storeUser = useUserStore((state) => state.user)
  const fetchMe = useUserStore((state) => state.fetchMe)
  
  const { complaints, loading, error, fetchComplaints } = useComplaintStore()

  const [currentTime, setCurrentTime] = useState("")
  const [limitCount, setLimitCount] = useState(10)
  const [filterBreachedOnly, setFilterBreachedOnly] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // SEO
  useEffect(() => {
    document.title = "NagarWatch - Authority Dashboard"
  }, [])

  // 1. Role Guard Checks
  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "authority") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  // 2. Fetch User and complaints
  useEffect(() => {
    if (clerkUser) {
      const loadDashboard = async () => {
        setLocalError(null)
        try {
          await fetchMe()
          await fetchComplaints({ limit: 50 })
        } catch (err) {
          setLocalError("Failed to load dashboard data.")
        }
      }
      void loadDashboard()
    }
  }, [clerkUser, fetchMe, fetchComplaints])

  // 3. Realtime Ticking Clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date()
      setCurrentTime(
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // 4. Compute Stats
  const stats = useMemo(() => {
    let pending = 0
    let inProgress = 0
    let resolvedToday = 0
    let breached = 0

    complaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else if (c.status === "resolved") {
        if (c.resolvedAt && isToday(c.resolvedAt)) resolvedToday++
      }

      if (c.sla?.breached) breached++
    })

    return {
      total: complaints.length,
      pending,
      inProgress,
      resolvedToday,
      breached,
    }
  }, [complaints])

  // 5. Priority Queue Sorting & Filtering
  const queueComplaints = useMemo(() => {
    // Priority queue includes only non-resolved issues
    let active = complaints.filter((c) => c.status !== "resolved")

    if (filterBreachedOnly) {
      active = active.filter((c) => c.sla?.breached)
    }

    // Sort by priorityScore desc (highest score = first in queue)
    return active.sort((a, b) => b.priorityScore - a.priorityScore)
  }, [complaints, filterBreachedOnly])

  const visibleQueue = useMemo(() => {
    return queueComplaints.slice(0, limitCount)
  }, [queueComplaints, limitCount])

  const remainingQueueCount = queueComplaints.length - visibleQueue.length

  const getPriorityColorIndicator = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-400"
    }
  }

  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      {/* Toast/Alert display */}
      {(error || localError) && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow border border-red-700 text-sm font-medium rounded-md">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{localError || error}</span>
          <button onClick={() => setLocalError(null)} className="text-white hover:text-red-100 font-bold ml-2 text-xs uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Row */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authority Dashboard</h1>
          <p className="text-sm text-gray-500">Solve local complaints &amp; manage ward SLA targets</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {storeUser?.ward && (
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-semibold py-1.5 px-3 rounded-full">
              Ward: {storeUser.ward.name}
            </Badge>
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {currentTime}
          </span>
        </div>
      </header>

      {/* SLA Breach Alert Banner */}
      {stats.breached > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 animate-pulse">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              ⚠️ {stats.breached} complaint(s) have breached SLA deadline — Immediate action required!
            </div>
          </div>
          <Button
            size="xs"
            variant="destructive"
            onClick={() => setFilterBreachedOnly((prev) => !prev)}
            className="text-[10px] font-bold uppercase tracking-widest self-start sm:self-auto h-7 whitespace-nowrap"
          >
            {filterBreachedOnly ? "Show All Issues" : "View Breached Complaints"}
          </Button>
        </div>
      )}

      {/* Stats Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total in Ward</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.total}</span>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg">
              <ClipboardList className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-white border shadow-sm hover:shadow transition-shadow ${
            stats.pending > 5 ? "border-red-200 bg-red-50/10" : "border-gray-100"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pending</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.pending}</span>
            </div>
            <div className="h-10 w-10 bg-red-50 text-red-600 flex items-center justify-center rounded-lg">
              <ClockIcon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">In Progress</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.inProgress}</span>
            </div>
            <div className="h-10 w-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-lg">
              <Activity className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Resolved Today</span>
              <span className="text-2xl font-extrabold text-gray-900">{stats.resolvedToday}</span>
            </div>
            <div className="h-10 w-10 bg-green-50 text-green-600 flex items-center justify-center rounded-lg">
              <CheckCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Priority Queue Section */}
      <section className="space-y-4">
        <header className="border-b pb-2">
          <h2 className="text-lg font-bold text-gray-900">
            Priority Queue — Action Required
          </h2>
          <p className="text-xs text-gray-500">Sorted by priority score. Highest urgency first.</p>
        </header>

        {loading ? (
          /* Skeletons */
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : queueComplaints.length === 0 ? (
          <Card className="p-8 text-center border-dashed border bg-white max-w-sm mx-auto">
            <CardContent className="space-y-2 pt-0">
              <CheckCircle className="size-10 text-green-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">Queue is Clear!</h3>
              <p className="text-xs text-gray-500">No unresolved complaints pending in this ward.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleQueue.map((c) => {
              const slaLeft = getSLATimeLeft(c.sla.deadline)
              
              return (
                <Card
                  key={c._id}
                  className="bg-white border border-gray-200/60 p-4 hover:shadow-sm transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Left Priority Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`h-3.5 w-3.5 rounded-full shrink-0 ${getPriorityColorIndicator(c.priority)}`} />
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 border bg-white ${getPriorityColor(c.priority)}`}>
                        {c.priority}
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{c.title}</h4>
                        <Badge variant="outline" className="text-[9px] px-1.5 border-gray-300 text-gray-500 uppercase shrink-0">
                          {getCategoryLabel(c.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="truncate">{c.location.address}</span>
                        <span className="shrink-0 flex items-center gap-0.5">
                          <ThumbsUp className="size-3 text-gray-400" />
                          {c.upvoteCount} upvotes
                        </span>
                      </div>
                    </div>

                    {/* SLA Chip (Right of Middle) */}
                    <div className="shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
                      {c.sla?.breached ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 bg-red-600 text-white animate-pulse">
                          BREACHED
                        </span>
                      ) : slaLeft.percentage > 80 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 bg-red-100 text-red-700 border border-red-200">
                          {slaLeft.hours}h left
                        </span>
                      ) : slaLeft.percentage > 60 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 bg-orange-100 text-orange-700 border border-orange-200">
                          {slaLeft.hours}h left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 bg-green-100 text-green-700 border border-green-200">
                          {slaLeft.hours}h left
                        </span>
                      )}
                    </div>

                    {/* View and Act Button */}
                    <Button
                      onClick={() => router.push(`/authority/complaints/${c._id}`)}
                      size="xs"
                      className="bg-primary hover:bg-primary/95 text-white font-semibold text-[10px] tracking-wider uppercase py-1 px-3 self-end sm:self-auto shrink-0"
                    >
                      View &amp; Act
                      <ChevronRight className="size-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}

            {/* Load More Button */}
            {remainingQueueCount > 0 && (
              <Button
                variant="outline"
                onClick={() => setLimitCount((c) => c + 10)}
                className="w-full text-xs font-bold uppercase tracking-wider h-10 border-gray-300 mt-2 hover:bg-gray-50"
              >
                Load More ({remainingQueueCount} remaining)
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
