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

/**
 * Write a single GPS ping to the location_pings table.
 * Returns the inserted row or null on failure.
 */
export async function insertLocationPing(ping: LocationPing) {
  const { data, error } = await supabase.from('location_pings').insert({
    load_number: ping.load_number,
    driver_id: ping.driver_id,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy_m: ping.accuracy_m ?? null,
    heading_deg: ping.heading_deg != null ? Math.round(ping.heading_deg) : null,
    speed_ms: ping.speed_ms ?? null,
  });

  if (error) {
    return null;
  }

  return data;
}
