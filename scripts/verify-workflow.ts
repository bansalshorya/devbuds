import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { ALERT_CONFIG } from "../src/server/alerts/config";

const base = new URL(process.env.VERIFY_BASE_URL || "http://localhost:3001");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Verification is restricted to a local app server.");
assert(process.env.DEMO_MODE === "true" && process.env.TRANSCRIBER === "mock" && process.env.EXTRACTOR === "mock", "Use demo mode with both AI providers set to mock for this fixture test.");
assert(process.env.DEMO_OTP, "Configure the demo OTP before verification.");
const prisma = new PrismaClient();
const runId = randomUUID();
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const phone = () => `98${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`;
let fixture: Awaited<ReturnType<typeof createFixture>> | undefined;
let checks = 0;
function check(value: unknown, label: string): asserts value { assert(value, label); checks++; console.log(`PASS ${label}`); }

async function createFixture() {
  return prisma.$transaction(async (tx) => {
    const department = await tx.department.create({ data: { name: `Verification ${runId}` } });
    const otherDepartment = await tx.department.create({ data: { name: `Other verification ${runId}` } });
    const mentor = await tx.user.create({ data: { name: `Verification mentor ${runId}`, mobile: phone(), role: "MENTOR", departmentId: department.id } });
    const hod = await tx.user.create({ data: { name: `Verification HOD ${runId}`, mobile: phone(), role: "HOD", departmentId: department.id } });
    const otherMentor = await tx.user.create({ data: { name: `Other mentor ${runId}`, mobile: phone(), role: "MENTOR", departmentId: otherDepartment.id } });
    const studentUser = await tx.user.create({ data: { name: `Private student ${runId}`, mobile: phone(), role: "STUDENT", departmentId: department.id } });
    const otherStudentUser = await tx.user.create({ data: { name: `Other private student ${runId}`, mobile: phone(), role: "STUDENT", departmentId: otherDepartment.id } });
    const student = await tx.student.create({ data: { rollNo: `VERIFY-${runId}`, userId: studentUser.id, departmentId: department.id } });
    const otherStudent = await tx.student.create({ data: { rollNo: `OTHER-${runId}`, userId: otherStudentUser.id, departmentId: otherDepartment.id } });
    await tx.mentorAssignment.createMany({ data: [{ mentorId: mentor.id, studentId: student.id }, { mentorId: otherMentor.id, studentId: otherStudent.id }] });
    return { department, otherDepartment, mentor, otherMentor, hod, studentUser, otherStudentUser, student, otherStudent };
  });
}

function request(path: string, cookie = "", init: RequestInit = {}) {
  return fetch(new URL(path, base), { ...init, redirect: "manual", headers: { Origin: base.origin, ...(cookie ? { Cookie: cookie } : {}), ...init.headers } });
}
const jsonPost = (body: unknown, method = "POST"): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function login(mobile: string) {
  const response = await request("/api/auth/login", "", jsonPost({ mobile, otp: process.env.DEMO_OTP }));
  assert.equal(response.status, 200, "Fixture user login failed");
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert(cookie, "Login must return a session cookie");
  return cookie;
}

