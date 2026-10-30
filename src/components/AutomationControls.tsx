"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { defaults } from "@/lib/automations";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, ChevronDown, Check, Sliders } from "lucide-react";

const buttonClass = "inline-flex h-11 items-center justify-center rounded-xl bg-[#527A5B] px-5 text-sm font-bold text-white shadow-xs hover:bg-[#42664A] disabled:opacity-50 transition-all cursor-pointer";
const secondaryButtonClass = "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#527A5B] hover:bg-slate-50 shadow-xs transition-all cursor-pointer";
const inputClass = "mt-1.5 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#527A5B]";

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not complete this request. Retry shortly.");
  return data;
}

export function AutomationAction({ url, method = "PATCH", label, body }: { url: string; method?: string; label: string; body?: unknown }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function run() { if (busy) return; setBusy(true); setMessage(""); try { const data = await send(url, method, body); setMessage(data.status === "busy" ? "A run is already in progress." : data.status === "disabled" ? "Automations are paused in settings." : data.status === "partial" ? "Partially completed. Remaining work continues on later runs." : "Done."); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Request failed."); } finally { setBusy(false); } }
  return <div className="space-y-1"><button type="button" disabled={busy} className={secondaryButtonClass} onClick={run}>{busy ? "Working…" : label}</button>{message && <p role="status" className="text-xs text-slate-500 font-medium">{message}</p>}</div>;
}

export function CheckInForm({ progress = "", support = "" }: { progress?: string; support?: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (busy) return; const form = new FormData(event.currentTarget); setBusy(true); setMessage(""); try { await send("/api/automations/check-in", "POST", { progress: form.get("progress"), support: form.get("support") }); setMessage("Your check-in is saved. Your currently assigned mentor can review it."); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
    <div>
      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">Your weekly check-in</h2>
      <p className="text-xs text-slate-500 font-medium mt-1">Share progress before your next mentoring conversation. Your current mentors can read this; it is not included in department reports.</p>
    </div>
    <label className="block text-xs font-bold text-slate-700">What went well or needs attention?<textarea name="progress" required minLength={3} maxLength={1000} rows={3} defaultValue={progress} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#527A5B]" disabled={busy} /></label>
    <label className="block text-xs font-bold text-slate-700">What support would you like? (optional)<textarea name="support" maxLength={1000} rows={3} defaultValue={support} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#527A5B]" disabled={busy} /></label>
    <Button disabled={busy} className={buttonClass}>{busy ? "Saving check-in…" : "Save this week's check-in"}</Button>
    {message && <p role="status" className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{message}</p>}
  </form>;
}

export function AutomationSettingsForm({ settings }: { settings: typeof defaults }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await send("/api/automations/settings", "PATCH", {
        enabled,
        meetingGapDays: Number(form.get("meetingGapDays")),
        escalationDays: Number(form.get("escalationDays")),
        staleDataDays: Number(form.get("staleDataDays"))
      });
      setMessage("Automation settings saved successfully.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sliders className="h-5 w-5 text-[#527A5B]" /> Automation settings
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Control department-level automated workflows, scheduled checks, and threshold parameters.</p>
      </div>

      {/* Enable Automations Toggle Switch */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="space-y-0.5">
          <label htmlFor="enabled-toggle" className="text-xs font-bold text-slate-900 cursor-pointer">
            Enable daily automations and scheduled tasks
          </label>
          <p className="text-[11px] text-slate-500 font-medium">When disabled, automated daily checks and scheduled batches are paused.</p>
        </div>
        <button
          id="enabled-toggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#527A5B] focus:ring-offset-2 ${
            enabled ? "bg-[#527A5B]" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Automation Thresholds Subsection */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Automation thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700">
            Flag a missed meeting after (days)
            <input className={inputClass} name="meetingGapDays" type="number" min={7} max={180} required defaultValue={settings.meetingGapDays} disabled={busy} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Escalate an overdue action after (days)
            <input className={inputClass} name="escalationDays" type="number" min={1} max={90} required defaultValue={settings.escalationDays} disabled={busy} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Flag academic records as stale after (days)
            <input className={inputClass} name="staleDataDays" type="number" min={7} max={180} required defaultValue={settings.staleDataDays} disabled={busy} />
          </label>
        </div>
      </div>

      {/* Save Action & Feedback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div>
          {message && <p role="status" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">{message}</p>}
        </div>
        <Button disabled={busy} className={`${buttonClass} w-full sm:w-auto`}>
          {busy ? "Saving settings…" : "Save automation settings"}
        </Button>
      </div>
    </form>
  );
}

export function ScheduledImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recordType, setRecordType] = useState<"attendance" | "marks" | "lms">("attendance");
  const [typeOpen, setTypeOpen] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 100000) { setMessage("Choose a CSV file under 100 KB."); return; }
    setFile(f);
    setMessage("");
  }

  function clearFile() {
    setFile(null);
    setInputKey((k) => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !file) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const dueAt = new Date(String(form.get("dueAt")));
      await send("/api/automations/imports", "POST", { type: recordType, csv: await file.text(), dueAt: dueAt.toISOString() });
      setMessage("Import scheduled successfully. It will run on the first daily run after this time, or when you choose Run now.");
      setFile(null);
      setInputKey((k) => k + 1);
      event.currentTarget.reset();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not schedule import.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Upload className="h-5 w-5 text-[#527A5B]" /> Schedule academic data sync</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Upload a validated CSV batch of up to 100 rows. Imports update existing source keys. Only department records can be modified.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Record Type Custom Dropdown */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Record type</label>
          <button
            type="button"
            onClick={() => setTypeOpen(!typeOpen)}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#527A5B] cursor-pointer"
          >
            <span>{recordType === "attendance" ? "Attendance" : recordType === "marks" ? "Marks" : "LMS activity"}</span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${typeOpen ? "rotate-180" : ""}`} />
          </button>

          {typeOpen && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white shadow-xl border border-slate-200 z-30 p-1.5 space-y-1 animate-fadeIn">
              {[
                { value: "attendance", label: "Attendance" },
                { value: "marks", label: "Marks" },
                { value: "lms", label: "LMS activity" },
              ].map((opt) => {
                const selected = recordType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setRecordType(opt.value as "attendance" | "marks" | "lms"); setTypeOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selected ? "bg-[#E5F3E8] text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="h-4 w-4 text-[#527A5B]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Earliest Run Time */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Earliest run time (India time IST)</label>
          <input className={inputClass} name="dueAt" type="datetime-local" required disabled={busy} />
        </div>
      </div>

      {/* CSV Columns Info Panel */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowColumns(!showColumns)}
          className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <span>View required CSV column names &amp; format</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showColumns ? "rotate-180" : ""}`} />
        </button>
        {showColumns && (
          <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 font-mono space-y-1.5 border-t border-slate-200 bg-white">
            <p><strong>Attendance:</strong> rollNo, subject, weekStart, attended, total</p>
            <p><strong>Marks:</strong> rollNo, subject, assessment, assessedOn, score, maxScore</p>
            <p><strong>LMS:</strong> rollNo, activityOn, events</p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">Date format must be YYYY-MM-DD.</p>
          </div>
        )}
      </div>

      {/* Custom File Upload Area */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">CSV batch file (under 100 KB)</label>
        <input
          key={inputKey}
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={chooseFile}
          aria-label="Upload CSV batch file"
          className="hidden"
        />

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 hover:border-[#527A5B] transition-all cursor-pointer group"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#527A5B] shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Click to browse CSV batch file</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Maximum 100 rows per batch upload</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#527A5B] shrink-0 border border-slate-200">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · Ready to schedule</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Button disabled={busy || !file} className={buttonClass}>
        {busy ? "Validating & scheduling..." : "Validate and schedule sync"}
      </Button>

      {message && <p role="status" className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{message}</p>}
    </form>
  );
}
