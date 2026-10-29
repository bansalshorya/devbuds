"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { Mic, FileText, Calendar, CheckCircle2, AlertCircle, Square, WandSparkles } from "lucide-react";

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
  const [mockState, setMockState] = useState<"idle" | "recording" | "processing" | "draft">("idle");
  const [mockTranscript, setMockTranscript] = useState("");

  function mockContent() {
    if (language === "Tamil") {
      return {
        transcript: "DBMS வருகைப்பதிவு மற்றும் வரவிருக்கும் உள்ளகத் தேர்வு பற்றி பேசினோம். நிலுவையில் உள்ள பணியை முடித்து அடுத்த வார திருத்த வகுப்பில் கலந்து கொள்வதாக மாணவர் ஒப்புக்கொண்டார்.",
        summary: "DBMS வருகைப்பதிவு, நிலுவைப் பணி மற்றும் உள்ளகத் தேர்வுக்கான தயாரிப்பு குறித்து பேசப்பட்டது.",
        action: "நிலுவையில் உள்ள DBMS பணியை முடித்து திருத்த வகுப்பில் கலந்துகொள்ள வேண்டும்",
      };
    }
    return {
      transcript: "We discussed DBMS attendance and the upcoming internal assessment. The student agreed to complete the pending assignment and attend the remedial class next week.",
      summary: "Discussed DBMS attendance, the pending assignment and preparation for the upcoming internal assessment.",
      action: "Complete the pending DBMS assignment and attend the remedial class",
    };
  }

  async function handleMockRecording() {
    if (mockState !== "recording") {
      setMockTranscript("");
      setMockState("recording");
      return;
    }

    setMockState("processing");
    await new Promise((resolve) => setTimeout(resolve, 700));
    const draft = mockContent();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setMockTranscript(draft.transcript);
    setSummary(draft.summary);
    setAction(draft.action);
    setDueDate(nextWeek.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
    setMockState("draft");
  }

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
      setMockState("idle");
      setMockTranscript("");
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
          onChange={(e) => {
            setLanguage(e.target.value as "English" | "Tamil");
            setMockState("idle");
            setMockTranscript("");
          }}
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

      <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
              <Mic className="h-4 w-4 text-teal-700" /> Mock voice demo
            </p>
            <p className="mt-1 text-xs font-semibold text-teal-900">Demo only — no microphone audio is captured or sent.</p>
          </div>
          <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-800">Mock STT</span>
        </div>

        <button
          type="button"
          onClick={handleMockRecording}
          disabled={mockState === "processing"}
          className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition disabled:opacity-60 ${mockState === "recording" ? "bg-red-600 hover:bg-red-700" : "bg-teal-700 hover:bg-teal-800"}`}
        >
          {mockState === "recording" ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
          {mockState === "recording" ? "Stop mock recording" : mockState === "processing" ? "Creating mock transcript..." : "Record mock voice note"}
        </button>

        {mockState === "recording" ? (
          <p role="status" className="flex items-center justify-center gap-2 text-sm font-bold text-red-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" /> Mock recording in progress
          </p>
        ) : null}

        {mockTranscript ? (
          <div className="space-y-2 rounded-xl border border-teal-200 bg-white p-3.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">Mock transcript — not real speech-to-text</p>
            <p lang={language === "Tamil" ? "ta" : "en"} className="text-sm leading-relaxed text-slate-700">{mockTranscript}</p>
            <p className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs font-bold text-emerald-700">
              <WandSparkles className="h-3.5 w-3.5" /> Editable draft filled into the form above. Review it before saving.
            </p>
          </div>
        ) : null}
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
