import Link from "next/link";
import { Bell, CalendarPlus } from "lucide-react";
import { followUpStatus, upcomingReminders, type FollowUpRecord } from "@/lib/follow-ups";
import { formatDate } from "@/lib/dates";
import { CompleteFollowUpButton } from "./CompleteFollowUpButton";
import { ReminderRefresh } from "./ReminderRefresh";

export function CalendarReminderLink({ id }: { id: string }) {
  return <a href={`/api/follow-ups/${encodeURIComponent(id)}/calendar`} download className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#42664A] underline underline-offset-4">
    <CalendarPlus aria-hidden className="h-4 w-4" /> Add to calendar
  </a>;
}

type Reminder = FollowUpRecord & { studentName?: string; studentId?: string };

export function FollowUpReminders({ actions }: { actions: Reminder[] }) {
  const now = new Date();
  const reminders = upcomingReminders(actions, now);
  const overdue = reminders.filter((action) => followUpStatus(action.dueDate, now).kind === "overdue").length;
  return <section className="neumo-card space-y-4 p-5 sm:p-6" aria-label="Follow-up reminders">
    <ReminderRefresh />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-extrabold"><Bell aria-hidden className="h-5 w-5 text-[#527A5B]" /> Follow-up reminders</h2>
      <span className="text-xs font-bold text-[#5F6962]">{overdue} overdue · {reminders.length - overdue} due within 7 days</span>
    </div>
    {reminders.length === 0 ? <p className="text-sm text-[#5F6962]">No overdue actions or deadlines in the next seven days.</p> : <ul className="space-y-3">
      {reminders.map((action) => {
        const status = followUpStatus(action.dueDate, now);
        return <li key={action.id} className={`rounded-xl border p-4 ${status.kind === "overdue" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/40"}`}>
          {action.studentName && action.studentId && <Link href={`/mentor/students/${action.studentId}`} className="text-sm font-bold text-[#42664A] underline underline-offset-4">{action.studentName}</Link>}
          <p className="mt-1 break-words text-sm font-bold">{action.action}</p>
          <p className={`mt-1 text-xs font-bold ${status.kind === "overdue" ? "text-red-800" : "text-amber-900"}`}>{status.label} · {formatDate(action.dueDate)}</p>
          <div className="flex flex-wrap items-center gap-x-4"><CompleteFollowUpButton id={action.id} action={action.action} /><CalendarReminderLink id={action.id} /></div>
        </li>;
      })}
    </ul>}
    <p className="text-xs leading-relaxed text-[#5F6962]">In-app reminders update while this page is open. Calendar reminders are set for 9 AM India time on the due date, with alerts one day before and when due. Import the file into your calendar and enable its notifications. Imported events do not sync with DevBuds; remove them if the action is completed or changed.</p>
  </section>;
}
