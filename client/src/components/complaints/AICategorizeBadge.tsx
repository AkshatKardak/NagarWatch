"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CategorizeResponse {
  category: string;
  priority: string;
  confidence: number;
  keywords?: string[];
  suggestedAction?: string;
}

interface Props {
  title: string;
  description: string;
  onApply?: (result: CategorizeResponse) => void;
}

export function AICategorizeBadge({ title, description, onApply }: Props) {
  const [result, setResult] = useState<CategorizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleAnalyze = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    setError(null);
    setDismissed(false);
    try {
      const res = await aiAPI.categorize({ title, description });
      setResult(res.data);
    } catch {
      setError("AI suggestion unavailable");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={loading || !title.trim()}
          className="text-xs font-bold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin mr-1.5" />
          ) : (
            <Sparkles className="size-3 mr-1.5" />
          )}
          Suggest with Gemini AI
        </Button>
      </div>

      {result && (
        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-purple-950">
              Suggested: <span className="uppercase text-purple-700">{result.category}</span> ({result.priority} priority)
            </p>
            {result.suggestedAction && (
              <p className="text-[11px] text-purple-800">{result.suggestedAction}</p>
            )}
            {onApply && (
              <Button
                type="button"
                size="xs"
                onClick={() => onApply(result)}
                className="mt-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] uppercase"
              >
                Apply AI Suggestions
              </Button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-purple-400 hover:text-purple-700 p-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export default AICategorizeBadge;
