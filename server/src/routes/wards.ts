import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { Ward } from "../models/Ward";
import { attachUser, requireAuth, requireRole } from "../middleware/auth";

const router = Router();

interface WardBody {
  name?: string;
  city?: string;
  boundary?: { type: "Polygon"; coordinates: number[][][] };
  assignedAuthorities?: string[];
}

router.get("/", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wards = await Ward.find({ isActive: true })
      .populate("assignedAuthorities", "name email")
      .lean();

    console.log(`Returned ${wards.length} active wards`);
    res.json({ success: true, wards });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireAuth,
  attachUser,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as WardBody;

      if (!body.name || !body.city) {
        res.status(400).json({ success: false, message: "name and city are required" });
        return;
      }

      const ward = new Ward({
        name: body.name,
        city: body.city,
        assignedAuthorities: body.assignedAuthorities || [],
      });

      if (body.boundary) {
        ward.boundary = body.boundary;
      }

      await ward.save();

      console.log(`Ward created: ${ward._id}`);
      res.status(201).json({ success: true, ward });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  attachUser,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as WardBody;
      const ward = await Ward.findByIdAndUpdate(
        req.params.id,
        {
          name: body.name,
          city: body.city,
          boundary: body.boundary,
          assignedAuthorities: body.assignedAuthorities,
        },
        { new: true, runValidators: true }
      );

      if (!ward) {
        res.status(404).json({ success: false, message: "Ward not found" });
        return;
      }

      console.log(`Ward updated: ${req.params.id}`);
      res.json({ success: true, ward });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  attachUser,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ward = await Ward.findByIdAndUpdate(req.params.id, { isActive: false });

      if (!ward) {
        res.status(404).json({ success: false, message: "Ward not found" });
        return;
      }

      console.log(`Ward deactivated: ${req.params.id}`);
      res.json({ success: true, message: "Ward deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
