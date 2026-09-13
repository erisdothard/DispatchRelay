/**
 * Lane intelligence: 90 days of booked-rate history per lane, the popular_lanes view,
 * carrier lane preferences, and the rate/lane Postgres functions computed over them.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoDb, DemoHandler, Row } from '../../types';
import { findCity, roadMiles } from './geo';

type LaneSeed = [
  origin: string,
  dest: string,
  equipment: string,
  rpm: number,
  miles: number,
  samples: number,
  drift: number,
];

/** Base $/mi, typical length of haul, bookings in 90 days, and 90-day rate drift (+ = rising). */
const LANES: LaneSeed[] = [
  ['GA', 'TX', 'van', 2.36, 790, 28, 0.05],
  ['TN', 'IL', 'reefer', 2.92, 470, 24, 0.04],
  ['CA', 'AZ', 'flatbed', 3.02, 370, 16, -0.02],
  ['FL', 'NC', 'van', 2.22, 650, 21, 0.03],
  ['TX', 'TN', 'van', 2.14, 590, 26, 0.02],
  ['WA', 'OR', 'step_deck', 3.35, 175, 9, 0.01],
  ['CO', 'MO', 'reefer', 2.68, 600, 14, 0.06],
  ['MI', 'IN', 'van', 2.58, 290, 22, -0.01],
  ['FL', 'GA', 'flatbed', 2.88, 140, 12, 0.03],
  ['TX', 'LA', 'van', 2.28, 540, 19, 0.02],
  ['TX', 'IL', 'flatbed', 2.72, 1080, 18, 0.05],
  ['CA', 'TX', 'reefer', 2.66, 1440, 25, 0.07],
  ['CA', 'CO', 'reefer', 2.74, 1180, 11, 0.04],
  ['TN', 'GA', 'van', 2.41, 250, 23, 0.02],
  ['TN', 'NC', 'reefer', 2.86, 410, 13, 0.03],
  ['TN', 'MO', 'van', 2.19, 450, 15, 0.01],
  ['GA', 'FL', 'reefer', 2.9, 440, 17, 0.04],
  ['IL', 'OH', 'van', 2.47, 360, 20, -0.02],
  ['IL', 'TX', 'van', 2.05, 970, 27, 0.03],
  ['CA', 'WA', 'reefer', 2.61, 1130, 10, 0.02],
];

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 90;

