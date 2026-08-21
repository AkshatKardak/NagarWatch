"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complaintsApi } from "@/lib/api";

export default function AuthorityAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await complaintsApi.getTemporalAnalytics(timeframe);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalytics();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="size-6 text-[#D95D0F]" />
            Municipal Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">SLA metrics, resolution turnaround, and ward category distribution</p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded-xl shadow-sm self-start sm:self-auto">
          {["7d", "30d", "90d", "1y"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                timeframe === tf ? "bg-[#D95D0F] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
        </div>
      ) : !data ? (
        <div className="py-12 text-center text-slate-400 text-sm">Failed to load analytics data.</div>
      ) : (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-stone-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Reported</p>
                <p className="text-2xl font-extrabold text-slate-900">{data.metrics?.totalComplaints || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-stone-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400">Resolved</p>
                <p className="text-2xl font-extrabold text-emerald-600">{data.metrics?.resolvedComplaints || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-stone-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400">Resolution Rate</p>
                <p className="text-2xl font-extrabold text-blue-600">{data.metrics?.resolutionRate || 0}%</p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-stone-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400">SLA Breach Rate</p>
                <p className="text-2xl font-extrabold text-red-600">{data.metrics?.breachRate || 0}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Issues by Category
              </CardTitle>
              <div className="space-y-3">
                {data.categoryBreakdown?.map((cat: any) => (
                  <div key={cat._id} className="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                    <span className="font-bold text-slate-800 capitalize">{cat._id}</span>
                    <span className="font-mono font-extrabold text-slate-900 bg-stone-100 px-2 py-0.5 rounded-md">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Issues by Status
              </CardTitle>
              <div className="space-y-3">
                {data.statusBreakdown?.map((st: any) => (
                  <div key={st._id} className="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                    <span className="font-bold text-slate-800 capitalize">{st._id.replace("_", " ")}</span>
                    <span className="font-mono font-extrabold text-slate-900 bg-stone-100 px-2 py-0.5 rounded-md">
                      {st.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
