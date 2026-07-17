"use client"

import { SignIn } from "@clerk/nextjs"
import { Crown, MapPin, Shield, Users } from "lucide-react"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">NagarWatch</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to report and track civic issues</p>
        </header>

        <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-md">
          {/* Role legend */}
          <div className="mb-5">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-400">Platform Roles</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                  <Users className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-700">Citizen</span>
                <span className="text-[9px] leading-tight text-blue-500">Report &amp; track issues</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Authority</span>
                <span className="text-[9px] leading-tight text-emerald-500">Manage ward complaints</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
                  <Crown className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-amber-700">Admin</span>
                <span className="text-[9px] leading-tight text-amber-500">City-wide oversight</span>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[10px] text-gray-400">
              You will be redirected to your role-specific dashboard automatically after sign-in.
            </p>
          </div>

          {/* Clerk SignIn widget */}
          <SignIn
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
            afterSignInUrl="/"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </main>
  )
}
