"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  FileText, Loader2, Download, Copy, CheckCircle,
  AlertCircle, Sparkles, ArrowLeft, Scale, Info
} from "lucide-react"
import { aiAPI } from "@/lib/api"
import { usersAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { MyComplaintsResponse } from "@/lib/api"
import type { IComplaint } from "@/types/complaint"

export default function RTIGeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [complaints, setComplaints] = useState<IComplaint[]>([])
  const [loadingComplaints, setLoadingComplaints] = useState(true)

  const [selectedComplaintId, setSelectedComplaintId] = useState("")
  const [applicantName, setApplicantName] = useState("")
  const [applicantAddress, setApplicantAddress] = useState("")
  const [applicantPhone, setApplicantPhone] = useState("")

  const [generating, setGenerating] = useState(false)
  const [letter, setLetter] = useState<string | null>(null)
  const [daysPending, setDaysPending] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Role guard
  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in")
  }, [isLoaded, user, router])

  // Pre-fill name from Clerk
  useEffect(() => {
    if (user?.fullName) setApplicantName(user.fullName)
  }, [user])

  // Load user's complaints that are NOT resolved and 30+ days old
  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersAPI.getMyComplaints({ limit: 100 })
        const all = res.data.complaints
        const eligible = all.filter((c) => {
          if (c.status === "resolved") return false
          const days = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)
          return days >= 30
        })
        setComplaints(eligible)
      } catch {
        setComplaints([])
      } finally {
        setLoadingComplaints(false)
      }
    }
    if (user) void load()
  }, [user])

  const selectedComplaint = complaints.find((c) => c._id === selectedComplaintId)

  const handleGenerate = async () => {
    if (!selectedComplaintId || !applicantName || !applicantAddress) {
      setError("Please fill in all required fields and select a complaint.")
      return
    }
    setGenerating(true)
    setError(null)
    setLetter(null)
    try {
      const res = await aiAPI.generateRTI({
        complaintId: selectedComplaintId,
        applicantName,
        applicantAddress,
        applicantPhone,
      })
      setLetter(res.data.letter)
      setDaysPending(res.data.daysPending)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate RTI letter. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!letter) return
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    if (!letter) return
    const blob = new Blob([letter], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `RTI_Letter_NagarWatch_${selectedComplaintId?.slice(-6)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" style={{ color: "#D95D0F" }} />
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pt-24 min-h-screen" style={{ backgroundColor: "#F8F6F1" }}>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-0 mb-4"
          style={{ color: "#4B5563" }}
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#FFF3EB" }}
          >
            <Scale className="size-6" style={{ color: "#D95D0F" }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#1F2937" }}>RTI Letter Generator</h1>
            <p className="text-sm mt-1" style={{ color: "#4B5563" }}>
              Auto-generate a Right to Information Act 2005 letter for complaints unresolved for 30+ days.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div
          className="mt-4 flex items-start gap-3 p-4 rounded-lg border text-sm"
          style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E40AF" }}
        >
          <Info className="size-4 flex-shrink-0 mt-0.5" />
          <span>
            Under the <strong>RTI Act 2005</strong>, public authorities must respond within 30 days. If your civic
            complaint remains unresolved, you have the right to formally seek information about its status.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card style={{ borderColor: "#ECE7DE" }}>
            <CardHeader className="border-b py-3 px-5" style={{ borderColor: "#ECE7DE" }}>
              <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                Step 1 — Select Complaint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loadingComplaints ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#4B5563" }}>
                  <Loader2 className="size-4 animate-spin" /> Loading your complaints...
                </div>
              ) : complaints.length === 0 ? (
                <div
                  className="text-sm p-4 rounded-lg border text-center"
                  style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E" }}
                >
                  <AlertCircle className="size-5 mx-auto mb-2" />
                  No eligible complaints found.<br />
                  <span className="text-xs">Complaints must be unresolved and older than 30 days.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {complaints.map((c) => {
                    const days = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)
                    const isSelected = selectedComplaintId === c._id
                    return (
                      <button
                        key={c._id}
                        onClick={() => setSelectedComplaintId(c._id)}
                        className="w-full text-left p-3 rounded-lg border transition-all"
                        style={{
                          borderColor: isSelected ? "#D95D0F" : "#ECE7DE",
                          backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                        }}
                      >
                        <p className="text-xs font-bold truncate" style={{ color: "#1F2937" }}>{c.title}</p>
                        <p className="text-[10px] mt-0.5 uppercase font-semibold" style={{ color: "#4B5563" }}>
                          {c.category} · {days} days pending
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ borderColor: "#ECE7DE" }}>
            <CardHeader className="border-b py-3 px-5" style={{ borderColor: "#ECE7DE" }}>
              <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                Step 2 — Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase" style={{ color: "#4B5563" }}>Full Name *</label>
                <Input
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Your full legal name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase" style={{ color: "#4B5563" }}>Address *</label>
                <Textarea
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  placeholder="Your full postal address"
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase" style={{ color: "#4B5563" }}>Phone (Optional)</label>
                <Input
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="Your contact number"
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs p-2 rounded border" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                  <AlertCircle className="size-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedComplaintId}
                className="w-full font-bold text-white"
                style={{ backgroundColor: generating ? "#9CA3AF" : "#D95D0F" }}
              >
                {generating ? (
                  <><Loader2 className="size-4 animate-spin mr-2" /> Generating with Gemini AI...</>
                ) : (
                  <><Sparkles className="size-4 mr-2" /> Generate RTI Letter</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Letter output */}
        <div className="lg:col-span-3">
          <Card className="h-full" style={{ borderColor: "#ECE7DE" }}>
            <CardHeader
              className="border-b py-3 px-5 flex flex-row items-center justify-between"
              style={{ borderColor: "#ECE7DE" }}
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4" style={{ color: "#D95D0F" }} />
                <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                  Generated RTI Letter
                </CardTitle>
                {daysPending !== null && (
                  <Badge className="text-[10px]" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                    {daysPending} days pending
                  </Badge>
                )}
              </div>
              {letter && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
                    {copied ? <><CheckCircle className="size-3.5 mr-1" /> Copied!</> : <><Copy className="size-3.5 mr-1" /> Copy</>}
                  </Button>
                  <Button size="sm" onClick={handleDownload} className="text-xs text-white" style={{ backgroundColor: "#D95D0F" }}>
                    <Download className="size-3.5 mr-1" /> Download .txt
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {!letter && !generating && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Scale className="size-12 mb-3" style={{ color: "#ECE7DE" }} />
                  <p className="text-sm font-semibold" style={{ color: "#4B5563" }}>Your RTI letter will appear here</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Select a complaint and fill your details to generate</p>
                </div>
              )}
              {generating && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Sparkles className="size-8 animate-pulse mb-3" style={{ color: "#D95D0F" }} />
                  <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Gemini AI is drafting your letter...</p>
                  <p className="text-xs mt-1" style={{ color: "#4B5563" }}>Analysing complaint details and RTI Act 2005 provisions</p>
                </div>
              )}
              {letter && (
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-lg border overflow-auto max-h-[600px]"
                  style={{ backgroundColor: "#FAFAFA", borderColor: "#ECE7DE", color: "#1F2937" }}
                >
                  {letter}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
