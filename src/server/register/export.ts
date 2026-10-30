import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, PageOrientation } from "docx";

export type RegisterMeeting = {
  meetingDate: Date;
  language: string;
  summary: string;
  topics: string[];
  mentor: { name: string };
  student: { rollNo: string; user: { name: string } };
  followUps: { action: string; dueDate: Date; completedAt: Date | null }[];
};

const columns = ["Meeting date", "Student / roll number", "Mentor", "Language / topics", "Meeting summary", "Agreed action", "Follow-up date", "Status"];
const date = (value: Date) => value.toISOString().slice(0, 10);

export function registerRows(meetings: RegisterMeeting[]): string[][] {
  return meetings.flatMap((meeting) => (meeting.followUps.length ? meeting.followUps : [null]).map((followUp) => [
    date(meeting.meetingDate),
    `${meeting.student.user.name}\n${meeting.student.rollNo}`,
    meeting.mentor.name,
    [meeting.language, ...meeting.topics].join("\n"),
    meeting.summary,
    followUp?.action ?? "—",
    followUp ? date(followUp.dueDate) : "—",
    followUp ? followUp.completedAt ? `Completed ${date(followUp.completedAt)}` : "Pending" : "No action",
  ]));
}

export async function createRegister(meetings: RegisterMeeting[], format: "xlsx" | "docx", period: string) {
  const rows = registerRows(meetings);
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DevBuds";
    const sheet = workbook.addWorksheet("Mentoring register", {
      views: [{ state: "frozen", ySplit: 4 }],
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:4" },
    });
    sheet.columns = [16, 25, 24, 24, 55, 45, 18, 24].map((width) => ({ width }));
    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = "Mentoring register — general template";
    sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF42664A" } };
    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `${period} • ${meetings.length} confirmed meetings • Adapt to your college's approved format`;
    sheet.addRow([]);
    const heading = sheet.addRow(columns);
    heading.font = { bold: true, color: { argb: "FFFFFFFF" } };
    heading.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF42664A" } };
    heading.height = 28;
    for (const values of rows) {
      const row = sheet.addRow(values);
      const lines = Math.max(...values.map((value, index) => value.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / ([16, 25, 24, 24, 55, 45, 18, 24][index] - 2))), 0)));
      row.height = Math.min(409, Math.max(50, lines * 16 + 12));
      row.alignment = { vertical: "top", wrapText: true };
      if (row.number % 2) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F5F1" } };
    }
    sheet.autoFilter = { from: "A4", to: `H${Math.max(4, sheet.rowCount)}` };
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
  const cell = (value: string, heading = false) => new TableCell({
    shading: heading ? { fill: "42664A" } : undefined,
    children: value.split("\n").map((line) => new Paragraph({
      children: [new TextRun({ text: line, bold: heading, color: heading ? "FFFFFF" : "242924", size: 18, font: "Noto Sans Tamil" })],
    })),
  });
  const document = new Document({
    creator: "DevBuds",
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 600, right: 600 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: "Mentoring register — general template", bold: true, size: 30 })] }),
        new Paragraph(`${period} • ${meetings.length} confirmed meetings`),
        new Paragraph("Adapt this general template to your college's approved register format."),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({ tableHeader: true, children: columns.map((name) => cell(name, true)) }),
            ...rows.map((row) => new TableRow({ children: row.map((value) => cell(value)) }))],
        }),
        ...(rows.length ? [] : [new Paragraph("No confirmed meetings in this period.")]),
      ],
    }],
  });
  return Packer.toBuffer(document);
}