async function main() {
  fixture = await createFixture();
  const f = fixture;
  const mentorCookie = await login(f.mentor.mobile);
  const studentCookie = await login(f.studentUser.mobile);
  const otherCookie = await login(f.otherMentor.mobile);
  const hodCookie = await login(f.hod.mobile);
  check((await request("/api/department/coverage")).status === 403, "anonymous coverage denied");
  check((await request("/api/mentor/register?format=xlsx", studentCookie)).status === 403, "students cannot export mentor registers");

  const csv = new FormData(); csv.append("type", "attendance"); csv.append("file", new File([`rollNo,subject,weekStart,attended,total\n${f.student.rollNo},Maths,${today},7,10`], "attendance.csv", { type: "text/csv" }));
  const imported = await request("/api/import", mentorCookie, { method: "POST", body: csv });
  check(imported.status === 200 && (await imported.json()).inserted === 1, "authorized academic CSV import");

  const draft = await request("/api/mentor/draft", mentorCookie, jsonPost({ studentId: f.student.id, language: "Tamil", meetingDate: today, transcript: "வருகை குறித்து பேசினோம். நாளை பணியை முடிக்க ஒப்புக்கொண்டார்." }));
  check(draft.status === 200 && (await draft.json()).demo === true, "Tamil demo draft returns editable text");
  check(await prisma.meeting.count({ where: { studentId: f.student.id } }) === 0, "draft generation does not save a meeting");
  check((await request("/api/mentor/draft", otherCookie, jsonPost({ studentId: f.student.id, language: "English", meetingDate: today, transcript: "Do not allow access" }))).status === 403, "other mentor cannot access this student's AI flow");

  const audio = new FormData(); audio.append("audio", new File([new Uint8Array(44)], "sample.wav", { type: "audio/wav" })); audio.append("studentId", f.student.id); audio.append("language", "Tamil");
  const speech = await request("/api/mentor/voice", mentorCookie, { method: "POST", body: audio });
  check(speech.status === 200 && (await speech.json()).demo === true, "authorized audio upload reaches labelled mock transcription");

  const clientSubmissionId = randomUUID();
  const body = { clientSubmissionId, studentId: f.student.id, meetingDate: today, language: "Tamil", summary: `Verification private note ${runId}`, topics: ["Attendance"], actions: [{ action: `Verification action ${runId}`, dueDate: today }] };
  const saved = await request("/api/mentor/meetings", mentorCookie, jsonPost(body));
  check(saved.status === 200, "confirmed meeting saved");
  const retried = await request("/api/mentor/meetings", mentorCookie, jsonPost(body));
  check(retried.status === 200 && (await retried.json()).duplicate === true, "retry does not duplicate meeting");
  const followUp = await prisma.followUp.findFirstOrThrow({ where: { studentId: f.student.id } });
  check((await request(`/api/follow-ups/${followUp.id}`, otherCookie, { method: "PATCH" })).status === 404, "other mentor cannot complete this action");
  check((await request(`/api/follow-ups/${followUp.id}`, studentCookie, { method: "PATCH" })).status === 200, "student can complete their own action");
  const first = await prisma.followUp.findUniqueOrThrow({ where: { id: followUp.id } });
  await request(`/api/follow-ups/${followUp.id}`, mentorCookie, { method: "PATCH" });
  const repeated = await prisma.followUp.findUniqueOrThrow({ where: { id: followUp.id } });
  check(first.completedAt?.getTime() === repeated.completedAt?.getTime(), "completion retries preserve timestamp");

  check((await request("/api/settings/thresholds", mentorCookie, jsonPost({ ...ALERT_CONFIG, lowAttendancePct: 80 }, "PATCH"))).status === 200, "mentor thresholds persist");
  check((await request("/api/settings/thresholds", mentorCookie)).status === 200, "saved thresholds can be read");
  check((await request("/api/mentor/reviews", mentorCookie, jsonPost({ studentId: f.student.id }))).status === 200, "weekly review saved");
  await request("/api/mentor/reviews", mentorCookie, jsonPost({ studentId: f.student.id }));
  check(await prisma.weeklyReview.count({ where: { mentorId: f.mentor.id } }) === 1, "weekly review is idempotent");

  const coverage = await request("/api/department/coverage", hodCookie);
  const aggregate = await coverage.json();
  check(coverage.status === 200 && aggregate.totalStudents === 1 && aggregate.studentsReached === 1 && aggregate.pendingFollowUps === 0, "department coverage updates without cross-department data");
  const coverageText = JSON.stringify(aggregate);
  check(!coverageText.includes(runId) && !coverageText.includes(f.student.id), "department API omits student identities and notes");
  const departmentPage = await request("/department", hodCookie);
  const departmentHtml = await departmentPage.text();
  check(departmentPage.status === 200 && !departmentHtml.includes(body.summary) && !departmentHtml.includes(body.actions[0].action), "department page shows coverage without private note or action text");

  for (const format of ["xlsx", "docx"]) {
    const response = await request(`/api/mentor/register?format=${format}&studentId=${f.student.id}`, mentorCookie);
    const bytes = new Uint8Array(await response.arrayBuffer());
    check(response.status === 200 && bytes[0] === 80 && bytes[1] === 75, `${format} register download`);
  }
  check((await request(`/api/mentor/register?format=xlsx&studentId=${f.otherStudent.id}`, mentorCookie)).status === 403, "register cannot export another mentor's student");
  check((await request("/api/reports", hodCookie)).status === 200, "aggregate performance Excel report");
  check(await prisma.auditEvent.count({ where: { actorId: f.mentor.id, action: "meeting.confirm" } }) === 1, "confirmed save has one metadata-only audit event");
  console.log(`Completed ${checks} live integration checks. AI providers were mocked; no live speech accuracy claim.`);
}

async function cleanup() {
  if (!fixture) return;
  const ids = [fixture.student.id, fixture.otherStudent.id];
  const users = [fixture.mentor.id, fixture.otherMentor.id, fixture.hod.id, fixture.studentUser.id, fixture.otherStudentUser.id];
  await prisma.$transaction(async (tx) => {
    await tx.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    await tx.weeklyReview.deleteMany({ where: { mentorId: { in: users } } });
    await tx.followUp.deleteMany({ where: { studentId: { in: ids } } });
    await tx.meeting.deleteMany({ where: { studentId: { in: ids } } });
    await tx.attendanceRecord.deleteMany({ where: { studentId: { in: ids } } });
    await tx.internalMark.deleteMany({ where: { studentId: { in: ids } } });
    await tx.lmsActivity.deleteMany({ where: { studentId: { in: ids } } });
    await tx.mentorAssignment.deleteMany({ where: { studentId: { in: ids } } });
    await tx.student.deleteMany({ where: { id: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: users } } });
    await tx.department.deleteMany({ where: { id: { in: [fixture!.department.id, fixture!.otherDepartment.id] } } });
  });
  console.log("Removed this run's verification records.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; }).finally(async () => { try { await cleanup(); } finally { await prisma.$disconnect(); } });
