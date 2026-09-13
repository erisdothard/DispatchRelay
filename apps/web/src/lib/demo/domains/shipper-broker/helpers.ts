/** Small argument/lookup helpers shared by the shipper + broker demo handlers. */
import type { DemoContext, DemoIdentity, Row } from '../../types';

export const nowIso = (): string => new Date().toISOString();

export function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

export function optionalStr(value: unknown): string | null {
  const s = str(value).trim();
  return s ? s : null;
}

export function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function findById(rows: readonly Row[], id: unknown): Row | undefined {
  return rows.find((r) => r.id === id);
}

export function requireIdentity(ctx: DemoContext, action: string): DemoIdentity {
  if (!ctx.identity) throw new Error(`Sign in to ${action}.`);
  return ctx.identity;
}

/** ISO timestamp for `hour:minute` UTC on today's UTC calendar day (plus `dayOffset` days). */
export function todayUtcAt(hour: number, minute = 0, dayOffset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}
