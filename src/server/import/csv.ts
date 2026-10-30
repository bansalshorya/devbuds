import Papa from "papaparse";
import { prisma } from "@/server/db/client";
import {
  AttendanceCsvRowSchema,
  MarksCsvRowSchema,
  LmsCsvRowSchema,
  type AttendanceCsvRow,
  type MarksCsvRow,
  type LmsCsvRow,
} from "@/lib/schemas";

// ── Types ───────────────────────────────────────────────────────────

export type ImportType = "attendance" | "marks" | "lms";

interface RowError {
  row: number;
  message: string;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  errors: RowError[];
}

interface ImporterContext {
  /** The user performing the import. */
  userId: string;
  role: "MENTOR" | "HOD";
  departmentId: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function parseCsv(text: string): { data: Record<string, string>[]; error?: string } {
  if (!text.trim()) return { data: [], error: "File is empty" };

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  if (result.errors.length > 0) {
    return { data: [], error: `Malformed CSV: ${result.errors[0].message}` };
  }

  return { data: result.data };
}

/**
 * Build a rollNo → studentId map, filtered by the importer's permissions:
 *  - HOD: only students in the same department
 *  - MENTOR: only students assigned to them
 */
async function resolveStudents(
  rollNos: string[],
  ctx: ImporterContext
): Promise<Map<string, string>> {
  const unique = [...new Set(rollNos)];
  if (unique.length === 0) return new Map();

  if (ctx.role === "HOD") {
    const students = await prisma.student.findMany({
      where: { rollNo: { in: unique }, departmentId: ctx.departmentId },
      select: { id: true, rollNo: true },
    });
    return new Map(students.map((s) => [s.rollNo, s.id]));
  }

  // MENTOR — only assigned students
  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: ctx.userId, student: { rollNo: { in: unique } } },
    include: { student: { select: { id: true, rollNo: true } } },
  });
  return new Map(assignments.map((a) => [a.student.rollNo, a.student.id]));
}

// ── Import Runners ──────────────────────────────────────────────────

async function importAttendance(
  rows: Record<string, string>[],
  ctx: ImporterContext
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, errors: [] };

  // Validate all rows first
  const validated: { idx: number; data: AttendanceCsvRow }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const parsed = AttendanceCsvRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({ row: i + 2, message: parsed.error.issues[0].message });
    } else {
      validated.push({ idx: i, data: parsed.data });
    }
  }

  // Resolve students
  const studentMap = await resolveStudents(
    validated.map((v) => v.data.rollNo),
    ctx
  );

  for (const { idx, data } of validated) {
    const studentId = studentMap.get(data.rollNo);
    if (!studentId) {
      result.errors.push({ row: idx + 2, message: `Unknown or unauthorized roll number: ${data.rollNo}` });
      continue;
    }

    const weekStart = new Date(data.weekStart);
    const existing = await prisma.attendanceRecord.findUnique({
      where: { studentId_subject_weekStart: { studentId, subject: data.subject, weekStart } },
    });

    await prisma.attendanceRecord.upsert({
      where: { studentId_subject_weekStart: { studentId, subject: data.subject, weekStart } },
      create: { studentId, subject: data.subject, weekStart, attended: data.attended, total: data.total },
      update: { attended: data.attended, total: data.total },
    });

    if (existing) result.updated++;
    else result.inserted++;
  }

  return result;
}

async function importMarks(
  rows: Record<string, string>[],
  ctx: ImporterContext
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, errors: [] };

  const validated: { idx: number; data: MarksCsvRow }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const parsed = MarksCsvRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({ row: i + 2, message: parsed.error.issues[0].message });
    } else {
      validated.push({ idx: i, data: parsed.data });
    }
  }

  const studentMap = await resolveStudents(
    validated.map((v) => v.data.rollNo),
    ctx
  );

  for (const { idx, data } of validated) {
    const studentId = studentMap.get(data.rollNo);
    if (!studentId) {
      result.errors.push({ row: idx + 2, message: `Unknown or unauthorized roll number: ${data.rollNo}` });
      continue;
    }

    const assessedOn = new Date(data.assessedOn);
    const existing = await prisma.internalMark.findUnique({
      where: { studentId_subject_assessment: { studentId, subject: data.subject, assessment: data.assessment } },
    });

    await prisma.internalMark.upsert({
      where: { studentId_subject_assessment: { studentId, subject: data.subject, assessment: data.assessment } },
      create: { studentId, subject: data.subject, assessment: data.assessment, assessedOn, score: data.score, maxScore: data.maxScore },
      update: { assessedOn, score: data.score, maxScore: data.maxScore },
    });

    if (existing) result.updated++;
    else result.inserted++;
  }

  return result;
}

async function importLms(
  rows: Record<string, string>[],
  ctx: ImporterContext
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, errors: [] };

  const validated: { idx: number; data: LmsCsvRow }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const parsed = LmsCsvRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({ row: i + 2, message: parsed.error.issues[0].message });
    } else {
      validated.push({ idx: i, data: parsed.data });
    }
  }

  const studentMap = await resolveStudents(
    validated.map((v) => v.data.rollNo),
    ctx
  );

  for (const { idx, data } of validated) {
    const studentId = studentMap.get(data.rollNo);
    if (!studentId) {
      result.errors.push({ row: idx + 2, message: `Unknown or unauthorized roll number: ${data.rollNo}` });
      continue;
    }

    const activityOn = new Date(data.activityOn);
    const existing = await prisma.lmsActivity.findUnique({
      where: { studentId_activityOn: { studentId, activityOn } },
    });

    await prisma.lmsActivity.upsert({
      where: { studentId_activityOn: { studentId, activityOn } },
      create: { studentId, activityOn, events: data.events },
      update: { events: data.events },
    });

    if (existing) result.updated++;
    else result.inserted++;
  }

  return result;
}

// ── Public API ──────────────────────────────────────────────────────

const runners: Record<ImportType, (rows: Record<string, string>[], ctx: ImporterContext) => Promise<ImportResult>> = {
  attendance: importAttendance,
  marks: importMarks,
  lms: importLms,
};

export async function importCsv(
  csvText: string,
  type: ImportType,
  ctx: ImporterContext
): Promise<ImportResult> {
  const { data, error } = parseCsv(csvText);

  if (error) {
    return { inserted: 0, updated: 0, errors: [{ row: 0, message: error }] };
  }

  if (data.length === 0) {
    return { inserted: 0, updated: 0, errors: [{ row: 0, message: "CSV file has no data rows" }] };
  }
  if (data.length > 5000) return { inserted: 0, updated: 0, errors: [{ row: 0, message: "Import up to 5000 rows at a time" }] };

  return runners[type](data, ctx);
}
