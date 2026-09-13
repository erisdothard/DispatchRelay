/**
 * Rivera Transport's fleet: back-office team, pending invites, posted trucks, fuel cards and
 * GPS for drivers who aren't on a load. Core seeds the owner and the three road drivers:
 * Carlos Mendez (DR-1042, near Longview TX), Mike Johnson (DR-1051, east of Beaumont TX; next
 * DR-1048 out of Denver in 2 days) and Luis Ortega (delivered DR-1045 in Charlotte, off duty).
 */
import { DEMO_IDS } from '../../identities';
import { daysFromNow, hoursAgo, hoursFromNow } from '../../time';
import type { Row, SeedTables } from '../../types';

export const RT_TEAM = {
  dispatcher: 'demo-rt-dispatcher',
  accounting: 'demo-rt-accounting',
  /** Local flatbed driver waiting at the Nashville yard. */
  darnell: 'demo-rt-darnell',
} as const;

const COMPANY_ID = DEMO_IDS.carrierCompany;
const COMPANY_NAME = 'Rivera Transport Inc';
const DAY = 24;
const FUEL_DISCOUNT_PER_GAL = 0.18;

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ── Team ─────────────────────────────────────────────

function teamProfile(
  id: string,
  fullName: string,
  email: string,
  role: string,
  extra: Row = {},
): Row {
  return {
    id,
    email,
    full_name: fullName,
    role,
    status: 'active',
    onboarding_complete: true,
    avatar_url: null,
    phone: '(615) 555-0100',
    phone_verified_at: hoursAgo(DAY * 45),
    phone_carrier_type: 'mobile',
    carrier_id: null,
    theme: 'dark',
    last_known_location: null,
    last_location_update: null,
    last_synced_at: null,
    current_duty_status: null,
    duty_status_updated_at: null,
    created_at: hoursAgo(DAY * 150),
    updated_at: hoursAgo(DAY),
    ...extra,
  };
}

function teamProfiles(): Row[] {
  return [
    teamProfile(RT_TEAM.dispatcher, 'Angela Torres', 'angela@riveratransport.example', 'carrier', {
      phone: '(615) 555-0119',
    }),
    teamProfile(RT_TEAM.accounting, 'Priya Shah', 'ap@riveratransport.example', 'carrier', {
      phone: '(615) 555-0133',
    }),
    teamProfile(
      RT_TEAM.darnell,
      'Darnell Washington',
      'darnell.w@riveratransport.example',
      'driver',
      {
        carrier_id: DEMO_IDS.carrier,
        phone: '(615) 555-0188',
        current_duty_status: 'on_duty',
        duty_status_updated_at: hoursAgo(2),
        last_location_update: hoursAgo(0.15),
      },
    ),
  ];
}

function teamMembers(): Row[] {
  const member = (userId: string, role: string, daysAgo: number): Row => ({
    id: `member-${userId}`,
    company_id: COMPANY_ID,
    user_id: userId,
    role,
    invited_by: DEMO_IDS.carrier,
    joined_at: hoursAgo(DAY * daysAgo),
    created_at: hoursAgo(DAY * daysAgo),
  });
  return [
    member(RT_TEAM.dispatcher, 'dispatcher', 95),
    member(RT_TEAM.accounting, 'accounting', 60),
    member(RT_TEAM.darnell, 'driver', 40),
  ];
}

function companyInvites(): Row[] {
  const invite = (
    id: string,
    email: string,
    role: string,
    token: string,
    hoursOld: number,
  ): Row => ({
    id,
    company_id: COMPANY_ID,
    email,
    role,
    token,
    invited_by: DEMO_IDS.carrier,
    expires_at: hoursFromNow(DAY * 7 - hoursOld),
    accepted_at: null,
    created_at: hoursAgo(hoursOld),
  });
  return [
    invite('invite-rt-driver', 'jwilliams.cdl@example.com', 'driver', 'demo7f3a9c41d2e8b605', 48),
    invite(
      'invite-rt-dispatch',
      'kevin.nguyen@riveratransport.example',
      'dispatcher',
      'demo2b81e4c9a07f3d16',
      20,
    ),
  ];
}

