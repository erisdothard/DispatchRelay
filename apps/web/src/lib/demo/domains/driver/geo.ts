/** Coordinates and lookups shared by the driver demo seeds (HOS locations, geofences, trails). */
import type { DemoDb, Row } from '../../types';

export interface LatLng {
  lat: number;
  lng: number;
}

/** City centres for every lane in the demo load board, plus the truck-stop towns on those lanes. */
export const CITY_COORDS: Record<string, LatLng & { state: string }> = {
  Atlanta: { lat: 33.749, lng: -84.388, state: 'GA' },
  Dallas: { lat: 32.7767, lng: -96.797, state: 'TX' },
  Nashville: { lat: 36.1627, lng: -86.7816, state: 'TN' },
  Chicago: { lat: 41.8781, lng: -87.6298, state: 'IL' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, state: 'CA' },
  Phoenix: { lat: 33.4484, lng: -112.074, state: 'AZ' },
  Miami: { lat: 25.7617, lng: -80.1918, state: 'FL' },
  Charlotte: { lat: 35.2271, lng: -80.8431, state: 'NC' },
  Houston: { lat: 29.7604, lng: -95.3698, state: 'TX' },
  Memphis: { lat: 35.1495, lng: -90.049, state: 'TN' },
  Seattle: { lat: 47.6062, lng: -122.3321, state: 'WA' },
  Portland: { lat: 45.5152, lng: -122.6784, state: 'OR' },
  Denver: { lat: 39.7392, lng: -104.9903, state: 'CO' },
  'Kansas City': { lat: 39.0997, lng: -94.5786, state: 'MO' },
  Detroit: { lat: 42.3314, lng: -83.0458, state: 'MI' },
  Indianapolis: { lat: 39.7684, lng: -86.1581, state: 'IN' },
  Jacksonville: { lat: 30.3322, lng: -81.6557, state: 'FL' },
  Savannah: { lat: 32.0809, lng: -81.0912, state: 'GA' },
  'San Antonio': { lat: 29.4241, lng: -98.4936, state: 'TX' },
  'New Orleans': { lat: 29.9511, lng: -90.0715, state: 'LA' },
  Birmingham: { lat: 33.5207, lng: -86.8025, state: 'AL' },
  Jackson: { lat: 32.2988, lng: -90.1848, state: 'MS' },
  Shreveport: { lat: 32.5252, lng: -93.7502, state: 'LA' },
  Longview: { lat: 32.5007, lng: -94.7405, state: 'TX' },
  Louisville: { lat: 38.2527, lng: -85.7585, state: 'KY' },
  Toledo: { lat: 41.6528, lng: -83.5379, state: 'OH' },
  Columbus: { lat: 39.9612, lng: -82.9988, state: 'OH' },
  Chattanooga: { lat: 35.0456, lng: -85.3097, state: 'TN' },
};

export function cityLabel(city: string): string {
  const coords = CITY_COORDS[city];
  return coords ? `${city}, ${coords.state}` : city;
}

/** Haversine distance in metres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** "near Longview, TX" for the closest known city to a coordinate. */
export function describeNear(point: LatLng): string {
  const [closest] = Object.entries(CITY_COORDS)
    .map(([city, coords]) => ({ city, km: distanceM(point, coords) / 1000 }))
    .sort((a, b) => a.km - b.km);
  if (!closest) return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  return closest.km < 8 ? cityLabel(closest.city) : `near ${cityLabel(closest.city)}`;
}

/** The newest GPS ping a driver has sent — the demo stand-in for a live device fix. */
export function latestPingFor(db: DemoDb, driverId: string): LatLng | null {
  const newest = db
    .read('location_pings')
    .filter((p) => p.driver_id === driverId)
    .reduce<Row | null>(
      (best, p) => (!best || String(p.recorded_at) > String(best.recorded_at) ? p : best),
      null,
    );
  if (!newest) return null;
  return { lat: Number(newest.latitude), lng: Number(newest.longitude) };
}
