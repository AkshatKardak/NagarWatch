"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { CheckCircle, Info, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ComplaintForm } from "@/components/complaints/ComplaintForm"

export default function CitizenSubmitComplaint() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const [submitted, setSubmitted] = useState(false)
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "NagarWatch - Report a Civic Issue"
  }, [])

  // Role Guard
  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = (clerkUser.publicMetadata?.role as string) || "citizen"
      if (role !== "citizen") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center justify-between">
        <Button
          onClick={() => router.push("/citizen/dashboard")}
          variant="ghost"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-0"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>
        <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">
          Home &rarr; Submit Issue
        </span>
      </nav>

      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-gray-500 leading-normal">
          Help your community by reporting local problems. Your report goes directly to the responsible authority.
        </p>
      </header>

      {/* Info bar */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl p-4">
        <Info className="size-5 shrink-0 text-blue-600 mt-0.5" />
        <div className="text-xs font-semibold leading-relaxed">
          Tips: Be specific in your description. GPS location helps authorities prioritize and locate the issue faster.
        </div>
      </div>

      {submitted ? (
        <Card className="border-green-200 bg-green-50/20 shadow-md">
          <CardContent className="p-8 text-center space-y-5">
            <CheckCircle className="size-16 text-green-500 mx-auto animate-bounce" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-green-800">Complaint Submitted!</h2>
              <p className="text-sm text-green-700">
                Your complaint{" "}
                <strong className="font-extrabold bg-green-100 px-2 py-0.5 rounded">
                  #{submittedComplaintId?.slice(-6)}
                </strong>{" "}
                has been registered.
              </p>
            </div>
            <p className="text-xs text-green-600 max-w-sm mx-auto leading-relaxed">
              Authorities will be notified shortly. You will receive real-time updates via notifications on your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Button
                onClick={() => router.push("/citizen/complaints")}
                className="bg-green-700 hover:bg-green-800 text-white font-bold"
              >
                View My Complaints
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null)
                  setSubmitted(false)
                }}
                className="border-green-200 text-green-800 hover:bg-green-50 bg-white font-semibold"
              >
                Report Another Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow-md border border-red-700 text-sm font-medium rounded-md">
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1 truncate">{error}</span>
              <button onClick={() => setError(null)} className="text-white font-bold ml-2 text-xs uppercase">
                Dismiss
              </button>
            </div>
          )}
          <Card className="border border-gray-200 shadow-sm bg-white p-6">
            <ComplaintForm
              onSuccess={(complaint) => {
                setSubmittedComplaintId(complaint._id)
                setSubmitted(true)
              }}
            />
          </Card>
        </div>
      )}
    </main>
  )
}
