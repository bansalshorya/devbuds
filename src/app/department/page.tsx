import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";
import { LogoutButton } from "@/components/LogoutButton";
import { Users, CheckCircle2, Clock, BarChart3, Building2 } from "lucide-react";
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
  const c = await getCoverage(user.departmentId);

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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Students Reached</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{c.studentsReached}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">out of {c.totalStudents} total department students</p>
          </Card>

          <Card className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meetings Logged</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{c.meetingsLogged}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">sessions recorded in the last {c.periodDays} days</p>
          </Card>

          <Card className="p-6 bg-white shadow-xs rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow-Ups Pending</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{c.pendingFollowUps}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">action items awaiting completion</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
