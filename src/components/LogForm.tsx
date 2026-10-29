"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { Mic, FileText, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function LogForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const idRef = useRef(makeId()); // same id on retry, so no duplicate meeting
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [summary, setSummary] = useState("");
  const [action, setAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    try {
      const res = await fetch("/api/mentor/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSubmissionId: idRef.current,
          studentId,
          meetingDate: today,
          language,
          summary,
          topics: [],
          actions: [{ action, dueDate }],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save. Your text is still here, please try again.");
        setStatus("error");
        return;
      }
      setSummary("");
      setAction("");
      setDueDate("");
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
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-teal-700" /> Language spoken
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "English" | "Tamil")}
          className="mt-1 block h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base font-medium text-slate-900 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20"
        >
          <option>English</option>
          <option>Tamil</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-teal-700" /> What was discussed
        </label>
        <textarea
          required
          rows={4}
          placeholder="Record notes from the mentoring conversation..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base font-normal text-slate-900 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-teal-700" /> Agreed action
        </label>
        <input
          required
          placeholder="e.g. Complete assignment 3 by Friday"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="mt-1 block h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-teal-700" /> Follow-up date
        </label>
        <input
          required
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-3 focus:ring-teal-700/20"
        />
      </div>

      {status === "error" && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm font-medium text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {status === "saved" && (
        <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-sm font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Conversation saved successfully!
        </div>
      )}

      <SmoothButton
        type="submit"
        disabled={status === "saving"}
        loading={status === "saving"}
        className="h-12 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-base font-semibold text-white shadow-md shadow-teal-700/20 transition-all mt-2"
      >
        {status === "saving" ? "Saving record..." : "Save conversation"}
      </SmoothButton>
    </form>
  );
}
