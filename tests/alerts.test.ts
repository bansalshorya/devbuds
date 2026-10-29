import { describe, it, expect } from "vitest";
import { evaluateStudent, type StudentSignals } from "../src/server/alerts/engine";

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
});