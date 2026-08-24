"use client";

import React, { useEffect, useState } from "react";
import { Crown, BarChart3, Users, Map, HardHat, Sparkles, Loader2, ArrowRight, Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiApi, complaintsApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const generateSummary = async () => {
    setLoadingAI(true);
    try {
      const res = await aiApi.weeklySummary();
      if (res.data?.summary) {
        setSummary(res.data.summary);
        setStats(res.data.stats);
      }
    } catch {
      // fallback
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    void generateSummary();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Crown className="size-6 text-[#D95D0F]" />
            Municipal Commissioner Executive Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">City-wide governance oversight, AI executive summaries, and systemic performance</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={generateSummary}
            disabled={loadingAI}
            className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider"
          >
            {loadingAI ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Sparkles className="size-3.5 mr-1.5" />}
            Refresh AI Digest
          </Button>
        </div>
      </header>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/admin/users">
          <Card className="bg-white border border-stone-200 hover:border-orange-300 transition p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Authorities & Roles</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Users &rarr;</p>
              </div>
              <Users className="size-5 text-blue-600" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/wards">
          <Card className="bg-white border border-stone-200 hover:border-orange-300 transition p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Ward Zones</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Wards &rarr;</p>
              </div>
              <Map className="size-5 text-emerald-600" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/contractors">
          <Card className="bg-white border border-stone-200 hover:border-orange-300 transition p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contractors</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Scorecards &rarr;</p>
              </div>
              <HardHat className="size-5 text-amber-600" />
            </div>
          </Card>
        </Link>

        <Link href="/authority/analytics">
          <Card className="bg-white border border-stone-200 hover:border-orange-300 transition p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Analytics</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Trends &rarr;</p>
              </div>
              <BarChart3 className="size-5 text-purple-600" />
            </div>
          </Card>
        </Link>

        <Link href="/citizen/rti">
          <Card className="bg-purple-50/70 border border-purple-200 hover:border-purple-300 transition p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase">Legal Tool</p>
                <p className="text-sm font-bold text-purple-950 mt-1">RTI Engine &rarr;</p>
              </div>
              <Scale className="size-5 text-purple-700" />
            </div>
          </Card>
        </Link>
      </div>

      {/* AI Performance Digest */}
      <Card className="border border-stone-200 bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#D95D0F] flex items-center gap-2">
            <Sparkles className="size-4" />
            Gemini AI Weekly Civic Performance Briefing
          </CardTitle>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Generated for Municipal Leadership
          </span>
        </div>

        {loadingAI ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 className="size-8 animate-spin text-[#D95D0F] mx-auto" />
            <p className="text-xs font-semibold">Analyzing city-wide complaints, SLA deadlines, and resolution velocities...</p>
          </div>
        ) : summary ? (
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Click &ldquo;Refresh AI Digest&rdquo; to generate executive performance briefing.
          </div>
        )}
      </Card>
    </div>
  );
}
