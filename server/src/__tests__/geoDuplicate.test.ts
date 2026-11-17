import request from "supertest";
import app from "../index";
import { Complaint } from "../models/Complaint";
import { findNearbyComplaints } from "../services/geoService";
import { setupMemoryDB, teardownMemoryDB, clearDB, createTestUser, createTestComplaint } from "./helpers/testDb";

describe("Flow 3: Geo-Duplicate Rejection API & Geospatial Proximity", () => {
  beforeAll(async () => {
    await setupMemoryDB();
    await Complaint.createIndexes();
  });

  afterAll(async () => {
    await teardownMemoryDB();
  });

  beforeEach(async () => {
    await clearDB();
    await Complaint.createIndexes();
  });

  // Base coordinates: Marine Drive, Mumbai
  const BASE_LNG = 72.8238;
  const BASE_LAT = 18.9438;

  // Very close coordinates (~10 meters away)
  const NEARBY_LNG = 72.82389;
  const NEARBY_LAT = 18.94385;

  // Distant coordinates (~500 meters away)
  const DISTANT_LNG = 72.8285;
  const DISTANT_LAT = 18.9480;

  it("should refuse a second report within 50m of an open complaint and return duplicate payload", async () => {
    const user1 = await createTestUser({ clerkId: "user_citizen_first" });
    const user2 = await createTestUser({ clerkId: "user_citizen_second" });

    // 1. First user reports an open pothole
    const existing = await createTestComplaint(user1._id, {
      title: "Dangerous pothole near Marine Drive promenade",
      category: "pothole",
      status: "pending",
      location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT],
        address: "Marine Drive, Ward A",
      },
    });

    // 2. Second user attempts to submit a complaint at nearby coordinates (~10m away)
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user2.clerkId)
      .send({
        title: "Deep road crater at promenade edge",
        description: "Road broken and causing vehicle damage",
        category: "pothole",
        address: "Marine Drive Promenade",
        lat: String(NEARBY_LAT),
        lng: String(NEARBY_LNG),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.duplicate).toBe(true);
    expect(res.body.nearbyCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.nearbyComplaints)).toBe(true);

    // Assert that the returned duplicate matches the existing complaint ID
    const foundIds = res.body.nearbyComplaints.map((c: any) => c._id.toString());
    expect(foundIds).toContain(existing._id.toString());

    // Distance must be <= 50 meters
    const matchedComplaint = res.body.nearbyComplaints.find((c: any) => c._id.toString() === existing._id.toString());
    expect(matchedComplaint.distance).toBeLessThanOrEqual(50);
  });

  it("should accept report at the same location if existing complaint is already resolved", async () => {
    const user1 = await createTestUser({ clerkId: "user_first_resolved" });
    const user2 = await createTestUser({ clerkId: "user_second_new" });

    // Existing complaint at the location is marked resolved
    await createTestComplaint(user1._id, {
      title: "Previously repaired pothole",
      category: "pothole",
      status: "resolved",
      location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT],
        address: "Marine Drive, Ward A",
      },
    });

    // New report within 10 meters should not be rejected
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user2.clerkId)
      .send({
        title: "New recurring pothole formed after heavy monsoon",
        description: "New fissure appeared at same spot",
        category: "pothole",
        address: "Marine Drive Promenade",
        lat: String(NEARBY_LAT),
        lng: String(NEARBY_LNG),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.duplicate).toBeUndefined();
    expect(res.body.complaint).toBeDefined();
  });

  it("should accept report when location is beyond the 50m threshold", async () => {
    const user1 = await createTestUser({ clerkId: "user_resident_1" });
    const user2 = await createTestUser({ clerkId: "user_resident_2" });

    await createTestComplaint(user1._id, {
      title: "Garbage pile at corner A",
      category: "garbage",
      status: "pending",
      location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT],
        address: "Marine Drive, Ward A",
      },
    });

    // Submit at distant location (~500m away)
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user2.clerkId)
      .send({
        title: "Garbage pile at corner B",
        description: "Separate trash accumulation 500m away",
        category: "garbage",
        address: "Nariman Point Junction",
        lat: String(DISTANT_LAT),
        lng: String(DISTANT_LNG),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.title).toBe("Garbage pile at corner B");
  });

  it("should bypass duplicate rejection when forceCreate is true", async () => {
    const user1 = await createTestUser({ clerkId: "user_resident_orig" });
    const user2 = await createTestUser({ clerkId: "user_resident_override" });

    await createTestComplaint(user1._id, {
      title: "Broken streetlight pole",
      category: "streetlight",
      status: "in_progress",
      location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT],
        address: "Marine Drive, Ward A",
      },
    });

    // Submit near identical location with forceCreate: "true"
    const res = await request(app)
      .post("/api/complaints")
      .set("x-test-clerk-id", user2.clerkId)
      .send({
        title: "Distinct electrical hazard on opposite sidewalk",
        description: "Exposed wire hanging from adjacent fixture",
        category: "streetlight",
        address: "Marine Drive",
        lat: String(NEARBY_LAT),
        lng: String(NEARBY_LNG),
        forceCreate: "true",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint).toBeDefined();
  });

  it("should calculate spherical distance correctly in findNearbyComplaints", async () => {
    const user = await createTestUser({ clerkId: "user_geo_tester" });

    await createTestComplaint(user._id, {
      title: "Nearby leak",
      category: "water",
      status: "pending",
      location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT],
        address: "Marine Drive Test Location",
      },
    });

    const results = await findNearbyComplaints(NEARBY_LNG, NEARBY_LAT, 50);
    expect(results.length).toBe(1);
    expect(results[0]?.distance).toBeDefined();
    expect(results[0]?.distance).toBeGreaterThan(0);
    expect(results[0]?.distance).toBeLessThanOrEqual(50);

    // Search with 5m radius should return empty
    const tinyRadiusResults = await findNearbyComplaints(NEARBY_LNG, NEARBY_LAT, 5);
    expect(tinyRadiusResults.length).toBe(0);
  });
});
