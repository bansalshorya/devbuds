import { z } from "zod";
import { kolkataDate, kolkataWeekStart } from "./weeks";

export const AutomationSettingsSchema = z.object({
  enabled: z.boolean(), meetingGapDays: z.number().int().min(7).max(180),
  escalationDays: z.number().int().min(1).max(90), staleDataDays: z.number().int().min(7).max(180),
}).strict();
export const defaults = { enabled: true, meetingGapDays: 21, escalationDays: 7, staleDataDays: 14 };
export const CheckInSchema = z.object({ progress: z.string().trim().min(3).max(1000), support: z.string().trim().max(1000) }).strict();
export const DAY = 86400000;
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export function automationPeriods(now = new Date()) {
  const today = kolkataDate(now);
  const week = kolkataWeekStart(now);
  const previousWeek = new Date(week.getTime() - 7 * DAY);
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  return { today, week, previousWeek, monthStart, monthEnd, month: dateKey(monthStart).slice(0, 7) };
}

export type AcademicStudent = {
  id: string; attendance: { attended: number; total: number; weekStart: Date; subject: string }[];
  marks: { score: number; maxScore: number; assessedOn: Date; subject: string; assessment: string }[];
  lmsActivity: { activityOn: Date; events: number }[];
};
export function dataQuality(student: AcademicStudent, staleDays: number, today: Date) {
  const issues: string[] = [];
  const stale = (dates: Date[]) => !dates.length || today.getTime() - Math.max(...dates.map((d) => d.getTime())) > staleDays * DAY;
  if (!student.attendance.length) issues.push("Attendance records are missing");
  else if (stale(student.attendance.map((a) => a.weekStart))) issues.push("Attendance records are stale");
  if (!student.marks.length) issues.push("Assessment marks are missing");
  else if (stale(student.marks.map((m) => m.assessedOn))) issues.push("Assessment marks are stale");
  if (!student.lmsActivity.length) issues.push("LMS activity records are missing");
  else if (stale(student.lmsActivity.map((l) => l.activityOn))) issues.push("LMS activity records are stale");
  if (student.attendance.some((a) => a.total <= 0 || a.attended < 0 || a.attended > a.total)) issues.push("Invalid attendance values");
  if (student.marks.some((m) => m.maxScore <= 0 || m.score < 0 || m.score > m.maxScore)) issues.push("Invalid assessment values");
  if (student.lmsActivity.some((l) => l.events < 0)) issues.push("Invalid LMS event counts");
  if ([...student.attendance.map((a) => a.weekStart), ...student.marks.map((m) => m.assessedOn), ...student.lmsActivity.map((l) => l.activityOn)].some((d) => d > today)) issues.push("Academic records contain future dates");
  const duplicates = (keys: string[]) => new Set(keys).size !== keys.length;
  if (duplicates(student.attendance.map((a) => `${a.subject}:${dateKey(a.weekStart)}`)) || duplicates(student.marks.map((m) => `${m.subject}:${m.assessment}`)) || duplicates(student.lmsActivity.map((l) => dateKey(l.activityOn)))) issues.push("Duplicate source records");
  return issues;
}

const concernTerms = [
  { label: "Attendance", pattern: /\battendance\b|வருகை/iu },
  { label: "Assignments", pattern: /\bassignments?\b|பணி|ஒப்படை/iu },
  { label: "Assessment performance", pattern: /\bmarks?\b|\bexams?\b|\btests?\b|மதிப்பெண்|தேர்வு/iu },
  { label: "Time management", pattern: /\btime management\b|நேர மேலாண்மை/iu },
];
export function repeatedConcerns(meetings: { id: string; summary: string; topics: string[]; meetingDate: Date }[]) {
  return concernTerms.map((term) => ({ label: term.label, meetings: meetings.filter((m) => term.pattern.test([m.summary, ...m.topics].join(" "))).map((m) => ({ id: m.id, date: dateKey(m.meetingDate), excerpt: m.summary.slice(0, 220) })) }))
    .filter((item) => item.meetings.length >= 2);
}
