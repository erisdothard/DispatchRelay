/**
 * Live fleet map of driver GPS pins. Uses Mapbox GL when available, otherwise Leaflet with
 * keyless raster tiles (see lib/map-engine). Parents call `fitAll()` through the ref.
 */
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import MapGL, { Marker as GlMarker, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapContainer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_GROUND, isKeylessMapMode } from '@/lib/map-engine';
import { KeylessTiles, LeafletAutoResize, MapCredit } from './leaflet-route-map';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const CONUS_CENTER: [number, number] = [39.8283, -98.5795];
const CONUS_ZOOM = 3.8;
const SINGLE_PIN_ZOOM = 10;
const MAX_FIT_ZOOM = 12;

export interface DriverPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  /** On an in-transit load (orange) vs. sharing GPS off-load (neutral grey). */
  onLoad: boolean;
}

export interface DriverMapHandle {
  fitAll: () => void;
}

interface DriverMapProps {
  pins: DriverPin[];
  onSelect: (driverId: string) => void;
  ref?: Ref<DriverMapHandle>;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const pinColor = (onLoad: boolean) => (onLoad ? '#e86030' : '#8E8E93');

function bounds(pins: DriverPin[]) {
  const lats = pins.map((p) => p.latitude);
  const lngs = pins.map((p) => p.longitude);
  return {
    south: Math.min(...lats),
    north: Math.max(...lats),
    west: Math.min(...lngs),
    east: Math.max(...lngs),
  };
}

/* ── Mapbox GL ───────────────────────────────────────────────────── */

function LiveDriverPin({ pin }: { pin: DriverPin }) {
  const color = pinColor(pin.onLoad);
  return (
    <div style={{ position: 'relative', width: 44, height: 44, cursor: 'pointer' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          animation: 'fx-pulse-ring 1.8s ease-out infinite',
          pointerEvents: 'none',
        }}
      />
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        {pin.heading != null && (
          <path
            d="M22 22 L16 8 L28 8 Z"
            fill={color}
            opacity="0.65"
            transform={`rotate(${pin.heading}, 22, 22)`}
          />
        )}
        <circle cx="22" cy="22" r="16" fill={color} stroke="white" strokeWidth="2.5" />
        <text
          x="22"
          y="27"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {initialsOf(pin.name)}
        </text>
      </svg>
    </div>
  );
}

function fitMapbox(map: MapRef | null, pins: DriverPin[]): void {
  if (!map || pins.length === 0) return;
  if (pins.length === 1) {
    map.flyTo({
      center: [pins[0].longitude, pins[0].latitude],
      zoom: SINGLE_PIN_ZOOM,
      duration: 800,
    });
    return;
  }
  const b = bounds(pins);
  map.fitBounds(
    [
      [b.west, b.south],
      [b.east, b.north],
    ],
    { padding: 60, duration: 800, maxZoom: MAX_FIT_ZOOM },
  );
}

function MapboxDriverMap({ pins, onSelect, ref }: DriverMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);

  useImperativeHandle(ref, () => ({ fitAll: () => fitMapbox(mapRef.current, pins) }), [pins]);

  const pinKey = pins.map((p) => p.id).join(',');
  useEffect(() => {
    if (loaded) fitMapbox(mapRef.current, pins);
    // Refit when the set of drivers changes, not on every GPS tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, pinKey]);

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      initialViewState={{ longitude: CONUS_CENTER[1], latitude: CONUS_CENTER[0], zoom: CONUS_ZOOM }}
      scrollZoom
      dragPan
      attributionControl={false}
      logoPosition="top-right"
      onLoad={() => setLoaded(true)}
      style={{ height: '100%', width: '100%' }}
    >
      {pins.map((pin) => (
        <GlMarker
          key={pin.id}
          longitude={pin.longitude}
          latitude={pin.latitude}
          anchor="center"
          onClick={() => onSelect(pin.id)}
        >
          <LiveDriverPin pin={pin} />
        </GlMarker>
      ))}
    </MapGL>
  );
}

/* ── Leaflet (keyless) ───────────────────────────────────────────── */

function leafletPinIcon(pin: DriverPin): L.DivIcon {
  const color = pinColor(pin.onLoad);
  // Initials are interpolated into HTML — keep only safe characters.
  const initials = initialsOf(pin.name).replace(/[^A-Z0-9]/g, '');
  const wedge =
    pin.heading != null
      ? `<path d="M22 22 L16 8 L28 8 Z" fill="${color}" opacity="0.65" transform="rotate(${Number(pin.heading)}, 22, 22)"/>`
      : '';
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html:
      `<div style="position:relative;width:44px;height:44px;cursor:pointer">` +
      `<div style="position:absolute;inset:0;border-radius:50%;background:${color};` +
      `animation:fx-pulse-ring 1.8s ease-out infinite;pointer-events:none"></div>` +
      `<svg width="44" height="44" viewBox="0 0 44 44" style="position:absolute;inset:0;z-index:1">${wedge}` +
      `<circle cx="22" cy="22" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>` +
      `<text x="22" y="27" text-anchor="middle" fill="white" font-size="11" font-weight="700" ` +
      `font-family="system-ui, sans-serif">${initials}</text></svg></div>`,
  });
}

function fitLeaflet(map: L.Map | null, pins: DriverPin[]): void {
  if (!map || pins.length === 0) return;
  if (pins.length === 1) {
    map.flyTo([pins[0].latitude, pins[0].longitude], SINGLE_PIN_ZOOM, { duration: 0.8 });
    return;
  }
  map.fitBounds(L.latLngBounds(pins.map((p): [number, number] => [p.latitude, p.longitude])), {
    padding: [60, 60],
    maxZoom: MAX_FIT_ZOOM,
  });
}

function LeafletDriverMap({ pins, onSelect, ref }: DriverMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);

  useImperativeHandle(ref, () => ({ fitAll: () => fitLeaflet(map, pins) }), [map, pins]);

  const pinKey = pins.map((p) => p.id).join(',');
  useEffect(() => {
    fitLeaflet(map, pins);
    // Refit when the set of drivers changes, not on every GPS tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pinKey]);

  return (
    <div className="relative z-0 h-full w-full" style={{ background: MAP_GROUND }}>
      <MapContainer
        ref={setMap}
        center={CONUS_CENTER}
        zoom={4}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: MAP_GROUND }}
      >
        <KeylessTiles />
        <LeafletAutoResize />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={leafletPinIcon(pin)}
            eventHandlers={{ click: () => onSelect(pin.id) }}
          />
        ))}
      </MapContainer>
      <MapCredit />
    </div>
  );
}

export function DriverMap(props: DriverMapProps) {
  return isKeylessMapMode() ? <LeafletDriverMap {...props} /> : <MapboxDriverMap {...props} />;
}
