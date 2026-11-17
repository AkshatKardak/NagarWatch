import request from "supertest";
import app from "../index";
import { Complaint } from "../models/Complaint";
import { setupMemoryDB, teardownMemoryDB, clearDB, createTestUser, createTestComplaint } from "./helpers/testDb";

describe("Flow 5: RTI Draft Generation API (RTI Act 2005 Section 6(1))", () => {
  beforeAll(async () => {
    await setupMemoryDB();
  });

  afterAll(async () => {
    await teardownMemoryDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  it("should reject RTI draft generation when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/v1/ai/rti")
      .set("x-test-clerk-id", "none")
      .send({
        complaintId: "507f1f77bcf86cd799439011",
        applicantName: "Ramesh Sharma",
        applicantAddress: "Plot 42, Civil Lines",
      });

    expect(res.status).toBe(401);
  });

  it("should reject RTI generation when required applicant fields are missing", async () => {
    const user = await createTestUser({ clerkId: "user_rti_validator" });

    // Missing applicantAddress
    const res = await request(app)
      .post("/api/v1/ai/rti")
      .set("x-test-clerk-id", user.clerkId)
      .send({
        complaintId: "507f1f77bcf86cd799439011",
        applicantName: "Ramesh Sharma",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("required");
  });

  it("should return 404 when referenced complaint does not exist", async () => {
    const user = await createTestUser({ clerkId: "user_rti_notfound" });

    const nonExistentId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .post("/api/v1/ai/rti")
      .set("x-test-clerk-id", user.clerkId)
      .send({
        complaintId: nonExistentId,
        applicantName: "Ramesh Sharma",
        applicantAddress: "Plot 42, Civil Lines",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Complaint not found");
  });

  it("should generate Section 6(1) RTI draft for a complaint pending over 30 days", async () => {
    const citizen = await createTestUser({ clerkId: "user_rti_applicant" });

    // Create a complaint dated 45 days in the past
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 3600 * 1000);
    const complaint = await createTestComplaint(citizen._id, {
      title: "Contaminated drinking water pipeline in Ward 8",
      description: "Tap water has severe yellow discoloration and foul sewage odor for over a month",
      category: "water",
      status: "pending",
      createdAt: fortyFiveDaysAgo,
    });

    // Explicitly update createdAt in MongoDB
    await Complaint.findByIdAndUpdate(complaint._id, { createdAt: fortyFiveDaysAgo });

    const res = await request(app)
      .post("/api/v1/ai/rti")
      .set("x-test-clerk-id", citizen.clerkId)
      .send({
        complaintId: complaint._id.toString(),
        applicantName: "Smt. Sunita Patil",
        applicantAddress: "B-404, Shanti Nagar, Ward 8",
        applicantPhone: "9876543210",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.daysPending).toBeGreaterThanOrEqual(30);

    const letter = res.body.letter;
    expect(letter).toBeDefined();

    // Legal RTI Act 2005 Section 6(1) and Section 7(1) verification
    expect(letter).toContain("Section 6(1)");
    expect(letter).toContain("RIGHT TO INFORMATION ACT, 2005");
    expect(letter).toContain("Section 7(1)");
    expect(letter).toContain("Public Information Officer");

    // Returned complaint meta
    expect(res.body.complaint.id).toBe(complaint._id.toString());
    expect(res.body.complaint.title).toBe("Contaminated drinking water pipeline in Ward 8");
  });

  it("should correctly compute daysPending dynamically for complaints of varying ages", async () => {
    const citizen = await createTestUser({ clerkId: "user_rti_days" });

    const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 3600 * 1000);
    const complaint = await createTestComplaint(citizen._id, {
      title: "Broken storm water drain overflow",
      category: "drainage",
      createdAt: thirtyTwoDaysAgo,
    });
    await Complaint.findByIdAndUpdate(complaint._id, { createdAt: thirtyTwoDaysAgo });

    const res = await request(app)
      .post("/api/ai/rti")
      .set("x-test-clerk-id", citizen.clerkId)
      .send({
        complaintId: complaint._id.toString(),
        applicantName: "Anil Kulkarni",
        applicantAddress: "Shivaji Nagar",
      });

    expect(res.status).toBe(200);
    expect(res.body.daysPending).toBeGreaterThanOrEqual(31);
    expect(res.body.daysPending).toBeLessThanOrEqual(33);
  });

  it("should generate RTI draft via /ai/rti direct alias route", async () => {
    const citizen = await createTestUser({ clerkId: "user_rti_alias" });

    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 3600 * 1000);
    const complaint = await createTestComplaint(citizen._id, {
      title: "Hazardous potholes on link road",
      createdAt: thirtyFiveDaysAgo,
    });
    await Complaint.findByIdAndUpdate(complaint._id, { createdAt: thirtyFiveDaysAgo });

    const res = await request(app)
      .post("/ai/rti")
      .set("x-test-clerk-id", citizen.clerkId)
      .send({
        complaintId: complaint._id.toString(),
        applicantName: "Pooja Deshmukh",
        applicantAddress: "Link Road, Ward 4",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.letter).toContain("Section 6(1)");
  });
});
