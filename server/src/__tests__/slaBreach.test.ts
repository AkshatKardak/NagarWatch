import { Complaint } from "../models/Complaint";
import { Notification } from "../models/Notification";
import { runSLACheck, startSLAChecker } from "../jobs/slaChecker";
import { getSLADeadline, getSLAWarningDelay, getSLABreachDelay, checkAndEscalate } from "../services/slaService";
import { setupMemoryDB, teardownMemoryDB, clearDB, createTestUser, createTestComplaint } from "./helpers/testDb";

describe("Flow 2: SLA Breach Detection & Automated Escalation Checker", () => {
  beforeAll(async () => {
    await setupMemoryDB();
  });

  afterAll(async () => {
    await teardownMemoryDB();
  });

  beforeEach(async () => {
    jest.useRealTimers();
    await clearDB();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should calculate category-specific SLA deadlines dynamically with fake timers", () => {
    const fixedTime = new Date("2026-06-01T12:00:00.000Z");
    jest.useFakeTimers();
    jest.setSystemTime(fixedTime);

    const waterDeadline = getSLADeadline("water");
    const garbageDeadline = getSLADeadline("garbage");
    const potholeDeadline = getSLADeadline("pothole");

    expect((waterDeadline.getTime() - fixedTime.getTime()) / (3600 * 1000)).toBe(24);
    expect((garbageDeadline.getTime() - fixedTime.getTime()) / (3600 * 1000)).toBe(48);
    expect((potholeDeadline.getTime() - fixedTime.getTime()) / (3600 * 1000)).toBe(72);

    // Verify warning delay is 80% of deadline
    const waterWarning = getSLAWarningDelay("water");
    expect(waterWarning).toBe(24 * 0.8 * 3600 * 1000);

    const waterBreach = getSLABreachDelay("water");
    expect(waterBreach).toBe(24 * 3600 * 1000);

    jest.useRealTimers();
  });

  it("should not breach or escalate complaints that are within their SLA deadline", async () => {
    const user = await createTestUser({ clerkId: "user_within_sla" });
    const deadline = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours in future

    const complaint = await createTestComplaint(user._id, {
      category: "garbage",
      status: "pending",
      sla: {
        deadline,
        breached: false,
        warningEmailSent: false,
        escalationLevel: 0,
        escalationLog: [],
      },
    });

    // Run checker before deadline passes
    await runSLACheck();

    const updated = await Complaint.findById(complaint._id);
    expect(updated?.sla.breached).toBe(false);
    expect(updated?.sla.escalationLevel).toBe(0);
    expect(updated?.sla.escalationLog).toHaveLength(0);
  });

  it("should detect overdue complaints and escalate to level 1 with escalation log and notification", async () => {
    const user = await createTestUser({ clerkId: "user_breached_sla" });
    // Overdue complaint: deadline is in the past
    const pastDeadline = new Date(Date.now() - 3600 * 1000);

    const complaint = await createTestComplaint(user._id, {
      category: "water",
      status: "in_progress",
      sla: {
        deadline: pastDeadline,
        breached: false,
        warningEmailSent: false,
        escalationLevel: 0,
        escalationLog: [],
      },
    });

    await runSLACheck();

    const escalated = await Complaint.findById(complaint._id);
    expect(escalated?.sla.breached).toBe(true);
    expect(escalated?.sla.escalationLevel).toBe(1);
    expect(escalated?.sla.escalationLog).toHaveLength(1);
    expect(escalated?.sla.escalationLog?.[0]?.level).toBe(1);
    expect(escalated?.sla.escalationLog?.[0]?.reason).toContain("SLA deadline breached");

    // Notification generated for submitter
    const notifications = await Notification.find({ userId: user.clerkId });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]?.type).toBe("escalation");
    expect(notifications[0]?.message).toContain("escalated to level 1");
  });

  it("should verify timing logic: simulate time shift with Date manipulation", async () => {
    const user = await createTestUser({ clerkId: "user_fake_time" });
    const creationTime = new Date();
    const deadline = new Date(creationTime.getTime() + 24 * 3600 * 1000);

    const complaint = await createTestComplaint(user._id, {
      category: "water",
      status: "pending",
      sla: {
        deadline,
        breached: false,
        warningEmailSent: false,
        escalationLevel: 0,
        escalationLog: [],
      },
    });

    // Initial check: not overdue
    await runSLACheck();
    let current = await Complaint.findById(complaint._id);
    expect(current?.sla.breached).toBe(false);

    // Simulate time elapsed past deadline by updating deadline to past
    await Complaint.findByIdAndUpdate(complaint._id, {
      "sla.deadline": new Date(Date.now() - 10000),
    });

    await runSLACheck();
    current = await Complaint.findById(complaint._id);
    expect(current?.sla.breached).toBe(true);
    expect(current?.sla.escalationLevel).toBe(1);
  });

  it("should cap escalation level at level 2 upon subsequent breach checks", async () => {
    const user = await createTestUser({ clerkId: "user_multi_escalate" });
    const pastDeadline = new Date(Date.now() - 3600 * 1000);

    const complaint = await createTestComplaint(user._id, {
      category: "pothole",
      status: "pending",
      sla: {
        deadline: pastDeadline,
        breached: true,
        warningEmailSent: true,
        escalationLevel: 1,
        escalationLog: [
          { level: 1, escalatedAt: new Date(Date.now() - 2000), reason: "First breach" },
        ],
      },
    });

    // Direct escalation check
    await checkAndEscalate(complaint._id.toString());

    let updated = await Complaint.findById(complaint._id);
    expect(updated?.sla.escalationLevel).toBe(2);
    expect(updated?.sla.escalationLog).toHaveLength(2);

    // Another check should remain capped at level 2
    await checkAndEscalate(complaint._id.toString());
    updated = await Complaint.findById(complaint._id);
    expect(updated?.sla.escalationLevel).toBe(2);
  });

  it("should ignore resolved complaints even when their deadline has passed", async () => {
    const user = await createTestUser({ clerkId: "user_resolved_sla" });
    const pastDeadline = new Date(Date.now() - 100000);

    const complaint = await createTestComplaint(user._id, {
      category: "pothole",
      status: "resolved",
      sla: {
        deadline: pastDeadline,
        breached: false,
        warningEmailSent: false,
        escalationLevel: 0,
        escalationLog: [],
      },
    });

    await runSLACheck();

    const checked = await Complaint.findById(complaint._id);
    expect(checked?.sla.breached).toBe(false);
    expect(checked?.sla.escalationLevel).toBe(0);
  });

  it("should initialize periodic checker via startSLAChecker and return timer", () => {
    const intervalTimer = startSLAChecker(60000);
    expect(intervalTimer).toBeDefined();
    clearInterval(intervalTimer);
  });
});
