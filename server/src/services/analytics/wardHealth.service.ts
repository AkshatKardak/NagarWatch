import { Types } from "mongoose";
import Ward from "../../models/Ward";
import Complaint from "../../models/Complaint";
import { redis } from "../../config/redis";

export interface WardHealthConfig {
  weights: {
    resolutionRate: number; // 0.30
    slaCompliance: number; // 0.25
    resolutionSpeed: number; // 0.15
    lowPendingRatio: number; // 0.15
    lowReopeningRatio: number; // 0.10
    lowCriticalRatio: number; // 0.05
  };
}

export const DEFAULT_WARD_HEALTH_CONFIG: WardHealthConfig = {
  weights: {
    resolutionRate: 0.3,
    slaCompliance: 0.25,
    resolutionSpeed: 0.15,
    lowPendingRatio: 0.15,
    lowReopeningRatio: 0.1,
    lowCriticalRatio: 0.05,
  },
};

export interface WardHealthBreakdown {
  wardId: string;
  wardName: string;
  city: string;
  healthScore: number;
  resolutionRate: number;
  slaCompliance: number;
  averageResolutionHours: number;
  totalComplaints: number;
  pendingComplaints: number;
  criticalComplaints: number;
  reopenedComplaints: number;
  topCategories: { category: string; count: number }[];
  explanation: {
    positives: string[];
    needsAttention: string[];
  };
}

const memoryCache = new Map<string, { exp: number; data: any }>();

export async function calculateAllWardsHealth(
  config: WardHealthConfig = DEFAULT_WARD_HEALTH_CONFIG
): Promise<WardHealthBreakdown[]> {
  const cacheKey = "analytics:wards:health:all";

  try {
    if (redis && redis.isConnected) {
      const cached = await redis.get<WardHealthBreakdown[]>(cacheKey);
      if (cached) return cached;
    } else {
      const mem = memoryCache.get(cacheKey);
      if (mem && mem.exp > Date.now()) return mem.data;
    }
  } catch {}

  const wards = await Ward.find({ isActive: true }).lean();
  const results: WardHealthBreakdown[] = [];

  for (const ward of wards) {
    const wardBreakdown = await calculateSingleWardHealth(ward._id.toString(), config, ward);
    results.push(wardBreakdown);
  }

  // Sort by healthScore descending
  results.sort((a, b) => b.healthScore - a.healthScore);

  try {
    if (redis && redis.isConnected) {
      await redis.set(cacheKey, results, { ex: 300 });
    } else {
      memoryCache.set(cacheKey, { exp: Date.now() + 300_000, data: results });
    }
  } catch {}

  return results;
}

