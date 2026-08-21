import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import User from "../models/User";

const router = Router();

router.post("/clerk", async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Webhook] CLERK_WEBHOOK_SECRET is not configured");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const payload = JSON.stringify(req.body);
  const headers = req.headers as Record<string, string>;

  try {
    const wh = new Webhook(secret);
    wh.verify(payload, headers);

    const { type, data } = req.body;

    switch (type) {
      case "user.created": {
        const email = data.email_addresses?.[0]?.email_address || `${data.id}@nagarwatch.local`;
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "NagarWatch Citizen";
        const role = data.public_metadata?.role || data.unsafe_metadata?.requestedRole || "citizen";

        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            clerkId: data.id,
            email,
            name,
            role: ["citizen", "authority", "admin"].includes(role) ? role : "citizen",
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`[Webhook] User created/synced: ${data.id} (${email})`);
        break;
      }

      case "user.updated": {
        const updateData: any = {};
        if (data.email_addresses?.[0]?.email_address) {
          updateData.email = data.email_addresses[0].email_address;
        }
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
        if (name) updateData.name = name;
        if (data.public_metadata?.role) {
          updateData.role = data.public_metadata.role;
        }

        await User.findOneAndUpdate({ clerkId: data.id }, updateData);
        console.log(`[Webhook] User updated: ${data.id}`);
        break;
      }

      case "user.deleted":
        await User.deleteOne({ clerkId: data.id });
        console.log(`[Webhook] User deleted: ${data.id}`);
        break;
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook verification failed" });
  }
});

export default router;
