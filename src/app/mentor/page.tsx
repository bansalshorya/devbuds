import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getMentorStudents, type StudentRow } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";

export default function MentorPage() {
  return (
    <Suspense fallback={<p className="p-4 text-base text-gray-600">Loading...</p>}>
      <MentorHome />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-yellow-400" } as const;

function Row({ r }: { r: StudentRow }) {
  const top = r.alerts[0]; // first alert after sorting by rule order; profile shows all
  const strongest = [...r.alerts].sort(
    (a, b) => ["low", "medium", "high"].indexOf(b.severity) - ["low", "medium", "high"].indexOf(a.severity)
  )[0];
  const dot = strongest ? DOT[strongest.severity] : "bg-green-600";
  return (
    <li>
      <Link
        href={`/mentor/students/${r.studentId}`}
        className="flex min-h-12 items-start gap-3 border-b border-gray-200 px-4 py-3"
      >
        <span className={`mt-2 h-3 w-3 shrink-0 rounded-full ${dot}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium text-gray-900">{r.name}</span>
          <span className="block text-sm text-gray-700">
            {strongest ? strongest.reason : "No concerns this week"}
            {r.alerts.length > 1 ? ` (+${r.alerts.length - 1} more)` : ""}
          </span>
        </span>
        <span className="shrink-0 text-sm text-gray-500">
          {r.lastMet ? `Met ${formatDate(r.lastMet)}` : "Not met yet"}
        </span>
      </Link>
      {top ? null : null}
    </li>
  );
}

async function MentorHome() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/login");
  const rows = await getMentorStudents(user.id);
  const needs = rows.filter((r) => r.alerts.length > 0);
  const others = rows.filter((r) => r.alerts.length === 0);

  return (
    <main className="mx-auto max-w-md pb-8">
      <header className="flex items-center justify-between px-4 pt-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">This Week</h1>
          <p className="text-sm text-gray-600">{user.name}</p>
        </div>
        <LogoutButton />
      </header>

      <h2 className="px-4 pb-1 pt-5 text-sm font-medium text-gray-600">
        Needs a conversation ({needs.length})
      </h2>
      {needs.length === 0 ? (
        <p className="px-4 py-3 text-base text-gray-700">Nobody needs attention this week.</p>
      ) : (
        <ul className="border-t border-gray-200">{needs.map((r) => <Row key={r.studentId} r={r} />)}</ul>
      )}

      <h2 className="px-4 pb-1 pt-5 text-sm font-medium text-gray-600">No concerns ({others.length})</h2>
      <ul className="border-t border-gray-200">{others.map((r) => <Row key={r.studentId} r={r} />)}</ul>
    </main>
  );
}