"use client";

import React, { useState } from "react";
import { useComplaints, useUpdateComplaintStatus } from "@/hooks/useComplaints";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { complaintsApi } from "@/lib/api";
import type { Complaint } from "@/lib/types";

export default function AuthorityComplaintsPage() {
  const { data: rawComplaints, isLoading } = useComplaints();
  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : [];

  const handleExportCSV = () => {
    window.open(complaintsApi.exportCSVUrl(), "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ward Grievances Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500">Filter, prioritize, assign contractors, and mark resolution milestones</p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="text-xs font-bold border-stone-300 self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1.5" />
          Export CSV Report
        </Button>
      </div>

      <ComplaintList
        complaints={complaints}
        loading={isLoading}
        emptyMessage="No complaints match current filters."
      />
    </div>
  );
}
