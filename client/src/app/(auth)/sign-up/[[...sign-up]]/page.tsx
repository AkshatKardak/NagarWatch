"use client";

import { SignUp } from "@clerk/nextjs";
import { Crown, Info, Shield, Users, HardHat, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const ROLES = [
  {
    id: "citizen" as const,
    label: "Citizen",
    icon: Users,
    description: "Report & track issues",
    activeColor: "#D95D0F",
    activeBg: "rgba(217, 93, 15, 0.15)",
    activeBorder: "rgba(217, 93, 15, 0.6)",
  },
  {
    id: "authority" as const,
    label: "Authority",
    icon: Shield,
    description: "Ward officer triage",
    activeColor: "#10B981",
    activeBg: "rgba(16, 185, 129, 0.15)",
    activeBorder: "rgba(16, 185, 129, 0.6)",
  },
  {
    id: "contractor" as const,
    label: "Contractor",
    icon: HardHat,
    description: "Field work orders",
    activeColor: "#3B82F6",
    activeBg: "rgba(59, 130, 246, 0.15)",
    activeBorder: "rgba(59, 130, 246, 0.6)",
  },
  {
    id: "admin" as const,
    label: "Admin",
    icon: Crown,
    description: "City governance",
    activeColor: "#F59E0B",
    activeBg: "rgba(245, 158, 11, 0.15)",
    activeBorder: "rgba(245, 158, 11, 0.6)",
  },
];

type SelectableRoleId = "citizen" | "authority" | "contractor" | "admin";

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<SelectableRoleId>("citizen");
  const [fullName, setFullName] = useState("");
  const trimmedName = fullName.trim();

  const handleRoleSelect = (roleId: SelectableRoleId) => {
    setSelectedRole(roleId);
    if (typeof window !== "undefined") {
      localStorage.setItem("nagarwatch_selected_role", roleId);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0C0A09]">
      {/* Background Ambient Glow Orbs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, #D95D0F 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-[140px]"
        style={{ background: "radial-gradient(circle, #EA580C 0%, transparent 70%)" }}
      />

      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[480px] py-10">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="group mb-3 inline-block">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#8B2500] via-[#D95D0F] to-[#F97316] p-2.5 shadow-xl shadow-orange-950/50 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <Image
                src="/favicon.png"
                alt="NagarWatch"
                width={44}
                height={44}
                className="rounded-xl object-contain"
                priority
              />
            </div>
          </Link>

          <h1 className="text-3xl font-black tracking-tight text-white">
            NagarWatch
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-stone-400">
            Create your civic grievance account
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="rounded-3xl bg-stone-900/90 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
          {/* Step 1: Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block"
            >
              1. Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              autoComplete="name"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Step 2: Role selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block">
              2. Select Your Role *
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id as SelectableRoleId)}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center transition-all duration-200 focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: active ? role.activeBg : "rgba(255, 255, 255, 0.03)",
                      border: active ? `1.5px solid ${role.activeBorder}` : "1px solid rgba(255, 255, 255, 0.07)",
                      boxShadow: active ? `0 0 20px ${role.activeBg}` : "none",
                    }}
                  >
                    {active && (
                      <span
                        className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white"
                        style={{ backgroundColor: role.activeColor }}
                      >
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}

                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-xl transition-transform"
                      style={{
                        backgroundColor: active ? role.activeColor : "rgba(255, 255, 255, 0.06)",
                        color: active ? "#FFFFFF" : "#A8A29E",
                      }}
                    >
                      <Icon className="size-3.5" />
                    </div>

                    <span
                      className="text-[11px] font-bold"
                      style={{ color: active ? role.activeColor : "#D6D3D1" }}
                    >
                      {role.label}
                    </span>
                    <span className="text-[9px] leading-tight text-stone-400 line-clamp-1">
                      {role.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-xl p-2.5 bg-orange-950/30 border border-orange-500/20 text-orange-200 text-xs">
              <Info className="size-3.5 shrink-0 mt-0.5 text-orange-400" />
              <p className="text-[11px] leading-tight">
                Signing up as <strong className="capitalize text-white">{selectedRole}</strong>. You can also switch roles anytime in your profile.
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-center pt-1">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-stone-900 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              3. Account Credentials
            </span>
          </div>

          {/* Clerk Component Form */}
          <div className="w-full">
            <SignUp
              key={`${selectedRole}__${trimmedName}`}
              unsafeMetadata={{
                requestedRole: selectedRole,
                displayName: trimmedName || undefined,
              }}
              appearance={{
                variables: {
                  colorBackground: "transparent",
                  colorText: "#F5F5F4",
                  colorTextSecondary: "#A8A29E",
                  colorInputBackground: "rgba(255, 255, 255, 0.05)",
                  colorInputText: "#FFFFFF",
                  borderRadius: "14px",
                  colorPrimary: "#D95D0F",
                  colorDanger: "#EF4444",
                },
                elements: {
                  rootBox: "w-full",
                  card: "!shadow-none !border-0 !p-0 !bg-transparent !w-full !max-w-none",
                  header: "!hidden",
                  headerTitle: "!hidden",
                  headerSubtitle: "!hidden",
                  footer: "!hidden",
                  footerAction: "!hidden",
                  footerActionText: "!hidden",
                  footerActionLink: "!hidden",
                  form: "!gap-3.5 !p-0",
                  formContainer: "!gap-3.5",
                  formFieldRow: "!gap-1.5",
                  formFieldLabel: "!text-[11px] !font-bold !uppercase !tracking-wider !text-stone-300",
                  formFieldInput:
                    "!rounded-xl !border !border-white/15 !bg-white/5 !text-white !placeholder-stone-500 focus:!border-orange-500 focus:!ring-2 focus:!ring-orange-500/20 !text-sm !py-2.5 !px-3.5 !min-h-[44px] !transition-all",
                  formFieldInputShowPasswordButton: "!text-stone-400 hover:!text-white",
                  formButtonPrimary:
                    "!w-full !rounded-xl !py-3 !text-xs !font-extrabold !tracking-widest !uppercase !bg-gradient-to-r !from-[#D95D0F] !to-[#EA580C] hover:!opacity-95 !text-white !shadow-lg !shadow-orange-950/40 !transition-all hover:!scale-[1.01] active:!scale-[0.99]",
                  dividerLine: "!bg-white/10",
                  dividerText: "!text-stone-400 !text-[10px] !font-bold !uppercase !tracking-widest",
                  socialButtonsBlockButton:
                    "!rounded-xl !border !border-white/15 !bg-white/[0.06] hover:!bg-white/[0.12] !text-stone-100 !text-xs !font-bold !transition-all !min-h-[44px] !shadow-sm",
                  socialButtonsBlockButtonText: "!text-stone-100 !font-semibold !text-xs",
                  otpCodeFieldInput:
                    "!bg-white/5 !border !border-white/20 !text-white !rounded-xl !text-xl focus:!border-orange-400",
                  alertText: "!text-red-300 !text-xs",
                  alert: "!bg-red-950/40 !border !border-red-500/30 !rounded-xl !p-3",
                  pageScrollBox: "!p-0",
                  navbar: "!hidden",
                  navbarMobileMenuButton: "!hidden",
                  footerPages: "!hidden",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
              fallbackRedirectUrl="/dashboard"
              signInUrl="/sign-in"
            />
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-5 text-center text-xs text-stone-400 font-medium">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 ml-1"
          >
            Sign in <ArrowRight className="size-3" />
          </Link>
        </p>
      </div>
    </main>
  );
}
