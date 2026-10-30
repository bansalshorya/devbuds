import { prisma } from "./client";
import { configuredThresholds } from "../../lib/thresholds";
import { aggregateCoverage } from "../../lib/coverage";
import { getThresholds } from "../alerts/settings";

// Only counts and subject/month aggregates cross the server boundary.
export async function getCoverage(departmentId: string, days = 30, mentorId?: string) {
  const [students, department, totalFaculty] = await Promise.all([
    prisma.student.findMany({
      where: {
        departmentId,
        user: { role: "STUDENT" },
        ...(mentorId ? { assignments: { some: { mentorId } } } : {}),
      },
      select: {
        id: true, assignments: { select: { mentorId: true } },
        attendance: { select: { subject: true, weekStart: true, attended: true, total: true } },
        marks: { select: { subject: true, assessedOn: true, assessment: true, score: true, maxScore: true } },
        lmsActivity: { select: { activityOn: true, events: true } },
        meetings: { select: { meetingDate: true } },
        followUps: { select: { id: true, dueDate: true, completedAt: true } },
      },
    }),
    prisma.department.findUnique({ where: { id: departmentId }, select: { alertThresholds: true } }),
    prisma.user.count({ where: { departmentId, role: "MENTOR", ...(mentorId ? { id: mentorId } : {}) } }),
  ]);
  const aggregate = aggregateCoverage(students.map((student) => ({
      ...student, studentId: student.id, name: "", assigned: student.assignments.length > 0,
      lmsDates: student.lmsActivity.map((activity) => activity.activityOn),
      followUps: student.followUps.map((followUp) => ({ ...followUp, action: "" })),
    })), mentorId ? await getThresholds(mentorId) : configuredThresholds(department?.alertThresholds), new Date(), days);
  return {
    ...aggregate,
    assignedStudents: aggregate.totalStudents,
    totalStudents: mentorId ? aggregate.totalStudents : students.length,
    totalFaculty,
  };
}
