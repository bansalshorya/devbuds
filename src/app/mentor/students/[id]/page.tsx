import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getStudentForMentor } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { Sparkline } from "@/components/Sparkline";
import { LogForm } from "@/components/LogForm";
import { ArrowLeft, Clock, Calendar, MessageSquare, BookOpen, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8F6] text-[#242924] p-4">
        <div className="flex items-center gap-3 rounded-2xl neumo-card px-6 py-4 bg-[#FFFFFF] border-[#DCE4DD]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#527A5B] border-t-transparent" />
          <p className="text-base text-[#242924] font-semibold">Loading student profile...</p>
        </div>
      </div>
    }>
      <Profile params={params} />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-[#737D76]" } as const;
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-800 border-red-200 font-bold",
  medium: "bg-amber-50 text-amber-900 border-amber-200 font-semibold",
  low: "bg-[#EEF2EF] text-[#5F6962] border-[#DCE4DD] font-medium",
} as const;

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/login");

  const data = await getStudentForMentor(user.id, id);
  if (!data) notFound();

  const { student, alerts, weeklyAttendance } = data;

  const marksBySubject = new Map<string, number[]>();
  for (const m of student.marks) {
    marksBySubject.set(m.subject, [...(marksBySubject.get(m.subject) ?? []), m.score]);
  }

  return (
    <main className="mx-auto max-w-md sm:max-w-2xl pb-24 min-h-screen bg-[#F6F8F6] text-[#242924]">
      {/* Header */}
      <div className="sticky top-0 z-25 bg-[#F6F8F6]/95 backdrop-blur-md border-b border-[#DCE4DD] px-4 py-3.5 sm:px-6 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <Link
          href="/mentor"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#527A5B] hover:text-[#42664A] active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to This Week
        </Link>
        <Badge variant="secondary" className="font-mono bg-[#EEF2EF] text-[#242924] border-[#DCE4DD] text-xs font-bold">
          {student.rollNo}
        </Badge>
      </div>

      <div className="px-4 sm:px-6 pt-6 space-y-6">
        {/* Student Name & Card */}
        <div className="neumo-card p-6 bg-gradient-to-br from-[#FFFFFF] via-[#E5F3E8] to-[#FFFFFF] border-[#DCE4DD]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242924] tracking-tight">{student.user.name}</h1>
            <Badge className="bg-[#527A5B] text-[#FFFFFF] font-bold shadow-xs">Active Mentee</Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6962] mt-1 font-semibold">
            Roll Number: <span className="font-mono font-bold text-[#242924]">{student.rollNo}</span> · Department ID: <span className="font-mono text-[#5F6962]">{student.departmentId}</span>
          </p>
        </div>

        {/* Why this student needs attention */}
        <section className="neumo-card p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-[#5F6962] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-600" /> Attention & Early Warnings ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <div className="neumo-inset p-4 text-center border-emerald-300 bg-emerald-50/50">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600 mb-1" />
              <p className="text-sm font-bold text-[#242924]">No active alerts. Student is on track.</p>
              <p className="text-xs text-[#5F6962] mt-0.5 font-semibold">All attendance and marks benchmarks are met.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const badgeStyle = PRIORITY_BADGE[a.severity] || PRIORITY_BADGE.low;
                return (
                  <li key={a.ruleId} className="flex gap-3.5 rounded-xl neumo-inset p-4 bg-[#EEF2EF] border border-[#DCE4DD]">
                    <span className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full shadow-xs ${DOT[a.severity]}`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-[#242924]">{a.reason}</p>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${badgeStyle}`}>
                          {a.severity}
                        </span>
                      </div>
                      <ul className="text-xs sm:text-sm text-[#5F6962] mt-2 space-y-1 font-medium">
                        {a.evidence.map((e) => <li key={e} className="flex items-center gap-1.5">• {e}</li>)}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Attendance by week */}
        <section className="neumo-card p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-[#5F6962] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#527A5B]" /> Attendance by Week
          </h2>
          <div className="flex items-center justify-between gap-3 neumo-inset p-4 bg-[#EEF2EF]">
            <Sparkline values={weeklyAttendance} label="Weekly attendance percentage" />
            <span className="text-sm font-extrabold text-[#527A5B] bg-[#E5F3E8] px-3.5 py-1.5 rounded-lg border border-[#DCE4DD] shadow-2xs shrink-0">
              {weeklyAttendance.length ? `${weeklyAttendance[weeklyAttendance.length - 1]}% latest` : "No data"}
            </span>
          </div>
        </section>

        {/* Internal marks */}
        <section className="neumo-card p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-[#5F6962] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-[#527A5B]" /> Internal Marks (Out of 50)
          </h2>
          {student.marks.length === 0 ? (
            <p className="text-sm text-[#5F6962] font-semibold">No internal marks recorded.</p>
          ) : (
            <ul className="divide-y divide-[#DCE4DD] text-sm">
              {[...marksBySubject.entries()].map(([subject, scores]) => (
                <li key={subject} className="flex justify-between items-center py-3">
                  <span className="font-bold text-[#242924]">{subject}</span>
                  <span className="font-mono font-bold text-[#527A5B] bg-[#EEF2EF] px-3 py-1 rounded-lg border border-[#DCE4DD] shadow-2xs">{scores.join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open actions */}
        <section className="neumo-card p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-[#5F6962] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" /> Open Action Items ({student.followUps.length})
          </h2>
          {student.followUps.length === 0 ? (
            <p className="text-sm text-[#5F6962] font-semibold">None pending.</p>
          ) : (
            <ul className="space-y-3">
              {student.followUps.map((f) => (
                <li key={f.id} className="rounded-xl neumo-inset border border-amber-200 bg-gradient-to-br from-[#EEF2EF] to-amber-50/50 p-4 shadow-2xs">
                  <p className="font-bold text-[#242924] text-sm sm:text-base">{f.action}</p>
                  <p className="text-xs text-amber-800 mt-1.5 font-bold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Due {formatDate(f.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Previous conversations */}
        <section className="neumo-card p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-[#5F6962] uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-[#527A5B]" /> Previous Conversations ({student.meetings.length})
          </h2>
          {student.meetings.length === 0 ? (
            <p className="text-sm text-[#5F6962] font-semibold">None recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {student.meetings.map((m) => (
                <li key={m.id} className="text-sm text-[#242924] rounded-xl neumo-inset p-4 border border-[#DCE4DD] space-y-2 bg-[#EEF2EF]">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-[#E5F3E8] text-[#527A5B] border-[#DCE4DD] font-bold text-xs">
                      {formatDate(m.meetingDate)}
                    </Badge>
                    <span className="text-xs text-[#5F6962] capitalize font-semibold">Language: {m.language}</span>
                  </div>
                  <p className="text-[#242924] leading-relaxed font-medium">{m.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Log this conversation */}
        <section className="neumo-card p-6 space-y-4 border-[#527A5B]/30 bg-gradient-to-br from-[#FFFFFF] via-[#E5F3E8]/50 to-[#FFFFFF]">
          <h2 className="text-lg font-extrabold text-[#242924] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#527A5B]" /> Log This Mentoring Session
          </h2>
          <LogForm studentId={student.id} />
        </section>
      </div>
    </main>
  );
}
