/**
 * Chainable, awaitable stand-in for Supabase's PostgREST query builder, backed by demo-db.
 * Mirrors the result envelope `{ data, error, count, status, statusText }`.
 */
import { deleteRows, insertRows, readTable, updateRows, upsertRows } from './demo-db';
import {
  columnPredicate,
  orPredicate,
  parseSelect,
  projectRow,
  type Predicate,
  type SelectSpec,
} from './query-engine';
import type { Row } from './types';

export interface DemoError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface DemoResult {
  data: unknown;
  error: DemoError | null;
  count: number | null;
  status: number;
  statusText: string;
}

type Mode = 'select' | 'insert' | 'update' | 'upsert' | 'delete';
type Cardinality = 'many' | 'single' | 'maybeSingle';

interface OrderBy {
  column: string;
  ascending: boolean;
  nullsFirst: boolean;
}

interface OrderOptions {
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
  referencedTable?: string;
}

function ok(data: unknown, count: number | null, status = 200): DemoResult {
  return { data, error: null, count, status, statusText: 'OK' };
}

function fail(message: string, code: string, status = 400): DemoResult {
  return {
    data: null,
    error: { message, code, details: null, hint: null },
    count: null,
    status,
    statusText: 'Error',
  };
}

export class DemoQueryBuilder implements PromiseLike<DemoResult> {
  private readonly table: string;
  private mode: Mode = 'select';
  private selectSpec: SelectSpec | null = null;
  private readonly predicates: Predicate[] = [];
  private readonly orders: OrderBy[] = [];
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private limitCount: number | null = null;
  private cardinality: Cardinality = 'many';
  private countRequested = false;
  private headOnly = false;
  private shouldThrow = false;
  private payload: Row[] = [];
  private patch: Row = {};
  private onConflict = 'id';
  private executed: Promise<DemoResult> | null = null;

  constructor(table: string) {
    this.table = table;
  }

  // ── Operations ───────────────────────────
  select(columns = '*', options?: { count?: string; head?: boolean }): this {
    this.selectSpec = parseSelect(columns);
    if (options?.count) this.countRequested = true;
    if (options?.head) this.headOnly = true;
    return this;
  }

  insert(values: Row | Row[]): this {
    this.mode = 'insert';
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: Row | Row[], options?: { onConflict?: string }): this {
    this.mode = 'upsert';
    this.payload = Array.isArray(values) ? values : [values];
    if (options?.onConflict) this.onConflict = options.onConflict;
    return this;
  }

  update(patch: Row): this {
    this.mode = 'update';
    this.patch = patch;
    return this;
  }

  delete(): this {
    this.mode = 'delete';
    return this;
  }

  // ── Filters ──────────────────────────────
  private where(column: string, operator: string, value: unknown): this {
    this.predicates.push(columnPredicate(column, operator, value));
    return this;
  }

  eq(column: string, value: unknown): this {
    return this.where(column, 'eq', value);
  }
  neq(column: string, value: unknown): this {
    return this.where(column, 'neq', value);
  }
  gt(column: string, value: unknown): this {
    return this.where(column, 'gt', value);
  }
  gte(column: string, value: unknown): this {
    return this.where(column, 'gte', value);
  }
  lt(column: string, value: unknown): this {
    return this.where(column, 'lt', value);
  }
  lte(column: string, value: unknown): this {
    return this.where(column, 'lte', value);
  }
  like(column: string, pattern: string): this {
    return this.where(column, 'like', pattern);
  }
  ilike(column: string, pattern: string): this {
    return this.where(column, 'ilike', pattern);
  }
  is(column: string, value: unknown): this {
    return this.where(column, 'is', value);
  }
  in(column: string, values: readonly unknown[]): this {
    return this.where(column, 'in', [...values]);
  }
  contains(column: string, value: unknown): this {
    return this.where(column, 'cs', value);
  }
  overlaps(column: string, value: unknown): this {
    return this.where(column, 'ov', value);
  }
  textSearch(column: string, query: string): this {
    return this.where(column, 'fts', query);
  }
  filter(column: string, operator: string, value: unknown): this {
    return this.where(column, operator, value);
  }
  not(column: string, operator: string, value: unknown): this {
    this.predicates.push(columnPredicate(column, operator, value, true));
    return this;
  }
  or(expression: string, options?: { foreignTable?: string; referencedTable?: string }): this {
    if (!options?.foreignTable && !options?.referencedTable)
      this.predicates.push(orPredicate(expression));
    return this;
  }
  match(query: Record<string, unknown>): this {
    Object.entries(query).forEach(([column, value]) => this.where(column, 'eq', value));
    return this;
  }

