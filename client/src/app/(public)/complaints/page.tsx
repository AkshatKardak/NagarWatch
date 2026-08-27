"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  Clock,
  Sparkles,
  Filter,
  Plus,
  Flame,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  X,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { getCategoryLabel } from "@/lib/utils";
import type { ComplaintCategory, ComplaintStatus } from "@/types/complaint";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: "🌐" },
  { id: "pothole", label: "Pothole & Roads", icon: "🛣️" },
  { id: "garbage", label: "Garbage & Waste", icon: "🗑️" },
  { id: "water", label: "Water Leakage", icon: "💧" },
  { id: "streetlight", label: "Streetlight", icon: "💡" },
  { id: "road", label: "Road Damage", icon: "🚧" },
  { id: "drainage", label: "Drainage Overflow", icon: "🌊" },
  { id: "other", label: "Other Issues", icon: "📌" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All Status" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "awaiting_citizen_verification", label: "Awaiting Proof" },
  { id: "resolved", label: "Resolved" },
  { id: "reopened", label: "Reopened" },
];

export default function PublicComplaintsFeed() {
  const router = useRouter();
  const {
    complaints,
    total,
    page,
    totalPages,
    loading,
    error,
    fetchComplaints,
    upvoteComplaint,
  } = useComplaintStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "upvotes" | "critical">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NagarWatch — Live Civic Issues Feed";
  }, []);

  // Debounce search query (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch complaints on filter change
  useEffect(() => {
    const load = async () => {
      try {
        await fetchComplaints({
          status: statusFilter !== "all" ? (statusFilter as any) : undefined,
          category: categoryFilter !== "all" ? (categoryFilter as any) : undefined,
          page: currentPage,
          limit: 18,
        });
      } catch {}
    };
    void load();
  }, [fetchComplaints, statusFilter, categoryFilter, currentPage]);

  // Client-side filter & sort
  const displayComplaints = useMemo(() => {
    let filtered = [...complaints];
    if (debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.location?.address?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "upvotes") {
        return (b.upvoteCount || b.upvotes?.length || 0) - (a.upvoteCount || a.upvotes?.length || 0);
      }
      if (sortBy === "critical") {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }
      return 0;
    });
  }, [complaints, debouncedSearch, sortBy]);

  const handleUpvote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setUpvotingId(id);
    try {
      await upvoteComplaint(id);
    } catch {} finally {
      setUpvotingId(null);
    }
  };

  const stats = useMemo(() => {
    const totalCount = total || complaints.length;
    const inProgressCount = complaints.filter((c: any) => c.status === "in_progress").length;
    const resolvedCount = complaints.filter(
      (c: any) => c.status === "resolved" || c.status === "verified_resolved"
    ).length;
    const pendingCount = complaints.filter((c: any) => c.status === "pending").length;

    return { total: totalCount, inProgress: inProgressCount, resolved: resolvedCount, pending: pendingCount };
  }, [complaints, total]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] pb-20 pt-24 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* ── 1. PAGE HEADER & STATS BANNER ── */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest">
                <Flame className="size-3.5" />
                <span>Public Civic Issues Feed</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Live City Grievances &amp; Resolutions
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Browse verified complaints reported by citizens across all municipal wards. Upvote active issues to escalate SLA triage priority.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/citizen/submit">
                <Button className="bg-[#D95D0F] hover:bg-[#C24E07] text-white font-black text-xs uppercase tracking-wider px-5 py-5 rounded-xl shadow-lg transition-all hover:scale-105">
                  <Plus className="size-4 mr-1.5" />
                  Report New Issue
                </Button>
              </Link>
              <Link href="/map">
                <Button
                  variant="outline"
                  className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-5 rounded-xl transition-all"
                >
                  <MapPin className="size-4 mr-1.5 text-orange-400" />
                  View On Map
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800 text-center">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Grievances</p>
              <p className="text-xl font-black text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-bold text-amber-400">Active / Pending</p>
              <p className="text-xl font-black text-amber-400 mt-0.5">{stats.pending}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-bold text-blue-400">In Progress</p>
              <p className="text-xl font-black text-blue-400 mt-0.5">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-bold text-emerald-400">Verified Resolved</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.resolved}</p>
            </div>
          </div>
        </div>

        {/* ── 2. SEARCH & FILTER TOOLBAR ── */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search & Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search issues by title, description, or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 text-xs rounded-xl border-stone-200 bg-stone-50/70 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
                Sort:
              </span>
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                {[
                  { id: "newest", label: "Newest" },
                  { id: "upvotes", label: "Top Upvoted" },
                  { id: "critical", label: "Priority" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSortBy(st.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      sortBy === st.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row: Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-1">
              Status:
            </span>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setStatusFilter(filter.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-stone-100 text-slate-700 hover:bg-stone-200 border border-stone-200/60"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-stone-100 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryFilter(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-orange-100 text-[#D95D0F] border border-orange-300 font-bold"
                      : "bg-stone-50 text-slate-600 hover:bg-stone-100 border border-stone-200/50"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. RESULTS BAR & REFRESH ── */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold">
            Showing <strong className="text-slate-900">{displayComplaints.length}</strong> of{" "}
            <strong className="text-slate-900">{total || displayComplaints.length}</strong> civic grievances
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              fetchComplaints({
                status: statusFilter !== "all" ? (statusFilter as any) : undefined,
                category: categoryFilter !== "all" ? (categoryFilter as any) : undefined,
                page: currentPage,
                limit: 18,
              })
            }
            className="text-xs font-bold text-slate-600 hover:text-slate-900 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Feed
          </Button>
        </div>

        {/* ── 4. COMPLAINTS GRID ── */}
        {loading && displayComplaints.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-stone-100 rounded-2xl w-full" />
                <div className="h-4 bg-stone-200 rounded-md w-3/4" />
                <div className="h-3 bg-stone-100 rounded-md w-full" />
                <div className="h-3 bg-stone-100 rounded-md w-1/2" />
              </Card>
            ))}
          </div>
        ) : displayComplaints.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#D95D0F] flex items-center justify-center mx-auto">
              <MapPin className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Grievances Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No civic issues match your selected filters. Try clearing your search query or submit a new grievance.
              </p>
            </div>
            <Link href="/citizen/submit">
              <Button className="bg-[#D95D0F] hover:bg-[#C24E07] text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-xl">
                <Plus className="size-4 mr-1.5" />
                Submit New Grievance
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayComplaints.map((item: any) => {
              const beforeImage =
                item.images?.before ||
                item.images?.[0] ||
                item.imageUrl ||
                "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60";
              const upvoteCount = item.upvoteCount || item.upvotes?.length || 0;
              const hasResolutionProof = Boolean(
                item.resolutionProof?.afterImage || item.images?.after
              );

              return (
                <Card
                  key={item._id}
                  className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-orange-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header with floating tags */}
                    <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={beforeImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Top floating chips */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <Badge className="bg-white/90 text-slate-800 border-0 text-[10px] font-extrabold capitalize backdrop-blur-md shadow-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>

                        <StatusBadge status={item.status} />
                      </div>

                      {/* Bottom Image Proof Indicator */}
                      {hasResolutionProof && (
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs">
                            <ShieldCheck className="size-3" /> Proof Uploaded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 space-y-2.5">
                      <Link href={`/complaints/${item._id}`}>
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#D95D0F] transition-colors">
                          {item.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {item.description || "No description provided."}
                      </p>

                      {/* Location Tag */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                        <MapPin className="size-3.5 text-[#D95D0F] shrink-0" />
                        <span className="truncate text-[11px] font-medium">
                          {item.location?.address || "Location on Municipal Map"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-3 text-xs bg-stone-50/50">
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(e, item._id)}
                      disabled={upvotingId === item._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-[#D95D0F] font-bold text-xs transition-colors shadow-xs"
                    >
                      <ThumbsUp className="size-3.5" />
                      <span>{upvoteCount} Upvotes</span>
                    </button>

                    <Link href={`/complaints/${item._id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs font-bold text-[#D95D0F] hover:bg-orange-100/60 gap-1 p-0 h-auto"
                      >
                        Inspect Proof <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
