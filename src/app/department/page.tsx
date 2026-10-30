import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";
import { getDepartmentAdministration } from "@/server/db/department";
import { LogoutButton } from "@/components/LogoutButton";
import { MentorAssignmentControl } from "@/components/MentorAssignmentControl";
import { AddFacultyForm } from "@/components/AddFacultyForm";
import { DepartmentCsvImport } from "@/components/DepartmentCsvImport";
import { Users, CheckCircle2, Clock, BarChart3, Building2, BriefcaseBusiness, GraduationCap, Phone, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-200">
          <Skeleton className="h-5 w-5 rounded-full" />
          <p className="text-base font-medium text-slate-700">Loading department coverage...</p>
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
  const [c, administration] = await Promise.all([
    getCoverage(user.departmentId),
    getDepartmentAdministration(user.departmentId),
  ]);

  const coveragePercent = c.totalStudents > 0
    ? Math.round((c.studentsReached / c.totalStudents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold shadow-md shadow-teal-700/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Department Overview</h1>
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 font-semibold text-xs">
                  HOD Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">{user.name} · Department Coverage</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 space-y-8">
        <Link href="/automations" className="flex min-h-12 items-center justify-between rounded-xl border border-[#B5C9B9] bg-[#E5F3E8] px-4 text-sm font-bold text-[#42664A]">Automation Hub · scheduling, data checks &amp; monitoring <span aria-hidden>→</span></Link>
        {/* Banner with period and privacy note */}
        <Card className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Mentoring Coverage</h2>
            <p className="mt-1 text-sm text-slate-600 font-normal">
              Reporting for the last <span className="font-semibold text-slate-800">{c.periodDays} days</span>. Counts and metrics only; individual student notes remain confidential.
            </p>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto gap-1.5 bg-teal-50 border-teal-200 px-3.5 py-2 text-teal-800 font-bold text-sm shadow-2xs">
            <BarChart3 className="h-4 w-4" />
            {coveragePercent}% Student Coverage
          </Badge>
        </Card>

        {/* Coverage Progress Bar */}
        <Card className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-800">Overall Mentee Reach</span>
            <span className="font-extrabold text-teal-700">{c.studentsReached} of {c.totalStudents} students reached</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500 ease-out shadow-2xs"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {c.totalStudents - c.studentsReached} students have not had a meeting logged in this period.
          </p>
        </Card>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4 sm:p-5 bg-white shadow-xs rounded-2xl border border-slate-200/80 !gap-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Students Reached</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-2xs shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{c.studentsReached}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">out of {c.totalStudents} total department students</p>
          </Card>

          <Card className="p-4 sm:p-5 bg-white shadow-xs rounded-2xl border border-slate-200/80 !gap-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meetings Logged</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shadow-2xs shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{c.meetingsLogged}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">sessions recorded in the last {c.periodDays} days</p>
          </Card>

          <Card className="p-4 sm:p-5 bg-white shadow-xs rounded-2xl border border-slate-200/80 !gap-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow-Ups Pending</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shadow-2xs shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{c.pendingFollowUps}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">action items awaiting completion</p>
          </Card>
        </div>

        <section className="space-y-4" aria-labelledby="department-setup-title">
          <div>
            <h2 id="department-setup-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <Settings2 className="h-5 w-5 text-teal-700" /> Department setup
            </h2>
            <p className="mt-1 text-sm text-slate-600">Add faculty individually or import student and faculty accounts in bulk.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"><AddFacultyForm /></Card>
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"><DepartmentCsvImport /></Card>
          </div>
        </section>

        {/* Faculty work is visible as operational counts, never private student notes. */}
        <section className="space-y-4" aria-labelledby="faculty-work-title">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="faculty-work-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <BriefcaseBusiness className="h-5 w-5 text-teal-700" />
                Faculty work overview
              </h2>
              <p className="mt-1 text-sm text-slate-600">Workload and activity counts only. Meeting notes remain confidential.</p>
            </div>
            <Badge variant="secondary" className="self-start bg-slate-100 text-slate-700 sm:self-auto">
              {administration.faculty.length} faculty members
            </Badge>
          </div>

          {administration.faculty.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-6 text-sm font-medium text-slate-600">
              No faculty mentors are registered in this department yet.
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <div className="hidden grid-cols-[minmax(12rem,1.5fr)_repeat(4,minmax(7rem,1fr))] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid">
                <span>Faculty member</span>
                <span>Assigned students</span>
                <span>Meetings ({administration.periodDays}d)</span>
                <span>Pending actions</span>
                <span>Last meeting</span>
              </div>
              <ul className="divide-y divide-slate-200">
                {administration.faculty.map((member) => (
                  <li key={member.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(12rem,1.5fr)_repeat(4,minmax(7rem,1fr))] md:items-center md:gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{member.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Phone className="h-3 w-3" /> {member.mobile}
                      </p>
                    </div>
                    <WorkMetric label="Assigned students" value={member.assignedStudents} />
                    <WorkMetric label={`Meetings (${administration.periodDays}d)`} value={member.meetingsLogged} />
                    <WorkMetric label="Pending actions" value={member.pendingFollowUps} emphasize={member.pendingFollowUps > 0} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 md:hidden">Last meeting</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800 md:mt-0">
                        {member.lastMeetingOn ? member.lastMeetingOn.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No meetings yet"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-4" aria-labelledby="student-management-title">
          <div>
            <h2 id="student-management-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <GraduationCap className="h-5 w-5 text-teal-700" />
              Student assignments
            </h2>
            <p className="mt-1 text-sm text-slate-600">Assign or reassign each student to a faculty mentor.</p>
          </div>

          {administration.students.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-6 text-sm font-medium text-slate-600">
              No student accounts are available for assignment.
            </Card>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              {administration.students.map((student) => (
                <li key={student.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{student.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Roll {student.rollNo} · {student.mobile}
                    </p>
                  </div>
                  <MentorAssignmentControl
                    studentUserId={student.id}
                    studentName={student.name}
                    faculty={administration.faculty}
                    currentMentorId={student.mentors[0]?.id ?? null}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function WorkMetric({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 md:hidden">{label}</p>
      <p className={`mt-0.5 text-lg font-extrabold md:mt-0 ${emphasize ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
