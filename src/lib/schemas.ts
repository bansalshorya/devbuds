import { z } from "zod";

export const SeveritySchema = z.enum(["high", "medium", "low"]);

export const AlertResultSchema = z.object({
  ruleId: z.string(),
  severity: SeveritySchema,
  reason: z.string(),
  evidence: z.array(z.string()),
  observedAt: z.string(),
});
export type AlertResult = z.infer<typeof AlertResultSchema>;

export const LoginSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Enter a 10 digit mobile number"),
  otp: z.string().min(4).max(8),
});

export const MentorAssignmentSchema = z.object({
  mentorId: z.string().min(1).nullable(),
});

export const FacultyCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().regex(/^\d{10}$/),
});

export const DepartmentCsvImportSchema = z.object({
  csv: z.string().min(1).max(500_000),
});

export const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  "Enter a valid calendar date",
);
const dateOnly = DateOnlySchema;

export const MeetingSaveSchema = z.object({
  clientSubmissionId: z.string().min(8).max(100),
  studentId: z.string().min(1),
  meetingDate: dateOnly,
  language: z.enum(["English", "Tamil"]),
  summary: z.string().trim().min(3).max(2000),
  topics: z.array(z.string().trim().min(1).max(60)).max(10),
  actions: z
    .array(z.object({ action: z.string().trim().min(3).max(300), dueDate: dateOnly }))
    .min(1).max(10),
}).refine((meeting) => meeting.actions.every((action) => action.dueDate >= meeting.meetingDate), {
  message: "Follow-up dates must be on or after the meeting date",
  path: ["actions"],
});
export type MeetingSave = z.infer<typeof MeetingSaveSchema>;

// An AI draft is never a saved meeting. Missing dates require mentor confirmation.
export const NoteDraftSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  topics: z.array(z.string().trim().min(1).max(60)).max(10),
  actions: z.array(
    z.object({ action: z.string().trim().min(3).max(300), dueDate: dateOnly.nullable() })
  ).max(10),
});
export type NoteDraft = z.infer<typeof NoteDraftSchema>;

export const DraftRequestSchema = z.object({
  studentId: z.string().min(1),
  meetingDate: dateOnly,
  language: z.enum(["English", "Tamil"]),
  transcript: z.string().trim().min(3).max(10000),
});

export const RegisterQuerySchema = z.object({
  format: z.enum(["xlsx", "docx"]),
  studentId: z.string().min(1).optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).refine((query) => !query.from || !query.to || query.from <= query.to, {
  message: "Start date must be on or before end date",
});

// ── CSV Import Schemas ──────────────────────────────────────────────

const csvDate = DateOnlySchema;

export const AttendanceCsvRowSchema = z.object({
  rollNo: z.string().min(1, "rollNo is required"),
  subject: z.string().min(1, "subject is required"),
  weekStart: csvDate,
  attended: z.coerce.number().int().nonnegative(),
  total: z.coerce.number().int().positive("total must be > 0"),
}).refine((row) => row.attended <= row.total, { message: "Attended classes cannot exceed total classes", path: ["attended"] });
export type AttendanceCsvRow = z.infer<typeof AttendanceCsvRowSchema>;

export const MarksCsvRowSchema = z.object({
  rollNo: z.string().min(1, "rollNo is required"),
  subject: z.string().min(1, "subject is required"),
  assessment: z.string().min(1, "assessment is required"),
  assessedOn: csvDate,
  score: z.coerce.number().nonnegative(),
  maxScore: z.coerce.number().positive("maxScore must be > 0"),
}).refine((row) => row.score <= row.maxScore, { message: "Score cannot exceed maximum score", path: ["score"] });
export type MarksCsvRow = z.infer<typeof MarksCsvRowSchema>;

export const LmsCsvRowSchema = z.object({
  rollNo: z.string().min(1, "rollNo is required"),
  activityOn: csvDate,
  events: z.coerce.number().int().nonnegative(),
});
export type LmsCsvRow = z.infer<typeof LmsCsvRowSchema>;

export const ImportTypeSchema = z.enum(["attendance", "marks", "lms"]);
