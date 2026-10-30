"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceNoteInput } from "@/components/VoiceNoteInput";
import { NoteDraftSchema, type NoteDraft } from "@/lib/schemas";

export function VoiceDraftInput({ studentId, language, disabled, speechDemo, extractionDemo, onDraft, onBusyChange }: {
  studentId: string; language: "English" | "Tamil"; disabled: boolean;
  speechDemo: boolean; extractionDemo: boolean;
  onDraft: (draft: NoteDraft) => void; onBusyChange: (busy: boolean) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = disabled || recordingBusy || drafting;

  async function createDraft() {
    if (busy) return;
    setDrafting(true); onBusyChange(true); setError(""); setNotice("");
    try {
      const meetingDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const response = await fetch("/api/mentor/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, language, meetingDate, transcript }), signal: AbortSignal.timeout(60000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create a draft. You can still fill the form below.");
      onDraft(NoteDraftSchema.parse(data.draft));
      setNotice(data.demo ? "Demo draft: the note was copied into the summary. Enter the agreed action and date yourself." : "Draft ready. Review the summary, every action and follow-up date below before saving.");
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The draft request timed out. Your transcript is still here; retry or fill the form manually.");
    } finally { setDrafting(false); onBusyChange(false); }
  }

  return <details className="rounded-xl border border-[#DCE4DD] bg-[#EEF2EF] p-3.5" open>
    <summary className="min-h-12 cursor-pointer text-sm font-bold text-[#242924]">Voice note · Tamil / English</summary>
    <div className="space-y-3">
      <VoiceNoteInput studentId={studentId} language={language} disabled={disabled || drafting} demo={speechDemo}
        onTranscript={(text) => { setTranscript(text); setError(""); setNotice(""); }}
        onBusyChange={(value) => { setRecordingBusy(value); onBusyChange(value); }} />
      <label className="block text-sm font-bold text-[#242924]">Transcript or typed recap
        <textarea rows={3} maxLength={10000} disabled={busy} value={transcript} onChange={(event) => setTranscript(event.target.value)}
          className="mt-1 block w-full rounded-xl neumo-inset border border-[#DCE4DD] p-3.5 text-base font-medium text-[#242924] focus:outline-none focus:ring-2 focus:ring-[#527A5B]/30" />
      </label>
      <p className="text-xs text-[#5F6962]">Transcribing replaces the text above with the recording in {language}. Creating a draft uses {language}, including for a typed recap.</p>
      {extractionDemo && <p className="text-sm text-amber-900">Demo extraction copies the text; live AI requires configuration.</p>}
      <Button type="button" disabled={busy || transcript.trim().length < 3} onClick={createDraft}
        className="h-12 rounded-xl bg-[#527A5B] px-4 font-bold text-white hover:bg-[#42664A]">{drafting ? "Creating draft…" : "Create editable draft"}</Button>
      <p className="text-xs text-[#5F6962]">Creating a draft replaces the summary and actions below. Nothing is saved yet. Unsaved notes stay in this tab only.</p>
      {notice && <p role="status" className="text-sm font-semibold text-[#42664A]">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  </details>;
}
