import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { createRegister, registerRows, type RegisterMeeting } from "../src/server/register/export";

const meetings: RegisterMeeting[] = [{
  meetingDate: new Date("2026-10-30"), language: "Tamil", summary: "வருகை குறித்து பேசினோம்.", topics: ["Attendance"],
  mentor: { name: "Dr. Meena" }, student: { rollNo: "CS001", user: { name: "கண்ணன்" } },
  followUps: [
    { action: "Submit assignment", dueDate: new Date("2026-11-01"), completedAt: null },
    { action: "Meet tutor", dueDate: new Date("2026-11-02"), completedAt: new Date("2026-10-31T10:00:00Z") },
  ],
}];

describe("mentoring register exports", () => {
  it("includes every action, its due date and completion status", () => {
    const rows = registerRows(meetings);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Pending");
    expect(rows[1]).toContain("Completed 2026-10-31");
    expect(rows[0]).toContain("கண்ணன்\nCS001");
    expect(rows[1]).toContain("2026-11-02");
  });
  it("keeps older meetings without actions", () => {
    expect(registerRows([{ ...meetings[0], followUps: [] }])[0]).toContain("No action");
  });
  it("writes an Excel workbook that preserves Tamil and text that resembles formulas", async () => {
    const buffer = await createRegister([{ ...meetings[0], summary: "=HYPERLINK(\"test\")" }], "xlsx", "All dates");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(buffer).buffer);
    const sheet = workbook.getWorksheet("Mentoring register")!;
    expect(sheet.getCell("B5").value).toBe("கண்ணன்\nCS001");
    expect(sheet.getCell("E5").value).toBe('=HYPERLINK("test")');
    expect(sheet.getCell("H6").value).toBe("Completed 2026-10-31");
    expect(sheet.pageSetup.orientation).toBe("landscape");
  });
  it.each(["xlsx", "docx"] as const)("creates a nonempty %s document even for an empty period", async (format) => {
    const buffer = await createRegister([], format, "2026-10-30 to 2026-10-30");
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
