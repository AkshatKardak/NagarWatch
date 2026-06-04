"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Download, Loader2, AlertTriangle, Eye } from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { getSLATimeLeft, getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/utils"
import type { ComplaintCategory, ComplaintStatus, ComplaintPriority, IComplaint } from "@/types/complaint"

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function AuthorityComplaintQueue() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const { complaints, total, totalPages, loading, error, fetchComplaints } = useComplaintStore()

  // Local filter states
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | ComplaintCategory>("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | ComplaintPriority>("all")
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "sla">("priority")
  const [currentPage, setCurrentPage] = useState(1)
  const [localError, setLocalError] = useState<string | null>(null)

  // SEO
  useEffect(() => {
    document.title = "NagarWatch - Complaint Queue"
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

  // 2. Fetch Complaints on Filter/Page Change
  useEffect(() => {
    if (clerkUser) {
      const loadQueue = async () => {
        setLocalError(null)
        try {
          await fetchComplaints({
            status: statusFilter !== "all" ? statusFilter : undefined,
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            page: currentPage,
            limit: 20,
          })
        } catch (err) {
          setLocalError("Failed to fetch complaints queue.")
        }
      }
      void loadQueue()
    }
  }, [clerkUser, statusFilter, categoryFilter, currentPage, fetchComplaints])

  // 3. Client Side Priority Filtering & Sorting
  const sortedComplaints = useMemo(() => {
    // A. Apply Priority Filter client-side on top of fetched items
    let filtered = [...complaints]
    if (priorityFilter !== "all") {
      filtered = filtered.filter((c) => c.priority === priorityFilter)
    }

    // B. Apply Sort
    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        return b.priorityScore - a.priorityScore
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === "sla") {
        const aDeadline = new Date(a.sla.deadline).getTime()
        const bDeadline = new Date(b.sla.deadline).getTime()
        return aDeadline - bDeadline // earliest deadline first
      }
      return 0
    })
  }, [complaints, priorityFilter, sortBy])

  // 4. Export CSV handler
  const handleExportCSV = () => {
    if (sortedComplaints.length === 0) return

    const headers = ["ID", "Title", "Category", "Status", "Priority", "Upvotes", "Address", "Created At"]
    const rows = sortedComplaints.map((c) => [
      c._id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.status,
      c.priority,
      c.upvoteCount,
      `"${c.location.address.replace(/"/g, '""')}"`,
      c.createdAt,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `complaints_export_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      {/* Alert display */}
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
      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Complaint Queue</h1>
          <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {total} Total
          </Badge>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="flex flex-wrap items-center gap-3 bg-white p-4 border border-gray-200/50 shadow-sm">
        {/* Status Select */}
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as any)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Select */}
        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val as any)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {getCategoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Select */}
        <Select
          value={priorityFilter}
          onValueChange={(val) => {
            setPriorityFilter(val as any)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="Sort Queue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">By Priority Score</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="sla">SLA Deadline</SelectItem>
          </SelectContent>
        </Select>

        {/* Export CSV Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={sortedComplaints.length === 0}
          className="ml-auto text-xs font-bold uppercase tracking-wider h-9 border-gray-300 hover:bg-gray-50 shrink-0"
        >
          <Download className="size-3.5 mr-1.5 text-gray-500" />
          Export CSV
        </Button>
      </section>

      {/* Main Queue Table */}
      <Card className="border border-gray-200/50 shadow-sm bg-white overflow-hidden">
        {loading ? (
          /* Table loading skeleton */
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedComplaints.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-semibold">
            No complaints found matching the criteria.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">#</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">Title</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">Priority</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</TableHead>
                <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider text-gray-400">👍</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">SLA</TableHead>
                <TableHead className="w-24 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedComplaints.map((c, index) => {
                const rowNum = (currentPage - 1) * 20 + index + 1
                const slaLeft = getSLATimeLeft(c.sla.deadline)
                const isBreached = c.sla?.breached
                const isCritical = c.priority === "critical"

                // Row backgrounds: breached -> red-50, critical -> bg-orange-50/30
                let rowBgClass = "bg-white hover:bg-gray-50"
                if (isBreached) {
                  rowBgClass = "bg-red-50/70 hover:bg-red-100/50"
                } else if (isCritical) {
                  rowBgClass = "bg-orange-50/30 hover:bg-orange-100/20"
                }

                return (
                  <TableRow key={c._id} className={rowBgClass}>
                    <TableCell className="text-center font-semibold text-gray-400 text-xs">{rowNum}</TableCell>
                    <TableCell className="font-semibold text-gray-900 text-sm max-w-xs truncate">
                      <button
                        onClick={() => router.push(`/authority/complaints/${c._id}`)}
                        className="hover:underline text-left block w-full truncate"
                      >
                        {c.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold border-gray-300 text-gray-600 bg-gray-50 uppercase">
                        {getCategoryLabel(c.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(c.priority)}`}>
                        {c.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-[10px] font-bold shrink-0 uppercase tracking-wider rounded-none ${getStatusColor(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-600 text-xs">{c.upvoteCount}</TableCell>
                    <TableCell>
                      {/* SLA Chip Logic */}
                      {c.status === "resolved" ? (
                        <span className="text-xs font-bold text-green-700">✓ Done</span>
                      ) : isBreached ? (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 uppercase tracking-wide">
                          BREACHED
                        </span>
                      ) : slaLeft.percentage > 80 ? (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5">
                          {slaLeft.hours}h
                        </span>
                      ) : slaLeft.percentage > 60 ? (
                        <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5">
                          {slaLeft.hours}h
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5">
                          {slaLeft.hours}h
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => router.push(`/authority/complaints/${c._id}`)}
                        className="text-[10px] font-bold uppercase tracking-wider border-gray-300 hover:bg-gray-100 h-7"
                      >
                        <Eye className="size-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="text-xs uppercase tracking-wider font-bold"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs uppercase tracking-wider font-bold"
          >
            Next
          </Button>
        </div>
      )}
    </main>
  )
}
