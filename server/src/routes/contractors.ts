import { Router, Request, Response, NextFunction } from "express";
import { Contractor } from "../models/Contractor";
import { Complaint } from "../models/Complaint";
import { BlacklistedContractor } from "../models/BlacklistedContractor";
import { requireAuth, attachUser, requireRole } from "../middleware/auth";
import {
  verifyCPWDContractor,
  checkBlacklist,
  calculateContractorPerformanceScore,
} from "../services/contractorVerification.service";
import { getSingleContractorPerformance } from "../services/analytics/contractorPerformance.service";
import { getIO } from "../config/socket";

const router = Router();

// ─── 1. Verify against official CPWD Dataset ─────────────────────────────────
// GET /api/contractors/verify-cpwd?name=...&state=...
router.get("/verify-cpwd", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, state } = req.query as { name?: string; state?: string };
    if (!name) {
      res.status(400).json({ success: false, message: "Contractor name is required for CPWD verification" });
      return;
    }

    const verification = await verifyCPWDContractor(name, state);
    res.json({
      success: true,
      verification,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. Check Blacklist / Debarred Registry ─────────────────────────────────
// POST /api/contractors/check-blacklist
router.post("/check-blacklist", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body as { name?: string };
    if (!name) {
      res.status(400).json({ success: false, message: "Contractor name is required" });
      return;
    }

    const blacklist = await checkBlacklist(name);
    res.json({
      success: true,
      blacklist,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. Get CPWD Enlisted Contractor Directory ──────────────────────────────
// GET /api/contractors/cpwd-list
router.get("/cpwd-list", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { state, classGrade, category } = req.query as {
      state?: string;
      classGrade?: string;
      category?: string;
    };

    const query: any = {
      isActive: true,
      "verificationDetails.isVerified": true,
    };

    if (state && state !== "all") query.state = new RegExp(state, "i");
    if (classGrade && classGrade !== "all") query.class = classGrade;
    if (category && category !== "all") query.category = new RegExp(category, "i");

    const contractors = await Contractor.find(query).sort({ "performanceMetrics.performanceScore": -1 }).lean();

    res.json({
      success: true,
      count: contractors.length,
      contractors,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 4. Get Blacklisted Contractors List (Admin) ────────────────────────────
// GET /api/contractors/blacklist
router.get("/blacklist/all", requireAuth, attachUser, requireRole("admin"), async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await BlacklistedContractor.find().sort({ blacklistedAt: -1 }).lean();
    res.json({ success: true, count: list.length, blacklist: list });
  } catch (err) {
    next(err);
  }
});

// ─── 5. Add to Blacklist (Admin) ────────────────────────────────────────────
// POST /api/contractors/blacklist
router.post("/blacklist", requireAuth, attachUser, requireRole("admin"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contractorName, reason, source = "CPWD_DEBARRED" } = req.body as {
      contractorName?: string;
      reason?: string;
      source?: string;
    };

    if (!contractorName || !reason) {
      res.status(400).json({ success: false, message: "Contractor name and reason are required" });
      return;
    }

    const blacklisted = await BlacklistedContractor.findOneAndUpdate(
      { contractorName },
      { contractorName, reason, blacklistedAt: new Date(), source },
      { upsert: true, new: true }
    );

    // Also update Contractor doc if exists
    await Contractor.updateMany(
      { name: new RegExp(`^${contractorName}$`, "i") },
      {
        $set: {
          "blacklistStatus.isBlacklisted": true,
          "blacklistStatus.reason": reason,
          "blacklistStatus.blacklistedAt": new Date(),
          "blacklistStatus.source": source,
          isActive: false,
        },
      }
    );

    try {
      getIO().to("civic-map").emit("contractor_blacklisted", { contractorName, reason });
    } catch {}

    res.json({ success: true, message: `Contractor ${contractorName} blacklisted`, blacklisted });
  } catch (err) {
    next(err);
  }
});

// ─── 6. Contractor Registration (with auto-blacklist check & CPWD verify) ───
// POST /api/contractors/register
router.post("/register", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      contactEmail,
      contactPhone,
      department = "General",
      class: classGrade = "Class I",
      category = "Buildings & Roads",
      state = "Maharashtra",
      address = "",
      isCPWD = false,
      cpwdNumber,
      documents = [],
    } = req.body;

    if (!name || !contactEmail) {
      res.status(400).json({ success: false, message: "Name and email are required" });
      return;
    }

    // Step 1: Check Blacklist (Auto-reject)
    const blacklist = await checkBlacklist(name);
    if (blacklist.isBlacklisted) {
      res.status(403).json({
        success: false,
        message: `This contractor is blacklisted by CPWD (${blacklist.reason}). Registration cannot proceed.`,
      });
      return;
    }

    // Step 2: Check CPWD Verification
    let isVerified = false;
    let verificationSource = "MANUAL_REVIEW";
    let cpwdData: any = undefined;

    if (isCPWD) {
      const cpwdCheck = await verifyCPWDContractor(name, state);
      if (cpwdCheck.isFound) {
        isVerified = true;
        verificationSource = "CPWD_DATASET";
        cpwdData = {
          number: cpwdNumber || cpwdCheck.registrationNumber,
          class: cpwdCheck.classGrade,
          category: cpwdCheck.contractCategory,
          enlistmentDate: cpwdCheck.enlistmentDate ? new Date(cpwdCheck.enlistmentDate) : new Date(),
          authority: cpwdCheck.authorityDetails,
          source: "CPWD",
        };
      }
    }

    const licenseNumber = `MUNI-CON-${Math.floor(10000 + Math.random() * 90000)}`;

    const contractor = await Contractor.create({
      name,
      contactEmail,
      contactPhone: contactPhone || "+91-XXXXXXXXXX",
      department,
      class: classGrade,
      category,
      state,
      address,
      licenseNumber,
      isActive: true,
      cpwdRegistration: cpwdData,
      verificationDetails: {
        isVerified,
        verifiedAt: isVerified ? new Date() : undefined,
        verificationSource: verificationSource as any,
        documents,
      },
      performanceMetrics: {
        jobsAssigned: 0,
        jobsCompleted: 0,
        onTimeCompletions: 0,
        slaBreaches: 0,
        reopenedJobs: 0,
        averageResolutionHours: 0,
        performanceScore: isVerified ? 85 : 75,
      },
    });

    try {
      getIO().to("civic-map").emit("contractor_registered", { contractorId: contractor._id, isVerified });
    } catch {}

    res.status(201).json({
      success: true,
      message: isVerified
        ? "Registration successful! CPWD Government Verification confirmed."
        : "Registration submitted for administrative review.",
      contractor,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 7. Admin Verify Contractor ─────────────────────────────────────────────
// POST /api/contractors/:id/verify
router.post("/:id/verify", requireAuth, attachUser, requireRole("admin"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isVerified = true, verificationSource = "MANUAL_REVIEW", documents = [] } = req.body;

    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) {
      res.status(404).json({ success: false, message: "Contractor not found" });
      return;
    }

    contractor.verificationDetails = {
      isVerified: Boolean(isVerified),
      verifiedAt: new Date(),
      verifiedBy: req.user ? (req.user._id as any) : undefined,
      verificationSource,
      documents: documents.length > 0 ? documents : contractor.verificationDetails?.documents || [],
    };

    await contractor.save();

    try {
      getIO().to("civic-map").emit("contractor_verified", {
        contractorId: contractor._id,
        isVerified,
      });
    } catch {}

    res.json({
      success: true,
      message: `Contractor ${contractor.name} verification status updated to ${isVerified ? "VERIFIED" : "UNVERIFIED"}`,
      contractor,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 8. Contractor Performance Detail & Score ───────────────────────────────
// GET /api/contractors/:id/performance
router.get("/:id/performance", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractorId = String(req.params.id);
    const performance = await getSingleContractorPerformance(contractorId);
    res.json({
      success: true,
      performance,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 9. Get All Contractors (Standard list) ─────────────────────────────────
// GET /api/contractors
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { department, sort = "performanceScore", verified } = req.query as {
      department?: string;
      sort?: string;
      verified?: string;
    };

    const query: any = { isActive: true };

    if (department && department !== "all") {
      query.department = department;
    }

    if (verified === "true") {
      query["verificationDetails.isVerified"] = true;
    } else if (verified === "false") {
      query["verificationDetails.isVerified"] = false;
    }

    const sortOption: any = {};
    if (sort === "ratingAvg") sortOption.ratingAvg = -1;
    else if (sort === "totalResolved" || sort === "jobsCompleted") sortOption["performanceMetrics.jobsCompleted"] = -1;
    else if (sort === "onTimeRate") sortOption["performanceMetrics.onTimeCompletions"] = -1;
    else sortOption["performanceMetrics.performanceScore"] = -1;

    const contractors = await Contractor.find(query).sort(sortOption).populate("wardsCovered", "name city");

    res.json({
      success: true,
      count: contractors.length,
      contractors,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 10. Get Single Contractor Profile ──────────────────────────────────────
// GET /api/contractors/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractor = await Contractor.findById(req.params.id).populate("wardsCovered", "name city");
    if (!contractor) {
      res.status(404).json({ success: false, message: "Contractor not found" });
      return;
    }

    const recentResolved = await Complaint.find({
      assignedContractor: contractor._id,
      status: { $in: ["resolved", "verified_resolved"] },
    })
      .sort({ resolvedAt: -1 })
      .limit(10)
      .select("title category status citizenFeedback resolvedAt createdAt location resolutionProof");

    res.json({
      success: true,
      contractor,
      recentResolved,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 11. Assign Contractor to Complaint (Authority/Admin) ───────────────────
// POST /api/contractors/assign
router.post("/assign", requireAuth, attachUser, requireRole("authority", "admin"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { complaintId, contractorId } = req.body as { complaintId: string; contractorId: string };
    if (!complaintId || !contractorId) {
      res.status(400).json({ success: false, message: "complaintId and contractorId are required" });
      return;
    }

    const [complaint, contractor] = await Promise.all([
      Complaint.findById(complaintId),
      Contractor.findById(contractorId),
    ]);

    if (!complaint || !contractor) {
      res.status(404).json({ success: false, message: "Complaint or Contractor not found" });
      return;
    }

    complaint.assignedContractor = contractor._id;
    if (complaint.status === "pending") {
      complaint.status = "in_progress";
    }
    await complaint.save();

    contractor.totalAssigned += 1;
    if (contractor.performanceMetrics) {
      contractor.performanceMetrics.jobsAssigned += 1;
    }
    await contractor.save();

    try {
      getIO().to("civic-map").emit("complaint_assigned", {
        complaintId: complaint._id,
        contractorId: contractor._id,
        contractorName: contractor.name,
      });
      getIO().to("civic-map").emit("complaint:updated", complaint);
    } catch {}

    res.json({
      success: true,
      message: `Complaint assigned to ${contractor.name}`,
      complaint,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
