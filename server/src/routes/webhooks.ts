import { Router, Request, Response, NextFunction } from "express";
import { Webhook } from "svix";
import { createClerkClient } from "@clerk/express";

const router = Router();

/**
 * POST /api/v1/webhooks/clerk
 *
 * Clerk sends a signed Svix payload on every subscribed event.
 * On `user.created` we:
 *   1. Read `unsafe_metadata.requestedRole` and write it to `public_metadata.role`
 *      (citizen | authority only — admin is never auto-assigned)
 *   2. Read `unsafe_metadata.displayName` and split it into firstName / lastName
 *      so the Clerk profile is populated immediately after sign-up.
 *
 * Required env var: CLERK_WEBHOOK_SECRET=whsec_...
 */
router.post(
  "/clerk",
  (req: Request, res: Response, next: NextFunction) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => (data += chunk));
    req.on("end", () => {
      (req as Request & { rawBody: string }).rawBody = data;
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Webhook] CLERK_WEBHOOK_SECRET is not set");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // ── 1. Verify Svix signature ─────────────────────────────────────
    const svixId        = req.headers["svix-id"]        as string | undefined;
    const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
    const svixSignature = req.headers["svix-signature"] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "Missing Svix headers" });
      return;
    }

    const rawBody = (req as Request & { rawBody: string }).rawBody;
    const wh = new Webhook(secret);

    let payload: {
      type: string;
      data: {
        id: string;
        unsafe_metadata?: { requestedRole?: string; displayName?: string };
        public_metadata?: { role?: string };
      };
    };

    try {
      payload = wh.verify(rawBody, {
        "svix-id":        svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof payload;
    } catch (err) {
      console.error("[Webhook] Svix signature verification failed:", err);
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    // ── 2. Handle user.created ───────────────────────────────────────
    if (payload.type === "user.created") {
      const userId       = payload.data.id;
      const requestedRole = payload.data.unsafe_metadata?.requestedRole;
      const displayName   = payload.data.unsafe_metadata?.displayName?.trim() ?? "";

      // Only auto-assign citizen or authority — never auto-assign admin
      const allowedRoles = ["citizen", "authority"] as const;
      type AllowedRole   = (typeof allowedRoles)[number];

      const resolvedRole: AllowedRole = allowedRoles.includes(
        requestedRole as AllowedRole
      )
        ? (requestedRole as AllowedRole)
        : "citizen";

      // Split displayName into firstName + lastName (first word vs the rest)
      const nameParts = displayName.split(" ").filter(Boolean);
      const firstName  = nameParts[0]  ?? "";
      const lastName   = nameParts.slice(1).join(" ") ?? "";

      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY || "",
        });

        await clerkClient.users.updateUser(userId, {
          ...(firstName ? { firstName } : {}),
          ...(lastName  ? { lastName  } : {}),
        });

        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: { role: resolvedRole },
        });

        console.log(
          `[Webhook] user.created → role="${resolvedRole}" name="${displayName || "(not provided)"}" for ${userId}`
        );
      } catch (err) {
        console.error(`[Webhook] Failed to update user ${userId}:`, err);
        res.status(200).json({
          received: true,
          warning: "Role/name assignment failed — admin must fix manually",
        });
        return;
      }
    }

    // ── 3. Acknowledge all other events ──────────────────────────────
    res.status(200).json({ received: true });
  }
);

export default router;
