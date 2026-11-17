import request from "supertest";
import app from "../index";
import { Complaint } from "../models/Complaint";
import { setupMemoryDB, teardownMemoryDB, clearDB, createTestUser } from "./helpers/testDb";

describe("Flow 1: Complaint Submission & Validation API", () => {
  beforeAll(async () => {
    await setupMemoryDB();
  });

  afterAll(async () => {
    await teardownMemoryDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  it("should reject complaint submission when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", "none")
      .send({
        title: "Large open pothole on Main Street",
        description: "Hazardous crater damaging car tires",
        category: "pothole",
        address: "Main Street, Ward 5",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should reject submission when title is missing", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", "user_citizen_1")
      .send({
        description: "Hazardous crater damaging car tires",
        category: "pothole",
        address: "Main Street, Ward 5",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/title.*required/i);
  });

  it("should reject submission when description is missing", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", "user_citizen_1")
      .send({
        title: "Large open pothole",
        category: "pothole",
        address: "Main Street, Ward 5",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/description.*required/i);
  });

  it("should reject submission when category is missing", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", "user_citizen_1")
      .send({
        title: "Large open pothole",
        description: "Hazardous crater damaging car tires",
        address: "Main Street, Ward 5",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/category.*required/i);
  });

  it("should reject submission when address is missing", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", "user_citizen_1")
      .send({
        title: "Large open pothole",
        description: "Hazardous crater damaging car tires",
        category: "pothole",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/address.*required/i);
  });

  it("should successfully create a complaint with valid payload", async () => {
    const user = await createTestUser({ clerkId: "user_valid_submitter" });

    const payload = {
      title: "Overflowing municipal garbage bin near school",
      description: "Severe bio-waste overflow accumulating for past 4 days causing severe foul smell",
      category: "garbage",
      address: "12 Gandhi Chowk, Ward 7",
      lat: "19.0760",
      lng: "72.8777",
      landmark: "Opposite National High School",
    };

    const beforeTime = Date.now();
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user.clerkId)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint).toBeDefined();

    const created = res.body.complaint;
    expect(created.title).toBe(payload.title);
    expect(created.category).toBe("garbage");
    expect(created.status).toBe("pending");
    expect(created.priority).toBeDefined();
    expect(created.priorityScore).toBeGreaterThanOrEqual(0);

    // Location coordinates dynamically parsed
    expect(created.location.coordinates).toEqual([72.8777, 19.0760]);
    expect(created.location.address).toBe(payload.address);
    expect(created.location.landmark).toBe(payload.landmark);

    // SLA deadline should be dynamically set in the future (garbage SLA is 48 hours)
    const deadlineTime = new Date(created.sla.deadline).getTime();
    expect(deadlineTime).toBeGreaterThan(beforeTime);
    const diffHours = (deadlineTime - beforeTime) / (1000 * 3600);
    expect(Math.round(diffHours)).toBe(48);

    // Initial status history
    expect(created.statusHistory).toHaveLength(1);
    expect(created.statusHistory[0].status).toBe("pending");

    // Verify persisted in MongoDB
    const dbDoc = await Complaint.findById(created._id);
    expect(dbDoc).not.toBeNull();
    expect(dbDoc?.status).toBe("pending");
  });

  it("should normalize category input with spaces and mixed case", async () => {
    const user = await createTestUser({ clerkId: "user_normalize_tester" });

    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user.clerkId)
      .send({
        title: "Dead Streetlight on bypass road",
        description: "Light pole is completely non-functional at night",
        category: "Street Light", // Should normalize to streetlight
        address: "Bypass Junction, Ward 3",
      });

    expect(res.status).toBe(201);
    expect(res.body.complaint.category).toBe("streetlight");
  });

  it("should accept image file upload in complaint submission", async () => {
    const user = await createTestUser({ clerkId: "user_upload_tester" });

    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user.clerkId)
      .field("title", "Broken water pipeline leaking clean water")
      .field("description", "Pipeline joint burst, flooding the pavement")
      .field("category", "water")
      .field("address", "Water Tank Road, Ward 2")
      .attach("image", Buffer.from("fake image data"), "leak.jpg");

    expect(res.status).toBe(201);
    expect(res.body.complaint.images.before).toContain("mock-proof.jpg");
  });
});
