/**
 * PostgREST semantics for the demo backend: filter operators, `.or()` logic strings,
 * and `select()` strings with embedded relations (`alias:table!fkey(cols)`).
 */
import { readTable } from './demo-db';
import type { Row } from './types';

export type Predicate = (row: Row) => boolean;

// ── Values ─────────────────────────────────────────────

export function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function isNumeric(v: unknown): boolean {
  return typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)));
}

function compareValues(a: unknown, b: unknown): number {
  if (isNumeric(a) && isNumeric(b)) return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

/** Accepts arrays or PostgREST list strings: `("a","b")` / `(a,b)`. */
function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const inner = String(value).trim().replace(/^\(/, '').replace(/\)$/, '');
  return splitTopLevel(inner).map((v) => v.replace(/^"(.*)"$/, '$1'));
}

function likeToRegExp(pattern: string, caseInsensitive: boolean): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[%*]/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
}

function containsValue(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual))
    return toList(expected).every((v) => actual.some((a) => looseEquals(a, v)));
  if (actual && typeof actual === 'object' && expected && typeof expected === 'object') {
    const obj = actual as Record<string, unknown>;
    return Object.entries(expected).every(([k, v]) => looseEquals(obj[k], v));
  }
  return typeof actual === 'string' && actual.includes(String(expected));
}

function compare(operator: string, actual: unknown, expected: unknown): boolean {
  switch (operator) {
    case 'eq':
      return looseEquals(actual, expected);
    case 'neq':
      return !looseEquals(actual, expected);
    case 'gt':
      return actual != null && compareValues(actual, expected) > 0;
    case 'gte':
      return actual != null && compareValues(actual, expected) >= 0;
    case 'lt':
      return actual != null && compareValues(actual, expected) < 0;
    case 'lte':
      return actual != null && compareValues(actual, expected) <= 0;
    case 'like':
      return typeof actual === 'string' && likeToRegExp(String(expected), false).test(actual);
    case 'ilike':
      return typeof actual === 'string' && likeToRegExp(String(expected), true).test(actual);
    case 'is':
      return expected === null || expected === 'null'
        ? actual == null
        : looseEquals(actual, expected);
    case 'in':
      return toList(expected).some((v) => looseEquals(actual, v));
    case 'cs':
    case 'contains':
      return containsValue(actual, expected);
    case 'ov':
    case 'overlaps':
      return (
        Array.isArray(actual) && toList(expected).some((v) => actual.some((a) => looseEquals(a, v)))
      );
    case 'fts':
    case 'plfts':
    case 'wfts':
      return String(expected)
        .toLowerCase()
        .split(/[\s&|]+/)
        .filter(Boolean)
        .every((word) =>
          String(actual ?? '')
            .toLowerCase()
            .includes(word),
        );
    default:
      return true; // unmodelled operators never hide rows
  }
}

export function columnPredicate(
  column: string,
  operator: string,
  value: unknown,
  negate = false,
): Predicate {
  // Filters on embedded relations or JSON paths aren't modelled — don't hide rows over them.
  if (column.includes('.') || column.includes('->')) return () => true;
  const test: Predicate = (row) => compare(operator, row[column], value);
  return negate ? (row) => !test(row) : test;
}

// ── Logic strings: .or('a.eq.1,and(b.gt.2,c.is.null)') ──────────

