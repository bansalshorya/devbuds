import { prisma } from "@/server/db/client";

// Counts only. No names, no notes.
export async function getCoverage(departmentId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [totalStudents, meetings, pendingFollowUps] = await Promise.all([
    prisma.student.count({ where: { departmentId, user: { role: "STUDENT" } } }),
    prisma.meeting.findMany({
      where: {
        student: { departmentId, user: { role: "STUDENT" } },
        meetingDate: { gte: since },
      },
      select: { studentId: true },
    }),
    prisma.followUp.count({
      where: {
        student: { departmentId, user: { role: "STUDENT" } },
        completedAt: null,
      },
    }),
  ]);
  return {
    periodDays: days,
    totalStudents,
    studentsReached: new Set(meetings.map((m) => m.studentId)).size,
    meetingsLogged: meetings.length,
    pendingFollowUps,
  };
}
