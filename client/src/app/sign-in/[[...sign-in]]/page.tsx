"use client";

import { SignIn } from "@clerk/nextjs";
import { Crown, Shield, Users, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1A0A00 0%, #8B2500 28%, #D95D0F 62%, #2E6A42 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #D95D0F, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #2E6A42, transparent)" }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-5 sm:py-6">
        <div className="w-full max-w-[430px]">
          <div className="mb-4 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #8B2500, #D95D0F)",
                boxShadow: "0 0 28px rgba(217,93,15,0.35)",
              }}
            >
              <Image
                src="/favicon.png"
                alt="NagarWatch"
                width={30}
                height={30}
                className="rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            <h1 className="text-[30px] font-black tracking-tight text-white">
              NagarWatch
            </h1>
            <p
              className="mt-1 text-sm font-medium"
              style={{ color: "rgba(253,186,116,0.82)" }}
            >
              Civic Issue Reporting &amp; Governance Platform
            </p>
          </div>

          <div
            className="rounded-[24px] p-4 sm:p-4.5"
            style={{
              background: "rgba(0,0,0,0.22)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 22px 56px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="mb-4">
              <p
                className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(253,186,116,0.48)" }}
              >
                Platform Roles
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    icon: Users,
                    label: "Citizen",
                    desc: "Report & track",
                    color: "#D95D0F",
                    bg: "rgba(217,93,15,0.12)",
                    border: "rgba(217,93,15,0.22)",
                  },
                  {
                    icon: Shield,
                    label: "Authority",
                    desc: "Manage ward",
                    color: "#2E6A42",
                    bg: "rgba(46,106,66,0.12)",
                    border: "rgba(46,106,66,0.22)",
                  },
                  {
                    icon: Crown,
                    label: "Admin",
                    desc: "City oversight",
                    color: "#FDBA74",
                    bg: "rgba(253,186,116,0.10)",
                    border: "rgba(253,186,116,0.18)",
                  },
                ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                  <div
                    key={label}
                    className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-center"
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-xl"
                      style={{ background: color }}
                    >
                      <Icon size={13} color="white" />
                    </div>
                    <span className="text-[11px] font-bold" style={{ color }}>
                      {label}
                    </span>
                    <span
                      className="text-[9px] leading-tight"
                      style={{ color: "rgba(255,255,255,0.44)" }}
                    >
                      {desc}
                    </span>
                  </div>
                ))}
              </div>

              <p
                className="mt-2.5 text-center text-[10px]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Redirected to your role dashboard automatically after sign-in
              </p>
            </div>

            <div className="mb-3.5 flex items-center gap-3">
              <div
                className="h-px flex-1"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(253,186,116,0.34)" }}
              >
                Sign in
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>

            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <SignIn
                appearance={{
                  variables: {
                    colorBackground: "transparent",
                    colorText: "#F8F6F1",
                    colorTextSecondary: "rgba(248,246,241,0.56)",
                    colorInputBackground: "rgba(255,255,255,0.05)",
                    colorInputText: "#F8F6F1",
                    borderRadius: "12px",
                    colorPrimary: "#D95D0F",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 !p-0 !bg-transparent !w-full",
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    footer: "hidden",
                    footerAction: "hidden",
                    footerActionText: "hidden",
                    footerActionLink: "hidden",
                    form: "!gap-3 !px-3 !pb-3 !pt-1",
                    formContainer: "!gap-3",
                    formFieldRow: "!gap-2",
                    formFieldLabel:
                      "!text-[10px] !font-bold !uppercase !tracking-widest !text-white/50",
                    formFieldInput:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white !placeholder-white/20 focus:!border-orange-400/60 focus:!ring-0 !text-sm !py-2.5 !px-3 !min-h-[42px]",
                    formFieldInputShowPasswordButton:
                      "!text-white/40 hover:!text-white/70",
                    formFieldInputShowPasswordIcon: "!text-white/40",
                    formButtonPrimary:
                      "!w-full !rounded-xl !py-3 !text-xs !font-bold !tracking-widest !uppercase !transition-all hover:!opacity-90 !shadow-lg",
                    dividerLine: "!bg-white/10",
                    dividerText: "!text-white/30 !text-[10px]",
                    socialButtonsBlockButton:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white/75 hover:!bg-white/10 !text-xs !font-medium !transition-all !min-h-[42px]",
                    socialButtonsBlockButtonText: "!text-white/75",
                    identityPreviewText: "!text-white/70",
                    identityPreviewEditButton: "!text-orange-400",
                    formResendCodeLink: "!text-orange-400",
                    otpCodeFieldInput:
                      "!bg-white/5 !border !border-white/15 !text-white !rounded-xl !text-lg focus:!border-orange-400/60",
                    alertText: "!text-red-300",
                    alert:
                      "!bg-red-500/10 !border !border-red-400/20 !rounded-xl",
                    pageScrollBox: "!p-0",
                    navbar: "hidden",
                    navbarMobileMenuButton: "hidden",
                    footerPages: "hidden",
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    socialButtonsVariant: "blockButton",
                  },
                }}
                fallbackRedirectUrl="/"
                signUpUrl="/sign-up"
              />
            </div>
          </div>

          <p className="mt-3.5 text-center text-xs text-white/35">
            New to NagarWatch?{" "}
            <Link
              href="/sign-up"
              className="font-semibold transition-colors"
              style={{ color: "#FDBA74" }}
            >
              Create an account <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}