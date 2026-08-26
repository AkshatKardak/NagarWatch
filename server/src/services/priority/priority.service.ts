import type { ComplaintPriority } from "../../models/Complaint";

const URGENT_KEYWORDS = [
  "flood",
  "burst",
  "fire",
  "collapse",
  "overflow",
  "sewage",
  "emergency",
  "danger",
  "dead",
  "injury",
  "shock",
  "electrocution",
  "crater",
];

const SERIOUS_KEYWORDS = [
  "broken",
  "leaking",
  "damaged",
  "blocked",
  "unsafe",
  "accident",
  "hazard",
  "crack",
  "pothole",
  "garbage",
  "dark",
];

export interface PriorityInput {
  title: string;
  description: string;
  upvoteCount: number;
  createdAt: Date;
}

export interface PriorityResult {
  score: number;
  priority: ComplaintPriority;
}

function getSentimentWeight(text: string): number {
  const normalized = text.toLowerCase();

  if (URGENT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 40;
  }

  if (SERIOUS_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 25;
  }

  return 10;
}

function getSeverityBonus(text: string): number {
  const normalized = text.toLowerCase();
  const keywordMatches = URGENT_KEYWORDS.filter((keyword) => normalized.includes(keyword)).length;
  return Math.min(keywordMatches * 2, 10);
}

export function calculatePriorityScore(complaint: PriorityInput): PriorityResult {
  const text = `${complaint.title} ${complaint.description}`.toLowerCase();
  const sentimentWeight = getSentimentWeight(text);
  const upvoteScore = Math.min((complaint.upvoteCount || 0) * 2, 30);
  const severityBonus = getSeverityBonus(text);
  const days = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / 86400000);
  const ageScore = Math.max(0, days * 5);
  const score = sentimentWeight + upvoteScore + severityBonus + ageScore;

  let priority: ComplaintPriority = "low";

  if (score >= 90) {
    priority = "critical";
  } else if (score >= 61) {
    priority = "high";
  } else if (score >= 31) {
    priority = "medium";
  }

  return { score, priority };
}
