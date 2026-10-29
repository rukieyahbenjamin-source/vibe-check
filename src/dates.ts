// Calendar-day helpers. Everything here works on local calendar dates written as YYYY-MM-DD.
// Only localDateKey() reads the local clock, and it is only called from the app's entry points.

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Formats a Date's local calendar day as YYYY-MM-DD. */
export function localDateKey(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** Today's local calendar day. The one place the app reads the clock for progression. */
export function currentDateKey(): string {
  return localDateKey(new Date());
}

/** True when the value is a real calendar date in YYYY-MM-DD form (e.g. not 2026-02-30). */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
  );
}

/**
 * Adds whole days to a date key. Uses UTC arithmetic on purpose: calendar days have no
 * time zone, so this never shifts the date (month-ends, leap days and year-ends all work).
 */
export function addDays(dateKey: string, days: number): string {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Not a date key: ${dateKey}`);
  }
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1, 2)}-${pad(shifted.getUTCDate(), 2)}`;
}

/** Number of calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  return Math.round((end - start) / MS_PER_DAY);
}

function parseDateKey(dateKey: string): number {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Not a date key: ${dateKey}`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
