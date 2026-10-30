"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowUpActionCard({
  id,
  studentId,
  studentName,
  studentRollNo,
  action,
  dueLabel,
  overdue,
}: {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  action: string;
  dueLabel: string;
  overdue: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function complete() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/mentor/follow-ups/${id}/complete`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not complete this action");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete this action");
      setSaving(false);
    }
  }

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-xs ${overdue ? "border-red-200" : "border-amber-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link href={`/mentor/students/${studentId}`} className="text-xs font-bold text-slate-700 hover:text-teal-800">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {studentName} ({studentRollNo})</span>
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${overdue ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
          <Calendar className="h-3.5 w-3.5" /> {dueLabel}
        </span>
      </div>
      <p className="mt-3 text-base font-semibold leading-snug text-slate-900">{action}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/mentor/students/${studentId}`} className="text-xs font-bold text-teal-700 hover:text-teal-900">Open student profile</Link>
        <Button type="button" size="lg" onClick={complete} disabled={saving} className="h-10 rounded-xl bg-emerald-700 px-3 font-bold hover:bg-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {saving ? "Completing..." : "Mark complete"}
        </Button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
    </li>
  );
}
