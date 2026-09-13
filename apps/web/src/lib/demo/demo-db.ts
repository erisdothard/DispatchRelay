/**
 * In-memory tables backing demo mode. Seeded lazily from the demo domains on first read;
 * writes replace table arrays immutably and broadcast change events for demo realtime.
 */
import { buildSeedTables } from './domains';
import type { DemoDb, Row } from './types';

export interface DemoChange {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Row;
  old: Row;
}

type ChangeListener = (change: DemoChange) => void;

const BID_TTL_HOURS = 48;
const INVITE_TTL_DAYS = 7;
const listeners = new Set<ChangeListener>();
let tables: Map<string, readonly Row[]> | null = null;
let loadNumberSeq = 1100;

function store(): Map<string, readonly Row[]> {
  if (!tables) tables = new Map(Object.entries(buildSeedTables()));
  return tables;
}

export function newDemoId(): string {
  return crypto.randomUUID();
}

/** Column defaults the real database would fill in on insert. */
const TABLE_DEFAULTS: Record<string, (now: string) => Row> = {
  loads: (now) => {
    loadNumberSeq += 1;
    return {
      load_number: `FX-${loadNumberSeq}`,
      status: 'posted',
      bid_count: 0,
      posted_at: now,
      hazmat: false,
      temp_controlled: false,
      visibility: 'public',
      deleted_at: null,
      assigned_driver_id: null,
      second_driver_id: null,
      assignee_id: null,
    };
  },
  bids: (now) => ({
    status: 'pending',
    round: 1,
    parent_bid_id: null,
    deleted_at: null,
    updated_at: now,
    expires_at: new Date(Date.now() + BID_TTL_HOURS * 3_600_000).toISOString(),
  }),
  company_invites: (now) => ({
    token: crypto.randomUUID(),
    expires_at: new Date(Date.parse(now) + INVITE_TTL_DAYS * 86_400_000).toISOString(),
    accepted_at: null,
  }),
  notifications: () => ({ read: false }),
  messages: () => ({ read: false }),
  documents: () => ({ deleted_at: null, signed_at: null }),
};

function withDefaults(table: string, row: Row): Row {
  const now = new Date().toISOString();
  return { id: newDemoId(), created_at: now, ...(TABLE_DEFAULTS[table]?.(now) ?? {}), ...row };
}

function emit(change: DemoChange): void {
  // Deliver asynchronously, like a real websocket, so writers never re-enter listeners.
  listeners.forEach((listener) => setTimeout(() => listener(change), 0));
}

export function readTable(table: string): readonly Row[] {
  return store().get(table) ?? [];
}

export function insertRows(table: string, rows: Row[]): Row[] {
  const created = rows.map((row) => withDefaults(table, row));
  store().set(table, [...readTable(table), ...created]);
  created.forEach((row) => emit({ table, eventType: 'INSERT', new: row, old: {} }));
  return created;
}

export function updateRows(table: string, match: (row: Row) => boolean, patch: Row): Row[] {
  const changes: Array<{ before: Row; after: Row }> = [];
  const next = readTable(table).map((row) => {
    if (!match(row)) return row;
    const after = { ...row, ...patch };
    changes.push({ before: row, after });
    return after;
  });
  store().set(table, next);
  changes.forEach(({ before, after }) =>
    emit({ table, eventType: 'UPDATE', new: after, old: before }),
  );
  return changes.map(({ after }) => after);
}

export function deleteRows(table: string, match: (row: Row) => boolean): Row[] {
  const removed = readTable(table).filter(match);
  store().set(
    table,
    readTable(table).filter((row) => !match(row)),
  );
  removed.forEach((row) => emit({ table, eventType: 'DELETE', new: {}, old: row }));
  return removed;
}

export function upsertRows(table: string, rows: Row[], onConflict = 'id'): Row[] {
  const keys = onConflict.split(',').map((k) => k.trim());
  return rows.flatMap((row) => {
    const hasKeys = keys.every((k) => row[k] !== undefined);
    const existing = hasKeys
      ? readTable(table).find((r) => keys.every((k) => r[k] === row[k]))
      : undefined;
    return existing ? updateRows(table, (r) => r === existing, row) : insertRows(table, [row]);
  });
}

export function onDemoChange(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const demoDb: DemoDb = {
  read: readTable,
  insert: insertRows,
  update: updateRows,
  remove: deleteRows,
};
