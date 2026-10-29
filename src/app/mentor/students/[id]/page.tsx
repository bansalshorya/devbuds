import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getStudentForMentor } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { Sparkline } from "@/components/Sparkline";
import { LogForm } from "@/components/LogForm";
import { ArrowLeft, Clock, Calendar, MessageSquare, BookOpen, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
          <p className="text-base text-slate-700 font-medium">Loading student profile...</p>
        </div>
      </div>
    }>
      <Profile params={params} />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-yellow-400" } as const;
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/login");

  const data = await getStudentForMentor(user.id, id);
  if (!data) notFound(); // not assigned to this mentor, or does not exist

  const { student, alerts, weeklyAttendance } = data;

  const marksBySubject = new Map<string, number[]>();
  for (const m of student.marks) {
    marksBySubject.set(m.subject, [...(marksBySubject.get(m.subject) ?? []), m.score]);
  }

  return (
    <main className="mx-auto max-w-md sm:max-w-xl pb-16 bg-slate-50/70 min-h-screen">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/mentor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to This Week
        </Link>
        <Badge variant="secondary" className="font-mono bg-slate-100 text-slate-700 border-slate-200 text-xs">
          {student.rollNo}
        </Badge>
      </div>

      <div className="px-4 pt-5">
        <Card className="bg-white p-5 shadow-xs border border-slate-200/80 rounded-2xl">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{student.user.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Roll No: <span className="text-slate-800 font-semibold">{student.rollNo}</span></p>
        </Card>
      </div>

      <div className="px-4 space-y-5 pt-5">
        {/* Why this student */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Why this student needs attention
          </h2>
          {alerts.length === 0 ? (
            <p className="py-2 text-sm text-slate-700 font-medium">No concerns right now. Student is on track.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const badgeStyle = PRIORITY_BADGE[a.severity] || PRIORITY_BADGE.low;
                return (
                  <li key={a.ruleId} className="flex gap-3 rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/60 shadow-2xs">
                    <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full shadow-2xs ${DOT[a.severity]}`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-slate-900">{a.reason}</p>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                          {a.severity}
                        </span>
                      </div>
                      <ul className="text-xs sm:text-sm text-slate-600 mt-1.5 space-y-1">
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
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-700" /> Attendance by week
          </h2>
          <div className="flex items-center justify-between gap-3 py-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <Sparkline values={weeklyAttendance} label="Weekly attendance percentage" />
            <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              {weeklyAttendance.length ? `${weeklyAttendance[weeklyAttendance.length - 1]}% latest` : "No data"}
            </span>
          </div>
        </section>

        {/* Internal marks */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-teal-700" /> Internal marks (out of 50)
          </h2>
          <ul className="divide-y divide-slate-100 text-sm text-slate-900">
            {[...marksBySubject.entries()].map(([subject, scores]) => (
              <li key={subject} className="flex justify-between items-center py-2.5">
                <span className="font-semibold text-slate-800">{subject}</span>
                <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{scores.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Open actions */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" /> Open actions
          </h2>
          {student.followUps.length === 0 ? (
            <p className="py-2 text-sm text-slate-600 font-medium">None pending.</p>
          ) : (
            <ul className="space-y-2.5">
              {student.followUps.map((f) => (
                <li key={f.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
                  <p className="font-semibold text-slate-900 text-sm">{f.action}</p>
                  <p className="text-xs text-amber-800 mt-1 font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Due {formatDate(f.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Previous conversations */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-teal-700" /> Previous conversations
          </h2>
          {student.meetings.length === 0 ? (
            <p className="py-2 text-sm text-slate-600 font-medium">None recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {student.meetings.map((m) => (
                <li key={m.id} className="text-sm text-slate-900 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-teal-50 text-teal-800 border-teal-200 font-semibold text-xs">
                      {formatDate(m.meetingDate)}
                    </Badge>
                    <span className="text-xs text-slate-400 capitalize font-medium">{m.language}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">{m.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Log this conversation */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-700" /> Log this conversation
          </h2>
          <LogForm studentId={student.id} />
        </section>
      </div>
    </main>
  );
}