/** Deterministic PRNG so the demo tells the same story on every reload. */
function prng(seed: number): () => number {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildRateHistory(): Row[] {
  return LANES.flatMap(([origin, dest, equipment, rpm, miles, samples, drift], laneIndex) => {
    const rand = prng(laneIndex + 1);
    return Array.from({ length: samples }, (_, i) => {
      const daysAgo = Math.max(0.5, (WINDOW_DAYS - 2) * (1 - i / samples) - rand() * 2);
      const trend = 1 + drift * (1 - daysAgo / WINDOW_DAYS) - drift / 2;
      const ratePerMile = round2(rpm * trend * (0.93 + rand() * 0.14));
      const totalMiles = Math.round(miles * (0.97 + rand() * 0.06));
      return {
        id: `rate-${origin}-${dest}-${equipment}-${i + 1}`,
        lane_hash: `${origin}-${dest}-${equipment}`,
        origin_state: origin,
        dest_state: dest,
        equipment,
        rate_usd: Math.round(ratePerMile * totalMiles),
        total_miles: totalMiles,
        rate_per_mile: ratePerMile,
        load_id: null,
        recorded_at: hoursAgo(daysAgo * 24),
      };
    });
  });
}

function laneKey(origin: unknown, dest: unknown, equipment: unknown): string {
  return `${String(origin).toUpperCase()}-${String(dest).toUpperCase()}-${String(equipment).toLowerCase()}`;
}

function laneSamples(
  db: DemoDb,
  origin: unknown,
  dest: unknown,
  equipment: unknown,
  days = WINDOW_DAYS,
): Row[] {
  const key = laneKey(origin, dest, equipment);
  const since = Date.now() - days * DAY_MS;
  return db
    .read('rate_history')
    .filter(
      (r) =>
        laneKey(r.origin_state, r.dest_state, r.equipment) === key &&
        r.rate_per_mile != null &&
        new Date(String(r.recorded_at ?? 0)).getTime() >= since,
    );
}

const rpmOf = (r: Row) => Number(r.rate_per_mile);

export interface LaneStatsRow {
  avg_rate_per_mile: number | null;
  min_rate_per_mile: number | null;
  max_rate_per_mile: number | null;
  sample_count: number;
  last_recorded_at: string | null;
}

function statsFor(samples: readonly Row[]): LaneStatsRow {
  if (samples.length === 0) {
    return {
      avg_rate_per_mile: null,
      min_rate_per_mile: null,
      max_rate_per_mile: null,
      sample_count: 0,
      last_recorded_at: null,
    };
  }
  const rates = samples.map(rpmOf);
  const latest = samples.reduce((a, b) => (String(a.recorded_at) > String(b.recorded_at) ? a : b));
  return {
    avg_rate_per_mile: round2(rates.reduce((s, r) => s + r, 0) / rates.length),
    min_rate_per_mile: Math.min(...rates),
    max_rate_per_mile: Math.max(...rates),
    sample_count: samples.length,
    last_recorded_at: String(latest.recorded_at),
  };
}

function buildPopularLanes(history: readonly Row[]): Row[] {
  const groups = new Map<string, Row[]>();
  history.forEach((r) => {
    const key = laneKey(r.origin_state, r.dest_state, r.equipment);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  });
  return [...groups.values()].map((rows) => {
    const stats = statsFor(rows);
    return {
      origin_state: rows[0].origin_state,
      dest_state: rows[0].dest_state,
      equipment: rows[0].equipment,
      load_count: rows.length,
      avg_rate_per_mile: stats.avg_rate_per_mile,
      min_rate_per_mile: stats.min_rate_per_mile,
      max_rate_per_mile: stats.max_rate_per_mile,
      last_seen_at: stats.last_recorded_at,
    };
  });
}

export function buildLaneSeeds(): Record<string, Row[]> {
  const history = buildRateHistory();
  return {
    rate_history: history,
    popular_lanes: buildPopularLanes(history),
    // Rivera's carrier_lane_preferences are seeded by the carrier domain (business-seeds.ts).
  };
}

// ── Rate suggestion (shared with the ai-load-search edge function) ──────────

const NATIONAL_RPM: Record<string, number> = {
  van: 2.24,
  reefer: 2.68,
  flatbed: 2.82,
  step_deck: 3.08,
  lowboy: 3.6,
  tanker: 2.9,
  box_truck: 2.1,
  sprinter: 1.75,
};

const EQUIPMENT_LABEL: Record<string, string> = {
  van: 'dry van',
  reefer: 'reefer',
  flatbed: 'flatbed',
  step_deck: 'step deck',
};

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

function confidenceFor(count: number): 'high' | 'medium' | 'low' {
  if (count >= 15) return 'high';
  if (count >= 6) return 'medium';
  return 'low';
}

/** Recent-30-day average vs. the prior 60 days, as a signed percentage. */
function momentum(samples: readonly Row[]): number {
  const cutoff = Date.now() - 30 * DAY_MS;
  const recent = samples
    .filter((r) => new Date(String(r.recorded_at)).getTime() >= cutoff)
    .map(rpmOf);
  const older = samples
    .filter((r) => new Date(String(r.recorded_at)).getTime() < cutoff)
    .map(rpmOf);
  if (recent.length < 2 || older.length < 2) return 0;
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  return round2(((avg(recent) - avg(older)) / avg(older)) * 100);
}

export function suggestRate(args: Row, db: DemoDb) {
  const equipment = String(args.equipment ?? 'van');
  const miles = Number(args.total_miles ?? 0);
  const samples = laneSamples(db, args.origin_state, args.dest_state, equipment);
  const label = EQUIPMENT_LABEL[equipment] ?? equipment.replace(/_/g, ' ');
  const lane = `${String(args.origin_state).toUpperCase()} → ${String(args.dest_state).toUpperCase()}`;
  const shortHaul = miles > 0 && miles < 250 ? 1.12 : 1;

  if (samples.length === 0) {
    const base = (NATIONAL_RPM[equipment] ?? 2.3) * shortHaul;
    return {
      suggested_low: round2(base * 0.92),
      suggested_mid: round2(base),
      suggested_high: round2(base * 1.1),
      confidence: 'low' as const,
      reasoning: `No bookings on ${lane} in the last 90 days, so this uses the national ${label} average${shortHaul > 1 ? ' with a short-haul premium' : ''}. Post near the mid and adjust once bids come in.`,
      sample_count: 0,
    };
  }

  const sorted = samples.map(rpmOf).sort((a, b) => a - b);
  const move = momentum(samples);
  const tilt = 1 + Math.max(-0.04, Math.min(0.04, move / 200));
  const p25 = percentile(sorted, 0.25) * shortHaul;
  const p50 = percentile(sorted, 0.5) * shortHaul * tilt;
  const p75 = percentile(sorted, 0.75) * shortHaul * tilt;
  const direction =
    move > 1 ? `up ${move.toFixed(1)}%` : move < -1 ? `down ${Math.abs(move).toFixed(1)}%` : 'flat';
  const advice =
    move > 1
      ? 'Capacity is tightening, so posting at or above the mid should book quickly.'
      : move < -1
        ? 'Rates are softening — the low end will still attract bids.'
        : 'Posting at the mid is in line with what carriers are accepting.';

  return {
    suggested_low: round2(p25),
    suggested_mid: round2(p50),
    suggested_high: round2(p75),
    confidence: confidenceFor(samples.length),
    reasoning: `${samples.length} ${label} bookings on ${lane} in 90 days ranged $${sorted[0].toFixed(2)}–$${sorted[sorted.length - 1].toFixed(2)}/mi. The last 30 days are ${direction} versus the prior 60. ${advice}`,
    sample_count: samples.length,
  };
}

// ── Postgres functions ────────────────────────────────

const getLaneStats: DemoHandler = (args, { db }) => [
  statsFor(
    laneSamples(
      db,
      args.p_origin_state,
      args.p_dest_state,
      args.p_equipment,
      Number(args.p_days ?? WINDOW_DAYS),
    ),
  ),
];

const getLaneTrend: DemoHandler = (args, { db }) => {
  const samples = laneSamples(db, args.p_origin_state, args.p_dest_state, args.p_equipment);
  const weeks = new Map<string, number[]>();
  samples.forEach((r) => {
    const t = new Date(String(r.recorded_at)).getTime();
    const weekStart = new Date(t - (t % (7 * DAY_MS))).toISOString().split('T')[0];
    weeks.set(weekStart, [...(weeks.get(weekStart) ?? []), rpmOf(r)]);
  });
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, rates]) => ({
      day,
      avg_rate_per_mile: round2(rates.reduce((s, x) => s + x, 0) / rates.length),
    }));
};

