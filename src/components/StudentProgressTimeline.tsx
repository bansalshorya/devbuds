import { CheckCircle2, MessageSquare } from "lucide-react";
import { progressEvents, followUpStatus, type ProgressMeeting } from "@/lib/follow-ups";

const dateLabel = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function StudentProgressTimeline({ meetings }: { meetings: ProgressMeeting[] }) {
  const events = progressEvents(meetings);
  const actions = meetings.flatMap((meeting) => meeting.followUps);
  const completed = actions.filter((action) => action.completedAt).length;
  const now = new Date();
  return <section className="neumo-card space-y-5 p-5 sm:p-6" aria-label="Student progress timeline">
    <h2 className="text-base font-extrabold">Student progress timeline</h2>
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#EEF2EF] p-3 text-center">
      {[ [meetings.length, "Meetings"], [completed, "Actions completed"], [actions.length - completed, "Still open"] ].map(([count, label]) => <div key={label}><p className="text-xl font-extrabold text-[#42664A]">{count}</p><p className="text-xs text-[#5F6962]">{label}</p></div>)}
    </div>
    {!events.length ? <p className="text-sm text-[#5F6962]">Your timeline begins with the first saved mentoring conversation.</p> : <ol className="ml-2 border-l-2 border-[#DCE4DD] pl-5">
      {events.map((event) => <li key={event.id} className="relative pb-6 last:pb-0">
        <span className="absolute -left-8 top-0 rounded-full bg-[#F6F8F6] p-1 text-[#527A5B]">{event.kind === "meeting" ? <MessageSquare aria-hidden className="h-4 w-4" /> : <CheckCircle2 aria-hidden className="h-4 w-4" />}</span>
        <time dateTime={event.date.toISOString()} className="text-xs font-bold text-[#5F6962]">{dateLabel(event.date)}</time>
        {event.kind === "completed" && event.action ? <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3"><p className="text-sm font-bold text-emerald-900">Action completed</p><p className="mt-1 break-words text-sm">{event.action.action}</p><p className="mt-1 text-xs text-[#5F6962]">From meeting on {dateLabel(event.meeting.meetingDate)}</p></div> : <div className="mt-1 space-y-2 rounded-xl border border-[#DCE4DD] bg-[#EEF2EF] p-4">
          <p className="text-sm font-bold">Mentoring conversation · {event.meeting.language}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{event.meeting.summary}</p>
          {!!event.meeting.topics.length && <p className="break-words text-xs text-[#5F6962]">Topics: {event.meeting.topics.join(" · ")}</p>}
          {!!event.meeting.followUps.length && <ul className="space-y-2 border-t border-[#DCE4DD] pt-2">{event.meeting.followUps.map((action) => <li key={action.id} className="break-words text-sm"><p>{action.action}</p><p className={`mt-0.5 text-xs font-bold ${action.completedAt ? "text-emerald-800" : followUpStatus(action.dueDate, now).kind === "overdue" ? "text-red-800" : "text-amber-900"}`}>{action.completedAt ? `Completed ${dateLabel(action.completedAt)}` : `${followUpStatus(action.dueDate, now).label} · ${dateLabel(action.dueDate)}`}</p></li>)}</ul>}
        </div>}
      </li>)}
    </ol>}
  </section>;
}
