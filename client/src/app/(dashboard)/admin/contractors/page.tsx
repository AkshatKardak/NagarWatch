"use client";

import React, { useEffect, useState } from "react";
import {
  HardHat,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  FileText,
  UserCheck,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { contractorsApi, analyticsApi } from "@/lib/api";

export default function AdminContractorsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "queue" | "analytics" | "blacklist">("list");
  const [contractors, setContractors] = useState<any[]>([]);
  const [blacklistedList, setBlacklistedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [blacklistName, setBlacklistName] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [isSubmittingBlacklist, setIsSubmittingBlacklist] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRes, blackRes] = await Promise.all([
        contractorsApi.getAll(),
        contractorsApi.getBlacklist().catch(() => ({ data: { blacklist: [] } })),
      ]);

      if (allRes.data?.contractors) {
        setContractors(allRes.data.contractors);
      }
      if (blackRes.data?.blacklist) {
        setBlacklistedList(blackRes.data.blacklist);
      }
    } catch (err) {
      toast.error("Failed to load contractor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await contractorsApi.verify(id, {
        isVerified,
        verificationSource: "MANUAL_REVIEW",
      });
      toast.success(isVerified ? "Contractor approved and verified!" : "Contractor unverified");
      await loadData();
    } catch {
      toast.error("Failed to update contractor status");
    }
  };

  const handleAddBlacklist = async () => {
    if (!blacklistName.trim() || !blacklistReason.trim()) {
      toast.error("Please enter both contractor name and reason");
      return;
    }

    setIsSubmittingBlacklist(true);
    try {
      await contractorsApi.addToBlacklist({
        contractorName: blacklistName.trim(),
        reason: blacklistReason.trim(),
        source: "CPWD_DEBARRED",
      });
      toast.success(`Added ${blacklistName} to official blacklist`);
      setIsBlacklistModalOpen(false);
      setBlacklistName("");
      setBlacklistReason("");
      await loadData();
    } catch {
      toast.error("Failed to blacklist contractor");
    } finally {
      setIsSubmittingBlacklist(false);
    }
  };

  const filteredContractors = contractors.filter((c) => {
    const matchName = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === "verified") return matchName && c.verificationDetails?.isVerified;
    if (statusFilter === "pending") return matchName && !c.verificationDetails?.isVerified;
    if (statusFilter === "blacklisted") return matchName && c.blacklistStatus?.isBlacklisted;
    return matchName;
  });

  const pendingVerificationQueue = contractors.filter((c) => !c.verificationDetails?.isVerified);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <HardHat className="size-7 text-[#D95D0F]" />
            CPWD & Government Contractor Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central Public Works Department (CPWD) verified contractor registry, verification queues, and deterministic performance scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsBlacklistModalOpen(true)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold"
          >
            <ShieldAlert className="size-4 mr-1.5" />
            Add to Blacklist
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "list", label: "All Contractors", count: contractors.length },
          { id: "queue", label: "Verification Queue", count: pendingVerificationQueue.length },
          { id: "analytics", label: "Performance Scorecards" },
          { id: "blacklist", label: "Debarred Registry", count: blacklistedList.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-[#D95D0F] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: ALL CONTRACTORS LIST ── */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search contractor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500">Filter:</span>
              {["all", "verified", "pending"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize ${
                    statusFilter === status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500 text-[10px]">
                  <tr>
                    <th className="p-3">Contractor Name</th>
                    <th className="p-3">Class & Category</th>
                    <th className="p-3">State / Jurisdiction</th>
                    <th className="p-3">Government Verification</th>
                    <th className="p-3">Jobs Completed</th>
                    <th className="p-3">Performance Score</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContractors.map((c) => {
                    const isVerified = c.verificationDetails?.isVerified;
                    const score = c.performanceMetrics?.performanceScore || 80;

                    return (
                      <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{c.contactEmail}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800">{c.class || "Class I"}</span>
                          <span className="block text-[10px] text-slate-500">{c.category || "Buildings & Roads"}</span>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{c.state || "Maharashtra"}</td>
                        <td className="p-3">
                          {isVerified ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold gap-1">
                              <ShieldCheck className="size-3" /> CPWD Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px] font-bold">
                              Pending Review
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-slate-800 font-bold">
                          {c.performanceMetrics?.jobsCompleted || c.totalResolved || 0}
                        </td>
                        <td className="p-3 font-extrabold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              score >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : score >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {score} / 100
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVerify(c._id, !isVerified)}
                            className="text-xs font-semibold text-[#D95D0F]"
                          >
                            {isVerified ? "Revoke" : "Approve"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: VERIFICATION QUEUE ── */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Contractors who registered without pre-existing CPWD dataset auto-match require administrative document verification before work orders can be assigned.
          </p>

          {pendingVerificationQueue.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800">Verification Queue is Empty</h3>
              <p className="text-xs text-slate-500">All registered contractors are verified.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingVerificationQueue.map((c) => (
                <Card key={c._id} className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500">{c.contactEmail} · {c.contactPhone}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px] font-bold">
                      Awaiting Approval
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Category</span>
                      <span className="font-semibold text-slate-800">{c.category || "General Civil"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Class Grade</span>
                      <span className="font-semibold text-slate-800">{c.class || "Class I"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(c._id, false)}
                      className="text-xs font-bold text-red-600 border-red-200"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVerify(c._id, true)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve & Verify
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PERFORMANCE SCORECARDS ── */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contractors.slice(0, 6).map((c) => {
              const score = c.performanceMetrics?.performanceScore || 85;
              const onTime = c.performanceMetrics?.onTimeCompletions || 20;
              const completed = c.performanceMetrics?.jobsCompleted || 24;
              const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 95;

              return (
                <Card key={c._id} className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                      <p className="text-[11px] text-slate-500">{c.department} · {c.state || "Maharashtra"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">{score}</span>
                      <span className="text-[10px] text-slate-400 block font-bold">SCORE / 100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-50 rounded-lg text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">On-Time</span>
                      <span className="font-extrabold text-slate-800">{onTimeRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Breaches</span>
                      <span className="font-extrabold text-red-600">{c.performanceMetrics?.slaBreaches || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Avg Hours</span>
                      <span className="font-extrabold text-slate-800">{c.performanceMetrics?.averageResolutionHours || 24}h</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: DEBARRED REGISTRY ── */}
      {activeTab === "blacklist" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Official CPWD Debarred / Blacklisted contractor registry. Any new contractor registration matching these entities is automatically blocked.
          </p>

          <Card className="overflow-hidden border border-red-200 bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50 border-b border-red-100 font-bold uppercase text-red-800 text-[10px]">
                  <tr>
                    <th className="p-3">Debarred Entity Name</th>
                    <th className="p-3">Reason for Blacklisting</th>
                    <th className="p-3">Source Authority</th>
                    <th className="p-3">Blacklisted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blacklistedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-red-50/40 transition-colors">
                      <td className="p-3 font-bold text-red-700">{item.contractorName}</td>
                      <td className="p-3 text-slate-700">{item.reason}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.source || "CPWD_DEBARRED"}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(item.blacklistedAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Blacklist Addition Dialog */}
      <Dialog open={isBlacklistModalOpen} onOpenChange={setIsBlacklistModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="size-5 text-red-600" />
              Add Contractor to Blacklist
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Debar a contractor entity from registering or bidding for municipal work orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Contractor / Company Name *
              </label>
              <Input
                placeholder="e.g., Falcon Road Builders Pvt Ltd"
                value={blacklistName}
                onChange={(e) => setBlacklistName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Reason for Debarment *
              </label>
              <Input
                placeholder="e.g., Substandard road bituminous material and SLA failure"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBlacklistModalOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddBlacklist}
              disabled={isSubmittingBlacklist}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              {isSubmittingBlacklist ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Confirm Blacklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
