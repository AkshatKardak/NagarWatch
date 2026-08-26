export interface AIAssistanceResult {
  suggestedCategory: "pothole" | "garbage" | "water" | "streetlight" | "road" | "drainage" | "other";
  severity: "low" | "medium" | "high" | "critical";
  department: string;
  summary: string;
  suggestedAction: string;
  confidence: number;
  source: "GEMINI_AI" | "RULE_ENGINE";
}

const GEMINI_CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
];

async function executeGeminiRequest(body: any, apiKey: string): Promise<string> {
  let lastError = "";

  for (const model of GEMINI_CANDIDATE_MODELS) {
    if (!model) continue;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (result) return result;
      } else {
        const err = await res.text();
        lastError = `[Model ${model}] HTTP ${res.status}: ${err}`;
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
    }
  }

  throw new Error(`All Gemini candidate models failed. Last error: ${lastError}`);
}

/**
 * Deterministic Rule-Based Fallback Engine
 * Used when Gemini API is unavailable, unconfigured, or rate-limited.
 */
export function getRuleBasedAssistance(title: string, description: string): AIAssistanceResult {
  const combined = `${title} ${description}`.toLowerCase();

  let category: AIAssistanceResult["suggestedCategory"] = "other";
  let department = "General Administration";
  let severity: AIAssistanceResult["severity"] = "medium";
  let suggestedAction = "Conduct standard site inspection within standard Citizens Charter SLA.";

  if (combined.match(/pothole|crater|tarmac|asphalt|uneven road|ditch/)) {
    category = "pothole";
    department = "Roads & Infrastructure Department";
    severity = combined.match(/accident|deep|danger|critical|heavy/) ? "high" : "medium";
    suggestedAction = "Dispatch asphalt patch repair crew and set road safety signage.";
  } else if (combined.match(/garbage|trash|waste|dump|smell|bin|litter|debris/)) {
    category = "garbage";
    department = "Solid Waste Management Department";
    severity = combined.match(/fire|rot|maggot|hospital|school/) ? "high" : "medium";
    suggestedAction = "Deploy mechanized waste collection vehicle and sanitize site.";
  } else if (combined.match(/water|pipe|leak|pipeline|contamination|supply|tank/)) {
    category = "water";
    department = "Water Supply & Sewerage Department";
    severity = combined.match(/burst|flooding|drinking|contamination/) ? "critical" : "high";
    suggestedAction = "Isolate pipeline valve and dispatch plumbing maintenance team.";
  } else if (combined.match(/streetlight|light|pole|dark|wire|electricity|spark/)) {
    category = "streetlight";
    department = "Electrical Maintenance Department";
    severity = combined.match(/spark|exposed wire|shock|dark/) ? "high" : "low";
    suggestedAction = "Replace bulb/choke and test junction box grounding.";
  } else if (combined.match(/drain|sewer|gutter|overflow|clog|stagnant/)) {
    category = "drainage";
    department = "Drainage & Stormwater Department";
    severity = combined.match(/monsoon|flood|house|overflow/) ? "high" : "medium";
    suggestedAction = "Deploy desilting suction truck and unblock drainage culvert.";
  } else if (combined.match(/road|footpath|pavement|bridge|divider/)) {
    category = "road";
    department = "Civil Works Department";
    severity = "medium";
    suggestedAction = "Inspect structural damage and schedule civil masonry repairs.";
  }

  const cleanSummary = (title.trim() || description.trim()).slice(0, 120);

  return {
    suggestedCategory: category,
    severity,
    department,
    summary: cleanSummary ? `Civic issue reported: ${cleanSummary}` : "Civic infrastructure issue reported.",
    suggestedAction,
    confidence: 0.85,
    source: "RULE_ENGINE",
  };
}

/**
 * AI Complaint Assistant via Google Gemini
 */
export async function getComplaintAssistance(
  title: string,
  description: string
): Promise<AIAssistanceResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getRuleBasedAssistance(title, description);
  }

  const prompt = `You are NagarWatch Civic AI assistant for Indian Municipal Governance.
Analyze the following civic complaint and provide structured recommendations:
Title: "${title}"
Description: "${description}"

Respond ONLY with a valid JSON object in this exact schema without markdown fences:
{
  "suggestedCategory": "pothole" | "garbage" | "water" | "streetlight" | "road" | "drainage" | "other",
  "severity": "low" | "medium" | "high" | "critical",
  "department": "Department Name (e.g. Roads, Water Supply, Waste Management)",
  "summary": "1 concise sentence summarizing the core issue",
  "suggestedAction": "1 concise actionable operational recommendation for municipal field staff",
  "confidence": 0.95
}`;

  try {
    const raw = await executeGeminiRequest(
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      },
      apiKey
    );

    const jsonStr = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      suggestedCategory: parsed.suggestedCategory || "other",
      severity: parsed.severity || "medium",
      department: parsed.department || "General Administration",
      summary: parsed.summary || title,
      suggestedAction: parsed.suggestedAction || "Inspect on site",
      confidence: parsed.confidence || 0.9,
      source: "GEMINI_AI",
    };
  } catch (err) {
    console.warn("[Gemini Assistant] Calling fallback rule engine due to error:", err);
    return getRuleBasedAssistance(title, description);
  }
}
