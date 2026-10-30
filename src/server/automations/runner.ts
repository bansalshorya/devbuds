import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { automationPeriods, dateKey, DAY, defaults, dataQuality, repeatedConcerns } from "@/lib/automations";
import { configuredThresholds } from "@/lib/thresholds";
import { evaluateStudent } from "@/server/alerts/engine";
import { createRegister } from "@/server/register/export";
import { importCsv } from "@/server/import/csv";
import { validateScheduledCsv } from "./imports";
import { z } from "zod";

const importInput = z.object({ type: z.enum(["attendance", "marks", "lms"]), csv: z.string().max(100000) });
const registerInput = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

async function notice(data: { key: string; departmentId: string; userId: string; studentId?: string; kind: string; title: string; body: Prisma.InputJsonValue }) {
  return prisma.automationNotice.upsert({ where: { key: data.key }, create: data, update: { title: data.title, body: data.body, resolvedAt: null } });
}

async function processJobs(departmentId: string, now: Date, deadline: number) {
  // Reclaim interrupted work only under the department lease. Upsert imports are retry-safe.
  await prisma.automationJob.updateMany({ where: { departmentId, status: "running", startedAt: { lt: new Date(now.getTime() - 30 * 60000) } }, data: { status: "pending" } });
  const jobs = await prisma.automationJob.findMany({ where: { departmentId, status: "pending", dueAt: { lte: now } }, orderBy: { dueAt: "asc" }, take: 5 });
  for (const job of jobs) {
    if (Date.now() > deadline) break;
    const claimed = await prisma.automationJob.updateMany({ where: { id: job.id, status: "pending" }, data: { status: "running", startedAt: now } });
    if (!claimed.count) continue;
    try {
      const owner = await prisma.user.findFirst({ where: { id: job.userId, departmentId }, select: { role: true } });
      if (!owner || (job.kind === "import" ? owner.role !== "HOD" : owner.role !== "MENTOR")) throw new Error("Owner no longer authorized");
      if (job.kind === "import") {
        const input = importInput.parse(job.input);
        if (validateScheduledCsv(input.csv, input.type).length) throw new Error("CSV validation failed");
        const result = await importCsv(input.csv, input.type, { userId: job.userId, role: "HOD", departmentId });
        await prisma.automationJob.update({ where: { id: job.id }, data: { status: result.errors.length ? "failed" : "completed", finishedAt: new Date(), input: { type: input.type }, result: { inserted: result.inserted, updated: result.updated, errors: result.errors.map((e) => ({ row: e.row, message: e.message })) } } });
      } else if (job.kind === "register") {
        const input = registerInput.parse(job.input);
        const meetings = await prisma.meeting.findMany({
          relationLoadStrategy: "join", where: { mentorId: job.userId, student: { departmentId, assignments: { some: { mentorId: job.userId } } }, meetingDate: { gte: new Date(input.from), lt: new Date(input.to) } },
          orderBy: [{ meetingDate: "asc" }, { id: "asc" }], take: 2001,
          include: { mentor: { select: { name: true } }, student: { select: { user: { select: { name: true } }, rollNo: true } }, followUps: true },
        });
        if (meetings.length > 2000 || meetings.reduce((n, m) => n + Math.max(1, m.followUps.length), 0) > 5000) throw new Error("Register is too large");
        const artifact = await createRegister(meetings, "xlsx", `${input.from} to ${dateKey(new Date(new Date(input.to).getTime() - DAY))}`);
        if (artifact.length > 5 * 1024 * 1024) throw new Error("Register is too large");
        await prisma.automationJob.update({ where: { id: job.id }, data: { status: "completed", finishedAt: new Date(), artifact: new Uint8Array(artifact), result: { meetings: meetings.length, studentIds: [...new Set(meetings.map((m) => m.studentId))] } } });
      } else throw new Error("Unknown job type");
      await notice({ key: `job:${job.id}`, departmentId, userId: job.userId, kind: "job", title: "Scheduled task finished", body: { jobId: job.id, text: "Review the task result in Scheduled tasks." } });
    } catch {
      await prisma.automationJob.update({ where: { id: job.id }, data: { status: "failed", finishedAt: new Date(), input: job.kind === "import" ? {} : job.input as Prisma.InputJsonValue, result: { error: "Task failed. Check permissions, input data, and database access; submit a new task to retry." } } });
      await notice({ key: `job:${job.id}`, departmentId, userId: job.userId, kind: "job", title: "Scheduled task needs attention", body: { text: "A task failed. Review Scheduled tasks and correct its input before resubmitting." } });
    }
  }
}

