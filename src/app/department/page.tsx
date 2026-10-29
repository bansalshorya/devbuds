import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";
import { prisma } from "@/server/db/client";
import { DepartmentDashboardClient, FacultyMember, DepartmentStudent } from "@/components/DepartmentDashboardClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#edf2f7]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#edf2f7] p-6 shadow-[8px_8px_18px_rgba(163,177,198,0.7),-8px_-8px_18px_rgba(255,255,255,0.8)] border border-slate-300/60">
          <Skeleton className="h-5 w-5 rounded-full bg-teal-600 animate-pulse" />
          <p className="text-base font-bold text-slate-700">Loading department dashboard...</p>
        </div>
      </div>
    }>
      <Coverage />
    </Suspense>
  );
}

async function Coverage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "HOD") redirect("/login");

  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [c, rawFaculty, rawStudents] = await Promise.all([
    getCoverage(user.departmentId, days),
    prisma.user.findMany({
      where: { role: "MENTOR", departmentId: user.departmentId },
      include: {
        assignments: {
          include: {
            student: {
              include: {
                user: true,
                meetings: { where: { meetingDate: { gte: since } } },
                followUps: { where: { completedAt: null } },
              },
            },
          },
        },
      },
    }),
    prisma.student.findMany({
      where: { departmentId: user.departmentId },
      include: {
        user: true,
        assignments: { include: { mentor: true } },
        meetings: { where: { meetingDate: { gte: since } } },
        followUps: { where: { completedAt: null } },
      },
    }),
  ]);

  const faculty: FacultyMember[] = rawFaculty.map((f) => {
    const students = f.assignments.map((a) => {
      const reached = a.student.meetings.length > 0;
      return {
        id: a.student.id,
        name: a.student.user.name,
        rollNo: a.student.rollNo,
        reached,
      };
    });
    const reachedCount = students.filter((s) => s.reached).length;
    const pendingFollowUpsCount = f.assignments.reduce(
      (acc, a) => acc + a.student.followUps.length,
      0
    );
    return {
      id: f.id,
      name: f.name,
      mobile: f.mobile,
      assignedCount: f.assignments.length,
      reachedCount,
      pendingFollowUpsCount,
      students,
    };
  });

  const students: DepartmentStudent[] = rawStudents.map((s) => {
    const reached = s.meetings.length > 0;
    const assignment = s.assignments[0];
    return {
      id: s.id,
      name: s.user.name,
      rollNo: s.rollNo,
      mentorId: assignment?.mentorId ?? null,
      mentorName: assignment?.mentor?.name ?? null,
      reached,
      pendingFollowUpsCount: s.followUps.length,
    };
  });

  const enrichedCoverage = {
    ...c,
    totalFaculty: faculty.length,
  };

  return (
    <DepartmentDashboardClient
      user={user}
      coverage={enrichedCoverage}
      faculty={faculty}
      students={students}
    />
  );
}
