/** Receipts, tire incidents and the driver incident log for Carlos Mendez. */
import { DEMO_IDS } from '../../identities';
import { daysFromNow } from '../../time';
import type { Row } from '../../types';
import { CITY_COORDS } from './geo';
import { carlosWindow, localDate } from './hos';

const DAY_MS = 86_400_000;

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A small thermal-receipt thumbnail so every seeded receipt has a believable scan. */
function receiptImage(vendor: string, amount: number, date: string): string {
  const title = escapeXml(vendor.split(' — ')[0]?.slice(0, 20).toUpperCase() ?? 'RECEIPT');
  const lines = [38, 50, 62, 74, 86]
    .map(
      (y, i) => `<rect x='14' y='${y}' width='${[72, 56, 80, 48, 64][i]}' height='4' fill='#bbb'/>`,
    )
    .join('');
  return svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'>` +
      `<rect width='120' height='160' fill='#f4efe4'/>` +
      `<text x='60' y='22' font-family='monospace' font-size='8' font-weight='bold' text-anchor='middle' fill='#222'>${title}</text>` +
      `${lines}<line x1='12' y1='104' x2='108' y2='104' stroke='#999' stroke-dasharray='3 2'/>` +
      `<text x='14' y='122' font-family='monospace' font-size='9' fill='#222'>TOTAL</text>` +
      `<text x='106' y='122' font-family='monospace' font-size='9' font-weight='bold' text-anchor='end' fill='#222'>$${amount.toFixed(2)}</text>` +
      `<text x='60' y='146' font-family='monospace' font-size='7' text-anchor='middle' fill='#666'>${escapeXml(date)}</text>` +
      `</svg>`,
  );
}

/** A dark photo tile with a caption — stands in for a driver's phone snapshot. */
function photoImage(caption: string): string {
  return svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#3a3f47'/><stop offset='1' stop-color='#15171a'/></linearGradient></defs>` +
      `<rect width='160' height='160' fill='url(#g)'/>` +
      `<rect x='30' y='44' width='100' height='60' rx='4' fill='#8a7a5c' opacity='0.8'/>` +
      `<path d='M30 74 L130 70' stroke='#d9d2c3' stroke-width='3' opacity='0.7'/>` +
      `<text x='80' y='136' font-family='sans-serif' font-size='10' text-anchor='middle' fill='#e5e5e5'>${escapeXml(caption)}</text>` +
      `</svg>`,
  );
}

/** Keeps "this month" receipts inside the current calendar month so Expenses is never empty. */
function daysAgoThisMonth(days: number): string {
  const dayOfMonth = new Date().getDate();
  return localDate(Date.now() - Math.min(days, dayOfMonth - 1) * DAY_MS);
}

interface ReceiptSeed {
  category: string;
  vendor: string;
  amount: number;
  date: string;
  loadNumber: string | null;
  notes: string | null;
}

function receiptRows(): Row[] {
  const fuelJackson = carlosWindow('fuel-jackson').start;
  const mealBirmingham = carlosWindow('meal-birmingham').start;
  const fuelLouisville = carlosWindow('fuel-louisville').start;
  const parkingDetroit = carlosWindow('parking-detroit').start;
  const maintenance = carlosWindow('maintenance').start;

  const seeds: ReceiptSeed[] = [
    {
      category: 'fuel',
      vendor: 'Pilot Travel Center #412 — Jackson, MS',
      amount: 486.72,
      date: localDate(fuelJackson),
      loadNumber: 'DR-1042',
      notes: '142.7 gal diesel @ $3.41',
    },
    {
      category: 'meals',
      vendor: "Love's Travel Stop — Birmingham, AL",
      amount: 18.43,
      date: localDate(mealBirmingham),
      loadNumber: 'DR-1042',
      notes: null,
    },
    {
      category: 'parking',
      vendor: 'TA Travel Center — Detroit, MI',
      amount: 25,
      date: localDate(parkingDetroit),
      loadNumber: 'DR-1049',
      notes: 'Reserved overnight spot',
    },
    {
      category: 'fuel',
      vendor: "Love's Travel Stop #291 — Louisville, KY",
      amount: 512.08,
      date: localDate(fuelLouisville),
      loadNumber: 'DR-1049',
      notes: '150.2 gal diesel @ $3.41',
    },
    {
      category: 'tolls',
      vendor: 'Indiana Toll Road — Elkhart, IN',
      amount: 31.9,
      date: localDate(fuelLouisville),
      loadNumber: 'DR-1049',
      notes: null,
    },
    {
      category: 'maintenance',
      vendor: 'Speedco — Nashville, TN',
      amount: 164.99,
      date: localDate(maintenance),
      loadNumber: null,
      notes: 'Oil change + DEF top-off',
    },
    {
      category: 'supplies',
      vendor: 'Walmart Supercenter — Nashville, TN',
      amount: 38.62,
      date: daysAgoThisMonth(9),
      loadNumber: null,
      notes: 'Ratchet straps + work gloves',
    },
    {
      category: 'lodging',
      vendor: 'Red Roof Inn — Toledo, OH',
      amount: 79.99,
      date: daysFromNow(-34),
      loadNumber: null,
      notes: '34-hr restart layover',
    },
    {
      category: 'fuel',
      vendor: 'Pilot Travel Center — Knoxville, TN',
      amount: 455.1,
      date: daysFromNow(-39),
      loadNumber: null,
      notes: null,
    },
  ];

  return seeds.map((s, i) => ({
    id: `receipt-${String(i + 1).padStart(3, '0')}`,
    driver_id: DEMO_IDS.driver,
    load_number: s.loadNumber,
    category: s.category,
    amount_usd: s.amount,
    vendor_name: s.vendor,
    receipt_date: s.date,
    notes: s.notes,
    image_url: receiptImage(s.vendor, s.amount, s.date),
    image_thumbnail_url: null,
    file_size_bytes: 180_000 + i * 12_288,
    created_at: new Date(`${s.date}T18:00:00`).toISOString(),
  }));
}

