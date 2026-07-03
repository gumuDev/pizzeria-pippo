// Réplica mínima de frontend/src/lib/timezone.ts — solo lo que necesita el módulo reports.
// Bolivia es UTC-4 fijo, sin horario de verano.
const TZ_OFFSET = '-04:00';
const UTC_OFFSET_HOURS = -4;

export function toBoliviaDate(utcDate: Date): Date {
  return new Date(utcDate.getTime() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

export function dateRangeFrom(date: string): string {
  return `${date}T00:00:00${TZ_OFFSET}`;
}

export function dateRangeTo(date: string): string {
  return `${date}T23:59:59${TZ_OFFSET}`;
}
