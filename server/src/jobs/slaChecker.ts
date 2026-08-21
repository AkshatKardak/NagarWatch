import Complaint from "../models/Complaint";
import Notification from "../models/Notification";
import { checkAndEscalate } from "../services/slaService";

export async function runSLACheck(): Promise<void> {
  try {
    const overdueComplaints = await Complaint.find({
      status: { $ne: "resolved" },
      "sla.deadline": { $lt: new Date() },
      "sla.breached": false,
    });

    console.log(`[SLAChecker] Checking ${overdueComplaints.length} overdue complaints`);

    for (const complaint of overdueComplaints) {
      await checkAndEscalate(complaint._id.toString());
    }
  } catch (error) {
    console.error("[SLAChecker] Error executing SLA check:", error);
  }
}

export function startSLAChecker(intervalMs = 60000): NodeJS.Timeout {
  console.log("⏱️ SLA Checker job started");
  return setInterval(runSLACheck, intervalMs);
}

export default { runSLACheck, startSLAChecker };
