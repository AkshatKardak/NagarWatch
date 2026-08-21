import { Types } from "mongoose";
import Complaint, {
  IComplaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
} from "../models/Complaint";
import Ward, { IWard } from "../models/Ward";
import User, { IUser } from "../models/User";
import Notification from "../models/Notification";
import Contractor from "../models/Contractor";
import { getIO } from "../config/socket";
import { emitToCivicMap, emitToWard, emitToUser } from "../socket/handlers";
import { getSLADeadline } from "./slaService";
import { calculatePriorityScore } from "./priorityService";

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  what3words?: string;
  landmark?: string;
  imageUrl?: string;
  imageUrls?: string[];
  reporterId: string | Types.ObjectId;
}

export async function createComplaint(input: CreateComplaintInput): Promise<any> {
  const hasCoordinates = input.latitude !== 0 || input.longitude !== 0;

  // 1. Assign Ward based on location coordinates if available
  let ward: any = null;
  if (hasCoordinates) {
    ward = await Ward.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [input.longitude, input.latitude],
          },
        },
      },
      isActive: true,
    });
  }

  // 2. Calculate priority score
  const { score, priority } = calculatePriorityScore({
    title: input.title,
    description: input.description,
    upvoteCount: 0,
    createdAt: new Date(),
  });

  // 3. Calculate SLA deadline
  const slaDeadline = getSLADeadline(input.category);
  const imageBefore = input.imageUrl || input.imageUrls?.[0] || "https://placehold.co/600x400?text=Civic+Issue";

  // 4. Create database complaint document
  const complaintDoc = new Complaint({
    title: input.title,
    description: input.description,
    category: input.category as ComplaintCategory,
    status: "pending" as ComplaintStatus,
    priority: priority as ComplaintPriority,
    priorityScore: score,
    location: {
      type: "Point",
      coordinates: hasCoordinates ? [input.longitude, input.latitude] : [0, 0],
      address: input.address,
      what3words: input.what3words || undefined,
      landmark: input.landmark || undefined,
      hasCoordinates,
    },
    images: {
      before: imageBefore,
    },
    submittedBy: input.reporterId,
    ward: ward?._id,
    assignedTo: ward?.assignedAuthorities?.[0] || undefined,
    upvotes: [],
    upvoteCount: 0,
    sla: {
      deadline: slaDeadline,
      breached: false,
      warningEmailSent: false,
      escalationLevel: 0,
      escalationLog: [],
    },
    statusHistory: [
      {
        status: "pending",
        updatedBy: input.reporterId,
        updatedAt: new Date(),
        note: "Complaint submitted",
      },
    ],
  });

  const complaint = await complaintDoc.save();

  // 5. Emit socket events
  try {
    const io = getIO();
    emitToCivicMap(io, "new_complaint", complaint);

    if (ward) {
      emitToWard(io, ward._id.toString(), "new_complaint", complaint);

      if (ward.assignedAuthorities && ward.assignedAuthorities.length > 0) {
        for (const authId of ward.assignedAuthorities) {
          const authUser = await User.findById(authId);
          if (authUser) {
            await Notification.create({
              userId: authUser.clerkId,
              type: "new_complaint",
              complaintId: complaint._id,
              message: `New ${input.category} complaint in ${ward.name}`,
            });
            emitToUser(io, authUser.clerkId, "notification", {
              type: "new_complaint",
              message: `New ${input.category} complaint in ${ward.name}`,
              complaintId: complaint._id,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Socket notification warning on createComplaint:", err);
  }

  return complaint;
}

export async function updateComplaintStatus(
  complaintId: string,
  status: string,
  note?: string,
  userId?: string | Types.ObjectId
): Promise<any> {
  const complaint = await Complaint.findById(complaintId).populate<{ submittedBy: IUser }>("submittedBy");
  if (!complaint) throw new Error("Complaint not found");

  const validTransitions: Record<string, string[]> = {
    pending: ["in_progress", "resolved"],
    in_progress: ["resolved", "pending"],
    resolved: [],
  };

  const allowed = validTransitions[complaint.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Invalid status transition from ${complaint.status} to ${status}`);
  }

  complaint.status = status as ComplaintStatus;
  complaint.statusHistory.push({
    status: status as ComplaintStatus,
    updatedBy: userId ? (userId as any) : complaint.submittedBy._id,
    updatedAt: new Date(),
    note: note || `Status transitioned to ${status}`,
  });

  if (status === "resolved") {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  // Notifications & Socket
  try {
    const io = getIO();
    const subUser = complaint.submittedBy as any;
    if (subUser?.clerkId) {
      await Notification.create({
        userId: subUser.clerkId,
        type: "status_update",
        complaintId: complaint._id,
        message: `Your complaint "${complaint.title}" status has been updated to ${status}.`,
      });

      emitToUser(io, subUser.clerkId, "status_update", {
        complaintId: complaint._id,
        status,
        note,
      });
    }

    if (complaint.ward) {
      emitToWard(io, complaint.ward.toString(), "complaint_updated", complaint);
    }
    emitToCivicMap(io, "complaint_updated", complaint);
  } catch (err) {
    console.warn("Socket emit warning in updateComplaintStatus:", err);
  }

  return complaint;
}

export async function resolveComplaint(
  complaintId: string,
  afterImageUrl?: string,
  resolutionNote?: string,
  resolvedBy?: string | Types.ObjectId
): Promise<any> {
  const complaint = await Complaint.findById(complaintId).populate<{ submittedBy: IUser }>("submittedBy");
  if (!complaint) throw new Error("Complaint not found");

  complaint.status = "resolved";
  complaint.resolvedAt = new Date();
  if (resolutionNote) {
    complaint.resolutionNote = resolutionNote;
  }
  if (afterImageUrl) {
    complaint.images.after = afterImageUrl;
  }

  complaint.statusHistory.push({
    status: "resolved",
    updatedBy: resolvedBy ? (resolvedBy as any) : complaint.submittedBy._id,
    updatedAt: new Date(),
    note: resolutionNote || "Complaint successfully resolved on site",
  });

  await complaint.save();

  // If contractor assigned, update contractor metrics
  if (complaint.assignedContractor) {
    try {
      const contractor = await Contractor.findById(complaint.assignedContractor);
      if (contractor) {
        contractor.totalResolved += 1;
        const wasOnTime = new Date() <= new Date(complaint.sla.deadline);
        if (wasOnTime) {
          contractor.onTimeResolutions += 1;
        } else {
          contractor.slaBreaches += 1;
        }
        await contractor.save();
      }
    } catch (e) {
      console.warn("Contractor metric update error:", e);
    }
  }

  try {
    const io = getIO();
    const subUser = complaint.submittedBy as any;
    if (subUser?.clerkId) {
      await Notification.create({
        userId: subUser.clerkId,
        type: "resolution",
        complaintId: complaint._id,
        message: `Your complaint "${complaint.title}" has been resolved! Please rate the service.`,
      });

      emitToUser(io, subUser.clerkId, "complaint_resolved", complaint);
    }

    if (complaint.ward) {
      emitToWard(io, complaint.ward.toString(), "complaint_updated", complaint);
    }
    emitToCivicMap(io, "complaint_updated", complaint);
  } catch (err) {
    console.warn("Socket notification warning on resolveComplaint:", err);
  }

  return complaint;
}

export async function getComplaintsByWard(wardId: string, status?: string): Promise<any[]> {
  const query: any = { ward: wardId };
  if (status && status !== "all") {
    query.status = status;
  }

  return Complaint.find(query)
    .sort({ priorityScore: -1, createdAt: -1 })
    .populate("submittedBy", "name email")
    .populate("assignedTo", "name email")
    .populate("assignedContractor", "name department ratingAvg")
    .lean();
}

export async function getComplaintById(complaintId: string): Promise<any> {
  const complaint = await Complaint.findById(complaintId)
    .populate("submittedBy", "name email clerkId")
    .populate("assignedTo", "name email")
    .populate("assignedContractor", "name department ratingAvg contactPhone")
    .populate("ward", "name city")
    .populate("statusHistory.updatedBy", "name");

  if (!complaint) throw new Error("Complaint not found");
  return complaint;
}

export async function upvoteComplaint(
  complaintId: string,
  userId: string | Types.ObjectId
): Promise<{ upvoteCount: number; hasUpvoted: boolean }> {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new Error("Complaint not found");

  const userObjectId = new Types.ObjectId(userId.toString());
  const existingIndex = complaint.upvotes.findIndex((id) => id.equals(userObjectId));

  let hasUpvoted: boolean;
  if (existingIndex > -1) {
    complaint.upvotes.splice(existingIndex, 1);
    complaint.upvoteCount = Math.max(0, complaint.upvoteCount - 1);
    hasUpvoted = false;
  } else {
    complaint.upvotes.push(userObjectId);
    complaint.upvoteCount += 1;
    hasUpvoted = true;
  }

  const { score, priority } = calculatePriorityScore({
    title: complaint.title,
    description: complaint.description,
    upvoteCount: complaint.upvoteCount,
    createdAt: complaint.createdAt,
  });

  complaint.priorityScore = score;
  complaint.priority = priority as ComplaintPriority;
  await complaint.save();

  try {
    const io = getIO();
    emitToCivicMap(io, "complaint_upvoted", {
      complaintId: complaint._id,
      upvoteCount: complaint.upvoteCount,
      priorityScore: complaint.priorityScore,
    });
  } catch (err) {
    console.warn("Socket emit warning on upvoteComplaint:", err);
  }

  return { upvoteCount: complaint.upvoteCount, hasUpvoted };
}
