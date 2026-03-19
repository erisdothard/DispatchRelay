import { supabase } from '@/lib/supabase';

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

async function flushQueue() {
  if (flushing || pendingQueue.length === 0) return;
  flushing = true;
  while (pendingQueue.length > 0) {
    const ping = pendingQueue[0];
    const { error } = await supabase.from('location_pings').insert({
      load_number: ping.load_number,
      driver_id: ping.driver_id,
      latitude: ping.latitude,
      longitude: ping.longitude,
      accuracy_m: ping.accuracy_m ?? null,
      heading_deg: ping.heading_deg != null ? Math.round(ping.heading_deg) : null,
      speed_ms: ping.speed_ms ?? null,
    });
    if (error) break; // still offline — stop retrying
    pendingQueue.shift();
  }
  flushing = false;
}

// Flush queued pings whenever connectivity returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushQueue());
}

/**
 * Write a single GPS ping to the location_pings table.
 * If the insert fails (e.g. offline), the ping is queued and retried
 * automatically when the browser fires the 'online' event.
 */
export async function insertLocationPing(ping: LocationPing) {
  const row = {
    load_number: ping.load_number,
    driver_id: ping.driver_id,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy_m: ping.accuracy_m ?? null,
    heading_deg: ping.heading_deg != null ? Math.round(ping.heading_deg) : null,
    speed_ms: ping.speed_ms ?? null,
  };

  const { data, error } = await supabase.from('location_pings').insert(row);

  if (error) {
    console.warn('[location-ping] Insert failed, queuing for retry:', error.message);
    pendingQueue.push(ping);
    return null;
  }

  // Successful — also flush any older queued pings
  if (pendingQueue.length > 0) void flushQueue();

  return data;
}
