import { describe, it, expect } from "vitest";
import { evaluateStudent, sortByAttention, type StudentSignals } from "../src/server/alerts/engine";

const today = new Date("2026-10-29T00:00:00Z");

const healthy: StudentSignals = {
  studentId: "s1",
  name: "Test Student",
  attendance: [],
  marks: [],
  lmsDates: [],
  meetings: [{ meetingDate: new Date("2026-10-20T00:00:00Z") }],
  followUps: [],
};

describe("alert rules", () => {
  it("raises no alert for a healthy student", () => {
    expect(evaluateStudent(healthy, today)).toEqual([]);
  });

  it("flags low attendance with the subjects as evidence", () => {
    const s = {
      ...healthy,
      attendance: [
        { subject: "DBMS", weekStart: new Date("2026-10-26T00:00:00Z"), attended: 6, total: 10 },
        { subject: "Maths", weekStart: new Date("2026-10-26T00:00:00Z"), attended: 9, total: 10 },
      ],
    };
    const alerts = evaluateStudent(s, today);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].ruleId).toBe("low-attendance");
    expect(alerts[0].evidence).toEqual(["DBMS: 60%"]);
  });

  it("flags an overdue follow-up and ignores a completed one", () => {
    const due = new Date("2026-10-20T00:00:00Z");
    const open = { ...healthy, followUps: [{ id: "f1", action: "Submit assignment", dueDate: due, completedAt: null }] };
    const done = { ...healthy, followUps: [{ id: "f1", action: "Submit assignment", dueDate: due, completedAt: new Date() }] };
    expect(evaluateStudent(open, today)[0].reason).toContain("9 days overdue");
    expect(evaluateStudent(done, today)).toEqual([]);
  });

  it("does not treat missing LMS data as inactivity", () => {
    expect(evaluateStudent(healthy, today).some((a) => a.ruleId === "lms-inactive")).toBe(false);
  });
  it("compares two three-week attendance windows and explains the drop", () => {
    const attendance = Array.from({ length: 6 }, (_, i) => ({ subject: "Maths", weekStart: new Date(Date.UTC(2026, 8, 14 + i * 7)), attended: i < 3 ? 9 : 6, total: 10 }));
    const alert = evaluateStudent({ ...healthy, attendance }, today).find((item) => item.ruleId === "attendance-drop");
    expect(alert?.reason).toContain("90% to 60%"); expect(alert?.severity).toBe("high"); expect(alert?.evidence).toHaveLength(2);
  });
  it("compares marks on different maximum-score scales", () => {
    const marks = [{ subject: "Maths", assessment: "T1", assessedOn: new Date("2026-10-01"), score: 40, maxScore: 50 }, { subject: "Maths", assessment: "T2", assessedOn: new Date("2026-10-20"), score: 60, maxScore: 100 }];
    const alert = evaluateStudent({ ...healthy, marks }, today).find((item) => item.ruleId === "marks-decline");
    expect(alert?.reason).toContain("20 points"); expect(alert?.severity).toBe("high");
  });
  it("raises inactivity at fourteen days but not thirteen", () => {
    expect(evaluateStudent({ ...healthy, lmsDates: [new Date("2026-10-15")] }, today).some((item) => item.ruleId === "lms-inactive")).toBe(true);
    expect(evaluateStudent({ ...healthy, lmsDates: [new Date("2026-10-16")] }, today).some((item) => item.ruleId === "lms-inactive")).toBe(false);
  });
  it("explains students never met and meetings at least five weeks ago", () => {
    expect(evaluateStudent({ ...healthy, meetings: [] }, today)[0].reason).toBe("No meeting logged yet");
    expect(evaluateStudent({ ...healthy, meetings: [{ meetingDate: new Date("2026-09-24") }] }, today)[0].reason).toBe("Not met in 5 weeks");
  });
  it("orders by severity then evidence recency without mutating the source", () => {
    const older = { name: "Older", alerts: [{ ruleId: "a", severity: "high" as const, reason: "Evidence", evidence: ["Fact"], observedAt: "2026-10-01" }] };
    const newer = { ...older, name: "Newer", alerts: [{ ...older.alerts[0], observedAt: "2026-10-20" }] };
    const lower = { ...older, name: "Lower", alerts: [{ ...older.alerts[0], severity: "low" as const, observedAt: "2026-10-29" }] };
    const input = [lower, older, newer];
    expect(sortByAttention(input).map((item) => item.name)).toEqual(["Newer", "Older", "Lower"]);
    expect(input[0].name).toBe("Lower");
  });
});
