"use client"

import { useState } from "react"
import { Sparkles, Loader2, X } from "lucide-react"
import { aiAPI } from "@/lib/api"
import type { CategorizeResponse } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  description: string
  onApply?: (result: CategorizeResponse) => void
}

export function AICategorizeBadge({ title, description, onApply }: Props) {
  const [result, setResult] = useState<CategorizeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const handleAnalyze = async () => {
    if (!title.trim() || !description.trim()) return
    setLoading(true)
    setError(null)
    setDismissed(false)
    try {
      const res = await aiAPI.categorize({ title, description })
      setResult(res.data)
    } catch {
      setError("AI categorization failed")
    } finally {
      setLoading(false)
    }
  }

  if (dismissed) return null

  const priorityColor: Record<string, string> = {
    low: "#16A34A",
    medium: "#F59E0B",
    high: "#D95D0F",
    critical: "#DC2626",
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-3"
      style={{ borderColor: "#ECE7DE", backgroundColor: "#FAFAF8" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: "#D95D0F" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
            Gemini AI Suggestion
          </span>
        </div>
        {result && (
          <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100">
            <X className="size-3.5" style={{ color: "#4B5563" }} />
          </button>
        )}
      </div>

      {!result && !loading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={!title.trim() || !description.trim()}
          className="text-xs font-bold w-full"
          style={{ borderColor: "#D95D0F", color: "#D95D0F" }}
        >
          <Sparkles className="size-3.5 mr-1.5" />
          Analyze & Auto-Categorize
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "#4B5563" }}>
          <Loader2 className="size-3.5 animate-spin" />
          Analyzing complaint with Gemini AI...
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>
      )}

      {result && !loading && (
        <div className="space-y-3">
          {/* Category + Priority */}
          <div className="flex flex-wrap gap-2">
            <Badge
              className="text-[10px] font-bold uppercase"
              style={{ backgroundColor: "#FFF3EB", color: "#D95D0F", border: "1px solid #D95D0F" }}
            >
              {result.category}
            </Badge>
            <Badge
              className="text-[10px] font-bold uppercase"
              style={{
                backgroundColor: `${priorityColor[result.priority]}15`,
                color: priorityColor[result.priority],
                border: `1px solid ${priorityColor[result.priority]}`,
              }}
            >
              {result.priority} priority
            </Badge>
            <Badge
              className="text-[10px] font-semibold"
              style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #16A34A" }}
            >
              {Math.round(result.confidence * 100)}% confident
            </Badge>
          </div>

          {/* Keywords */}
          <div>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#9CA3AF" }}>Keywords</p>
            <div className="flex flex-wrap gap-1">
              {result.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: "#F3F4F6", color: "#4B5563" }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Action */}
          <div
            className="text-xs p-3 rounded-lg border italic"
            style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E40AF" }}
          >
            <span className="font-bold not-italic">Suggested Action: </span>
            {result.suggestedAction}
          </div>

          {/* SLA */}
          <p className="text-[10px]" style={{ color: "#4B5563" }}>
            Estimated SLA: <strong>{result.estimatedSLAHours}h</strong>
          </p>

          {/* Apply button */}
          {onApply && (
            <Button
              type="button"
              size="sm"
              onClick={() => { onApply(result!); setDismissed(true) }}
              className="w-full text-xs font-bold text-white"
              style={{ backgroundColor: "#D95D0F" }}
            >
              Apply AI Suggestions
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
