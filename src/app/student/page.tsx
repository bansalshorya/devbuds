import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";
import { CompleteFollowUpButton } from "@/components/CompleteFollowUpButton";
import { FollowUpReminders, CalendarReminderLink } from "@/components/FollowUpReminders";
import { StudentProgressTimeline } from "@/components/StudentProgressTimeline";
import { GraduationCap, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8F6] text-[#242924]">
        <div className="flex items-center gap-3 rounded-2xl neumo-card px-6 py-4 bg-[#FFFFFF] border-[#DCE4DD]">
          <Skeleton className="h-5 w-5 rounded-full bg-[#527A5B] animate-pulse" />
          <p className="text-base font-semibold text-[#242924]">Loading your mentoring records...</p>
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

  const meetings = await prisma.meeting.findMany({
    where: { studentId: user.student.id },
    orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
    include: { followUps: { orderBy: { dueDate: "asc" } } },
  });
  const open = meetings.flatMap((m) => m.followUps).filter((f) => !f.completedAt);

  return (
    <div className="min-h-screen pb-20 bg-[#F6F8F6] text-[#242924]">
      {/* Header */}
      <header className="sticky top-0 z-25 bg-[#F6F8F6]/95 backdrop-blur-md border-b border-[#DCE4DD] shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-8 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527A5B] text-[#FFFFFF] font-extrabold shadow-md shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold text-[#242924] tracking-tight truncate">My Mentoring Portal</h1>
                <Badge variant="secondary" className="bg-[#EEF2EF] text-[#527A5B] border-[#DCE4DD] text-xs font-bold shrink-0">
                  Student
                </Badge>
              </div>
              <p className="text-xs text-[#5F6962] truncate font-semibold">{user.name} · Roll No: <span className="font-mono font-bold text-[#242924]">{user.student.rollNo}</span></p>
            </div>
          </div>
          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-8 pt-8 space-y-8">
        <FollowUpReminders actions={open} />
        {/* Open Action Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#242924] flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              Agreed Action Items
            </h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold">
              {open.length} pending
            </Badge>
          </div>

          {open.length === 0 ? (
            <div className="neumo-card p-6 text-center border-emerald-300 bg-emerald-50/50">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-2 shadow-inner border border-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-[#242924]">No open action items.</p>
              <p className="mt-1 text-xs text-[#5F6962] font-semibold">You are fully caught up with your faculty mentor commitments!</p>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {open.map((f) => (
                <li
                  key={f.id}
                  className="neumo-card flex items-start gap-3.5 border-amber-200 bg-gradient-to-br from-[#FFFFFF] to-amber-50/40 p-4.5"
                >
                  <div className="mt-1.5 h-3 w-3 rounded-full bg-amber-500 shrink-0 shadow-2xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#242924] break-words">{f.action}</p>
                    <p className="mt-1.5 text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" /> Due by {formatDate(f.dueDate)}
                    </p>
                    <CompleteFollowUpButton id={f.id} action={f.action} />
                    <CalendarReminderLink id={f.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator className="my-6 border-[#DCE4DD]" />

        <StudentProgressTimeline meetings={meetings} />
      </main>
    </div>
  );
}
