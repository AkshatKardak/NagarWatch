"use client"

import { SignUp } from "@clerk/nextjs"
import { MapPin, Users, Shield, Crown, Info } from "lucide-react"
import { useState } from "react"

const ROLES = [
  {
    id: "citizen",
    label: "Citizen",
    icon: Users,
    description: "Report & track civic issues in your area",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    id: "authority",
    label: "Authority",
    icon: Shield,
    description: "Manage & resolve complaints for your ward",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
] as const

type RoleId = (typeof ROLES)[number]["id"]

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<RoleId>("citizen")

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">NagarWatch</h1>
          <p className="mt-1 text-sm text-gray-500">Civic Issue Reporting &amp; Governance Platform</p>
        </header>

        <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-md">
          {/* Role Selector */}
          <div className="mb-5">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-400">I am signing up as</p>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLES.map((role) => {
                const Icon = role.icon
                const active = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all"
                    style={{
                      borderColor: active ? role.color : "#E5E7EB",
                      backgroundColor: active ? role.bg : "#F9FAFB",
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: active ? role.color : "#E5E7EB" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: active ? "#fff" : "#6B7280" }} />
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: active ? role.color : "#374151" }}
                    >
                      {role.label}
                    </span>
                    <span className="text-[10px] leading-tight text-gray-500">{role.description}</span>
                  </button>
                )
              })}
            </div>

            {/* Admin note */}
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-[10px] leading-relaxed text-amber-700">
                <strong>Admin accounts</strong> are not self-registered. Contact your system administrator to have admin access provisioned in the database.
              </p>
            </div>

            {selectedRole === "authority" && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[10px] leading-relaxed text-emerald-700">
                  Authority accounts require <strong>admin approval</strong> before ward access is granted. Your role will be activated after verification.
                </p>
              </div>
            )}
          </div>

          {/* Clerk SignUp widget */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
                formButtonPrimary:
                  "w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase rounded-lg py-2.5 transition-colors",
                formFieldInput:
                  "rounded-lg border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm",
                formFieldLabel: "text-xs font-semibold text-gray-600 uppercase tracking-wide",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 text-xs",
                socialButtonsBlockButton:
                  "border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors",
              },
            }}
            afterSignUpUrl="/"
            signInUrl="/sign-in"
            unsafeMetadata={{ requestedRole: selectedRole }}
          />
        </div>

        <p className="mt-4 text-center text-[10px] text-gray-400">
          Your selected role ({selectedRole}) is recorded at sign-up and applied by the system after account creation.
        </p>
      </div>
    </main>
  )
}
