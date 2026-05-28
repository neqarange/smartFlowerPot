import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "Europe/Prague";

export function formatInAppTZ(date: Date | string, pattern: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}

export function formatYmd(date: Date | string): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

// Returns a Date whose .getHours()/.getDay()/.getDate() yield Prague-local
// values. Use ONLY for bucketing/comparison — never format this directly.
export function toAppZonedDate(date: Date | string): Date {
  return toZonedTime(date, APP_TIMEZONE);
}

// Parse "YYYY-MM-DD" as 00:00 in Prague, returning the corresponding UTC instant.
export function parseYmdInAppTZ(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const naive = new Date(Date.UTC(y, m - 1, d));
  const zoned = toZonedTime(naive, APP_TIMEZONE);
  const offsetMs = zoned.getTime() - naive.getTime();
  return new Date(naive.getTime() - offsetMs);
}
