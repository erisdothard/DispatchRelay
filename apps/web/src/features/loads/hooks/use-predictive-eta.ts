import { useState, useEffect, useRef } from 'react';
import { calculateETA } from '@/services/eta.service';
import { geocodeCity } from '@/lib/geocoding';
import type { ETAResult } from '@freightx/shared';

interface UsePredictiveETAOptions {
  loadNumber: string | null;
  destCity: string;
  destState: string;
  active: boolean;
}

/**
 * Recalculates ETA on each new live ping (detected via polling).
 * Returns the latest ETA result.
 */
export function usePredictiveETA({
  loadNumber,
  destCity,
  destState,
  active,
}: UsePredictiveETAOptions) {
  const [eta, setEta] = useState<ETAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const destCoordsRef = useRef<[number, number] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Geocode destination once
  useEffect(() => {
    if (!active || !destCity || !destState) return;
    geocodeCity(destCity, destState)
      .then((coords) => {
        destCoordsRef.current = coords;
      })
      .catch(() => undefined);
  }, [active, destCity, destState]);

  // Calculate ETA periodically (every 30s aligning with ping frequency)
  useEffect(() => {
    if (!active || !loadNumber) {
      setEta(null);
      return;
    }

    async function refresh() {
      if (!loadNumber) return;
      // The first run can beat the geocode effect above — resolve the destination here so the
      // ETA shows immediately instead of after the first 30s interval.
      const dest =
        destCoordsRef.current ?? (await geocodeCity(destCity, destState).catch(() => null));
      if (!dest) return;
      destCoordsRef.current = dest;
      setLoading(true);
      try {
        const result = await calculateETA(loadNumber, dest[0], dest[1]);
        setEta(result);
      } catch {
        // Non-fatal — keep previous ETA
      } finally {
        setLoading(false);
      }
    }

    void refresh();
    intervalRef.current = setInterval(refresh, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, loadNumber, destCity, destState]);

  return { eta, loading };
}
