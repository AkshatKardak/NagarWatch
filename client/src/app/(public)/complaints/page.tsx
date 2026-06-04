"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { useComplaintStore } from "@/store/complaintStore";
import type { ComplaintCategory, ComplaintStatus } from "@/types/complaint";
import { getCategoryLabel } from "@/lib/utils";

export default function ComplaintsFeedPage() {
  const router = useRouter();
  const complaints = useComplaintStore((state) => state.complaints);
  const loading = useComplaintStore((state) => state.loading);
  const page = useComplaintStore((state) => state.page);
  const totalPages = useComplaintStore((state) => state.totalPages);
  const total = useComplaintStore((state) => state.total);
  const fetchComplaints = useComplaintStore((state) => state.fetchComplaints);
  const upvoteComplaint = useComplaintStore((state) => state.upvoteComplaint);
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [category, setCategory] = useState<ComplaintCategory | "all">("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchComplaints({ page: 1, limit: 20 });
  }, [fetchComplaints]);

  const visible = useMemo(() => {
    const query = search.toLowerCase();
    return complaints
      .filter((complaint) => status === "all" || complaint.status === status)
      .filter((complaint) => category === "all" || complaint.category === category)
      .filter((complaint) => `${complaint.title} ${complaint.description}`.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === "upvotes") return b.upvoteCount - a.upvoteCount;
        if (sort === "critical") return b.priorityScore - a.priorityScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [category, complaints, search, sort, status]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-24">
        <h1 className="text-3xl font-bold">Civic Issues Feed</h1>
        <div className="mt-6 grid gap-3 border bg-white p-4 md:grid-cols-4">
          <select className="border px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as ComplaintStatus | "all")}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="border px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value as ComplaintCategory | "all")}>
            <option value="all">All categories</option>
            {(["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"] as ComplaintCategory[]).map((item) => (
              <option key={item} value={item}>{getCategoryLabel(item)}</option>
            ))}
          </select>
          <select className="border px-3 py-2" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="upvotes">Most Upvoted</option>
            <option value="critical">Critical First</option>
          </select>
          <label className="flex items-center gap-2 border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input className="min-w-0 flex-1 outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          </label>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Showing {visible.length} of {total || visible.length} complaints</p>
        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse bg-white" />)}
          </div>
        ) : visible.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                showUpvote
                onUpvote={(id) => void upvoteComplaint(id)}
                onClick={(id) => router.push(`/complaints/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 border bg-white p-10 text-center">
            <MapPin className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">No issues found. Be the first to report!</p>
          </div>
        )}
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => void fetchComplaints({ page: page - 1, limit: 20 })}>Previous</Button>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => void fetchComplaints({ page: page + 1, limit: 20 })}>Next</Button>
        </div>
      </main>
    </div>
  );
}
