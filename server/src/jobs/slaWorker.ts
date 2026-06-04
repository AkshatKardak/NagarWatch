import { Worker, type ConnectionOptions, type Job } from "bullmq";
import redisClient from "../config/redis";
import { Complaint } from "../models/Complaint";
import type { IUser } from "../models/User";
import { sendSLAWarning } from "../services/emailService";
import { checkAndEscalate } from "../services/slaService";

interface SLAJobData {
  complaintId: string;
  type: "sla_warning" | "sla_breach";
}

let workerStarted = false;

export function initWorkers(): void {
  if (workerStarted) {
    console.log("SLA workers already initialized");
    return;
  }

  if (redisClient.isConnected === false) {
    console.log("SLA workers not started - Redis unavailable. SLA enforcement disabled.");
    return;
  }

  const bullConnection = redisClient as unknown as ConnectionOptions;

  const worker = new Worker<SLAJobData, void, "sla_warning" | "sla_breach">(
    "sla-checks",
    async (job: Job<SLAJobData>) => {
      const { complaintId, type } = job.data;
      console.log(`Processing SLA job: ${type} for complaint ${complaintId}`);

      if (type === "sla_warning") {
        const complaint = await Complaint.findById(complaintId)
          .populate<{ assignedTo?: IUser }>("assignedTo")
          .lean();

        if (complaint && complaint.status !== "resolved" && !complaint.sla.warningEmailSent) {
          await sendSLAWarning(complaint.assignedTo?.email || process.env.EMAIL_USER || "", {
            id: complaintId,
            title: complaint.title,
            category: complaint.category,
            deadline: complaint.sla.deadline,
          });
          await Complaint.findByIdAndUpdate(complaintId, { "sla.warningEmailSent": true });
          console.log(`SLA warning sent for complaint ${complaintId}`);
        }
      }

      if (type === "sla_breach") {
        await checkAndEscalate(complaintId);
      }
    },
    { connection: bullConnection }
  );

  worker.on("completed", (job) => console.log(`SLA job ${job.id} completed`));
  worker.on("failed", (job, err) =>
    console.error(`SLA job ${job?.id || "unknown"} failed: ${err.message}`)
  );

  workerStarted = true;
  console.log("SLA workers initialized");
}
