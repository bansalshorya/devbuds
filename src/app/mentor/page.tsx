import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getMentorStudents, type StudentRow } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";
import { Users, AlertTriangle, CheckCircle2, ChevronRight, Calendar, UserCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
          <p className="text-base text-slate-700 font-medium">Loading mentor dashboard...</p>
        </div>
      </div>
    }>
      <MentorHome searchParams={searchParams} />
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
        className="flex min-h-[52px] items-center gap-3.5 border-b border-slate-100 bg-white px-4 py-3.5 hover:bg-teal-50/30 active:bg-slate-50 transition-all group"
      >
        <span className={`h-3 w-3 shrink-0 rounded-full shadow-2xs ${dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-slate-900 group-hover:text-teal-900 transition-colors truncate">{r.name}</span>
            {strongest && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                {strongest.severity}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
            {strongest ? strongest.reason : "No concerns this week"}
            {r.alerts.length > 1 ? ` (+${r.alerts.length - 1} more)` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-xs font-medium text-slate-500">
            {r.lastMet ? `Met ${formatDate(r.lastMet)}` : "Not met yet"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    </li>
  );
}

async function MentorHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/login");
  const params = await searchParams;
  const tab = params.tab ?? "week";

  const rows = await getMentorStudents(user.id);
  const needs = rows.filter((r) => r.alerts.length > 0);
  const others = rows.filter((r) => r.alerts.length === 0);

  const allFollowUps = rows
    .flatMap((r) => r.followUps.map((f) => ({ ...f, studentName: r.name, studentRollNo: r.rollNo, studentId: r.studentId })))
    .filter((f) => !f.completedAt)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              {tab === "mentees" ? "All Mentees" : tab === "followups" ? "Follow-ups" : "This Week"}
            </h1>
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold">
              Mentor Portal
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {user.name} · {tab === "mentees" ? `${rows.length} mentees assigned` : tab === "followups" ? `${allFollowUps.length} pending commitments` : `${rows.length} mentees total`}
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="mx-auto max-w-md sm:max-w-xl pb-6">
        {tab === "week" && (
          <>
            {/* Quick Summary Counts Bar */}
            <div className="grid grid-cols-2 gap-3 px-4 pt-5">
              <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/80 to-white p-4 shadow-xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 shrink-0 shadow-2xs">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-red-700 font-semibold tracking-wide uppercase">Needs Action</p>
                  <p className="text-2xl font-extrabold text-red-950 mt-0.5">{needs.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 shadow-2xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-semibold tracking-wide uppercase">On Track</p>
                  <p className="text-2xl font-extrabold text-emerald-950 mt-0.5">{others.length}</p>
                </div>
              </div>
            </div>

            {/* Needs a conversation section */}
            <section className="mt-6">
              <div className="px-4 pb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Needs a conversation ({needs.length})
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Sorted by priority</span>
              </div>
              {needs.length === 0 ? (
                <div className="mx-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 text-center shadow-2xs">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-900">Nobody needs attention this week.</p>
                  <p className="text-xs text-slate-600 mt-0.5">Great work! All mentees are meeting their benchmarks.</p>
                </div>
              ) : (
                <ul className="border-t border-b border-slate-200/80 bg-white shadow-xs rounded-2xl mx-4 overflow-hidden">{needs.map((r) => <Row key={r.studentId} r={r} />)}</ul>
              )}
            </section>

            {/* No concerns section */}
            <section className="mt-6">
              <div className="px-4 pb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  No concerns ({others.length})
                </h2>
              </div>
              <ul className="border-t border-b border-slate-200/80 bg-white shadow-xs rounded-2xl mx-4 overflow-hidden">{others.map((r) => <Row key={r.studentId} r={r} />)}</ul>
            </section>
          </>
        )}

        {tab === "mentees" && (
          <section className="mt-5 px-4">
            <div className="pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned Students ({rows.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Full roster</span>
            </div>
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 shadow-xs">
                No mentees assigned.
              </p>
            ) : (
              <ul className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                {rows.map((r) => <Row key={r.studentId} r={r} />)}
              </ul>
            )}
          </section>
        )}

        {tab === "followups" && (
          <section className="mt-5 px-4 space-y-3">
            <div className="pb-1 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Open Follow-up Actions ({allFollowUps.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Due soonest</span>
            </div>
            {allFollowUps.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs px-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">No pending follow-up actions.</p>
                <p className="text-xs text-slate-500 mt-1">All commitments have been completed!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {allFollowUps.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/mentor/students/${f.studentId}`}
                      className="block rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 p-4 hover:border-amber-300 hover:shadow-md transition-all shadow-2xs group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-900 group-hover:text-amber-950 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-700" /> {f.studentName} ({f.studentRollNo})
                        </span>
                        <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Due {formatDate(new Date(f.dueDate))}
                        </span>
                      </div>
                      <p className="mt-2.5 text-base font-semibold text-slate-900 leading-snug">{f.action}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar with safe-area support */}
      <nav aria-label="Mentor Navigation" className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-around py-2 px-4">
          <Link
            href="/mentor"
            className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "week" ? "text-teal-700 font-bold bg-teal-50/80 shadow-2xs" : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[11px]">This Week</span>
          </Link>
          <Link
            href="/mentor?tab=mentees"
            className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "mentees" ? "text-teal-700 font-bold bg-teal-50/80 shadow-2xs" : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[11px]">Mentees</span>
          </Link>
          <Link
            href="/mentor?tab=followups"
            className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "followups" ? "text-teal-700 font-bold bg-teal-50/80 shadow-2xs" : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <UserCheck className="h-5 w-5" />
            <span className="text-[11px]">Follow-ups</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
