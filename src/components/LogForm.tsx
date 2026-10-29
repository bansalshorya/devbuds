"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SmoothButton from "@/components/ui/smoothui/smooth-button";

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
    <form onSubmit={onSubmit} className="mt-2 space-y-4">
      <label className="block text-base text-gray-900">
        Language spoken
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "English" | "Tamil")}
          className="mt-1 block h-12 w-full rounded border border-gray-300 bg-white px-3 text-base"
        >
          <option>English</option>
          <option>Tamil</option>
        </select>
      </label>
      <label className="block text-base text-gray-900">
        What was discussed
        <textarea
          required
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 p-3 text-base"
        />
      </label>
      <label className="block text-base text-gray-900">
        Agreed action
        <input
          required
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="mt-1 block h-12 w-full rounded border border-gray-300 px-3 text-base"
        />
      </label>
      <label className="block text-base text-gray-900">
        Follow-up date
        <input
          required
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block h-12 w-full rounded border border-gray-300 px-3 text-base"
        />
      </label>
      {status === "error" && <p role="alert" className="text-base text-red-700">{error}</p>}
      {status === "saved" && <p role="status" className="text-base text-green-700">Saved.</p>}
      <SmoothButton
        disabled={status === "saving"}
        loading={status === "saving"}
        className="h-12 w-full rounded bg-teal-700 hover:bg-teal-800 text-base font-medium text-white disabled:opacity-60"
      >
        Save conversation
      </SmoothButton>
    </form>
  );
}