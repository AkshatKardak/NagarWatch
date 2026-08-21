"use client";

import React from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import type { Complaint } from "@/lib/types";

export default function ContractorTasksPage() {
  const { data: rawComplaints, isLoading } = useComplaints();
  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Contractor Task Board</h1>
        <p className="text-xs sm:text-sm text-slate-500">Active municipal work orders, repair targets, and proof uploads</p>
      </div>

      <ComplaintList
        complaints={complaints}
        loading={isLoading}
        emptyMessage="No tasks assigned to your department."
      />
    </div>
  );
}