function fairnessLabel(pct: number): string {
  if (pct >= 75) return 'Excellent';
  if (pct >= 55) return 'Above Average';
  if (pct >= 30) return 'Fair';
  return 'Below Market';
}

const getRateFairness: DemoHandler = (args, { db }) => {
  const load = db.read('loads').find((l) => l.id === args.p_load_id);
  if (!load) return null;
  const miles = Number(load.total_miles ?? 0);
  const rpm = Number(load.rate_per_mile ?? 0) || (miles > 0 ? Number(load.rate_usd) / miles : 0);
  const samples = laneSamples(db, load.origin_state, load.dest_state, load.equipment);
  if (!rpm || samples.length < 3) return null;
  const rates = samples.map(rpmOf);
  const pct = Math.round((rates.filter((r) => r < rpm).length / rates.length) * 100);
  const stats = statsFor(samples);
  return {
    rate_per_mile: round2(rpm),
    market_avg: stats.avg_rate_per_mile,
    market_min: stats.min_rate_per_mile,
    market_max: stats.max_rate_per_mile,
    percentile: pct,
    sample_count: samples.length,
    fairness_label: fairnessLabel(pct),
    confidence: confidenceFor(samples.length),
  };
};

// ── Carrier lane suggestions & backhauls ─────────────────

