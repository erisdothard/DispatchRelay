/** Date helpers for demo data — everything is relative to "now" so the demo never looks stale. */
const HOUR_MS = 3_600_000;

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

export function hoursFromNow(hours: number): string {
  return hoursAgo(-hours);
}

/** Calendar date (YYYY-MM-DD) offset from today. */
export function daysFromNow(days: number): string {
  return hoursFromNow(days * 24).split('T')[0];
}
