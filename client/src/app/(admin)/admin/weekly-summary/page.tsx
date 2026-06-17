"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  Sparkles, Loader2, RefreshCw, Download, BarChart3,
  AlertTriangle, CheckCircle, Clock, TrendingUp, ArrowLeft
} from "lucide-react"
import { aiAPI } from "@/lib/api"
import type { WeeklySummaryResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type SummaryData = WeeklySummaryResponse

function StatCard({
  icon: Icon, label, value, color
}: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>{label}</span>
      </div>
      <p className="text-2xl font-extrabold" style={{ color: "#1F2937" }}>{value}</p>
    </div>
  )
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div className="space-y-3 text-sm" style={{ color: "#1F2937" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-base font-extrabold pt-3 border-t first:pt-0 first:border-0" style={{ color: "#D95D0F", borderColor: "#ECE7DE" }}>
              {line.replace("## ", "")}
            </h3>
          )
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc" style={{ color: "#4B5563" }}>
              {line.replace(/^[-*] /, "")}
            </li>
          )
        }
        if (line.match(/^\d+\. /)) {
          return (
            <li key={i} className="ml-4 list-decimal" style={{ color: "#4B5563" }}>
              {line.replace(/^\d+\. /, "")}
            </li>
          )
        }
        if (line.trim() === "") return <div key={i} className="h-1" />
        return <p key={i} style={{ color: "#4B5563" }}>{line}</p>
      })}
    </div>
  )
}

export default function WeeklySummaryPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Role guard — admin only
  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push("/sign-in"); return }
    const role = user.publicMetadata?.role as string
    if (role !== "admin") router.push("/unauthorized")
  }, [isLoaded, user, router])

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiAPI.weeklySummary()
      setData(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate summary. Ensure GEMINI_API_KEY is set.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!data) return
    const content = `NAGARWATCH WEEKLY CIVIC SUMMARY\nPeriod: ${data.period.from} — ${data.period.to}\n\n${data.summary}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NagarWatch_Weekly_Summary_${data.period.to.replace(/\s/g, "_")}.txt`
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
    <main className="max-w-5xl mx-auto px-4 py-8 pt-24 min-h-screen" style={{ backgroundColor: "#F8F6F1" }}>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/admin-dashboard")}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-0 mb-4"
          style={{ color: "#4B5563" }}
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#FFF3EB" }}
            >
              <TrendingUp className="size-6" style={{ color: "#D95D0F" }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#1F2937" }}>Weekly Civic Summary</h1>
              <p className="text-sm mt-1" style={{ color: "#4B5563" }}>
                Gemini AI generates a weekly governance digest for the Municipal Commissioner.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {data && (
              <Button variant="outline" onClick={handleDownload} className="text-xs font-bold">
                <Download className="size-3.5 mr-1.5" /> Download
              </Button>
            )}
            <Button
              onClick={generate}
              disabled={loading}
              className="font-bold text-white text-xs"
              style={{ backgroundColor: loading ? "#9CA3AF" : "#D95D0F" }}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" /> Generating...</>
              ) : (
                <><Sparkles className="size-4 mr-1.5" /> {data ? "Regenerate" : "Generate Summary"}</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border mb-6 text-sm"
          style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
          <AlertTriangle className="size-4 flex-shrink-0" /> {error}
        </div>
      )}

      {!data && !loading && (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl border text-center"
          style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}
        >
          <BarChart3 className="size-14 mb-4" style={{ color: "#ECE7DE" }} />
          <p className="text-base font-bold" style={{ color: "#1F2937" }}>No summary generated yet</p>
          <p className="text-sm mt-1 mb-6" style={{ color: "#4B5563" }}>
            Click "Generate Summary" to get a Gemini AI-powered weekly digest
          </p>
          <Button
            onClick={generate}
            className="font-bold text-white px-8"
            style={{ backgroundColor: "#D95D0F" }}
          >
            <Sparkles className="size-4 mr-2" /> Generate Summary
          </Button>
        </div>
      )}

      {loading && (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl border text-center"
          style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}
        >
          <Sparkles className="size-10 animate-pulse mb-4" style={{ color: "#D95D0F" }} />
          <p className="text-base font-bold" style={{ color: "#1F2937" }}>Gemini AI is analysing this week's data...</p>
          <p className="text-xs mt-2" style={{ color: "#4B5563" }}>Aggregating complaints, SLA stats, and category trends</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Period badge */}
          <div className="flex items-center gap-3">
            <Badge style={{ backgroundColor: "#FFF3EB", color: "#D95D0F", borderColor: "#D95D0F" }} variant="outline">
              {data.period.from} — {data.period.to}
            </Badge>
            <span className="text-xs" style={{ color: "#4B5563" }}>7-day period</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={TrendingUp} label="New" value={data.stats.newComplaints} color="#D95D0F" />
            <StatCard icon={CheckCircle} label="Resolved" value={data.stats.resolved} color="#16A34A" />
            <StatCard icon={RefreshCw} label="In Progress" value={data.stats.inProgress} color="#F59E0B" />
            <StatCard icon={Clock} label="Pending" value={data.stats.pending} color="#6B7280" />
            <StatCard icon={AlertTriangle} label="SLA Breaches" value={data.stats.breached} color="#DC2626" />
          </div>

          {/* Category breakdown */}
          {data.stats.categoryBreakdown.length > 0 && (
            <Card style={{ borderColor: "#ECE7DE" }}>
              <CardHeader className="border-b py-3 px-5" style={{ borderColor: "#ECE7DE" }}>
                <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                  Top Categories This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  {data.stats.categoryBreakdown.map((cat) => (
                    <div key={cat._id} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-24 capitalize" style={{ color: "#1F2937" }}>{cat._id}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (cat.count / (data.stats.categoryBreakdown[0]?.count || 1)) * 100)}%`,
                            backgroundColor: "#D95D0F",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-6 text-right" style={{ color: "#4B5563" }}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card style={{ borderColor: "#ECE7DE" }}>
            <CardHeader
              className="border-b py-3 px-5 flex flex-row items-center gap-2"
              style={{ borderColor: "#ECE7DE" }}
            >
              <Sparkles className="size-4" style={{ color: "#D95D0F" }} />
              <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                Gemini AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <MarkdownRenderer text={data.summary} />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
