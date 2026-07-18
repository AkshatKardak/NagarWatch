"use client"

import { SignIn } from "@clerk/nextjs"
import { Crown, Shield, Users, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function SignInPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 70%, #0f172a 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[420px]">

          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
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
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent) {
                    const icon = document.createElement("div")
                    icon.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>'
                    parent.appendChild(icon)
                  }
                }}
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">NagarWatch</h1>
            <p className="mt-1.5 text-sm font-medium text-blue-200/80">
              Civic Issue Reporting &amp; Governance Platform
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
            {/* Role legend — purely informational */}
            <div className="mb-6">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Platform Roles
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    icon: Users,
                    label: "Citizen",
                    desc: "Report & track",
                    color: "#3b82f6",
                    bg: "rgba(59,130,246,0.12)",
                    border: "rgba(59,130,246,0.25)",
                  },
                  {
                    icon: Shield,
                    label: "Authority",
                    desc: "Manage ward",
                    color: "#10b981",
                    bg: "rgba(16,185,129,0.12)",
                    border: "rgba(16,185,129,0.25)",
                  },
                  {
                    icon: Crown,
                    label: "Admin",
                    desc: "City oversight",
                    color: "#f59e0b",
                    bg: "rgba(245,158,11,0.12)",
                    border: "rgba(245,158,11,0.25)",
                  },
                ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: color }}
                    >
                      <Icon size={14} color="white" />
                    </div>
                    <span className="text-[11px] font-bold" style={{ color }}>
                      {label}
                    </span>
                    <span className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-white/30">
                Redirected to your role dashboard automatically after sign-in
              </p>
            </div>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Sign in</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Clerk widget
                preferredSignInStrategy="password" forces Clerk to render
                the email + password form immediately instead of the default
                email-link / OTP flow. Without this prop Clerk hides the
                password field behind "Use password instead". */}
            <div className="relative z-10">
              <SignIn
                preferredSignInStrategy="password"
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
                    formFieldInputShowPasswordButton: "!text-white/40 hover:!text-white/70",
                    formFieldInputShowPasswordIcon: "!text-white/40",
                    dividerLine: "!bg-white/10",
                    dividerText: "!text-white/30 !text-[10px]",
                    socialButtonsBlockButton:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white/70 hover:!bg-white/10 !text-xs !font-medium !transition-all",
                    socialButtonsBlockButtonText: "!text-white/70",
                    identityPreviewText: "!text-white/70",
                    identityPreviewEditButton: "!text-blue-400",
                    formResendCodeLink: "!text-blue-400",
                    otpCodeFieldInput:
                      "!bg-white/5 !border !border-white/15 !text-white !rounded-xl !text-lg focus:!border-blue-400/60",
                    alertText: "!text-red-300",
                    alert: "!bg-red-500/10 !border !border-red-400/20 !rounded-xl",
                  },
                }}
                afterSignInUrl="/"
                signUpUrl="/sign-up"
              />
            </div>
          </div>

          {/* Bottom link */}
          <p className="mt-5 text-center text-xs text-white/30">
            New to NagarWatch?{" "}
            <Link href="/sign-up" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Create an account <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
