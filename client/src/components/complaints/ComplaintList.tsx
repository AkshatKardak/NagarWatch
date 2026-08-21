"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, AlertCircle, FileText, Loader2 } from "lucide-react";
import { ComplaintCard } from "./ComplaintCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Complaint } from "@/lib/types";

interface ComplaintListProps {
  complaints?: Complaint[];
  loading?: boolean;
  onUpvote?: (id: string) => void;
  showUpvote?: boolean;
  emptyMessage?: string;
}

const CATEGORIES = [
  "all",
  "pothole",
  "garbage",
  "water",
  "streetlight",
  "road",
  "drainage",
  "other",
];

const STATUSES = ["all", "pending", "in_progress", "resolved"];

export function ComplaintList({
  complaints = [],
  loading = false,
  onUpvote,
  showUpvote = true,
  emptyMessage = "No complaints found.",
}: ComplaintListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.location?.address || "").toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "all" ||
        c.category?.toLowerCase() === categoryFilter.toLowerCase();

      const matchStatus =
        statusFilter === "all" ||
        c.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchCategory && matchStatus;
    });
  }, [complaints, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints by title, address, issue..."
            className="pl-9 bg-white border-stone-200 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.filter((c) => c !== "all").map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaint Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <FileText className="size-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">{emptyMessage}</h3>
          <p className="text-xs text-slate-500">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filtered.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint as any}
              showUpvote={showUpvote}
              onUpvote={onUpvote}
              onClick={(id) => router.push(`/complaints/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ComplaintList;
