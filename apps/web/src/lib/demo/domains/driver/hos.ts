/**
 * Hours of Service for the demo drivers: a week of ELD duty history laid out backwards from
 * "now", plus the Postgres functions that read and change duty status.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoContext, DemoDb, DemoHandler, Row } from '../../types';
import { CITY_COORDS, describeNear, latestPingFor } from './geo';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type HosStatusKey = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';

const REST: ReadonlySet<string> = new Set(['off_duty', 'sleeper_berth']);
const ON_DUTY: ReadonlySet<string> = new Set(['driving', 'on_duty_not_driving']);

/** Profile `duty_status` enum ↔ ELD `hos_duty_status` enum. */
const TO_PROFILE_STATUS: Record<HosStatusKey, string> = {
  driving: 'driving',
  on_duty_not_driving: 'on_duty',
  sleeper_berth: 'sleeper',
  off_duty: 'off_duty',
};
const FROM_PROFILE_STATUS: Record<string, HosStatusKey> = {
  driving: 'driving',
  on_duty: 'on_duty_not_driving',
  sleeper: 'sleeper_berth',
  off_duty: 'off_duty',
};

/** Local calendar date (YYYY-MM-DD) for an epoch timestamp. */
export function localDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-CA');
}

// ── Seed plan ────────────────────────────────────────

interface PlanSegment {
  status: HosStatusKey;
  hours: number;
  place: string;
  city: string;
  notes?: string;
  /** Lets other seeds (receipts, geofence dwell, breadcrumbs) line up with this log. */
  tag?: string;
}

const seg = (
  status: HosStatusKey,
  hours: number,
  place: string,
  city: string,
  notes?: string,
  tag?: string,
): PlanSegment => ({ status, hours, place, city, notes, tag });

const YARD = 'Rivera Transport yard — Nashville, TN';
const HOME = 'Home — Nashville, TN';
const PRE_TRIP = 'Pre-trip inspection';
const BREAK = '30-minute break';

