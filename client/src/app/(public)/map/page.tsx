"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { MapPin, ThumbsUp, Frown, Loader2, AlertCircle } from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { useSocket } from "@/hooks/useSocket"
import { complaintsAPI } from "@/lib/api"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusTimeline } from "@/components/complaints/StatusTimeline"
import { SLATimer } from "@/components/complaints/SLATimer"
import { timeAgo, getCategoryLabel } from "@/lib/utils"
import type { IComplaint } from "@/types/complaint"

const DynamicMap = dynamic(() => import("@/components/map/CivicMap"), { ssr: false })

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function LiveIssuesMap() {
  const router = useRouter()
  useSocket()

  const { complaints, loading, error, fetchComplaints, upvoteComplaint } = useComplaintStore()

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    void fetchComplaints().catch((err) =>
      setLocalError(err instanceof Error ? err.message : "Failed to load issues")
    )
  }, [fetchComplaints])

  const selectedComplaint = useMemo(
    () => complaints.find((c) => c._id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId]
  )

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((c) => {
        const matchStatus = statusFilter === "all" || c.status === statusFilter
        const matchCategory = categoryFilter === "all" || c.category === categoryFilter
        return matchStatus && matchCategory
      }),
    [complaints, statusFilter, categoryFilter]
  )

  const stats = useMemo(() => {
    let pending = 0, inProgress = 0, resolved = 0
    complaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else resolved++
    })
    return { total: complaints.length, pending, inProgress, resolved }
  }, [complaints])

  const handleUpvote = async (id: string) => {
    if (isUpvoting) return
    setIsUpvoting(true)
    try { await upvoteComplaint(id) }
    catch { setLocalError("Failed to register upvote. Try again.") }
    finally { setIsUpvoting(false) }
  }

  const handleSelectComplaint = (complaint: IComplaint) => {
    setSelectedComplaintId(complaint._id)
    setIsSheetOpen(true)
  }

  return (
    // pt-24 accounts for the h-24 Navbar
    <main className="flex h-[calc(100vh-96px)] w-full overflow-hidden mt-24" style={{ backgroundColor: "#F9F7F4" }}>

      {/* Error toast */}
      {(error || localError) && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4">
          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 shadow-lg text-sm font-medium rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1 truncate">{localError || error}</span>
            <button onClick={() => setLocalError(null)} className="font-bold ml-2 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* LEFT PANEL */}
      <section className="w-80 flex-col border-r bg-white hidden md:flex h-full shrink-0" style={{ borderColor: "#ECE7DE" }}>
        <div className="p-4 border-b" style={{ borderColor: "#ECE7DE" }}>
          <h1 className="text-lg font-bold flex items-center gap-1.5" style={{ color: "#1F2937" }}>
            🗺️ Live Issues Map
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Total: {stats.total}</Badge>
            <Badge variant="secondary" className="bg-red-50 text-red-700">Pending: {stats.pending}</Badge>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">In Progress: {stats.inProgress}</Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700">Resolved: {stats.resolved}</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: "#ECE7DE" }}>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Status Filter</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["all", "pending", "in_progress", "resolved"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="w-full text-[10px] h-7"
                  style={statusFilter === status ? { backgroundColor: "#D95D0F", borderColor: "#D95D0F" } : {}}
                >
                  {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Category</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Complaint list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundColor: "#F9F7F4" }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-3 space-y-2 bg-white">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <Frown className="size-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No issues found</p>
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <Card
                key={c._id}
                className={`p-3 bg-white border cursor-pointer hover:shadow-sm transition-all ${
                  selectedComplaintId === c._id ? "ring-2" : ""
                }`}
                style={selectedComplaintId === c._id ? { ringColor: "#D95D0F", borderColor: "#D95D0F" } : { borderColor: "#ECE7DE" }}
                onClick={() => handleSelectComplaint(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate flex-1" style={{ color: "#1F2937" }}>{c.title}</h3>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold shrink-0 rounded ${
                    c.status === "resolved" ? "bg-green-50 text-green-700" :
                    c.status === "in_progress" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                  }`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FFF3EB", color: "#D95D0F" }}>
                    {getCategoryLabel(c.category)}
                  </span>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5 truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{c.location.address}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: "#ECE7DE" }}>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <ThumbsUp className="size-3" /> {c.upvoteCount} upvotes
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Report button */}
        <div className="p-3 border-t bg-white" style={{ borderColor: "#ECE7DE" }}>
          <Button
            onClick={() => router.push("/submit")}
            className="w-full font-bold text-white"
            style={{ backgroundColor: "#D95D0F" }}
          >
            <MapPin className="size-4 mr-1.5" /> Report Issue
          </Button>
        </div>
      </section>

      {/* MAP */}
      <section className="flex-1 relative h-full">
        <DynamicMap
          complaints={filteredComplaints}
          height="100%"
          onMarkerClick={handleSelectComplaint}
          showControls
        />
      </section>

      {/* Side drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedComplaint && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-extrabold pr-6 leading-tight" style={{ color: "#1F2937" }}>
                  {selectedComplaint.title}
                </SheetTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline">{getCategoryLabel(selectedComplaint.category)}</Badge>
                  <Badge variant="secondary" className={`capitalize font-semibold ${
                    selectedComplaint.status === "resolved" ? "bg-green-100 text-green-800" :
                    selectedComplaint.status === "in_progress" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedComplaint.status.replace("_", " ")}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-5 mt-4 pb-8">
                {/* Images */}
                {selectedComplaint.status === "resolved" && selectedComplaint.images.after ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Before</span>
                      <img src={selectedComplaint.images.before} alt="Before" className="h-28 w-full object-cover rounded-lg border" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-green-600 uppercase block mb-1">After ✅</span>
                      <img src={selectedComplaint.images.after} alt="After" className="h-28 w-full object-cover rounded-lg border-2 border-green-500" />
                    </div>
                  </div>
                ) : selectedComplaint.images.before ? (
                  <img src={selectedComplaint.images.before} alt="Issue" className="w-full max-h-48 object-cover rounded-lg border" />
                ) : null}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border" style={{ borderColor: "#ECE7DE" }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</h4>
                  <div className="flex items-start gap-1.5 text-sm text-gray-700">
                    <MapPin className="size-4 shrink-0 mt-0.5" style={{ color: "#D95D0F" }} />
                    {selectedComplaint.location.address}
                  </div>
                </div>

                {/* SLA */}
                {selectedComplaint.status !== "resolved" && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SLA Status</h4>
                    <SLATimer sla={selectedComplaint.sla} category={getCategoryLabel(selectedComplaint.category)} />
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status History</h4>
                  <div className="bg-white border p-4 rounded-lg" style={{ borderColor: "#ECE7DE" }}>
                    <StatusTimeline statusHistory={selectedComplaint.statusHistory} currentStatus={selectedComplaint.status} />
                  </div>
                </div>

                {/* Upvote */}
                {selectedComplaint.status !== "resolved" && (
                  <Card className="p-4" style={{ borderColor: "#ECE7DE" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ backgroundColor: "#FFF3EB" }}>
                        <ThumbsUp className="size-4" style={{ color: "#D95D0F" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{selectedComplaint.upvoteCount} upvotes</p>
                        <p className="text-xs text-gray-500">from citizens in this area</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUpvote(selectedComplaint._id)}
                      disabled={isUpvoting}
                      variant="outline"
                      className="w-full font-semibold"
                      style={{ borderColor: "#D95D0F", color: "#D95D0F" }}
                    >
                      {isUpvoting ? <Loader2 className="size-3 animate-spin mr-1" /> : <ThumbsUp className="size-3 mr-1" />}
                      Upvote This Issue
                    </Button>
                  </Card>
                )}

                <Button
                  onClick={() => router.push(`/complaints/${selectedComplaint._id}`)}
                  className="w-full font-bold text-white"
                  style={{ backgroundColor: "#D95D0F" }}
                >
                  View Full Details →
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}
