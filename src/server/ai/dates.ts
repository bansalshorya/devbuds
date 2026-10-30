import { DateOnlySchema } from "../../lib/schemas";

// Work with calendar dates in UTC: the input is already the Kolkata meeting date.
export function resolveFollowUpDate(phrase: string | null, meetingDate: string): string | null {
  if (!phrase || !DateOnlySchema.safeParse(meetingDate).success) return null;
  const text = phrase.trim().toLowerCase().replace(/[.,]$/, "");
  if (DateOnlySchema.safeParse(text).success) return text >= meetingDate ? text : null;
  const base = new Date(`${meetingDate}T00:00:00Z`);
  let days: number | undefined;
  if (["today", "இன்று"].includes(text)) days = 0;
  if (["tomorrow", "நாளை"].includes(text)) days = 1;
  if (["day after tomorrow", "நாளை மறுநாள்"].includes(text)) days = 2;
  const offset = text.match(/^in (\d{1,3}) (day|week)s?$/);
  if (offset) days = Number(offset[1]) * (offset[2] === "week" ? 7 : 1);
  const tamilOffset = text.match(/^(\d{1,3}) (நாட்கள்|வாரங்கள்|நாள்|வாரம்)(?: கழித்து| பிறகு)?$/);
  if (tamilOffset) days = Number(tamilOffset[1]) * (tamilOffset[2].startsWith("வார") ? 7 : 1);
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekday = text.match(/^(?:next |this |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (weekday) {
    if (text.startsWith("this ") && weekdays.indexOf(weekday[1]) < base.getUTCDay()) return null;
    days = (weekdays.indexOf(weekday[1]) - base.getUTCDay() + 7) % 7;
    if (days === 0 && text.startsWith("next ")) days = 7;
  }
  const tamilDays = ["ஞாயிற்றுக்கிழமை", "திங்கட்கிழமை", "செவ்வாய்க்கிழமை", "புதன்கிழமை", "வியாழக்கிழமை", "வெள்ளிக்கிழமை", "சனிக்கிழமை"];
  const tamilDay = text.replace(/^அடுத்த /, "");
  if (tamilDays.includes(tamilDay)) {
    days = (tamilDays.indexOf(tamilDay) - base.getUTCDay() + 7) % 7;
    if (days === 0 && text.startsWith("அடுத்த ")) days = 7;
  }
  if (days === undefined || days > 366) return null;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}
