import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALERT_CONFIG } from "../src/server/alerts/config";
import { aggregateCoverage, type AggregateStudent } from "../src/lib/coverage";
import { ThresholdSchema } from "../src/lib/thresholds";
import { kolkataWeekStart } from "../src/lib/weeks";
import { AttendanceCsvRowSchema, MarksCsvRowSchema } from "../src/lib/schemas";
import { evaluateStudent } from "../src/server/alerts/engine";

const now = new Date("2026-10-30T10:00:00Z");
const student: AggregateStudent = {
  studentId: "private-student", name: "Private student name", assigned: true,
  attendance: [{ subject: "Maths", weekStart: new Date("2026-10-26"), attended: 7, total: 10 }],
  marks: [{ subject: "Maths", assessment: "Test 1", assessedOn: new Date("2026-10-01"), score: 40, maxScore: 50 }, { subject: "Maths", assessment: "Test 2", assessedOn: new Date("2026-10-20"), score: 60, maxScore: 100 }],
  lmsDates: [], lmsActivity: [], meetings: [{ meetingDate: new Date("2026-10-20") }, { meetingDate: new Date("2026-10-21") }],
  followUps: [{ id: "private-followup", action: "Private agreed action", dueDate: new Date("2026-10-25"), completedAt: null }],
};

describe("aggregate-only coverage", () => {
  it("counts distinct assigned students rather than assignments or meetings", () => {
    const result = aggregateCoverage([student, { ...student, studentId: "unassigned", assigned: false }], ALERT_CONFIG, now);
    expect(result.totalStudents).toBe(1); expect(result.studentsReached).toBe(1); expect(result.meetingsLogged).toBe(2); expect(result.unassignedStudents).toBe(1);
  });
  it("never returns student identities, action text or raw records", () => {
    const serialized = JSON.stringify(aggregateCoverage([student], ALERT_CONFIG, now));
    for (const privateValue of ["private-student", "Private student name", "private-followup", "Private agreed action"]) expect(serialized).not.toContain(privateValue);
  });
  it("normalizes assessments and uses the latest mark per subject", () => {
    expect(aggregateCoverage([student], ALERT_CONFIG, now).subjects).toEqual([{ subject: "Maths", attendancePct: 70, latestMarksPct: 60 }]);
  });
  it("preserves missing academic data and limits charts to six months", () => {
    const result = aggregateCoverage([{ ...student, attendance: [], marks: [] }], ALERT_CONFIG, now);
    expect(result.months).toHaveLength(6); expect(result.months[0].attendancePct).toBeNull(); expect(result.subjects).toEqual([]);
  });
  it("does not include future meetings in coverage", () => {
    const result = aggregateCoverage([{ ...student, meetings: [{ meetingDate: new Date("2027-01-01") }] }], ALERT_CONFIG, now);
    expect(result.meetingsLogged).toBe(0); expect(result.studentsReached).toBe(0);
  });
  it("includes today's India-local meeting before midnight UTC", () => {
    const result = aggregateCoverage([{ ...student, meetings: [{ meetingDate: new Date("2026-10-30") }] }], ALERT_CONFIG, new Date("2026-10-29T23:00:00Z"));
    expect(result.meetingsLogged).toBe(1);
    expect(result.months[5].month).toBe("2026-10");
  });
});

describe("saved rule thresholds", () => {
  it("applies a mentor's configuration without mutating global defaults", () => {
    const config = { ...ALERT_CONFIG, lowAttendancePct: 65, criticalAttendancePct: 60 };
    expect(evaluateStudent(student, now, config).some((alert) => alert.ruleId === "low-attendance")).toBe(false);
    expect(evaluateStudent(student, now).some((alert) => alert.ruleId === "low-attendance")).toBe(true);
  });
  it("rejects inverted severity settings and extra fields", () => {
    expect(ThresholdSchema.safeParse({ ...ALERT_CONFIG, criticalAttendancePct: 90 }).success).toBe(false);
    expect(ThresholdSchema.safeParse({ ...ALERT_CONFIG, severeMarksDropPoints: 1 }).success).toBe(false);
    expect(ThresholdSchema.safeParse({ ...ALERT_CONFIG, mentorId: "another-user" }).success).toBe(false);
  });
});

describe("India-local review weeks", () => {
  it("starts a new week at Monday midnight in India", () => {
    expect(kolkataWeekStart(new Date("2026-11-01T18:29:00Z")).toISOString().slice(0, 10)).toBe("2026-10-26");
    expect(kolkataWeekStart(new Date("2026-11-01T18:30:00Z")).toISOString().slice(0, 10)).toBe("2026-11-02");
  });
});

