import { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkMiddleware } from "@clerk/express";
import User, { IUser } from "../models/User";

export type AuthRequest = Request;

export const clerkAuth = clerkMiddleware();

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
      return;
    }
    req.userId = auth.userId;
    req.clerkUserId = auth.userId;

    // Fetch user from DB, auto-create fallback if not yet synced
    let user = await User.findOne({ clerkId: auth.userId });
    if (!user) {
      user = await User.create({
        clerkId: auth.userId,
        email: `${auth.userId}@nagarwatch.local`,
        name: "NagarWatch Citizen",
        role: "citizen",
      });
    }
    req.user = user as any;
    next();
  } catch (error) {
    next(error);
  }
};

export const attachUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    next();
    return;
  }
  await requireAuth(req, res, next);
};

export const requireRole = (...roles: string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden - Insufficient permissions", message: "Forbidden - Insufficient permissions" });
      return;
    }
    next();
  };
};

export default { requireAuth, requireRole, attachUser, clerkAuth };
