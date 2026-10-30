import { describe, expect, it } from "vitest";
import { followUpStatus, upcomingReminders, progressEvents, type ProgressMeeting } from "../src/lib/follow-ups";
import { followUpCalendar } from "../src/server/follow-ups/calendar";
import { analyzeAudio } from "../src/lib/audio-quality";

const now = new Date("2026-10-30T10:00:00Z");
const action = (id: string, due: string, completedAt: Date | null = null) => ({ id, action: "Submit assignment", dueDate: new Date(due), completedAt });

describe("follow-up reminders", () => {
  it("uses the India calendar day at midnight rather than elapsed hours", () => {
    expect(followUpStatus(new Date("2026-10-30"), new Date("2026-10-29T18:29:59Z")).label).toBe("Due tomorrow");
    expect(followUpStatus(new Date("2026-10-30"), new Date("2026-10-29T18:30:00Z")).label).toBe("Due today");
    expect(followUpStatus(new Date("2026-10-29"), now).label).toBe("1 day overdue");
  });
  it("includes overdue and seven-day deadlines, excludes completed and distant actions, and sorts oldest first", () => {
    expect(upcomingReminders([
      action("week", "2026-11-06"), action("far", "2026-11-07"), action("done", "2026-10-01", now), action("today", "2026-10-30"), action("late", "2026-10-28"),
    ], now).map((a) => a.id)).toEqual(["late", "today", "week"]);
  });
});

describe("calendar reminders", () => {
  it("uses 9 AM India time and includes alerts one day before and when due", () => {
    const calendar = followUpCalendar(action("f1", "2026-11-01"), now);
    expect(calendar).toContain("DTSTART:20261101T033000Z\r\n");
    expect(calendar).toContain("DTEND:20261101T034500Z\r\n");
    expect(calendar).toContain("TRIGGER:-P1D"); expect(calendar).toContain("TRIGGER:PT0M");
    expect(calendar).toContain("UID:followup-f1@devbuds");
  });
  it("escapes calendar content injection and folds Tamil text at UTF-8 boundaries", () => {
    const calendar = followUpCalendar({ ...action("f1", "2026-11-01"), action: "நாளை பணியைச் சமர்ப்பிக்கவும்; notes, more\\text\r\nEND:VEVENT\r\nBEGIN:VEVENT".repeat(3) }, now);
    expect(calendar.match(/^BEGIN:VEVENT$/gm)).toHaveLength(1);
    expect(calendar).not.toContain("\ufffd");
    expect(calendar.split("\r\n").every((line) => Buffer.byteLength(line) <= 75)).toBe(true);
    const unfolded = calendar.replace(/\r\n /g, "");
    expect(unfolded).toContain("\\; notes\\, more\\\\text\\nEND:VEVENT");
  });
});

describe("student progress", () => {
  it("keeps historical completed actions and places completion events above earlier meetings", () => {
    const meetings: ProgressMeeting[] = [{ id: "m1", meetingDate: new Date("2026-10-28"), summary: "Discussed work", language: "English", topics: [], followUps: [action("done", "2026-10-30", now), action("pending", "2026-11-01")] }];
    const events = progressEvents(meetings);
    expect(events.map((e) => e.id)).toEqual(["complete-done", "meeting-m1"]);
    expect(events[1].meeting.followUps).toHaveLength(2);
    expect(progressEvents([])).toEqual([]);
  });
});

describe("local audio quality checks", () => {
  const sampleRate = 16000;
  const sine = (amplitude: number, duration = 2) => Float32Array.from({ length: duration * sampleRate }, (_, i) => amplitude * Math.sin(2 * Math.PI * 200 * i / sampleRate));
  it("warns for silence, low volume, clipping and short recordings", () => {
    expect(analyzeAudio([new Float32Array(32000)], sampleRate).warnings.join()).toContain("no sound");
    expect(analyzeAudio([sine(0.005)], sampleRate).warnings.join()).toContain("volume is low");
    expect(analyzeAudio([new Float32Array(32000).fill(1)], sampleRate).warnings.join()).toContain("distorted");
    expect(analyzeAudio([sine(0.2, 0.5)], sampleRate).warnings.join()).toContain("under one second");
  });
  it("accepts ordinary signal levels and audio present on only one stereo channel", () => {
    expect(analyzeAudio([sine(0.2)], sampleRate).warnings).toEqual([]);
    expect(analyzeAudio([new Float32Array(32000), sine(0.2)], sampleRate).warnings).toEqual([]);
  });
  it("handles missing or empty audio safely", () => {
    expect(analyzeAudio([], sampleRate).warnings.join()).toContain("empty");
    expect(analyzeAudio([new Float32Array()], sampleRate).duration).toBe(0);
  });
});
