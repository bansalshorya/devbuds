import { describe, expect, it } from "vitest";
import { automationPeriods, dataQuality, repeatedConcerns, AutomationSettingsSchema, CheckInSchema } from "../src/lib/automations";
import { validateScheduledCsv } from "../src/server/automations/imports";

describe("automation periods", () => {
  it("uses India-local Monday and the previous calendar month across a year boundary", () => {
    const p = automationPeriods(new Date("2025-12-31T18:31:00Z"));
    expect(p.today.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(p.week.toISOString().slice(0, 10)).toBe("2025-12-29");
    expect(p.month).toBe("2025-12");
    expect(p.monthEnd.toISOString().slice(0, 10)).toBe("2026-01-01");
  });
  it("validates configurable thresholds and private check-ins", () => {
    expect(AutomationSettingsSchema.safeParse({ enabled: true, meetingGapDays: 1, escalationDays: 7, staleDataDays: 14 }).success).toBe(false);
    expect(CheckInSchema.safeParse({ progress: "Making progress", support: "", studentId: "another-student" }).success).toBe(false);
  });
});

describe("academic data quality", () => {
  const today = new Date("2026-10-30");
  it("treats missing data as missing, without inventing student performance", () => {
    expect(dataQuality({ id: "s", attendance: [], marks: [], lmsActivity: [] }, 14, today)).toEqual(["Attendance records are missing", "Assessment marks are missing", "LMS activity records are missing"]);
  });
  it("detects invalid values, duplicate source keys, and stale records", () => {
    const record = { subject: "Math", weekStart: new Date("2026-10-01"), attended: 20, total: 10 };
    const issues = dataQuality({ id: "s", attendance: [record, record], marks: [{ subject: "Math", assessment: "I", assessedOn: today, score: -1, maxScore: 50 }], lmsActivity: [{ activityOn: today, events: -1 }] }, 14, today);
    expect(issues).toContain("Attendance records are stale");
    expect(issues).toContain("Invalid attendance values"); expect(issues).toContain("Invalid assessment values"); expect(issues).toContain("Duplicate source records");
  });
});

describe("repeated-topic evidence", () => {
  it("keeps source meetings and Tamil/English text rather than inventing a risk score", () => {
    const meetings = [
      { id: "a", summary: "Attendance has improved", topics: [], meetingDate: new Date("2026-10-01") },
      { id: "b", summary: "வருகை குறித்து பேசினோம்", topics: [], meetingDate: new Date("2026-10-10") },
    ];
    expect(repeatedConcerns(meetings)).toEqual([{ label: "Attendance", meetings: [{ id: "a", date: "2026-10-01", excerpt: "Attendance has improved" }, { id: "b", date: "2026-10-10", excerpt: "வருகை குறித்து பேசினோம்" }] }]);
    expect(repeatedConcerns(meetings.slice(0, 1))).toEqual([]);
  });
});

describe("scheduled academic import validation", () => {
  it("rejects impossible values and duplicate source rows before scheduling", () => {
    const csv = "rollNo,subject,weekStart,attended,total\nR1,Math,2026-10-26,11,10\nR1,Math,2026-10-26,7,10";
    const errors = validateScheduledCsv(csv, "attendance");
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
    expect(errors.length).toBeGreaterThan(1);
  });
  it("accepts valid batches and bounds scheduled job size", () => {
    expect(validateScheduledCsv("rollNo,activityOn,events\nR1,2026-10-30,3", "lms")).toEqual([]);
    expect(validateScheduledCsv("x".repeat(100001), "lms")[0]).toContain("100 KB");
    expect(validateScheduledCsv("rollNo,activityOn,events\n" + Array.from({ length: 101 }, (_, i) => `R${i},2026-10-30,3`).join("\n"), "lms")[0]).toContain("100 rows");
  });
});
