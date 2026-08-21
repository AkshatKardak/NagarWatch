"use client";

import React, { useMemo } from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { useAuth } from "@/hooks/useAuth";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Complaint } from "@/lib/types";

export default function CitizenComplaintsPage() {
  const { user, appUser } = useAuth();
  const { data: rawComplaints, isLoading } = useComplaints();
  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : [];

  const myComplaints = useMemo(() => {
    if (!user?.id) return complaints;
    return complaints.filter((c: any) => {
      const subId = typeof c.submittedBy === "object" ? c.submittedBy?._id || c.submittedBy?.clerkId : c.submittedBy;
      return subId === user.id || subId === appUser?._id;
    });
  }, [complaints, user?.id, appUser?._id]);

  const displayList = myComplaints.length > 0 ? myComplaints : complaints;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Filed Complaints</h1>
          <p className="text-xs sm:text-sm text-slate-500">Track resolution milestones, SLA countdowns, and authority responses</p>
        </div>

        <Link href="/citizen/submit">
          <Button className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider">
            <Plus className="size-3.5 mr-1.5" />
            Submit New Issue
          </Button>
        </Link>
      </div>

      <ComplaintList
        complaints={displayList}
        loading={isLoading}
        emptyMessage="You haven't filed any complaints yet."
      />
    </div>
  );
}
