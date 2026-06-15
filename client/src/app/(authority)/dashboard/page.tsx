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

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Authority Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Welcome, {storeUser?.name || clerkUser.fullName} &mdash; {storeUser?.ward?.name && `Ward: ${storeUser.ward.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentTime && (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
              {currentTime}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => router.push("/complaints")}
            className="font-bold text-xs uppercase tracking-wider"
          >
            <ClipboardList className="size-4 mr-1.5" />
            View All
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4 cursor-pointer hover:border-blue-300" onClick={() => router.push("/complaints")}>
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{loading ? <Skeleton className="h-7 w-12 mx-auto" /> : stats.total}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending</span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">{loading ? <Skeleton className="h-7 w-12 mx-auto" /> : stats.pending}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-extrabold text-orange-500 mt-1 block">{loading ? <Skeleton className="h-7 w-12 mx-auto" /> : stats.inProgress}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resolved Today</span>
            <span className="text-2xl font-extrabold text-green-600 mt-1 block">{loading ? <Skeleton className="h-7 w-12 mx-auto" /> : stats.resolvedToday}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-red-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">SLA Breached</span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">{loading ? <Skeleton className="h-7 w-12 mx-auto" /> : stats.breached}</span>
          </CardContent>
        </Card>
      </section>

      {/* Priority Queue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Priority Queue</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBreachedOnly((prev) => !prev)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded-none transition ${
                filterBreachedOnly
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-red-50"
              }`}
            >
              {filterBreachedOnly ? "Showing: Breached Only" : "Filter: Breached Only"}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/complaints")}
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              Full Queue
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : visibleQueue.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold border border-dashed">
            {filterBreachedOnly ? "No SLA-breached complaints found." : "All caught up! No active complaints."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleQueue.map((c, index) => {
              const slaLeft = getSLATimeLeft(c.sla.deadline)
              const isBreached = c.sla?.breached

              return (
                <div
                  key={c._id}
                  onClick={() => router.push(`/complaints/${c._id}`)}
                  className={`flex items-center gap-4 p-3 border cursor-pointer hover:shadow-sm transition ${
                    isBreached ? "bg-red-50/60 border-red-200" : "bg-white border-gray-200/60"
                  }`}
                >
                  {/* Queue rank */}
                  <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 text-center">{index + 1}</span>

                  {/* Priority indicator */}
                  <div className={`h-8 w-1 shrink-0 ${getPriorityColorIndicator(c.priority)}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{c.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">{getCategoryLabel(c.category)}</span>
                      <span className={`text-[10px] font-bold uppercase ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                    </div>
                  </div>

                  {/* SLA chip */}
                  <div className="shrink-0">
                    {isBreached ? (
                      <span className="text-[10px] font-extrabold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 uppercase tracking-wide">
                        BREACHED
                      </span>
                    ) : (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 ${
                        slaLeft.percentage > 80 ? "text-red-600 bg-red-50 border border-red-100" :
                        slaLeft.percentage > 60 ? "text-orange-600 bg-orange-50 border border-orange-100" :
                        "text-gray-500 bg-gray-100"
                      }`}>
                        {slaLeft.hours}h
                      </span>
                    )}
                  </div>

                  {/* Score + upvotes */}
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-bold text-primary">{c.priorityScore}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-0.5 justify-end">
                      <ThumbsUp className="size-2.5" />
                      {c.upvoteCount}
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-gray-300 shrink-0" />
                </div>
              )
            })}

            {remainingQueueCount > 0 && (
              <button
                onClick={() => setLimitCount((c) => c + 10)}
                className="w-full py-2.5 text-xs font-bold text-primary uppercase tracking-wider border border-dashed border-primary/40 hover:bg-primary/5 transition"
              >
                Show {remainingQueueCount} more
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
