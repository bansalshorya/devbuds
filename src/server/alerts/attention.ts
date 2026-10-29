import { prisma } from "@/server/db/client";
import { evaluateStudent, sortByAttention } from "@/server/alerts/engine";
import type { AlertResult } from "@/lib/schemas";

export type StudentRow = {
  studentId: string;
  name: string;
  rollNo: string;
  lastMet: Date | null;
  alerts: AlertResult[];
  followUps: { id: string; action: string; dueDate: Date; completedAt: Date | null }[];
};

// Only students assigned to this mentor are ever loaded.
export async function getMentorStudents(mentorId: string): Promise<StudentRow[]> {
  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentorId },
    include: {
      student: {
        include: { user: true, attendance: true, marks: true, lmsActivity: true, meetings: true, followUps: true },
      },
    },
  });
  const today = new Date();
  const rows = assignments.map(({ student: s }) => {
    const alerts = evaluateStudent(
      {
        studentId: s.id,
        name: s.user.name,
        attendance: s.attendance,
        marks: s.marks,
        lmsDates: s.lmsActivity.map((l) => l.activityOn),
        meetings: s.meetings,
        followUps: s.followUps,
      },
      today
    );
    const lastMet = s.meetings.length
      ? new Date(Math.max(...s.meetings.map((m) => m.meetingDate.getTime())))
      : null;
    return { studentId: s.id, name: s.user.name, rollNo: s.rollNo, lastMet, alerts, followUps: s.followUps };
  });
  return sortByAttention(rows);
}

// Returns null if this student is not assigned to this mentor.
export async function getStudentForMentor(mentorId: string, studentId: string) {
  const assignment = await prisma.mentorAssignment.findFirst({
    where: { mentorId, studentId },
    include: {
      student: {
        include: {
          user: true,
          attendance: true,
          marks: { orderBy: { assessedOn: "asc" } },
          lmsActivity: true,
          meetings: { orderBy: { meetingDate: "desc" } },
          followUps: { where: { completedAt: null }, orderBy: { dueDate: "asc" } },
        },
      },
    },
  });
  if (!assignment) return null;
  const s = assignment.student;

  const alerts = evaluateStudent({
    studentId: s.id,
    name: s.user.name,
    attendance: s.attendance,
    marks: s.marks,
    lmsDates: s.lmsActivity.map((l) => l.activityOn),
    meetings: s.meetings,
    followUps: s.followUps,
  });

  const weekly = new Map<number, { a: number; t: number }>();
  for (const r of s.attendance) {
    const k = r.weekStart.getTime();
    const x = weekly.get(k) ?? { a: 0, t: 0 };
    x.a += r.attended;
    x.t += r.total;
    weekly.set(k, x);
  }
  const weeklyAttendance = [...weekly.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => (v.t > 0 ? Math.round((v.a / v.t) * 100) : 0));

  return { student: s, alerts, weeklyAttendance };
}