import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/server/db/client", () => ({ prisma: { followUp: { findFirst: mocks.find } } }));
import { GET } from "../src/app/api/follow-ups/[id]/calendar/route";

const request = new Request("http://localhost:3000/api/follow-ups/f1/calendar?studentId=someone-else");
const context = { params: Promise.resolve({ id: "f1" }) };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "mentor1", role: "MENTOR" });
  mocks.find.mockResolvedValue({ id: "f1", action: "Submit work", dueDate: new Date("2026-11-01"), completedAt: null });
});

describe("private follow-up calendar", () => {
  it.each([null, { id: "h1", role: "HOD" }, { id: "s1", role: "STUDENT", student: null }])("rejects unauthorized identities", async (user) => {
    mocks.user.mockResolvedValue(user);
    expect((await GET(request, context)).status).toBe(403);
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("restricts mentors to their own open actions for currently assigned students", async () => {
    const response = await GET(request, context);
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: "f1", mentorId: "mentor1", completedAt: null, student: { assignments: { some: { mentorId: "mentor1" } } } } });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(await response.text()).toContain("BEGIN:VCALENDAR");
  });
  it("derives the student's scope from their session, ignoring URL parameters", async () => {
    mocks.user.mockResolvedValue({ id: "u1", role: "STUDENT", student: { id: "own-student" } });
    await GET(request, context);
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: "f1", studentId: "own-student", completedAt: null } });
  });
  it("returns 404 for completed or inaccessible actions", async () => {
    mocks.find.mockResolvedValue(null);
    expect((await GET(request, context)).status).toBe(404);
  });
});
