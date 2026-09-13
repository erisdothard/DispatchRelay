import type { UserRole } from '@/lib/database.types';

/** A database row as stored by the in-memory demo backend. */
export type Row = Record<string, unknown>;

/** Seed rows keyed by table name. */
export type SeedTables = Record<string, Row[]>;

export interface DemoIdentity {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  companyId: string;
}

export interface DemoDb {
  read: (table: string) => readonly Row[];
  insert: (table: string, rows: Row[]) => Row[];
  update: (table: string, match: (row: Row) => boolean, patch: Row) => Row[];
  remove: (table: string, match: (row: Row) => boolean) => Row[];
}

export interface DemoContext {
  /** The demo persona currently signed in, or null on the login screen. */
  identity: DemoIdentity | null;
  db: DemoDb;
}

/**
 * Handles a Postgres function (`supabase.rpc`) or edge function (`supabase.functions.invoke`).
 * Return the `data` payload; throw an Error to surface `{ error: { message } }` to the caller.
 */
export type DemoHandler = (args: Row, ctx: DemoContext) => unknown;

export interface DemoDomain {
  /** Seed rows keyed by table name. Called once, lazily, on the first query. */
  seeds: () => SeedTables;
  /** `supabase.rpc(name)` handlers keyed by function name. */
  rpc?: Record<string, DemoHandler>;
  /** `supabase.functions.invoke(name)` handlers keyed by function name. */
  functions?: Record<string, DemoHandler>;
}
