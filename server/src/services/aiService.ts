import Complaint from "../models/Complaint";

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

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    if (prompt.includes("RTI")) {
      return `FORM OF APPLICATION FOR SEEKING INFORMATION UNDER THE RIGHT TO INFORMATION ACT, 2005\n\nTo:\nThe Public Information Officer (PIO)\nMunicipal Corporation Office\n\nSubject: Formal Application under Section 6(1) of the RTI Act, 2005 regarding unresolved civic grievance.\n\nSir/Madam,\n\nI am writing to seek urgent information regarding the status and delayed redressal of civic grievance registered under NagarWatch.\n\n1. Period for which information is sought: From date of filing to present date.\n2. Daily progress report and file inspection notes.\n3. Names and designations of officials responsible for resolution within the prescribed Citizens' Charter SLA.\n4. Reasons for delay recorded in writing as mandated by law.\n\nKindly provide the requested information within 30 days as stipulated under Section 7(1) of the RTI Act 2005.\n\nYours faithfully,\nAuthorized Citizen Applicant`;
    }
    return JSON.stringify({
      category: "pothole",
      priority: "high",
      keywords: ["road", "damage", "pothole"],
      suggestedAction: "Dispatch road repair team for immediate patch work",
      estimatedSLAHours: 48,
      confidence: 0.92,
    });
  }

  return executeGeminiRequest(
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    },
    apiKey
  );
}

export async function callGeminiVision(
  prompt: string,
  imageBase64?: string,
  mimeType = "image/jpeg"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !imageBase64) {
    return callGemini(prompt);
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
  const parts: any[] = [
    { text: prompt },
    {
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    },
  ];

  try {
    return await executeGeminiRequest(
      {
        contents: [{ parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      },
      apiKey
    );
  } catch (err) {
    console.error("[Gemini Vision] Image analysis failed, falling back to text prompt:", err);
    return callGemini(prompt);
  }
}

export async function categorizeComplaint(title: string, description: string): Promise<any> {
  const prompt = `
You are an expert civic issue classifier for an Indian municipal complaint system.
Analyze the following civic complaint and return a JSON object with these exact fields:
{
  "category": one of ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"],
  "priority": one of ["low", "medium", "high", "critical"],
  "keywords": array of 3-5 key problem words extracted from the complaint,
  "suggestedAction": a 1-2 sentence recommended action for the municipal authority,
  "estimatedSLAHours": number of hours this should be resolved within (24 to 72),
  "confidence": a number between 0 and 1 indicating classification confidence
}

Complaint Title: ${title || "Civic issue"}
Complaint Description: ${description || "Reported municipal problem"}

Return ONLY valid JSON. No explanation, no markdown.
`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      category: "pothole",
      priority: "medium",
      keywords: ["road", "repair"],
      suggestedAction: "Inspection required by ward field team",
      estimatedSLAHours: 48,
      confidence: 0.8,
    };
  }
}

export default {
  callGemini,
  callGeminiVision,
  categorizeComplaint,
};
