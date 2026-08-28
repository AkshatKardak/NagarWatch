"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  ThumbsUp,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowLeft,
  Scale,
  Camera,
  HardHat,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { SLATimer } from "./SLATimer";
import { StatusTimeline } from "./StatusTimeline";
import { CitizenFeedbackModal } from "./CitizenFeedbackModal";
import { getCategoryLabel, getPriorityColor, timeAgo } from "@/lib/utils";
import type { Complaint } from "@/lib/types";

interface ComplaintDetailProps {
  complaint: Complaint;
  currentUserId?: string;
  userRole?: string;
  onUpvote?: (id: string) => void;
  onStatusChange?: (id: string, status: string, note?: string) => void;
  onResolve?: (id: string, formData: FormData) => void;
}

export function ComplaintDetail({
  complaint,
  currentUserId,
  userRole = "citizen",
  onUpvote,
  onStatusChange,
  onResolve,
}: ComplaintDetailProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveImage, setResolveImage] = useState<File | null>(null);

  const isAuthorityOrAdmin = userRole === "authority" || userRole === "admin";
  const hasUpvoted = currentUserId && complaint.upvotes?.includes(currentUserId);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveImage && onResolve) {
      const data = new FormData();
      data.append("resolutionNote", resolveNote);
      onResolve(complaint._id, data);
      return;
    }
    if (onResolve && resolveImage) {
      const data = new FormData();
      data.append("image", resolveImage);
      data.append("resolutionNote", resolveNote);
      onResolve(complaint._id, data);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-stone-300 text-xs uppercase font-bold">
                {getCategoryLabel(complaint.category)}
              </Badge>
              <Badge className={`text-xs uppercase font-bold ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority} Priority
              </Badge>
              <StatusBadge status={complaint.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              {complaint.title}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Reported {timeAgo(complaint.createdAt)}</span>
              {complaint.ward && (
                <>
                  <span>•</span>
                  <span>Ward: {typeof complaint.ward === "object" ? complaint.ward.name : complaint.ward}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onUpvote && (
              <Button
                variant={hasUpvoted ? "default" : "outline"}
                onClick={() => onUpvote(complaint._id)}
                className={`font-bold text-xs uppercase tracking-wider ${
                  hasUpvoted ? "bg-[#D95D0F] text-white" : "border-stone-300"
                }`}
              >
                <ThumbsUp className="size-3.5 mr-1.5" />
                {complaint.upvoteCount} Upvotes
              </Button>
            )}

            <Link href="/citizen/rti">
              <Button variant="outline" size="sm" className="text-xs font-bold border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                <Scale className="size-3.5 mr-1.5" />
                Generate RTI
              </Button>
            </Link>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {/* Location Box */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 grid sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-500 uppercase text-[10px]">Location Address</p>
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="size-4 text-[#D95D0F] shrink-0" />
              {complaint.location?.address}
            </p>
          </div>
          {complaint.location?.what3words && (
            <div className="space-y-1">
              <p className="font-bold text-slate-500 uppercase text-[10px]">3-Word Micro-Location</p>
              <p className="font-mono font-bold text-[#D95D0F]">{complaint.location.what3words}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Proof Photos & SLA */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Photo Evidence */}
        <Card className="border border-stone-200 bg-white rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="p-5 border-b border-stone-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Photographic Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Before Repair (Reported Photo)</p>
              <div className="h-56 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={complaint.images?.before || "https://placehold.co/600x400?text=No+Photo"}
                  alt="Before"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {complaint.images?.after && (
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-2">After Repair (Resolution Proof)</p>
                <div className="h-56 w-full rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200">
                  <img
                    src={complaint.images.after}
                    alt="After"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA & Status Timeline */}
        <div className="space-y-6">
          {complaint.sla && (
            <SLATimer
              sla={complaint.sla as any}
              category={complaint.category}
            />
          )}

          <StatusTimeline
            statusHistory={(complaint.statusHistory || []) as any}
            currentStatus={complaint.status as any}
          />
        </div>
      </div>

      {/* Authority / Admin Actions */}
      {isAuthorityOrAdmin && complaint.status !== "resolved" && (
        <Card className="border border-orange-200 bg-orange-50/40 rounded-3xl p-6 shadow-sm space-y-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#D95D0F]">
            Authority Action Panel
          </CardTitle>

          <div className="flex flex-wrap gap-3">
            {complaint.status === "pending" && onStatusChange && (
              <Button
                onClick={() => onStatusChange(complaint._id, "in_progress", "Work commenced on site")}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase"
              >
                Mark In Progress
              </Button>
            )}

            {onResolve && (
              <form onSubmit={handleResolveSubmit} className="w-full space-y-3 pt-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setResolveImage(e.target.files?.[0] || null)}
                    className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D95D0F] file:text-white"
                  />
                  <input
                    type="text"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Resolution notes / work details..."
                    className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase">
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Resolve & Upload Proof
                </Button>
              </form>
            )}
          </div>
        </Card>
      )}

      {/* Citizen Feedback Trigger if resolved */}
      {complaint.status === "resolved" && !complaint.citizenFeedback && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
          <h3 className="text-sm font-bold text-emerald-900">How was your resolution experience?</h3>
          <p className="text-xs text-emerald-700">Please provide feedback to rate the municipal contractor.</p>
          <Button
            onClick={() => setShowFeedbackModal(true)}
            className="bg-emerald-600 text-white font-bold text-xs uppercase"
          >
            Leave Feedback & Rating
          </Button>
        </div>
      )}

      {showFeedbackModal && (
        <CitizenFeedbackModal
          complaintId={complaint._id}
          complaintTitle={complaint.title}
          open={showFeedbackModal}
          onOpenChange={setShowFeedbackModal}
          onSuccess={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

export default ComplaintDetail;
