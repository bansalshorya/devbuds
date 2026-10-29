import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";
import { LogoutButton } from "@/components/LogoutButton";
import { Users, CheckCircle2, Clock, BarChart3, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white font-bold shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Department Overview</h1>
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                  HOD Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{user.name} · Department Coverage</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 space-y-8">
        {/* Banner with period and privacy note */}
        <Card className="p-6 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mentoring Coverage</h2>
            <p className="mt-1 text-sm text-slate-600">
              Reporting for the last <span className="font-semibold text-slate-800">{c.periodDays} days</span>. Counts and metrics only; individual student notes remain confidential.
            </p>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto gap-1.5 bg-teal-50 border-teal-200 px-3 py-1.5 text-teal-800 font-semibold text-sm">
            <BarChart3 className="h-4 w-4" />
            {coveragePercent}% Student Coverage
          </Badge>
        </Card>

        {/* Coverage Progress Bar */}
        <Card className="p-6 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Overall Mentee Reach</span>
            <span className="font-bold text-teal-700">{c.studentsReached} of {c.totalStudents} students reached</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500 ease-out"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {c.totalStudents - c.studentsReached} students have not had a meeting logged in this period.
          </p>
        </Card>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Students Reached</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{c.studentsReached}</p>
            <p className="mt-1 text-xs text-slate-500">out of {c.totalStudents} total department students</p>
          </Card>

          <Card className="p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meetings Logged</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{c.meetingsLogged}</p>
            <p className="mt-1 text-xs text-slate-500">sessions recorded in the last {c.periodDays} days</p>
          </Card>

          <Card className="p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow-Ups Pending</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{c.pendingFollowUps}</p>
            <p className="mt-1 text-xs text-slate-500">action items awaiting completion</p>
          </Card>
        </div>
      </main>
    </div>
  );
}

