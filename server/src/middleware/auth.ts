import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

// Augment Express Request to carry the resolved MongoDB user
declare global {
  namespace Express {
    interface Request {
      user?: InstanceType<typeof User> & { _id: any };
    }
  }
}

export const clerkAuth = clerkMiddleware();

/** Rejects requests that have no Clerk session */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Looks up the MongoDB User document that matches the Clerk userId
 * and attaches it to req.user so route handlers don't have to repeat
 * the database lookup.
 *
 * Must be placed AFTER requireAuth in the middleware chain.
 */
export async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ clerkId: auth.userId });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found in database" });
      return;
    }

    req.user = user as any;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restricts a route to one or more roles.
 * Reads the role from Clerk's publicMetadata.role.
 * Must be placed AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const role = (auth.sessionClaims?.publicMetadata as Record<string, unknown>)
      ?.role as string | undefined;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    next();
  };
}
