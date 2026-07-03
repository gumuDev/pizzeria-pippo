/**
 * Timezone utilities for Bolivia (UTC-4, no DST).
 * All date logic should use these helpers to stay consistent.
 */

export const TZ_OFFSET = "-04:00";
export const UTC_OFFSET_HOURS = -4;

/**
 * Returns the current date/time adjusted to Bolivia local time.
 */
export function nowInBolivia(): Date {
  return new Date(Date.now() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Returns today's date string in Bolivia local time (YYYY-MM-DD).
 * Safe to use even after 20:00 local time when UTC is already "tomorrow".
 */
export function todayInBolivia(): string {
  return nowInBolivia().toISOString().split("T")[0];
}

/**
 * Returns the day of week (0=Sunday) in Bolivia local time.
 */
export function dayOfWeekInBolivia(): number {
  return nowInBolivia().getDay();
}

/**
 * Converts a UTC Date to Bolivia local Date object.
 */
export function toBoliviaDate(utcDate: Date): Date {
  return new Date(utcDate.getTime() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Formats a full date+time string in Bolivia local time (DD/MM/YYYY HH:mm).
 * Safe: works from UTC ISO strings regardless of browser timezone.
 */
export function formatDateTimeBolivia(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const boliviaDate = toBoliviaDate(d);
  const iso = boliviaDate.toISOString(); // always UTC representation of shifted time
  const [datePart, timePart] = iso.split("T");
  const [year, month, day] = datePart.split("-");
  const [h, m] = timePart.split(":");
  return `${day}/${month}/${year} ${h}:${m}`;
}

/**
 * Formats a time string (HH:MM) from a Date or ISO string in Bolivia local time.
 * Extracts H/M directly from the adjusted ISO string — avoids browser timezone re-interpretation.
 */
export function formatTimeBolivia(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const boliviaDate = toBoliviaDate(d);
  // Read from ISO string (always UTC representation of the shifted time)
  const iso = boliviaDate.toISOString(); // e.g. "2026-03-03T21:30:00.000Z"
  const [h, m] = iso.split("T")[1].split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

/**
 * Formats a "from" date param for Supabase query (start of day, Bolivia time).
 */
export function dateRangeFrom(date: string): string {
  return `${date}T00:00:00${TZ_OFFSET}`;
}

/**
 * Formats a "to" date param for Supabase query (end of day, Bolivia time).
 */
export function dateRangeTo(date: string): string {
  return `${date}T23:59:59${TZ_OFFSET}`;
}
