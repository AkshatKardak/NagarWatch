import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { PipelineStage, PopulateOptions, Types } from "mongoose";
import {
  Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type ComplaintPriority,
  type IComplaint,
} from "../models/Complaint";
import { Notification } from "../models/Notification";
import { User, type IUser } from "../models/User";
import { Contractor } from "../models/Contractor";
import { uploadImage } from "../config/cloudinary";
import { requireAuth, attachUser, requireRole } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";
import { addSLAJob } from "../jobs/slaQueue";
import { calculatePriorityScore } from "../services/priorityService";
import { assignWardToComplaint, findNearbyComplaints } from "../services/geoService";
import { getSLADeadline } from "../services/slaService";
import { sendResolutionEmail } from "../services/emailService";
import {
  submitResolutionProof,
  verifyCitizenResolution,
  reopenComplaint,
} from "../services/complaints/verification.service";
import { translateText } from "../services/translation/sarvamTranslation.service";
import { getComplaintAssistance } from "../services/ai/gemini.service";
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

const validStatuses = new Set<string>([
  "pending",
  "in_progress",
  "resolution_submitted",
  "awaiting_citizen_verification",
  "verified_resolved",
  "resolved",
  "rejected",
  "escalated",
  "reopened",
]);

interface CreateComplaintBody {
  title?: string;
  description?: string;
  category?: string;
  lat?: string;
  lng?: string;
  address?: string;
  what3words?: string;
  landmark?: string;
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
  byWard: { _id: Types.ObjectId | null; count: number; wardName?: string; breachCount: number }[];
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
  const str = String(value).trim();
  if (str === "") return null;
  const parsed = Number.parseFloat(str);
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
        // Per-ward: total count + real SLA breach count from DB
        Complaint.aggregate<{
          _id: Types.ObjectId | null;
          count: number;
          wardName?: string;
          breachCount: number;
        }>([
          {
            $group: {
              _id: "$ward",
              count: { $sum: 1 },
              breachCount: {
                $sum: { $cond: [{ $eq: ["$sla.breached", true] }, 1, 0] },
              },
            },
          },
          {
            $lookup: {
              from: "wards",
              localField: "_id",
              foreignField: "_id",
              as: "ward",
            },
          },
          { $unwind: { path: "$ward", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              count: 1,
              breachCount: 1,
              wardName: { $ifNull: ["$ward.name", "Unassigned"] },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate<{ avgResolutionHours: number }>([
          { $match: { status: "resolved", resolvedAt: { $exists: true } } },
          {
            $group: {
              _id: null,
              avgResolutionHours: {
                $avg: {
                  $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000],
                },
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
          percentage:
            total === 0
              ? 0
              : Number(((breached / total) * 100).toFixed(2)),
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
      const body = req.body as any;
      const rawLat = body.latitude !== undefined ? body.latitude : body.lat;
      const rawLng = body.longitude !== undefined ? body.longitude : body.lng;
      const lat = parseNumber(rawLat);
      const lng = parseNumber(rawLng);
      const hasCoordinates = lat !== null && lng !== null;

      // Debug logging
      console.log("complaint body", body);
      console.log("complaint file", {
        name: req.file?.originalname,
        type: req.file?.mimetype,
        size: req.file?.size,
      });

      // Required fields: title, description, valid category, address
      if (
        !req.user ||
        !body.title?.trim() ||
        !body.description?.trim() ||
        !body.category ||
        !body.address?.trim()
      ) {
        res.status(400).json({
          success: false,
          error: "title, description, category, and address are required",
          message: "title, description, category, and address are required",
        });
        return;
      }

      // Normalize category (case-insensitive)
      const normalizedCategory = String(body.category).toLowerCase().replace(/ /g, "") as ComplaintCategory;
      const finalCategory = isCategory(normalizedCategory) ? normalizedCategory : "other";

      // Duplicate check when we have GPS coords
      const forceCreate = body.forceCreate === "true";
      if (hasCoordinates && !forceCreate) {
        const nearby = await findNearbyComplaints(lng, lat, 50);
        if (nearby.length > 0) {
          res.status(200).json({
            success: false,
            duplicate: true,
            nearbyCount: nearby.length,
            nearbyComplaints: nearby,
          });
          return;
        }
      }

      let imageUrl = "https://placehold.co/600x400?text=Civic+Issue";
      if (req.file) {
        imageUrl = await uploadImage(
          req.file.buffer,
          "nagarwatch/complaints"
        );
      } else if (body.image && typeof body.image === "string" && body.image.startsWith("http")) {
        imageUrl = body.image;
      }

      const ward = hasCoordinates ? await assignWardToComplaint(lng, lat) : null;
      const deadline = getSLADeadline(finalCategory);
      const { score, priority } = calculatePriorityScore({
        title: body.title,
        description: body.description,
        upvoteCount: 0,
        createdAt: new Date(),
      });

      // Multilingual & AI Assistance enrichment
      const lang = body.language || "en";
      let normTitle = body.title;
      let normDesc = body.description;

      if (lang !== "en" && lang !== "en-IN") {
        try {
          const titleTr = await translateText(body.title, lang, "en-IN");
          const descTr = await translateText(body.description, lang, "en-IN");
          if (titleTr.translatedText) normTitle = titleTr.translatedText;
          if (descTr.translatedText) normDesc = descTr.translatedText;
        } catch {}
      }

      let aiAssistance: {
        suggestedCategory: ComplaintCategory;
        severity: ComplaintPriority;
        department: string;
        confidence: number;
        source: "GEMINI_AI" | "RULE_ENGINE";
      } = {
        suggestedCategory: finalCategory,
        severity: priority,
        department: "General Administration",
        confidence: 0.85,
        source: "RULE_ENGINE",
      };

      try {
        aiAssistance = await getComplaintAssistance(normTitle, normDesc);
      } catch {}

      const complaint = new Complaint({
        title: body.title,
        description: body.description,
        category: finalCategory,
        status: "pending",
        priority,
        priorityScore: score,
        location: {
          type: "Point",
          coordinates: hasCoordinates ? [lng, lat] : [0, 0],
          address: body.address,
          what3words: body.what3words || undefined,
          landmark: body.landmark || undefined,
          hasCoordinates,
        },
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
          {
            status: "pending",
            updatedBy: req.user._id,
            updatedAt: new Date(),
            note: "Complaint submitted",
          },
        ],
        originalContent: {
          language: lang,
          title: body.title,
          description: body.description,
        },
        normalizedContent: {
          language: "en-IN",
          title: normTitle,
          description: normDesc,
        },
        voiceInput: {
          enabled: body.voiceInput === "true" || Boolean(body.voiceTranscript),
          language: lang,
          transcript: body.voiceTranscript || body.description,
        },
        aiRecommendation: {
          category: aiAssistance.suggestedCategory,
          severity: aiAssistance.severity,
          department: aiAssistance.department,
          confidence: aiAssistance.confidence,
          generatedAt: new Date(),
        },
        finalClassification: {
          category: finalCategory,
          priority,
          department: aiAssistance.department,
          source: aiAssistance.source === "GEMINI_AI" ? "AI_RULE_ENGINE" : "MANUAL",
        },
      });

      if (ward) {
        complaint.ward = ward._id;
        const assignedAuthority = ward.assignedAuthorities?.[0];
        if (assignedAuthority) {
          complaint.assignedTo = assignedAuthority;
        }
      }

      await complaint.save();
      try {
        await addSLAJob(complaint._id.toString(), finalCategory);
      } catch {
        // BullMQ queue optional if Redis TCP not configured
      }

      try {
        getIO().to("civic-map").emit("new_complaint", complaint);
        if (ward) {
          getIO().to(`ward:${ward._id}`).emit("new_complaint", complaint);
        }
      } catch {
        // Socket may be offline
      }

      console.log(`New complaint submitted: ${complaint._id}`);
      res.status(201).json({
        success: true,
        complaint,
        nearbyCount: 0,
        nearbyComplaints: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
              query: { ...filter, "location.hasCoordinates": true },
            },
          },
          { $sort: { priorityScore: -1, createdAt: -1 } },
        ];

        const [items, counts] = await Promise.all([
          Complaint.aggregate<ComplaintListItem>([
            ...basePipeline,
            { $skip: skip },
            { $limit: limit },
          ]),
          Complaint.aggregate<{ count: number }>([
            ...basePipeline,
            { $count: "count" },
          ]),
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

      console.log(
        `Complaint list returned page ${page} with ${complaints.length} items`
      );
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
  }
);

router.get(
  "/nearby",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = parseNumber(req.query.lat);
      const lng = parseNumber(req.query.lng);
      const radius = parseNumber(req.query.radius) ?? 50;

      if (lat === null || lng === null) {
        res
          .status(400)
          .json({ success: false, message: "lat and lng are required" });
        return;
      }

      const complaints = await findNearbyComplaints(lng, lat, radius);

      console.log(`Nearby complaints returned for ${lng},${lat}`);
      res.json({ success: true, complaints, count: complaints.length });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaint = await Complaint.findById(req.params.id)
        .populate("submittedBy", "name email")
        .populate("ward", "name city")
        .populate("assignedTo", "name email")
        .populate("statusHistory.updatedBy", "name")
        .lean();

      if (!complaint) {
        res
          .status(404)
          .json({ success: false, message: "Complaint not found" });
        return;
      }

      console.log(`Complaint ${req.params.id} retrieved`);
      res.json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/status",
  requireAuth,
  attachUser,
  requireRole("authority"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as StatusBody;

      if (!req.user || !body.status || !isStatus(body.status)) {
        res
          .status(400)
          .json({ success: false, message: "Valid status is required" });
        return;
      }

      if (body.status === "resolved") {
        res.status(400).json({
          success: false,
          message:
            "Use POST /:id/resolve to close complaint with proof image",
        });
        return;
      }

      const complaint = await Complaint.findById(req.params.id).populate<{
        submittedBy: IUser;
      }>("submittedBy");

      if (!complaint) {
        res
          .status(404)
          .json({ success: false, message: "Complaint not found" });
        return;
      }

      if (!(complaint.status === "pending" && body.status === "in_progress")) {
        res
          .status(400)
          .json({ success: false, message: "Invalid status transition" });
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

      getIO()
        .to(`user_${complaint.submittedBy.clerkId}`)
        .emit("status_updated", {
          complaintId: req.params.id,
          status: body.status,
          updatedBy: req.user.name,
        });

      console.log(
        `Complaint ${req.params.id} status updated to ${body.status} by ${req.user.name}`
      );
      res.json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/assign",
  requireAuth,
  attachUser,
  requireRole("authority", "admin"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contractorId, assignedTo } = req.body as { contractorId?: string; assignedTo?: string };
      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (contractorId) {
        complaint.assignedContractor = contractorId as any;
        const contractor = await Contractor.findById(contractorId);
        if (contractor) {
          contractor.totalAssigned += 1;
          await contractor.save();
        }
      }

      if (assignedTo) {
        complaint.assignedTo = assignedTo as any;
      }

      await complaint.save();
      res.json({ success: true, message: "Assigned successfully", complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/status",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawStatus = String(req.body.status || "").toLowerCase().trim().replace(/-/g, "_");
      const normalizedStatus = rawStatus === "inprogress" ? "in_progress" : rawStatus;

      if (!normalizedStatus || !validStatuses.has(normalizedStatus)) {
        res.status(400).json({ success: false, message: `Invalid status value: "${req.body.status}"` });
        return;
      }

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      complaint.status = normalizedStatus as ComplaintStatus;
      if (normalizedStatus === "resolved") {
        complaint.resolvedAt = new Date();
      }

      if (req.body.assignedContractor) {
        complaint.assignedContractor = req.body.assignedContractor as any;
      }

      const note = req.body.note || `Status updated to ${normalizedStatus}`;
      if (!complaint.statusHistory) complaint.statusHistory = [];
      complaint.statusHistory.push({
        status: normalizedStatus as ComplaintStatus,
        updatedBy: (req.user ? req.user._id : undefined) as any,
        updatedAt: new Date(),
        note,
      });

      await complaint.save();

      try {
        getIO().to("civic-map").emit("complaint:updated", complaint);
      } catch {}

      res.json({ success: true, message: `Status updated to ${normalizedStatus}`, complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.submittedBy;

      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      res.json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  attachUser,
  requireRole("admin", "authority"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaint = await Complaint.findByIdAndDelete(req.params.id);
      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }
      res.json({ success: true, message: "Complaint deleted successfully" });
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
        res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
        return;
      }

      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        res
          .status(404)
          .json({ success: false, message: "Complaint not found" });
        return;
      }

      if (
        complaint.upvotes.some((upvote) => upvote.equals(req.user?._id))
      ) {
        res.status(400).json({
          success: false,
          message: "You have already upvoted this complaint",
        });
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
          authority = await User.findById(
            complaint.assignedTo
          ).lean<IUser | null>();
        } else if (complaint.ward) {
          authority = await User.findOne({
            role: "authority",
            ward: complaint.ward,
          }).lean<IUser | null>();
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

      console.log(
        `Complaint ${req.params.id} upvoted - new score: ${score}`
      );
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
  uploadSingle,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (req.file) {
        try {
          const afterImageUrl = await uploadImage(
            req.file.buffer,
            "nagarwatch/resolutions"
          );
          if (!complaint.images) complaint.images = {} as any;
          complaint.images.after = afterImageUrl;
        } catch (uploadErr) {
          console.error("Cloudinary upload error in resolve:", uploadErr);
        }
      }

      const note = (
        (req.body as ResolveBody).resolutionNote ||
        req.body.note ||
        "Complaint resolved and verified on site"
      ).trim();

      complaint.resolutionNote = note;
      complaint.status = "resolved";
      complaint.resolvedAt = new Date();

      if (!complaint.statusHistory) complaint.statusHistory = [];
      complaint.statusHistory.push({
        status: "resolved",
        updatedBy: (req.user ? req.user._id : undefined) as any,
        updatedAt: new Date(),
        note,
      });

      await complaint.save();

      const submitter = await User.findById(
        complaint.submittedBy
      ).lean<IUser | null>();

      if (submitter && complaint.resolvedAt) {
        try {
          await sendResolutionEmail(submitter.email, {
            id: complaint._id.toString(),
            title: complaint.title,
            resolvedAt: complaint.resolvedAt,
          });
        } catch (emailErr) {
          console.error("Failed to send resolution email:", emailErr);
        }
      }

      try {
        getIO().to("civic-map").emit("complaint:resolved", { complaintId: complaint._id });
        getIO().to("civic-map").emit("complaint:updated", complaint);
      } catch {}

      res.json({ success: true, message: "Complaint resolved successfully", complaint });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Feature 3: Authority Marks Resolution Proof (Awaiting Citizen Verification) ─
// POST /api/complaints/:id/resolution
router.post(
  "/:id/resolution",
  requireAuth,
  attachUser,
  uploadSingle,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let afterImageUrl = "https://placehold.co/600x400?text=Work+Completed";
      if (req.file) {
        afterImageUrl = await uploadImage(req.file.buffer, "nagarwatch/resolutions");
      } else if (req.body.afterImage) {
        afterImageUrl = req.body.afterImage;
      }

      const note = req.body.resolutionNote || req.body.note || "Work order completed and verified by authority.";
      const complaintId = String(req.params.id);
      const complaint = await submitResolutionProof({
        complaintId,
        afterImageUrl,
        note,
        userId: req.user?._id,
      });

      res.json({
        success: true,
        message: "Resolution proof submitted. Awaiting citizen verification.",
        complaint,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Feature 3: Citizen Verifies Resolution ("Yes, Issue Resolved") ──────────
// POST /api/complaints/:id/verify
router.post(
  "/:id/verify",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const complaintId = String(req.params.id);
      const complaint = await verifyCitizenResolution({
        complaintId,
        userId: req.user._id,
      });

      res.json({
        success: true,
        message: "Thank you! Issue marked as verified and resolved.",
        complaint,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Feature 3: Citizen Rejects Resolution ("No, Issue Still Exists") ────────
// POST /api/complaints/:id/reopen
router.post(
  "/:id/reopen",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const { reason = "Issue still exists", comment = "" } = req.body;
      const complaintId = String(req.params.id);
      const complaint = await reopenComplaint({
        complaintId,
        userId: req.user._id,
        rejectionReason: reason,
        comment,
      });

      res.json({
        success: true,
        message: "Complaint reopened. Authority has been notified for re-inspection.",
        complaint,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Citizen Feedback on Resolved Complaint ─────────────────────────────────
// POST /api/v1/complaints/:id/feedback
router.post(
  "/:id/feedback",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rating, comment } = req.body as { rating: number; comment?: string };
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
        return;
      }

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        res.status(404).json({ success: false, message: "Complaint not found" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      complaint.citizenFeedback = {
        rating: numRating,
        comment: comment || "",
        submittedAt: new Date(),
        citizenId: req.user._id,
      };

      await complaint.save();

      // If a contractor was assigned, update contractor rating stats
      if (complaint.assignedContractor) {
        const contractor = await Contractor.findById(complaint.assignedContractor);
        if (contractor) {
          const newCount = contractor.ratingCount + 1;
          const newAvg = (contractor.ratingAvg * contractor.ratingCount + numRating) / newCount;
          contractor.ratingCount = newCount;
          contractor.ratingAvg = Number(newAvg.toFixed(2));
          await contractor.save();
        }
      }

      res.json({ success: true, message: "Thank you for your feedback!", feedback: complaint.citizenFeedback });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Temporal Analytics (Multi-timeframe 7d/30d/90d/1y) ──────────────────────
// GET /api/v1/complaints/analytics/temporal
router.get(
  "/analytics/temporal",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { timeframe = "30d", ward } = req.query as { timeframe?: string; ward?: string };

      let days = 30;
      if (timeframe === "7d") days = 7;
      else if (timeframe === "90d") days = 90;
      else if (timeframe === "1y") days = 365;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage: any = { createdAt: { $gte: startDate } };
      if (ward && ward !== "all") {
        matchStage.ward = ward;
      }

      const [totalCount, resolvedCount, breachedCount, dailyTrend, categoryBreakdown, statusBreakdown] = await Promise.all([
        Complaint.countDocuments(matchStage),
        Complaint.countDocuments({ ...matchStage, status: "resolved" }),
        Complaint.countDocuments({ ...matchStage, "sla.breached": true }),
        Complaint.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              reported: { $sum: 1 },
              resolved: {
                $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Complaint.aggregate([
          { $match: matchStage },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate([
          { $match: matchStage },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

      const resolutionRate = totalCount > 0 ? Number(((resolvedCount / totalCount) * 100).toFixed(1)) : 0;
      const breachRate = totalCount > 0 ? Number(((breachedCount / totalCount) * 100).toFixed(1)) : 0;

      res.json({
        success: true,
        timeframe,
        metrics: {
          totalComplaints: totalCount,
          resolvedComplaints: resolvedCount,
          breachedComplaints: breachedCount,
          resolutionRate,
          breachRate,
        },
        dailyTrend: dailyTrend.map((d) => ({
          date: d._id,
          reported: d.reported,
          resolved: d.resolved,
        })),
        categoryBreakdown,
        statusBreakdown,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Export Complaints to CSV ────────────────────────────────────────────────
// GET /api/v1/complaints/export/csv
router.get(
  "/export/csv",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaints = await Complaint.find()
        .sort({ createdAt: -1 })
        .limit(500)
        .populate("ward", "name")
        .populate("submittedBy", "name email")
        .lean();

      let csv = "Complaint ID,Title,Category,Status,Priority,Ward,Address,What3Words,Landmark,Submitted Date,SLA Breached,Rating\n";

      for (const c of complaints) {
        const id = c._id.toString();
        const title = `"${(c.title || "").replace(/"/g, '""')}"`;
        const cat = c.category;
        const st = c.status;
        const pr = c.priority;
        const ward = (c.ward as any)?.name || "Unassigned";
        const addr = `"${(c.location?.address || "").replace(/"/g, '""')}"`;
        const w3w = (c.location as any)?.what3words || "";
        const landmark = `"${((c.location as any)?.landmark || "").replace(/"/g, '""')}"`;
        const date = new Date(c.createdAt).toISOString().split("T")[0];
        const breached = c.sla?.breached ? "YES" : "NO";
        const rating = c.citizenFeedback?.rating || "N/A";

        csv += `${id},${title},${cat},${st},${pr},${ward},${addr},${w3w},${landmark},${date},${breached},${rating}\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=nagarwatch_complaints_${Date.now()}.csv`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

export default router;