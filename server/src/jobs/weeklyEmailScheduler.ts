/**
 * Weekly Civic Summary Email Scheduler
 *
 * Runs every Monday at 08:00 AM (server local time) using setInterval.
 * Generates a Gemini AI digest of the past 7 days and emails it to
 * the Commissioner address set in COMMISSIONER_EMAIL env var.
 *
 * Falls back gracefully if Redis / email / Gemini are not configured.
 */

import { Complaint } from "../models/Complaint";
import { sendWeeklySummaryEmail } from "../services/emailService";

const COMMISSIONER_EMAIL = process.env.COMMISSIONER_EMAIL || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) return "[Gemini not configured — add GEMINI_API_KEY to server/.env]";

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary generated.";
}

async function generateAndSendWeeklySummary(): Promise<void> {
  if (!COMMISSIONER_EMAIL) {
    console.log("[WEEKLY EMAIL] COMMISSIONER_EMAIL not set — skipping weekly summary email");
    return;
  }

  console.log("[WEEKLY EMAIL] Generating weekly civic summary...");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekLabel = `${sevenDaysAgo.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  try {
    // Aggregate all stats for the past 7 days in parallel
    const [newComplaints, resolved, pending, inProgress, slaBreachData, topCategories, topUnresolved] =
      await Promise.all([
        Complaint.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Complaint.countDocuments({ status: "resolved", resolvedAt: { $gte: sevenDaysAgo } }),
        Complaint.countDocuments({ status: "pending" }),
        Complaint.countDocuments({ status: "in_progress" }),
        Complaint.aggregate<{ _id: null; breached: number }>([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          { $group: { _id: null, breached: { $sum: { $cond: ["$sla.breached", 1, 0] } } } },
        ]),
        Complaint.aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Complaint.find({ status: { $ne: "resolved" } })
          .sort({ priorityScore: -1 })
          .limit(3)
          .select("title category upvoteCount sla.deadline")
          .lean(),
      ]);

    const slaBreaches = slaBreachData[0]?.breached ?? 0;

    const prompt = `You are the civic intelligence assistant for NagarWatch, India's municipal complaint platform.

Generate a concise, professional Weekly Civic Summary Report for the Municipal Commissioner.
Use markdown formatting with ## headers and **bold** for key numbers.

DATA FOR THE WEEK OF ${weekLabel}:
- New complaints filed: ${newComplaints}
- Complaints resolved: ${resolved}
- Currently pending: ${pending}
- Currently in progress: ${inProgress}
- SLA deadline breaches: ${slaBreaches}
- Top complaint categories: ${topCategories.map((c) => `${c._id} (${c.count})`).join(", ")}
- Top unresolved high-priority complaints: ${topUnresolved.map((c) => c.title).join("; ")}

Structure the report with these sections:
1. Executive Summary (2-3 sentences)
2. Key Highlights
3. Areas of Concern
4. Recommended Actions for this week

Keep it under 300 words. Tone: professional, data-driven, actionable.`;

    const summaryMarkdown = await callGemini(prompt);

    await sendWeeklySummaryEmail(COMMISSIONER_EMAIL, summaryMarkdown, {
      newComplaints,
      resolved,
      pending,
      slaBreaches,
      weekLabel,
    });

    console.log(`[WEEKLY EMAIL] ✅ Weekly summary sent to ${COMMISSIONER_EMAIL}`);
  } catch (error) {
    console.error("[WEEKLY EMAIL] Failed to send weekly summary:", error);
  }
}

/**
 * Returns milliseconds until the next Monday at 08:00 AM.
 */
function msUntilNextMondayAt8AM(): number {
  const now = new Date();
  const next = new Date(now);

  // Advance to next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // 1=Mon…7=Sun, 0→7
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(8, 0, 0, 0);

  return next.getTime() - now.getTime();
}

/**
 * Starts the weekly scheduler.
 * Called once from server/src/index.ts during bootstrap.
 */
export function initWeeklyEmailScheduler(): void {
  const delayMs = msUntilNextMondayAt8AM();
  const delayHours = Math.round(delayMs / 1000 / 60 / 60);

  console.log(
    `[WEEKLY EMAIL] Scheduler started — next run in ~${delayHours} hours (Monday 08:00 AM)`
  );

  // Fire once at next Monday 08:00
  setTimeout(() => {
    void generateAndSendWeeklySummary();

    // Then repeat every 7 days
    setInterval(() => {
      void generateAndSendWeeklySummary();
    }, 7 * 24 * 60 * 60 * 1000);
  }, delayMs);
}