/** Carlos Mendez, oldest first. The last segment is still open (he's driving DR-1042 now). */
const CARLOS_PLAN: readonly PlanSegment[] = [
  seg('off_duty', 10, HOME, 'Nashville'),
  // Local turn to Chattanooga
  seg('on_duty_not_driving', 0.5, YARD, 'Nashville', PRE_TRIP),
  seg('driving', 2.5, 'Nashville, TN', 'Nashville'),
  seg(
    'on_duty_not_driving',
    1,
    'Customer dock — Chattanooga, TN',
    'Chattanooga',
    'Unloading — driver assist',
  ),
  seg('driving', 2.5, 'Chattanooga, TN', 'Chattanooga'),
  seg('on_duty_not_driving', 0.5, YARD, 'Nashville', 'Post-trip inspection', 'maintenance'),
  seg('off_duty', 14.5, HOME, 'Nashville'),
  // Deadhead north and pick up DR-1049
  seg('on_duty_not_driving', 0.5, YARD, 'Nashville', PRE_TRIP),
  seg('driving', 3, 'Nashville, TN', 'Nashville'),
  seg(
    'off_duty',
    0.5,
    "Love's Travel Stop — Louisville, KY",
    'Louisville',
    BREAK,
    'fuel-louisville',
  ),
  seg('driving', 6.5, 'Louisville, KY', 'Louisville'),
  seg(
    'on_duty_not_driving',
    1.5,
    'Detroit Distribution Center — Detroit, MI',
    'Detroit',
    'Loading DR-1049 — 22 pallets',
    'pickup-DR-1049',
  ),
  seg('off_duty', 2, 'TA Travel Center — Detroit, MI', 'Detroit', undefined, 'parking-detroit'),
  seg('sleeper_berth', 10, 'TA Travel Center — Detroit, MI', 'Detroit'),
  // Deliver DR-1049, run home
  seg('on_duty_not_driving', 0.5, 'TA Travel Center — Detroit, MI', 'Detroit', PRE_TRIP),
  seg('driving', 4.5, 'Detroit, MI', 'Detroit', 'DR-1049 → Indianapolis, IN', 'transit-DR-1049'),
  seg(
    'on_duty_not_driving',
    1.5,
    'Indianapolis Receiving — Indianapolis, IN',
    'Indianapolis',
    'Unloading DR-1049 · POD signed',
    'delivery-DR-1049',
  ),
  seg('driving', 2, 'Indianapolis, IN', 'Indianapolis'),
  seg('off_duty', 0.5, 'Pilot Travel Center — Louisville, KY', 'Louisville', BREAK),
  seg('driving', 3, 'Louisville, KY', 'Louisville'),
  seg('on_duty_not_driving', 0.5, YARD, 'Nashville', 'Post-trip inspection'),
  seg('off_duty', 36, HOME, 'Nashville', '34-hour restart'),
  // Pick up DR-1042 in Atlanta
  seg('on_duty_not_driving', 0.5, YARD, 'Nashville', PRE_TRIP),
  seg('driving', 4, 'Nashville, TN', 'Nashville'),
  seg(
    'on_duty_not_driving',
    1.5,
    'Atlanta Distribution Center — Atlanta, GA',
    'Atlanta',
    'Loading DR-1042 — 24 pallets, BOL received',
    'pickup-DR-1042',
  ),
  seg('driving', 2.5, 'Atlanta, GA', 'Atlanta', 'DR-1042 → Dallas, TX'),
  seg(
    'off_duty',
    0.5,
    "Love's Travel Stop — Birmingham, AL",
    'Birmingham',
    BREAK,
    'meal-birmingham',
  ),
  seg('driving', 4, 'Birmingham, AL', 'Birmingham'),
  seg(
    'on_duty_not_driving',
    0.5,
    'Pilot Travel Center — Jackson, MS',
    'Jackson',
    'Fuel + post-trip inspection',
    'fuel-jackson',
  ),
  seg('off_duty', 3, 'Pilot Travel Center — Jackson, MS', 'Jackson'),
  seg('sleeper_berth', 10, 'Pilot Travel Center — Jackson, MS', 'Jackson'),
  // Today
  seg('on_duty_not_driving', 0.5, 'Pilot Travel Center — Jackson, MS', 'Jackson', PRE_TRIP),
  seg('driving', 4, 'Jackson, MS', 'Jackson', 'DR-1042 → Dallas, TX'),
  seg('off_duty', 0.5, "Love's Travel Stop — Shreveport, LA", 'Shreveport', BREAK),
  // Open segment — `hours` is time elapsed so far (matches profile.duty_status_updated_at).
  seg('driving', 3, 'Shreveport, LA', 'Shreveport', 'DR-1042 → Dallas, TX'),
];

/**
 * Mike Johnson: loaded DR-1051 in San Antonio this morning (1.5h detention at the dock),
 * now running I-10 east past Beaumont. The last segment is still open.
 */
const MIKE_PLAN: readonly PlanSegment[] = [
  seg('off_duty', 4, 'Pilot Travel Center — San Antonio, TX', 'San Antonio'),
  seg('sleeper_berth', 9, 'Pilot Travel Center — San Antonio, TX', 'San Antonio'),
  seg('on_duty_not_driving', 0.5, 'Pilot Travel Center — San Antonio, TX', 'San Antonio', PRE_TRIP),
  seg(
    'on_duty_not_driving',
    1.5,
    'San Antonio Distribution Center — San Antonio, TX',
    'San Antonio',
    'Loading DR-1051 — 24 pallets (1.5h detention)',
  ),
  seg('driving', 3.5, 'San Antonio, TX', 'San Antonio', 'DR-1051 → New Orleans, LA'),
  seg('off_duty', 0.5, "Buc-ee's — Baytown, TX", 'Houston', BREAK),
  // Open segment — `hours` is time elapsed so far (matches profile.duty_status_updated_at).
  seg('driving', 2.5, 'Houston, TX', 'Houston', 'DR-1051 → New Orleans, LA'),
];

export interface PlacedSegment extends PlanSegment {
  start: number;
  end: number | null;
}

/** Lays a plan out in time so its final (open) segment started `hours` ago. */
function layout(plan: readonly PlanSegment[]): PlacedSegment[] {
  const now = Date.now();
  const current = plan[plan.length - 1];
  if (!current) return [];
  const closedHours = plan.slice(0, -1).reduce((sum, s) => sum + s.hours, 0);
  let cursor = now - (current.hours + closedHours) * HOUR_MS;
  return plan.map((s, i) => {
    const start = cursor;
    const isOpen = i === plan.length - 1;
    cursor += s.hours * HOUR_MS;
    return { ...s, start, end: isOpen ? null : cursor };
  });
}