/**
 * Drivers off a load still share background GPS: Darnell at the Nashville yard, Luis parked
 * at a Charlotte truck stop after delivering DR-1045.
 */
function offLoadDriverPings(): Row[] {
  const ping = (id: string, driverId: string, lat: number, lng: number, hoursOld: number): Row => ({
    id,
    load_number: null,
    driver_id: driverId,
    latitude: lat,
    longitude: lng,
    accuracy_m: 9,
    heading_deg: null,
    speed_ms: 0,
    recorded_at: hoursAgo(hoursOld),
  });
  return [
    ping('ping-rt-darnell-yard', RT_TEAM.darnell, 36.1702, -86.7106, 0.15),
    ping('ping-rt-luis-charlotte', DEMO_IDS.driver3, 35.2045, -80.871, 0.25),
  ];
}

// ── Trucks ───────────────────────────────────────────

function truck(id: string, fields: Row): Row {
  return {
    id,
    posted_by: DEMO_IDS.carrier,
    company_id: COMPANY_ID,
    company_name: COMPANY_NAME,
    dest_city: null,
    dest_state: null,
    driver_id: null,
    driver_name: null,
    driver_phone: null,
    length_ft: 53,
    weight_capacity_lbs: 45_000,
    status: 'available',
    ...fields,
  };
}

function trucks(): Row[] {
  return [
    truck('truck-rt-101', {
      equipment: 'van',
      status: 'booked',
      origin_city: 'Longview',
      origin_state: 'TX',
      dest_city: 'Dallas',
      dest_state: 'TX',
      available_date: daysFromNow(1),
      driver_id: DEMO_IDS.driver,
      driver_name: 'Carlos Mendez',
      driver_phone: '(615) 555-0142',
      created_at: hoursAgo(30),
    }),
    truck('truck-rt-102', {
      equipment: 'van',
      status: 'booked',
      origin_city: 'Beaumont',
      origin_state: 'TX',
      dest_city: 'New Orleans',
      dest_state: 'LA',
      available_date: daysFromNow(1),
      driver_id: DEMO_IDS.driver2,
      driver_name: 'Mike Johnson',
      driver_phone: '(615) 555-0177',
      created_at: hoursAgo(26),
    }),
    truck('truck-rt-107', {
      equipment: 'van',
      origin_city: 'Charlotte',
      origin_state: 'NC',
      available_date: daysFromNow(1),
      driver_id: DEMO_IDS.driver3,
      driver_name: 'Luis Ortega',
      driver_phone: '(615) 555-0193',
      created_at: hoursAgo(5),
    }),
    truck('truck-rt-103', {
      equipment: 'flatbed',
      origin_city: 'Nashville',
      origin_state: 'TN',
      dest_city: 'Atlanta',
      dest_state: 'GA',
      available_date: daysFromNow(0),
      length_ft: 48,
      weight_capacity_lbs: 48_000,
      driver_id: RT_TEAM.darnell,
      driver_name: 'Darnell Washington',
      driver_phone: '(615) 555-0188',
      created_at: hoursAgo(6),
    }),
    truck('truck-rt-104', {
      equipment: 'van',
      origin_city: 'Nashville',
      origin_state: 'TN',
      available_date: daysFromNow(1),
      created_at: hoursAgo(9),
    }),
    truck('truck-rt-105', {
      equipment: 'step_deck',
      origin_city: 'Memphis',
      origin_state: 'TN',
      dest_city: 'Houston',
      dest_state: 'TX',
      available_date: daysFromNow(2),
      length_ft: 48,
      weight_capacity_lbs: 47_000,
      created_at: hoursAgo(14),
    }),
    truck('truck-rt-106', {
      equipment: 'reefer',
      status: 'inactive',
      origin_city: 'Atlanta',
      origin_state: 'GA',
      available_date: daysFromNow(5),
      weight_capacity_lbs: 43_500,
      created_at: hoursAgo(72),
    }),
    // Other carriers' capacity, visible on the public truck board.
    truck('truck-br-201', {
      posted_by: DEMO_IDS.carrier2,
      company_id: DEMO_IDS.carrier2Company,
      company_name: 'Blue Ridge Logistics',
      equipment: 'van',
      origin_city: 'Knoxville',
      origin_state: 'TN',
      dest_city: 'Charlotte',
      dest_state: 'NC',
      available_date: daysFromNow(1),
      created_at: hoursAgo(11),
    }),
    truck('truck-sh-301', {
      posted_by: DEMO_IDS.carrier3,
      company_id: DEMO_IDS.carrier3Company,
      company_name: 'Summit Haulers',
      equipment: 'flatbed',
      origin_city: 'Birmingham',
      origin_state: 'AL',
      dest_city: 'Houston',
      dest_state: 'TX',
      available_date: daysFromNow(2),
      length_ft: 48,
      weight_capacity_lbs: 48_000,
      created_at: hoursAgo(20),
    }),
  ];
}

