import type { FollowUpRecord } from "../../lib/follow-ups";

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

// RFC 5545 lines fold at 75 UTF-8 octets, including for Tamil text.
function foldLine(line: string) {
  const lines: string[] = [];
  let current = "";
  let bytes = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character, "utf8");
    if (bytes + size > 75) { lines.push(current); current = " "; bytes = 1; }
    current += character;
    bytes += size;
  }
  return [...lines, current].join("\r\n");
}

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export function followUpCalendar(action: FollowUpRecord, now = new Date()) {
  const day = action.dueDate.toISOString().slice(0, 10);
  // A reminder at 9 AM India time on the deadline day; this is not a meeting time.
  const start = new Date(`${day}T09:00:00+05:30`);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DevBuds//Follow-up reminders//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:followup-${escapeText(action.id)}@devbuds`, `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 15 * 60000))}`,
    `SUMMARY:${escapeText(`Follow-up due: ${action.action}`)}`,
    `DESCRIPTION:${escapeText(`Mentoring action due ${day}: ${action.action}\nReminder at 9 AM India time. Check DevBuds for the latest completion status.`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(`Due tomorrow: ${action.action}`)}`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(`Due today: ${action.action}`)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}
