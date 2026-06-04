"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, AlertCircle, RefreshCw } from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { complaintsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplaintCard } from "@/components/complaints/ComplaintCard"
import type { ComplaintCategory, ComplaintStatus } from "@/types/complaint"
import { getCategoryLabel } from "@/lib/utils"

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function PublicComplaintsFeed() {
  const router = useRouter()
  const {
    complaints,
    total,
    page,
    totalPages,
    loading,
    error,
    fetchComplaints,
    upvoteComplaint,
  } = useComplaintStore()

  // Filters State
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | ComplaintCategory>("all")
  const [sortBy, setSortBy] = useState<"newest" | "upvotes" | "critical">("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [localError, setLocalError] = useState<string | null>(null)

  // SEO titles and tags
  useEffect(() => {
    document.title = "NagarWatch - Civic Issues Feed"
  }, [])

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 on new search query
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Trigger search on filter changes or page changes
  useEffect(() => {
    const load = async () => {
      setLocalError(null)
      try {
        await fetchComplaints({
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          page: currentPage,
          limit: 12,
        })
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load issues")
      }
    }
    void load()
  }, [fetchComplaints, statusFilter, categoryFilter, currentPage])

  // Process complaints client-side with debounced search query and sort parameter
  const displayComplaints = useMemo(() => {
    // 1. Filter by Search Query
    let filtered = [...complaints]
    if (debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q)
      )
    }

    // 2. Sort by selected parameter
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === "upvotes") {
        return b.upvoteCount - a.upvoteCount
      }
      if (sortBy === "critical") {
        return b.priorityScore - a.priorityScore
      }
      return 0
    })
  }, [complaints, debouncedSearch, sortBy])

  const handleUpvote = async (id: string) => {
    try {
      await upvoteComplaint(id)
    } catch (err) {
      setLocalError("Failed to upvote. Try again.")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-16 pt-24">
      {/* Toast Error Alert at Top */}
      {(error || localError) && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4">
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

      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Civic Issues Feed
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            All reported issues across the city — upvote to prioritize
          </p>
        </header>

        {/* Filter Bar */}
        <div className="sticky top-16 bg-white/95 backdrop-blur z-20 py-4 px-4 border border-gray-200/50 shadow-sm mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            {/* Status Select */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as any)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-40 h-10 text-xs">
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
              <SelectTrigger className="w-44 h-10 text-xs">
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

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="w-44 h-10 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="upvotes">Most Upvoted</SelectItem>
                <SelectItem value="critical">Critical First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6 flex justify-between items-center text-sm text-gray-500">
          <span>
            Showing {displayComplaints.length} of {total} issues
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => fetchComplaints({ page: currentPage, limit: 12 })}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            <RefreshCw className={`size-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-white border p-6 space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : displayComplaints.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-dashed rounded-2xl max-w-lg mx-auto gap-4 mt-8">
            <div className="h-16 w-16 bg-gray-50 border border-gray-100 flex items-center justify-center rounded-full text-gray-400">
              <MapPin className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">No issues found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                Try adjusting your filters or be the first to report a new problem in your community.
              </p>
            </div>
            <Button onClick={() => router.push("/citizen/submit")} className="mt-2 font-semibold">
              Report an Issue
            </Button>
          </div>
        ) : (
          /* Complaints Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayComplaints.map((c) => (
              <ComplaintCard
                key={c._id}
                complaint={c}
                showUpvote={c.status !== "resolved"}
                onUpvote={handleUpvote}
                onClick={(id) => router.push(`/complaints/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 border-t pt-6">
            <Button
              variant="outline"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs uppercase tracking-wider font-bold"
            >
              &larr; Previous
            </Button>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs uppercase tracking-wider font-bold"
            >
              Next &rarr;
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
