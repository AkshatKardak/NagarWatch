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
  console.warn("SLA queue disabled - Redis TCP (BullMQ) not available");
}

export async function addSLAJob(complaintId: string, category: string): Promise<void> {
  if (!slaQueue) {
    console.log(`[SLA MOCK] Would schedule SLA jobs for complaint ${complaintId}`);
    return;
  }

  const warningDelay = getSLAWarningDelay(category);
  const breachDelay = getSLABreachDelay(category);

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
    `SLA jobs scheduled for complaint ${complaintId} - warning in ${
      warningDelay / 3600000
    }h, breach in ${breachDelay / 3600000}h`
  );
}