const OPEN_STATUSES = new Set(['posted', 'bid_received']);
const ACTIVE_STATUSES = new Set(['awarded', 'dispatched', 'in_transit']);

function companyLoads(db: DemoDb, companyId: unknown): Row[] {
  const memberIds = new Set(
    db
      .read('company_members')
      .filter((m) => m.company_id === companyId)
      .map((m) => m.user_id),
  );
  const wonLoadIds = new Set(
    db
      .read('bids')
      .filter(
        (b) =>
          b.status === 'accepted' && (b.company_id === companyId || memberIds.has(b.carrier_id)),
      )
      .map((b) => b.load_id),
  );
  return db
    .read('loads')
    .filter((l) => wonLoadIds.has(l.id) || memberIds.has(l.assigned_driver_id));
}

const getLaneSuggestions: DemoHandler = (args, { db }) => {
  const companyId = args.p_carrier_company_id;
  const seen = new Set<string>();
  const suggestions: Row[] = [];
  const add = (
    origin: unknown,
    dest: unknown,
    equipment: unknown,
    source: string,
    score: number,
  ) => {
    const key = laneKey(origin, dest, equipment);
    if (seen.has(key)) return;
    const samples = laneSamples(db, origin, dest, equipment);
    if (samples.length === 0) return;
    seen.add(key);
    suggestions.push({
      origin_state: String(origin).toUpperCase(),
      destination_state: String(dest).toUpperCase(),
      equipment_type: String(equipment),
      avg_rate: Math.round(samples.reduce((s, r) => s + Number(r.rate_usd), 0) / samples.length),
      load_count: samples.length,
      score: Math.min(99, score + Math.round(samples.length / 3)),
      source,
    });
  };

  db.read('carrier_lane_preferences')
    .filter((p) => p.carrier_company_id === companyId && p.active !== false)
    .forEach((p) => add(p.origin_state, p.dest_state, p.equipment ?? 'van', 'preference', 82));
  companyLoads(db, companyId).forEach((l) =>
    add(l.origin_state, l.dest_state, l.equipment, 'history', 70),
  );
  db.read('popular_lanes')
    .slice()
    .sort((a, b) => Number(b.load_count) - Number(a.load_count))
    .forEach((l) => add(l.origin_state, l.dest_state, l.equipment, 'popular', 55));

  return suggestions.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 8);
};

const getBackhaulOpportunities: DemoHandler = (args, { db, identity }) => {
  const companyId = identity?.companyId ?? DEMO_IDS.carrierCompany;
  const ends = companyLoads(db, companyId)
    .filter((l) => ACTIVE_STATUSES.has(String(l.status)))
    .map((l) => findCity(l.dest_city, l.dest_state))
    .filter((c) => c !== undefined);
  const currentState = String(args.p_current_state ?? '').toUpperCase();

  const open = db.read('loads').filter((l) => OPEN_STATUSES.has(String(l.status)) && !l.deleted_at);
  return open
    .map((l) => {
      const origin = findCity(l.origin_city, l.origin_state);
      const deadhead =
        origin && ends.length > 0 ? Math.min(...ends.map((e) => roadMiles(e, origin))) : null;
      return { load: l, deadhead };
    })
    .filter(({ load, deadhead }) =>
      currentState ? load.origin_state === currentState : deadhead !== null && deadhead <= 450,
    )
    .sort((a, b) => (a.deadhead ?? 9999) - (b.deadhead ?? 9999))
    .slice(0, 6)
    .map(({ load, deadhead }) => ({
      load_id: load.id,
      load_number: load.load_number,
      origin_city: load.origin_city,
      origin_state: load.origin_state,
      destination_city: load.dest_city,
      destination_state: load.dest_state,
      rate_usd: load.rate_usd,
      total_miles: load.total_miles,
      equipment_type: load.equipment,
      pickup_date: load.pickup_date,
      deadhead_miles: deadhead,
    }));
};

export const LANE_RPC: Record<string, DemoHandler> = {
  get_lane_stats: getLaneStats,
  get_lane_trend: getLaneTrend,
  get_rate_fairness: getRateFairness,
  get_lane_suggestions: getLaneSuggestions,
  get_backhaul_opportunities: getBackhaulOpportunities,
};
