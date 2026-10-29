import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";
import { GraduationCap, Calendar, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-200">
          <Skeleton className="h-5 w-5 rounded-full" />
          <p className="text-base font-medium text-slate-700">Loading your mentoring records...</p>
        </div>
      </div>
    }>
      <StudentHome />
    </Suspense>
  );
}

async function StudentHome() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || !user.student) redirect("/login");

  // The student id comes from the login session, never from the URL.
  const meetings = await prisma.meeting.findMany({
    where: { studentId: user.student.id },
    orderBy: { meetingDate: "desc" },
    include: { followUps: { orderBy: { dueDate: "asc" } } },
  });
  const open = meetings.flatMap((m) => m.followUps).filter((f) => !f.completedAt);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white font-bold shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">My Mentoring</h1>
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                  Student Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{user.name} · Roll: {user.student.rollNo}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-8 space-y-8">
        {/* Open Action Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              What we agreed (Open Actions)
            </h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              {open.length} pending
            </Badge>
          </div>

          {open.length === 0 ? (
            <Card className="p-6 text-center bg-white shadow-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">No open action items.</p>
              <p className="mt-1 text-xs text-slate-500">You are all caught up with your mentor commitments!</p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {open.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 p-4 shadow-xs"
                >
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-base font-medium text-slate-900">{f.action}</p>
                    <p className="mt-1 text-xs font-medium text-amber-700 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Due by {formatDate(f.dueDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator className="my-6" />

        {/* Past Conversations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-600" />
              Past Conversations
            </h2>
            <span className="text-xs text-slate-500 font-medium">{meetings.length} recorded sessions</span>
          </div>

          {meetings.length === 0 ? (
            <Card className="p-6 text-center text-slate-500 shadow-xs">
              No mentoring sessions recorded yet.
            </Card>
          ) : (
            <ul className="space-y-3">
              {meetings.map((m) => (
                <Card
                  key={m.id}
                  className="p-5 bg-white shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1.5 bg-teal-50 text-teal-800 border-teal-200 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(m.meetingDate)}
                    </Badge>
                    <span className="text-xs text-slate-400 capitalize">Language: {m.language}</span>
                  </div>
                  <p className="text-base text-slate-800 leading-relaxed">{m.summary}</p>
                </Card>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

