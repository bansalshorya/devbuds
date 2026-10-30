import type { AlertResult } from "../../lib/schemas";
import { formatDate } from "../../lib/dates";
import { ALERT_CONFIG, type AlertConfig } from "./config";

export type StudentSignals = {
  studentId: string;
  name: string;
  attendance: { subject: string; weekStart: Date; attended: number; total: number }[];
  marks: { subject: string; assessment: string; assessedOn: Date; score: number; maxScore: number }[];
  lmsDates: Date[];
  meetings: { meetingDate: Date }[];
  followUps: { id: string; action: string; dueDate: Date; completedAt: Date | null }[];
};

type Rule = (s: StudentSignals, today: Date, config: AlertConfig) => AlertResult | null;

const DAY = 24 * 60 * 60 * 1000;
const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / DAY);
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const latest = (dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Rule 1: low attendance in one or more subjects.
const lowAttendance: Rule = (s, _today, C) => {
  if (s.attendance.length === 0) return null; // no data is not the same as poor attendance
  const totals = new Map<string, { a: number; t: number }>();
  for (const r of s.attendance) {
    const x = totals.get(r.subject) ?? { a: 0, t: 0 };
    x.a += r.attended;
    x.t += r.total;
    totals.set(r.subject, x);
  }
  const low: { subject: string; p: number }[] = [];
  for (const [subject, v] of totals) {
    const p = percent(v.a, v.t);
    if (p !== null && p < C.lowAttendancePct) low.push({ subject, p });
  }
  if (low.length === 0) return null;
  const lowest = Math.min(...low.map((x) => x.p));
  return {
    ruleId: "low-attendance",
    severity: lowest < C.criticalAttendancePct ? "high" : "medium",
    reason: `Attendance below ${C.lowAttendancePct}% in ${plural(low.length, "subject")} (lowest ${lowest}%)`,
    evidence: low.map((x) => `${x.subject}: ${x.p}%`),
    observedAt: latest(s.attendance.map((r) => r.weekStart)).toISOString(),
  };
};

// Rule 2: sharp attendance drop (last 3 weeks vs the 3 weeks before).
const attendanceDrop: Rule = (s, _today, C) => {
  const weeks = new Map<number, { a: number; t: number }>();
  for (const r of s.attendance) {
    const key = r.weekStart.getTime();
    const x = weeks.get(key) ?? { a: 0, t: 0 };
    x.a += r.attended;
    x.t += r.total;
    weeks.set(key, x);
  }
  const ordered = [...weeks.entries()].sort((x, y) => x[0] - y[0]);
  const n = C.dropWindowWeeks;
  if (ordered.length < n * 2) return null;
  const recent = ordered.slice(-n);
  const earlier = ordered.slice(-2 * n, -n);
  const sum = (arr: typeof ordered) =>
    arr.reduce((acc, [, v]) => ({ a: acc.a + v.a, t: acc.t + v.t }), { a: 0, t: 0 });
  const r = sum(recent);
  const e = sum(earlier);
  const recentPct = percent(r.a, r.t);
  const earlierPct = percent(e.a, e.t);
  if (recentPct === null || earlierPct === null) return null;
  const drop = earlierPct - recentPct;
  if (drop < C.dropPoints) return null;
  return {
    ruleId: "attendance-drop",
    severity: drop >= C.severeDropPoints ? "high" : "medium",
    reason: `Attendance fell from ${earlierPct}% to ${recentPct}% in ${n} weeks`,
    evidence: [`Weeks before: ${earlierPct}%`, `Last ${n} weeks: ${recentPct}%`],
    observedAt: new Date(recent[recent.length - 1][0]).toISOString(),
  };
};

// Rule 3: internal marks decline (last two tests per subject, compared as percentages).
const marksDecline: Rule = (s, _today, C) => {
  const bySubject = new Map<string, StudentSignals["marks"]>();
  for (const m of s.marks) bySubject.set(m.subject, [...(bySubject.get(m.subject) ?? []), m]);
  const declines: { subject: string; points: number; text: string; at: Date }[] = [];
  for (const [subject, list] of bySubject) {
    const sorted = [...list].sort((a, b) => a.assessedOn.getTime() - b.assessedOn.getTime());
    if (sorted.length < 2) continue;
    const prev = sorted[sorted.length - 2];
    const last = sorted[sorted.length - 1];
    if (prev.maxScore <= 0 || last.maxScore <= 0) continue;
    const prevPct = (prev.score / prev.maxScore) * 100;
    const lastPct = (last.score / last.maxScore) * 100;
    const points = Math.round(prevPct - lastPct);
    if (points >= C.marksDropPoints) {
      declines.push({
        subject,
        points,
        text: `${subject}: ${prev.assessment} ${Math.round(prevPct)}% to ${last.assessment} ${Math.round(lastPct)}%`,
        at: last.assessedOn,
      });
    }
  }
  if (declines.length === 0) return null;
  declines.sort((a, b) => b.points - a.points);
  const worst = declines[0];
  return {
    ruleId: "marks-decline",
    severity: worst.points >= C.severeMarksDropPoints ? "high" : "medium",
    reason: `Internal marks down ${worst.points} points in ${worst.subject} since last test`,
    evidence: declines.map((d) => d.text),
    observedAt: latest(declines.map((d) => d.at)).toISOString(),
  };
};

// Rule 4: LMS inactivity.
const lmsInactive: Rule = (s, today, C) => {
  if (s.lmsDates.length === 0) return null; // no LMS data: do not guess
  const last = latest(s.lmsDates);
  const days = daysBetween(last, today);
  if (days < C.lmsInactiveDays) return null;
  return {
    ruleId: "lms-inactive",
    severity: days >= C.lmsLongInactiveDays ? "medium" : "low",
    reason: `No LMS activity in ${days} days`,
    evidence: [`Last activity on ${formatDate(last)}`],
    observedAt: last.toISOString(),
  };
};

// Rule 5: overdue follow-up.
const overdueFollowUp: Rule = (s, today) => {
  const overdue = s.followUps
    .filter((f) => f.completedAt === null && daysBetween(f.dueDate, today) >= 1)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  if (overdue.length === 0) return null;
  const oldest = overdue[0];
  const days = daysBetween(oldest.dueDate, today);
  return {
    ruleId: "overdue-follow-up",
    severity: "high",
    reason: `Follow-up due ${formatDate(oldest.dueDate)} is ${plural(days, "day")} overdue`,
    evidence: overdue.map((f) => `${f.action} (due ${formatDate(f.dueDate)})`),
    observedAt: oldest.dueDate.toISOString(),
  };
};

// Rule 6: not met recently.
const notMetRecently: Rule = (s, today, C) => {
  if (s.meetings.length === 0) {
    return {
      ruleId: "not-met",
      severity: "medium",
      reason: "No meeting logged yet",
      evidence: ["No confirmed meetings on record"],
      observedAt: today.toISOString(),
    };
  }
  const last = latest(s.meetings.map((m) => m.meetingDate));
  const weeks = Math.floor(daysBetween(last, today) / 7);
  if (weeks < C.notMetWeeks) return null;
  return {
    ruleId: "not-met",
    severity: weeks >= C.longNotMetWeeks ? "medium" : "low",
    reason: `Not met in ${plural(weeks, "week")}`,
    evidence: [`Last meeting on ${formatDate(last)}`],
    observedAt: last.toISOString(),
  };
};

const RULES: Rule[] = [lowAttendance, attendanceDrop, marksDecline, lmsInactive, overdueFollowUp, notMetRecently];

export function evaluateStudent(s: StudentSignals, today: Date = new Date(), config: AlertConfig = ALERT_CONFIG): AlertResult[] {
  return RULES.map((rule) => rule(s, today, config)).filter((a): a is AlertResult => a !== null);
}

const RANK = { high: 3, medium: 2, low: 1 } as const;
const topRank = (alerts: AlertResult[]) => Math.max(0, ...alerts.map((a) => RANK[a.severity]));
const newest = (alerts: AlertResult[]) => Math.max(0, ...alerts.map((a) => new Date(a.observedAt).getTime()));

// Order: highest severity first, then most recent evidence, then name. No numeric score.
export function sortByAttention<T extends { name: string; alerts: AlertResult[] }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      topRank(b.alerts) - topRank(a.alerts) ||
      newest(b.alerts) - newest(a.alerts) ||
      a.name.localeCompare(b.name)
  );
}
