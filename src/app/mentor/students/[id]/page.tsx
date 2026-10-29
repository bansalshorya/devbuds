import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getStudentForMentor } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { Sparkline } from "@/components/Sparkline";
import { LogForm } from "@/components/LogForm";
import { ArrowLeft } from "lucide-react";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-base text-slate-600">Loading...</p>}>
      <Profile params={params} />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-yellow-400" } as const;

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
    <main className="mx-auto max-w-md pb-12 bg-white min-h-screen">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/mentor" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
          <ArrowLeft className="h-4 w-4" /> Back to This Week
        </Link>
        <span className="text-xs text-slate-500 font-mono">{student.rollNo}</span>
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-xl font-semibold text-slate-900">{student.user.name}</h1>
        <p className="text-sm text-slate-500">Roll No: {student.rollNo}</p>
      </div>

      <section className="px-4 pt-5">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Why this student</h2>
        {alerts.length === 0 ? (
          <p className="py-2 text-base text-slate-700">No concerns right now.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {alerts.map((a) => (
              <li key={a.ruleId} className="flex gap-3 rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${DOT[a.severity]}`} aria-hidden />
                <div>
                  <p className="text-base font-medium text-slate-900">{a.reason}</p>
                  <ul className="text-sm text-slate-600 mt-1 space-y-0.5">
                    {a.evidence.map((e) => <li key={e}>• {e}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Attendance by week</h2>
        <div className="flex items-center gap-3 py-2">
          <Sparkline values={weeklyAttendance} label="Weekly attendance percentage" />
          <span className="text-base font-medium text-slate-900">
            {weeklyAttendance.length ? `${weeklyAttendance[weeklyAttendance.length - 1]}% latest week` : "No data"}
          </span>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Internal marks (out of 50)</h2>
        <ul className="py-2 space-y-1 text-base text-slate-900">
          {[...marksBySubject.entries()].map(([subject, scores]) => (
            <li key={subject} className="flex justify-between border-b border-slate-100 py-1">
              <span className="font-medium">{subject}:</span>
              <span>{scores.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Open actions</h2>
        {student.followUps.length === 0 ? (
          <p className="py-2 text-base text-slate-700">None.</p>
        ) : (
          <ul className="py-2 space-y-2 text-base text-slate-900">
            {student.followUps.map((f) => (
              <li key={f.id} className="border-l-2 border-amber-500 pl-3 py-1">
                <p className="font-medium">{f.action}</p>
                <p className="text-xs text-slate-500">Due {formatDate(f.dueDate)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Previous conversations</h2>
        {student.meetings.length === 0 ? (
          <p className="py-2 text-base text-slate-700">None yet.</p>
        ) : (
          <ul className="space-y-3 py-2">
            {student.meetings.map((m) => (
              <li key={m.id} className="text-base text-slate-900 border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-teal-700 block">{formatDate(m.meetingDate)}</span>
                <p className="text-sm text-slate-700 mt-0.5">{m.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-8 border-t border-slate-200 mt-6 bg-slate-50 pb-6">
        <h2 className="text-lg font-semibold text-slate-900">Log this conversation</h2>
        <LogForm studentId={student.id} />
      </section>
    </main>
  );
}


