import { z } from "zod";
import { ALERT_CONFIG } from "../server/alerts/config";

export const ThresholdSchema = z.object({
  lowAttendancePct: z.number().int().min(1).max(100),
  criticalAttendancePct: z.number().int().min(1).max(100),
  dropWindowWeeks: z.number().int().min(1).max(12),
  dropPoints: z.number().int().min(1).max(100),
  severeDropPoints: z.number().int().min(1).max(100),
  marksDropPoints: z.number().int().min(1).max(100),
  severeMarksDropPoints: z.number().int().min(1).max(100),
  lmsInactiveDays: z.number().int().min(1).max(365),
  lmsLongInactiveDays: z.number().int().min(1).max(365),
  notMetWeeks: z.number().int().min(1).max(52),
  longNotMetWeeks: z.number().int().min(1).max(52),
}).strict().refine((value) => value.criticalAttendancePct <= value.lowAttendancePct
  && value.severeDropPoints >= value.dropPoints && value.severeMarksDropPoints >= value.marksDropPoints
  && value.lmsLongInactiveDays >= value.lmsInactiveDays && value.longNotMetWeeks >= value.notMetWeeks,
{ message: "Severe thresholds must be at least as strict as warning thresholds." });

export function configuredThresholds(value: unknown) {
  const parsed = ThresholdSchema.safeParse(value);
  return parsed.success ? parsed.data : { ...ALERT_CONFIG };
}

export const thresholdLabels: Record<keyof typeof ALERT_CONFIG, string> = {
  lowAttendancePct: "Low attendance (%)", criticalAttendancePct: "Critical attendance (%)",
  dropWindowWeeks: "Attendance comparison window (weeks)", dropPoints: "Attendance drop (percentage points)",
  severeDropPoints: "Severe attendance drop (points)", marksDropPoints: "Marks decline (percentage points)",
  severeMarksDropPoints: "Severe marks decline (points)", lmsInactiveDays: "LMS inactivity (days)",
  lmsLongInactiveDays: "Long LMS inactivity (days)", notMetWeeks: "Meeting gap (weeks)", longNotMetWeeks: "Long meeting gap (weeks)",
};