export function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';
  for (const ch of input) {
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseCondition(token: string): Predicate {
  const group = /^(not\.)?(and|or)\((.*)\)$/s.exec(token);
  if (group) {
    const parts = splitTopLevel(group[3]).map(parseCondition);
    const combined: Predicate =
      group[2] === 'and' ? (r) => parts.every((p) => p(r)) : (r) => parts.some((p) => p(r));
    return group[1] ? (r) => !combined(r) : combined;
  }
  const cond = /^([^.]+)\.(not\.)?([a-z]+)\.(.*)$/s.exec(token);
  if (!cond) return () => true;
  const [, column, not, operator, raw] = cond;
  return columnPredicate(column, operator, raw === 'null' ? null : raw, !!not);
}

export function orPredicate(expression: string): Predicate {
  const parts = splitTopLevel(expression).map(parseCondition);
  return (row) => parts.some((p) => p(row));
}

/** Realtime filter syntax: `user_id=eq.abc`. */
export function realtimeFilterPredicate(filter: string): Predicate {
  const m = /^([^=]+)=([a-z]+)\.(.*)$/s.exec(filter);
  return m ? columnPredicate(m[1], m[2], m[3]) : () => true;
}

// ── select() strings with embedded relations ────────────

export interface SelectSpec {
  aliases: Array<{ alias: string; column: string }>;
  embeds: EmbedSpec[];
}

interface EmbedSpec {
  alias: string;
  target: string;
  hint: string | null;
  select: SelectSpec;
}

const EMBED_RE = /^(?:(\w+):)?(\w+)((?:!\w+)*)\((.*)\)$/s;
const ALIAS_RE = /^(\w+):(\w+)(?:::\w+)?$/;

export function parseSelect(input = '*'): SelectSpec {
  const spec: SelectSpec = { aliases: [], embeds: [] };
  for (const token of splitTopLevel(input.replace(/\s+/g, ' '))) {
    const embed = EMBED_RE.exec(token);
    if (embed) {
      const [, alias, target, hints, inner] = embed;
      const hint = hints.split('!').find((h) => h && h !== 'inner' && h !== 'left') ?? null;
      spec.embeds.push({ alias: alias ?? target, target, hint, select: parseSelect(inner) });
      continue;
    }
    const aliased = ALIAS_RE.exec(token);
    if (aliased) spec.aliases.push({ alias: aliased[1], column: aliased[2] });
  }
  return spec;
}

/** Which table a foreign-key column points at, for column-named embeds like `assignee_id(full_name)`. */
const COLUMN_TABLE: Record<string, string> = {
  assignee_id: 'profiles',
  assigned_driver_id: 'profiles',
  second_driver_id: 'profiles',
  posted_by: 'profiles',
  carrier_id: 'profiles',
  driver_id: 'profiles',
  user_id: 'profiles',
  sender_id: 'profiles',
  owner_id: 'profiles',
  uploaded_by: 'profiles',
  invited_by: 'profiles',
  shipper_id: 'profiles',
  broker_id: 'profiles',
  reviewer_id: 'profiles',
  company_id: 'companies',
  load_id: 'loads',
  conversation_id: 'conversations',
  rfp_id: 'rfps',
  facility_id: 'facilities',
  truck_id: 'trucks',
  bid_id: 'bids',
};

function singular(table: string): string {
  if (table.endsWith('ies')) return `${table.slice(0, -3)}y`;
  return table.endsWith('s') ? table.slice(0, -1) : table;
}

interface Relation {
  table: string;
  column: string;
  /** true = one-to-many (column lives on the related table and points back at this row). */
  many: boolean;
}

function resolveRelation(parentTable: string, row: Row, embed: EmbedSpec): Relation {
  const { target, hint } = embed;
  if (hint) {
    if (hint in row) return { table: target, column: hint, many: false };
    const fk = hint.replace(/_fkey$/, '');
    if (fk.startsWith(`${parentTable}_`))
      return { table: target, column: fk.slice(parentTable.length + 1), many: false };
    if (fk.startsWith(`${target}_`))
      return { table: target, column: fk.slice(target.length + 1), many: true };
  }
  if (target in row && target.endsWith('_id'))
    return {
      table: COLUMN_TABLE[target] ?? `${target.slice(0, -3)}s`,
      column: target,
      many: false,
    };
  const direct = `${singular(target)}_id`;
  if (direct in row) return { table: target, column: direct, many: false };
  const byColumn = Object.keys(row).find((k) => COLUMN_TABLE[k] === target);
  if (byColumn) return { table: target, column: byColumn, many: false };
  return { table: target, column: `${singular(parentTable)}_id`, many: true };
}

/**
 * Returns the full row (extra columns are harmless to callers) plus aliased columns
 * and resolved embeds — many-to-one as an object/null, one-to-many as an array.
 */
export function projectRow(table: string, row: Row, spec: SelectSpec): Row {
  const out: Row = { ...row };
  for (const { alias, column } of spec.aliases) out[alias] = row[column];
  for (const embed of spec.embeds) {
    const rel = resolveRelation(table, row, embed);
    if (rel.many) {
      out[embed.alias] = readTable(rel.table)
        .filter((r) => looseEquals(r[rel.column], row.id))
        .map((r) => projectRow(rel.table, r, embed.select));
    } else {
      const fk = row[rel.column];
      const related =
        fk == null ? undefined : readTable(rel.table).find((r) => looseEquals(r.id, fk));
      out[embed.alias] = related ? projectRow(rel.table, related, embed.select) : null;
    }
  }
  return out;
}
