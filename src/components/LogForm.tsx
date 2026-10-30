"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { Mic, FileText, Calendar, CheckCircle2, AlertCircle, ChevronDown, Check } from "lucide-react";
import { VoiceDraftInput } from "@/components/VoiceDraftInput";
import { MeetingSaveSchema } from "@/lib/schemas";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function LogForm({ studentId, speechDemo = false, extractionDemo = false }: { studentId: string; speechDemo?: boolean; extractionDemo?: boolean }) {
  const router = useRouter();
  const idRef = useRef(makeId());
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState([{ action: "", dueDate: "" }]);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceKey, setVoiceKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (voiceBusy || status === "saving") return;
    setError("");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const parsed = MeetingSaveSchema.safeParse({ clientSubmissionId: idRef.current, studentId, meetingDate: today, language, summary, topics: [], actions });
    if (!parsed.success) { setError(parsed.error.issues[0].message); setStatus("error"); return; }
    setStatus("saving");
    try {
      const res = await fetch("/api/mentor/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save. Your text is still here, please try again.");
        setStatus("error");
        return;
      }
      setSummary("");
      setActions([{ action: "", dueDate: "" }]);
      setVoiceKey((previous) => previous + 1);
      idRef.current = makeId();
      setStatus("saved");
      router.refresh();
    } catch {
      setError("No connection. Your text is still here, please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-4">
      <div className="relative" ref={langRef}>
        <label id="output-language-label" className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-teal-700" /> Output language
        </label>
        <button
          type="button"
          aria-expanded={langOpen}
          aria-labelledby="output-language-label"
          disabled={voiceBusy || status === "saving"}
          onClick={() => setLangOpen(!langOpen)}
          className="mt-1 flex h-12 w-full items-center justify-between rounded-xl neumo-inset border border-slate-300 px-3.5 text-base font-semibold text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20 transition-all bg-[#e6edf4] disabled:opacity-60 cursor-pointer"
        >
          <span>{language}</span>
          <ChevronDown className={`h-4 w-4 text-slate-600 transition-transform ${langOpen ? "rotate-180" : ""}`} />
        </button>

        {langOpen && (
          <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-xl border border-slate-200 z-50 p-1.5 space-y-1 animate-fadeIn">
            {(["English", "Tamil"] as const).map((opt) => {
              const isSelected = language === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setLanguage(opt);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isSelected ? "bg-[#E5F3E8] text-slate-900 shadow-xs" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="h-4 w-4 text-teal-700" />}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-1.5 text-xs text-[#5F6962]">Speak in Tamil, English, or a mix. The transcript and generated draft will use the selected language. After changing it, transcribe again to update the transcript.</p>
      </div>

      <VoiceDraftInput key={voiceKey} studentId={studentId} language={language} disabled={status === "saving"}
        speechDemo={speechDemo} extractionDemo={extractionDemo} onBusyChange={setVoiceBusy}
        onDraft={(draft) => { setSummary(draft.summary); setActions(draft.actions.length ? draft.actions.map((item) => ({ action: item.action, dueDate: item.dueDate ?? "" })) : [{ action: "", dueDate: "" }]); setStatus("idle"); }} />

      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-teal-700" /> What Was Discussed
        </label>
        <textarea
          required
          maxLength={2000}
          disabled={voiceBusy || status === "saving"}
          rows={4}
          placeholder="Record notes from the mentoring conversation..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 block w-full rounded-xl neumo-inset border border-slate-300 p-3.5 text-base font-medium text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20 transition-all bg-[#e6edf4]"
        />
      </div>

      {actions.map((item, index) => <fieldset key={index} disabled={voiceBusy || status === "saving"} className="min-w-0 space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-teal-700" /> Agreed Action Item {actions.length > 1 ? index + 1 : ""}
        </label>
        <input
          required
          maxLength={300}
          placeholder="e.g. Complete assignment 3 by Friday"
          value={item.action}
          onChange={(e) => setActions((previous) => previous.map((row, i) => i === index ? { ...row, action: e.target.value } : row))}
          className="mt-1 block h-12 w-full rounded-xl neumo-inset border border-slate-300 px-3.5 text-base font-medium text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20 transition-all bg-[#e6edf4]"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-teal-700" /> Follow-up Target Date
        </label>
        <input
          required
          type="date"
          value={item.dueDate}
          onChange={(e) => setActions((previous) => previous.map((row, i) => i === index ? { ...row, dueDate: e.target.value } : row))}
          className="mt-1 block h-12 w-full rounded-xl neumo-inset border border-slate-300 px-3.5 text-base font-medium text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20 transition-all bg-[#e6edf4]"
        />
      </div>
      {actions.length > 1 && <button type="button" className="min-h-12 px-3 text-sm font-semibold text-red-800 cursor-pointer" onClick={() => setActions((previous) => previous.filter((_, i) => i !== index))}>Remove action {index + 1}</button>}
      </fieldset>)}

      <p className="text-xs text-[#5F6962]">Review and confirm the summary, agreed actions and dates. Only Save conversation creates the meeting record.</p>

      {status === "error" && (
        <div role="alert" className="rounded-xl bg-red-100 border border-red-300 p-3.5 text-sm font-bold text-red-800 flex items-center gap-2 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {status === "saved" && (
        <div role="status" className="rounded-xl bg-emerald-100 border border-emerald-300 p-3.5 text-sm font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Meeting recorded and saved successfully.
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <SmoothButton type="submit" disabled={voiceBusy || status === "saving"} className="h-12 flex-1 rounded-xl bg-[#527A5B] font-bold text-white shadow-md hover:bg-[#42664A] disabled:opacity-50 cursor-pointer">
          {status === "saving" ? "Saving conversation..." : "Save conversation"}
        </SmoothButton>
        <button
          type="button"
          disabled={voiceBusy || status === "saving"}
          onClick={() => { setSummary(""); setActions([{ action: "", dueDate: "" }]); setStatus("idle"); setError(""); }}
          className="h-12 px-5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
