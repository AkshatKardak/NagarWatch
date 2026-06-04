import { Complaint, type IComplaint } from "../models/Complaint";
import { Notification } from "../models/Notification";
import type { IUser } from "../models/User";
import { getIO } from "../socket";
import { sendEscalationEmail } from "./emailService";

const SLA_HOURS: Record<string, number> = {
  water: 24,
  pothole: 72,
  garbage: 48,
  streetlight: 48,
  road: 72,
  drainage: 48,
  other: 72,
};

type EscalationComplaint = Omit<IComplaint, "submittedBy" | "assignedTo"> & {
  submittedBy: IUser;
  assignedTo?: IUser;
};

export function getSLADeadline(category: string): Date {
  const hours = SLA_HOURS[category] ?? 72;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export function getSLAWarningDelay(category: string): number {
  return (SLA_HOURS[category] ?? 72) * 0.8 * 3600 * 1000;
}

export function getSLABreachDelay(category: string): number {
  return (SLA_HOURS[category] ?? 72) * 3600 * 1000;
}

export async function checkAndEscalate(complaintId: string): Promise<void> {
  const complaint = await Complaint.findById(complaintId)
    .populate<{ submittedBy: IUser }>("submittedBy")
    .populate<{ assignedTo?: IUser }>("assignedTo");

  const populatedComplaint = complaint as EscalationComplaint & { save: () => Promise<IComplaint> } | null;

  if (!populatedComplaint || populatedComplaint.status === "resolved") {
    console.log(`SLA escalation skipped for complaint ${complaintId}`);
    return;
  }

  if (Date.now() <= populatedComplaint.sla.deadline.getTime()) {
    console.log(`SLA deadline not breached for complaint ${complaintId}`);
    return;
  }

  const newLevel = Math.min(populatedComplaint.sla.escalationLevel + 1, 2);
  populatedComplaint.sla.escalationLevel = newLevel;
  populatedComplaint.sla.breached = true;
  populatedComplaint.sla.escalationLog.push({
    level: newLevel,
    escalatedAt: new Date(),
    reason: "SLA deadline breached - auto-escalated",
  });

  await populatedComplaint.save();

  const io = getIO();
  io.emit("complaint_escalated", {
    complaintId,
    escalationLevel: newLevel,
    title: populatedComplaint.title,
  });

  await Notification.create({
    userId: populatedComplaint.submittedBy.clerkId,
    type: "escalation",
    message: `Your complaint "${populatedComplaint.title}" has been escalated to level ${newLevel}`,
    complaintId: populatedComplaint._id,
  });

  await sendEscalationEmail(
    populatedComplaint.assignedTo?.email || process.env.EMAIL_USER || "",
    {
      id: complaintId,
      title: populatedComplaint.title,
      location: populatedComplaint.location.address,
    },
    newLevel
  );

  console.log(`Complaint ${complaintId} escalated to level ${newLevel}`);
}