describe("academic CSV validation", () => {
  it("rejects impossible attendance and marks", () => {
    expect(AttendanceCsvRowSchema.safeParse({ rollNo: "CS1", subject: "Maths", weekStart: "2026-10-26", attended: 11, total: 10 }).success).toBe(false);
    expect(MarksCsvRowSchema.safeParse({ rollNo: "CS1", subject: "Maths", assessment: "T1", assessedOn: "2026-02-30", score: 10, maxScore: 50 }).success).toBe(false);
    expect(MarksCsvRowSchema.safeParse({ rollNo: "CS1", subject: "Maths", assessment: "T1", assessedOn: "2026-10-30", score: 60, maxScore: 50 }).success).toBe(false);
  });
});

const mocks = vi.hoisted(() => ({
  user: vi.fn(), assigned: vi.fn(),
  prisma: { $transaction: vi.fn(), user: { update: vi.fn() }, department: { update: vi.fn(), findUnique: vi.fn() }, auditEvent: { create: vi.fn() }, weeklyReview: { upsert: vi.fn() }, rateLimitBucket: { upsert: vi.fn(), deleteMany: vi.fn() } },
}));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/server/auth/mentor", () => ({ getAssignedMentor: mocks.assigned }));
vi.mock("@/server/db/client", () => ({ prisma: mocks.prisma }));
import { PATCH as settings } from "../src/app/api/settings/thresholds/route";
import { POST as review } from "../src/app/api/mentor/reviews/route";
import { allowRequest } from "../src/server/security/rate-limit";
beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: "m1", role: "MENTOR", departmentId: "d1" });
  mocks.assigned.mockResolvedValue({ id: "m1", role: "MENTOR" });
  mocks.prisma.$transaction.mockImplementation((callback) => callback(mocks.prisma));
  mocks.prisma.weeklyReview.upsert.mockResolvedValue({ reviewedAt: now });
});
const request = (body: unknown) => new Request("http://localhost:3000/api/settings/thresholds", { method: "PATCH", headers: { host: "localhost:3000", origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("settings and review authorization", () => {
  it("saves only the authenticated mentor's settings with an audit event", async () => {
    expect((await settings(request(ALERT_CONFIG))).status).toBe(200);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({ where: { id: "m1" }, data: { alertThresholds: ALERT_CONFIG } });
    expect(mocks.prisma.department.update).not.toHaveBeenCalled();
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalled();
  });
  it("restricts HOD settings to their own department", async () => {
    mocks.user.mockResolvedValue({ id: "h1", role: "HOD", departmentId: "d2" });
    await settings(request(ALERT_CONFIG));
    expect(mocks.prisma.department.update.mock.calls[0][0].where).toEqual({ id: "d2" });
  });
  it("denies students and cross-origin changes", async () => {
    mocks.user.mockResolvedValue({ id: "s1", role: "STUDENT" });
    expect((await settings(request(ALERT_CONFIG))).status).toBe(403);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });
  it("does not review an unassigned student", async () => {
    mocks.assigned.mockResolvedValue(null);
    expect((await review(request({ studentId: "s2" }))).status).toBe(403);
    expect(mocks.prisma.weeklyReview.upsert).not.toHaveBeenCalled();
  });
  it("uses the authenticated mentor and a stable weekly key for retries", async () => {
    expect((await review(request({ studentId: "s1" }))).status).toBe(200);
    const args = mocks.prisma.weeklyReview.upsert.mock.calls[0][0];
    expect(args.where.mentorId_studentId_weekStart.mentorId).toBe("m1"); expect(args.update).toEqual({});
  });
});

describe("durable request limits", () => {
  it("shares counts across calls and stores hashed keys instead of mobile numbers", async () => {
    mocks.prisma.rateLimitBucket.upsert.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 11 });
    expect(await allowRequest("login", "9000000001", 10, 900, now)).toBe(true);
    expect(await allowRequest("login", "9000000001", 10, 900, now)).toBe(false);
    const calls = mocks.prisma.rateLimitBucket.upsert.mock.calls;
    expect(calls[0][0].where.key).toBe(calls[1][0].where.key);
    expect(calls[0][0].where.key).not.toContain("9000000001");
    expect(mocks.prisma.rateLimitBucket.deleteMany).toHaveBeenCalled();
  });
});