export function layoutCarlosPlan(): PlacedSegment[] {
  return layout(CARLOS_PLAN);
}

/** Start/end of the Carlos segment carrying `tag` — keeps receipts and dwell records in sync. */
export function carlosWindow(tag: string): { start: number; end: number } {
  const found = layoutCarlosPlan().find((s) => s.tag === tag);
  const start = found?.start ?? Date.now() - DAY_MS;
  return { start, end: found?.end ?? start + HOUR_MS };
}

function logRows(driverId: string, plan: readonly PlanSegment[], odometerStart: number): Row[] {
  let odometer = odometerStart;
  return layout(plan).map((s, i) => {
    const coords = CITY_COORDS[s.city];
    const row: Row = {
      id: `hos-${driverId}-${String(i + 1).padStart(2, '0')}`,
      driver_id: driverId,
      status: s.status,
      started_at: new Date(s.start).toISOString(),
      ended_at: s.end === null ? null : new Date(s.end).toISOString(),
      duration_minutes: s.end === null ? null : Math.round((s.end - s.start) / 60_000),
      location_lat: coords?.lat ?? null,
      location_lng: coords?.lng ?? null,
      location_description: s.place,
      odometer_miles: Math.round(odometer),
      vehicle_id: null,
      source: 'eld',
      notes: s.notes ?? null,
      created_at: new Date(s.start).toISOString(),
    };
    if (s.status === 'driving') odometer += s.hours * 54;
    return row;
  });
}

function violation(
  id: string,
  type: string,
  hours: number,
  severity: string,
  description: string,
  resolved: boolean,
): Row {
  return {
    id,
    driver_id: DEMO_IDS.driver,
    violation_type: type,
    violation_date: hoursAgo(hours),
    description,
    duty_log_id: null,
    severity,
    resolved,
    resolved_by: resolved ? DEMO_IDS.carrier : null,
    resolved_at: resolved ? hoursAgo(hours - 20) : null,
    created_at: hoursAgo(hours),
  };
}

const VIOLATIONS: Row[] = [
  violation(
    'hosv-001',
    'missing_certification',
    70,
    'info',
    'Duty log for the DR-1049 delivery day has not been certified. Review and sign the log.',
    false,
  ),
  violation(
    'hosv-002',
    '30_minute_break',
    24 * 9,
    'warning',
    'Drove 8h 20m before taking a 30-minute break (I-75 near Toledo, OH). Break was taken 20 minutes late.',
    true,
  ),
];

// ── HOS math ─────────────────────────────────────────

interface Span {
  status: string;
  start: number;
  end: number;
}

function spansFor(db: DemoDb, driverId: string, now: number): Span[] {
  return db
    .read('hos_duty_log')
    .filter((r) => r.driver_id === driverId)
    .map((r) => ({
      status: String(r.status),
      start: Date.parse(String(r.started_at)),
      end: r.ended_at ? Date.parse(String(r.ended_at)) : now,
    }))
    .filter((s) => Number.isFinite(s.start))
    .sort((a, b) => a.start - b.start);
}

/** Minutes of `statuses` overlapping [from, to). */
function minutesWithin(
  spans: Span[],
  statuses: ReadonlySet<string>,
  from: number,
  to: number,
): number {
  return spans.reduce((sum, s) => {
    if (!statuses.has(s.status)) return sum;
    const overlap = Math.min(s.end, to) - Math.max(s.start, from);
    return overlap > 0 ? sum + overlap / 60_000 : sum;
  }, 0);
}

