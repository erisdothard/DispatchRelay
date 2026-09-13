/**
 * Open marketplace freight from a third-party brokerage, so the load board and AI search
 * have real results for common asks ("reefer out of Nashville", "flatbed Texas to Illinois").
 * A separate broker keeps the persona dashboards (Apex, Park Manufacturing) unchanged.
 */
import { daysFromNow, hoursAgo } from '../../time';
import type { Row } from '../../types';

export const MARKETPLACE_BROKER_ID = 'demo-broker-2';
export const MARKETPLACE_COMPANY_ID = 'demo-company-broker-2';
const COMPANY_NAME = 'Crossroads Freight Brokerage';

interface MarketLoad {
  n: number;
  from: [city: string, state: string, zip: string];
  to: [city: string, state: string, zip: string];
  pickupIn: number;
  transitDays: number;
  equipment: string;
  commodity: string;
  weight: number;
  miles: number;
  rpm: number;
  postedHoursAgo: number;
}

const LOADS: MarketLoad[] = [
  {
    n: 1,
    from: ['Nashville', 'TN', '37210'],
    to: ['Charlotte', 'NC', '28208'],
    pickupIn: 1,
    transitDays: 1,
    equipment: 'reefer',
    commodity: 'Fresh produce',
    weight: 36000,
    miles: 410,
    rpm: 2.95,
    postedHoursAgo: 3,
  },
  {
    n: 2,
    from: ['Nashville', 'TN', '37207'],
    to: ['Atlanta', 'GA', '30336'],
    pickupIn: 1,
    transitDays: 0,
    equipment: 'van',
    commodity: 'Packaged beverages',
    weight: 42000,
    miles: 250,
    rpm: 2.6,
    postedHoursAgo: 5,
  },
  {
    n: 3,
    from: ['Memphis', 'TN', '38118'],
    to: ['Kansas City', 'MO', '64120'],
    pickupIn: 1,
    transitDays: 1,
    equipment: 'van',
    commodity: 'Paper products',
    weight: 40000,
    miles: 450,
    rpm: 2.3,
    postedHoursAgo: 9,
  },
  {
    n: 4,
    from: ['Houston', 'TX', '77029'],
    to: ['Chicago', 'IL', '60632'],
    pickupIn: 2,
    transitDays: 2,
    equipment: 'flatbed',
    commodity: 'Steel coils',
    weight: 46000,
    miles: 1080,
    rpm: 2.85,
    postedHoursAgo: 4,
  },
  {
    n: 5,
    from: ['Dallas', 'TX', '75212'],
    to: ['Chicago', 'IL', '60608'],
    pickupIn: 3,
    transitDays: 2,
    equipment: 'flatbed',
    commodity: 'Building materials',
    weight: 44000,
    miles: 970,
    rpm: 2.7,
    postedHoursAgo: 11,
  },
  {
    n: 6,
    from: ['Fresno', 'CA', '93725'],
    to: ['Dallas', 'TX', '75212'],
    pickupIn: 2,
    transitDays: 3,
    equipment: 'reefer',
    commodity: 'Frozen foods',
    weight: 40000,
    miles: 1440,
    rpm: 2.78,
    postedHoursAgo: 6,
  },
  {
    n: 7,
    from: ['Salinas', 'CA', '93901'],
    to: ['Denver', 'CO', '80216'],
    pickupIn: 1,
    transitDays: 2,
    equipment: 'reefer',
    commodity: 'Leafy greens',
    weight: 38000,
    miles: 1180,
    rpm: 2.62,
    postedHoursAgo: 2,
  },
  {
    n: 8,
    from: ['Atlanta', 'GA', '30336'],
    to: ['Orlando', 'FL', '32824'],
    pickupIn: 2,
    transitDays: 1,
    equipment: 'reefer',
    commodity: 'Dairy',
    weight: 39000,
    miles: 440,
    rpm: 2.95,
    postedHoursAgo: 8,
  },
  {
    n: 9,
    from: ['Chicago', 'IL', '60632'],
    to: ['Columbus', 'OH', '43207'],
    pickupIn: 1,
    transitDays: 1,
    equipment: 'van',
    commodity: 'Consumer electronics',
    weight: 30000,
    miles: 360,
    rpm: 2.55,
    postedHoursAgo: 7,
  },
  {
    n: 10,
    from: ['Dallas', 'TX', '75247'],
    to: ['Memphis', 'TN', '38118'],
    pickupIn: 2,
    transitDays: 1,
    equipment: 'van',
    commodity: 'Auto parts',
    weight: 36000,
    miles: 450,
    rpm: 2.25,
    postedHoursAgo: 1,
  },
];

