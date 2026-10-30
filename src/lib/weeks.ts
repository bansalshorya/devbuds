export function kolkataDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00Z`);
}

export function kolkataWeekStart(now = new Date()): Date {
  const date = kolkataDate(now);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}
