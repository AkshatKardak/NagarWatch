"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { MapPin, ThumbsUp, Frown, Loader2, AlertCircle, Sparkles } from "lucide-react"

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

// CivicMap is ALWAYS dynamic import with ssr:false
const DynamicMap = dynamic(() => import("@/components/map/CivicMap"), { ssr: false })

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function LiveIssuesMap() {
  const router = useRouter()
  // Call useSocket for real-time updates
  useSocket()

  const { complaints, loading, error, fetchComplaints, upvoteComplaint } = useComplaintStore()

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Fetch complaints on mount
  useEffect(() => {
    const load = async () => {
      try {
        await fetchComplaints()
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load issues")
      }
    }
    void load()
  }, [fetchComplaints])

  // Get active selected complaint from store
  const selectedComplaint = useMemo(() => {
    if (!selectedComplaintId) return null
    return complaints.find((c) => c._id === selectedComplaintId) || null
  }, [complaints, selectedComplaintId])

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      const matchCategory = categoryFilter === "all" || c.category === categoryFilter
      return matchStatus && matchCategory
    })
  }, [complaints, statusFilter, categoryFilter])

  // Stats computation
  const stats = useMemo(() => {
    let pending = 0
    let inProgress = 0
    let resolved = 0
    complaints.forEach((c) => {
      if (c.status === "pending") pending++
      else if (c.status === "in_progress") inProgress++
      else if (c.status === "resolved") resolved++
    })
    return { total: complaints.length, pending, inProgress, resolved }
  }, [complaints])

  const handleUpvote = async (id: string) => {
    if (isUpvoting) return
    setIsUpvoting(true)
    setLocalError(null)
    try {
      await upvoteComplaint(id)
    } catch (err) {
      setLocalError("Failed to register upvote. Try again.")
    } finally {
      setIsUpvoting(false)
    }
  }

  const handleSelectComplaint = (complaint: IComplaint) => {
    setSelectedComplaintId(complaint._id)
    setIsSheetOpen(true)
  }

  return (
    <main className="h-[calc(100vh-64px)] w-full flex overflow-hidden bg-gray-50 relative pt-16">
      {/* Toast Error Alert at Top */}
      {(error || localError) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4">
          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 shadow-lg border border-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1 truncate">{localError || error}</span>
            <button
              onClick={() => setLocalError(null)}
              className="text-white hover:text-red-100 font-bold ml-2 text-xs uppercase"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* LEFT PANEL */}
      <section className="w-80 flex-col border-r bg-white hidden md:flex h-full shrink-0">
        {/* Header section */}
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold flex items-center gap-1.5 text-gray-900">
            🗺️ Live Issues Map
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Total: {stats.total}
            </Badge>
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100">
              Pending: {stats.pending}
            </Badge>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">
              In Progress: {stats.inProgress}
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100">
              Resolved: {stats.resolved}
            </Badge>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 border-b space-y-3">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Status Filter
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["all", "pending", "in_progress", "resolved"] as const).map((status) => (
                <Button
                  key={status}
                  size="xs"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="w-full text-[10px] py-1 h-7"
                >
                  {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Category
            </span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-8 text-xs">
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
          </div>
        </div>

        {/* Complaints list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-3 space-y-2 bg-white">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground gap-3">
              <Frown className="size-10 text-gray-300" />
              <p className="text-sm font-medium">No issues found for selected filters</p>
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <Card
                key={c._id}
                className={`p-3 bg-white border cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all duration-200 ${
                  selectedComplaintId === c._id ? "border-primary ring-1 ring-primary/20" : ""
                }`}
                onClick={() => handleSelectComplaint(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate text-gray-900 flex-1">{c.title}</h3>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold shrink-0 uppercase tracking-wide border ${
                      c.status === "resolved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : c.status === "in_progress"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 border text-gray-600 bg-gray-50 font-medium">
                    {getCategoryLabel(c.category)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 truncate">
                  <MapPin className="size-3 text-gray-400 shrink-0" />
                  <span className="truncate">{c.location.address}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                    <ThumbsUp className="size-3 text-gray-400" />
                    {c.upvoteCount} upvotes
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Floating action button */}
        <div className="p-3 border-t bg-white">
          <Button
            onClick={() => router.push("/citizen/submit")}
            className="w-full rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 py-2.5 shadow-md"
          >
            <MapPin className="size-4" />
            Report Issue
          </Button>
        </div>
      </section>

      {/* RIGHT PANEL - MAP */}
      <section className="flex-1 relative h-full">
        {/* Floating Stats bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
          <Card className="bg-white/95 border border-gray-200/50 shadow-lg backdrop-blur-md py-2.5 px-4 text-center text-xs font-semibold text-gray-800 tracking-wide rounded-full">
            {stats.total} issues &middot; {stats.pending} pending &middot; {stats.resolved} resolved
          </Card>
        </div>

        {/* Civic Map Container */}
        <div className="h-full w-full">
          <DynamicMap
            complaints={filteredComplaints}
            height="100%"
            onMarkerClick={handleSelectComplaint}
            showControls={false}
          />
        </div>
      </section>

      {/* DETAILED DRAWERS */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedComplaint && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-extrabold pr-6 leading-tight text-gray-900">
                  {selectedComplaint.title}
                </SheetTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {getCategoryLabel(selectedComplaint.category)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`capitalize font-semibold ${
                      selectedComplaint.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : selectedComplaint.status === "in_progress"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedComplaint.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`capitalize font-semibold text-red-700 bg-red-50 border-red-100`}
                  >
                    {selectedComplaint.priority} Priority
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-4 pb-8">
                {/* Images Section */}
                <div className="space-y-2">
                  {selectedComplaint.status === "resolved" && selectedComplaint.images.after ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                          Before
                        </span>
                        <img
                          src={selectedComplaint.images.before}
                          alt="Before Resolution"
                          className="h-28 w-full object-cover rounded-md border"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-green-600 uppercase block mb-1">
                          After
                        </span>
                        <img
                          src={selectedComplaint.images.after}
                          alt="After Resolution"
                          className="h-28 w-full object-cover rounded-md border-2 border-green-500"
                        />
                      </div>
                    </div>
                  ) : selectedComplaint.images.before ? (
                    <img
                      src={selectedComplaint.images.before}
                      alt="Civic Issue Proof"
                      className="w-full max-h-48 object-cover rounded-md border"
                    />
                  ) : null}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Location
                  </h4>
                  <div className="flex items-start gap-1.5 text-sm text-gray-700">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{selectedComplaint.location.address}</span>
                  </div>
                </div>

                {/* SLA Timer */}
                {selectedComplaint.status !== "resolved" && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      SLA Status
                    </h4>
                    <SLATimer
                      sla={selectedComplaint.sla}
                      category={getCategoryLabel(selectedComplaint.category)}
                    />
                  </div>
                )}

                {/* Status Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Status History
                  </h4>
                  <div className="bg-white border border-gray-100 p-4 rounded-lg">
                    <StatusTimeline
                      statusHistory={selectedComplaint.statusHistory}
                      currentStatus={selectedComplaint.status}
                    />
                  </div>
                </div>

                {/* Upvote Card */}
                {selectedComplaint.status !== "resolved" && (
                  <Card className="p-4 border-emerald-100 bg-emerald-50/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full">
                        <ThumbsUp className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedComplaint.upvoteCount} upvotes
                        </p>
                        <p className="text-xs text-gray-500">reported by people in this area</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUpvote(selectedComplaint._id)}
                      disabled={isUpvoting}
                      variant="outline"
                      className="w-full bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                    >
                      {isUpvoting ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <ThumbsUp className="size-3 mr-1" />
                      )}
                      Upvote This Issue
                    </Button>
                  </Card>
                )}

                {/* View Details Redirect */}
                <Button
                  onClick={() => router.push(`/complaints/${selectedComplaint._id}`)}
                  className="w-full bg-primary text-white py-2.5 font-bold tracking-wide shadow"
                >
                  View Full Details
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}
