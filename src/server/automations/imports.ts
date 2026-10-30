import Papa from "papaparse";
import { AttendanceCsvRowSchema, MarksCsvRowSchema, LmsCsvRowSchema } from "@/lib/schemas";

export function validateScheduledCsv(csv: string, type: "attendance" | "marks" | "lms") {
  if (Buffer.byteLength(csv) > 100000) return ["Use a CSV under 100 KB for a scheduled batch."];
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: "greedy", transformHeader: (s) => s.trim(), transform: (s) => s.trim() });
  if (parsed.errors.length) return ["CSV is malformed. Check headers and quoting."];
  if (!parsed.data.length || parsed.data.length > 100) return ["Schedule between 1 and 100 rows per batch. Split larger files."];
  const schema = { attendance: AttendanceCsvRowSchema, marks: MarksCsvRowSchema, lms: LmsCsvRowSchema }[type];
  const seen = new Set<string>();
  const errors: string[] = [];
  parsed.data.forEach((row, i) => {
    const valid = schema.safeParse(row);
    if (!valid.success) errors.push(`Row ${i + 2}: ${valid.error.issues[0].message}`);
    const key = type === "attendance" ? [row.rollNo, row.subject, row.weekStart] : type === "marks" ? [row.rollNo, row.subject, row.assessment] : [row.rollNo, row.activityOn];
    const id = JSON.stringify(key);
    if (seen.has(id)) errors.push(`Row ${i + 2}: duplicate source key in this file.`);
    seen.add(id);
  });
  return errors.slice(0, 20);
}
