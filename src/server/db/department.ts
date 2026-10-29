import { prisma } from "@/server/db/client";

export async function getDepartmentAdministration(departmentId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [faculty, students] = await Promise.all([
    prisma.user.findMany({
      where: { departmentId, role: "MENTOR" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        mobile: true,
        _count: {
          select: {
            assignments: { where: { student: { user: { role: "STUDENT" } } } },
            meetings: { where: { meetingDate: { gte: since } } },
            followUps: { where: { completedAt: null } },
          },
        },
        meetings: {
          orderBy: { meetingDate: "desc" },
          take: 1,
          select: { meetingDate: true },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        departmentId,
        role: "STUDENT",
        student: { isNot: null },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        mobile: true,
        student: {
          select: {
            rollNo: true,
            assignments: {
              select: { mentor: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
  ]);

  return {
    periodDays: days,
    faculty: faculty.map((member) => ({
      id: member.id,
      name: member.name,
      mobile: member.mobile,
      assignedStudents: member._count.assignments,
      meetingsLogged: member._count.meetings,
      pendingFollowUps: member._count.followUps,
      lastMeetingOn: member.meetings[0]?.meetingDate ?? null,
    })),
    students: students.map((student) => ({
      id: student.id,
      name: student.name,
      mobile: student.mobile,
      rollNo: student.student!.rollNo,
      mentors: student.student!.assignments.map((assignment) => assignment.mentor),
    })),
  };
}