// ── Fuel ─────────────────────────────────────────────

function fuelCards(): Row[] {
  const card = (
    id: string,
    last4: string,
    driverId: string | null,
    truckId: string,
    status: string,
    daysOld: number,
    extra: Row = {},
  ): Row => ({
    id,
    company_id: COMPANY_ID,
    card_number_masked: `****-****-****-${last4}`,
    provider: 'dispatchrelay',
    assigned_driver: driverId,
    assigned_truck: truckId,
    spending_limit_usd: 6000,
    daily_limit_usd: 900,
    discount_cents_per_gallon: FUEL_DISCOUNT_PER_GAL * 100,
    status,
    activated_at: hoursAgo(DAY * daysOld),
    cancelled_at: null,
    created_at: hoursAgo(DAY * daysOld),
    ...extra,
  });
  return [
    card('fc-rt-4821', '4821', DEMO_IDS.driver, 'truck-rt-101', 'active', 120),
    card('fc-rt-7735', '7735', DEMO_IDS.driver2, 'truck-rt-102', 'active', 110),
    card('fc-rt-5518', '5518', DEMO_IDS.driver3, 'truck-rt-107', 'active', 75),
    card('fc-rt-2390', '2390', RT_TEAM.darnell, 'truck-rt-103', 'active', 38, {
      spending_limit_usd: 4500,
      daily_limit_usd: 700,
    }),
    // Spare card for the reefer in the shop — frozen until the unit is back on the road.
    card('fc-rt-6104', '6104', null, 'truck-rt-106', 'frozen', 200, {
      spending_limit_usd: 3000,
      daily_limit_usd: 500,
    }),
  ];
}

type FuelStop = [
  cardId: string,
  driverId: string | null,
  truckId: string,
  loadId: string | null,
  hoursOld: number,
  gallons: number,
  retailPrice: number,
  station: string,
  city: string,
  state: string,
  odometer: number,
];

