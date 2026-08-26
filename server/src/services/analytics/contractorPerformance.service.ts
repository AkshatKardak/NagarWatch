import { Types } from "mongoose";
import Contractor, { IContractor } from "../../models/Contractor";
import Complaint from "../../models/Complaint";
import { redis } from "../../config/redis";

export interface ContractorPerformanceMetric {
  id: string;
  name: string;
  department: string;
  class?: string;
  category?: string;
  state?: string;
  isVerified: boolean;
  isBlacklisted: boolean;
  jobsAssigned: number;
  jobsCompleted: number;
  onTimeRate: number;
  averageResolutionHours: number;
  slaBreaches: number;
  reopenedJobs: number;
  verificationRate: number;
  performanceScore: number;
}

export function computeDeterministicPerformanceScore(metrics: {
  jobsAssigned: number;
  jobsCompleted: number;
  onTimeCompletions: number;
  slaBreaches: number;
  reopenedJobs: number;
  averageResolutionHours: number;
}): number {
  const {
    jobsAssigned,
    jobsCompleted,
    onTimeCompletions,
    slaBreaches,
    reopenedJobs,
    averageResolutionHours,
  } = metrics;

  if (jobsAssigned === 0) {
    return 75; // Neutral baseline score for newly enlisted contractors
  }

  const safeCompleted = Math.max(1, jobsCompleted);
  const onTimeRatio = Math.min(1, Math.max(0, onTimeCompletions / safeCompleted));
  const slaComplianceRatio = Math.min(1, Math.max(0, 1 - slaBreaches / jobsAssigned));
  const qualityVerificationRatio = Math.min(1, Math.max(0, 1 - reopenedJobs / safeCompleted));
  const completionRatio = Math.min(1, Math.max(0, jobsCompleted / jobsAssigned));
  const speedRatio = 1 / (1 + Math.max(0, averageResolutionHours) / 100);

  const score =
    onTimeRatio * 30 +
    slaComplianceRatio * 25 +
    qualityVerificationRatio * 20 +
    completionRatio * 15 +
    speedRatio * 10;

  return Math.max(10, Math.min(100, Math.round(score)));
}

export async function getAllContractorPerformance(): Promise<ContractorPerformanceMetric[]> {
  const cacheKey = "analytics:contractors:all";

  try {
    if (redis && redis.isConnected) {
      const cached = await redis.get<ContractorPerformanceMetric[]>(cacheKey);
      if (cached) return cached;
    }
  } catch {}

  const contractors = await Contractor.find({ isActive: true }).lean();
  const results: ContractorPerformanceMetric[] = [];

  for (const c of contractors) {
    const metric = await getSingleContractorPerformance(c._id.toString(), c);
    results.push(metric);
  }

  // Sort by performanceScore descending
  results.sort((a, b) => b.performanceScore - a.performanceScore);

  try {
    if (redis && redis.isConnected) {
      await redis.set(cacheKey, results, { ex: 3600 });
    }
  } catch {}

  return results;
}

export async function getSingleContractorPerformance(
  contractorId: string,
  preloadedContractor?: any
): Promise<ContractorPerformanceMetric> {
  const cacheKey = `analytics:contractor:${contractorId}`;

  try {
    if (redis && redis.isConnected) {
      const cached = await redis.get<ContractorPerformanceMetric>(cacheKey);
      if (cached) return cached;
    }
  } catch {}

  const contractor = preloadedContractor || (await Contractor.findById(contractorId).lean());
  if (!contractor) {
    throw new Error("Contractor not found");
  }

  const matchStage = { assignedContractor: new Types.ObjectId(contractorId) };

  const [
    assignedCount,
    completedCount,
    breachedCount,
    reopenedCount,
    verifiedCount,
    resolvedDocs,
  ] = await Promise.all([
    Complaint.countDocuments(matchStage),
    Complaint.countDocuments({
      ...matchStage,
      status: { $in: ["resolved", "verified_resolved"] },
    }),
    Complaint.countDocuments({ ...matchStage, "sla.breached": true }),
    Complaint.countDocuments({ ...matchStage, status: "reopened" }),
    Complaint.countDocuments({ ...matchStage, status: "verified_resolved" }),
    Complaint.find({
      ...matchStage,
      status: { $in: ["resolved", "verified_resolved"] },
      resolvedAt: { $exists: true },
    })
      .select("createdAt resolvedAt")
      .limit(100)
      .lean(),
  ]);

  // Combine live DB metrics with existing contractor seed numbers
  const jobsAssigned = Math.max(contractor.totalAssigned || 0, assignedCount);
  const jobsCompleted = Math.max(contractor.totalResolved || 0, completedCount);
  const onTimeCompletions = Math.max(
    contractor.onTimeResolutions || Math.max(0, jobsCompleted - breachedCount),
    0
  );
  const slaBreaches = Math.max(contractor.slaBreaches || 0, breachedCount);
  const reopenedJobs = Math.max(contractor.performanceMetrics?.reopenedJobs || 0, reopenedCount);

  let averageResolutionHours = 28;
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

  const onTimeRate =
    jobsCompleted > 0 ? Math.round((onTimeCompletions / jobsCompleted) * 100) : 90;

  const verificationRate =
    jobsCompleted > 0 ? Math.round((Math.max(1, verifiedCount) / jobsCompleted) * 100) : 95;

  const performanceScore = computeDeterministicPerformanceScore({
    jobsAssigned,
    jobsCompleted,
    onTimeCompletions,
    slaBreaches,
    reopenedJobs,
    averageResolutionHours,
  });

  // Update Contractor model performanceMetrics
  await Contractor.findByIdAndUpdate(contractorId, {
    $set: {
      "performanceMetrics.jobsAssigned": jobsAssigned,
      "performanceMetrics.jobsCompleted": jobsCompleted,
      "performanceMetrics.onTimeCompletions": onTimeCompletions,
      "performanceMetrics.slaBreaches": slaBreaches,
      "performanceMetrics.reopenedJobs": reopenedJobs,
      "performanceMetrics.averageResolutionHours": averageResolutionHours,
      "performanceMetrics.performanceScore": performanceScore,
    },
  }).catch(() => {});

  const metric: ContractorPerformanceMetric = {
    id: contractor._id.toString(),
    name: contractor.name,
    department: contractor.department || "General",
    class: contractor.class || contractor.cpwdRegistration?.class || "Class I",
    category: contractor.category || contractor.cpwdRegistration?.category || "Buildings & Roads",
    state: contractor.state || "Maharashtra",
    isVerified: Boolean(contractor.verificationDetails?.isVerified),
    isBlacklisted: Boolean(contractor.blacklistStatus?.isBlacklisted),
    jobsAssigned,
    jobsCompleted,
    onTimeRate,
    averageResolutionHours,
    slaBreaches,
    reopenedJobs,
    verificationRate: Math.min(100, verificationRate),
    performanceScore,
  };

  try {
    if (redis && redis.isConnected) {
      await redis.set(cacheKey, metric, { ex: 3600 });
    }
  } catch {}

  return metric;
}
