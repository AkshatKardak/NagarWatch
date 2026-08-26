import { Types } from "mongoose";
import Complaint, { IComplaint } from "../../models/Complaint";
import Notification from "../../models/Notification";
import User from "../../models/User";
import { getIO } from "../../config/socket";
import { sendResolutionEmail } from "../emailService";
import { getSingleContractorPerformance } from "../analytics/contractorPerformance.service";

export interface SubmitResolutionProofParams {
  complaintId: string;
  afterImageUrl: string;
  note?: string;
  userId?: Types.ObjectId;
}

export interface VerifyResolutionParams {
  complaintId: string;
  userId: Types.ObjectId;
}

export interface ReopenComplaintParams {
  complaintId: string;
  userId: Types.ObjectId;
  rejectionReason: string;
  comment?: string;
}

export async function submitResolutionProof(
  params: SubmitResolutionProofParams
): Promise<IComplaint> {
  const { complaintId, afterImageUrl, note = "Resolution work completed on site", userId } = params;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error("Complaint not found");
  }

  const beforeImage = complaint.images?.before || "";

  // 1. Update images & resolution proof
  if (!complaint.images) complaint.images = { before: beforeImage };
  complaint.images.after = afterImageUrl;

  complaint.resolutionProof = {
    beforeImage,
    afterImage: afterImageUrl,
    uploadedAt: new Date(),
    uploadedBy: userId as any,
  };

  // 2. Set status to AWAITING_CITIZEN_VERIFICATION
  complaint.status = "awaiting_citizen_verification";
  complaint.resolutionNote = note;

  complaint.verification = {
    status: "PENDING",
  };

  // 3. Track resolution attempt history
  if (!complaint.resolutionAttempts) complaint.resolutionAttempts = [];
  const attemptNumber = complaint.resolutionAttempts.length + 1;
  complaint.resolutionAttempts.push({
    attemptNumber,
    afterImage: afterImageUrl,
    uploadedBy: userId as any,
    uploadedAt: new Date(),
    verificationStatus: "PENDING",
  });

  // 4. Status History
  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: "awaiting_citizen_verification",
    updatedBy: userId as any,
    updatedAt: new Date(),
    note: `Resolution proof submitted (Attempt #${attemptNumber}): ${note}`,
  });

  await complaint.save();

  // 5. Notify citizen submitter
  const submitter = await User.findById(complaint.submittedBy).lean();
  if (submitter?.clerkId) {
    await Notification.create({
      userId: submitter.clerkId,
      type: "resolution",
      message: `Resolution proof submitted for "${complaint.title}". Please verify if the issue is resolved!`,
      complaintId: complaint._id,
    });
  }

  // 6. Broadcast Real-time Socket.IO Events
  try {
    const io = getIO();
    io.to("civic-map").emit("resolution_submitted", {
      complaintId: complaint._id,
      attemptNumber,
      status: "awaiting_citizen_verification",
    });
    io.to("civic-map").emit("verification_requested", {
      complaintId: complaint._id,
      citizenId: complaint.submittedBy,
    });
    io.to("civic-map").emit("complaint:updated", complaint);
  } catch (socketErr) {
    console.warn("Socket broadcast error:", socketErr);
  }

  return complaint;
}

export async function verifyCitizenResolution(
  params: VerifyResolutionParams
): Promise<IComplaint> {
  const { complaintId, userId } = params;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // 1. Mark as verified resolved
  complaint.status = "verified_resolved";
  complaint.resolvedAt = new Date();

  complaint.verification = {
    status: "VERIFIED",
    verifiedBy: userId,
    verifiedAt: new Date(),
  };

  // Update latest resolution attempt
  if (complaint.resolutionAttempts && complaint.resolutionAttempts.length > 0) {
    const lastAttempt = complaint.resolutionAttempts[complaint.resolutionAttempts.length - 1];
    if (lastAttempt) {
      lastAttempt.verificationStatus = "VERIFIED";
    }
  }

  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: "verified_resolved",
    updatedBy: userId,
    updatedAt: new Date(),
    note: "Citizen verified and confirmed satisfactory resolution.",
  });

  await complaint.save();

  // 2. Update contractor performance metrics in background
  if (complaint.assignedContractor) {
    void getSingleContractorPerformance(complaint.assignedContractor.toString()).catch(() => {});
  }

  // 3. Send email confirmation if available
  const submitter = await User.findById(complaint.submittedBy).lean();
  if (submitter?.email) {
    void sendResolutionEmail(submitter.email, {
      id: complaint._id.toString(),
      title: complaint.title,
      resolvedAt: complaint.resolvedAt,
    }).catch(() => {});
  }

  // 4. Broadcast Real-time Socket.IO Events
  try {
    const io = getIO();
    io.to("civic-map").emit("complaint_verified", {
      complaintId: complaint._id,
      status: "verified_resolved",
    });
    io.to("civic-map").emit("complaint:resolved", {
      complaintId: complaint._id,
    });
    io.to("civic-map").emit("complaint:updated", complaint);
  } catch {}

  return complaint;
}

export async function reopenComplaint(
  params: ReopenComplaintParams
): Promise<IComplaint> {
  const { complaintId, userId, rejectionReason, comment = "" } = params;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // 1. Reopen complaint
  complaint.status = "reopened";
  complaint.verification = {
    status: "REJECTED",
    verifiedBy: userId,
    verifiedAt: new Date(),
    rejectionReason: `${rejectionReason}${comment ? `: ${comment}` : ""}`,
  };

  // Update latest resolution attempt
  if (complaint.resolutionAttempts && complaint.resolutionAttempts.length > 0) {
    const lastAttempt = complaint.resolutionAttempts[complaint.resolutionAttempts.length - 1];
    if (lastAttempt) {
      lastAttempt.verificationStatus = "REJECTED";
    }
  }

  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: "reopened",
    updatedBy: userId,
    updatedAt: new Date(),
    note: `Citizen rejected resolution. Reason: ${rejectionReason}. ${comment}`,
  });

  await complaint.save();

  // 2. Notify assigned contractor and authority
  if (complaint.assignedContractor) {
    void getSingleContractorPerformance(complaint.assignedContractor.toString()).catch(() => {});
  }

  // 3. Broadcast Real-time Socket.IO Events
  try {
    const io = getIO();
    io.to("civic-map").emit("complaint_reopened", {
      complaintId: complaint._id,
      status: "reopened",
      reason: rejectionReason,
    });
    io.to("civic-map").emit("complaint:updated", complaint);
  } catch {}

  return complaint;
}