export async function runDepartmentAutomations(departmentId: string, now = new Date(), deadline = Date.now() + 45000) {
  const holder = randomUUID();
  const lease = `department:${departmentId}`;
  const expires = new Date(now.getTime() + 30 * 60000);
  const acquired = await prisma.$queryRaw<{ key: string }[]>`
    INSERT INTO "AutomationLease" ("key", "holder", "expiresAt") VALUES (${lease}, ${holder}, ${expires})
    ON CONFLICT ("key") DO UPDATE SET "holder" = EXCLUDED."holder", "expiresAt" = EXCLUDED."expiresAt"
    WHERE "AutomationLease"."expiresAt" < ${now} RETURNING "key"
  `;
  if (!acquired.length) return { status: "busy", processed: 0 };
  const run = await prisma.automationRun.create({ data: { departmentId, status: "running", startedAt: now } });
  try {
    const settings = await prisma.automationSettings.findUnique({ where: { departmentId } }) ?? defaults;
    if (!settings.enabled) {
      await prisma.automationRun.update({ where: { id: run.id }, data: { status: "disabled", finishedAt: new Date() } });
      return { status: "disabled", processed: 0 };
    }
    await processJobs(departmentId, now, deadline);
    const { today, week, previousWeek, monthStart, monthEnd, month } = automationPeriods(now);
    const [department, mentors, heads] = await Promise.all([
      prisma.department.findUniqueOrThrow({ where: { id: departmentId }, select: { alertThresholds: true } }),
      prisma.user.findMany({ where: { departmentId, role: "MENTOR" }, select: { id: true, alertThresholds: true } }),
      prisma.user.findMany({ where: { departmentId, role: "HOD" }, select: { id: true } }),
    ]);
    let processed = 0;
    const runDay = dateKey(today);
    // Data-quality totals contain no student identities or private meeting notes.
    const qualityStudents = await prisma.student.findMany({ where: { departmentId }, include: { attendance: true, marks: true, lmsActivity: true } });
    const quality = qualityStudents.map((s) => dataQuality(s, settings.staleDataDays, today));
    const issueCounts: Record<string, number> = {};
    quality.flat().forEach((issue) => { issueCounts[issue] = (issueCounts[issue] ?? 0) + 1; });
    for (const head of heads) await notice({ key: `quality:${head.id}:${runDay}`, departmentId, userId: head.id, kind: "quality", title: "Academic data quality report", body: { checked: quality.length, studentsWithIssues: quality.filter((q) => q.length).length, issues: issueCounts } });

    // Rotate the first mentor each day, avoiding starvation if a large department exceeds the time budget.
    const ordered = [...mentors].sort((a, b) => a.id.localeCompare(b.id));
    const offset = ordered.length ? Math.floor(today.getTime() / DAY) % ordered.length : 0;
    const rotated = [...ordered.slice(offset), ...ordered.slice(0, offset)];
    for (const mentor of rotated) {
      if (Date.now() > deadline) break;
      const students = await prisma.student.findMany({ relationLoadStrategy: "join", where: { departmentId, assignments: { some: { mentorId: mentor.id } } }, include: { user: { select: { name: true } }, attendance: true, marks: true, lmsActivity: true, followUps: { where: { mentorId: mentor.id } }, meetings: { where: { mentorId: mentor.id, meetingDate: { lte: today } }, orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }], take: 100 } } });
      const config = configuredThresholds(mentor.alertThresholds ?? department.alertThresholds);
      const agenda: { studentId: string; name: string; reasons: string[]; score: number }[] = [];
      let meetingsThisWeek = 0, completedThisWeek = 0, upcoming = 0, unresolved = 0;
      for (const student of students) {
        const signals = { ...student, studentId: student.id, name: student.user.name, lmsDates: student.lmsActivity.map((l) => l.activityOn) };
        const alerts = evaluateStudent(signals, today, config);
        const last = student.meetings[0]?.meetingDate;
        const missed = !last || today.getTime() - last.getTime() >= settings.meetingGapDays * DAY;
        const reasons = [...alerts.map((a) => a.reason), ...(missed ? [last ? `No mentoring meeting in ${settings.meetingGapDays} days` : "No mentoring meeting recorded"] : [])];
        const overdue = student.followUps.filter((f) => !f.completedAt && today.getTime() - f.dueDate.getTime() >= settings.escalationDays * DAY);
        if (overdue.length) reasons.push(`${overdue.length} commitment(s) overdue by at least ${settings.escalationDays} days`);
        if (reasons.length) agenda.push({ studentId: student.id, name: student.user.name, reasons, score: alerts.filter((a) => a.severity === "high").length * 10 + overdue.length * 5 + (missed ? 2 : 0) });
        const n = (kind: string, title: string, body: Prisma.InputJsonValue) => notice({ key: `${kind}:${mentor.id}:${student.id}:${dateKey(week)}`, departmentId, userId: mentor.id, studentId: student.id, kind, title, body });
        if (missed) {
          await n("missed", "Mentoring conversation is due", { text: last ? `Last recorded meeting: ${dateKey(last)}. Arrange a conversation with the student.` : "No meeting is recorded yet. Arrange the first conversation." });
          await notice({ key: `student-missed:${mentor.id}:${student.id}:${dateKey(week)}`, departmentId, userId: student.userId, studentId: student.id, kind: "missed", title: "Time for a mentor check-in", body: { text: "A mentoring conversation is due. Share your progress below and contact your assigned mentor to arrange a time." } });
        } else await prisma.automationNotice.updateMany({ where: { departmentId, studentId: student.id, kind: "missed", resolvedAt: null, OR: [{ userId: mentor.id }, { userId: student.userId, key: { startsWith: `student-missed:${mentor.id}:` } }] }, data: { resolvedAt: now } });
        if (overdue.length) await n("escalation", "Overdue commitments need follow-up", { items: overdue.map((f) => ({ text: f.action, due: dateKey(f.dueDate) })), text: `These commitments are at least ${settings.escalationDays} days overdue. Review with the student; no disciplinary action is automatic.` });
        else await prisma.automationNotice.updateMany({ where: { userId: mentor.id, studentId: student.id, kind: "escalation", resolvedAt: null }, data: { resolvedAt: now } });
        const repeated = repeatedConcerns(student.meetings.slice(0, 12));
        if (repeated.length) await n("recurring", "Repeated discussion topics", { topics: repeated, text: "Keyword matches across saved notes; these are discussion prompts, not an assessment. Review the source notes." });
        const checkIn = await prisma.studentCheckIn.upsert({ where: { studentId_weekStart: { studentId: student.id, weekStart: week } }, create: { studentId: student.id, weekStart: week }, update: {} });
        if (!checkIn.respondedAt) await notice({ key: `checkin:${student.id}:${dateKey(week)}`, departmentId, userId: student.userId, studentId: student.id, kind: "checkin", title: "Your weekly progress check-in", body: { text: "Before your next meeting, share what went well and where you would like support. Your currently assigned mentor can read your response." } });
        meetingsThisWeek += student.meetings.filter((m) => m.meetingDate >= previousWeek && m.meetingDate < week).length;
        completedThisWeek += student.followUps.filter((f) => f.completedAt && f.completedAt >= previousWeek && f.completedAt < week).length;
        upcoming += student.followUps.filter((f) => !f.completedAt && f.dueDate >= today && f.dueDate.getTime() <= today.getTime() + 7 * DAY).length;
        unresolved += student.followUps.filter((f) => !f.completedAt).length;
      }
      agenda.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      await notice({ key: `agenda:${mentor.id}:${dateKey(week)}`, departmentId, userId: mentor.id, kind: "agenda", title: "Your weekly mentor agenda", body: { week: dateKey(week), items: agenda.map((item) => ({ studentId: item.studentId, name: item.name, reasons: item.reasons })), text: "Suggested conversations based on explainable alerts, overdue actions, and meeting gaps." } });
      await notice({ key: `digest:${mentor.id}:${dateKey(week)}`, departmentId, userId: mentor.id, kind: "digest", title: "Weekly mentoring digest", body: { period: `${dateKey(previousWeek)} to ${dateKey(new Date(week.getTime() - DAY))}`, meetings: meetingsThisWeek, actionsCompleted: completedThisWeek, currentlyOpen: unresolved, upcomingDeadlines: upcoming, currentConcerns: agenda.length } });
      await prisma.automationJob.upsert({ where: { key: `register:${mentor.id}:${month}` }, create: { key: `register:${mentor.id}:${month}`, departmentId, userId: mentor.id, kind: "register", dueAt: now, input: { from: dateKey(monthStart), to: dateKey(monthEnd) } }, update: {} });
      processed++;
    }
    await processJobs(departmentId, now, deadline);
    // Keep private notices, input files, and registers bounded in retention.
    await prisma.automationNotice.deleteMany({ where: { departmentId, createdAt: { lt: new Date(now.getTime() - 90 * DAY) } } });
    await prisma.automationJob.updateMany({ where: { departmentId, finishedAt: { lt: new Date(now.getTime() - 90 * DAY) } }, data: { artifact: null, input: {}, result: Prisma.DbNull } });
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: processed < mentors.length ? "partial" : "completed", finishedAt: new Date(), summary: { mentors: processed, totalMentors: mentors.length, studentsChecked: qualityStudents.length } } });
    return { status: processed < mentors.length ? "partial" : "completed", processed };
  } catch {
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: "failed", finishedAt: new Date(), summary: { error: "Automation failed. Check the database schema and service availability." } } });
    throw new Error("Automation failed. Check schema and database availability.");
  } finally {
    await prisma.automationLease.deleteMany({ where: { key: lease, holder } });
  }
}
