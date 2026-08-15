"use client";

import { SignUp } from "@clerk/nextjs";
import { Crown, Info, Lock, Shield, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const ROLES = [
  {
    id: "citizen" as const,
    label: "Citizen",
    icon: Users,
    description: "Report & track issues",
    color: "#D95D0F",
    bg: "rgba(217,93,15,0.12)",
    activeBg: "rgba(217,93,15,0.22)",
    border: "rgba(217,93,15,0.25)",
    activeBorder: "rgba(217,93,15,0.75)",
    glow: "rgba(217,93,15,0.28)",
    locked: false,
  },
  {
    id: "authority" as const,
    label: "Authority",
    icon: Shield,
    description: "Manage ward complaints",
    color: "#2E6A42",
    bg: "rgba(46,106,66,0.12)",
    activeBg: "rgba(46,106,66,0.22)",
    border: "rgba(46,106,66,0.25)",
    activeBorder: "rgba(46,106,66,0.75)",
    glow: "rgba(46,106,66,0.28)",
    locked: false,
  },
  {
    id: "admin" as const,
    label: "Admin",
    icon: Crown,
    description: "Provisioned only",
    color: "#FDBA74",
    bg: "rgba(253,186,116,0.07)",
    activeBg: "rgba(253,186,116,0.07)",
    border: "rgba(253,186,116,0.18)",
    activeBorder: "rgba(253,186,116,0.18)",
    glow: "rgba(253,186,116,0)",
    locked: true,
  },
];

type SelectableRoleId = "citizen" | "authority";

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] =
    useState<SelectableRoleId>("citizen");
  const [fullName, setFullName] = useState("");

  const trimmedName = fullName.trim();

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1A0A00 0%, #8B2500 28%, #D95D0F 62%, #2E6A42 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #D95D0F, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
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
              />
            </div>
            <h1 className="text-[30px] font-black tracking-tight text-white">
              NagarWatch
            </h1>
            <p
              className="mt-1 text-sm font-medium"
              style={{ color: "rgba(253,186,116,0.82)" }}
            >
              Create your civic account
            </p>
          </div>

          <div
            className="rounded-[24px] p-4"
            style={{
              background: "rgba(0,0,0,0.24)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 22px 56px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="mb-4">
              <p
                className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(253,186,116,0.48)" }}
              >
                Step 1 — Your name
              </p>

              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                className="w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 transition-all focus:outline-none"
                style={{
                  border: trimmedName
                    ? "1px solid rgba(217,93,15,0.6)"
                    : "1px solid rgba(255,255,255,0.10)",
                  boxShadow: trimmedName
                    ? "0 0 0 3px rgba(217,93,15,0.10)"
                    : "none",
                }}
              />
            </div>

            <div className="mb-4">
              <p
                className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(253,186,116,0.48)" }}
              >
                Step 2 — Choose your role
              </p>

              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const active = !role.locked && selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      disabled={role.locked}
                      onClick={() =>
                        !role.locked &&
                        setSelectedRole(role.id as SelectableRoleId)
                      }
                      title={
                        role.locked
                          ? "Admin accounts are provisioned by the system administrator"
                          : undefined
                      }
                      className="relative flex min-h-[96px] flex-col items-start gap-1.5 rounded-2xl p-2.5 text-left transition-all duration-200 focus:outline-none"
                      style={{
                        background: active ? role.activeBg : role.bg,
                        border: `2px solid ${
                          active ? role.activeBorder : role.border
                        }`,
                        boxShadow: active ? `0 0 16px ${role.glow}` : "none",
                        transform: active ? "scale(1.01)" : "scale(1)",
                        cursor: role.locked ? "not-allowed" : "pointer",
                        opacity: role.locked ? 0.45 : 1,
                      }}
                    >
                      {active && (
                        <span
                          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white"
                          style={{ background: role.color }}
                        >
                          ✓
                        </span>
                      )}

                      {role.locked && (
                        <span className="absolute right-2 top-2">
                          <Lock size={10} color="rgba(253,186,116,0.6)" />
                        </span>
                      )}

                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                          background: active
                            ? role.color
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Icon
                          size={13}
                          color={
                            active
                              ? "white"
                              : role.locked
                              ? "rgba(253,186,116,0.5)"
                              : "rgba(255,255,255,0.4)"
                          }
                        />
                      </div>

                      <div>
                        <div
                          className="text-[11px] font-bold"
                          style={{
                            color: active
                              ? role.color
                              : role.locked
                              ? "rgba(253,186,116,0.6)"
                              : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {role.label}
                        </div>
                        <div
                          className="mt-0.5 text-[9px] leading-tight"
                          style={{ color: "rgba(255,255,255,0.30)" }}
                        >
                          {role.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRole === "authority" && (
                <div
                  className="mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(46,106,66,0.10)",
                    border: "1px solid rgba(46,106,66,0.25)",
                  }}
                >
                  <Info size={12} color="#2E6A42" className="mt-0.5 shrink-0" />
                  <p
                    className="text-[9px] leading-relaxed"
                    style={{ color: "rgba(46,106,66,0.92)" }}
                  >
                    Authority accounts require admin approval before ward access
                    is activated.
                  </p>
                </div>
              )}
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
                Step 3 — Create account
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>

            <div className="overflow-hidden rounded-2xl">
              <SignUp
                key={`${selectedRole}__${trimmedName}`}
                unsafeMetadata={{
                  requestedRole: selectedRole,
                  displayName: trimmedName || undefined,
                }}
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
                    form: "!gap-3 !px-3 !pb-3 !pt-1",
                    formContainer: "!gap-3",
                    footer: "!bg-transparent !px-3 !pb-2 !pt-0",
                    footerActionText: "!text-white/35",
                    footerActionLink:
                      "!text-orange-400 hover:!text-orange-300 !font-semibold",
                    formButtonPrimary:
                      "!w-full !rounded-xl !py-3 !text-xs !font-bold !tracking-widest !uppercase !transition-all hover:!opacity-90 !shadow-lg",
                    formFieldRow: "!gap-2",
                    formFieldInput:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white !placeholder-white/20 focus:!border-orange-400/60 focus:!ring-0 !text-sm !py-2.5 !px-3 !min-h-[42px]",
                    formFieldLabel:
                      "!text-[10px] !font-bold !uppercase !tracking-widest !text-white/50",
                    formFieldInputShowPasswordButton:
                      "!text-white/40 hover:!text-white/70",
                    formFieldInputShowPasswordIcon: "!text-white/40",
                    dividerLine: "!bg-white/10",
                    dividerText: "!text-white/30 !text-[10px]",
                    socialButtonsBlockButton:
                      "!rounded-xl !border !border-white/10 !bg-white/5 !text-white/75 hover:!bg-white/10 !text-xs !font-medium !transition-all !min-h-[42px]",
                    socialButtonsBlockButtonText: "!text-white/75",
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
                signInUrl="/sign-in"
              />
            </div>
          </div>

          <p className="mt-3.5 text-center text-xs text-white/30">
            <Link
              href="/sign-in"
              className="font-semibold transition-colors"
              style={{ color: "#FDBA74" }}
            >
              <ArrowLeft className="inline h-3 w-3" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}