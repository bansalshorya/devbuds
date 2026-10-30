import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), assigned: vi.fn(), transcribe: vi.fn(), extract: vi.fn(), createRegister: vi.fn(),
  prisma: {
    $transaction: vi.fn(), auditEvent: { create: vi.fn() },
    mentorAssignment: { findUnique: vi.fn(), findFirst: vi.fn() },
    followUp: { updateMany: vi.fn(), findFirst: vi.fn() },
    meeting: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/server/auth/mentor", () => ({ getAssignedMentor: mocks.assigned }));
vi.mock("@/server/db/client", () => ({ prisma: mocks.prisma }));
vi.mock("@/server/security/rate-limit", () => ({ allowRequest: vi.fn().mockResolvedValue(true) }));
vi.mock("@/server/ai/provider", () => ({
  transcribe: mocks.transcribe, extractDraft: mocks.extract, AiUnavailableError: class extends Error {},
}));
vi.mock("@/server/register/export", () => ({ createRegister: mocks.createRegister }));

import { PATCH as complete } from "../src/app/api/follow-ups/[id]/route";
import { POST as draft } from "../src/app/api/mentor/draft/route";
import { POST as voice } from "../src/app/api/mentor/voice/route";
import { GET as register } from "../src/app/api/mentor/register/route";
import { POST as save } from "../src/app/api/mentor/meetings/route";

const mentor = { id: "m1", role: "MENTOR", departmentId: "d1" };
const headers = { origin: "http://localhost:3000", host: "localhost:3000", "Content-Type": "application/json" };
const request = (url: string, body?: unknown) => new Request(`http://localhost:3000${url}`, { method: "POST", headers, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: "f1" }) };
const draftInput = { studentId: "s1", language: "Tamil", meetingDate: "2026-10-30", transcript: "வருகை குறித்து பேசினோம்." };
const meetingInput = { ...draftInput, clientSubmissionId: "test-meeting-id", summary: "Reviewed attendance", topics: ["Attendance"], actions: [{ action: "Submit assignment", dueDate: "2026-11-01" }] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.$transaction.mockImplementation((callback) => callback(mocks.prisma));
  mocks.user.mockResolvedValue(mentor);
  mocks.assigned.mockResolvedValue(mentor);
  mocks.prisma.mentorAssignment.findUnique.mockResolvedValue({ id: "a1" });
  mocks.prisma.mentorAssignment.findFirst.mockResolvedValue({ id: "a1" });
  mocks.prisma.followUp.updateMany.mockResolvedValue({ count: 1 });
  mocks.prisma.followUp.findFirst.mockResolvedValue({ id: "f1", completedAt: new Date("2026-10-30T10:00:00Z") });
  mocks.prisma.meeting.findMany.mockResolvedValue([]);
  mocks.prisma.meeting.findUnique.mockResolvedValue(null);
  mocks.prisma.meeting.create.mockResolvedValue({ id: "meeting1" });
  mocks.createRegister.mockResolvedValue(Buffer.from("PK document"));
  mocks.transcribe.mockResolvedValue({ transcript: "வருகை குறித்து பேசினோம்.", demo: false });
  mocks.extract.mockResolvedValue({ draft: { summary: "வருகை குறித்து பேசினோம்.", topics: [], actions: [] }, demo: false });
});

describe("follow-up completion", () => {
  it.each([null, { id: "h1", role: "HOD" }, { id: "s1", role: "STUDENT", student: null }])("denies an unauthorized identity", async (user) => {
    mocks.user.mockResolvedValue(user);
    expect((await complete(request("/api/follow-ups/f1"), context)).status).toBe(403);
    expect(mocks.prisma.followUp.updateMany).not.toHaveBeenCalled();
  });
  it("rejects cross-origin completion", async () => {
    const req = new Request("http://localhost:3000/api/follow-ups/f1", { method: "PATCH", headers: { ...headers, origin: "https://other.example" } });
    expect((await complete(req, context)).status).toBe(403);
    expect(mocks.prisma.followUp.updateMany).not.toHaveBeenCalled();
  });
  it("limits mentors to their actions for currently assigned students", async () => {
    const response = await complete(request("/api/follow-ups/f1"), context);
    expect(response.status).toBe(200);
    expect(mocks.prisma.followUp.updateMany).toHaveBeenCalledWith({
      where: { id: "f1", mentorId: "m1", student: { assignments: { some: { mentorId: "m1" } } }, completedAt: null },
      data: { completedAt: expect.any(Date) },
    });
  });
  it("derives the student's scope from their session", async () => {
    mocks.user.mockResolvedValue({ id: "u1", role: "STUDENT", student: { id: "own-student" } });
    await complete(request("/api/follow-ups/f1", { studentId: "someone-else" }), context);
    expect(mocks.prisma.followUp.updateMany.mock.calls[0][0].where).toEqual({ id: "f1", studentId: "own-student", completedAt: null });
  });
  it("returns 404 for another person's action", async () => {
    mocks.prisma.followUp.updateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.followUp.findFirst.mockResolvedValue(null);
    expect((await complete(request("/api/follow-ups/f1"), context)).status).toBe(404);
  });
  it("keeps the first completion timestamp on repeated requests", async () => {
    mocks.prisma.followUp.updateMany.mockResolvedValue({ count: 0 });
    const first = await (await complete(request("/api/follow-ups/f1"), context)).json();
    const retry = await (await complete(request("/api/follow-ups/f1"), context)).json();
    expect(first.completedAt).toBe(retry.completedAt);
    expect(mocks.prisma.followUp.updateMany.mock.calls[1][0].where.completedAt).toBeNull();
  });
});

