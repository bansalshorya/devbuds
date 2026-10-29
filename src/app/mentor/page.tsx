import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getMentorStudents, type StudentRow } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";
import { Users, AlertTriangle, CheckCircle2, ChevronRight, Calendar, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MentorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-base text-slate-600 font-medium">Loading attention list...</p>
      </div>
    }>
      <MentorHome />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-slate-400" } as const;
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

function Row({ r }: { r: StudentRow }) {
  const strongest = [...r.alerts].sort(
    (a, b) => ["low", "medium", "high"].indexOf(b.severity) - ["low", "medium", "high"].indexOf(a.severity)
  )[0];
  const dot = strongest ? DOT[strongest.severity] : "bg-emerald-600";
  const badgeStyle = strongest ? PRIORITY_BADGE[strongest.severity] : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <li>
      <Link
        href={`/mentor/students/${r.studentId}`}
        className="flex min-h-[48px] items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 active:bg-slate-50 transition-colors"
      >
        <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-slate-900 truncate">{r.name}</span>
            {strongest && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyle}`}>
                {strongest.severity}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate mt-0.5">
            {strongest ? strongest.reason : "No concerns this week"}
            {r.alerts.length > 1 ? ` (+${r.alerts.length - 1} more)` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-xs text-slate-500">
            {r.lastMet ? `Met ${formatDate(r.lastMet)}` : "Not met yet"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
      </Link>
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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">This Week</h1>
          <p className="text-xs text-slate-500">{user.name} · {rows.length} mentees</p>
        </div>
        <LogoutButton />
      </header>

      <main className="mx-auto max-w-md pb-6">
        {/* Quick Summary Counts Bar */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-xs text-red-700 font-medium">Needs Action</p>
              <p className="text-xl font-bold text-red-900">{needs.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs text-emerald-700 font-medium">On Track</p>
              <p className="text-xl font-bold text-emerald-900">{others.length}</p>
            </div>
          </div>
        </div>

        {/* Needs a conversation section */}
        <section className="mt-5">
          <h2 className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Needs a conversation ({needs.length})
          </h2>
          {needs.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-600 bg-white border-y border-slate-200">
              Nobody needs attention this week. Great work!
            </p>
          ) : (
            <ul className="border-t border-b border-slate-200 bg-white">{needs.map((r) => <Row key={r.studentId} r={r} />)}</ul>
          )}
        </section>

        {/* No concerns section */}
        <section className="mt-6">
          <h2 className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            No concerns ({others.length})
          </h2>
          <ul className="border-t border-b border-slate-200 bg-white">{others.map((r) => <Row key={r.studentId} r={r} />)}</ul>
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar with safe-area support */}
      <nav aria-label="Mentor Navigation" className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-around py-2 px-4">
          <Link href="/mentor" className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-teal-700 px-3">
            <Calendar className="h-5 w-5" />
            <span className="text-[11px] font-semibold">This Week</span>
          </Link>
          <Link href="/mentor" className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 px-3">
            <Users className="h-5 w-5" />
            <span className="text-[11px] font-medium">Mentees</span>
          </Link>
          <Link href="/mentor" className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 px-3">
            <UserCheck className="h-5 w-5" />
            <span className="text-[11px] font-medium">Follow-ups</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}



