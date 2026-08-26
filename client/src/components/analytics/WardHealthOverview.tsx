"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { analyticsApi } from "@/lib/api";

export interface WardHealthData {
  wardId: string;
  wardName: string;
  city: string;
  healthScore: number;
  resolutionRate: number;
  slaCompliance: number;
  averageResolutionHours: number;
  totalComplaints: number;
  pendingComplaints: number;
  criticalComplaints: number;
  reopenedComplaints: number;
  topCategories: { category: string; count: number }[];
  explanation: {
    positives: string[];
    needsAttention: string[];
  };
}

export function WardHealthOverview() {
  const [wards, setWards] = useState<WardHealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<WardHealthData | null>(null);

  useEffect(() => {
    async function loadHealthScores() {
      try {
        const res = await analyticsApi.getWardHealth();
        if (res.data?.wards) {
          setWards(res.data.wards);
        }
      } catch (err) {
        console.error("Failed to load ward health scores:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadHealthScores();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-[#D95D0F]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#D95D0F]" />
            Ward Governance Health Scores
          </h3>
          <p className="text-xs text-slate-500">
            Real-time civic operational health calculated from resolution speed, SLA compliance, and citizen verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wards.map((ward) => (
          <Card
            key={ward.wardId}
            onClick={() => setSelectedWard(ward)}
            className="p-4 border border-slate-200 hover:border-[#D95D0F] hover:shadow-md transition-all cursor-pointer bg-white rounded-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{ward.wardName}</h4>
                <p className="text-[11px] text-slate-500">{ward.city} · {ward.totalComplaints} complaints</p>
              </div>
              <div
                className={`px-2.5 py-1 rounded-lg border font-extrabold text-sm flex items-center gap-1 ${getScoreColor(
                  ward.healthScore
                )}`}
              >
                <span>{ward.healthScore}</span>
                <span className="text-[10px] opacity-70">/100</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>Civic Health Index</span>
                <span>{ward.healthScore}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(ward.healthScore)} transition-all duration-500`}
                  style={{ width: `${ward.healthScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Resolution</span>
                <span className="text-xs font-bold text-slate-800">{ward.resolutionRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">SLA On-Time</span>
                <span className="text-xs font-bold text-slate-800">{ward.slaCompliance}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Avg Speed</span>
                <span className="text-xs font-bold text-slate-800">{ward.averageResolutionHours}h</span>
              </div>
            </div>

            <div className="mt-3 pt-2 text-right">
              <span className="text-[11px] text-[#D95D0F] font-bold inline-flex items-center gap-1 hover:underline">
                Why this score? <ChevronRight className="size-3" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* "Why this score?" Diagnostic Modal */}
      <Dialog open={Boolean(selectedWard)} onOpenChange={() => setSelectedWard(null)}>
        {selectedWard && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {selectedWard.wardName} — Health Diagnostics
                </DialogTitle>
                <Badge
                  className={`text-sm font-extrabold px-3 py-1 ${getScoreColor(
                    selectedWard.healthScore
                  )}`}
                >
                  {selectedWard.healthScore} / 100
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Transparent civic health formula: Resolution Rate (30%), SLA Compliance (25%), Resolution Speed (15%), Backlog Ratio (15%), Reopening Ratio (10%), Critical Severity (5%).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Positive Factors */}
              <div>
                <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="size-4" /> Strong Performance Indicators
                </h5>
                <div className="space-y-1.5">
                  {selectedWard.explanation.positives.map((pos, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg text-xs font-medium"
                    >
                      ✓ {pos}
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs Attention Factors */}
              {selectedWard.explanation.needsAttention.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="size-4" /> Priority Areas for Attention
                  </h5>
                  <div className="space-y-1.5">
                    {selectedWard.explanation.needsAttention.map((att, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-amber-50 text-amber-900 border border-amber-100 rounded-lg text-xs font-medium"
                      >
                        ⚠️ {att}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Categories */}
              {selectedWard.topCategories.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">
                    Top Problem Categories Reported in this Ward:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedWard.topCategories.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs capitalize font-medium">
                        {c.category}: {c.count} complaints
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export default WardHealthOverview;
