"use client";

import React, { useState } from "react";
import { useComplaints, useUpdateComplaintStatus } from "@/hooks/useComplaints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Download,
  Filter,
  CheckCircle2,
  Clock,
  HardHat,
  MapPin,
  Loader2,
  Search,
  ArrowRight,
  Sparkles,
  Camera,
  X,
} from "lucide-react";
import { complaintsApi } from "@/lib/api";
import type { Complaint } from "@/lib/types";
import { getCategoryLabel, getPriorityColor, getStatusColor, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const CONTRACTORS = [
  { id: "65e2b0000000000000000001", name: "Apex Infrastructure Ltd." },
  { id: "65e2b0000000000000000002", name: "CleanCity Waste Management" },
  { id: "65e2b0000000000000000003", name: "Urja Power & Lighting Solutions" },
  { id: "65e2b0000000000000000004", name: "JalDhara Water Supply Works" },
  { id: "65e2b0000000000000000005", name: "Varun Water Pipelines" },
];

export default function AuthorityComplaintsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionImage, setResolutionImage] = useState<File | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const { data: rawComplaints, isLoading, refetch } = useComplaints();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateComplaintStatus();

  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : [];

  const filteredComplaints = complaints.filter((c) => {
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    if (selectedCategory !== "all" && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.location?.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus(
      { id, status: newStatus, note: `Status updated by ward authority to ${newStatus}` },
      {
        onSuccess: () => {
          toast.success(`Complaint status updated to ${newStatus.toUpperCase()}`);
          void refetch();
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      }
    );
  };

  const handleContractorAssign = async (id: string, contractorId: string) => {
    if (!contractorId) return;
    try {
      await complaintsApi.assignContractor(id, contractorId);
      toast.success("Contractor assigned successfully");
      void refetch();
    } catch {
      toast.error("Failed to assign contractor");
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    setIsResolving(true);

    try {
      const formData = new FormData();
      formData.append("resolutionNote", resolutionNote || "Work completed and verified on site.");
      if (resolutionImage) {
        formData.append("image", resolutionImage);
      }
      await complaintsApi.resolve(resolvingComplaint._id, formData);
      toast.success("Complaint resolved and proof submitted!");
      setResolvingComplaint(null);
      setResolutionNote("");
      setResolutionImage(null);
      void refetch();
    } catch {
      // Fallback: If image upload fails or backend requires multipart
      try {
        await complaintsApi.updateStatus(
          resolvingComplaint._id,
          "resolved",
          resolutionNote || "Resolved by Ward Authority"
        );
        toast.success("Complaint marked as resolved!");
        setResolvingComplaint(null);
        setResolutionNote("");
        setResolutionImage(null);
        void refetch();
      } catch {
        toast.error("Failed to mark complaint as resolved");
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleExportCSV = () => {
    window.open(complaintsApi.exportCSVUrl(), "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ward Triage &amp; Grievance Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming citizen reports, update status, assign contractors, and submit resolution proof.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="text-xs font-bold border-stone-300 self-start sm:self-auto rounded-xl shadow-xs"
        >
          <Download className="size-3.5 mr-1.5" />
          Export CSV Report
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grievances by keyword, street, or address..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:border-[#D95D0F] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-bold rounded-xl border border-stone-300 bg-white px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-bold rounded-xl border border-stone-300 bg-white px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="pothole">Potholes</option>
            <option value="garbage">Garbage Overflow</option>
            <option value="street_light">Street Lights</option>
            <option value="water_supply">Water Supply</option>
            <option value="drainage">Drainage &amp; Sewage</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
            <span className="text-xs font-semibold">Loading ward grievances...</span>
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-3">
          <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No Grievances Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All ward issues match the selected filters or there are no pending complaints.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredComplaints.map((c) => (
            <Card
              key={c._id}
              className="p-5 rounded-2xl border border-stone-200/90 bg-white shadow-xs hover:border-orange-300/80 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info Block */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-stone-300">
                      {getCategoryLabel(c.category)}
                    </Badge>
                    <Badge className={`text-[10px] uppercase font-bold ${getPriorityColor(c.priority)}`}>
                      {c.priority} Priority
                    </Badge>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                      {c.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium ml-1">
                      Reported {timeAgo(c.createdAt)}
                    </span>
                  </div>

                  <Link href={`/complaints/${c._id}`} className="block group">
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#D95D0F] transition-colors leading-snug">
                      {c.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#D95D0F] shrink-0" />
                    <span className="truncate">{c.location?.address}</span>
                  </p>
                </div>

                {/* Authority Quick Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 hidden xl:inline">
                      Status:
                    </span>
                    <select
                      value={c.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      className="text-xs font-bold rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-slate-800 focus:border-[#D95D0F] focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Contractor Assign Dropdown */}
                  <select
                    defaultValue={c.assignedContractor || ""}
                    onChange={(e) => handleContractorAssign(c._id, e.target.value)}
                    className="text-xs font-medium rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-slate-700 focus:border-[#D95D0F] focus:outline-none max-w-[170px] truncate"
                  >
                    <option value="">Assign Contractor</option>
                    {CONTRACTORS.map((cnt) => (
                      <option key={cnt.id} value={cnt.id}>
                        {cnt.name}
                      </option>
                    ))}
                  </select>

                  {/* Resolve / Proof Action */}
                  {c.status !== "resolved" && (
                    <Button
                      size="sm"
                      onClick={() => setResolvingComplaint(c)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl px-3.5 shadow-xs shrink-0"
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Resolve &amp; Proof
                    </Button>
                  )}

                  <Link href={`/complaints/${c._id}`}>
                    <Button variant="outline" size="sm" className="text-xs font-bold border-stone-300 rounded-xl">
                      Details
                      <ArrowRight className="size-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution & Photo Proof Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Resolve Complaint</h3>
                  <p className="text-xs text-slate-500">Submit on-site fix details and photo proof</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Complaint Title
                </label>
                <p className="text-xs text-slate-800 bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-200 font-semibold truncate">
                  {resolvingComplaint.title}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Resolution Notes / Work Performed *
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Pothole filled and sealed with hot-mix asphalt. Road cleared for traffic."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-stone-300 p-3 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  After-Repair Photo Proof (Optional)
                </label>
                <div className="border border-dashed border-stone-300 rounded-xl p-3 text-center bg-[#FAF8F5]/60">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setResolutionImage(e.target.files?.[0] || null)}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Upload on-site repaired photo</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolvingComplaint(null)}
                  className="text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResolving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm"
                >
                  {isResolving ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                  )}
                  Confirm Resolution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
