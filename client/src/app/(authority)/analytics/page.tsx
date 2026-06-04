"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

import { useComplaintStore } from "@/store/complaintStore"
import { useUserStore } from "@/store/userStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategoryLabel } from "@/lib/utils"

const CATEGORY_COLORS: Record<string, string> = {
  pothole: "#ef4444",
  garbage: "#f97316",
  water: "#3b82f6",
  streetlight: "#eab308",
  road: "#8b5cf6",
  drainage: "#06b6d4",
  other: "#6b7280",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#ef4444",
  in_progress: "#f97316",
  resolved: "#22c55e",
}

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function AuthorityWardAnalytics() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const storeUser = useUserStore((state) => state.user)
  const fetchMe = useUserStore((state) => state.fetchMe)

  const { complaints, loading, fetchComplaints } = useComplaintStore()

  // SEO
  useEffect(() => {
    document.title = "NagarWatch - Ward Analytics"
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

  // 2. Fetch User and Complaints
  useEffect(() => {
    if (clerkUser) {
      void fetchMe()
      void fetchComplaints({ limit: 100 })
    }
  }, [clerkUser, fetchMe, fetchComplaints])

  // 3. Aggregate Data client-side from fetched complaints
  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    categories.forEach((cat) => {
      counts[cat] = 0
    })
    complaints.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1
    })
    return Object.entries(counts).map(([id, count]) => ({
      _id: id,
      count,
      name: getCategoryLabel(id),
    }))
  }, [complaints])

  const byStatus = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, resolved: 0 }
    complaints.forEach((c) => {
      if (c.status === "pending" || c.status === "in_progress" || c.status === "resolved") {
        counts[c.status]++
      }
    })
    return Object.entries(counts).map(([id, count]) => ({
      _id: id,
      count,
      name: id === "in_progress" ? "In Progress" : id.charAt(0).toUpperCase() + id.slice(1),
    }))
  }, [complaints])

  const avgResolutionHours = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === "resolved" && c.resolvedAt)
    if (resolved.length === 0) return 0
    const totalMs = resolved.reduce((acc, c) => {
      const start = new Date(c.createdAt).getTime()
      const end = new Date(c.resolvedAt!).getTime()
      return acc + (end - start)
    }, 0)
    return totalMs / resolved.length / 3600000
  }, [complaints])

  const slaBreachRate = useMemo(() => {
    if (complaints.length === 0) return 0
    const breached = complaints.filter((c) => c.sla?.breached).length
    return (breached / complaints.length) * 100
  }, [complaints])

  const last14Days = useMemo(() => {
    const dates: Record<string, number> = {}
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateString = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      dates[dateString] = 0
    }

    // Populate counts
    complaints.forEach((c) => {
      const dateString = new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      if (dates[dateString] !== undefined) {
        dates[dateString]++
      }
    })

    return Object.entries(dates).map(([date, count]) => ({
      date,
      count,
    }))
  }, [complaints])

  const stats = useMemo(() => {
    let pending = 0
    let inProgress = 0
    let resolved = 0
    complaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else if (c.status === "resolved") resolved++
    })
    return { pending, inProgress, resolved }
  }, [complaints])

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

  if (loading) {
    return (
      <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </main>
    )
  }

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      {/* Header section */}
      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ward Analytics</h1>
          <p className="text-sm text-gray-500">Real-time resolution metrics and categories charts</p>
        </div>
        <div className="flex items-center gap-2">
          {storeUser?.ward && (
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-semibold py-1.5 px-3 rounded-full">
              Ward: {storeUser.ward.name}
            </Badge>
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            Last 30 days
          </span>
        </div>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Issues</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{complaints.length}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending</span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">{stats.pending}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-extrabold text-orange-500 mt-1 block">{stats.inProgress}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resolved</span>
            <span className="text-2xl font-extrabold text-green-600 mt-1 block">{stats.resolved}</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg. Resolution</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{avgResolutionHours.toFixed(1)} hrs</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SLA Breach Rate</span>
            <span className={`text-2xl font-extrabold mt-1 block ${slaBreachRate > 20 ? "text-red-600" : "text-gray-900"}`}>
              {slaBreachRate.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complaints by Category */}
        <Card className="bg-white border border-gray-200/50 shadow-sm">
          <CardHeader className="border-b border-gray-100 py-3.5 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <BarChart3 className="size-4" />
              Complaints by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(val) => [val, "Complaints"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry._id] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issues by Status */}
        <Card className="bg-white border border-gray-200/50 shadow-sm">
          <CardHeader className="border-b border-gray-100 py-3.5 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <CheckCircle className="size-4" />
              Issues by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry._id] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 550 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Daily trend chart */}
      <Card className="bg-white border border-gray-200/50 shadow-sm">
        <CardHeader className="border-b border-gray-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <TrendingUp className="size-4" />
            Daily Complaint Trend (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last14Days} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="New Complaints"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
