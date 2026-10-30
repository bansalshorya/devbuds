import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { runDepartmentAutomations } from "../src/server/automations/runner";
import { automationPeriods, DAY } from "../src/lib/automations";
import { automationInbox } from "../src/server/automations/access";
import { prisma as automationDb } from "../src/server/db/client";

const url = new URL(process.env.DATABASE_URL!);
assert(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Fixture verification is restricted to a local database.");
const base = new URL(process.env.VERIFY_BASE_URL || "http://localhost:3002");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "HTTP verification is restricted to localhost.");
const db = new PrismaClient();
const now = new Date();
const { today, week } = automationPeriods(now);
const token = randomUUID();
let fixture: Awaited<ReturnType<typeof createFixture>> | undefined;
let passed = 0;
function check(value: unknown, label: string): asserts value { assert(value, label); passed++; console.log(`PASS ${label}`); }
async function createFixture() {
  return db.$transaction(async (tx) => {
    const department = await tx.department.create({ data: { name: `Automation verification ${token}` } });
    const mobile = () => `97${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`;
    const mentor = await tx.user.create({ data: { departmentId: department.id, name: "Fixture mentor", mobile: mobile(), role: "MENTOR" } });
    const hod = await tx.user.create({ data: { departmentId: department.id, name: "Fixture HOD", mobile: mobile(), role: "HOD" } });
    const user = await tx.user.create({ data: { departmentId: department.id, name: "Fixture student", mobile: mobile(), role: "STUDENT" } });
    const student = await tx.student.create({ data: { departmentId: department.id, userId: user.id, rollNo: `VERIFY-${token}` } });
    await tx.mentorAssignment.create({ data: { mentorId: mentor.id, studentId: student.id } });
    const meetings = [];
    for (const days of [40, 30]) meetings.push(await tx.meeting.create({ data: { clientSubmissionId: `${token}-${days}`, mentorId: mentor.id, studentId: student.id, meetingDate: new Date(today.getTime() - days * DAY), language: "English", summary: "Reviewed attendance and assignment commitments.", topics: ["Attendance"], confirmedAt: now } }));
    await tx.followUp.create({ data: { mentorId: mentor.id, studentId: student.id, meetingId: meetings[0].id, action: "Submit the agreed assignment", dueDate: new Date(today.getTime() - 14 * DAY) } });
    const csv = `rollNo,subject,weekStart,attended,total\n${student.rollNo},Maths,${week.toISOString().slice(0, 10)},7,10`;
    const job = await tx.automationJob.create({ data: { key: `verify-import:${token}`, departmentId: department.id, userId: hod.id, kind: "import", dueAt: new Date(now.getTime() - 1000), input: { type: "attendance", csv } } });
    return { department, mentor, hod, user, student, job };
  });
}
async function cookie(userId: string) {
  assert(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
  return `tmm_session=${await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("10m").sign(new TextEncoder().encode(process.env.JWT_SECRET))}`;
}
async function request(path: string, session: string, body?: unknown) {
  return fetch(new URL(path, base), { method: body ? "POST" : "GET", headers: { Cookie: session, Origin: base.origin, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, redirect: "manual", signal: AbortSignal.timeout(20000) });
}

async function main() {
  fixture = await createFixture(); const f = fixture;
  check((await runDepartmentAutomations(f.department.id, now)).status === "completed", "daily run completes");
  const notices = await db.automationNotice.findMany({ where: { departmentId: f.department.id } });
  for (const kind of ["agenda", "digest", "quality", "missed", "escalation", "recurring", "checkin", "job"]) check(notices.some((n) => n.kind === kind), `${kind} workflow produces an update`);
  const quality = notices.find((n) => n.kind === "quality")!;
  check(!JSON.stringify(quality.body).includes(f.student.id) && !JSON.stringify(quality.body).includes("Fixture student"), "department report is aggregate-only");
  check((await db.automationJob.findUniqueOrThrow({ where: { id: f.job.id } })).status === "completed", "scheduled academic import completes");
  check(await db.attendanceRecord.count({ where: { studentId: f.student.id } }) === 1, "academic record is imported once");
  const report = await db.automationJob.findFirstOrThrow({ where: { userId: f.mentor.id, kind: "register" } });
  check(report.status === "completed" && (report.artifact?.length ?? 0) > 0, "monthly register is generated and stored");
  const before = notices.length;
  await runDepartmentAutomations(f.department.id, now);
  check(await db.automationNotice.count({ where: { departmentId: f.department.id } }) === before, "repeated run creates no duplicate notices");
  check(await db.studentCheckIn.count({ where: { studentId: f.student.id } }) === 1, "weekly check-in request is deduplicated");
  await db.automationLease.create({ data: { key: `department:${f.department.id}`, holder: token, expiresAt: new Date(now.getTime() + DAY) } });
  check((await runDepartmentAutomations(f.department.id, now)).status === "busy", "overlapping runs are rejected");
  await db.automationLease.delete({ where: { key: `department:${f.department.id}` } });

  const mentorCookie = await cookie(f.mentor.id), studentCookie = await cookie(f.user.id), hodCookie = await cookie(f.hod.id);
  for (const [role, session] of [["mentor", mentorCookie], ["student", studentCookie], ["HOD", hodCookie]]) {
    const page = await request("/automations", session); const html = await page.text();
    check(page.status === 200 && html.includes("Automation Hub") && !html.includes("Automations need setup"), `${role} automation hub renders`);
    if (role === "HOD") check(!html.includes("Reviewed attendance and assignment commitments"), "HOD hub does not disclose meeting notes");
  }
  const response = await request("/api/automations/check-in", studentCookie, { progress: "Fixture check-in: progress made", support: "Help reviewing Maths" });
  check(response.status === 200, "student check-in can be submitted");
  await runDepartmentAutomations(f.department.id, now);
  const checkInNotice = await db.automationNotice.findFirstOrThrow({ where: { userId: f.user.id, kind: "checkin" } });
  check(!!checkInNotice.resolvedAt, "later daily runs do not reopen a completed check-in");
  const profile = await request(`/mentor/students/${f.student.id}`, mentorCookie);
  check((await profile.text()).includes("Fixture check-in: progress made"), "check-in appears in meeting preparation");
  check((await request(`/api/automations/jobs/${report.id}`, mentorCookie)).status === 200, "authorized mentor downloads the monthly register");
  check((await request(`/api/automations/jobs/${report.id}`, studentCookie)).status === 403, "student cannot download mentor register");
  await db.mentorAssignment.delete({ where: { mentorId_studentId: { mentorId: f.mentor.id, studentId: f.student.id } } });
  check((await request(`/api/automations/jobs/${report.id}`, mentorCookie)).status === 409, "register download is blocked after reassignment");
  const inbox = await automationInbox(f.mentor);
  check(!JSON.stringify(inbox).includes("Reviewed attendance and assignment commitments") && !JSON.stringify(inbox).includes("Fixture student"), "former student details are removed from mentor inbox");
  console.log(`${passed} automation workflow checks passed.`);
}
async function cleanup() {
  if (!fixture) return;
  const f = fixture; const departmentId = f.department.id; const users = [f.mentor.id, f.hod.id, f.user.id];
  await db.$transaction(async (tx) => {
    await tx.automationNotice.deleteMany({ where: { departmentId } }); await tx.automationJob.deleteMany({ where: { departmentId } });
    await tx.automationRun.deleteMany({ where: { departmentId } }); await tx.automationLease.deleteMany({ where: { key: `department:${departmentId}` } });
    await tx.studentCheckIn.deleteMany({ where: { studentId: f.student.id } }); await tx.automationSettings.deleteMany({ where: { departmentId } });
    await tx.auditEvent.deleteMany({ where: { actorId: { in: users } } }); await tx.followUp.deleteMany({ where: { studentId: f.student.id } });
    await tx.meeting.deleteMany({ where: { studentId: f.student.id } }); await tx.attendanceRecord.deleteMany({ where: { studentId: f.student.id } });
    await tx.mentorAssignment.deleteMany({ where: { studentId: f.student.id } }); await tx.student.delete({ where: { id: f.student.id } });
    await tx.user.deleteMany({ where: { id: { in: users } } }); await tx.department.delete({ where: { id: departmentId } });
  });
}
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : "Verification failed"); process.exitCode = 1; }).finally(async () => { await cleanup(); await db.$disconnect(); await automationDb.$disconnect(); });
