import { kolkataDate } from "./weeks";

export type FollowUpRecord = {
  id: string;
  action: string;
  dueDate: Date;
  completedAt: Date | null;
};

export function followUpStatus(dueDate: Date, now = new Date()) {
  const days = Math.round((Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate()) - kolkataDate(now).getTime()) / 86400000);
  if (days < 0) return { kind: "overdue" as const, days, label: `${-days} day${days === -1 ? "" : "s"} overdue` };
  if (days === 0) return { kind: "today" as const, days, label: "Due today" };
  if (days === 1) return { kind: "soon" as const, days, label: "Due tomorrow" };
  return { kind: days <= 7 ? "soon" as const : "later" as const, days, label: `Due in ${days} days` };
}

export function upcomingReminders<T extends FollowUpRecord>(actions: T[], now = new Date()) {
  return actions.filter((action) => !action.completedAt && followUpStatus(action.dueDate, now).days <= 7)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.id.localeCompare(b.id));
}

export type ProgressMeeting = {
  id: string;
  meetingDate: Date;
  summary: string;
  language: string;
  topics: string[];
  followUps: FollowUpRecord[];
};

export function progressEvents(meetings: ProgressMeeting[]) {
  return meetings.flatMap((meeting) => [
    { id: `meeting-${meeting.id}`, date: meeting.meetingDate, kind: "meeting" as const, meeting, action: null },
    ...meeting.followUps.filter((action) => action.completedAt).map((action) => ({
      id: `complete-${action.id}`, date: action.completedAt!, kind: "completed" as const, meeting, action,
    })),
  ]).sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id));
}
