import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), run: vi.fn(), limit: vi.fn(), prisma: {
  automationNotice: { findMany: vi.fn(), updateMany: vi.fn() }, mentorAssignment: { findMany: vi.fn(), count: vi.fn() },
  automationJob: { findFirst: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), upsert: vi.fn() }, studentCheckIn: { upsert: vi.fn() },
  department: { findMany: vi.fn() }, automationRun: { groupBy: vi.fn() },
  automationSettings: { upsert: vi.fn() }, auditEvent: { create: vi.fn() }, $transaction: vi.fn(),
} }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: m.user }));
vi.mock("@/server/db/client", () => ({ prisma: m.prisma }));
vi.mock("@/server/automations/runner", () => ({ runDepartmentAutomations: m.run }));
vi.mock("@/server/security/rate-limit", () => ({ allowRequest: m.limit }));
import { automationInbox } from "../src/server/automations/access";
import { POST as checkin } from "../src/app/api/automations/check-in/route";
import { PATCH as settings } from "../src/app/api/automations/settings/route";
import { POST as run } from "../src/app/api/automations/run/route";
import { GET as cron } from "../src/app/api/cron/automations/route";
import { GET as download, PATCH as cancel } from "../src/app/api/automations/jobs/[id]/route";
import { POST as schedule } from "../src/app/api/automations/imports/route";
const req = (body: unknown = {}, method = "POST", origin = "http://localhost:3000") => new Request("http://localhost:3000/api/automations", { method, headers: { host: "localhost:3000", origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); m.prisma.$transaction.mockImplementation((callback) => callback(m.prisma)); m.user.mockResolvedValue({ id: "h1", role: "HOD", departmentId: "d1" }); m.limit.mockResolvedValue(true); });
afterEach(() => vi.unstubAllEnvs());

describe("automation privacy and roles", () => {
  it("removes former mentees from stored weekly agendas", async () => {
    m.prisma.mentorAssignment.findMany.mockResolvedValue([{ studentId: "current" }]);
    m.prisma.automationNotice.findMany.mockResolvedValue([{ kind: "agenda", body: { items: [{ studentId: "current", name: "Current" }, { studentId: "former", name: "Private former student" }] } }]);
    const result = await automationInbox({ id: "m1", role: "MENTOR", departmentId: "d1" });
    expect(JSON.stringify(result)).not.toContain("Private former student");
    expect(m.prisma.automationNotice.findMany.mock.calls[0][0].where.userId).toBe("m1");
  });
  it("derives check-in student identity from the session and rejects forged fields", async () => {
    m.user.mockResolvedValue({ id: "u1", role: "STUDENT", departmentId: "d1", student: { id: "own" } });
    expect((await checkin(req({ progress: "Going well", support: "", studentId: "other" }))).status).toBe(400);
    expect((await checkin(req({ progress: "Going well", support: "Need a book" }))).status).toBe(200);
    expect(m.prisma.studentCheckIn.upsert.mock.calls[0][0].where.studentId_weekStart.studentId).toBe("own");
  });
  it("restricts settings and manual runs to HODs and their own department", async () => {
    m.run.mockResolvedValue({ status: "completed" });
    await run(req()); expect(m.run).toHaveBeenCalledWith("d1");
    m.user.mockResolvedValue({ id: "m1", role: "MENTOR", departmentId: "d1" });
    expect((await run(req())).status).toBe(403); expect((await settings(req({}, "PATCH"))).status).toBe(403);
  });
  it("rejects cross-origin changes", async () => {
    expect((await run(req({}, "POST", "https://other.example"))).status).toBe(403);
    expect(m.run).not.toHaveBeenCalled();
  });
  it("denies cron execution without the exact configured secret", async () => {
    expect((await cron(new Request("http://localhost:3000/api/cron/automations"))).status).toBe(403);
    expect(m.run).not.toHaveBeenCalled();
  });
  it("runs the protected cron for all due departments with the configured secret", async () => {
    const secret = "a-long-random-cron-test-secret-123456";
    vi.stubEnv("CRON_SECRET", secret);
    m.prisma.department.findMany.mockResolvedValue([{ id: "d1" }, { id: "d2" }]);
    m.prisma.automationRun.groupBy.mockResolvedValue([]);
    m.run.mockResolvedValue({ status: "completed" });
    const response = await cron(new Request("http://localhost:3000/api/cron/automations", { headers: { authorization: `Bearer ${secret}` } }));
    expect(response.status).toBe(200); expect((await response.json()).completed).toBe(2);
    expect(m.run.mock.calls.map((call) => call[0])).toEqual(["d1", "d2"]);
  });
  it("deduplicates a retried scheduled import without saving a second job", async () => {
    const body = { type: "lms", csv: "rollNo,activityOn,events\nR1,2026-10-30,3", dueAt: new Date(Date.now() + 86400000).toISOString() };
    m.prisma.automationJob.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "j1" });
    m.prisma.automationJob.count.mockResolvedValue(0); m.prisma.automationJob.upsert.mockResolvedValue({ id: "j1" });
    expect((await schedule(req(body))).status).toBe(201);
    expect((await (await schedule(req(body))).json()).duplicate).toBe(true);
    expect(m.prisma.automationJob.upsert).toHaveBeenCalledTimes(1);
    expect(m.prisma.automationJob.upsert.mock.calls[0][0].create.departmentId).toBe("d1");
  });
  it("blocks a stored register after an assignment changes", async () => {
    m.user.mockResolvedValue({ id: "m1", role: "MENTOR", departmentId: "d1" });
    m.prisma.automationJob.findFirst.mockResolvedValue({ artifact: new Uint8Array([1]), result: { studentIds: ["former"] } });
    m.prisma.mentorAssignment.count.mockResolvedValue(0);
    expect((await download(new Request("http://localhost:3000"), { params: Promise.resolve({ id: "j1" }) })).status).toBe(409);
  });
  it("cancels only an owned pending task", async () => {
    m.prisma.automationJob.updateMany.mockResolvedValue({ count: 0 });
    expect((await cancel(req({}, "PATCH"), { params: Promise.resolve({ id: "someone-elses-job" }) })).status).toBe(404);
    expect(m.prisma.automationJob.updateMany.mock.calls[0][0].where).toMatchObject({ userId: "h1", departmentId: "d1", status: "pending" });
  });
});
