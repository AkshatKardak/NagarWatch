"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  HardHat,
  Crown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usersApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import type { UserRole } from "@/lib/types";

const ROLE_OPTIONS = [
  {
    id: "citizen" as UserRole,
    title: "Citizen",
    tagline: "Resident & Community Member",
    description: "Report civic issues, verify Before/After repairs, upvote local problems, and generate legal RTI petitions.",
    icon: Users,
    color: "#D95D0F",
    accentBg: "rgba(217, 93, 15, 0.08)",
    accentBorder: "rgba(217, 93, 15, 0.4)",
    badgeColor: "bg-orange-100 text-[#D95D0F] border-orange-200",
    dashboardPath: "/citizen/dashboard",
  },
  {
    id: "authority" as UserRole,
    title: "Municipal Authority",
    tagline: "Ward Officer & City Admin",
    description: "Triage complaints, assign work orders to CPWD contractors, monitor SLA countdowns, and upload proof.",
    icon: Shield,
    color: "#10B981",
    accentBg: "rgba(16, 185, 129, 0.08)",
    accentBorder: "rgba(16, 185, 129, 0.4)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dashboardPath: "/authority/dashboard",
  },
  {
    id: "contractor" as UserRole,
    title: "Government Contractor",
    tagline: "CPWD & Municipal Enlisted",
    description: "Accept field repair tasks, submit completion photos, and maintain high on-time reliability scorecards.",
    icon: HardHat,
    color: "#3B82F6",
    accentBg: "rgba(59, 130, 246, 0.08)",
    accentBorder: "rgba(59, 130, 246, 0.4)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    dashboardPath: "/contractor/dashboard",
  },
  {
    id: "admin" as UserRole,
    title: "Administrator",
    tagline: "Municipal Commissioner",
    description: "City-wide analytics, CPWD verification queue, explainable Ward Health scores, and weekly AI executive summaries.",
    icon: Crown,
    color: "#F59E0B",
    accentBg: "rgba(245, 158, 11, 0.08)",
    accentBorder: "rgba(245, 158, 11, 0.4)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    dashboardPath: "/admin/dashboard",
  },
];

interface OAuthRoleModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OAuthRoleModal({ forceOpen = false, onClose }: OAuthRoleModalProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const fetchMe = useUserStore((state) => state.fetchMe);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("citizen");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    const hasConfirmedInStorage =
      typeof window !== "undefined" &&
      localStorage.getItem("nagarwatch_role_confirmed") === "true";

    const hasConfirmedInMetadata = Boolean(
      (user.unsafeMetadata as any)?.roleConfirmed || (user.publicMetadata as any)?.role
    );

    // If neither is confirmed, this user just signed in with OAuth and needs to pick their role
    if (!hasConfirmedInStorage && !hasConfirmedInMetadata) {
      setIsOpen(true);
    }
  }, [isLoaded, isSignedIn, user, forceOpen]);

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);

    try {
      // 1. Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("nagarwatch_selected_role", selectedRole);
        localStorage.setItem("nagarwatch_role_confirmed", "true");
      }

      // 2. Sync to Backend MongoDB
      try {
        await usersApi.updateMyRole(selectedRole);
      } catch (err) {
        console.warn("Backend role update fallback:", err);
      }

      // 3. Sync to Clerk user unsafeMetadata
      try {
        if (user) {
          await user.update({
            unsafeMetadata: {
              ...(user.unsafeMetadata || {}),
              requestedRole: selectedRole,
              roleConfirmed: true,
            },
          });
        }
      } catch (err) {
        console.warn("Clerk metadata update fallback:", err);
      }

      // 4. Refresh user in Zustand store
      try {
        await fetchMe();
      } catch {}

      toast.success(
        `Role confirmed as ${
          ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title || selectedRole
        }!`
      );

      setIsOpen(false);
      if (onClose) onClose();

      // 5. Navigate to selected role dashboard
      const targetPath =
        ROLE_OPTIONS.find((r) => r.id === selectedRole)?.dashboardPath ||
        `/${selectedRole}/dashboard`;
      router.push(targetPath);
    } catch (error) {
      toast.error("Could not set role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-stone-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(217, 93, 15, 0.15)",
        }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="size-3.5" />
            <span>Google Access Granted</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Select Your Municipal Role
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
            Welcome to NagarWatch,{" "}
            <span className="text-white font-semibold">{user?.fullName || "Citizen"}</span>!
            Please choose how you will participate in the governance portal:
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`relative text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-white/10 shadow-lg"
                    : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
                }`}
                style={{
                  borderColor: isSelected ? role.accentBorder : "rgba(255, 255, 255, 0.08)",
                  boxShadow: isSelected ? `0 0 25px ${role.accentBg}` : "none",
                }}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <span
                    className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md animate-in zoom-in"
                    style={{ backgroundColor: role.color }}
                  >
                    <Check className="size-3 stroke-[3]" />
                  </span>
                )}

                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform"
                    style={{
                      backgroundColor: isSelected ? role.color : "rgba(255, 255, 255, 0.08)",
                      color: isSelected ? "#FFFFFF" : "#D6D3D1",
                    }}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-sm font-bold"
                        style={{ color: isSelected ? role.color : "#FFFFFF" }}
                      >
                        {role.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-400 block uppercase tracking-wider">
                      {role.tagline}
                    </span>
                    <p className="text-[11px] text-stone-300 leading-snug line-clamp-2 pt-0.5">
                      {role.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-stone-400 text-center sm:text-left">
            Role can be switched anytime from your Profile workspace.
          </p>

          <Button
            type="button"
            onClick={handleConfirmRole}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105"
            style={{
              backgroundColor:
                ROLE_OPTIONS.find((r) => r.id === selectedRole)?.color || "#D95D0F",
            }}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="size-4 mr-2" />
            )}
            Continue as {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OAuthRoleModal;
