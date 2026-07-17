import { Queue, type ConnectionOptions } from "bullmq";
import { bullRedis } from "../config/redis";
import { getSLABreachDelay, getSLAWarningDelay } from "../services/slaService";

interface SLAJobData {
  complaintId: string;
  type: "sla_warning" | "sla_breach";
}

export const slaQueue = !bullRedis
  ? null
  : new Queue<SLAJobData, void, "sla_warning" | "sla_breach">("sla-checks", {
      connection: bullRedis as unknown as ConnectionOptions,
    });

if (!bullRedis) {
  console.warn(
    "⚠️  SLA queue DISABLED — REDIS_TCP_URL is not set. " +
    "Complaints will be saved but SLA warning/breach jobs will NOT be scheduled. " +
    "Set REDIS_TCP_URL in your .env to enable BullMQ."
  );
}

export async function addSLAJob(complaintId: string, category: string): Promise<void> {
  if (!slaQueue) {
    // Structured warn so log aggregators (Render, Railway, Datadog…) can
    // alert on this pattern instead of silently swallowing the skip.
    console.warn(
      `[SLA SKIP] complaintId=${complaintId} category=${category} — ` +
      "BullMQ unavailable (no REDIS_TCP_URL). SLA deadline will NOT be enforced."
    );
    return;
  }

  const warningDelay = getSLAWarningDelay(category);
  const breachDelay  = getSLABreachDelay(category);

  await slaQueue.add(
    "sla_warning",
    { complaintId, type: "sla_warning" },
    { delay: warningDelay, jobId: `warning_${complaintId}` }
  );
  await slaQueue.add(
    "sla_breach",
    { complaintId, type: "sla_breach" },
    { delay: breachDelay, jobId: `breach_${complaintId}` }
  );

  console.log(
    `✅ SLA jobs scheduled for complaint ${complaintId} — ` +
    `warning in ${warningDelay / 3_600_000}h, breach in ${breachDelay / 3_600_000}h`
  );
}
