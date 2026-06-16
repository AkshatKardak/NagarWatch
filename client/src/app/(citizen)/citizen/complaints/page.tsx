"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { MapPin, ImageOff, Plus, AlertCircle, Loader2 } from "lucide-react"

import { usersAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { timeAgo, getSLATimeLeft, getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/utils"
import type { IComplaint, ComplaintStatus } from "@/types/complaint"

export default function CitizenComplaintsHistory() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const [complaints, setComplaints] = useState<IComplaint[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => { document.title = "NagarWatch - My Complaints" }, [])

  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) { router.push("/sign-in"); return }
      const role = (clerkUser.publicMetadata?.role as string) || "citizen"
      if (role !== "citizen") router.push("/unauthorized")
    }
  }, [clerkUser, clerkLoaded, router])

  useEffect(() => {
    if (clerkUser) {
      const loadComplaints = async () => {
        setLoading(true)
        setLocalError(null)
        try {
          const res = await usersAPI.getMyComplaints({ page, limit: 10 })
          setComplaints(res.data.complaints || [])
          setTotal(res.data.total || 0)
        } catch (err) {
          setLocalError("Failed to fetch your complaints. Try again.")
        } finally {
          setLoading(false)
        }
      }
      void loadComplaints()
    }
  }, [clerkUser, page])

  const displayComplaints = useMemo(() => {
    if (statusFilter === "all") return complaints
    return complaints.filter((c) => c.status === statusFilter)
  }, [complaints, statusFilter])

  const totalPages = Math.ceil(total / 10) || 1

  const stats = useMemo(() => {
    let pending = 0, inProgress = 0, resolved = 0
    complaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else if (c.status === "resolved") resolved++
    })
    return { all: complaints.length, pending, in_progress: inProgress, resolved }
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

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      {localError && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow-md border border-red-700 text-sm font-medium rounded-md">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{localError}</span>
          <button onClick={() => setLocalError(null)} className="text-white hover:text-red-100 font-bold ml-2 text-xs uppercase">Dismiss</button>
        </div>
      )}

      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{total} Total</Badge>
        </div>
        <Button onClick={() => router.push("/citizen/submit")} size="sm" className="bg-primary text-white font-bold flex items-center gap-1.5">
          <Plus className="size-4" />
          Report New Issue
        </Button>
      </header>

      <section className="flex gap-2 flex-wrap items-center">
        {(["all", "pending", "in_progress", "resolved"] as const).map((status) => {
          const isActive = statusFilter === status
          return (
            <Button key={status} size="sm" variant={isActive ? "default" : "outline"} onClick={() => setStatusFilter(status)} className="text-xs uppercase tracking-wider font-semibold py-1.5 px-3.5 h-8 flex items-center gap-1.5">
              <span>{status === "all" ? "All" : status === "in_progress" ? "In Progress" : status}</span>
              <span className={`text-[10px] px-1 rounded-full font-bold ${isActive ? "bg-white text-primary" : "bg-gray-100 text-gray-600"}`}>
                {status === "all" ? stats.all : stats[status]}
              </span>
            </Button>
          )
        })}
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 w-full bg-white border p-6">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-16" /></div>
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : displayComplaints.length === 0 ? (
        <Card className="border border-dashed p-16 text-center max-w-md mx-auto bg-white">
          <CardContent className="space-y-4 pt-0">
            <div className="h-12 w-12 bg-gray-50 border flex items-center justify-center rounded-full mx-auto text-gray-400">
              <ImageOff className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">No complaints found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                {statusFilter === "all" ? "You haven't submitted any reports yet." : `You don't have any reports marked as ${statusFilter.replace("_", " ")}.`}
              </p>
            </div>
            <Button onClick={() => router.push("/citizen/submit")} size="sm" className="font-semibold">Report an Issue</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayComplaints.map((c) => {
            const slaLeft = getSLATimeLeft(c.sla.deadline)
            return (
              <Card key={c._id} className="hover:shadow-md transition bg-white border border-gray-200/60 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {c.images.before ? (
                    <img src={c.images.before} alt={c.title} className="w-20 h-20 object-cover rounded-lg shrink-0 border" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-50 border flex flex-col items-center justify-center rounded-lg text-gray-400 shrink-0">
                      <ImageOff className="size-5" />
                      <span className="text-[9px] font-bold mt-1 uppercase">No Proof</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <h3 onClick={() => router.push(`/complaints/${c._id}`)} className="font-bold text-sm text-gray-900 truncate hover:text-primary cursor-pointer flex-1 min-w-0">{c.title}</h3>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px] px-2 border-gray-300 text-gray-600 font-semibold uppercase">{getCategoryLabel(c.category)}</Badge>
                        <Badge variant="secondary" className={`text-[10px] px-2 font-semibold uppercase ${getPriorityColor(c.priority)} bg-white border`}>{c.priority}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <MapPin className="size-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{c.location.address}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold tracking-wide">Submitted {timeAgo(c.createdAt)}</div>
                    {c.status !== "resolved" && (
                      <div className="pt-1.5">
                        {slaLeft.isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 bg-red-100 text-red-700 border border-red-200">⚠ Overdue</span>
                        ) : slaLeft.percentage > 80 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">⏰ {slaLeft.hours}h left</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 bg-green-100 text-green-700 border border-green-200">✓ {slaLeft.hours}h left</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className={`px-2.5 py-0.5 text-xs font-bold shrink-0 uppercase tracking-wider ${getStatusColor(c.status)}`}>{c.status.replace("_", " ")}</span>
                    <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">{c.upvoteCount} upvotes</span>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/complaints/${c._id}`)} className="text-xs font-bold uppercase tracking-wider h-8 border-gray-300 hover:bg-gray-50 self-end">View Details</Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8 border-t pt-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-xs uppercase tracking-wider font-bold">Previous</Button>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="text-xs uppercase tracking-wider font-bold">Next</Button>
        </div>
      )}
    </main>
  )
}
