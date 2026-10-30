import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getMentorStudents, type StudentRow } from "@/server/alerts/attention";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";
import { CompleteFollowUpButton } from "@/components/CompleteFollowUpButton";
import { RegisterDownload } from "@/components/RegisterDownload";
import { FollowUpReminders } from "@/components/FollowUpReminders";
import { Users, CheckCircle2, ChevronRight, Calendar, UserCheck, ShieldAlert, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; sort?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8F6] text-[#242924] p-4">
        <div className="flex items-center gap-3 rounded-2xl neumo-card px-6 py-4 bg-[#FFFFFF] border-[#DCE4DD]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#527A5B] border-t-transparent" />
          <p className="text-base text-[#242924] font-semibold">Loading mentor dashboard...</p>
        </div>
      </div>
    }>
      <MentorHome searchParams={searchParams} />
    </Suspense>
  );
}

const DOT = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-[#737D76]" } as const;
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-800 border-red-200 font-bold",
  medium: "bg-amber-50 text-amber-900 border-amber-200 font-semibold",
  low: "bg-[#EEF2EF] text-[#5F6962] border-[#DCE4DD] font-medium",
} as const;

function Row({ r }: { r: StudentRow }) {
  const strongest = [...r.alerts].sort(
    (a, b) => ["low", "medium", "high"].indexOf(b.severity) - ["low", "medium", "high"].indexOf(a.severity)
  )[0];
  const dot = strongest ? DOT[strongest.severity] : "bg-emerald-600";
  const badgeStyle = strongest ? PRIORITY_BADGE[strongest.severity] : "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";

  return (
    <li>
      <Link
        href={`/mentor/students/${r.studentId}`}
        className="flex min-h-[58px] items-center gap-3.5 rounded-xl neumo-card px-4 py-3.5 bg-[#FFFFFF] hover:bg-[#F0F5F1] hover:border-[#527A5B] active:scale-[0.99] transition-[transform,box-shadow,background-color] duration-150 ease-out group"
      >
        <span className={`h-3.5 w-3.5 shrink-0 rounded-full shadow-xs ${dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#242924] group-hover:text-[#527A5B] transition-colors truncate">{r.name}</span>
            {r.rollNo && (
              <span className="text-xs font-mono font-semibold text-[#5F6962] bg-[#EEF2EF] px-2 py-0.5 rounded-md border border-[#DCE4DD]">
                {r.rollNo}
              </span>
            )}
            {strongest && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${badgeStyle}`}>
                {strongest.severity}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#5F6962] truncate mt-1 font-medium">
            {strongest ? strongest.reason : "No concerns this week — meeting benchmarks"}
            {r.alerts.length > 1 ? ` (+${r.alerts.length - 1} more)` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right hidden sm:block">
          <span className="block text-xs font-bold text-[#5F6962]">
            {r.lastMet ? `Met ${formatDate(r.lastMet)}` : "Not met yet"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-[#737D76] group-hover:text-[#527A5B] group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>
    </li>
  );
}

function getHighestSeverityScore(r: StudentRow): number {
  const severities = r.alerts.map((a) => a.severity);
  if (severities.includes("high")) return 3;
  if (severities.includes("medium")) return 2;
  if (severities.includes("low")) return 1;
  return 0;
}

async function MentorHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/login");
  const params = await searchParams;
  const tab = params.tab ?? "week";
  const filter = params.filter ?? "all";
  const sort = params.sort ?? "priority_desc";

  const rows = await getMentorStudents(user.id);
  const needs = rows.filter((r) => r.alerts.length > 0);
  const others = rows.filter((r) => r.alerts.length === 0);

  // Filter logic
  let displayedRows = rows;
  if (tab === "week" || tab === "mentees") {
    if (filter === "needs_action") {
      displayedRows = needs;
    } else if (filter === "on_track") {
      displayedRows = others;
    }
  }

  // Sorting logic
  displayedRows = [...displayedRows].sort((a, b) => {
    switch (sort) {
      case "priority_desc":
        return getHighestSeverityScore(b) - getHighestSeverityScore(a);
      case "priority_asc":
        return getHighestSeverityScore(a) - getHighestSeverityScore(b);
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "met_desc": {
        const timeA = a.lastMet ? a.lastMet.getTime() : 0;
        const timeB = b.lastMet ? b.lastMet.getTime() : 0;
        return timeB - timeA;
      }
      case "met_asc": {
        const timeA = a.lastMet ? a.lastMet.getTime() : 0;
        const timeB = b.lastMet ? b.lastMet.getTime() : 0;
        if (!a.lastMet && b.lastMet) return 1;
        if (a.lastMet && !b.lastMet) return -1;
        return timeA - timeB;
      }
      default:
        return 0;
    }
  });

  const allFollowUps = rows
    .flatMap((r) => r.followUps.map((f) => ({ ...f, studentName: r.name, studentRollNo: r.rollNo, studentId: r.studentId })))
    .filter((f) => !f.completedAt)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const overdueFollowUps = allFollowUps.filter((followUp) => dateKey(followUp.dueDate) < todayKey);
  const dueFollowUps = allFollowUps.filter((followUp) => dateKey(followUp.dueDate) >= todayKey);

  const createQueryString = (newParams: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (tab !== "week") p.set("tab", tab);
    const targetFilter = newParams.filter !== undefined ? newParams.filter : filter;
    if (targetFilter !== "all") p.set("filter", targetFilter);
    const targetSort = newParams.sort !== undefined ? newParams.sort : sort;
    if (targetSort !== "priority_desc") p.set("sort", targetSort);
    const str = p.toString();
    return str ? `/mentor?${str}` : "/mentor";
  };

  return (
    <div className="min-h-screen pb-28 bg-[#F6F8F6] text-[#242924]">
      {/* Header */}
      <header className="sticky top-0 z-25 bg-[#F6F8F6]/95 backdrop-blur-md border-b border-[#DCE4DD] px-4 py-4 sm:px-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#242924] tracking-tight">
              {tab === "mentees" ? "All Mentees" : tab === "followups" ? "Follow-ups" : "This Week"}
            </h1>
            <Badge variant="secondary" className="bg-[#EEF2EF] text-[#527A5B] border-[#DCE4DD] text-[11px] font-bold">
              Mentor Portal
            </Badge>
          </div>
          <p className="text-xs text-[#5F6962] mt-0.5 font-semibold">
            {user.name} · {tab === "mentees" ? `${rows.length} assigned students` : tab === "followups" ? `${allFollowUps.length} pending commitments` : `${rows.length} total mentees`}
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="mx-auto max-w-md sm:max-w-2xl px-4 sm:px-6 pt-6 space-y-6">
        <Link href="/automations" className="flex min-h-12 items-center justify-between rounded-xl border border-[#B5C9B9] bg-[#E5F3E8] px-4 text-sm font-bold text-[#42664A]">Automation Hub <span aria-hidden>→</span></Link>
        <FollowUpReminders actions={allFollowUps} />
        {tab === "week" && (
          <>
            {/* Quick Summary Cards (Interactive Filters) */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href={filter === "needs_action" ? createQueryString({ filter: "all" }) : createQueryString({ filter: "needs_action" })}
                aria-pressed={filter === "needs_action"}
                className={`neumo-card p-4.5 bg-gradient-to-br from-[#FFFFFF] to-red-50/50 border-red-200 flex items-center gap-3.5 transition-all hover:border-red-400 ${
                  filter === "needs_action" ? "bg-[#E5F3E8] ring-2 ring-red-500 shadow-inner" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 shrink-0 shadow-inner border border-red-200">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-red-800 font-extrabold tracking-wide uppercase">Needs Action</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#242924] mt-0.5">{needs.length}</p>
                </div>
              </Link>

              <Link
                href={filter === "on_track" ? createQueryString({ filter: "all" }) : createQueryString({ filter: "on_track" })}
                aria-pressed={filter === "on_track"}
                className={`neumo-card p-4.5 bg-gradient-to-br from-[#FFFFFF] to-emerald-50/50 border-emerald-200 flex items-center gap-3.5 transition-all hover:border-emerald-400 ${
                  filter === "on_track" ? "bg-[#E5F3E8] ring-2 ring-emerald-500 shadow-inner" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 shadow-inner border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 font-extrabold tracking-wide uppercase">On Track</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#242924] mt-0.5">{others.length}</p>
                </div>
              </Link>
            </div>
          </>
        )}

        {tab !== "followups" && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#EEF2EF] p-3.5 rounded-2xl neumo-inset border border-[#DCE4DD]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#5F6962] uppercase tracking-wide flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-[#527A5B]" /> Filter & Sort:
              </span>
              {filter !== "all" && (
                <Link
                  href={createQueryString({ filter: "all" })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#527A5B] bg-[#E5F3E8] px-2.5 py-1 rounded-full border border-[#DCE4DD] hover:bg-[#DCE4DD] transition-colors"
                >
                  {filter === "needs_action" ? "Needs Action" : "On Track"} <X className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={createQueryString({ sort: "priority_desc" })}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  sort === "priority_desc" ? "bg-[#527A5B] text-[#FFFFFF] shadow-xs" : "bg-[#FFFFFF] text-[#5F6962] hover:text-[#242924] border border-[#DCE4DD]"
                }`}
              >
                Priority (High)
              </Link>
              <Link
                href={createQueryString({ sort: "name_asc" })}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  sort === "name_asc" ? "bg-[#527A5B] text-[#FFFFFF] shadow-xs" : "bg-[#FFFFFF] text-[#5F6962] hover:text-[#242924] border border-[#DCE4DD]"
                }`}
              >
                Name (A–Z)
              </Link>
              <Link
                href={createQueryString({ sort: "met_desc" })}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  sort === "met_desc" ? "bg-[#527A5B] text-[#FFFFFF] shadow-xs" : "bg-[#FFFFFF] text-[#5F6962] hover:text-[#242924] border border-[#DCE4DD]"
                }`}
              >
                Recent Meeting
              </Link>
            </div>
          </div>
        )}

        {tab === "week" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6962] flex items-center gap-1.5">
                {filter === "needs_action" ? (
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                ) : filter === "on_track" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Users className="h-4 w-4 text-[#527A5B]" />
                )}
                {filter === "needs_action"
                  ? `Students Needing Attention (${displayedRows.length})`
                  : filter === "on_track"
                  ? `Students On Track (${displayedRows.length})`
                  : `Active Students Roster (${displayedRows.length})`}
              </h2>
              {filter !== "all" && (
                <Link href="/mentor" className="text-xs font-bold text-[#527A5B] hover:underline flex items-center gap-1">
                  Clear filter <X className="h-3 w-3" />
                </Link>
              )}
            </div>

            {displayedRows.length === 0 ? (
              <div className="neumo-card p-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#527A5B]" />
                <p className="text-sm font-bold text-[#242924]">No students match the selected filter.</p>
                <p className="text-xs text-[#5F6962] font-medium">Try clearing your filter to view all assigned mentees.</p>
                <Link href="/mentor" className="inline-block px-4 py-2 rounded-xl bg-[#527A5B] text-[#FFFFFF] font-bold text-xs shadow-xs hover:bg-[#42664A] transition-colors">
                  Reset View
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {displayedRows.map((r) => (
                  <Row key={r.studentId} r={r} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "mentees" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6962]">
                Assigned Students ({displayedRows.length})
              </h2>
              <span className="text-[11px] text-[#5F6962] font-bold">Full active roster</span>
            </div>
            {displayedRows.length === 0 ? (
              <div className="neumo-card p-8 text-center text-sm text-[#5F6962] font-semibold">
                No mentees match the selected filter.
              </div>
            ) : (
              <ul className="space-y-3">
                {displayedRows.map((r) => (
                  <Row key={r.studentId} r={r} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "followups" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6962]">
                Open Follow-up Actions ({allFollowUps.length})
              </h2>
              <span className="text-[11px] text-[#5F6962] font-bold">Due soonest</span>
            </div>
            {allFollowUps.length === 0 ? (
              <div className="neumo-card py-12 text-center px-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-3 shadow-inner border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-[#242924]">No pending follow-up actions.</p>
                <p className="text-xs text-[#5F6962] mt-1 font-semibold">All mentoring commitments have been completed!</p>
              </div>
            ) : (
              <div className="space-y-6">
                <FollowUpGroup title="Overdue" items={overdueFollowUps} todayKey={todayKey} overdue />
                <FollowUpGroup title="Due and upcoming" items={dueFollowUps} todayKey={todayKey} />
              </div>
            )}
          </section>
        )}
        <RegisterDownload />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mentor Navigation" className="fixed bottom-0 left-0 right-0 z-30 bg-[#F6F8F6]/95 backdrop-blur-md border-t border-[#DCE4DD] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-md items-center justify-around py-2 px-4">
          <Link
            href="/mentor"
            className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "week" ? "bg-[#E5F3E8] text-[#527A5B] font-extrabold shadow-xs" : "text-[#5F6962] hover:text-[#242924] font-semibold"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[11px]">This Week</span>
          </Link>
          <Link
            href="/mentor?tab=mentees"
            className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "mentees" ? "bg-[#E5F3E8] text-[#527A5B] font-extrabold shadow-xs" : "text-[#5F6962] hover:text-[#242924] font-semibold"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[11px]">Mentees</span>
          </Link>
          <Link
            href="/mentor?tab=followups"
            className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              tab === "followups" ? "bg-[#E5F3E8] text-[#527A5B] font-extrabold shadow-xs" : "text-[#5F6962] hover:text-[#242924] font-semibold"
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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function FollowUpGroup({
  title,
  items,
  todayKey,
  overdue = false,
}: {
  title: string;
  items: Array<{ id: string; action: string; dueDate: Date; studentName: string; studentRollNo: string; studentId: string }>;
  todayKey: string;
  overdue?: boolean;
}) {
  if (items.length === 0) return null;
  const today = new Date(`${todayKey}T00:00:00.000Z`);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-extrabold uppercase tracking-wider ${overdue ? "text-red-700" : "text-[#5F6962]"}`}>{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#5F6962] shadow-xs">{items.length}</span>
      </div>
      <ul className="space-y-3.5">
        {items.map((followUp) => {
          const dueDate = new Date(followUp.dueDate);
          const daysOverdue = Math.round((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
          const isToday = dateKey(dueDate) === todayKey;
          const dueLabel = overdue
            ? `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
            : isToday ? "Due today" : `Due ${formatDate(dueDate)}`;

          return (
            <li
              key={followUp.id}
              className={`neumo-card p-5 transition-all group ${
                overdue
                  ? "border-red-200 bg-gradient-to-br from-[#FFFFFF] to-red-50/50 hover:border-red-400"
                  : "border-amber-200 bg-gradient-to-br from-[#FFFFFF] to-amber-50/40 hover:border-amber-400"
              }`}
            >
              <Link href={`/mentor/students/${followUp.studentId}`} className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-extrabold flex items-center gap-1.5 ${overdue ? "text-red-900" : "text-amber-900"}`}>
                    <Users className={`h-3.5 w-3.5 ${overdue ? "text-red-700" : "text-amber-700"}`} />
                    {followUp.studentName} {followUp.studentRollNo ? `(${followUp.studentRollNo})` : ""}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border shadow-2xs ${
                    overdue ? "text-red-900 bg-red-100 border-red-300" : "text-amber-900 bg-amber-100 border-amber-300"
                  }`}>
                    <Calendar className="h-3.5 w-3.5" /> {dueLabel}
                  </span>
                </div>
                <p className="mt-3 text-base font-bold text-[#242924] leading-snug">{followUp.action}</p>
              </Link>
              <CompleteFollowUpButton id={followUp.id} action={followUp.action} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
