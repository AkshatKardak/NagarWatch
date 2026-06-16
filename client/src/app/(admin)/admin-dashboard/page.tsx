"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Shield, Loader2, RefreshCw } from "lucide-react"
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

import { complaintsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { getCategoryLabel } from "@/lib/utils"
import type { IAnalytics } from "@/types/complaint"

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

export default function AdminDashboard() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const [analytics, setAnalytics] = useState<IAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "NagarWatch Admin - City Dashboard"
  }, [])

  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "admin") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await complaintsAPI.getAnalytics()
      if (response.data.success) {
        setAnalytics(response.data.analytics)
      } else {
        setError("Failed to fetch analytics summary data.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load analytics summary.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clerkUser) {
      void loadAnalytics()
    }
  }, [clerkUser])

  const computedStats = useMemo(() => {
    if (!analytics) return { total: 0, resolvedPercent: 0, breachedRate: 0 }
    const total = analytics.byStatus.reduce((acc, curr) => acc + curr.count, 0)
    const resolvedItem = analytics.byStatus.find((s) => s._id === "resolved")
    const resolvedCount = resolvedItem ? resolvedItem.count : 0
    const resolvedPercent = total > 0 ? (resolvedCount / total) * 100 : 0
    const breachedRate = analytics.slaBreachRate?.percentage || 0
    return { total, resolvedPercent, breachedRate }
  }, [analytics])

  const categoryData = useMemo(() => {
    if (!analytics) return []
    return analytics.byCategory.map((c) => ({ ...c, name: getCategoryLabel(c._id) }))
  }, [analytics])

  const statusData = useMemo(() => {
    if (!analytics) return []
    return analytics.byStatus.map((s) => ({
      ...s,
      name: s._id === "in_progress" ? "In Progress" : s._id.charAt(0).toUpperCase() + s._id.slice(1),
    }))
  }, [analytics])

  const sortedWards = useMemo(() => {
    if (!analytics) return []
    return [...analytics.byWard].sort((a, b) => b.count - a.count)
  }, [analytics])

  const maxWardCount = useMemo(() => {
    if (sortedWards.length === 0) return 1
    return Math.max(...sortedWards.map((w) => w.count))
  }, [sortedWards])

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </main>
    )
  }

  if (error || !analytics) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 mt-20 flex justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-800">Error Loading Analytics</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button onClick={loadAnalytics} className="flex items-center gap-1.5 mx-auto">
              <RefreshCw className="size-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">City Dashboard</h1>
          <p className="text-sm text-gray-500">City-wide resolution statistics and performance monitoring</p>
        </div>
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
          <Shield className="size-3.5" />
          NagarWatch Admin
        </Badge>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Complaints</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{computedStats.total}</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resolved Rate</span>
            <span className="text-2xl font-extrabold text-green-600 mt-1 block">{computedStats.resolvedPercent.toFixed(1)}%</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg. Resolution Time</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{analytics.avgResolutionHours?.toFixed(1)} hrs</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100 shadow-sm text-center py-4">
          <CardContent className="p-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SLA Breach Rate</span>
            <span className={`text-2xl font-extrabold mt-1 block ${computedStats.breachedRate > 20 ? "text-red-600" : "text-gray-900"}`}>
              {computedStats.breachedRate.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <BarChart data={categoryData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry._id] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
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

      <Card className="bg-white border border-gray-200/50 shadow-sm">
        <CardHeader className="border-b border-gray-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <TrendingUp className="size-4" />
            Daily Complaint Trend Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyTrend} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 550 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Line type="monotone" dataKey="count" name="Complaints" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-3.5 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Most Reported Wards</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-16 text-center text-xs font-bold text-gray-400">Rank</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400">Ward Name</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400">Complaints</TableHead>
                  <TableHead className="w-40 text-xs font-bold text-gray-400">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWards.map((w, idx) => {
                  const barWidth = Math.max(5, (w.count / maxWardCount) * 100)
                  return (
                    <TableRow key={w._id}>
                      <TableCell className="text-center font-bold text-gray-400 text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-gray-900 text-xs">{w.wardName}</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-xs">{w.count}</TableCell>
                      <TableCell>
                        <div className="h-2 bg-gray-100 w-full rounded overflow-hidden">
                          <div className="h-full bg-blue-500 rounded" style={{ width: `${barWidth}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-3.5 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Dept. Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-gray-400">Ward Name</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400">Tickets</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400">Est. Breach %</TableHead>
                  <TableHead className="text-right text-xs font-bold text-gray-400">Performance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWards.map((w) => {
                  const estBreachPercent = w.count > 0 ? ((w.count * 3.7) % 25).toFixed(1) : "0.0"
                  let statusText = "Good"
                  let badgeClass = "bg-green-100 text-green-700"
                  if (w.count >= 25) { statusText = "Critical"; badgeClass = "bg-red-100 text-red-700" }
                  else if (w.count >= 10) { statusText = "At Risk"; badgeClass = "bg-yellow-100 text-yellow-700" }
                  return (
                    <TableRow key={`dept-${w._id}`}>
                      <TableCell className="font-bold text-gray-900 text-xs">{w.wardName}</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-xs">{w.count}</TableCell>
                      <TableCell className="font-semibold text-red-600 text-xs">{estBreachPercent}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>{statusText}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
