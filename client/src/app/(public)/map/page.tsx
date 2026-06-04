"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { StatusTimeline } from "@/components/complaints/StatusTimeline";
import { SLATimer } from "@/components/complaints/SLATimer";
import { useComplaintStore } from "@/store/complaintStore";
import { useSocket } from "@/hooks/useSocket";
import type { ComplaintCategory, ComplaintStatus, IComplaint } from "@/types/complaint";
import { getCategoryLabel, getStatusColor } from "@/lib/utils";

const CivicMap = dynamic(() => import("@/components/map/CivicMap"), { ssr: false });

export default function PublicMapPage() {
  const { connected } = useSocket();
  const complaints = useComplaintStore((state) => state.complaints);
  const fetchComplaints = useComplaintStore((state) => state.fetchComplaints);
  const upvoteComplaint = useComplaintStore((state) => state.upvoteComplaint);
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [category, setCategory] = useState<ComplaintCategory | "all">("all");
  const [selected, setSelected] = useState<IComplaint | null>(null);

  useEffect(() => {
    void fetchComplaints();
  }, [fetchComplaints]);

  const filtered = useMemo(
    () =>
      complaints.filter(
        (complaint) =>
          (status === "all" || complaint.status === status) && (category === "all" || complaint.category === category)
      ),
    [category, complaints, status]
  );

  const pending = filtered.filter((complaint) => complaint.status === "pending").length;
  const resolved = filtered.filter((complaint) => complaint.status === "resolved").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex h-[calc(100vh-4rem)] pt-16">
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r bg-white p-4 lg:block">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-semibold">Civic Map</h1>
            <span className={connected ? "text-xs text-green-700" : "text-xs text-muted-foreground"}>
              {connected ? "Live" : "Offline"}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "pending", "in_progress", "resolved"] as const).map((item) => (
              <Button
                key={item}
                size="xs"
                variant={status === item ? "default" : "outline"}
                onClick={() => setStatus(item)}
              >
                {item.replace("_", " ")}
              </Button>
            ))}
          </div>
          <select
            className="mb-4 w-full border px-3 py-2 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value as ComplaintCategory | "all")}
          >
            <option value="all">All categories</option>
            {(["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"] as ComplaintCategory[]).map(
              (item) => (
                <option key={item} value={item}>
                  {getCategoryLabel(item)}
                </option>
              )
            )}
          </select>
          <p className="mb-3 text-sm text-muted-foreground">{filtered.length} issues found</p>
          <div className="space-y-3">
            {filtered.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} compact onClick={() => setSelected(complaint)} />
            ))}
          </div>
        </aside>
        <section className="relative min-w-0 flex-1">
          <div className="absolute left-4 top-4 z-[600] flex gap-2">
            <span className="bg-white px-3 py-2 text-xs shadow">Total {filtered.length}</span>
            <span className="bg-white px-3 py-2 text-xs shadow">Pending {pending}</span>
            <span className="bg-white px-3 py-2 text-xs shadow">Resolved {resolved}</span>
          </div>
          <CivicMap complaints={filtered} height="calc(100vh - 4rem)" showControls onMarkerClick={setSelected} />
          <Button asChild className="absolute bottom-6 right-6 z-[600]" size="lg">
            <Link href="/citizen/submit">
              <MapPin className="size-4" />
              Report Issue
            </Link>
          </Button>
        </section>
        {selected ? (
          <aside className="fixed right-0 top-16 z-[700] h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto border-l bg-white p-5 shadow-xl">
            <div className="mb-4 flex justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <div className="mt-2 flex gap-2">
                  <span className="border px-2 py-1 text-xs">{getCategoryLabel(selected.category)}</span>
                  <span className={`px-2 py-1 text-xs ${getStatusColor(selected.status)}`}>
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <img src={selected.images.before} alt={selected.title} className="mb-4 h-48 w-full object-cover" />
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <div className="mt-4">
              <StatusTimeline statusHistory={selected.statusHistory} currentStatus={selected.status} />
            </div>
            <div className="mt-4">
              <SLATimer sla={selected.sla} category={selected.category} />
            </div>
            {selected.status !== "resolved" ? (
              <Button className="mt-4 w-full" onClick={() => void upvoteComplaint(selected._id)}>
                Upvote
              </Button>
            ) : null}
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href={`/complaints/${selected._id}`}>View Full Details</Link>
            </Button>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
