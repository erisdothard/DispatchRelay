/**
 * Keeps demo tracking live: every 30s each in-transit truck advances along its route toward
 * the destination, so maps move and the tracking page never reads "Stale" (> 2 min old).
 */
import { distanceMiles, lookupCity, type LatLng } from '@/lib/us-city-coords';
import { insertRows, readTable } from './demo-db';
import type { Row } from './types';

const TICK_MS = 30_000;
/** ~65 mph over one tick. */
const STEP_MILES = 0.55;
const HIGHWAY_SPEED_MS = 29;
/** Another writer (the driver's own app) pinged this recently — don't double-move the truck. */
const MIN_GAP_MS = 20_000;
/** Close enough to the receiver that the truck should wait for the driver to mark delivery. */
const ARRIVAL_MILES = 3;

let timer: ReturnType<typeof setInterval> | null = null;

function latestPingByLoad(): Map<string, Row> {
  const latest = new Map<string, Row>();
  for (const ping of readTable('location_pings')) {
    const key = String(ping.load_number);
    const current = latest.get(key);
    if (!current || String(ping.recorded_at) > String(current.recorded_at)) latest.set(key, ping);
  }
  return latest;
}

function headingDegrees([lat, lng]: LatLng, [toLat, toLng]: LatLng): number {
  const deg = (Math.atan2(toLng - lng, toLat - lat) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

function tick(): void {
  const now = Date.now();
  const latest = latestPingByLoad();
  const pings: Row[] = [];

  for (const load of readTable('loads')) {
    if (load.status !== 'in_transit') continue;
    const last = latest.get(String(load.load_number));
    if (!last || now - Date.parse(String(last.recorded_at)) < MIN_GAP_MS) continue;
    const dest = lookupCity(String(load.dest_city), String(load.dest_state));
    if (!dest) continue;

    const from: LatLng = [Number(last.latitude), Number(last.longitude)];
    const remaining = distanceMiles(from, dest);
    if (remaining < ARRIVAL_MILES) continue;
    const f = Math.min(1, STEP_MILES / remaining);
    pings.push({
      load_number: load.load_number,
      driver_id: last.driver_id ?? load.assigned_driver_id ?? null,
      latitude: from[0] + (dest[0] - from[0]) * f,
      longitude: from[1] + (dest[1] - from[1]) * f,
      accuracy_m: 10,
      heading_deg: headingDegrees(from, dest),
      speed_ms: HIGHWAY_SPEED_MS,
      recorded_at: new Date(now).toISOString(),
    });
  }

  if (pings.length > 0) insertRows('location_pings', pings);
}

/** Idempotent; browser-only so unit tests and SSR never start a timer. */
export function startDemoSimulator(): void {
  if (timer || typeof window === 'undefined') return;
  tick();
  timer = setInterval(tick, TICK_MS);
}
