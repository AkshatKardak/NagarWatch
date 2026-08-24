import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { Complaint } from "../models/Complaint";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { attachUser, requireAuth } from "../middleware/auth";

const router = Router();

interface SyncBody {
  email?: string;
  name?: string;
  role?: string;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string" && typeof value !== "number") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

router.post("/sync", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as SyncBody;

    if (!req.clerkUserId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const updateObj: any = {
      clerkId: req.clerkUserId,
      email: body.email || `${req.clerkUserId}@nagarwatch.local`,
      name: body.name || "NagarWatch User",
    };

    if (body.role && ["citizen", "authority", "admin", "contractor"].includes(body.role)) {
      updateObj.role = body.role;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.clerkUserId },
      updateObj,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`User synced for Clerk user ${req.clerkUserId} with role ${user.role}`);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/role", requireAuth, attachUser, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body as { role: string };
    if (!["citizen", "authority", "admin", "contractor"].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role specified" });
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.clerkUserId },
      { role },
      { new: true }
    );

    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
});

router.post("/demo-admin", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demoClerkId = "user_demo_admin_commissioner";
    const user = await User.findOneAndUpdate(
      { clerkId: demoClerkId },
      {
        clerkId: demoClerkId,
        email: "admin@nagarwatch.gov.in",
        name: "Municipal Commissioner (Demo)",
        role: "admin",
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, message: "Demo Admin profile active", user, demo: true });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, attachUser, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(`User profile returned for ${req.clerkUserId || "unknown"}`);
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/me/complaints",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const page = parsePositiveInt(req.query.page, 1);
      const limit = parsePositiveInt(req.query.limit, 10);
      const skip = (page - 1) * limit;

      const [complaints, total] = await Promise.all([
        Complaint.find({ submittedBy: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("ward", "name")
          .lean(),
        Complaint.countDocuments({ submittedBy: req.user._id }),
      ]);

      console.log(`Returned ${complaints.length} complaints for ${req.clerkUserId || "unknown"}`);
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
  "/me/notifications",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.clerkUserId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const [notifications, unreadCount] = await Promise.all([
        Notification.find({ userId: req.clerkUserId }).sort({ createdAt: -1 }).limit(20).lean(),
        Notification.countDocuments({ userId: req.clerkUserId, read: false }),
      ]);

      console.log(`Returned notifications for ${req.clerkUserId}`);
      res.json({ success: true, notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/me/notifications/:id/read",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.clerkUserId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const notificationId = typeof req.params.id === "string" ? req.params.id : "";

      const notification = await Notification.findOne({
        _id: notificationId,
        userId: req.clerkUserId,
      });

      if (!notification) {
        res.status(404).json({ success: false, message: "Notification not found" });
        return;
      }

      notification.read = true;
      await notification.save();

      console.log(`Notification ${req.params.id} marked read for ${req.clerkUserId}`);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.query;
      const query: any = { isActive: true };
      if (role && role !== "all") {
        query.role = role;
      }
      const users = await User.find(query).sort({ createdAt: -1 }).lean();
      res.json({ success: true, users });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/role",
  requireAuth,
  attachUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      );
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      res.json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

