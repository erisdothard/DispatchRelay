/**
 * GPS side of the driver demo: geofences, dwell/detention records, breadcrumb snapshots,
 * driver scores, device registrations and GPS consent — plus their Postgres functions.
 */
import { DEMO_LOADS } from '@/lib/demo-data';
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoHandler, Row } from '../../types';
import { CITY_COORDS, type LatLng } from './geo';
import { carlosWindow } from './hos';

const HOUR_MS = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

function geofenceRows(): Row[] {
  return DEMO_LOADS.filter((l) => l.assignedDriverId).flatMap((load) => {
    const stops = [
      { stop: 'pickup', city: load.originCity, label: `${load.originCity} Distribution Center` },
      { stop: 'delivery', city: load.destCity, label: `${load.destCity} Receiving` },
    ];
    return stops.flatMap(({ stop, city, label }) => {
      const coords = CITY_COORDS[city];
      if (!coords) return [];
      return [
        {
          id: `geo-${load.loadNumber}-${stop}`,
          load_number: load.loadNumber,
          stop_type: stop,
          label,
          lat: coords.lat,
          lng: coords.lng,
          radius_m: 800,
          created_at: load.postedAt,
        },
      ];
    });
  });
}

interface DwellSeed {
  loadNumber: string;
  stop: 'pickup' | 'delivery';
  label: string;
  city: string;
  enteredAt: number;
  exitedAt: number;
}

function dwellSeeds(): DwellSeed[] {
  const pickup1042 = carlosWindow('pickup-DR-1042');
  const pickup1049 = carlosWindow('pickup-DR-1049');
  const delivery1049 = carlosWindow('delivery-DR-1049');
  const pad = 10 * 60_000;
  return [
    {
      loadNumber: 'DR-1042',
      stop: 'pickup',
      label: 'Atlanta Distribution Center',
      city: 'Atlanta',
      enteredAt: pickup1042.start - pad,
      exitedAt: pickup1042.end + pad,
    },
    {
      loadNumber: 'DR-1049',
      stop: 'pickup',
      label: 'Detroit Distribution Center',
      city: 'Detroit',
      enteredAt: pickup1049.start - pad,
      exitedAt: pickup1049.end + pad,
    },
    {
      loadNumber: 'DR-1049',
      stop: 'delivery',
      label: 'Indianapolis Receiving',
      city: 'Indianapolis',
      enteredAt: delivery1049.start - pad,
      exitedAt: delivery1049.end + pad,
    },
    // DR-1045 sat at Charlotte receiving long enough to flag detention.
    {
      loadNumber: 'DR-1045',
      stop: 'pickup',
      label: 'Miami Distribution Center',
      city: 'Miami',
      enteredAt: Date.now() - 31.5 * HOUR_MS,
      exitedAt: Date.now() - 30 * HOUR_MS,
    },
    {
      loadNumber: 'DR-1045',
      stop: 'delivery',
      label: 'Charlotte Receiving',
      city: 'Charlotte',
      enteredAt: Date.now() - 8.5 * HOUR_MS,
      exitedAt: Date.now() - 6.2 * HOUR_MS,
    },
  ];
}

/** DR-1045 was Luis Ortega's run; every other tracked load here is Carlos's. */
function driverFor(loadNumber: string): string {
  return loadNumber === 'DR-1045' ? DEMO_IDS.driver3 : DEMO_IDS.driver;
}

function dwellAndEventRows(): { dwell: Row[]; events: Row[] } {
  const seeds = dwellSeeds();
  const dwell = seeds.map((s, i) => {
    const minutes = Math.round((s.exitedAt - s.enteredAt) / 60_000);
    return {
      id: `dwell-${String(i + 1).padStart(3, '0')}`,
      load_number: s.loadNumber,
      geofence_id: `geo-${s.loadNumber}-${s.stop}`,
      stop_type: s.stop,
      label: s.label,
      entered_at: iso(s.enteredAt),
      exited_at: iso(s.exitedAt),
      dwell_minutes: minutes,
      detention_flagged: minutes > 120,
      created_at: iso(s.enteredAt),
    };
  });
  const events = seeds.flatMap((s, i) => {
    const coords = CITY_COORDS[s.city] ?? { lat: 0, lng: 0 };
    const event = (type: 'enter' | 'exit', at: number): Row => ({
      id: `geo-event-${String(i + 1).padStart(3, '0')}-${type}`,
      geofence_id: `geo-${s.loadNumber}-${s.stop}`,
      load_number: s.loadNumber,
      driver_id: driverFor(s.loadNumber),
      event_type: type,
      lat: coords.lat,
      lng: coords.lng,
      recorded_at: iso(at),
      dwell_seconds: type === 'exit' ? Math.round((s.exitedAt - s.enteredAt) / 1000) : null,
      auto_status_applied: null,
      created_at: iso(at),
    });
    return [event('enter', s.enteredAt), event('exit', s.exitedAt)];
  });
  return { dwell, events };
}

