import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { PipelineStage, PopulateOptions, Types } from "mongoose";
import { Complaint, type ComplaintCategory, type ComplaintStatus, type IComplaint } from "../models/Complaint";
import { Notification } from "../models/Notification";
import { User, type IUser } from "../models/User";
import { uploadImage } from "../config/cloudinary";
import { requireAuth, attachUser, requireRole } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";
import { addSLAJob } from "../jobs/slaQueue";
import { calculatePriorityScore } from "../services/priorityService";
import { assignWardToComplaint, findNearbyComplaints } from "../services/geoService";
import { getSLADeadline } from "../services/slaService";
import { sendResolutionEmail } from "../services/emailService";
import { getIO } from "../socket";

const router = Router();

const validCategories = new Set<ComplaintCategory>([
  "pothole",
  "garbage",
  "water",
  "streetlight",
  "road",
  "drainage",
  "other",
]);

const validStatuses = new Set<ComplaintStatus>(["pending", "in_progress", "resolved"]);

interface CreateComplaintBody {
  title?: string;
  description?: string;
  category?: string;
  lat?: string;
  lng?: string;
  address?: string;
  forceCreate?: string;
}

interface StatusBody {
  status?: string;
  note?: string;
}

interface ResolveBody {
  resolutionNote?: string;
}

interface AnalyticsResult {
  byCategory: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byWard: { _id: Types.ObjectId | null; count: number; wardName?: string }[];
  avgResolutionHours: number;
  slaBreachRate: { total: number; breached: number; percentage: number };
  dailyTrend: { _id: string; count: number }[];
}

interface ComplaintFilter {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  ward?: string;
}
type ComplaintListItem = IComplaint & { distance?: number };

const complaintPopulate: PopulateOptions[] = [
  { path: "submittedBy", select: "name email" },
  { path: "ward", select: "name" },
  { path: "assignedTo", select: "name" },
];

function parseNumber(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = parseNumber(value);
  const integer = parsed ? Math.max(1, Math.floor(parsed)) : fallback;
  return max ? Math.min(integer, max) : integer;
}

function isCategory(value: string): value is ComplaintCategory {
  return validCategories.has(value as ComplaintCategory);
}

function isStatus(value: string): value is ComplaintStatus {
  return validStatuses.has(value as ComplaintStatus);
}

function buildComplaintFilter(query: Request["query"]): ComplaintFilter {
  const filter: ComplaintFilter = {};

  if (typeof query.status === "string" && isStatus(query.status)) {
    filter.status = query.status;
  }

  if (typeof query.category === "string" && isCategory(query.category)) {
    filter.category = query.category;
  }

  if (typeof query.ward === "string" && query.ward.trim()) {
    filter.ward = query.ward;
  }

  return filter;
}

