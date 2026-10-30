import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { automationInbox, automationScope } from "@/server/automations/access";
import { automationPeriods, defaults } from "@/lib/automations";
import { homeFor } from "@/lib/roles";
import { AutomationAction, AutomationSettingsForm, CheckInForm, ScheduledImportForm } from "@/components/AutomationControls";
import { RegisterDownload } from "@/components/RegisterDownload";
import { Building2, Activity, Clock, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, BellRing, RefreshCcw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AutomationsPage() {
  return <Suspense fallback={<main className="mx-auto max-w-4xl p-8 text-center text-sm font-semibold text-slate-600">Loading Automation Hub…</main>}><Hub /></Suspense>;
}

const formatted = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
type Item = Record<string, unknown>;
const object = (value: unknown): Item => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Item : {};
const array = (value: unknown): Item[] => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";

function Body({ body, studentId }: { body: unknown; studentId: string | null }) {
  const data = object(body);
  const labels: Record<string, string> = { checked: "Students checked", studentsWithIssues: "Records needing review", meetings: "Meetings last week", actionsCompleted: "Actions completed last week", currentlyOpen: "Current open actions", upcomingDeadlines: "Deadlines within 7 days", currentConcerns: "Students to review", period: "Reporting period", week: "Week starting" };
  return <div className="space-y-3 text-sm">
    {typeof data.text === "string" && <p className="break-words text-slate-700">{data.text}</p>}
    <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{Object.entries(labels).filter(([key]) => data[key] !== undefined).map(([key, label]) => <div key={key} className="rounded-xl bg-slate-50 border border-slate-200 p-3"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="font-extrabold text-slate-900 mt-0.5">{text(data[key])}</dd></div>)}</dl>
    {!!array(data.items).length && <ul className="space-y-2">{array(data.items).map((item, i) => <li key={i} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      {typeof item.studentId === "string" && <Link href={`/mentor/students/${encodeURIComponent(item.studentId)}`} className="font-bold text-[#527A5B] hover:underline">{text(item.name)}</Link>}
      {item.text !== undefined && <p className="break-words text-slate-700 mt-1">{text(item.text)}{item.due ? ` · Due ${text(item.due)}` : ""}</p>}
      {Array.isArray(item.reasons) && <ul className="mt-1 list-disc pl-5 text-slate-600 text-xs space-y-1">{item.reasons.filter((r): r is string => typeof r === "string").map((reason) => <li key={reason}>{reason}</li>)}</ul>}
    </li>)}</ul>}
    {!!Object.keys(object(data.issues)).length && <ul className="list-disc space-y-1 pl-5 text-slate-700">{Object.entries(object(data.issues)).map(([issue, count]) => <li key={issue}>{issue}: {text(count)}</li>)}</ul>}
    {array(data.topics).map((topic, i) => <div key={i}><h3 className="font-bold text-slate-900">{text(topic.label)}</h3><ul className="mt-2 space-y-2">{array(topic.meetings).map((m, j) => <li key={j} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5"><p className="break-words text-slate-700">{text(m.excerpt)}</p>{studentId && <Link className="mt-2 inline-block text-xs font-bold text-[#527A5B] underline" href={`/mentor/students/${encodeURIComponent(studentId)}#meeting-${encodeURIComponent(text(m.id))}`}>Source meeting · {text(m.date)}</Link>}</li>)}</ul></div>)}
  </div>;
}

async function loadHubData(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
    const [notices, settings, jobs, runs, ids] = await Promise.all([
      automationInbox(user),
      user.role === "HOD" ? prisma.automationSettings.findUnique({ where: { departmentId: user.departmentId } }) : null,
      prisma.automationJob.findMany({ where: { userId: user.id, departmentId: user.departmentId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, kind: true, status: true, dueAt: true, result: true, input: true, finishedAt: true, artifact: false } }),
      user.role === "HOD" ? prisma.automationRun.findMany({ where: { departmentId: user.departmentId }, orderBy: { startedAt: "desc" }, take: 8 }) : [],
      automationScope(user),
    ]);
    const [checkins, students] = await Promise.all([
      prisma.studentCheckIn.findMany({ where: { studentId: { in: ids }, ...(user.role === "MENTOR" ? { respondedAt: { not: null } } : {}) }, orderBy: { weekStart: "desc" }, take: 40 }),
      user.role === "MENTOR" ? prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, user: { select: { name: true } } } }) : [],
    ]);
    return { notices, settings, jobs, runs: runs.map((r) => ({ ...r, status: r.status === "running" && Date.now() - r.startedAt.getTime() > 30 * 60000 ? "interrupted (will recover on the next run)" : r.status })), checkins, students };
}

async function Hub() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const loaded = await loadHubData(user).catch(() => null);
  if (!loaded) return <main className="mx-auto max-w-4xl space-y-4 p-8"><Link href={homeFor(user.role)} className="text-sm font-bold text-[#527A5B]">← Back to your portal</Link><h1 className="text-2xl font-extrabold text-slate-900">Automations need setup</h1><p className="text-slate-600 text-sm">The automation database is not ready or is temporarily unavailable. Ask the administrator to apply the automation update and check the database connection.</p></main>;

  const { notices, settings, jobs, runs, checkins, students } = loaded;
  const current = checkins.find((c) => c.weekStart.getTime() === automationPeriods().week.getTime());
  const names = new Map(students.map((s) => [s.id, s.user.name]));

  const scheduledCount = jobs.filter(j => j.status === "pending").length;
  const completedCount = jobs.filter(j => j.status === "completed").length;
  const failedCount = jobs.filter(j => j.status === "failed").length;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527A5B] text-white font-bold shadow-md shadow-[#527A5B]/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Automation Hub</h1>
                <Badge variant="secondary" className="bg-[#E5F3E8] text-[#527A5B] border-[#527A5B]/30 font-semibold text-xs">
                  {user.role === "HOD" ? "Department Management" : user.role === "MENTOR" ? "Faculty Portal" : "Student Portal"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">SaaS automation management, scheduled tasks &amp; intelligent updates</p>
            </div>
          </div>
          <Link href={homeFor(user.role)} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
            ← Back to portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-8 space-y-8">
        {/* SECTION A: Automation Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Scheduled Tasks</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{scheduledCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Pending automated jobs</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Executions</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{completedCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Successfully processed</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Failed / Errors</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{failedCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Requiring review</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Updates</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <BellRing className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{notices.length}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Unread notices in inbox</p>
          </div>
        </div>

        {user.role === "STUDENT" && (
          <section className="space-y-4">
            <CheckInForm key={current?.id ?? "new"} progress={current?.progress} support={current?.support} />
          </section>
        )}

        {user.role === "HOD" && (
          <div className="space-y-8">
            {/* Daily Automation Run Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-[#527A5B]" /> Daily department automation execution
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Runs daily around 9 AM India time. Processes due imports, check-ins, digests, and monthly reports.</p>
                </div>
                <AutomationAction url="/api/automations/run" method="POST" label="Run department automations now" />
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent execution audit log</p>
                {runs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No automated runs recorded yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-48 overflow-y-auto">
                    {runs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                        <span className="font-semibold text-slate-700">{formatted(r.startedAt)} IST</span>
                        <Badge variant="secondary" className={`font-bold text-[10px] ${r.status.includes("completed") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 font-medium">Job retries are fully idempotent. Interrupted execution states are automatically reclaimed after 30 minutes.</p>
              </div>
            </div>

            {/* Department Settings */}
            <AutomationSettingsForm settings={settings ?? defaults} />

            {/* Scheduled Academic Import */}
            <ScheduledImportForm />

            {/* Deployment Monitoring */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#527A5B] border border-teal-200 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Deployment monitoring</h2>
                  <p className="text-xs text-slate-500 font-medium">External GitHub Actions health check for login uptime and schema integrity</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                The repository includes an automated GitHub Actions workflow that checks login availability, database schema health, and API responsiveness. It automatically opens an issue upon failure and closes it after recovery.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  Requires GitHub Actions enabled &amp; health endpoint deployed
                </span>
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#527A5B] hover:bg-slate-50 shadow-xs transition-all"
                  href="https://github.com/bansalshorya/DevBuds/actions/workflows/monitor.yml"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> Open deployment monitor workflow
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: Scheduled Tasks & Monthly Registers (For HOD & Mentor) */}
        {user.role !== "STUDENT" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#527A5B]" /> Scheduled tasks &amp; monthly registers
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Times use India time (IST). Tasks run on the first daily run after their due time. Registers cover the previous calendar month and expire after 90 days.</p>
            </div>

            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                <Clock className="mx-auto h-8 w-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No scheduled tasks currently active.</p>
                <p className="text-[11px] text-slate-500">New batch imports or register generation jobs will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-900">
                        {job.kind === "register" ? `Monthly mentoring register · ${text(object(job.input).from).slice(0, 7)}` : `Academic sync import · ${text(object(job.input).type).toUpperCase()}`}
                      </p>
                      <Badge variant="secondary" className={`self-start sm:self-auto font-bold text-[10px] ${job.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : job.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">Earliest scheduled run: {formatted(job.dueAt)} IST</p>

                    {job.kind === "import" && job.result && (
                      <p className="text-xs text-slate-700 font-semibold">
                        Inserted: <span className="text-emerald-700 font-bold">{text(object(job.result).inserted) || "0"}</span> · Updated: <span className="text-teal-700 font-bold">{text(object(job.result).updated) || "0"}</span>
                      </p>
                    )}

                    {typeof object(job.result).error === "string" && (
                      <p className="text-xs text-red-700 font-semibold bg-red-50 p-2 rounded-lg border border-red-200">
                        Error: {text(object(job.result).error)}
                      </p>
                    )}

                    {array(object(job.result).errors).map((e, i) => (
                      <p key={i} className="text-[11px] text-red-700 font-medium">Row {text(e.row)}: {text(e.message)}</p>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {job.kind === "register" && job.status === "completed" && (
                        <a className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#527A5B] hover:bg-slate-50 shadow-2xs transition-all" href={`/api/automations/jobs/${job.id}`} download>
                          <FileSpreadsheet className="h-4 w-4" /> Download Excel register
                        </a>
                      )}
                      {job.status === "pending" && <AutomationAction url={`/api/automations/jobs/${job.id}`} label="Cancel pending task" />}
                      {job.kind === "register" && job.status === "failed" && <AutomationAction url={`/api/automations/jobs/${job.id}`} label="Retry register generation" body={{ action: "retry" }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION C: Automated Updates Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-[#527A5B]" /> Your automated updates
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Only permitted records are shown. Repeated-topic notices are prompts for human review, not automated risk conclusions.</p>
          </div>

          {notices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
              <BellRing className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No automated updates yet.</p>
              <p className="text-[11px] text-slate-500">Your department&apos;s next scheduled automation run will prepare them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <details key={n.id} className={`rounded-xl border p-4 transition-all bg-slate-50/50 ${n.resolvedAt ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-[#527A5B]"}`} open={!n.readAt && !n.resolvedAt}>
                  <summary className="min-h-10 cursor-pointer break-words text-xs font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${n.resolvedAt ? "bg-slate-400" : n.readAt ? "bg-teal-500" : "bg-amber-500"}`} />
                      {n.title}{n.studentId && names.has(n.studentId) ? ` · ${names.get(n.studentId)}` : ""}{n.resolvedAt ? " · Resolved" : ""}
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 sm:ml-auto">{formatted(n.createdAt)} IST</span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    <Body body={n.body} studentId={n.studentId} />
                    {!n.readAt && <div className="pt-1"><AutomationAction url={`/api/automations/notices/${n.id}`} label="Mark as read" /></div>}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* Check-In History (For Mentor) */}
        {!!checkins.length && user.role === "MENTOR" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#527A5B]" /> Student check-in responses
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Weekly feedback submitted by your assigned mentees.</p>
            </div>
            <div className="space-y-3">
              {checkins.filter((c) => c.respondedAt).map((c) => (
                <details key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <summary className="min-h-10 cursor-pointer text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>{names.get(c.studentId) ?? "Student response"}</span>
                    <span className="text-slate-500 font-normal">Week of {c.weekStart.toISOString().slice(0, 10)}</span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
                    <p className="whitespace-pre-wrap break-words">{c.progress}</p>
                    {c.support && <p className="whitespace-pre-wrap break-words font-semibold text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200"><strong>Support requested: </strong>{c.support}</p>}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