const FUEL_STOPS: FuelStop[] = [
  // Carlos — DR-1042 Atlanta → Dallas
  [
    'fc-rt-4821',
    DEMO_IDS.driver,
    'truck-rt-101',
    'load-001',
    4,
    131.4,
    3.74,
    "Love's Travel Stop #331",
    'Shreveport',
    'LA',
    412_880,
  ],
  [
    'fc-rt-4821',
    DEMO_IDS.driver,
    'truck-rt-101',
    'load-001',
    17,
    142.6,
    3.89,
    'Pilot Travel Center #412',
    'Birmingham',
    'AL',
    412_310,
  ],
  [
    'fc-rt-4821',
    DEMO_IDS.driver,
    'truck-rt-101',
    null,
    DAY * 6,
    118.9,
    3.65,
    'Pilot Travel Center #74',
    'Nashville',
    'TN',
    410_620,
  ],
  // Mike — DR-1051 San Antonio → New Orleans
  [
    'fc-rt-7735',
    DEMO_IDS.driver2,
    'truck-rt-102',
    'load-010',
    7,
    118.4,
    3.49,
    'TA Travel Center #221',
    'San Antonio',
    'TX',
    288_140,
  ],
  [
    'fc-rt-7735',
    DEMO_IDS.driver2,
    'truck-rt-102',
    null,
    DAY * 2,
    126.7,
    3.58,
    "Love's Travel Stop #248",
    'Amarillo',
    'TX',
    287_490,
  ],
  [
    'fc-rt-7735',
    DEMO_IDS.driver2,
    'truck-rt-102',
    null,
    DAY * 5,
    139.1,
    3.95,
    'Flying J #714',
    'Denver',
    'CO',
    286_720,
  ],
  // Luis — DR-1045 Miami → Charlotte
  [
    'fc-rt-5518',
    DEMO_IDS.driver3,
    'truck-rt-107',
    'load-004',
    20,
    150.2,
    3.79,
    'TA Travel Center #187',
    'Jacksonville',
    'FL',
    233_470,
  ],
  [
    'fc-rt-5518',
    DEMO_IDS.driver3,
    'truck-rt-107',
    'load-004',
    32,
    96.0,
    3.92,
    'Pilot Travel Center #1047',
    'Miami',
    'FL',
    233_120,
  ],
  [
    'fc-rt-5518',
    DEMO_IDS.driver3,
    'truck-rt-107',
    null,
    DAY * 6,
    121.8,
    3.68,
    "Love's Travel Stop #720",
    'Columbia',
    'SC',
    232_300,
  ],
  // Darnell — local flatbed work out of Nashville
  [
    'fc-rt-2390',
    RT_TEAM.darnell,
    'truck-rt-103',
    null,
    20,
    96.2,
    3.61,
    'Pilot Travel Center #74',
    'Nashville',
    'TN',
    158_930,
  ],
  [
    'fc-rt-2390',
    RT_TEAM.darnell,
    'truck-rt-103',
    null,
    DAY * 4,
    110.5,
    3.66,
    "Love's Travel Stop #512",
    'Chattanooga',
    'TN',
    158_410,
  ],
  [
    'fc-rt-2390',
    RT_TEAM.darnell,
    'truck-rt-103',
    null,
    DAY * 9,
    124.3,
    3.7,
    'TA Travel Center #95',
    'Louisville',
    'KY',
    157_760,
  ],
  // Spare card — last used before the reefer went into the shop
  [
    'fc-rt-6104',
    null,
    'truck-rt-106',
    null,
    DAY * 21,
    88.0,
    3.82,
    'Pilot Travel Center #390',
    'Atlanta',
    'GA',
    301_200,
  ],
];

function fuelTransactions(): Row[] {
  return FUEL_STOPS.map(
    (
      [
        cardId,
        driverId,
        truckId,
        loadId,
        hoursOld,
        gallons,
        retail,
        station,
        city,
        state,
        odometer,
      ],
      i,
    ) => {
      const price = round2(retail - FUEL_DISCOUNT_PER_GAL);
      const total = round2(gallons * price);
      return {
        id: `fuel-tx-rt-${i + 1}`,
        fuel_card_id: cardId,
        company_id: COMPANY_ID,
        driver_id: driverId,
        load_id: loadId,
        truck_id: truckId,
        transaction_date: hoursAgo(hoursOld),
        gallons,
        price_per_gallon: price,
        discount_applied: FUEL_DISCOUNT_PER_GAL,
        total_usd: total,
        // FuelTransaction in the UI reads total_amount_usd; the table column is total_usd.
        total_amount_usd: total,
        retail_price: retail,
        savings_usd: round2(gallons * FUEL_DISCOUNT_PER_GAL),
        fuel_type: 'diesel',
        location_name: station,
        location_city: city,
        location_state: state,
        odometer_miles: odometer,
        created_at: hoursAgo(hoursOld),
      };
    },
  );
}

export function fleetSeeds(): SeedTables {
  return {
    profiles: teamProfiles(),
    company_members: teamMembers(),
    company_invites: companyInvites(),
    location_pings: offLoadDriverPings(),
    trucks: trucks(),
    fuel_cards: fuelCards(),
    fuel_transactions: fuelTransactions(),
  };
}
