"use client";

import React, { useEffect, useState } from "react";
import { Map, Loader2, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { wardsApi } from "@/lib/api";
import type { Ward } from "@/lib/types";

export default function AuthorityWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWards = async () => {
      setLoading(true);
      try {
        const res = await wardsApi.getAll();
        setWards(res.data.wards || res.data || []);
      } catch {
        setWards([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchWards();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Map className="size-6 text-[#D95D0F]" />
          Ward Jurisdiction Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Municipal ward boundaries, assigned field engineers, and coverage status</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
        </div>
      ) : wards.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No active wards configured in your jurisdiction.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map((ward) => (
            <Card key={ward._id} className="border border-stone-200 bg-white rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{ward.name}</h3>
                  <p className="text-xs text-slate-500">{ward.city}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 text-emerald-700 bg-emerald-50">
                  Active
                </Badge>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-1 text-xs">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Assigned Officers</p>
                <div className="space-y-1">
                  {ward.assignedAuthorities && ward.assignedAuthorities.length > 0 ? (
                    ward.assignedAuthorities.map((auth: any) => (
                      <div key={auth._id || auth} className="flex items-center gap-1.5 text-slate-700">
                        <Users className="size-3 text-slate-400" />
                        <span>{auth.name || auth.email || "Officer"}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No direct officer assigned</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
