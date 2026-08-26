import { Router, Request, Response, NextFunction } from "express";
import { getHeatmapAnalytics } from "../services/analytics/heatmap.service";
import {
  calculateAllWardsHealth,
  calculateSingleWardHealth,
} from "../services/analytics/wardHealth.service";
import { getAllContractorPerformance } from "../services/analytics/contractorPerformance.service";

const router = Router();

// ─── Civic Heatmap Aggregation ──────────────────────────────────────────────
// GET /api/analytics/heatmap
router.get("/heatmap", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, category, status, priority, from, to } = req.query as {
      ward?: string;
      category?: string;
      status?: string;
      priority?: string;
      from?: string;
      to?: string;
    };

    const data = await getHeatmapAnalytics({
      ward,
      category,
      status,
      priority,
      from,
      to,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Ward Health Score Overview ─────────────────────────────────────────────
// GET /api/analytics/wards/health
router.get("/wards/health", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wards = await calculateAllWardsHealth();
    res.json({
      success: true,
      wards,
      count: wards.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/wards/health/:wardId
router.get("/wards/health/:wardId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawWardId = req.params.wardId;
    const wardId = typeof rawWardId === "string" ? rawWardId : String(rawWardId);
    const ward = await calculateSingleWardHealth(wardId);
    res.json({
      success: true,
      ward,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Contractor Performance Analytics ───────────────────────────────────────
// GET /api/analytics/contractors
router.get("/contractors", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sort = "performanceScore", department } = req.query as {
      sort?: string;
      department?: string;
    };

    let contractors = await getAllContractorPerformance();

    if (department && department !== "all") {
      contractors = contractors.filter((c) => c.department.toLowerCase() === department.toLowerCase());
    }

    if (sort === "jobsCompleted") {
      contractors.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    } else if (sort === "onTimeRate") {
      contractors.sort((a, b) => b.onTimeRate - a.onTimeRate);
    } else {
      contractors.sort((a, b) => b.performanceScore - a.performanceScore);
    }

    res.json({
      success: true,
      contractors,
      count: contractors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