/** End of the latest unbroken run of `qualifying` statuses lasting at least `minHours`. */
function lastRunEnd(
  spans: Span[],
  qualifying: (status: string) => boolean,
  minHours: number,
): number | null {
  let runEnd: number | null = null;
  let runMs = 0;
  for (let i = spans.length - 1; i >= 0; i -= 1) {
    const s = spans[i]!;
    if (!qualifying(s.status)) {
      runEnd = null;
      runMs = 0;
      continue;
    }
    runEnd ??= s.end;
    runMs += s.end - s.start;
    if (runMs >= minHours * HOUR_MS) return runEnd;
  }
  return null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeHosStatus(db: DemoDb, driverId: string): Row | null {
  const now = Date.now();
  const spans = spansFor(db, driverId, now);
  const current = spans[spans.length - 1];
  if (!current) return null;

  const isRest = (status: string) => REST.has(status);
  const shiftStart = lastRunEnd(spans, isRest, 10) ?? now - 14 * HOUR_MS;
  const breakEnd = Math.max(
    lastRunEnd(spans, (st) => st !== 'driving', 0.5) ?? shiftStart,
    shiftStart,
  );
  const cycleStart = Math.max(lastRunEnd(spans, isRest, 34) ?? 0, now - 8 * DAY_MS);
  const driving = new Set(['driving']);

  const driveSinceBreak = minutesWithin(spans, driving, breakEnd, now) / 60;
  return {
    driver_id: driverId,
    current_status: current.status,
    status_since: new Date(current.start).toISOString(),
    drive_hours_today: round1(minutesWithin(spans, driving, shiftStart, now) / 60),
    on_duty_hours_today: round1(minutesWithin(spans, ON_DUTY, shiftStart, now) / 60),
    hours_until_break: round1(Math.max(0, 8 - driveSinceBreak)),
    weekly_hours: round1(minutesWithin(spans, ON_DUTY, cycleStart, now) / 60),
    weekly_limit: 70,
    cycle_type: '70_hour_8_day',
  };
}

function dailySummary(db: DemoDb, driverId: string, logDate: string): Row {
  const dayStart = new Date(`${logDate}T00:00:00`).getTime();
  const dayEnd = Math.min(dayStart + DAY_MS, Date.now());
  const spans = spansFor(db, driverId, Date.now());
  const mins = (status: string) =>
    Math.round(minutesWithin(spans, new Set([status]), dayStart, dayEnd));
  const driving = mins('driving');
  return {
    driver_id: driverId,
    log_date: logDate,
    driving_minutes: driving,
    on_duty_minutes: mins('on_duty_not_driving'),
    sleeper_minutes: mins('sleeper_berth'),
    off_duty_minutes: mins('off_duty'),
    total_miles: Math.round((driving / 60) * 54),
    violations_count: db
      .read('hos_violations')
      .filter(
        (v) =>
          v.driver_id === driverId && localDate(Date.parse(String(v.violation_date))) === logDate,
      ).length,
  };
}

function summaryRows(db: DemoDb, driverId: string): Row[] {
  return Array.from({ length: 7 }, (_, i) => localDate(Date.now() - i * DAY_MS)).map((date) => ({
    id: `hosd-${driverId}-${date}`,
    created_at: new Date().toISOString(),
    ...dailySummary(db, driverId, date),
  }));
}

// ── Postgres functions ───────────────────────────────

function requireDriver(args: Row, ctx: DemoContext): string {
  const driverId = typeof args.p_driver_id === 'string' ? args.p_driver_id : ctx.identity?.id;
  if (!driverId) throw new Error('Sign in to update duty status.');
  return driverId;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

interface TransitionInput {
  lat: number | null;
  lng: number | null;
  description: string | null;
  odometer: number | null;
  notes: string | null;
}

function recordTransition(
  db: DemoDb,
  driverId: string,
  status: HosStatusKey,
  input: TransitionInput,
): string | null {
  const now = new Date();
  const before = computeHosStatus(db, driverId);
  if (before?.current_status === status) return null;

  db.read('hos_duty_log')
    .filter((r) => r.driver_id === driverId && r.ended_at === null)
    .forEach((open) => {
      const minutes = Math.round((now.getTime() - Date.parse(String(open.started_at))) / 60_000);
      db.update('hos_duty_log', (r) => r.id === open.id, {
        ended_at: now.toISOString(),
        duration_minutes: Math.max(0, minutes),
      });
    });

  // No device fix (desktop / denied permission): fall back to the driver's latest ping.
  const fix =
    input.lat !== null && input.lng !== null
      ? { lat: input.lat, lng: input.lng }
      : latestPingFor(db, driverId);
  const [created] = db.insert('hos_duty_log', [
    {
      driver_id: driverId,
      status,
      started_at: now.toISOString(),
      ended_at: null,
      duration_minutes: null,
      location_lat: fix?.lat ?? null,
      location_lng: fix?.lng ?? null,
      location_description: input.description ?? (fix ? describeNear(fix) : null),
      odometer_miles: input.odometer,
      vehicle_id: null,
      source: 'manual',
      notes: input.notes,
    },
  ]);

  if (status === 'driving' && before && Number(before.drive_hours_today) >= 11) {
    db.insert('hos_violations', [
      {
        driver_id: driverId,
        violation_type: '11_hour_driving_limit',
        violation_date: now.toISOString(),
        description: `Resumed driving with ${String(before.drive_hours_today)}h already driven this shift (limit 11h).`,
        duty_log_id: created?.id ?? null,
        severity: 'critical',
        resolved: false,
        resolved_by: null,
        resolved_at: null,
      },
    ]);
  }

  db.update('profiles', (p) => p.id === driverId, {
    current_duty_status: TO_PROFILE_STATUS[status],
    duty_status_updated_at: now.toISOString(),
    updated_at: now.toISOString(),
  });
  return typeof created?.id === 'string' ? created.id : null;
}

function isHosStatus(value: unknown): value is HosStatusKey {
  return typeof value === 'string' && value in TO_PROFILE_STATUS;
}

export const HOS_RPC: Record<string, DemoHandler> = {
  get_driver_hos_status: (args, ctx) => computeHosStatus(ctx.db, requireDriver(args, ctx)),
  log_duty_transition: (args, ctx) => {
    if (!isHosStatus(args.p_new_status)) throw new Error('Unknown duty status.');
    return recordTransition(ctx.db, requireDriver(args, ctx), args.p_new_status, {
      lat: numberOrNull(args.p_location_lat),
      lng: numberOrNull(args.p_location_lng),
      description:
        typeof args.p_location_description === 'string' ? args.p_location_description : null,
      odometer: numberOrNull(args.p_odometer ?? args.p_odometer_miles),
      notes: typeof args.p_notes === 'string' ? args.p_notes : null,
    });
  },
  set_driver_duty_status: (args, ctx) => {
    const status = FROM_PROFILE_STATUS[String(args.p_duty_status)];
    if (!status) throw new Error('Unknown duty status.');
    recordTransition(ctx.db, requireDriver(args, ctx), status, {
      lat: null,
      lng: null,
      description: null,
      odometer: null,
      notes: null,
    });
    return null;
  },
  aggregate_hos_daily: (args, ctx) => {
    const driverId = requireDriver(args, ctx);
    const logDate = typeof args.p_log_date === 'string' ? args.p_log_date : localDate(Date.now());
    const summary = dailySummary(ctx.db, driverId, logDate);
    const match = (r: Row) => r.driver_id === driverId && r.log_date === logDate;
    const [saved] = ctx.db.read('hos_daily_summary').some(match)
      ? ctx.db.update('hos_daily_summary', match, summary)
      : ctx.db.insert('hos_daily_summary', [summary]);
    const toHours = (minutes: unknown) => round1(Number(minutes ?? 0) / 60);
    return [
      {
        id: saved?.id ?? null,
        driver_id: driverId,
        log_date: logDate,
        drive_hours: toHours(summary.driving_minutes),
        on_duty_hours: toHours(summary.on_duty_minutes),
        off_duty_hours: toHours(summary.off_duty_minutes),
        sleeper_hours: toHours(summary.sleeper_minutes),
      },
    ];
  },
};

/** Duty log + violations. Daily summaries are derived from the log after it's built. */
export function hosSeeds(): Record<string, Row[]> {
  const dutyLog = [
    ...logRows(DEMO_IDS.driver, CARLOS_PLAN, 412_380),
    ...logRows(DEMO_IDS.driver2, MIKE_PLAN, 288_914),
  ];
  const scratch: DemoDb = {
    read: (table) =>
      table === 'hos_duty_log' ? dutyLog : table === 'hos_violations' ? VIOLATIONS : [],
    insert: () => [],
    update: () => [],
    remove: () => [],
  };
  return {
    hos_duty_log: dutyLog,
    hos_violations: VIOLATIONS,
    hos_daily_summary: [
      ...summaryRows(scratch, DEMO_IDS.driver),
      ...summaryRows(scratch, DEMO_IDS.driver2),
    ],
  };
}
