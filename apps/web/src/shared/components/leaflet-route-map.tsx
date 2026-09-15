/**
 * Keyless route map (Leaflet + CARTO raster tiles). MapView renders this when Mapbox GL can't
 * run — no token, no WebGL, or demo mode — with the same pins, route, trail and controls.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck } from 'lucide-react';
import {
  KEYLESS_TILE_CREDIT,
  KEYLESS_TILE_MAX_NATIVE_ZOOM,
  KEYLESS_TILE_URL,
  MAP_GROUND,
  MAP_ORANGE,
  makePinSvg,
} from '@/lib/map-engine';

type LatLng = [number, number];

export interface RouteGeofence {
  lat: number;
  lng: number;
  radiusM: number;
  label?: string;
}

interface LeafletRouteMapProps {
  originPos: LatLng;
  destPos: LatLng | null;
  truckPos: LatLng | null;
  replayPos: LatLng | null;
  heading?: number | null;
  inTransit: boolean;
  /** A recent GPS ping exists — only then is the LIVE chip shown. */
  live: boolean;
  breadcrumbTrail?: LatLng[];
  geofences?: RouteGeofence[];
  className: string;
}

const GLASS: CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  background: 'rgba(14,14,22,0.72)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.12)',
};

function pinIcon(fill: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: makePinSvg(fill),
    iconSize: [28, 36],
    iconAnchor: [14, 32],
  });
}

function driverIcon(heading: number | null | undefined, pulse: boolean): L.DivIcon {
  const ring = pulse
    ? `<div style="position:absolute;inset:0;border-radius:50%;background:${MAP_ORANGE};` +
      `animation:fx-pulse-ring 1.8s ease-out infinite;pointer-events:none"></div>`
    : '';
  const wedge =
    heading != null
      ? `<path d="M12 12 L8 4 L16 4 Z" fill="${MAP_ORANGE}" opacity="0.7" transform="rotate(${Number(heading)}, 12, 12)"/>`
      : '';
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html:
      `<div style="position:relative;width:30px;height:30px">${ring}` +
      `<svg width="30" height="30" viewBox="0 0 24 24" style="position:relative;z-index:1">${wedge}` +
      `<circle cx="12" cy="12" r="6" fill="${MAP_ORANGE}"/>` +
      `<circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.85)"/></svg></div>`,
  });
}

/** Dark keyless basemap. */
export function KeylessTiles() {
  return (
    <TileLayer url={KEYLESS_TILE_URL} maxNativeZoom={KEYLESS_TILE_MAX_NATIVE_ZOOM} maxZoom={19} />
  );
}

/** Re-measures the map when its container resizes (bottom sheets animate in from 0 height). */
export function LeafletAutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Tile attribution, required by the OSM/CARTO terms. */
export function MapCredit() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 3,
        right: 6,
        zIndex: 1000,
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {KEYLESS_TILE_CREDIT}
    </div>
  );
}

function FitRoute({ origin, dest }: { origin: LatLng; dest: LatLng | null }) {
  const map = useMap();
  const [oLat, oLng] = origin;
  const dLat = dest?.[0];
  const dLng = dest?.[1];
  useEffect(() => {
    if (dLat != null && dLng != null) {
      map.fitBounds(
        L.latLngBounds([
          [oLat, oLng],
          [dLat, dLng],
        ]),
        { padding: [44, 44] },
      );
    } else {
      map.setView([oLat, oLng], 10);
    }
  }, [map, oLat, oLng, dLat, dLng]);
  return null;
}

export function LeafletRouteMap({
  originPos,
  destPos,
  truckPos,
  replayPos,
  heading,
  inTransit,
  live,
  breadcrumbTrail,
  geofences,
  className,
}: LeafletRouteMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const originIcon = useMemo(() => pinIcon('#8E8E93'), []);
  const destIcon = useMemo(() => pinIcon(MAP_ORANGE), []);
  const truckIcon = useMemo(() => driverIcon(heading, inTransit), [heading, inTransit]);
  const replayIcon = useMemo(() => driverIcon(null, true), []);

  const route: LatLng[] = destPos ? [originPos, destPos] : [];
  const trail = breadcrumbTrail && breadcrumbTrail.length > 1 ? breadcrumbTrail : [];

  return (
    <div
      className={`relative z-0 rounded-2xl overflow-hidden ${className}`}
      style={{ background: MAP_GROUND }}
    >
      <MapContainer
        ref={setMap}
        center={originPos}
        zoom={5}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: MAP_GROUND }}
      >
        <KeylessTiles />
        <LeafletAutoResize />
        <FitRoute origin={originPos} dest={destPos} />

        {route.length === 2 && (
          <>
            <Polyline
              positions={route}
              pathOptions={{ color: MAP_ORANGE, weight: 12, opacity: 0.15, lineCap: 'round' }}
            />
            <Polyline
              positions={route}
              pathOptions={{ color: MAP_ORANGE, weight: 3.5, opacity: 0.95, lineJoin: 'round' }}
            />
          </>
        )}

        {trail.length > 1 && (
          <Polyline
            positions={trail}
            pathOptions={{ color: MAP_ORANGE, weight: 2.5, opacity: 0.7, dashArray: '4 6' }}
          />
        )}

        {geofences?.map((gf, i) => (
          <Circle
            key={i}
            center={[gf.lat, gf.lng]}
            radius={gf.radiusM}
            pathOptions={{
              color: MAP_ORANGE,
              weight: 1.5,
              opacity: 0.5,
              fillColor: MAP_ORANGE,
              fillOpacity: 0.1,
            }}
          />
        ))}

        <Marker position={originPos} icon={originIcon} />
        {destPos && <Marker position={destPos} icon={destIcon} />}
        {truckPos && <Marker position={truckPos} icon={truckIcon} />}
        {replayPos && <Marker position={replayPos} icon={replayIcon} />}
      </MapContainer>

      {/* FIND DRIVER — only for a real GPS fix, never an interpolated position */}
      {truckPos && live && (
        <button
          type="button"
          onClick={() => map?.flyTo(truckPos, 13, { duration: 0.8 })}
          style={{
            ...GLASS,
            bottom: 14,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 20,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          <Truck size={13} strokeWidth={2.25} className="text-fx-orange" aria-hidden="true" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            FIND DRIVER
          </span>
        </button>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 12,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {(['+', '−'] as const).map((label, i) => (
          <button
            key={label}
            type="button"
            aria-label={i === 0 ? 'Zoom in' : 'Zoom out'}
            onClick={() => (i === 0 ? map?.zoomIn() : map?.zoomOut())}
            style={{
              ...GLASS,
              position: 'static',
              width: 32,
              height: 32,
              borderRadius: i === 0 ? '10px 10px 4px 4px' : '4px 4px 10px 10px',
              color: '#fff',
              fontSize: 20,
              fontWeight: 300,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {live && (
        <div
          style={{
            ...GLASS,
            top: 10,
            left: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 20,
            padding: '4px 10px',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--fx-success)',
              boxShadow: '0 0 6px var(--fx-success)',
              display: 'inline-block',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>
      )}

      <MapCredit />
    </div>
  );
}
