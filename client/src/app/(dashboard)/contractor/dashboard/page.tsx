"use client";

import React, { useMemo } from "react";
import { HardHat, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useComplaints } from "@/hooks/useComplaints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import type { Complaint } from "@/lib/types";

export default function ContractorDashboardPage() {
  const { data: complaintsData, isLoading } = useComplaints();
  const complaints: Complaint[] = Array.isArray(complaintsData) ? complaintsData : [];

  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    complaints.forEach((c) => {
      if (c.status === "pending") pending++;
      else if (c.status === "in_progress") inProgress++;
      else if (c.status === "resolved") resolved++;
    });

    return { total: complaints.length, pending, inProgress, resolved };
  }, [complaints]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <HardHat className="size-6 text-[#D95D0F]" />
            Contractor Field Operations Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Assigned municipal maintenance work orders and resolution verification</p>
        </div>

        <Link href="/contractor/tasks">
          <Button className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider">
            View Field Work Orders
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tasks</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </Card>

        <Card className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.inProgress}</p>
        </Card>

        <Card className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.resolved}</p>
        </Card>
      </div>

      <Card className="border border-stone-200 bg-white rounded-3xl p-6 shadow-sm">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Recent Assigned Work Orders
        </CardTitle>

        <div className="divide-y divide-stone-100">
          {complaints.slice(0, 5).map((complaint) => (
            <div key={complaint._id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{complaint.title}</h4>
                <p className="text-xs text-slate-500">{complaint.location?.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={complaint.status} />
                <Link href={`/complaints/${complaint._id}`}>
                  <Button size="xs" variant="outline" className="text-xs font-bold">
                    View Task
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
