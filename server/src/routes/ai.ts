import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Complaint } from "../models/Complaint";
import { uploadSingle } from "../middleware/upload";
import { getComplaintAssistance } from "../services/ai/gemini.service";
import { translateText } from "../services/translation/sarvamTranslation.service";
import { transcribeAudio } from "../services/transcription/sarvamSpeech.service";

const router = Router();

// ─── Candidate models for Gemini API in priority order ────────────────────────
const GEMINI_CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
];

async function executeGeminiRequest(
  body: any,
  apiKey: string
): Promise<string> {
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
        console.warn(`[Gemini API] Failed with ${model} (${res.status}), trying next available model...`);
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
    }
  }

  throw new Error(`All Gemini candidate models failed. Last error: ${lastError}`);
}

// ─── Helper: call Gemini REST API ───────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback heuristic response if API key is not configured
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

// ─── Helper: call Gemini Vision REST API (Latest Multimodal) ──────────────────
async function callGeminiVision(
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

// ─── 1. RTI Letter Generator ─────────────────────────────────────────────────
// POST /api/v1/ai/rti
router.post("/rti", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { complaintId, applicantName, applicantAddress, applicantPhone } = req.body as {
    complaintId: string;
    applicantName: string;
    applicantAddress: string;
    applicantPhone?: string;
  };

  if (!complaintId || !applicantName || !applicantAddress) {
    res.status(400).json({ success: false, message: "complaintId, applicantName and applicantAddress are required" });
    return;
  }

  const complaint = await Complaint.findById(complaintId).populate("ward").lean();
  if (!complaint) {
    res.status(404).json({ success: false, message: "Complaint not found" });
    return;
  }

  const daysPending = Math.floor(
    (Date.now() - new Date(complaint.createdAt as Date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `
You are an expert in Indian RTI (Right to Information Act, 2005) law.

Generate a formal RTI application letter in English for the following civic complaint that has been UNRESOLVED for ${daysPending} days.

Complaint Details:
- Title: ${complaint.title}
- Category: ${complaint.category}
- Description: ${complaint.description}
- Location: ${(complaint.location as any)?.address || "N/A"}
- Ward: ${(complaint as any).ward?.name || "N/A"}
- Status: ${complaint.status}
- Submitted on: ${new Date(complaint.createdAt as Date).toDateString()}
- Days Pending: ${daysPending}

Applicant Details:
- Name: ${applicantName}
- Address: ${applicantAddress}
- Phone: ${applicantPhone || "N/A"}

Generate a professional RTI letter with:
1. Proper RTI Act 2005 legal citations (Section 6(1) for filing, Section 7(1) for 30-day timeline)
2. Specific information sought about the status, inspection records, and reason for non-resolution
3. 30-day response deadline reminder per Section 7
4. First Appellate Authority details reminder under Section 19(1)
5. Formal salutation and closing

Return only the letter text, formatted properly with paragraph breaks. Do not include markdown code fences.
`;

  try {
    const letter = await callGemini(prompt);
    res.json({ success: true, letter, daysPending, complaint: { title: complaint.title, id: complaintId } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 2. Gemini AI Categorization ─────────────────────────────────────────────
// POST /api/v1/ai/categorize
router.post("/categorize", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body as { title: string; description: string };

  if (!title && !description) {
    res.status(400).json({ success: false, message: "title or description is required" });
    return;
  }

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

Return ONLY valid JSON. No explanation, no markdown, no code blocks.
`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(cleaned) as Record<string, unknown>;
    res.json({ success: true, ...result });
  } catch {
    res.json({
      success: true,
      category: "other",
      priority: "medium",
      keywords: ["civic", "maintenance"],
      suggestedAction: "Assign to ward maintenance crew for inspection",
      estimatedSLAHours: 48,
      confidence: 0.8,
    });
  }
});

// ─── 3. Gemini Vision Image Categorization & OCR ─────────────────────────────
// POST /api/v1/ai/categorize-image
router.post("/categorize-image", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };

  const prompt = `
Analyze this civic issue photograph taken on an Indian city street.
Return a JSON object with these exact fields:
{
  "isValidCivicIssue": boolean (true if pothole, garbage, open drain, broken streetlight, road damage, water leak, etc.),
  "detectedCategory": one of ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"],
  "severity": one of ["low", "medium", "high", "critical"],
  "detectedLandmarks": array of any visible landmark names, street names, milestone numbers, or shop signboards visible in the image,
  "suggestedTitle": a concise 5-8 word title describing the issue,
  "suggestedDescription": a 1-2 sentence description of what is visible in the photo,
  "confidence": number between 0 and 1
}

Return ONLY valid JSON.
`;

  try {
    const raw = await callGeminiVision(prompt, imageBase64, mimeType || "image/jpeg");
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(cleaned) as Record<string, unknown>;
    res.json({ success: true, ...result });
  } catch {
    res.json({
      success: true,
      isValidCivicIssue: true,
      detectedCategory: "pothole",
      severity: "high",
      detectedLandmarks: [],
      suggestedTitle: "Road damage needing urgent repair",
      suggestedDescription: "Visible street hazard detected in submitted photograph.",
      confidence: 0.85,
    });
  }
});

// ─── 4. Duplicate Complaint Detection ─────────────────────────────────────────
// POST /api/v1/ai/check-duplicates
// Body: { title, description, category, lat, lng }
router.post("/check-duplicates", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, description, category, lat, lng } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    lat?: number;
    lng?: number;
  };

  try {
    const query: any = {
      status: { $in: ["pending", "in_progress"] },
    };

    if (category) {
      query.category = category;
    }

    let nearby: any[] = [];

    // 1. If lat/lng given, find complaints within 500m
    if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
      nearby = await Complaint.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 500, // 500 meters
          },
        },
      })
        .limit(5)
        .select("_id title description category location upvoteCount status createdAt")
        .lean();
    } else {
      // Fallback query top recent open complaints in category
      nearby = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id title description category location upvoteCount status createdAt")
        .lean();
    }

    if (nearby.length === 0) {
      res.json({ success: true, isDuplicate: false, count: 0 });
      return;
    }

    // 2. Simple text token overlap scoring
    const inputWords = new Set(
      `${title || ""} ${description || ""}`
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    let maxMatch: any = null;
    let highestScore = 0;

    for (const comp of nearby) {
      const compWords = new Set(
        `${comp.title} ${comp.description}`
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );

      let overlap = 0;
      inputWords.forEach((w) => {
        if (compWords.has(w)) overlap++;
      });

      const unionSize = new Set([...inputWords, ...compWords]).size || 1;
      const jaccard = overlap / unionSize;

      // Bonus if category is identical
      const score = comp.category === category ? jaccard + 0.35 : jaccard;

      if (score > highestScore) {
        highestScore = score;
        maxMatch = comp;
      }
    }

    const isDuplicate = highestScore >= 0.4 || nearby.length >= 2;

    res.json({
      success: true,
      isDuplicate,
      confidence: Number(Math.min(highestScore + 0.2, 0.95).toFixed(2)),
      matchedComplaint: isDuplicate && maxMatch ? maxMatch : nearby[0],
      nearbyCount: nearby.length,
      message: isDuplicate
        ? "An existing unresolved complaint of the same type was found within 500m."
        : "No significant duplicates detected.",
    });
  } catch (err: any) {
    res.json({ success: true, isDuplicate: false, error: err.message });
  }
});

// ─── 5. Weekly Civic Summary (Admin) ──────────────────────────────────────────
// POST /api/v1/ai/weekly-summary
router.post("/weekly-summary", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const role = (req as any).auth?.sessionClaims?.publicMetadata?.role as string | undefined;
  if (role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [allComplaints, newComplaints, resolved, inProgress, pending, breached] = await Promise.all([
    Complaint.countDocuments({ createdAt: { $gte: since } }),
    Complaint.countDocuments({ createdAt: { $gte: since } }),
    Complaint.countDocuments({ status: "resolved", updatedAt: { $gte: since } }),
    Complaint.countDocuments({ status: "in_progress" }),
    Complaint.countDocuments({ status: "pending" }),
    Complaint.countDocuments({ "sla.breached": true, updatedAt: { $gte: since } }),
  ]);

  const categoryAgg = (await Complaint.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ])) as Array<{ _id: string; count: number }>;

  const topUnresolved = await Complaint.find({ status: { $ne: "resolved" } })
    .sort({ priorityScore: -1 })
    .limit(5)
    .select("title category priority priorityScore location")
    .lean();

  const categoryList = categoryAgg.map((c) => `${c._id}: ${c.count}`).join(", ");
  const unresolvedList = topUnresolved
    .map((c, i) => `${i + 1}. [${c.priority?.toUpperCase()}] ${c.title} (${c.category}) — Score: ${c.priorityScore}`)
    .join("\n");

  const weekStart = since.toDateString();
  const weekEnd = new Date().toDateString();

  const prompt = `
You are a senior civic governance analyst generating a weekly digest for a Municipal Commissioner.

Weekly Statistics (${weekStart} to ${weekEnd}):
- New Complaints Filed: ${newComplaints}
- Resolved This Week: ${resolved}
- Currently In Progress: ${inProgress}
- Currently Pending: ${pending}
- SLA Breaches This Week: ${breached}
- Resolution Rate: ${allComplaints > 0 ? Math.round((resolved / allComplaints) * 100) : 0}%

Top Categories This Week:
${categoryList}

Top 5 Critical Unresolved Complaints:
${unresolvedList}

Generate a professional weekly civic performance summary digest for the Municipal Commissioner. Include:
1. Executive Summary
2. Key Highlights & Wins
3. Areas of Concern
4. Top Priority Actions for Next Week
5. Closing statement

Tone: professional, factual, action-oriented. Format with clear section headers using ##.
`;

  try {
    const summary = await callGemini(prompt);
    res.json({
      success: true,
      summary,
      stats: { newComplaints, resolved, inProgress, pending, breached, categoryBreakdown: categoryAgg },
      period: { from: weekStart, to: weekEnd },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Feature 5: AI Complaint Assistant ──────────────────────────────────────
// POST /api/ai/complaint-assist
router.post("/complaint-assist", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title = "", description = "" } = req.body as { title?: string; description?: string };
    const assistance = await getComplaintAssistance(title, description);
    res.json({
      success: true,
      ...assistance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Feature 6: Sarvam AI Multi-Language Translation ────────────────────────
// POST /api/ai/translate and POST /api/translation
const handleTranslation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text = "", sourceLanguage = "hi-IN", targetLanguage = "en-IN" } = req.body;
    const result = await translateText(text, sourceLanguage, targetLanguage);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post("/translate", handleTranslation);
router.post("/translation", handleTranslation);

// ─── Feature 7: Sarvam AI Voice Speech-to-Text Transcription ─────────────────
// POST /api/ai/transcribe and POST /api/transcription
const handleTranscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const languageCode = req.body.languageCode || req.body.language || "hi-IN";
    let audioBuffer: Buffer | null = null;
    let mimeType = "audio/wav";

    if (req.file?.buffer) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || "audio/wav";
    } else if (req.body.audioBase64) {
      const cleanBase64 = req.body.audioBase64.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, "");
      audioBuffer = Buffer.from(cleanBase64, "base64");
    }

    if (!audioBuffer) {
      res.status(400).json({
        success: false,
        message: "Audio file or audioBase64 payload is required",
      });
      return;
    }

    const result = await transcribeAudio(audioBuffer, languageCode, mimeType);
    res.json({
      success: result.success,
      transcript: result.transcript,
      languageCode: result.languageCode,
      error: result.error,
      provider: result.provider,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post("/transcribe", uploadSingle, handleTranscription);
router.post("/transcription", uploadSingle, handleTranscription);

export default router;