router.get(
  "/analytics/summary",
  requireAuth,
  attachUser,
  requireRole("admin"),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        byCategory,
        byStatus,
        byWard,
        avgResolution,
        slaCounts,
        dailyTrend,
      ] = await Promise.all([
        Complaint.aggregate<{ _id: string; count: number }>([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate<{ _id: string; count: number }>([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate<{ _id: Types.ObjectId | null; count: number; wardName?: string }>([
          { $group: { _id: "$ward", count: { $sum: 1 } } },
          { $lookup: { from: "wards", localField: "_id", foreignField: "_id", as: "ward" } },
          { $unwind: { path: "$ward", preserveNullAndEmptyArrays: true } },
          { $project: { count: 1, wardName: { $ifNull: ["$ward.name", "Unassigned"] } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate<{ avgResolutionHours: number }>([
          { $match: { status: "resolved", resolvedAt: { $exists: true } } },
          {
            $group: {
              _id: null,
              avgResolutionHours: {
                $avg: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] },
              },
            },
          },
        ]),
        Complaint.aggregate<{ _id: null; total: number; breached: number }>([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              breached: { $sum: { $cond: ["$sla.breached", 1, 0] } },
            },
          },
        ]),
        Complaint.aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const total = slaCounts[0]?.total ?? 0;
      const breached = slaCounts[0]?.breached ?? 0;
      const analytics: AnalyticsResult = {
        byCategory,
        byStatus,
        byWard,
        avgResolutionHours: avgResolution[0]?.avgResolutionHours ?? 0,
        slaBreachRate: {
          total,
          breached,
          percentage: total === 0 ? 0 : Number(((breached / total) * 100).toFixed(2)),
        },
        dailyTrend,
      };

      console.log("Complaint analytics summary generated");
      res.json({ success: true, analytics });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  requireAuth,
  attachUser,
  uploadSingle,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateComplaintBody;
      const lat = parseNumber(body.lat);
      const lng = parseNumber(body.lng);

      if (
        !req.user ||
        !body.title ||
        !body.description ||
        !body.category ||
        !isCategory(body.category) ||
        lat === null ||
        lng === null ||
        !body.address ||
        !req.file
      ) {
        res.status(400).json({
          success: false,
          message: "title, description, category, lat, lng, address, and image are required",
        });
        return;
      }

      // ── Duplicate check BEFORE Cloudinary upload ──────────────────────────
      // Avoids wasting upload quota when a nearby active complaint already exists.
      // The client may pass forceCreate=true (via "Create New Anyway" in the modal)
      // to bypass this gate and proceed with a new submission.
      const nearby = await findNearbyComplaints(lng, lat, 50);
      const forceCreate = body.forceCreate === "true";

      if (nearby.length > 0 && !forceCreate) {
        res.status(200).json({
          success: false,
          duplicate: true,
          nearbyCount: nearby.length,
          nearbyComplaints: nearby,
        });
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const imageUrl = await uploadImage(req.file.buffer, "nagarwatch/complaints");
      const ward = await assignWardToComplaint(lng, lat);
      const deadline = getSLADeadline(body.category);
      const { score, priority } = calculatePriorityScore({
        title: body.title,
        description: body.description,
        upvoteCount: 0,
        createdAt: new Date(),
      });

      const complaint = new Complaint({
        title: body.title,
        description: body.description,
        category: body.category,
        status: "pending",
        priority,
        priorityScore: score,
        location: { type: "Point", coordinates: [lng, lat], address: body.address },
        images: { before: imageUrl },
        submittedBy: req.user._id,
        upvotes: [],
        upvoteCount: 0,
        sla: {
          deadline,
          breached: false,
          warningEmailSent: false,
          escalationLevel: 0,
          escalationLog: [],
        },
        statusHistory: [
          { status: "pending", updatedBy: req.user._id, updatedAt: new Date(), note: "Complaint submitted" },
        ],
      });

      if (ward) {
        complaint.ward = ward._id;
        const assignedAuthority = ward.assignedAuthorities[0];
        if (assignedAuthority) {
          complaint.assignedTo = assignedAuthority;
        }
      }

      await complaint.save();
      await addSLAJob(complaint._id.toString(), body.category);
      getIO().to("civic-map").emit("new_complaint", complaint);

      console.log(`New complaint submitted: ${complaint._id} in ward ${ward?.name || "unassigned"}`);
      res.status(201).json({
        success: true,
        complaint,
        nearbyCount: nearby.length,
        nearbyComplaints: nearby,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20, 50);
    const skip = (page - 1) * limit;
    const filter = buildComplaintFilter(req.query);
    const lat = parseNumber(req.query.lat);
    const lng = parseNumber(req.query.lng);
    const radius = parseNumber(req.query.radius);

    let complaints: ComplaintListItem[];
    let total: number;

    if (lat !== null && lng !== null && radius !== null) {
      const basePipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distance",
            maxDistance: radius,
            spherical: true,
            query: filter,
          },
        },
        { $sort: { priorityScore: -1, createdAt: -1 } },
      ];

      const [items, counts] = await Promise.all([
        Complaint.aggregate<ComplaintListItem>([...basePipeline, { $skip: skip }, { $limit: limit }]),
        Complaint.aggregate<{ count: number }>([...basePipeline, { $count: "count" }]),
      ]);

      complaints = await Complaint.populate(items, complaintPopulate);
      total = counts[0]?.count ?? 0;
    } else {
      const [items, count] = await Promise.all([
        Complaint.find(filter)
          .populate("submittedBy", "name email")
          .populate("ward", "name")
          .populate("assignedTo", "name")
          .sort({ priorityScore: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<ComplaintListItem[]>(),
        Complaint.countDocuments(filter),
      ]);

      complaints = items;
      total = count;
    }

    console.log(`Complaint list returned page ${page} with ${complaints.length} items`);
    res.json({
      success: true,
      complaints,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/nearby", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lat = parseNumber(req.query.lat);
    const lng = parseNumber(req.query.lng);
    const radius = parseNumber(req.query.radius) ?? 50;

    if (lat === null || lng === null) {
      res.status(400).json({ success: false, message: "lat and lng are required" });
      return;
    }

    const complaints = await findNearbyComplaints(lng, lat, radius);

    console.log(`Nearby complaints returned for ${lng},${lat}`);
    res.json({ success: true, complaints, count: complaints.length });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("submittedBy", "name email")
      .populate("ward", "name city")
      .populate("assignedTo", "name email")
      .populate("statusHistory.updatedBy", "name")
      .lean();

    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    console.log(`Complaint ${req.params.id} retrieved`);
    res.json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/status",
  requireAuth,
  attachUser,
  requireRole("authority"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as StatusBody;

      if (!req.user || !body.status || !isStatus(body.status)) {
        res.status(400).json({ success: false, message: "Valid status is required" });
        return;
      }

      if (body.status === "resolved") {
        res.status(400).json({
          success: false,
          message: "Use POST /:id/resolve to close complaint with proof image",
        });
        return;
      }

      const complaint = await Complaint.findById(req.params.id).populate<{ submittedBy: IUser }>("submittedBy");

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (!(complaint.status === "pending" && body.status === "in_progress")) {
        res.status(400).json({ success: false, message: "Invalid status transition" });
        return;
      }

      complaint.status = body.status;
      complaint.statusHistory.push({
        status: body.status,
        updatedBy: req.user._id,
        updatedAt: new Date(),
        note: body.note || "",
      });

      await complaint.save();

      await Notification.create({
        userId: complaint.submittedBy.clerkId,
        type: "status_update",
        message: `Your complaint "${complaint.title}" status updated to ${body.status}`,
        complaintId: complaint._id,
      });

      getIO().to(`user_${complaint.submittedBy.clerkId}`).emit("status_updated", {
        complaintId: req.params.id,
        status: body.status,
        updatedBy: req.user.name,
      });

      console.log(`Complaint ${req.params.id} status updated to ${body.status} by ${req.user.name}`);
      res.json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/upvote",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (complaint.upvotes.some((upvote) => upvote.equals(req.user?._id))) {
        res.status(400).json({ success: false, message: "You have already upvoted this complaint" });
        return;
      }

      complaint.upvotes.push(req.user._id);
      complaint.upvoteCount += 1;

      const { score, priority } = calculatePriorityScore({
        title: complaint.title,
        description: complaint.description,
        upvoteCount: complaint.upvoteCount,
        createdAt: complaint.createdAt,
      });

      complaint.priorityScore = score;
      complaint.priority = priority;
      await complaint.save();

      getIO().to("civic-map").emit("upvote_received", {
        complaintId: req.params.id,
        upvoteCount: complaint.upvoteCount,
        priorityScore: score,
      });

      if ([10, 50, 100].includes(complaint.upvoteCount)) {
        let authority: IUser | null = null;

        if (complaint.assignedTo) {
          authority = await User.findById(complaint.assignedTo).lean<IUser | null>();
        } else if (complaint.ward) {
          authority = await User.findOne({ role: "authority", ward: complaint.ward }).lean<IUser | null>();
        }

        if (authority) {
          await Notification.create({
            userId: authority.clerkId,
            type: "upvote_milestone",
            message: `Complaint "${complaint.title}" has reached ${complaint.upvoteCount} upvotes`,
            complaintId: complaint._id,
          });
        }
      }

      console.log(`Complaint ${req.params.id} upvoted - new score: ${score}`);
      res.json({
        success: true,
        upvoteCount: complaint.upvoteCount,
        priorityScore: score,
        priority,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/resolve",
  requireAuth,
  attachUser,
  requireRole("authority"),
  uploadSingle,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: "After image is required to resolve a complaint" });
        return;
      }

      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (complaint.status === "resolved") {
        res.status(400).json({ success: false, message: "Complaint is already resolved" });
        return;
      }

      const afterImageUrl = await uploadImage(req.file.buffer, "nagarwatch/resolutions");
      complaint.images.after = afterImageUrl;
      complaint.status = "resolved";
      complaint.resolvedAt = new Date();
      complaint.resolutionNote = (req.body as ResolveBody).resolutionNote || "";
      complaint.statusHistory.push({
        status: "resolved",
        updatedBy: req.user._id,
        updatedAt: new Date(),
        note: complaint.resolutionNote,
      });

      await complaint.save();

      const submitter = await User.findById(complaint.submittedBy).lean<IUser | null>();

      if (submitter && complaint.resolvedAt) {
        await sendResolutionEmail(submitter.email, {
          id: complaint._id.toString(),
          title: complaint.title,
          resolvedAt: complaint.resolvedAt,
        });
      }

      getIO().to("civic-map").emit("status_updated", { complaintId: req.params.id, status: "resolved" });

      if (submitter) {
        getIO().to(`user_${submitter.clerkId}`).emit("status_updated", {
          complaintId: req.params.id,
          status: "resolved",
          message: "Your complaint has been resolved!",
        });

        await Notification.create({
          userId: submitter.clerkId,
          type: "resolution",
          message: `Your complaint "${complaint.title}" has been resolved!`,
          complaintId: complaint._id,
        });
      }

      console.log(`Complaint ${req.params.id} resolved by ${req.user.name}`);
      res.json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