function tireRows(): Row[] {
  const detroit = carlosWindow('parking-detroit').end;
  return [
    {
      id: 'tire-001',
      driver_id: DEMO_IDS.driver,
      load_number: 'DR-1049',
      incident_date: localDate(detroit),
      location_text: 'TA Travel Center — Detroit, MI',
      lat: CITY_COORDS.Detroit?.lat ?? null,
      lng: CITY_COORDS.Detroit?.lng ?? null,
      tire_position: 'rear_outer_left',
      severity: 'low_pressure',
      description: 'Pre-trip found 82 psi (spec 105). Slow leak at the valve stem.',
      resolution: 'patched',
      resolved_at: new Date(detroit + 3_600_000).toISOString(),
      photos: [],
      created_at: new Date(detroit).toISOString(),
    },
    {
      id: 'tire-002',
      driver_id: DEMO_IDS.driver,
      load_number: null,
      incident_date: daysFromNow(-16),
      location_text: 'I-65 N mile marker 91 — Elizabethtown, KY',
      lat: 37.6939,
      lng: -85.8591,
      tire_position: 'trailer_right_1',
      severity: 'blowout',
      description:
        'Trailer tire blew at 62 mph. TA Truck Service replaced it on the shoulder in 70 minutes.',
      resolution: 'roadside_service',
      resolved_at: `${daysFromNow(-16)}T20:10:00.000Z`,
      photos: [photoImage('Trailer axle 1 · right')],
      created_at: `${daysFromNow(-16)}T18:55:00.000Z`,
    },
  ];
}

interface IncidentSeed {
  type: string;
  severity: string;
  date: string;
  location: string;
  city: string | null;
  loadNumber: string | null;
  description: string;
  resolution: string | null;
  photos: string[];
}

function incidentRows(): Row[] {
  const loading = carlosWindow('pickup-DR-1042');
  const detroit = carlosWindow('parking-detroit').end;
  const seeds: IncidentSeed[] = [
    {
      type: 'cargo',
      severity: 'minor',
      date: localDate(loading.start),
      location: 'Atlanta Distribution Center — Atlanta, GA',
      city: 'Atlanta',
      loadNumber: 'DR-1042',
      description:
        'Two pallets had torn shrink wrap at loading. Photographed and noted on the BOL before departure.',
      resolution: null,
      photos: [photoImage('Pallet 7 · torn wrap'), photoImage('Pallet 12 · torn wrap')],
    },
    {
      type: 'tire',
      severity: 'moderate',
      date: localDate(detroit),
      location: 'TA Travel Center — Detroit, MI',
      city: 'Detroit',
      loadNumber: 'DR-1049',
      description:
        'Rear outer left at 82 psi on pre-trip. Valve stem leak patched by TA shop before departure.',
      resolution: 'Patched at TA shop — 45 min delay, no impact on delivery window.',
      photos: [],
    },
    {
      type: 'lights',
      severity: 'minor',
      date: daysFromNow(-7),
      location: 'Rivera Transport yard — Nashville, TN',
      city: 'Nashville',
      loadNumber: null,
      description: 'Left trailer marker lamp out at pre-trip. Bulb replaced before departure.',
      resolution: 'Bulb replaced in yard.',
      photos: [],
    },
    {
      type: 'brake',
      severity: 'moderate',
      date: daysFromNow(-21),
      location: 'I-40 E weigh station — Jackson, TN',
      city: null,
      loadNumber: null,
      description:
        'DOT Level 1 inspection flagged pushrod stroke on axle 3. Adjusted at Speedco; re-inspected OK.',
      resolution: 'Slack adjuster serviced at Speedco Nashville.',
      photos: [],
    },
  ];

  return seeds.map((s, i) => {
    const coords = s.city ? CITY_COORDS[s.city] : undefined;
    return {
      id: `incident-${String(i + 1).padStart(3, '0')}`,
      driver_id: DEMO_IDS.driver,
      load_number: s.loadNumber,
      incident_type: s.type,
      severity: s.severity,
      description: s.description,
      location_text: s.location,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      incident_date: s.date,
      resolution_notes: s.resolution,
      resolved_at: s.resolution ? new Date(`${s.date}T20:00:00`).toISOString() : null,
      photos: s.photos,
      created_at: new Date(`${s.date}T15:00:00`).toISOString(),
    };
  });
}

export function expenseSeeds(): Record<string, Row[]> {
  return {
    receipts: receiptRows(),
    tire_incidents: tireRows(),
    driver_incidents: incidentRows(),
  };
}
