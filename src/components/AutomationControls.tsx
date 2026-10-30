"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { defaults } from "@/lib/automations";

const button = "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#527A5B] bg-white px-4 text-sm font-bold text-[#42664A] disabled:opacity-60";
const input = "mt-1 block min-h-11 w-full rounded-xl border border-[#DCE4DD] bg-white p-3 text-sm";
async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not complete this request. Retry shortly.");
  return data;
}

export function AutomationAction({ url, method = "PATCH", label, body }: { url: string; method?: string; label: string; body?: unknown }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function run() { if (busy) return; setBusy(true); setMessage(""); try { const data = await send(url, method, body); setMessage(data.status === "busy" ? "A run is already in progress." : data.status === "disabled" ? "Automations are paused in settings." : data.status === "partial" ? "Partially completed. Remaining work continues on later runs." : "Done."); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Request failed."); } finally { setBusy(false); } }
  return <div className="space-y-1"><button type="button" disabled={busy} className={button} onClick={run}>{busy ? "Working…" : label}</button>{message && <p role="status" className="text-xs text-[#5F6962]">{message}</p>}</div>;
}

export function CheckInForm({ progress = "", support = "" }: { progress?: string; support?: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (busy) return; const form = new FormData(event.currentTarget); setBusy(true); setMessage(""); try { await send("/api/automations/check-in", "POST", { progress: form.get("progress"), support: form.get("support") }); setMessage("Your check-in is saved. Your currently assigned mentor can review it."); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="space-y-3">
    <h2 className="text-lg font-bold">Your weekly check-in</h2><p className="text-sm text-[#5F6962]">Share progress before your next mentoring conversation. Your current mentors can read this; it is not included in department reports.</p>
    <label className="block text-sm font-semibold">What went well or needs attention?<textarea name="progress" required minLength={3} maxLength={1000} rows={3} defaultValue={progress} className={input} disabled={busy} /></label>
    <label className="block text-sm font-semibold">What support would you like? (optional)<textarea name="support" maxLength={1000} rows={3} defaultValue={support} className={input} disabled={busy} /></label>
    <button disabled={busy} className={button}>{busy ? "Saving…" : "Save this week's check-in"}</button>{message && <p role="status" className="text-sm text-[#42664A]">{message}</p>}
  </form>;
}

export function AutomationSettingsForm({ settings }: { settings: typeof defaults }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); try { await send("/api/automations/settings", "PATCH", { enabled: form.get("enabled") === "on", meetingGapDays: Number(form.get("meetingGapDays")), escalationDays: Number(form.get("escalationDays")), staleDataDays: Number(form.get("staleDataDays")) }); setMessage("Department settings saved."); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save settings."); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="space-y-3"><h2 className="text-lg font-bold">Department automation settings</h2>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={settings.enabled} disabled={busy} /> Enable daily automations and scheduled tasks</label>
    {([ ["meetingGapDays", "Flag a missed meeting after (days)", 7, 180], ["escalationDays", "Escalate an overdue action after (days)", 1, 90], ["staleDataDays", "Flag academic records as stale after (days)", 7, 180] ] as const).map(([name, label, min, max]) => <label key={name} className="block text-sm font-semibold">{label}<input className={input} name={name} type="number" min={min} max={max} required defaultValue={settings[name]} disabled={busy} /></label>)}
    <button disabled={busy} className={button}>{busy ? "Saving…" : "Save settings"}</button>{message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}

export function ScheduledImportForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; const element = event.currentTarget; const form = new FormData(element); const file = form.get("file");
    if (!(file instanceof File) || file.size > 100000) { setMessage("Choose a CSV file under 100 KB."); return; }
    setBusy(true); setMessage("");
    try { const dueAt = new Date(String(form.get("dueAt"))); await send("/api/automations/imports", "POST", { type: form.get("type"), csv: await file.text(), dueAt: dueAt.toISOString() }); setMessage("Import scheduled. It will run on the first daily run after this time, or when you choose Run now."); element.reset(); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not schedule import."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3"><h2 className="text-lg font-bold">Schedule academic data sync</h2><p className="text-sm text-[#5F6962]">Upload a validated CSV batch of up to 100 rows. Imports update existing source keys. Only records in your department can be changed. No external college system is connected yet.</p>
    <label className="block text-sm font-semibold">Record type<select name="type" className={input} disabled={busy}><option value="attendance">Attendance</option><option value="marks">Marks</option><option value="lms">LMS activity</option></select></label>
    <details className="rounded-xl bg-[#EEF2EF] p-3 text-xs"><summary className="min-h-8 cursor-pointer font-bold">CSV column names</summary><p className="mt-2 break-words">Attendance: rollNo, subject, weekStart, attended, total<br />Marks: rollNo, subject, assessment, assessedOn, score, maxScore<br />LMS: rollNo, activityOn, events<br />Dates: YYYY-MM-DD</p></details>
    <label className="block text-sm font-semibold">CSV file<input className={input} name="file" type="file" accept=".csv,text/csv" required disabled={busy} /></label>
    <label className="block text-sm font-semibold">Earliest run time (your device&apos;s local time)<input className={input} name="dueAt" type="datetime-local" required disabled={busy} /></label>
    <button disabled={busy} className={button}>{busy ? "Validating…" : "Validate and schedule"}</button>{message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
