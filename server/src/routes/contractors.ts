import { Router, Request, Response, NextFunction } from "express";
import { Contractor } from "../models/Contractor";
import { Complaint } from "../models/Complaint";
import { requireAuth, attachUser, requireRole } from "../middleware/auth";

const router = Router();

// Sample seed contractors if DB is empty
const SEED_CONTRACTORS = [
  {
    name: "Apex Infrastructure & Roadways Pvt Ltd",
    department: "Roads",
    contactEmail: "contact@apexinfra.in",
    contactPhone: "+91 98230 11223",
    ratingAvg: 4.8,
    ratingCount: 38,
    totalAssigned: 120,
    totalResolved: 114,
    onTimeResolutions: 108,
    slaBreaches: 6,
    licenseNumber: "MUNI-RD-2024-0012",
  },
  {
    name: "CleanCity Waste Management Services",
    department: "Waste Management",
    contactEmail: "ops@cleancityindia.org",
    contactPhone: "+91 98230 44556",
    ratingAvg: 4.6,
    ratingCount: 52,
    totalAssigned: 210,
    totalResolved: 198,
    onTimeResolutions: 185,
    slaBreaches: 13,
    licenseNumber: "MUNI-WM-2023-0089",
  },
  {
    name: "Urja Power & Streetlight Electricals",
    department: "Electricity",
    contactEmail: "service@urjapower.co.in",
    contactPhone: "+91 98230 77889",
    ratingAvg: 4.4,
    ratingCount: 29,
    totalAssigned: 85,
    totalResolved: 79,
    onTimeResolutions: 72,
    slaBreaches: 7,
    licenseNumber: "MUNI-EL-2024-0045",
  },
  {
    name: "JalDhara Hydraulic & Drainage Works",
    department: "Drainage",
    contactEmail: "projects@jaldhara.in",
    contactPhone: "+91 98230 99001",
    ratingAvg: 4.7,
    ratingCount: 44,
    totalAssigned: 96,
    totalResolved: 91,
    onTimeResolutions: 87,
    slaBreaches: 4,
    licenseNumber: "MUNI-DR-2023-0112",
  },
  {
    name: "Varun Water Pipelines & Supply Ltd",
    department: "Water Supply",
    contactEmail: "helpline@varunwater.in",
    contactPhone: "+91 98230 33445",
    ratingAvg: 4.5,
    ratingCount: 31,
    totalAssigned: 78,
    totalResolved: 74,
    onTimeResolutions: 69,
    slaBreaches: 5,
    licenseNumber: "MUNI-WS-2024-0078",
  },
];

// Seed helper
async function ensureSeedContractors(): Promise<void> {
  const count = await Contractor.countDocuments();
  if (count === 0) {
    await Contractor.insertMany(SEED_CONTRACTORS);
  }
}

// ─── 1. Get All Contractors (Public / Authority) ──────────────────────────────
// GET /api/v1/contractors
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureSeedContractors();

    const { department, sort = "ratingAvg" } = req.query as { department?: string; sort?: string };
    const query: any = { isActive: true };

    if (department && department !== "all") {
      query.department = department;
    }

    const sortOption: any = {};
    if (sort === "ratingAvg") sortOption.ratingAvg = -1;
    else if (sort === "totalResolved") sortOption.totalResolved = -1;
    else if (sort === "onTimeRate") sortOption.onTimeResolutions = -1;
    else sortOption.ratingAvg = -1;

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

// ─── 2. Get Single Contractor Profile with performance statistics ─────────────
// GET /api/v1/contractors/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractor = await Contractor.findById(req.params.id).populate("wardsCovered", "name city");
    if (!contractor) {
      res.status(404).json({ success: false, message: "Contractor not found" });
      return;
    }

    // Fetch recent resolved complaints assigned to this contractor
    const recentResolved = await Complaint.find({
      assignedContractor: contractor._id,
      status: "resolved",
    })
      .sort({ resolvedAt: -1 })
      .limit(10)
      .select("title category status citizenFeedback resolvedAt createdAt location");

    res.json({
      success: true,
      contractor,
      recentResolved,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. Assign Contractor to Complaint (Authority/Admin) ──────────────────────
// POST /api/v1/contractors/assign
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
    await complaint.save();

    contractor.totalAssigned += 1;
    await contractor.save();

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
