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

  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | ComplaintCategory>("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | ComplaintPriority>("all")
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "sla">("priority")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    document.title = "NagarWatch Authority - Complaint Queue"
  }, [])

  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) { router.push("/sign-in"); return }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "authority") router.push("/unauthorized")
    }
  }, [clerkUser, clerkLoaded, router])

  useEffect(() => {
    if (clerkUser) {
      fetchComplaints({
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        page,
        limit: PAGE_SIZE,
      })
    }
  }, [clerkUser, statusFilter, categoryFilter, page, fetchComplaints])

  const sortedComplaints = useMemo(() => {
    let result = [...complaints]
    if (priorityFilter !== "all") result = result.filter((c) => c.priority === priorityFilter)
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sortBy === "sla") result.sort((a, b) => new Date(a.sla.deadline).getTime() - new Date(b.sla.deadline).getTime())
    else result.sort((a, b) => b.priorityScore - a.priorityScore)
    return result
  }, [complaints, priorityFilter, sortBy])

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
      {error && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow border border-red-700 text-sm font-medium rounded-md">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
        </div>
      )}

      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Queue</h1>
          <p className="text-sm text-gray-500">{total} total complaints</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as any); setPage(1) }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Sort By" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority Score</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="sla">SLA Deadline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : sortedComplaints.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-dashed rounded-xl">
          <p className="font-semibold">No complaints match the current filters.</p>
        </div>
      ) : (
        <Card className="overflow-hidden border border-gray-200">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">Title</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">Category</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">Priority</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">Status</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">SLA</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase">Score</TableHead>
                <TableHead className="text-xs font-bold text-gray-400 uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedComplaints.map((c) => {
                const slaLeft = getSLATimeLeft(c.sla.deadline)
                return (
                  <TableRow key={c._id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => router.push(`/authority/complaints/${c._id}`)}>
                    <TableCell className="font-semibold text-sm text-gray-900 max-w-[220px] truncate">{c.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getCategoryLabel(c.category)}</Badge></TableCell>
                    <TableCell><span className={`text-xs font-bold uppercase ${getPriorityColor(c.priority)}`}>{c.priority}</span></TableCell>
                    <TableCell><span className={`text-xs font-semibold uppercase px-2 py-0.5 ${getStatusColor(c.status)}`}>{c.status.replace("_", " ")}</span></TableCell>
                    <TableCell>
                      {c.sla.breached ? (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-100 px-2 py-0.5 uppercase">BREACHED</span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 ${
                          slaLeft.percentage > 80 ? "text-red-600 bg-red-50" :
                          slaLeft.percentage > 60 ? "text-orange-600 bg-orange-50" :
                          "text-gray-500 bg-gray-100"
                        }`}>{slaLeft.hours}h</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-primary text-sm">{c.priorityScore}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/authority/complaints/${c._id}`) }}>
                        <Eye className="size-3 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-xs uppercase tracking-wider font-bold">Previous</Button>
          <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs uppercase tracking-wider font-bold">Next</Button>
        </div>
      )}
    </main>
  )
}
