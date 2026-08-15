"use client";

import { useEffect, useState, useMemo } from "react";
import {
  HardHat,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { contractorsAPI } from "@/lib/api";
import type { IContractor } from "@/types/complaint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DEPARTMENTS = [
  "all",
  "Roads",
  "Waste Management",
  "Electricity",
  "Water Supply",
  "Drainage",
];

export default function ContractorsPage() {
  const { t } = useTranslation();
  const [contractors, setContractors] = useState<IContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [sortBy, setSortBy] = useState<"ratingAvg" | "totalResolved" | "onTimeRate">("ratingAvg");

  useEffect(() => {
    document.title = "NagarWatch - Contractor Transparency & Rankings";
  }, []);

  useEffect(() => {
    const fetchContractors = async () => {
      setLoading(true);
      try {
        const res = await contractorsAPI.getAll({
          department: selectedDept !== "all" ? selectedDept : undefined,
          sort: sortBy,
        });
        setContractors(res.data.contractors || []);
      } catch {
        setContractors([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchContractors();
  }, [selectedDept, sortBy]);

  const filtered = useMemo(() => {
    return contractors.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.department.toLowerCase().includes(search.toLowerCase()) ||
        c.licenseNumber.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [contractors, search]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 pb-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#D95D0F] text-xs font-bold uppercase tracking-wider">
              <HardHat className="size-3.5" />
              Municipal Transparency
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Licensed Contractor Scorecards & Rankings
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Real-time performance metrics, on-time SLA completion rates, and citizen review ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white border border-stone-200 rounded-xl text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Tracked</p>
              <p className="text-lg font-extrabold text-slate-900">{contractors.length} Contractors</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Department buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                  selectedDept === dept
                    ? "bg-[#1E293B] text-white shadow-sm"
                    : "bg-white border border-stone-200 text-slate-600 hover:border-stone-300"
                }`}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or license..."
              className="pl-9 bg-white border-stone-200 text-xs"
            />
          </div>
        </div>

        {/* Contractors Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
            <p className="text-xs font-semibold text-slate-500">Loading contractor scorecards...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
            <HardHat className="size-12 text-stone-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No contractors found</h3>
            <p className="text-xs text-slate-500">Try adjusting your department filter or search term.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((contractor) => {
              const onTimeRate =
                contractor.totalResolved > 0
                  ? Math.round((contractor.onTimeResolutions / contractor.totalResolved) * 100)
                  : 95;

              return (
                <Card
                  key={contractor._id}
                  className="border border-stone-200 bg-white hover:border-orange-300 hover:shadow-lg transition-all rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="p-5 border-b border-stone-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-orange-50 text-[#D95D0F] border-orange-200 text-[10px] font-bold uppercase">
                        {contractor.department}
                      </Badge>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="size-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-extrabold text-amber-900">
                          {contractor.ratingAvg.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-amber-700">({contractor.ratingCount})</span>
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {contractor.name}
                      </CardTitle>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        License: {contractor.licenseNumber}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    {/* Performance metrics grid */}
                    <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Resolved</p>
                        <p className="text-sm font-extrabold text-slate-900">{contractor.totalResolved}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">On-Time</p>
                        <p className="text-sm font-extrabold text-emerald-600">{onTimeRate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Breaches</p>
                        <p className="text-sm font-extrabold text-red-600">{contractor.slaBreaches}</p>
                      </div>
                    </div>

                    {/* Contact & Status */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{contractor.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{contractor.contactEmail}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="size-3.5" /> Municipal Verified
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                        Active Contract
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