function loadRow(l: MarketLoad): Row {
  const [originCity, originState, originZip] = l.from;
  const [destCity, destState, destZip] = l.to;
  const posted = hoursAgo(l.postedHoursAgo);
  return {
    id: `load-mkt-${String(l.n).padStart(2, '0')}`,
    load_number: `DR-${1060 + l.n}`,
    posted_by: MARKETPLACE_BROKER_ID,
    company_id: MARKETPLACE_COMPANY_ID,
    company_name: COMPANY_NAME,
    origin_city: originCity,
    origin_state: originState,
    origin_address: `${800 + l.n * 41} Distribution Way`,
    origin_zip: originZip,
    dest_city: destCity,
    dest_state: destState,
    dest_address: `${300 + l.n * 29} Logistics Blvd`,
    dest_zip: destZip,
    pickup_date: daysFromNow(l.pickupIn),
    delivery_date: daysFromNow(l.pickupIn + l.transitDays),
    equipment: l.equipment,
    commodity: l.commodity,
    weight_lbs: l.weight,
    rate_usd: Math.round(l.miles * l.rpm),
    rate_per_mile: l.rpm,
    total_miles: l.miles,
    status: 'posted',
    bid_count: 0,
    hazmat: false,
    temp_controlled: l.equipment === 'reefer',
    visibility: 'public',
    preferred_carriers_only: false,
    assigned_driver_id: null,
    second_driver_id: null,
    assignee_id: null,
    broker_credit_score: 88,
    posted_at: posted,
    created_at: posted,
    deleted_at: null,
    shipper_name: `${originCity} Distribution Center`,
    shipper_contact_name: 'Shipping Office',
    shipper_contact_phone: '(901) 555-0120',
    receiver_name: `${destCity} Receiving`,
    receiver_contact_name: 'Receiving Desk',
    receiver_contact_phone: '(901) 555-0180',
    pallets_count: 22,
    pieces_count: 22,
    full_partial: 'full',
    po_number: `CX-${73100 + l.n}`,
    special_instructions:
      l.equipment === 'reefer'
        ? 'Continuous temp at 34°F. Download of reefer unit required at delivery.'
        : l.equipment === 'flatbed'
          ? 'Tarps and 8 straps required. Driver must secure load.'
          : 'Appointment required. No-touch freight.',
  };
}

export function buildMarketplaceSeeds(): Record<string, Row[]> {
  return {
    profiles: [
      {
        id: MARKETPLACE_BROKER_ID,
        email: 'loads@crossroadsfreight.example',
        full_name: 'Rachel Kim',
        role: 'broker',
        status: 'active',
        onboarding_complete: true,
        avatar_url: null,
        phone: '(901) 555-0100',
        phone_verified_at: hoursAgo(24 * 90),
        phone_carrier_type: 'mobile',
        carrier_id: null,
        theme: 'dark',
        created_at: hoursAgo(24 * 300),
        updated_at: hoursAgo(24 * 3),
      },
    ],
    companies: [
      {
        id: MARKETPLACE_COMPANY_ID,
        owner_id: MARKETPLACE_BROKER_ID,
        name: COMPANY_NAME,
        type: 'broker',
        city: 'Memphis',
        state: 'TN',
        address: '4100 Airways Blvd',
        zip: '38116',
        phone: '(901) 555-0100',
        email: 'loads@crossroadsfreight.example',
        website: null,
        logo_url: null,
        mc_number: 'MC-655902',
        dot_number: null,
        broker_authority: 'BRK-655902',
        broker_bond_amount: 75000,
        broker_bond_expires_at: daysFromNow(180),
        broker_bond_verified: true,
        verified: true,
        rating: 4.3,
        on_time_percent: 92,
        total_loads: 540,
        created_at: hoursAgo(24 * 500),
        updated_at: hoursAgo(24 * 3),
      },
    ],
    company_members: [
      {
        id: `member-${MARKETPLACE_BROKER_ID}`,
        company_id: MARKETPLACE_COMPANY_ID,
        user_id: MARKETPLACE_BROKER_ID,
        role: 'owner',
        invited_by: null,
        joined_at: hoursAgo(24 * 300),
        created_at: hoursAgo(24 * 300),
      },
    ],
    loads: LOADS.map(loadRow),
  };
}
