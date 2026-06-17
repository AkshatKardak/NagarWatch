import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import Complaint from "../models/Complaint";

const router = Router();

// ─── Helper: call Gemini REST API ───────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in environment");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ─── 1. RTI Letter Generator ─────────────────────────────────────────────────
// POST /api/v1/ai/rti
// Body: { complaintId, applicantName, applicantAddress, applicantPhone }
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
1. Proper RTI Act 2005 legal citations
2. Specific information sought about the status and reason for non-resolution
3. 30-day response deadline reminder per Section 7
4. Appeal rights under Section 19
5. Formal salutation and closing

Return only the letter text, formatted properly with paragraph breaks. Do not include any commentary before or after the letter.
`;

  const letter = await callGemini(prompt);
  res.json({ success: true, letter, daysPending, complaint: { title: complaint.title, id: complaintId } });
});

// ─── 2. Gemini AI Categorization ─────────────────────────────────────────────
// POST /api/v1/ai/categorize
// Body: { title, description }
router.post("/categorize", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body as { title: string; description: string };

  if (!title || !description) {
    res.status(400).json({ success: false, message: "title and description are required" });
    return;
  }

  const prompt = `
You are an expert civic issue classifier for an Indian municipal complaint system.

Analyze the following civic complaint and return a JSON object with these exact fields:
{
  "category": one of ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"],
  "priority": one of ["low", "medium", "high", "critical"],
  "keywords": array of 3-5 key problem words extracted from the complaint,
  "suggestedAction": a 1-2 sentence recommended action for the authority,
  "estimatedSLAHours": number of hours this should be resolved within based on severity,
  "confidence": a number between 0 and 1 indicating classification confidence
}

Complaint Title: ${title}
Complaint Description: ${description}

Return ONLY valid JSON. No explanation, no markdown, no code blocks.
`;

  const raw = await callGemini(prompt);

  // Strip possible markdown code fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    res.status(500).json({ success: false, message: "AI returned invalid JSON", raw });
    return;
  }

  res.json({ success: true, ...result });
});

// ─── 3. Weekly Civic Summary ──────────────────────────────────────────────────
// POST /api/v1/ai/weekly-summary
// Admin-only: generates a digest of the past 7 days
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

  // Top 5 categories this week
  const categoryAgg = await Complaint.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]) as Array<{ _id: string; count: number }>;

  // Top 5 most critical unresolved
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
1. Executive Summary (3-4 sentences)
2. Key Highlights & Wins
3. Areas of Concern
4. Top Priority Actions for Next Week
5. A brief closing statement

Tone: professional, factual, action-oriented. Format with clear section headers using ##.
`;

  const summary = await callGemini(prompt);

  res.json({
    success: true,
    summary,
    stats: { newComplaints, resolved, inProgress, pending, breached, categoryBreakdown: categoryAgg },
    period: { from: weekStart, to: weekEnd },
  });
});

export default router;
