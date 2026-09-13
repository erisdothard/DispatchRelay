import { supabase } from '@/lib/supabase';
import { getGeofencesForLoad } from '@/services/geofence.service';
import { haversineM } from './geofence';

export interface LocationPing {
  load_number: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  heading_deg?: number;
  speed_ms?: number;
}

/* ── Offline ping queue ─────────────────────────────────── */
const pendingQueue: LocationPing[] = [];
let flushing = false;

function pingToRow(ping: LocationPing) {
  return {
    load_number: ping.load_number,
    driver_id: ping.driver_id,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy_m: ping.accuracy_m ?? null,
    heading_deg: ping.heading_deg != null ? Math.round(ping.heading_deg) : null,
    speed_ms: ping.speed_ms ?? null,
  };
}

/**
 * Flush queued pings in batches of up to 50.
 * Uses Supabase bulk insert (single round-trip) to avoid
 * hammering the DB with 50 individual INSERTs after a dead zone.
 */
async function flushQueue() {
  if (flushing || pendingQueue.length === 0) return;
  flushing = true;

  while (pendingQueue.length > 0) {
    // Take up to 50 pings per batch
    const batchSize = Math.min(pendingQueue.length, 50);
    const batch = pendingQueue.slice(0, batchSize).map(pingToRow);

    const { error } = await supabase.from('location_pings').insert(batch);

    if (error) break; // still offline — stop retrying

    // Remove successfully inserted pings
    pendingQueue.splice(0, batchSize);
  }

  flushing = false;
}

// Flush queued pings whenever connectivity returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushQueue());
}

/* ── Client-side rate limiting ──────────────────────────── */
const MIN_PING_INTERVAL_MS = 5_000; // 5 seconds minimum between pings per driver
const lastPingByDriver = new Map<string, number>();

/**
 * Write a single GPS ping to the location_pings table.
 * Rate-limited to 1 ping per 5 seconds per driver.
 * If the insert fails (e.g. offline), the ping is queued and retried
 * automatically when the browser fires the 'online' event.
 */
export async function insertLocationPing(ping: LocationPing) {
  // Enforce minimum interval per driver
  const lastTime = lastPingByDriver.get(ping.driver_id) ?? 0;
  const now = Date.now();
  if (now - lastTime < MIN_PING_INTERVAL_MS) {
    return null; // Rate limited — skip this ping
  }
  lastPingByDriver.set(ping.driver_id, now);

  const { data, error } = await supabase.from('location_pings').insert(pingToRow(ping));

  if (error) {
    console.warn('[location-ping] Insert failed, queuing for retry:', error.message);
    pendingQueue.push(ping);
    return null;
  }

  // Successful — also flush any older queued pings
  if (pendingQueue.length > 0) void flushQueue();

  return data;
}

/* ── Latest known position ─────────────────────────────── */

export interface LoadPosition {
  lat: number;
  lng: number;
  recordedAt: string;
}

/** The most recent ping recorded for a load, or null if it has never reported. */
export async function getLatestLoadPing(loadNumber: string): Promise<LoadPosition | null> {
  const { data } = await supabase
    .from('location_pings')
    .select('latitude, longitude, recorded_at')
    .eq('load_number', loadNumber)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { lat: data.latitude, lng: data.longitude, recordedAt: data.recorded_at } : null;
}

/* ── Demo-mode position simulation ─────────────────────── */

const DEMO_SPEED_MS = 26; // ~58 mph
const DEMO_STOP_BUFFER_M = 2_000; // park short of the delivery geofence

function bearingDeg(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

/**
 * Demo walkthroughs never read the viewer's device GPS. Instead, advance the load's latest
 * ping toward its delivery stop so tracking views keep moving as if the truck were live.
 */
export async function simulateDemoPing(loadNumber: string, driverId: string, elapsedS: number) {
  const last = await getLatestLoadPing(loadNumber);
  if (!last) return null;

  const dest = (await getGeofencesForLoad(loadNumber)).find((f) => f.stopType === 'delivery');
  const remainingM = dest ? haversineM(last.lat, last.lng, dest.lat, dest.lng) : 0;
  const moving = !!dest && remainingM > DEMO_STOP_BUFFER_M;
  const fraction = moving
    ? Math.min((DEMO_SPEED_MS * elapsedS) / remainingM, 1 - DEMO_STOP_BUFFER_M / remainingM)
    : 0;
  const next = dest
    ? {
        lat: last.lat + (dest.lat - last.lat) * fraction,
        lng: last.lng + (dest.lng - last.lng) * fraction,
      }
    : last;

  return insertLocationPing({
    load_number: loadNumber,
    driver_id: driverId,
    latitude: Number(next.lat.toFixed(5)),
    longitude: Number(next.lng.toFixed(5)),
    accuracy_m: 8,
    heading_deg: dest && moving ? bearingDeg(last, dest) : undefined,
    speed_ms: moving ? DEMO_SPEED_MS : 0,
  });
}