/** Interpolates a trail through waypoints, one point roughly every 20 minutes. */
function trail(waypoints: LatLng[], startMs: number, endMs: number): Row[] {
  const legs = waypoints.length - 1;
  const steps = Math.max(legs, Math.round((endMs - startMs) / (20 * 60_000)));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const legIndex = Math.min(legs - 1, Math.floor(t * legs));
    const legT = t * legs - legIndex;
    const a = waypoints[legIndex]!;
    const b = waypoints[legIndex + 1]!;
    return {
      lat: Number((a.lat + (b.lat - a.lat) * legT).toFixed(5)),
      lng: Number((a.lng + (b.lng - a.lng) * legT).toFixed(5)),
      ts: Math.round(startMs + (endMs - startMs) * t),
      speed_ms: i === 0 || i === steps ? 0 : 26 + (i % 3),
    };
  });
}

function breadcrumbRows(): Row[] {
  const city = (name: string): LatLng => CITY_COORDS[name] ?? { lat: 0, lng: 0 };
  const fx1049 = {
    start: carlosWindow('transit-DR-1049').start,
    end: carlosWindow('delivery-DR-1049').start,
  };
  const snapshots = [
    {
      loadNumber: 'DR-1049',
      points: trail(
        [city('Detroit'), { lat: 41.0793, lng: -85.1394 }, city('Indianapolis')],
        fx1049.start,
        fx1049.end,
      ),
    },
    {
      loadNumber: 'DR-1045',
      points: trail(
        [city('Miami'), city('Jacksonville'), city('Savannah'), city('Charlotte')],
        Date.now() - 30 * HOUR_MS,
        Date.now() - 8.5 * HOUR_MS,
      ),
    },
  ];
  return snapshots.map(({ loadNumber, points }) => ({
    id: `crumbs-${loadNumber}`,
    load_number: loadNumber,
    driver_id: driverFor(loadNumber),
    polyline: points,
    total_points: points.length,
    start_time: iso(Number(points[0]?.ts)),
    end_time: iso(Number(points[points.length - 1]?.ts)),
    created_at: iso(Number(points[points.length - 1]?.ts)),
  }));
}

function scoreRow(
  loadNumber: string,
  speed: number,
  route: number,
  dwell: number,
  details: Row,
  hours: number,
): Row {
  return {
    id: `score-${loadNumber}`,
    driver_id: driverFor(loadNumber),
    load_number: loadNumber,
    overall_score: Math.round(speed * 0.4 + route * 0.35 + dwell * 0.25),
    speed_score: speed,
    route_score: route,
    dwell_score: dwell,
    details,
    created_at: hoursAgo(hours),
  };
}

const DRIVER_SCORES: Row[] = [
  scoreRow(
    'DR-1045',
    96,
    100,
    75,
    { totalPings: 64, speedSamples: 62, deviations: 0, detentionCount: 1 },
    6,
  ),
  scoreRow(
    'DR-1049',
    98,
    100,
    100,
    { totalPings: 14, speedSamples: 13, deviations: 0, detentionCount: 0 },
    60,
  ),
];

const MOBILE_DEVICES: Row[] = [
  {
    id: 'device-driver-iphone',
    user_id: DEMO_IDS.driver,
    device_id: 'ios-7F3A-CM15',
    platform: 'ios',
    app_version: '2.14.0',
    os_version: 'iOS 19.1',
    device_model: 'iPhone 15 Pro',
    push_token: null,
    push_enabled: true,
    locale: 'en-US',
    timezone: 'America/Chicago',
    last_active_at: hoursAgo(0.1),
    created_at: hoursAgo(24 * 90),
  },
  {
    id: 'device-driver2-android',
    user_id: DEMO_IDS.driver2,
    device_id: 'android-2C91-MJ',
    platform: 'android',
    app_version: '2.14.0',
    os_version: 'Android 15',
    device_model: 'Pixel 8',
    push_token: null,
    push_enabled: true,
    locale: 'en-US',
    timezone: 'America/Chicago',
    last_active_at: hoursAgo(0.3),
    created_at: hoursAgo(24 * 60),
  },
];

