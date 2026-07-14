// Mirrors frontend/src/lib/timezone.ts — grows as more modules need it.
// Bolivia is fixed UTC-4, no daylight saving time.
const TZ_OFFSET = '-04:00';
const UTC_OFFSET_HOURS = -4;

export function toBoliviaDate(utcDate: Date): Date {
  return new Date(utcDate.getTime() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

export function nowInBolivia(): Date {
  return new Date(Date.now() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

// Safe to use even after 20:00 local time when UTC is already "tomorrow".
export function todayInBolivia(): string {
  return nowInBolivia().toISOString().split('T')[0];
}

export function dateRangeFrom(date: string): string {
  return `${date}T00:00:00${TZ_OFFSET}`;
}

export function dateRangeTo(date: string): string {
  return `${date}T23:59:59${TZ_OFFSET}`;
}
