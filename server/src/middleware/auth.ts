import { getAuth } from "@clerk/express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { HydratedDocument } from "mongoose";
import { User, type IUser, type UserRole } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      user?: HydratedDocument<IUser>;
    }
  }
}

function getBodyString(req: Request, key: string): string {
  const body = req.body as Record<string, unknown>;
  const value = body[key];
  return typeof value === "string" ? value : "";
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = getAuth(req).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    req.clerkUserId = userId;
    console.log(`Authenticated Clerk user ${userId}`);
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(role: UserRole): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.clerkUserId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const user = await User.findOne({ clerkId: req.clerkUserId });

      if (!user || user.role !== role) {
        res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
        return;
      }

      req.user = user;
      console.log(`Role check passed for ${req.clerkUserId} as ${role}`);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const attachUser: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.clerkUserId) {
      throw new Error("attachUser requires req.clerkUserId");
    }

    let user = await User.findOne({ clerkId: req.clerkUserId });

    if (!user) {
      user = await User.create({
        clerkId: req.clerkUserId,
        email: getBodyString(req, "email") || `${req.clerkUserId}@nagarwatch.local`,
        name: getBodyString(req, "name") || "NagarWatch User",
        role: "citizen",
      });
      console.log(`Created user profile for Clerk user ${req.clerkUserId}`);
    } else {
      console.log(`Attached user profile for Clerk user ${req.clerkUserId}`);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
