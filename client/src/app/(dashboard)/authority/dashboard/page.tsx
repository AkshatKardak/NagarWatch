"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  MapPin,
  ChevronRight,
  HardHat,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints, useUpdateComplaintStatus } from "@/hooks/useComplaints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { timeAgo, getPriorityColor } from "@/lib/utils";
import type { Complaint } from "@/lib/types";

export default function AuthorityDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: complaintsData, isLoading } = useComplaints();
  const complaints: Complaint[] = Array.isArray(complaintsData) ? complaintsData : [];

  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let breached = 0;

    complaints.forEach((c) => {
      if (c.status === "pending") pending++;
      else if (c.status === "in_progress") inProgress++;
      else if (c.status === "resolved") resolved++;

      if (c.sla?.breached) breached++;
    });

    return {
      total: complaints.length,
      pending,
      inProgress,
      resolved,
      breached,
      resolutionRate: complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0,
    };
  }, [complaints]);

  const urgentComplaints = useMemo(() => {
    return complaints
      .filter((c) => c.status !== "resolved")
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      .slice(0, 6);
  }, [complaints]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="size-6 text-[#D95D0F]" />
            Ward Authority Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Real-time triage queue, SLA enforcement, and contractor dispatch</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/authority/complaints">
            <Button className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider">
              <ClipboardList className="size-3.5 mr-1.5" />
              Manage All Complaints
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-stone-200 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Triage</p>
              <p className="text-2xl font-extrabold text-amber-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-stone-200 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
              <p className="text-2xl font-extrabold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <HardHat className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-stone-200 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SLA Breaches</p>
              <p className="text-2xl font-extrabold text-red-600">{stats.breached}</p>
            </div>
            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-stone-200 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Resolution Rate</p>
              <p className="text-2xl font-extrabold text-emerald-600">{stats.resolutionRate}%</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Universal RTI & Legal Accountability Banner */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <Scale className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-purple-950">RTI Act 2005 Legal Generator</h3>
            <p className="text-xs text-purple-800/80">
              Citizens and authorities can auto-draft Section 6(1) Right to Information petitions for overdue complaints.
            </p>
          </div>
        </div>
        <Link href="/citizen/rti">
          <Button
            size="sm"
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shrink-0"
          >
            Open RTI Engine &rarr;
          </Button>
        </Link>
      </div>

      {/* Priority Triage Queue */}
      <Card className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-stone-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
            High Priority Unresolved Queue (Auto-Ranked by Score)
          </CardTitle>
          <Link href="/authority/complaints" className="text-xs font-bold text-[#D95D0F] hover:underline">
            View All Complaints &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : urgentComplaints.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No pending complaints in the queue.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {urgentComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  onClick={() => router.push(`/complaints/${complaint._id}`)}
                  className="flex items-center justify-between gap-4 py-3.5 hover:bg-stone-50 rounded-2xl px-3 cursor-pointer transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority} (Score: {complaint.priorityScore})
                      </span>
                      <StatusBadge status={complaint.status} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{complaint.title}</h3>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-[#D95D0F]" />
                      {complaint.location?.address}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
