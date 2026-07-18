"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { User, Mail, Calendar, Shield, Users, Crown, LogOut, Lock, ChevronRight, Loader2, BadgeCheck, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { timeAgo } from "@/lib/utils"

const ROLE_META = {
  citizen:   { label: "Citizen",   color: "#2563eb", Icon: Users,  desc: "Report civic issues, track complaints, and upvote community problems in your area." },
  authority: { label: "Authority", color: "#10b981", Icon: Shield, desc: "Manage ward complaints, update statuses, and upload proof of resolution." },
  admin:     { label: "Admin",     color: "#f59e0b", Icon: Crown,  desc: "Manage users, assign roles, oversee all wards, and configure the platform." },
} as const

type Role = keyof typeof ROLE_META

export default function CitizenProfilePage() {
  const { user, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => { document.title = "NagarWatch — My Profile" }, [])

  if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
  if (!user) { router.push("/sign-in"); return null }

  const role = ((user.publicMetadata?.role as string) ?? "citizen") as Role
  const meta = ROLE_META[role] ?? ROLE_META.citizen
  const { Icon } = meta
  const fullName = user.fullName ?? user.firstName ?? "User"
  const email = user.primaryEmailAddress?.emailAddress ?? ""
  const verified = user.primaryEmailAddress?.verification?.status === "verified"
  const createdAt = user.createdAt ? new Date(user.createdAt) : null

  return (
    <main className="min-h-screen bg-gray-50/50 pb-12">
      <div className="mx-auto max-w-xl space-y-4">

        {/* ── Header card ── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="h-1.5 w-full" style={{ background: meta.color }} />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={fullName} className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md" style={{ background: meta.color }}>
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black text-gray-900 truncate">{fullName}</h1>
                  {verified && <BadgeCheck className="size-4 text-blue-500 shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 truncate">{email}</p>
                {createdAt && <p className="text-xs text-gray-400 mt-0.5">Joined {timeAgo(createdAt.toISOString())}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Role card ── */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Your Role</p>
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: `${meta.color}12`, border: `1.5px solid ${meta.color}30` }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.color }}>
                <Icon size={18} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black" style={{ color: meta.color }}>{meta.label}</span>
                  <Badge className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-white border-0" style={{ background: meta.color }}>Active</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{meta.desc}</p>
              </div>
            </div>
            {role === "citizen" && <p className="mt-2.5 text-[10px] text-gray-400">Want authority access? Contact your municipal administrator.</p>}
            {role === "authority" && <p className="mt-2.5 text-[10px] text-gray-400">Your ward access is managed by the NagarWatch admin.</p>}
          </CardContent>
        </Card>

        {/* ── Account details ── */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Account Details</p>

            {[
              { icon: User,    label: "Full Name",   value: fullName },
              { icon: Mail,    label: "Email",       value: email },
              { icon: MapPin,  label: "Platform",    value: "NagarWatch India" },
              { icon: Calendar, label: "Member Since", value: createdAt ? createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            ].map(({ icon: Icon_, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <Icon_ className="size-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Account settings ── */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Account Settings</p>
            <button
              onClick={() => openUserProfile()}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-3"><Lock className="size-4 text-gray-400" /> Change Password &amp; Security</span>
              <ChevronRight className="size-4 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        {/* ── Sign out ── */}
        <Card className="border border-red-100 shadow-sm">
          <CardContent className="p-5">
            <Button
              variant="outline"
              onClick={async () => { setSigningOut(true); await signOut(); router.push("/"); }}
              disabled={signingOut}
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-sm"
            >
              {signingOut ? <Loader2 className="size-4 animate-spin mr-2" /> : <LogOut className="size-4 mr-2" />}
              Sign Out
            </Button>
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
