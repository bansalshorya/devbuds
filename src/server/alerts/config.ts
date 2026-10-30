// All thresholds live here so faculty can help tune them.
export const ALERT_CONFIG = {
  lowAttendancePct: 75,
  criticalAttendancePct: 65,
  dropWindowWeeks: 3,
  dropPoints: 15,
  severeDropPoints: 25,
  marksDropPoints: 10,
  severeMarksDropPoints: 20,
  lmsInactiveDays: 14,
  lmsLongInactiveDays: 28,
  notMetWeeks: 5,
  longNotMetWeeks: 8,
};

export type AlertConfig = typeof ALERT_CONFIG;
