/** Shared utility functions */

/** Convert a string to Title Case — "new york" → "New York" */
export function titleCase(s: string): string {
  return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
