import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { insertLocationPing } from '../lib/location';

const PING_INTERVAL_MS = 30_000; // 30 seconds
const MOVEMENT_THRESHOLD_M = 50; // 50 metres

/** Haversine distance in metres between two lat/lng pairs. */
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseDriverLocationOptions {
  loadNumber: string;
  /** Hook only activates when this is true (i.e. load status === 'in_transit'). */
  active: boolean;
}

/**
 * Watches the driver's position using the Web Geolocation API.
 * Writes a ping to Supabase whenever:
 *   - 30 seconds have elapsed, OR
 *   - the driver has moved ≥50 m since the last ping
 *
 * Automatically stops watching when `active` becomes false or the component unmounts.
 */
export function useDriverLocation({ loadNumber, active }: UseDriverLocationOptions) {
  const { profile } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const lastPingPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const handlePosition = useCallback(
    async (pos: GeolocationPosition) => {
      if (!profile?.id) return;

      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      const now = Date.now();
      const last = lastPingPosRef.current;

      const movedEnough =
        !last || distanceM(last.lat, last.lng, latitude, longitude) >= MOVEMENT_THRESHOLD_M;
      const timeElapsed = now - lastPingTimeRef.current >= PING_INTERVAL_MS;

      if (!movedEnough && !timeElapsed) return;

      lastPingTimeRef.current = now;
      lastPingPosRef.current = { lat: latitude, lng: longitude };

      await insertLocationPing({
        load_number: loadNumber,
        driver_id: profile.id,
        latitude,
        longitude,
        accuracy_m: accuracy != null ? Math.round(accuracy) : undefined,
        heading_deg: heading != null ? heading : undefined,
        speed_ms: speed != null ? speed : undefined,
      });
    },
    [loadNumber, profile?.id],
  );

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, handlePosition]);
}
