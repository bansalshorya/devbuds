import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { automationInbox, automationScope } from "@/server/automations/access";
import { automationPeriods, defaults } from "@/lib/automations";
import { homeFor } from "@/lib/roles";
import { AutomationAction, AutomationSettingsForm, CheckInForm, ScheduledImportForm } from "@/components/AutomationControls";

export default function AutomationsPage() {
  return <Suspense fallback={<main className="mx-auto max-w-3xl p-6">Loading your automation hub…</main>}><Hub /></Suspense>;
}
const card = "neumo-card space-y-4 p-5 sm:p-6";
const formatted = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
type Item = Record<string, unknown>;
const object = (value: unknown): Item => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Item : {};
const array = (value: unknown): Item[] => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";

function Body({ body, studentId }: { body: unknown; studentId: string | null }) {
  const data = object(body);
  const labels: Record<string, string> = { checked: "Students checked", studentsWithIssues: "Records needing review", meetings: "Meetings last week", actionsCompleted: "Actions completed last week", currentlyOpen: "Current open actions", upcomingDeadlines: "Deadlines within 7 days", currentConcerns: "Students to review", period: "Reporting period", week: "Week starting" };
  return <div className="space-y-3 text-sm">
    {typeof data.text === "string" && <p className="break-words">{data.text}</p>}
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">{Object.entries(labels).filter(([key]) => data[key] !== undefined).map(([key, label]) => <div key={key} className="rounded-lg bg-[#EEF2EF] p-2"><dt className="text-xs text-[#5F6962]">{label}</dt><dd className="font-bold">{text(data[key])}</dd></div>)}</dl>
    {!!array(data.items).length && <ul className="space-y-2">{array(data.items).map((item, i) => <li key={i} className="rounded-lg border border-[#DCE4DD] p-3">
      {typeof item.studentId === "string" && <Link href={`/mentor/students/${encodeURIComponent(item.studentId)}`} className="font-bold text-[#42664A] underline">{text(item.name)}</Link>}
      {item.text !== undefined && <p className="break-words">{text(item.text)}{item.due ? ` · Due ${text(item.due)}` : ""}</p>}
      {Array.isArray(item.reasons) && <ul className="mt-1 list-disc pl-5">{item.reasons.filter((r): r is string => typeof r === "string").map((reason) => <li key={reason}>{reason}</li>)}</ul>}
    </li>)}</ul>}
    {!!Object.keys(object(data.issues)).length && <ul className="list-disc space-y-1 pl-5">{Object.entries(object(data.issues)).map(([issue, count]) => <li key={issue}>{issue}: {text(count)}</li>)}</ul>}
    {array(data.topics).map((topic, i) => <div key={i}><h3 className="font-bold">{text(topic.label)}</h3><ul className="mt-1 space-y-2">{array(topic.meetings).map((m, j) => <li key={j} className="rounded-lg bg-[#EEF2EF] p-3"><p className="break-words">{text(m.excerpt)}</p>{studentId && <Link className="mt-1 inline-block text-xs font-bold text-[#42664A] underline" href={`/mentor/students/${encodeURIComponent(studentId)}#meeting-${encodeURIComponent(text(m.id))}`}>Source meeting · {text(m.date)}</Link>}</li>)}</ul></div>)}
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
  if (!loaded) return <main className="mx-auto max-w-3xl space-y-4 p-6"><Link href={homeFor(user.role)} className="text-sm font-bold text-[#42664A]">← Back to your portal</Link><h1 className="text-xl font-bold">Automations need setup</h1><p>The automation database is not ready or is temporarily unavailable. Ask the administrator to apply the automation update and check the database connection.</p></main>;
  const { notices, settings, jobs, runs, checkins, students } = loaded;
    const current = checkins.find((c) => c.weekStart.getTime() === automationPeriods().week.getTime());
    const names = new Map(students.map((s) => [s.id, s.user.name]));
    const content = <>
      {user.role === "STUDENT" && <section className={card}><CheckInForm key={current?.id ?? "new"} progress={current?.progress} support={current?.support} /></section>}
      {user.role === "HOD" && <>
        <section className={card}><h2 className="text-lg font-bold">Daily automation run</h2><p className="text-sm text-[#5F6962]">Runs daily around 9 AM India time after hosting setup. Due imports, check-ins, weekly agendas/digests, data checks, and monthly reports share one scheduler. You can also process due work now.</p><AutomationAction url="/api/automations/run" method="POST" label="Run now" />
          <details><summary className="min-h-11 cursor-pointer text-sm font-bold">Recent runs</summary>{runs.length ? <ul className="space-y-2 text-sm">{runs.map((r) => <li key={r.id}>{formatted(r.startedAt)} IST · <strong>{r.status}</strong></li>)}</ul> : <p className="text-sm text-[#5F6962]">No runs yet.</p>}</details>
          <p className="text-xs text-[#5F6962]">A failed or partial run needs review. Job retries are idempotent; interrupted work is reclaimed after 30 minutes.</p>
        </section>
        <section className={card}><AutomationSettingsForm settings={settings ?? defaults} /></section>
        <section className={card}><ScheduledImportForm /></section>
        <section className={card}><h2 className="text-lg font-bold">Deployment monitoring</h2><p className="text-sm">The repository includes an external GitHub Actions monitor for login availability, database/schema health, and slow responses. It opens one issue on failure and closes it after recovery. Enable Actions and deploy the updated health endpoint before relying on it.</p><a className="inline-flex min-h-11 items-center text-sm font-bold text-[#42664A] underline" href="https://github.com/bansalshorya/DevBuds/actions/workflows/monitor.yml" target="_blank" rel="noreferrer">Open deployment monitor</a></section>
      </>}
      <section className={card}><h2 className="text-lg font-bold">Your automated updates</h2><p className="text-xs text-[#5F6962]">Only your permitted records are shown. Repeated-topic notices are prompts for human review, not student risk assessments.</p>
        {!notices.length ? <p className="text-sm text-[#5F6962]">No updates yet. Your department&apos;s next automation run will prepare them.</p> : notices.map((n) => <details key={n.id} className={`rounded-xl border p-4 ${n.resolvedAt ? "border-[#DCE4DD] opacity-70" : "border-[#B5C9B9]"}`} open={!n.readAt && !n.resolvedAt}>
          <summary className="min-h-11 cursor-pointer break-words text-sm font-bold">{n.title}{n.studentId && names.has(n.studentId) ? ` · ${names.get(n.studentId)}` : ""}{n.resolvedAt ? " · Resolved" : ""}<span className="mt-1 block text-xs font-normal text-[#5F6962]">{formatted(n.createdAt)} IST</span></summary>
          <Body body={n.body} studentId={n.studentId} />{!n.readAt && <div className="mt-3"><AutomationAction url={`/api/automations/notices/${n.id}`} label="Mark as read" /></div>}
        </details>)}
      </section>
      {!!checkins.length && <section className={card}><h2 className="text-lg font-bold">{user.role === "MENTOR" ? "Student check-in responses" : "Your check-in history"}</h2>{checkins.filter((c) => c.respondedAt).map((c) => <details key={c.id} className="rounded-xl border border-[#DCE4DD] p-3"><summary className="min-h-11 cursor-pointer text-sm font-bold">{names.get(c.studentId) ?? "Your response"} · Week of {c.weekStart.toISOString().slice(0, 10)}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{c.progress}</p>{c.support && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>Support requested: </strong>{c.support}</p>}</details>)}</section>}
      {user.role !== "STUDENT" && <section className={card}><h2 className="text-lg font-bold">Scheduled tasks &amp; monthly registers</h2><p className="text-xs text-[#5F6962]">Times below use India time. Tasks run on the first daily run after their due time. Registers cover the previous calendar month and require mentor review. Downloads expire after 90 days.</p>
        {!jobs.length ? <p className="text-sm text-[#5F6962]">No tasks yet.</p> : <ul className="space-y-3">{jobs.map((job) => <li key={job.id} className="space-y-2 rounded-xl border border-[#DCE4DD] p-3"><p className="text-sm font-bold">{job.kind === "register" ? `Monthly register · ${text(object(job.input).from).slice(0, 7)}` : `Academic import · ${text(object(job.input).type)}`} · {job.status}</p><p className="text-xs text-[#5F6962]">Earliest run: {formatted(job.dueAt)} IST</p>
          {job.kind === "import" && job.result && <p className="text-xs">Inserted: {text(object(job.result).inserted) || "0"} · Updated: {text(object(job.result).updated) || "0"}</p>}
          {typeof object(job.result).error === "string" && <p className="text-sm text-red-800">{text(object(job.result).error)}</p>}
          {array(object(job.result).errors).map((e, i) => <p key={i} className="text-xs text-red-800">Row {text(e.row)}: {text(e.message)}</p>)}
          {job.kind === "register" && job.status === "completed" && <a className="inline-flex min-h-11 items-center text-sm font-bold text-[#42664A] underline" href={`/api/automations/jobs/${job.id}`} download>Download Excel register</a>}
          {job.status === "pending" && <AutomationAction url={`/api/automations/jobs/${job.id}`} label="Cancel pending task" />}
          {job.kind === "register" && job.status === "failed" && <AutomationAction url={`/api/automations/jobs/${job.id}`} label="Retry register generation" body={{ action: "retry" }} />}
        </li>)}</ul>}
      </section>}
    </>;

  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 text-[#242924]"><Link href={homeFor(user.role)} className="inline-flex min-h-11 items-center text-sm font-bold text-[#42664A]">← Back to your portal</Link><header><h1 className="text-3xl font-extrabold">Automation Hub</h1><p className="mt-2 text-sm text-[#5F6962]">Your agenda, check-ins, progress updates, and scheduled work.</p></header>{content}</main>;
}