const CONSENT_TEXT =
  'I consent to DispatchRelay collecting and sharing my live GPS location with my carrier and dispatcher while I am on active loads.';

const GPS_CONSENT: Row[] = [DEMO_IDS.driver, DEMO_IDS.driver2].map((userId, i) => ({
  id: `gps-consent-${i + 1}`,
  user_id: userId,
  granted: true,
  consent_text: CONSENT_TEXT,
  granted_at: hoursAgo(24 * (45 - i * 10)),
  revoked_at: null,
  ip_address: null,
  user_agent: 'DispatchRelay iOS 2.14.0',
  created_at: hoursAgo(24 * (45 - i * 10)),
}));

// ── Postgres functions ───────────────────────────────

const BOL_FIELDS: Array<[column: string, label: string]> = [
  ['load_number', 'load / PRO number'],
  ['shipper_name', 'shipper name'],
  ['origin_address', 'shipper address'],
  ['receiver_name', 'consignee name'],
  ['dest_address', 'consignee address'],
  ['commodity', 'commodity description'],
  ['weight_lbs', 'weight'],
];

export const TRACKING_RPC: Record<string, DemoHandler> = {
  grant_gps_consent: (args, { db, identity }) => {
    if (!identity) throw new Error('Sign in to share your location.');
    const now = new Date().toISOString();
    const patch: Row = {
      granted: true,
      granted_at: now,
      revoked_at: null,
      consent_text: typeof args.p_consent_text === 'string' ? args.p_consent_text : CONSENT_TEXT,
      user_agent: typeof args.p_user_agent === 'string' ? args.p_user_agent : null,
      ip_address: typeof args.p_ip_address === 'string' ? args.p_ip_address : null,
    };
    const mine = (r: Row) => r.user_id === identity.id;
    const [row] = db.read('gps_consent').some(mine)
      ? db.update('gps_consent', mine, patch)
      : db.insert('gps_consent', [{ user_id: identity.id, ...patch }]);
    return row?.id ?? null;
  },
  revoke_gps_consent: (_args, { db, identity }) => {
    if (!identity) throw new Error('Sign in to manage location sharing.');
    db.update('gps_consent', (r) => r.user_id === identity.id, {
      granted: false,
      revoked_at: new Date().toISOString(),
    });
    return null;
  },
  has_gps_consent: (args, { db, identity }) => {
    const userId = typeof args.p_user_id === 'string' ? args.p_user_id : identity?.id;
    return db.read('gps_consent').some((r) => r.user_id === userId && r.granted === true);
  },
  update_driver_location: (args, { db }) => {
    const lat = Number(args.p_latitude);
    const lng = Number(args.p_longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid coordinates.');
    const now = new Date().toISOString();
    db.update('profiles', (p) => p.id === args.p_driver_id, {
      last_known_location: `POINT(${lng} ${lat})`,
      last_location_update: now,
    });
    return null;
  },
  validate_bol_requirements: (args, { db }) => {
    const load = db.read('loads').find((l) => l.id === args.p_load_id);
    if (!load) throw new Error('Load not found.');
    const missing = BOL_FIELDS.filter(([column]) => {
      const value = load[column];
      return value === null || value === undefined || value === '' || value === 0;
    });
    const hasCount = Boolean(load.pieces_count || load.pallets_count);
    const errors = [
      ...missing.map(([, label]) => `Missing ${label} (49 CFR § 373.101)`),
      ...(hasCount ? [] : ['Missing piece or pallet count (49 CFR § 373.101)']),
    ];
    return { valid: errors.length === 0, errors };
  },
};

export function trackingSeeds(): Record<string, Row[]> {
  const { dwell, events } = dwellAndEventRows();
  return {
    geofences: geofenceRows(),
    geofence_events: events,
    dwell_records: dwell,
    breadcrumb_snapshots: breadcrumbRows(),
    driver_scores: DRIVER_SCORES,
    mobile_devices: MOBILE_DEVICES,
    gps_consent: GPS_CONSENT,
  };
}