  // ── Modifiers ────────────────────────────
  order(column: string, options?: OrderOptions): this {
    if (options?.foreignTable || options?.referencedTable || column.includes('.')) return this;
    const ascending = options?.ascending ?? true;
    this.orders.push({ column, ascending, nullsFirst: options?.nullsFirst ?? !ascending });
    return this;
  }
  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  limit(count: number, options?: { foreignTable?: string; referencedTable?: string }): this {
    if (!options?.foreignTable && !options?.referencedTable) this.limitCount = count;
    return this;
  }
  single(): this {
    this.cardinality = 'single';
    return this;
  }
  maybeSingle(): this {
    this.cardinality = 'maybeSingle';
    return this;
  }
  throwOnError(): this {
    this.shouldThrow = true;
    return this;
  }
  returns(): this {
    return this;
  }
  abortSignal(): this {
    return this;
  }
  csv(): this {
    return this;
  }

  // ── Execution ────────────────────────────
  then<TResult1 = DemoResult, TResult2 = never>(
    onfulfilled?: ((value: DemoResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): Promise<DemoResult> {
    if (!this.executed) {
      this.executed = Promise.resolve().then(() => {
        const result = this.run();
        if (this.shouldThrow && result.error) throw new Error(result.error.message);
        return result;
      });
    }
    return this.executed;
  }

  private matches(row: Row): boolean {
    return this.predicates.every((p) => p(row));
  }

  private sort(rows: Row[]): Row[] {
    if (this.orders.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const { column, ascending, nullsFirst } of this.orders) {
        const av = a[column];
        const bv = b[column];
        if (av == null && bv == null) continue;
        if (av == null) return nullsFirst ? -1 : 1;
        if (bv == null) return nullsFirst ? 1 : -1;
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        if (cmp !== 0) return ascending ? cmp : -cmp;
      }
      return 0;
    });
  }

  private paginate(rows: Row[]): Row[] {
    let out = rows;
    if (this.rangeFrom !== null && this.rangeTo !== null)
      out = out.slice(this.rangeFrom, this.rangeTo + 1);
    if (this.limitCount !== null) out = out.slice(0, this.limitCount);
    return out;
  }

  private mutate(): Row[] {
    const match = (row: Row) => this.matches(row);
    switch (this.mode) {
      case 'insert':
        return insertRows(this.table, this.payload);
      case 'upsert':
        return upsertRows(this.table, this.payload, this.onConflict);
      case 'update':
        return updateRows(this.table, match, this.patch);
      case 'delete':
        return deleteRows(this.table, match);
      default:
        return [];
    }
  }

  private run(): DemoResult {
    let rows: Row[];
    let total: number;
    if (this.mode === 'select') {
      const filtered = this.sort(readTable(this.table).filter((row) => this.matches(row)));
      total = filtered.length;
      rows = this.paginate(filtered);
    } else {
      rows = this.mutate();
      total = rows.length;
      // Mutations return rows only when .select() was chained, like PostgREST.
      if (!this.selectSpec) return ok(null, this.countRequested ? total : null, 201);
    }

    const spec = this.selectSpec ?? parseSelect('*');
    const projected = rows.map((row) => projectRow(this.table, row, spec));
    const count = this.countRequested ? total : null;
    if (this.headOnly) return ok(null, count);

    if (this.cardinality === 'many') return ok(projected, count);
    if (projected.length === 1) return ok(projected[0], count);
    if (this.cardinality === 'maybeSingle' && projected.length === 0) return ok(null, count);
    return fail('JSON object requested, multiple (or no) rows returned', 'PGRST116', 406);
  }
}

/** Awaitable result of `supabase.rpc()`; tolerates the modifiers callers chain onto it. */
export class DemoRpcCall implements PromiseLike<DemoResult> {
  private readonly run: () => Promise<unknown>;
  private pickOne = false;
  private executed: Promise<DemoResult> | null = null;

  constructor(run: () => Promise<unknown>) {
    this.run = run;
  }

  single(): this {
    this.pickOne = true;
    return this;
  }
  maybeSingle(): this {
    return this.single();
  }
  select(): this {
    return this;
  }
  eq(): this {
    return this;
  }
  order(): this {
    return this;
  }
  limit(): this {
    return this;
  }
  returns(): this {
    return this;
  }
  throwOnError(): this {
    return this;
  }
  abortSignal(): this {
    return this;
  }

  then<TResult1 = DemoResult, TResult2 = never>(
    onfulfilled?: ((value: DemoResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (!this.executed) {
      this.executed = this.run().then(
        (data) => ok(this.pickOne && Array.isArray(data) ? (data[0] ?? null) : data, null),
        (err: unknown) => fail(err instanceof Error ? err.message : String(err), 'P0001'),
      );
    }
    return this.executed.then(onfulfilled, onrejected);
  }
}
