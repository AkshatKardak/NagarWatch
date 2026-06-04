"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Info, ExternalLink, Shield, ArrowRight, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

export default function AdminUserManagement() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  // SEO
  useEffect(() => {
    document.title = "NagarWatch Admin - User Management"
  }, [])

  // 1. Role Guard Check
  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "admin") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      {/* Header section */}
      <header className="flex items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Authority Management</h1>
        </div>
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
          <Shield className="size-3.5" />
          NagarWatch Admin
        </Badge>
      </header>

      {/* First Card: Info Card */}
      <Card className="blue border border-blue-200 bg-blue-50/20 shadow-sm rounded-xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">Authority Accounts are Managed via Clerk</h2>
              <p className="text-sm text-gray-500">
                Create and configure authority credentials through the central user database dashboard.
              </p>
            </div>
          </div>

          <div className="border-t border-blue-100 pt-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">To create an authority account:</span>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1.5 font-medium">
              <li>Go to your Clerk Dashboard.</li>
              <li>Create or find the user.</li>
              <li>Open the user details and click the <strong className="font-bold">Metadata</strong> tab.</li>
              <li>Add role parameter to Public Metadata: <code className="bg-white px-2 py-0.5 border rounded text-xs font-bold font-mono text-blue-800">{`{"role": "authority"}`}</code></li>
              <li>The user will now automatically see the Authority Dashboard on next login.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                Open Clerk Dashboard
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Second Card: Role Reference */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Available Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Role</TableHead>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Access</TableHead>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Metadata Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-gray-900 text-sm">Citizen</TableCell>
                <TableCell className="text-gray-600 text-xs">Submit complaints, view status, upvote reports</TableCell>
                <TableCell>
                  <code className="bg-gray-100 border px-2 py-0.5 rounded text-xs font-mono text-gray-800">
                    {`{"role": "citizen"}`}
                  </code>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-gray-900 text-sm">Authority</TableCell>
                <TableCell className="text-gray-600 text-xs">Manage complaints queue, update status, upload proofs &amp; resolve issues</TableCell>
                <TableCell>
                  <code className="bg-gray-100 border px-2 py-0.5 rounded text-xs font-mono text-gray-800">
                    {`{"role": "authority"}`}
                  </code>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-gray-900 text-sm">Admin</TableCell>
                <TableCell className="text-gray-600 text-xs">Full access, city analytics, ward manager, role assignments overview</TableCell>
                <TableCell>
                  <code className="bg-gray-100 border px-2 py-0.5 rounded text-xs font-mono text-gray-800">
                    {`{"role": "admin"}`}
                  </code>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="p-4 bg-gray-50/50 border-t text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Note: If no role is set in metadata, the user defaults to &ldquo;citizen&rdquo;.
          </div>
        </CardContent>
      </Card>

      {/* Third Card: Complaint-to-Authority Assignments */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Complaint-to-Authority Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Complaints are auto-assigned to authorities based on geographical ward boundaries. Ensure each ward has at least one authority assigned in the Ward Management page.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/wards")}
            className="text-xs font-bold uppercase tracking-wider h-10 border-gray-300 hover:bg-gray-50"
          >
            Go to Ward Management
            <ArrowRight className="size-4 ml-1.5 text-gray-500" />
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
