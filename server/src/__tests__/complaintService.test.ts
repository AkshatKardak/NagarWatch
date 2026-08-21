import { getSLADeadline } from "../services/slaService";
import { calculatePriorityScore } from "../services/priorityService";

describe("SLA and Complaint Priority Service", () => {
  it("should calculate correct SLA deadlines based on category", () => {
    const potholeDeadline = getSLADeadline("pothole");
    expect(potholeDeadline).toBeInstanceOf(Date);
    expect(potholeDeadline.getTime()).toBeGreaterThan(Date.now());

    const garbageDeadline = getSLADeadline("garbage");
    expect(garbageDeadline.getTime()).toBeGreaterThan(Date.now());
  });

  it("should calculate priority score with critical keywords", () => {
    const { score, priority } = calculatePriorityScore({
      title: "Urgent open manhole causing immediate life hazard",
      description: "Severe hazard near school entrance danger accident",
      upvoteCount: 15,
      createdAt: new Date(),
    });

    expect(score).toBeGreaterThanOrEqual(50);
    expect(["high", "critical"]).toContain(priority);
  });

  it("should give lower score for standard non-urgent complaints", () => {
    const { score, priority } = calculatePriorityScore({
      title: "Faint streetlight flickering occasionally",
      description: "Minor issue noticed yesterday evening",
      upvoteCount: 0,
      createdAt: new Date(),
    });

    expect(score).toBeLessThan(70);
  });
});
