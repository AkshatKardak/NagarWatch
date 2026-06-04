"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, MapPin, ThumbsUp } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { SLATimer } from "@/components/complaints/SLATimer";
import { StatusTimeline } from "@/components/complaints/StatusTimeline";
import { useComplaintStore } from "@/store/complaintStore";
import { formatDateTime, getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/utils";

const CivicMap = dynamic(() => import("@/components/map/CivicMap"), { ssr: false });

export default function PublicComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const complaint = useComplaintStore((state) => state.selectedComplaint);
  const loading = useComplaintStore((state) => state.loading);
  const fetchComplaintById = useComplaintStore((state) => state.fetchComplaintById);
  const upvoteComplaint = useComplaintStore((state) => state.upvoteComplaint);

  useEffect(() => {
    if (params.id) void fetchComplaintById(params.id);
  }, [fetchComplaintById, params.id]);

  if (loading || !complaint) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-24">
          <div className="h-96 animate-pulse bg-white" />
        </main>
      </div>
    );
  }

  const center: [number, number] = [complaint.location.coordinates[1], complaint.location.coordinates[0]];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-24">
        <Button asChild variant="ghost">
          <Link href="/complaints"><ArrowLeft className="size-4" /> Back to Complaints</Link>
        </Button>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <h1 className="text-3xl font-bold">{complaint.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="border px-2 py-1 text-xs">{getCategoryLabel(complaint.category)}</span>
              <span className={`px-2 py-1 text-xs ${getStatusColor(complaint.status)}`}>{complaint.status.replace("_", " ")}</span>
              <span className={`border px-2 py-1 text-xs ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span>
            </div>
            {complaint.status === "resolved" && complaint.images.after ? (
              <div className="grid gap-4 md:grid-cols-2">
                <figure><img src={complaint.images.before} alt="Before" className="h-80 w-full object-cover" /><figcaption className="mt-1 text-sm">Before</figcaption></figure>
                <figure><img src={complaint.images.after} alt="After" className="h-80 w-full object-cover" /><figcaption className="mt-1 text-sm">After</figcaption></figure>
              </div>
            ) : (
              <img src={complaint.images.before} alt={complaint.title} className="h-96 w-full object-cover" />
            )}
            <div className="border bg-white p-5">
              <h2 className="font-semibold">Description</h2>
              <p className="mt-2 text-muted-foreground">{complaint.description}</p>
              <p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="size-4" /> {complaint.location.address}</p>
            </div>
            <CivicMap complaints={[complaint]} height="200px" center={center} zoom={15} />
          </section>
          <aside className="space-y-4">
            <div className="border bg-white p-5 text-center">
              <ThumbsUp className="mx-auto size-7 text-emerald-700" />
              <p className="mt-2 text-3xl font-bold">{complaint.upvoteCount}</p>
              <p className="text-sm text-muted-foreground">people reported this issue</p>
              {complaint.status !== "resolved" ? <Button className="mt-4 w-full" onClick={() => void upvoteComplaint(complaint._id)}>Upvote</Button> : null}
            </div>
            <div className="border bg-white p-5"><StatusTimeline statusHistory={complaint.statusHistory} currentStatus={complaint.status} /></div>
            <SLATimer sla={complaint.sla} category={complaint.category} />
            <div className="border bg-white p-5 text-sm">
              <p><strong>Submitted by:</strong> {complaint.submittedBy?.name}</p>
              <p><strong>Ward:</strong> {complaint.ward?.name || "Unassigned"}</p>
              <p><strong>Assigned to:</strong> {complaint.assignedTo?.name || "Pending"}</p>
              <p><strong>Submitted:</strong> {formatDateTime(complaint.createdAt)}</p>
              {complaint.resolvedAt ? <p><strong>Resolved:</strong> {formatDateTime(complaint.resolvedAt)}</p> : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
