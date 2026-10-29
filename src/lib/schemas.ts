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

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MeetingSaveSchema = z.object({
  clientSubmissionId: z.string().min(8).max(100),
  studentId: z.string().min(1),
  meetingDate: dateOnly,
  language: z.enum(["English", "Tamil"]),
  summary: z.string().min(3).max(2000),
  topics: z.array(z.string().max(60)).max(10),
  actions: z
    .array(z.object({ action: z.string().min(3).max(300), dueDate: dateOnly }))
    .max(10),
});
export type MeetingSave = z.infer<typeof MeetingSaveSchema>;

// Used later by the voice and AI draft step.
export const NoteDraftSchema = z.object({
  summary: z.string(),
  topics: z.array(z.string()),
  actions: z.array(
    z.object({ action: z.string(), dueDate: dateOnly.nullable() })
  ),
});
export type NoteDraft = z.infer<typeof NoteDraftSchema>;