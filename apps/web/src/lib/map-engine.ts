/**
 * Picks the map renderer. Mapbox GL needs an access token, a hardware WebGL context and CSP
 * access to api.mapbox.com. When any of those is missing (demo builds, old devices, locked-down
 * or headless browsers) maps render with Leaflet and keyless raster tiles instead, which only
 * need `img-src https:`.
 */
import { isDemoActive } from '@/lib/demo/demo-session';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

/** Esri World Dark Gray Canvas — keyless, no watermark (CARTO now stamps "API key required"). */
export const KEYLESS_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
export const KEYLESS_TILE_MAX_NATIVE_ZOOM = 16;
export const KEYLESS_TILE_CREDIT = 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap';
export const MAP_ORANGE = '#e86030';
export const MAP_GROUND = '#181820';

let webGlSupported: boolean | null = null;

/** Mirrors mapboxgl.supported(): software-rendered WebGL counts as unsupported. */
function supportsWebGl(): boolean {
  if (webGlSupported !== null) return webGlSupported;
  try {
    const canvas = document.createElement('canvas');
    const options = { failIfMajorPerformanceCaveat: true };
    webGlSupported = Boolean(
      canvas.getContext('webgl2', options) ?? canvas.getContext('webgl', options),
    );
  } catch {
    webGlSupported = false;
  }
  return webGlSupported;
}

export function hasMapboxToken(): boolean {
  return Boolean(MAPBOX_TOKEN);
}

/** True when maps should render with Leaflet raster tiles instead of Mapbox GL. */
export function isKeylessMapMode(): boolean {
  return isDemoActive() || !hasMapboxToken() || !supportsWebGl();
}

/** Apple-style teardrop pin, shared by the Mapbox and Leaflet renderers. */
export function makePinSvg(fill: string): string {
  return (
    `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<filter id="ps" x="-60%" y="-30%" width="220%" height="200%">` +
    `<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.5)"/>` +
    `</filter>` +
    `<g filter="url(#ps)">` +
    `<path d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 20 10 20S24 19.5 24 12C24 6.477 19.523 2 14 2z" fill="${fill}"/>` +
    `<circle cx="14" cy="12" r="4.5" fill="white" fill-opacity="0.92"/>` +
    `</g></svg>`
  );
}
