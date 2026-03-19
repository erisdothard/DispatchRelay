import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { insertLocationPing } from '../lib/location';

const PING_INTERVAL_MS = 30_000; // 30 seconds
const MOVEMENT_THRESHOLD_M = 50; // 50 metres
const HEARTBEAT_MS = 30_000; // backup heartbeat interval

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
 * Resilience features:
 *   - Re-initialises watchPosition when the tab returns to the foreground
 *   - Backup heartbeat interval forces a getCurrentPosition every 30 s
 *     in case the browser throttled watchPosition while backgrounded
 *   - Failed pings are queued and retried automatically (see location.ts)
 */
export function useDriverLocation({ loadNumber, active }: UseDriverLocationOptions) {
  const { profile } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const lastPingPosRef = useRef<{ lat: number; lng: number } | null>(null);

  /** Send a ping if the time/distance threshold is met. Pass `force` to skip threshold checks. */
  const sendPing = useCallback(
    async (pos: GeolocationPosition, force = false) => {
      if (!profile?.id) return;

      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      const now = Date.now();
      const last = lastPingPosRef.current;

      if (!force) {
        const movedEnough =
          !last || distanceM(last.lat, last.lng, latitude, longitude) >= MOVEMENT_THRESHOLD_M;
        const timeElapsed = now - lastPingTimeRef.current >= PING_INTERVAL_MS;
        if (!movedEnough && !timeElapsed) return;
      }

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

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => void sendPing(pos),
    [sendPing],
  );

  /** Start (or restart) the geolocation watch + heartbeat. */
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) return;

    // Clear any existing watch
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (heartbeatRef.current != null) {
      clearInterval(heartbeatRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    // Backup heartbeat: force a one-shot position every 30 s.
    // Covers the case where the browser suspended watchPosition callbacks.
    heartbeatRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => void sendPing(pos),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 5_000 },
      );
    }, HEARTBEAT_MS);
  }, [handlePosition, sendPing]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatRef.current != null) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    startWatch();

    // When the tab comes back to the foreground, restart the watch and fire
    // an immediate ping so the tracker never looks stale for more than ~30 s.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startWatch();
        // Force an immediate ping so the viewer sees fresh data right away
        navigator.geolocation.getCurrentPosition(
          (pos) => void sendPing(pos, true),
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 0 },
        );
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopWatch();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, startWatch, stopWatch, sendPing]);
}