describe("voice and draft boundaries", () => {
  async function recording(studentId = "s1", size = 32, type = "audio/webm") {
    const form = new FormData();
    form.append("audio", new File([new Uint8Array(size)], "note.webm", { type }));
    form.append("studentId", studentId); form.append("language", "Tamil");
    // Model an incoming HTTP body, avoiding Undici's lazy multipart producer on cancellation.
    const encoded = new Response(form);
    return new Request("http://localhost:3000/api/mentor/voice", { method: "POST", headers: { origin: headers.origin, host: headers.host, "Content-Type": encoded.headers.get("content-type")! }, body: await encoded.arrayBuffer() });
  }
  it("does not call extraction for an unassigned student", async () => {
    mocks.assigned.mockResolvedValue(null);
    expect((await draft(request("/api/mentor/draft", draftInput))).status).toBe(403);
    expect(mocks.extract).not.toHaveBeenCalled();
  });
  it("validates meeting dates before extraction", async () => {
    expect((await draft(request("/api/mentor/draft", { ...draftInput, meetingDate: "2026-02-30" }))).status).toBe(400);
    expect(mocks.extract).not.toHaveBeenCalled();
  });
  it("returns a private draft without saving a meeting", async () => {
    const response = await draft(request("/api/mentor/draft", draftInput));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.prisma.meeting.create).not.toHaveBeenCalled();
  });
  it("returns a safe failure when extraction fails", async () => {
    mocks.extract.mockRejectedValue(new Error("secret provider error"));
    const response = await draft(request("/api/mentor/draft", draftInput));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
  it("transcribes an authorized multipart recording", async () => {
    const response = await voice(await recording());
    expect(response.status).toBe(200);
    expect((await response.json()).transcript).toBe("வருகை குறித்து பேசினோம்.");
    expect(mocks.transcribe).toHaveBeenCalledWith(expect.any(File), "Tamil");
    expect(mocks.prisma.meeting.create).not.toHaveBeenCalled();
  });
  it("does not transcribe another mentor's student", async () => {
    mocks.assigned.mockResolvedValue(null);
    expect((await voice(await recording("another-student"))).status).toBe(403);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });
  it("rejects oversized recordings and unsupported uploads", async () => {
    expect((await voice(await recording("s1", 3 * 1024 * 1024 + 20000))).status).toBe(413);
    expect((await voice(await recording("s1", 10, "application/pdf"))).status).toBe(400);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });
});

describe("private register downloads", () => {
  it.each([null, { id: "h1", role: "HOD" }, { id: "u1", role: "STUDENT" }])("blocks non-mentor exports", async (user) => {
    mocks.user.mockResolvedValue(user);
    expect((await register(new Request("http://localhost:3000/api/mentor/register?format=xlsx"))).status).toBe(403);
    expect(mocks.prisma.meeting.findMany).not.toHaveBeenCalled();
  });
  it("does not export an unassigned student", async () => {
    mocks.prisma.mentorAssignment.findUnique.mockResolvedValue(null);
    expect((await register(new Request("http://localhost:3000/api/mentor/register?format=xlsx&studentId=s2"))).status).toBe(403);
  });
  it("scopes meetings by mentor, assignments, student and date range", async () => {
    const response = await register(new Request("http://localhost:3000/api/mentor/register?format=docx&studentId=s1&from=2026-10-01&to=2026-10-30"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("mentoring-register.docx");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.prisma.meeting.findMany.mock.calls[0][0].where).toEqual({
      mentorId: "m1", studentId: "s1", student: { assignments: { some: { mentorId: "m1" } } },
      meetingDate: { gte: new Date("2026-10-01"), lte: new Date("2026-10-30") },
    });
  });
  it("requires a narrower period for excessive exports", async () => {
    mocks.prisma.meeting.findMany.mockResolvedValue(Array.from({ length: 2001 }, () => ({ followUps: [] })));
    expect((await register(new Request("http://localhost:3000/api/mentor/register?format=xlsx"))).status).toBe(413);
    expect(mocks.createRegister).not.toHaveBeenCalled();
  });
});

describe("explicit meeting confirmation", () => {
  it("saves a reviewed meeting and all actions in one nested write", async () => {
    expect((await save(request("/api/mentor/meetings", meetingInput))).status).toBe(200);
    const data = mocks.prisma.meeting.create.mock.calls[0][0].data;
    expect(data.confirmedAt).toBeInstanceOf(Date);
    expect(data.followUps.create).toEqual([{ studentId: "s1", mentorId: "m1", action: "Submit assignment", dueDate: new Date("2026-11-01") }]);
  });
  it("rejects an empty agreed action list and unauthorized students", async () => {
    expect((await save(request("/api/mentor/meetings", { ...meetingInput, actions: [] }))).status).toBe(400);
    mocks.prisma.mentorAssignment.findFirst.mockResolvedValue(null);
    expect((await save(request("/api/mentor/meetings", meetingInput))).status).toBe(403);
    expect(mocks.prisma.meeting.create).not.toHaveBeenCalled();
  });
  it("does not create duplicate meetings on retry", async () => {
    mocks.prisma.meeting.findUnique.mockResolvedValue({ id: "saved", mentorId: "m1", studentId: "s1" });
    const response = await save(request("/api/mentor/meetings", meetingInput));
    expect(await response.json()).toEqual({ id: "saved", duplicate: true });
    expect(mocks.prisma.meeting.create).not.toHaveBeenCalled();
  });
  it("recovers from concurrent submissions using the same submission ID", async () => {
    mocks.prisma.meeting.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "saved", mentorId: "m1", studentId: "s1" });
    mocks.prisma.meeting.create.mockRejectedValue({ code: "P2002" });
    const response = await save(request("/api/mentor/meetings", meetingInput));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "saved", duplicate: true });
  });
});
