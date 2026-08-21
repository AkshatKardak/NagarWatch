"use client";

import React, { useEffect, useState } from "react";
import { HardHat, Star, ShieldCheck, Phone, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { contractorsApi } from "@/lib/api";
import type { Contractor } from "@/lib/types";

export default function AdminContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractors = async () => {
      setLoading(true);
      try {
        const res = await contractorsApi.getAll();
        setContractors(res.data.contractors || res.data || []);
      } catch {
        setContractors([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchContractors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <HardHat className="size-6 text-[#D95D0F]" />
          Contractor Performance & SLA Audit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Supervise municipal contractors, track on-time completion rates, and verify licenses</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
        </div>
      ) : contractors.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No registered contractors found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractors.map((contractor) => (
            <Card key={contractor._id} className="border border-stone-200 bg-white rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-orange-50 text-[#D95D0F] border-orange-200 text-[10px] font-bold uppercase mb-1">
                    {contractor.department}
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{contractor.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">License: {contractor.licenseNumber}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-extrabold text-amber-900">{contractor.ratingAvg?.toFixed(1) || "4.5"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-stone-50 text-xs border border-stone-100">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Assigned</p>
                  <p className="text-sm font-extrabold text-slate-900">{contractor.totalAssigned}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Resolved</p>
                  <p className="text-sm font-extrabold text-emerald-600">{contractor.totalResolved}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Breaches</p>
                  <p className="text-sm font-extrabold text-red-600">{contractor.slaBreaches}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3 text-slate-400" />
                  <span>{contractor.contactPhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3 text-slate-400" />
                  <span>{contractor.contactEmail}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
