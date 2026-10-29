import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getStudentForMentor } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { Sparkline } from "@/components/Sparkline";
import { LogForm } from "@/components/LogForm";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-base text-gray-600">Loading...</p>}>
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
    <main className="mx-auto max-w-md pb-10">
      <div className="px-4 pt-4">
        <Link href="/mentor" className="inline-flex h-12 items-center text-base text-teal-700 underline">
          Back to This Week
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">{student.user.name}</h1>
        <p className="text-sm text-gray-600">{student.rollNo}</p>
      </div>

      <section className="px-4 pt-4">
        <h2 className="text-sm font-medium text-gray-600">Why this student</h2>
        {alerts.length === 0 ? (
          <p className="py-2 text-base text-gray-700">No concerns right now.</p>
        ) : (
          <ul className="mt-1 space-y-3">
            {alerts.map((a) => (
              <li key={a.ruleId} className="flex gap-3">
                <span className={`mt-2 h-3 w-3 shrink-0 rounded-full ${DOT[a.severity]}`} aria-hidden />
                <div>
                  <p className="text-base font-medium text-gray-900">{a.reason}</p>
                  <ul className="text-sm text-gray-700">
                    {a.evidence.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-gray-600">Attendance by week</h2>
        <div className="flex items-center gap-3 py-1">
          <Sparkline values={weeklyAttendance} label="Weekly attendance percentage" />
          <span className="text-base text-gray-900">
            {weeklyAttendance.length ? `${weeklyAttendance[weeklyAttendance.length - 1]}% latest week` : "No data"}
          </span>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-gray-600">Internal marks (out of 50)</h2>
        <ul className="py-1 text-base text-gray-900">
          {[...marksBySubject.entries()].map(([subject, scores]) => (
            <li key={subject}>{subject}: {scores.join(" , ")}</li>
          ))}
        </ul>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-gray-600">Open actions</h2>
        {student.followUps.length === 0 ? (
          <p className="py-1 text-base text-gray-700">None.</p>
        ) : (
          <ul className="py-1 text-base text-gray-900">
            {student.followUps.map((f) => (
              <li key={f.id}>{f.action} (due {formatDate(f.dueDate)})</li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-medium text-gray-600">Previous conversations</h2>
        {student.meetings.length === 0 ? (
          <p className="py-1 text-base text-gray-700">None yet.</p>
        ) : (
          <ul className="space-y-2 py-1">
            {student.meetings.map((m) => (
              <li key={m.id} className="text-base text-gray-900">
                <span className="text-sm text-gray-500">{formatDate(m.meetingDate)}: </span>
                {m.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-8">
        <h2 className="text-lg font-semibold text-gray-900">Log this conversation</h2>
        <LogForm studentId={student.id} />
      </section>
    </main>
  );
}