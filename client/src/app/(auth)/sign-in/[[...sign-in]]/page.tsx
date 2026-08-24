"use client";

import { SignIn } from "@clerk/nextjs";
import { Crown, Shield, Users, HardHat, ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("citizen");
  const [demoLoading, setDemoLoading] = useState(false);

  const roles = [
    {
      id: "citizen",
      icon: Users,
      label: "Citizen",
      desc: "Report & track issues",
      activeColor: "#D95D0F",
      activeBg: "rgba(217, 93, 15, 0.15)",
      activeBorder: "rgba(217, 93, 15, 0.6)",
    },
    {
      id: "authority",
      icon: Shield,
      label: "Authority",
      desc: "Ward triage & SLA",
      activeColor: "#10B981",
      activeBg: "rgba(16, 185, 129, 0.15)",
      activeBorder: "rgba(16, 185, 129, 0.6)",
    },
    {
      id: "contractor",
      icon: HardHat,
      label: "Contractor",
      desc: "Field work orders",
      activeColor: "#3B82F6",
      activeBg: "rgba(59, 130, 246, 0.15)",
      activeBorder: "rgba(59, 130, 246, 0.6)",
    },
    {
      id: "admin",
      icon: Crown,
      label: "Admin",
      desc: "City governance",
      activeColor: "#F59E0B",
      activeBg: "rgba(245, 158, 11, 0.15)",
      activeBorder: "rgba(245, 158, 11, 0.6)",
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    if (typeof window !== "undefined") {
      localStorage.setItem("nagarwatch_selected_role", roleId);
    }
  };

  const handleDemoAdminLogin = async () => {
    setDemoLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("nagarwatch_selected_role", "admin");
        localStorage.setItem("nagarwatch_demo_admin", "true");
      }
      await usersApi.demoAdmin();
      toast.success("Logged in as Municipal Commissioner (Admin Demo)");
      router.push("/admin/dashboard");
    } catch {
      if (typeof window !== "undefined") {
        localStorage.setItem("nagarwatch_selected_role", "admin");
      }
      toast.success("Switched to Admin workspace");
      router.push("/admin/dashboard");
    } finally {
      setDemoLoading(false);
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
            India&apos;s Civic Issue Reporting &amp; Governance Platform
          </p>
        </div>

        {/* ⚡ Quick Admin Demo Bypass Box */}
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-3.5 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Admin Demo Fast Bypass</span>
            </div>
            <p className="text-[10px] text-amber-300/80">
              No Clerk config needed: test municipal admin hub directly
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleDemoAdminLogin}
            disabled={demoLoading}
            className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-[11px] uppercase tracking-wider shrink-0 shadow-md"
          >
            {demoLoading ? <Loader2 className="size-3.5 animate-spin" /> : "1-Click Admin"}
          </Button>
        </div>

        {/* Main Glass Card */}
        <div className="rounded-3xl bg-stone-900/90 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 shadow-2xl shadow-black/80">
          {/* Role selector */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Signing In As
              </span>
              <span className="text-[10px] text-orange-400 font-semibold capitalize">
                Auto-routes to {selectedRole} dashboard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
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
                      {role.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center mb-5">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-stone-900 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Sign In Credentials
            </span>
          </div>

          {/* Clerk Component Form */}
          <div className="w-full">
            <SignIn
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
                  identityPreviewText: "!text-stone-200 !text-xs",
                  identityPreviewEditButton: "!text-orange-400 hover:!text-orange-300",
                  formResendCodeLink: "!text-orange-400 hover:!text-orange-300 !font-bold !text-xs",
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
              signUpUrl="/sign-up"
            />
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-5 text-center text-xs text-stone-400 font-medium">
          New to NagarWatch?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 ml-1"
          >
            Create an account <ArrowRight className="size-3" />
          </Link>
        </p>
      </div>
    </main>
  );
}
