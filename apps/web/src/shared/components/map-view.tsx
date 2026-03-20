import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeCity } from '@/lib/geocoding';

// ── Apple-style SVG teardrop pins ────────────────────────────────────────────

function makePinSvg(fill: string) {
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

const originIcon = L.divIcon({
  className: '',
  html: makePinSvg('#22c55e'),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

const destIcon = L.divIcon({
  className: '',
  html: makePinSvg('#e86030'),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

function makeTruckIcon(live: boolean, heading?: number | null) {
  const pulse = live
    ? `<div style="position:absolute;inset:0;border-radius:50%;background:#e86030;` +
      `animation:fx-pulse-ring 1.8s ease-out infinite;pointer-events:none;z-index:0"></div>`
    : '';
  // Direction arrow overlay — only when we have a real heading
  const arrow =
    heading != null
      ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%) rotate(${heading}deg);` +
        `width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;` +
        `border-bottom:9px solid #fff;z-index:2;pointer-events:none"></div>`
      : '';
  return L.divIcon({
    className: '',
    html:
      `<div style="position:relative;width:30px;height:30px">` +
      pulse +
      arrow +
      `<div style="position:relative;z-index:1;width:30px;height:30px;` +
      `background:linear-gradient(145deg,#f07040,#c03a12);border-radius:50%;` +
      `border:2.5px solid #fff;box-shadow:0 4px 16px rgba(232,96,48,.65);` +
      `display:flex;align-items:center;justify-content:center;font-size:14px">🚛</div>` +
      `</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// ── Auto-fit bounds ───────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 10, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [44, 44], animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(positions)]);
  return null;
}

// ── Glass zoom buttons ────────────────────────────────────────────────────────

function ZoomControl() {
  const map = useMapEvents({});
  return (
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
          onClick={() => (i === 0 ? map.zoomIn() : map.zoomOut())}
          style={{
            width: 32,
            height: 32,
            background: 'rgba(14,14,22,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.12)',
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
  );
}

// ── MapView ───────────────────────────────────────────────────────────────────

interface GeofenceCircle {
  lat: number;
  lng: number;
  radiusM: number;
  label?: string;
}

interface MapViewProps {
  origin: { city: string; state: string };
  destination?: { city: string; state: string };
  progress?: number;
  inTransit?: boolean;
  className?: string;
  /** Real GPS position [lat, lng]. When provided, replaces interpolated truck position. */
  livePosition?: [number, number];
  /** Direction of travel in degrees (0–360). Renders an arrow on the truck icon. */
  heading?: number | null;
  /** Breadcrumb trail polyline for route replay */
  breadcrumbTrail?: [number, number][];
  /** Current index into breadcrumb trail for replay snap */
  replayIndex?: number;
  /** Geofence circles to render on the map */
  geofences?: GeofenceCircle[];
}

export function MapView({
  origin,
  destination,
  progress = 0,
  inTransit = false,
  className = 'h-40',
  livePosition,
  heading,
  breadcrumbTrail,
  replayIndex,
  geofences,
}: MapViewProps) {
  const [originPos, setOriginPos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const truckIconRef = useRef(makeTruckIcon(inTransit, heading));

  useEffect(() => {
    truckIconRef.current = makeTruckIcon(inTransit, heading);
  }, [inTransit, heading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [o, d] = await Promise.all([
        geocodeCity(origin.city, origin.state),
        destination ? geocodeCity(destination.city, destination.state) : Promise.resolve(null),
      ]);
      if (!cancelled) {
        setOriginPos(o);
        setDestPos(d);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.city, origin.state, destination?.city, destination?.state]);

  // Shimmer loading skeleton
  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={{ background: '#181820' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'map-shimmer 1.6s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes map-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-white/10 border-t-fx-orange rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!originPos) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl text-xs text-fx-text-dim ${className}`}
        style={{ background: '#181820' }}
      >
        Location unavailable
      </div>
    );
  }

  const positions: [number, number][] = [originPos];
  if (destPos) positions.push(destPos);

  // Prefer real GPS position; fall back to milestone-based interpolation
  const truckPos: [number, number] | null = inTransit
    ? (livePosition ??
      (destPos
        ? [
            originPos[0] + (destPos[0] - originPos[0]) * (progress / 100),
            originPos[1] + (destPos[1] - originPos[1]) * (progress / 100),
          ]
        : null))
    : null;

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <MapContainer
        center={originPos}
        zoom={5}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging
        style={{ height: '100%', width: '100%' }}
      >
        {/* Carto Dark Matter — no API key required */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <FitBounds positions={positions} />
        <ZoomControl />

        {/* Route glow halo */}
        {positions.length === 2 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#e86030',
              weight: 12,
              opacity: 0.15,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
        {/* Route main line */}
        {positions.length === 2 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#e86030',
              weight: 3.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {originPos && <Marker position={originPos} icon={originIcon} />}
        {destPos && <Marker position={destPos} icon={destIcon} />}
        {truckPos && <Marker position={truckPos} icon={truckIconRef.current} />}

        {/* Breadcrumb trail polyline */}
        {breadcrumbTrail && breadcrumbTrail.length > 1 && (
          <Polyline
            positions={breadcrumbTrail}
            pathOptions={{
              color: '#e86030',
              weight: 2.5,
              opacity: 0.7,
              dashArray: '6 4',
              lineCap: 'round',
            }}
          />
        )}

        {/* Replay snap position */}
        {breadcrumbTrail && replayIndex != null && breadcrumbTrail[replayIndex] && (
          <Marker position={breadcrumbTrail[replayIndex]} icon={makeTruckIcon(true)} />
        )}

        {/* Geofence circles */}
        {geofences?.map((gf, i) => (
          <Circle
            key={i}
            center={[gf.lat, gf.lng]}
            radius={gf.radiusM}
            pathOptions={{
              color: '#e86030',
              fillColor: '#e86030',
              fillOpacity: 0.1,
              weight: 1.5,
              opacity: 0.5,
            }}
          />
        ))}
      </MapContainer>

      {/* Live badge */}
      {inTransit && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(14,14,22,0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '4px 10px',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
              display: 'inline-block',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>
      )}

      {/* Attribution (required by Stadia) */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 6,
          zIndex: 1000,
          fontSize: 9,
          color: 'rgba(255,255,255,0.22)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        © Carto · OSM
      </div>
    </div>
  );
}
