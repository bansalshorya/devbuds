import ExcelJS from "exceljs";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user || !["MENTOR", "HOD"].includes(user.role)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const coverage = await getCoverage(user.departmentId, 30, user.role === "MENTOR" ? user.id : undefined);
  const workbook = new ExcelJS.Workbook();
  const summary = workbook.addWorksheet("Coverage");
  summary.addRows([["Metric", "Value"], ["Period days", coverage.periodDays], ["Assigned students", coverage.assignedStudents], ["Students reached", coverage.studentsReached], ["Meetings logged", coverage.meetingsLogged], ["Pending follow-ups", coverage.pendingFollowUps], ["Students needing attention", coverage.studentsNeedingAttention], ["High priority students", coverage.highPriorityStudents]]);
  const subjects = workbook.addWorksheet("Subject performance");
  subjects.addRows([["Subject", "Attendance (%)", "Latest marks (%)"], ...coverage.subjects.map((row) => [row.subject, row.attendancePct, row.latestMarksPct])]);
  const months = workbook.addWorksheet("Monthly meetings");
  months.addRows([["Month", "Meetings", "Attendance (%)", "Marks (%)"], ...coverage.months.map((row) => [row.month, row.meetings, row.attendancePct, row.marksPct])]);
  for (const sheet of workbook.worksheets) {
    sheet.columns.forEach((column) => { column.width = 30; });
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }
  return new Response(new Uint8Array(await workbook.xlsx.writeBuffer()), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="mentoring-performance.xlsx"' } });
}
