import request from "supertest";
import app from "../index";
import { Complaint } from "../models/Complaint";
import { Notification } from "../models/Notification";
import { setupMemoryDB, teardownMemoryDB, clearDB, createTestUser, createTestComplaint } from "./helpers/testDb";

describe("Flow 4: Before/After Resolution Verification & Citizen Reopen API", () => {
  beforeAll(async () => {
    await setupMemoryDB();
  });

  afterAll(async () => {
    await teardownMemoryDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  it("should reject direct status update to 'resolved' without proof", async () => {
    const authority = await createTestUser({ role: "authority", clerkId: "user_authority_direct" });
    const citizen = await createTestUser({ clerkId: "user_citizen_owner" });

    const complaint = await createTestComplaint(citizen._id, {
      status: "in_progress",
    });

    const res = await request(app)
      .patch(`/api/complaints/${complaint._id}/status`)
      .set("x-test-clerk-id", authority.clerkId)
      .send({ status: "resolved" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("proof image");
  });

  it("should successfully submit resolution proof and transition status to awaiting_citizen_verification", async () => {
    const authority = await createTestUser({ role: "authority", clerkId: "user_authority_submitter" });
    const citizen = await createTestUser({ clerkId: "user_citizen_submitter" });

    const complaint = await createTestComplaint(citizen._id, {
      title: "Broken water main leaking on highway",
      status: "in_progress",
      images: { before: "https://example.com/before-pipeline.jpg" },
    });

    const proofNote = "Repaired pipe joint with high-pressure clamp, pressure tested ok.";
    const afterImg = "https://example.com/after-repaired-pipeline.jpg";

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/resolution`)
      .set("x-test-clerk-id", authority.clerkId)
      .send({
        afterImage: afterImg,
        note: proofNote,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.status).toBe("awaiting_citizen_verification");

    // Check database state
    const updated = await Complaint.findById(complaint._id);
    expect(updated?.status).toBe("awaiting_citizen_verification");
    expect(updated?.images.after).toBe(afterImg);
    expect(updated?.resolutionProof?.afterImage).toBe(afterImg);
    expect(updated?.resolutionProof?.beforeImage).toBe("https://example.com/before-pipeline.jpg");
    expect(updated?.verification?.status).toBe("PENDING");

    // Check resolution attempt history
    expect(updated?.resolutionAttempts).toHaveLength(1);
    expect(updated?.resolutionAttempts?.[0]?.attemptNumber).toBe(1);
    expect(updated?.resolutionAttempts?.[0]?.verificationStatus).toBe("PENDING");

    // Notification created for citizen
    const notifs = await Notification.find({ userId: citizen.clerkId });
    expect(notifs.length).toBeGreaterThanOrEqual(1);
    expect(notifs[0]?.type).toBe("resolution");
  });

  it("should allow citizen to confirm and mark issue as verified_resolved", async () => {
    const citizen = await createTestUser({ clerkId: "user_verifying_citizen" });
    const complaint = await createTestComplaint(citizen._id, {
      title: "Drainage clean-up verification",
      status: "awaiting_citizen_verification",
      verification: { status: "PENDING" },
      resolutionAttempts: [
        {
          attemptNumber: 1,
          afterImage: "https://example.com/clean.jpg",
          uploadedBy: citizen._id,
          uploadedAt: new Date(),
          verificationStatus: "PENDING",
        },
      ],
    });

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/verify`)
      .set("x-test-clerk-id", citizen.clerkId)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.status).toBe("verified_resolved");

    const updated = await Complaint.findById(complaint._id);
    expect(updated?.status).toBe("verified_resolved");
    expect(updated?.verification?.status).toBe("VERIFIED");
    expect(updated?.resolvedAt).toBeDefined();
    expect(updated?.resolutionAttempts?.[0]?.verificationStatus).toBe("VERIFIED");
    expect(updated?.statusHistory.some((s) => s.status === "verified_resolved")).toBe(true);
  });

  it("should allow citizen to reopen complaint when resolution work is unsatisfactory", async () => {
    const citizen = await createTestUser({ clerkId: "user_reopening_citizen" });
    const complaint = await createTestComplaint(citizen._id, {
      title: "Pothole filled with loose gravel",
      status: "awaiting_citizen_verification",
      verification: { status: "PENDING" },
      resolutionAttempts: [
        {
          attemptNumber: 1,
          afterImage: "https://example.com/poor-patch.jpg",
          uploadedBy: citizen._id,
          uploadedAt: new Date(),
          verificationStatus: "PENDING",
        },
      ],
    });

    const rejectionReason = "Pothole was only filled with mud and gravel";
    const comment = "Already washed away after light rain, vehicles still getting damaged";

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/reopen`)
      .set("x-test-clerk-id", citizen.clerkId)
      .send({
        reason: rejectionReason,
        comment,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.status).toBe("reopened");

    const updated = await Complaint.findById(complaint._id);
    expect(updated?.status).toBe("reopened");
    expect(updated?.verification?.status).toBe("REJECTED");
    expect(updated?.verification?.rejectionReason).toContain(rejectionReason);
    expect(updated?.resolutionAttempts?.[0]?.verificationStatus).toBe("REJECTED");

    // History has recorded the reopen event
    const reopenHistory = updated?.statusHistory.find((s) => s.status === "reopened");
    expect(reopenHistory).toBeDefined();
    expect(reopenHistory?.note).toContain(rejectionReason);
  });

  it("should handle second resolution attempt after a citizen reopens", async () => {
    const authority = await createTestUser({ role: "authority", clerkId: "user_authority_second_try" });
    const citizen = await createTestUser({ clerkId: "user_citizen_second_try" });

    // Existing reopened complaint with 1 rejected attempt
    const complaint = await createTestComplaint(citizen._id, {
      status: "reopened",
      verification: { status: "REJECTED", rejectionReason: "Insufficient bitumen asphalt" },
      resolutionAttempts: [
        {
          attemptNumber: 1,
          afterImage: "https://example.com/attempt-1.jpg",
          uploadedBy: authority._id,
          uploadedAt: new Date(Date.now() - 86400000),
          verificationStatus: "REJECTED",
        },
      ],
    });

    const secondAfterImg = "https://example.com/attempt-2-asphalt.jpg";
    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/resolution`)
      .set("x-test-clerk-id", authority.clerkId)
      .send({
        afterImage: secondAfterImg,
        note: "Relayed with hot-mix asphalt and steam rolled",
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe("awaiting_citizen_verification");

    const updated = await Complaint.findById(complaint._id);
    expect(updated?.resolutionAttempts).toHaveLength(2);
    expect(updated?.resolutionAttempts?.[1]?.attemptNumber).toBe(2);
    expect(updated?.resolutionAttempts?.[1]?.afterImage).toBe(secondAfterImg);
    expect(updated?.resolutionAttempts?.[1]?.verificationStatus).toBe("PENDING");
  });

  it("should close complaint directly with proof image via POST /:id/resolve", async () => {
    const authority = await createTestUser({ role: "authority", clerkId: "user_authority_resolve" });
    const citizen = await createTestUser({ clerkId: "user_citizen_owner2" });

    const complaint = await createTestComplaint(citizen._id, {
      status: "in_progress",
    });

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/resolve`)
      .set("x-test-clerk-id", authority.clerkId)
      .send({
        resolutionNote: "Direct site completion verified with municipal inspector.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Complaint.findById(complaint._id);
    expect(updated?.status).toBe("resolved");
    expect(updated?.resolvedAt).toBeDefined();
    expect(updated?.resolutionNote).toBe("Direct site completion verified with municipal inspector.");
  });

  it("should reject verify request when unauthenticated", async () => {
    const citizen = await createTestUser({ clerkId: "user_verify_unauth" });
    const complaint = await createTestComplaint(citizen._id, {
      status: "awaiting_citizen_verification",
    });

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/verify`)
      .set("x-test-clerk-id", "none");

    expect(res.status).toBe(401);
  });
});
