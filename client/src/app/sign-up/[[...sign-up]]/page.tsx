"use client"

import { SignUp } from "@clerk/nextjs"
import { Crown, Info, MapPin, Shield, Users, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const ROLES = [
  {
    id: "citizen" as const,
    label: "Citizen",
    icon: Users,
    description: "Report & track civic issues in your area",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    activeBg: "rgba(59,130,246,0.22)",
    border: "rgba(59,130,246,0.25)",
    activeBorder: "rgba(59,130,246,0.7)",
    glow: "rgba(59,130,246,0.35)",
  },
  {
    id: "authority" as const,
    label: "Authority",
    icon: Shield,
    description: "Manage & resolve ward complaints",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    activeBg: "rgba(16,185,129,0.22)",
    border: "rgba(16,185,129,0.25)",
    activeBorder: "rgba(16,185,129,0.7)",
    glow: "rgba(16,185,129,0.35)",
  },
]

type RoleId = (typeof ROLES)[number]["id"]

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<RoleId>("citizen")

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 70%, #0f172a 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-8">
        <div className="w-full max-w-[420px]">

          {/* Brand */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                boxShadow: "0 0 40px rgba(37,99,235,0.5)",
              }}
            >
              <Image
                src="/favicon.png"
                alt="NagarWatch"
                width={36}
                height={36}
                className="rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">NagarWatch</h1>
            <p className="mt-1.5 text-sm font-medium text-blue-200/80">
              Create your civic account
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* ── Step 1: Role Selector ── */}
            <div className="mb-5">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Step 1 — Choose your role
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const active = selectedRole === role.id
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className="relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all duration-200 focus:outline-none"
                      style={{
                        background: active ? role.activeBg : role.bg,
                        border: `2px solid ${active ? role.activeBorder : role.border}`,
                        boxShadow: active ? `0 0 20px ${role.glow}` : "none",
                        transform: active ? "scale(1.02)" : "scale(1)",
                        cursor: "pointer",
                        zIndex: 20,
                        pointerEvents: "auto",
                      }}
                    >
                      {active && (
                        <span
                          className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white"
                          style={{ background: role.color }}
                        >
                          ✓
                        </span>
                      )}
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: active ? role.color : "rgba(255,255,255,0.08)" }}
                      >
                        <Icon size={16} color={active ? "white" : "rgba(255,255,255,0.4)"} />
                      </div>
                      <div>
                        <div
                          className="text-sm font-bold"
                          style={{ color: active ? role.color : "rgba(255,255,255,0.7)" }}
                        >
                          {role.label}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {role.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Admin note */}
              <div
                className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <Crown size={12} color="#f59e0b" className="mt-0.5 shrink-0" />
                <p className="text-[9px] leading-relaxed" style={{ color: "rgba(245,158,11,0.8)" }}>
                  <strong>Admin</strong> accounts are provisioned by the system administrator — not available via sign-up.
                </p>
              </div>

              {selectedRole === "authority" && (
                <div
                  className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <Info size={12} color="#10b981" className="mt-0.5 shrink-0" />
                  <p className="text-[9px] leading-relaxed" style={{ color: "rgba(16,185,129,0.8)" }}>
                    Authority accounts require <strong>admin approval</strong> before ward access is activated.
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Step 2 — Create account</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Clerk widget */}
            <div className="relative" style={{ zIndex: 10 }}>
              <SignUp
                appearance={{
                  variables: {
                    colorBackground: "transparent",
                    colorText: "#f1f5f9",
                    colorTextSecondary: "rgba(241,245,249,0.55)",
                    colorInputBackground: "rgba(255,255,255,0.06)",
                    colorInputText: "#f1f5f9",
                    borderRadius: "12px",
                    colorPrimary: "#2563eb",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 !p-0 !bg-transparent !w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    header: "hidden",
                    footer: "!bg-transparent",
                    footerActionLink: "!text-blue-400 hover:!text-blue-300 font-semibold",
                    footerActionText: "!text-white/40",
                    formButtonPrimary:
                      "!w-full !rounded-xl !py-3 !text-xs !font-bold !tracking-widest !uppercase !transition-all hover:!opacity-90 !shadow-lg",
                    formFieldInput:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white !placeholder-white/20 focus:!border-blue-400/60 focus:!ring-0 !text-sm !py-2.5 !px-3",
                    formFieldLabel: "!text-[10px] !font-bold !uppercase !tracking-widest !text-white/50",
                    dividerLine: "!bg-white/10",
                    dividerText: "!text-white/30 !text-[10px]",
                    socialButtonsBlockButton:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white/70 hover:!bg-white/10 !text-xs !font-medium !transition-all",
                    socialButtonsBlockButtonText: "!text-white/70",
                    otpCodeFieldInput:
                      "!bg-white/5 !border !border-white/15 !text-white !rounded-xl !text-lg focus:!border-blue-400/60",
                    alertText: "!text-red-300",
                    alert: "!bg-red-500/10 !border !border-red-400/20 !rounded-xl",
                  },
                }}
                afterSignUpUrl="/"
                signInUrl="/sign-in"
                unsafeMetadata={{ requestedRole: selectedRole }}
              />
            </div>
          </div>

          {/* Bottom link */}
          <p className="mt-5 text-center text-xs text-white/30">
            <Link href="/sign-in" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="inline h-3 w-3" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
