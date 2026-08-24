"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import {
  User,
  Shield,
  Crown,
  HardHat,
  Users,
  CheckCircle2,
  Scale,
  Clock,
  ThumbsUp,
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  BadgeAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLE_CONFIGS = [
  {
    id: "citizen",
    label: "Citizen",
    icon: Users,
    desc: "Submit complaints, upvote local issues, track municipal SLAs & auto-draft RTI petitions.",
    color: "#D95D0F",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dashboardPath: "/citizen/dashboard",
  },
  {
    id: "authority",
    label: "Ward Authority",
    icon: Shield,
    desc: "Triage ward grievances, change complaint status, assign contractors, and upload proof of resolution.",
    color: "#10B981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dashboardPath: "/authority/dashboard",
  },
  {
    id: "contractor",
    label: "Field Contractor",
    icon: HardHat,
    desc: "View assigned work orders, update task progress, and submit photo verification upon fix.",
    color: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dashboardPath: "/contractor/dashboard",
  },
  {
    id: "admin",
    label: "Municipal Administrator",
    icon: Crown,
    desc: "City-wide analytics, Gemini AI civic digests, contractor audit scorecards, and ward configuration.",
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dashboardPath: "/admin/dashboard",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, role: currentRole, isLoaded, isSignedIn } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ totalComplaints: 0, totalUpvotes: 0, resolvedComplaints: 0 });
  const [activeRole, setActiveRole] = useState<string>(currentRole);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [meRes, complaintsRes] = await Promise.allSettled([
          usersApi.getMe(),
          usersApi.getMyComplaints(),
        ]);

        if (meRes.status === "fulfilled" && meRes.value.data?.user) {
          setProfileData(meRes.value.data.user);
          if (meRes.value.data.user.role) {
            setActiveRole(meRes.value.data.user.role);
          }
        }

        if (complaintsRes.status === "fulfilled") {
          const list = complaintsRes.value.data?.complaints || complaintsRes.value.data || [];
          const resolved = Array.isArray(list) ? list.filter((c: any) => c.status === "resolved").length : 0;
          setStats({
            totalComplaints: Array.isArray(list) ? list.length : 0,
            totalUpvotes: 0,
            resolvedComplaints: resolved,
          });
        }
      } catch {
        // use fallback user from Clerk
      } finally {
        setLoading(false);
      }
    }

    if (isSignedIn) {
      void loadProfile();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const handleRoleSwitch = async (newRole: string) => {
    if (newRole === activeRole) return;
    setUpdatingRole(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("nagarwatch_selected_role", newRole);
      }
      await usersApi.updateMyRole(newRole);
      setActiveRole(newRole);
      toast.success(`Active role switched to ${newRole.toUpperCase()}`);

      const target = ROLE_CONFIGS.find((r) => r.id === newRole)?.dashboardPath || "/dashboard";
      router.push(target);
    } catch {
      setActiveRole(newRole);
      if (typeof window !== "undefined") {
        localStorage.setItem("nagarwatch_selected_role", newRole);
      }
      toast.success(`Active role set to ${newRole.toUpperCase()}`);
      const target = ROLE_CONFIGS.find((r) => r.id === newRole)?.dashboardPath || "/dashboard";
      router.push(target);
    } finally {
      setUpdatingRole(false);
    }
  };

  const currentRoleConfig =
    ROLE_CONFIGS.find((r) => r.id === activeRole) || ROLE_CONFIGS[0];
  const CurrentIcon = currentRoleConfig.icon;

  const displayName =
    user?.fullName || profileData?.name || "NagarWatch User";
  const displayEmail =
    user?.primaryEmailAddress?.emailAddress || profileData?.email || "user@nagarwatch.in";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* 1. Header Profile Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-100/50 via-amber-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#8B2500] via-[#D95D0F] to-[#F97316] text-white text-2xl font-black shadow-lg shadow-orange-950/20">
              {displayName.charAt(0).toUpperCase()}
              <div
                className="absolute -bottom-1 -right-1 p-1 rounded-lg border-2 border-white shadow-xs"
                style={{ backgroundColor: currentRoleConfig.color }}
              >
                <CurrentIcon className="size-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {displayName}
                </h1>
                <Badge
                  className="text-[11px] font-bold uppercase tracking-wider text-white border-0"
                  style={{ backgroundColor: currentRoleConfig.color }}
                >
                  {currentRoleConfig.label}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{displayEmail}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {profileData?.clerkId || user?.id || "NAGARWATCH_USER"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
            <Link href={currentRoleConfig.dashboardPath} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#D95D0F] hover:bg-[#c2510b] text-white font-bold text-xs uppercase tracking-wider rounded-xl py-5 shadow-sm">
                Open {currentRoleConfig.label} Dashboard
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Interactive Role Switcher */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="size-5 text-[#D95D0F]" />
              Role &amp; Workspace Switcher
            </h2>
            <p className="text-xs text-slate-500">
              Select your active role. Switch anytime to test citizen reporting, ward authority triage, field contractor orders, or admin governance.
            </p>
          </div>
          {updatingRole && (
            <div className="flex items-center gap-1.5 text-xs text-[#D95D0F] font-bold">
              <Loader2 className="size-3.5 animate-spin" />
              Switching...
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {ROLE_CONFIGS.map((roleItem) => {
            const Icon = roleItem.icon;
            const isSelected = activeRole === roleItem.id;

            return (
              <button
                key={roleItem.id}
                type="button"
                disabled={updatingRole}
                onClick={() => handleRoleSwitch(roleItem.id)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-white shadow-md ring-2 ring-offset-2"
                    : "bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] border-stone-200/80"
                }`}
                style={{
                  borderColor: isSelected ? roleItem.color : undefined,
                  boxShadow: isSelected ? `0 4px 20px ${roleItem.color}25` : undefined,
                }}
              >
                {isSelected && (
                  <span
                    className="absolute top-3 right-3 flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black"
                    style={{ backgroundColor: roleItem.color }}
                  >
                    <CheckCircle2 className="size-3" />
                  </span>
                )}

                <div className="space-y-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-xl transition-transform"
                    style={{
                      backgroundColor: isSelected ? roleItem.color : "rgba(0,0,0,0.05)",
                      color: isSelected ? "#FFFFFF" : roleItem.color,
                    }}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{roleItem.label}</h3>
                    <p className="text-[11px] text-slate-500 leading-snug mt-1">{roleItem.desc}</p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-stone-100">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isSelected ? roleItem.color : "#94A3B8" }}
                  >
                    {isSelected ? "● Active Role" : "Click to Switch"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. My Stats & Quick RTI View */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stats 1 */}
        <Card className="border border-stone-200/90 rounded-3xl bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Grievances Reported
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#D95D0F]">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.totalComplaints}</p>
          <p className="text-[11px] text-slate-500">Tracked under municipal SLA</p>
        </Card>

        {/* Stats 2 */}
        <Card className="border border-stone-200/90 rounded-3xl bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Issues Resolved
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.resolvedComplaints}</p>
          <p className="text-[11px] text-slate-500">Verified with photo proof</p>
        </Card>

        {/* Stats 3: Universal RTI Generator Link */}
        <Card className="border border-purple-200 rounded-3xl bg-purple-50/40 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-800">
              <Scale className="size-4 text-purple-700" />
              <span>RTI Legal Generator</span>
            </div>
            <p className="text-xs text-purple-900/80 leading-snug">
              Auto-generate RTI Section 6(1) notices for overdue or breached civic complaints.
            </p>
          </div>

          <Link href="/citizen/rti" className="w-full">
            <Button
              size="sm"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              Open RTI Generator
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
