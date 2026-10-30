import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { followUpStatus, type FollowUpRecord, type ProgressMeeting } from "@/lib/follow-ups";

export function MeetingPreparationCard({ meetings, actions, concerns, weeklyAttendance, checkIn }: {
  meetings: ProgressMeeting[]; actions: FollowUpRecord[]; concerns: string[]; weeklyAttendance: number[];
  checkIn?: { progress: string; support: string; weekStart: Date } | null;
}) {
  const latest = [...meetings].sort((a, b) => b.meetingDate.getTime() - a.meetingDate.getTime())[0];
  const pending = actions.filter((action) => !action.completedAt).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const now = new Date();
  const attendance = weeklyAttendance.at(-1);
  const previous = weeklyAttendance.at(-2);
  return <section className="neumo-card space-y-4 border-[#527A5B]/30 bg-[#E5F3E8]/40 p-5 sm:p-6" aria-label="Meeting preparation">
    <div><h2 className="flex items-center gap-2 text-base font-extrabold"><ClipboardList aria-hidden className="h-5 w-5 text-[#527A5B]" /> Prepare for this meeting</h2><p className="mt-1 text-xs text-[#5F6962]">Based on saved conversations, current actions, and academic records.</p></div>
    <div><h3 className="text-sm font-bold">Last conversation{latest ? ` · ${formatDate(latest.meetingDate)}` : ""}</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{latest?.summary ?? "No previous meeting yet. Start by asking how the student is settling in and what support they need."}</p></div>
    {checkIn && <div className="rounded-xl border border-[#DCE4DD] bg-white/70 p-3"><h3 className="text-sm font-bold">Student check-in · Week of {formatDate(checkIn.weekStart)}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{checkIn.progress}</p>{checkIn.support && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>Support requested:</strong> {checkIn.support}</p>}</div>}
    <div><h3 className="text-sm font-bold">Commitments to revisit ({pending.length})</h3>{pending.length ? <ul className="mt-2 space-y-2">{pending.map((action) => <li key={action.id} className="rounded-lg border border-[#DCE4DD] bg-white/70 p-3"><p className="break-words text-sm">{action.action}</p><p className="mt-1 text-xs font-bold text-amber-900">{followUpStatus(action.dueDate, now).label} · {formatDate(action.dueDate)}</p></li>)}</ul> : <p className="mt-1 text-sm text-[#5F6962]">No unfinished commitments. Ask what has improved and agree on the next goal.</p>}</div>
    <div><h3 className="text-sm font-bold">Suggested discussion points</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      {concerns.map((reason) => <li key={reason} className="break-words">Discuss: {reason}</li>)}
      {attendance !== undefined && <li>Latest recorded weekly attendance: {attendance}%{previous !== undefined ? ` (${attendance > previous ? "+" : ""}${attendance - previous} percentage points from the previous recorded week)` : ""}.</li>}
      {!concerns.length && attendance === undefined && <li>Ask about academic progress, wellbeing, and any support needed.</li>}
      <li>Confirm what the student will do next and agree on a realistic follow-up date.</li>
    </ul></div>
    <a href="#log-conversation" className="inline-flex min-h-11 items-center text-sm font-bold text-[#42664A] underline underline-offset-4">Start meeting notes</a>
  </section>;
}
