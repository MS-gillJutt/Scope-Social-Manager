/**
 * Date and time utility functions for Scope Social Manager.
 */

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0]!;
}

/**
 * Formats a Date object to ISO string or null if invalid.
 */
export function toSafeISOString(date: unknown): string | null {
  if (!date) return null;
  const d = new Date(date as string | number | Date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Returns whether a given date is in the past.
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Returns whether a given date is in the future.
 */
export function isFuture(date: Date | string | number): boolean {
  return new Date(date).getTime() > Date.now();
}

/**
 * Adds hours to a date.
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Adds days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Gets start of day in UTC.
 */
export function startOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets end of day in UTC.
 */
export function endOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns the difference in seconds between two dates (dateA - dateB).
 */
export function diffInSeconds(dateA: Date, dateB: Date): number {
  return Math.round((dateA.getTime() - dateB.getTime()) / 1000);
}
