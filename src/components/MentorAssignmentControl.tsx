"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type FacultyOption = { id: string; name: string };

export function MentorAssignmentControl({
  studentUserId,
  studentName,
  faculty,
  currentMentorId,
}: {
  studentUserId: string;
  studentName: string;
  faculty: FacultyOption[];
  currentMentorId: string | null;
}) {
  const router = useRouter();
  const [selectedMentorId, setSelectedMentorId] = useState(currentMentorId ?? "");
  const [savedMentorId, setSavedMentorId] = useState(currentMentorId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveAssignment() {
    if (!selectedMentorId) {
      const confirmed = window.confirm(`Leave ${studentName} without an assigned teacher?`);
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/department/students/${studentUserId}/mentor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: selectedMentorId || null }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not update the assigned teacher");

      setSavedMentorId(selectedMentorId);
      setMessage("Assignment updated");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the assigned teacher");
    } finally {
      setSaving(false);
    }
  }

  const changed = selectedMentorId !== savedMentorId;

  return (
    <div className="min-w-64 space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor={`mentor-${studentUserId}`}>
        Assigned teacher
      </label>
      <div className="flex gap-2">
        <select
          id={`mentor-${studentUserId}`}
          value={selectedMentorId}
          onChange={(event) => {
            setSelectedMentorId(event.target.value);
            setMessage("");
            setError("");
          }}
          disabled={saving}
          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-600/20 disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {faculty.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <Button
          type="button"
          size="lg"
          onClick={saveAssignment}
          disabled={!changed || saving}
          className="h-10 rounded-xl px-3 font-bold"
          aria-label={`Save teacher assignment for ${studentName}`}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving" : "Save"}
        </Button>
      </div>
      {message ? <p role="status" className="text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p role="alert" className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