export async function calculateSingleWardHealth(
  wardId: string,
  config: WardHealthConfig = DEFAULT_WARD_HEALTH_CONFIG,
  preloadedWard?: any
): Promise<WardHealthBreakdown> {
  const cacheKey = `analytics:ward:health:${wardId}`;

  try {
    if (redis && redis.isConnected) {
      const cached = await redis.get<WardHealthBreakdown>(cacheKey);
      if (cached) return cached;
    }
  } catch {}

  const ward = preloadedWard || (await Ward.findById(wardId).lean());
  const wardName = ward?.name || `Ward ${wardId.slice(-4)}`;
  const city = ward?.city || "Mumbai";

  const matchStage: any = { ward: new Types.ObjectId(wardId) };

  // Aggregate metrics for this ward from actual MongoDB complaints
  const [
    totalComplaints,
    resolvedComplaints,
    inProgressComplaints,
    pendingComplaints,
    slaBreachedComplaints,
    criticalComplaints,
    reopenedComplaints,
    resolvedDocs,
    categoryBreakdown,
  ] = await Promise.all([
    Complaint.countDocuments(matchStage),
    Complaint.countDocuments({
      ...matchStage,
      status: { $in: ["resolved", "verified_resolved"] },
    }),
    Complaint.countDocuments({ ...matchStage, status: "in_progress" }),
    Complaint.countDocuments({
      ...matchStage,
      status: { $in: ["pending", "resolution_submitted", "awaiting_citizen_verification"] },
    }),
    Complaint.countDocuments({ ...matchStage, "sla.breached": true }),
    Complaint.countDocuments({ ...matchStage, priority: "critical" }),
    Complaint.countDocuments({ ...matchStage, status: "reopened" }),
    Complaint.find({
      ...matchStage,
      status: { $in: ["resolved", "verified_resolved"] },
      resolvedAt: { $exists: true },
    })
      .select("createdAt resolvedAt")
      .limit(100)
      .lean(),
    Complaint.aggregate([
      { $match: matchStage },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]),
  ]);

  // Calculations
  const resolutionRate =
    totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

  const slaCompliance =
    totalComplaints > 0
      ? Math.max(0, Math.round(((totalComplaints - slaBreachedComplaints) / totalComplaints) * 100))
      : 100;

  // Average resolution time in hours
  let averageResolutionHours = 24;
  if (resolvedDocs.length > 0) {
    const totalHours = resolvedDocs.reduce((acc, doc) => {
      if (doc.resolvedAt && doc.createdAt) {
        const diffMs = new Date(doc.resolvedAt).getTime() - new Date(doc.createdAt).getTime();
        return acc + Math.max(1, diffMs / (1000 * 60 * 60));
      }
      return acc + 24;
    }, 0);
    averageResolutionHours = Math.round(totalHours / resolvedDocs.length);
  }

  // Speed score (benchmark: <= 24 hrs = 100, 72 hrs = 60, 168 hrs = 20)
  const speedScore = Math.max(10, Math.min(100, Math.round(100 - (averageResolutionHours / 72) * 40)));

  // Low pending ratio score (100 - (pending / total * 100))
  const lowPendingRatioScore =
    totalComplaints > 0
      ? Math.max(0, Math.round(100 - (pendingComplaints / totalComplaints) * 100))
      : 100;

  // Low reopening ratio score (100 - (reopened / total * 100))
  const lowReopeningRatioScore =
    totalComplaints > 0
      ? Math.max(0, Math.round(100 - (reopenedComplaints / totalComplaints) * 100 * 5))
      : 100;

  // Low critical ratio score (100 - (critical / total * 100))
  const lowCriticalRatioScore =
    totalComplaints > 0
      ? Math.max(0, Math.round(100 - (criticalComplaints / totalComplaints) * 100 * 2))
      : 100;

  // Weighted Health Score Formula
  const rawScore =
    resolutionRate * config.weights.resolutionRate +
    slaCompliance * config.weights.slaCompliance +
    speedScore * config.weights.resolutionSpeed +
    lowPendingRatioScore * config.weights.lowPendingRatio +
    lowReopeningRatioScore * config.weights.lowReopeningRatio +
    lowCriticalRatioScore * config.weights.lowCriticalRatio;

  const healthScore = Math.max(10, Math.min(100, Math.round(rawScore)));

  // "Why this score?" Explanation Logic
  const positives: string[] = [];
  const needsAttention: string[] = [];

  if (resolutionRate >= 75) positives.push(`Strong Resolution Rate: ${resolutionRate}% of issues resolved`);
  else needsAttention.push(`Low Resolution Rate: Only ${resolutionRate}% resolved`);

  if (slaCompliance >= 80) positives.push(`High SLA Compliance: ${slaCompliance}% completed within charter deadline`);
  else needsAttention.push(`SLA Breaches: ${slaBreachedComplaints} overdue complaints (${slaCompliance}% compliance)`);

  if (averageResolutionHours <= 36) positives.push(`Rapid Response: Average turnaround of ${averageResolutionHours} hours`);
  else needsAttention.push(`Slow Turnaround: Average resolution takes ${averageResolutionHours} hours`);

  if (pendingComplaints > 15) needsAttention.push(`Backlog Pressure: ${pendingComplaints} pending grievances awaiting triage`);
  if (criticalComplaints > 0) needsAttention.push(`Hazard Alerts: ${criticalComplaints} critical priority issues open`);
  if (reopenedComplaints > 0) needsAttention.push(`Quality Verification: ${reopenedComplaints} complaints reopened by citizens`);

  if (positives.length === 0) positives.push("Baseline civic monitoring active across all ward zones.");

  const topCategories = categoryBreakdown.map((c) => ({
    category: c._id || "Other",
    count: c.count,
  }));

  const result: WardHealthBreakdown = {
    wardId,
    wardName,
    city,
    healthScore,
    resolutionRate,
    slaCompliance,
    averageResolutionHours,
    totalComplaints,
    pendingComplaints,
    criticalComplaints,
    reopenedComplaints,
    topCategories,
    explanation: {
      positives,
      needsAttention,
    },
  };

  try {
    if (redis && redis.isConnected) {
      await redis.set(cacheKey, result, { ex: 300 });
    }
  } catch {}

  return result;
}
