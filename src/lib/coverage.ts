import { evaluateStudent, type StudentSignals } from "../server/alerts/engine";
import type { AlertConfig } from "../server/alerts/config";
import { kolkataDate } from "./weeks";

export type AggregateStudent = StudentSignals & {
  assigned: boolean;
  lmsActivity: { activityOn: Date; events: number }[];
};

export function aggregateCoverage(students: AggregateStudent[], config: AlertConfig, now = new Date(), days = 30) {
  const today = kolkataDate(now);
  const since = new Date(today.getTime() - (days - 1) * 86400000);
  const assigned = students.filter((student) => student.assigned);
  const recentMeetings = assigned.flatMap((student) => student.meetings.map((meeting) => ({ ...meeting, studentId: student.studentId }))).filter((meeting) => meeting.meetingDate >= since && meeting.meetingDate <= today);
  const alerts = assigned.map((student) => evaluateStudent(student, today, config));
  const bySubject = new Map<string, { attended: number; total: number; scores: number[] }>();
  for (const student of assigned) {
    for (const row of student.attendance) {
      if (row.weekStart > today) continue;
      const subject = bySubject.get(row.subject) ?? { attended: 0, total: 0, scores: [] };
      subject.attended += row.attended; subject.total += row.total; bySubject.set(row.subject, subject);
    }
    const latest = new Map<string, typeof student.marks[number]>();
    for (const row of student.marks) if (row.assessedOn <= today && row.maxScore > 0 && (!latest.has(row.subject) || latest.get(row.subject)!.assessedOn < row.assessedOn)) latest.set(row.subject, row);
    for (const row of latest.values()) {
      const subject = bySubject.get(row.subject) ?? { attended: 0, total: 0, scores: [] };
      subject.scores.push(row.score / row.maxScore * 100); bySubject.set(row.subject, subject);
    }
  }
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const meetings = assigned.flatMap((student) => student.meetings).filter((meeting) => meeting.meetingDate >= start && meeting.meetingDate < end && meeting.meetingDate <= today);
    const attendance = assigned.flatMap((student) => student.attendance).filter((row) => row.weekStart >= start && row.weekStart < end && row.weekStart <= today);
    const total = attendance.reduce((sum, row) => sum + row.total, 0);
    const marks = assigned.flatMap((student) => student.marks).filter((row) => row.assessedOn >= start && row.assessedOn < end && row.assessedOn <= today && row.maxScore > 0);
    return { month: start.toISOString().slice(0, 7), meetings: meetings.length,
      attendancePct: total ? Math.round(attendance.reduce((sum, row) => sum + row.attended, 0) / total * 100) : null,
      marksPct: marks.length ? Math.round(marks.reduce((sum, row) => sum + row.score / row.maxScore * 100, 0) / marks.length) : null,
    };
  });
  return {
    periodDays: days, totalStudents: assigned.length, unassignedStudents: students.length - assigned.length,
    studentsReached: new Set(recentMeetings.map((meeting) => meeting.studentId)).size,
    meetingsLogged: recentMeetings.length,
    pendingFollowUps: assigned.flatMap((student) => student.followUps).filter((followUp) => !followUp.completedAt).length,
    overdueFollowUps: assigned.flatMap((student) => student.followUps).filter((followUp) => !followUp.completedAt && followUp.dueDate < today).length,
    studentsNeedingAttention: alerts.filter((list) => list.length).length,
    highPriorityStudents: alerts.filter((list) => list.some((alert) => alert.severity === "high")).length,
    months,
    subjects: [...bySubject.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([subject, values]) => ({
      subject, attendancePct: values.total ? Math.round(values.attended / values.total * 100) : null,
      latestMarksPct: values.scores.length ? Math.round(values.scores.reduce((a, b) => a + b, 0) / values.scores.length) : null,
    })),
  };
}

export type CoverageData = ReturnType<typeof aggregateCoverage> & { totalFaculty: number };
