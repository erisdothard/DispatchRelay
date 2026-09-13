/**
 * Core demo data every role touches: people, companies, loads, bids, documents,
 * notifications and live tracking — plus the booking/bidding Postgres functions.
 */
import type { Load } from '@dispatchrelay/shared';
import { DEMO_LOADS } from '@/lib/demo-data';
import { DEMO_IDS } from '../identities';
import { daysFromNow, hoursAgo, hoursFromNow } from '../time';
import type { DemoDomain, DemoHandler, Row } from '../types';

const SAMPLE_DOC_URL = '/demo/sample-document.svg';
const SAMPLE_SIGNATURE_URL = '/demo/sample-signature.svg';

/** Real PDFs for document types the app signs or renders as PDF (BOL signing embeds into these). */
const SAMPLE_PDF_BY_TYPE: Record<string, string> = {
  bill_of_lading: '/demo/sample-bol.pdf',
  rate_confirmation: '/demo/sample-rate-con.pdf',
};

// ── People & companies ───────────────────────────────

function profile(id: string, fullName: string, email: string, role: string, extra: Row = {}): Row {
  return {
    id,
    email,
    full_name: fullName,
    role,
    status: 'active',
    onboarding_complete: true,
    avatar_url: null,
    phone: '(615) 555-0100',
    phone_verified_at: hoursAgo(24 * 60),
    phone_carrier_type: 'mobile',
    carrier_id: null,
    theme: 'dark',
    last_known_location: null,
    last_location_update: null,
    last_synced_at: null,
    current_duty_status: null,
    duty_status_updated_at: null,
    created_at: hoursAgo(24 * 200),
    updated_at: hoursAgo(24),
    ...extra,
  };
}

const PROFILES: Row[] = [
  profile(DEMO_IDS.carrier, 'Marcus Rivera', 'carrier@freightx.com', 'carrier'),
  profile(DEMO_IDS.carrier2, 'Dana Brooks', 'dispatch@blueridgelogistics.com', 'carrier'),
  profile(DEMO_IDS.carrier3, 'Tom Alvarez', 'ops@summithaulers.com', 'carrier'),
  profile(DEMO_IDS.broker, 'Sarah Chen', 'broker@freightx.com', 'broker'),
  profile(DEMO_IDS.shipper, 'James Park', 'shipper@freightx.com', 'shipper'),
  profile(DEMO_IDS.driver, 'Carlos Mendez', 'driver@freightx.com', 'driver', {
    carrier_id: DEMO_IDS.carrier,
    phone: '(615) 555-0142',
    current_duty_status: 'driving',
    duty_status_updated_at: hoursAgo(3),
    last_location_update: hoursAgo(0.1),
  }),
  profile(DEMO_IDS.driver2, 'Mike Johnson', 'driver2@freightx.com', 'driver', {
    carrier_id: DEMO_IDS.carrier,
    phone: '(615) 555-0177',
    current_duty_status: 'driving',
    duty_status_updated_at: hoursAgo(2.5),
    last_location_update: hoursAgo(0.3),
  }),
  // Delivered DR-1045 in Charlotte this morning; resting before the next dispatch.
  profile(DEMO_IDS.driver3, 'Luis Ortega', 'driver3@freightx.com', 'driver', {
    carrier_id: DEMO_IDS.carrier,
    phone: '(615) 555-0193',
    current_duty_status: 'off_duty',
    duty_status_updated_at: hoursAgo(5.5),
    last_location_update: hoursAgo(5.5),
  }),
  profile(DEMO_IDS.admin, 'Admin User', 'admin@freightx.com', 'admin'),
];

function company(
  id: string,
  ownerId: string,
  name: string,
  type: string,
  city: string,
  state: string,
  extra: Row = {},
): Row {
  return {
    id,
    owner_id: ownerId,
    name,
    type,
    city,
    state,
    address: null,
    zip: null,
    phone: '(615) 555-0100',
    email: null,
    website: null,
    logo_url: null,
    mc_number: null,
    dot_number: null,
    broker_authority: null,
    broker_bond_amount: null,
    broker_bond_expires_at: null,
    broker_bond_verified: false,
    verified: true,
    rating: 4.8,
    on_time_percent: 96,
    total_loads: 0,
    created_at: hoursAgo(24 * 400),
    updated_at: hoursAgo(24),
    ...extra,
  };
}

const COMPANIES: Row[] = [
  company(
    DEMO_IDS.carrierCompany,
    DEMO_IDS.carrier,
    'Rivera Transport Inc',
    'carrier',
    'Nashville',
    'TN',
    {
      mc_number: 'MC-123456',
      dot_number: 'DOT-789012',
      email: 'dispatch@riveratransport.com',
      address: '2200 Lebanon Pike',
      zip: '37210',
      total_loads: 412,
    },
  ),
  company(
    DEMO_IDS.carrier2Company,
    DEMO_IDS.carrier2,
    'Blue Ridge Logistics',
    'carrier',
    'Knoxville',
    'TN',
    {
      mc_number: 'MC-448120',
      dot_number: 'DOT-3310457',
      rating: 4.6,
      on_time_percent: 93,
      total_loads: 188,
    },
  ),
  company(
    DEMO_IDS.carrier3Company,
    DEMO_IDS.carrier3,
    'Summit Haulers',
    'carrier',
    'Birmingham',
    'AL',
    {
      mc_number: 'MC-902311',
      dot_number: 'DOT-2881940',
      rating: 4.4,
      on_time_percent: 91,
      total_loads: 96,
    },
  ),
  company(
    DEMO_IDS.brokerCompany,
    DEMO_IDS.broker,
    'Apex Freight Solutions',
    'broker',
    'Atlanta',
    'GA',
    {
      mc_number: 'MC-771204',
      broker_authority: 'BRK-771204',
      broker_bond_amount: 75000,
      broker_bond_expires_at: daysFromNow(240),
      broker_bond_verified: true,
      email: 'loads@apexfreight.com',
      total_loads: 1290,
    },
  ),
  company(
    DEMO_IDS.shipperCompany,
    DEMO_IDS.shipper,
    'Park Manufacturing Co',
    'shipper',
    'Detroit',
    'MI',
    {
      email: 'logistics@parkmfg.com',
      total_loads: 318,
    },
  ),
  company(
    DEMO_IDS.platformCompany,
    DEMO_IDS.admin,
    'FreightX Platform',
    'carrier',
    'Nashville',
    'TN',
  ),
];

function member(companyId: string, userId: string, role: string): Row {
  return {
    id: `member-${userId}`,
    company_id: companyId,
    user_id: userId,
    role,
    invited_by: null,
    joined_at: hoursAgo(24 * 120),
    created_at: hoursAgo(24 * 120),
  };
}

const COMPANY_MEMBERS: Row[] = [
  member(DEMO_IDS.carrierCompany, DEMO_IDS.carrier, 'owner'),
  member(DEMO_IDS.carrierCompany, DEMO_IDS.driver, 'viewer'),
  member(DEMO_IDS.carrierCompany, DEMO_IDS.driver2, 'viewer'),
  member(DEMO_IDS.carrierCompany, DEMO_IDS.driver3, 'viewer'),
  member(DEMO_IDS.carrier2Company, DEMO_IDS.carrier2, 'owner'),
  member(DEMO_IDS.carrier3Company, DEMO_IDS.carrier3, 'owner'),
  member(DEMO_IDS.brokerCompany, DEMO_IDS.broker, 'owner'),
  member(DEMO_IDS.shipperCompany, DEMO_IDS.shipper, 'owner'),
  member(DEMO_IDS.platformCompany, DEMO_IDS.admin, 'owner'),
];

// ── Loads ────────────────────────────────────────────

const CITY_ZIP: Record<string, string> = {
  Atlanta: '30336',
  Dallas: '75212',
  Nashville: '37210',
  Chicago: '60632',
  'Los Angeles': '90058',
  Phoenix: '85043',
  Miami: '33166',
  Charlotte: '28208',
  Houston: '77029',
  Memphis: '38118',
  Seattle: '98108',
  Portland: '97217',
  Denver: '80216',
  'Kansas City': '64120',
  Detroit: '48209',
  Indianapolis: '46241',
  Jacksonville: '32254',
  Savannah: '31408',
  'San Antonio': '78219',
  'New Orleans': '70123',
};

function loadToRow(load: Load, index: number): Row {
  const n = index + 1;
  return {
    id: load.id,
    load_number: load.loadNumber,
    posted_by: load.postedBy,
    company_id: load.companyId ?? null,
    company_name: load.companyName,
    origin_city: load.originCity,
    origin_state: load.originState,
    origin_address: `${1200 + n * 37} Industrial Pkwy`,
    origin_zip: CITY_ZIP[load.originCity] ?? null,
    dest_city: load.destCity,
    dest_state: load.destState,
    dest_address: `${400 + n * 53} Commerce Dr`,
    dest_zip: CITY_ZIP[load.destCity] ?? null,
    pickup_date: load.pickupDate,
    delivery_date: load.deliveryDate,
    equipment: load.equipment,
    commodity: load.commodity,
    weight_lbs: load.weightLbs,
    rate_usd: load.rateUsd,
    rate_per_mile: load.ratePerMile,
    total_miles: load.totalMiles ?? null,
    status: load.status,
    bid_count: load.bidCount,
    hazmat: false,
    temp_controlled: load.equipment === 'reefer',
    visibility: 'public',
    preferred_carriers_only: false,
    assigned_driver_id: load.assignedDriverId ?? null,
    second_driver_id: null,
    assignee_id: null,
    broker_credit_score: load.brokerCreditScore ?? null,
    posted_at: load.postedAt,
    created_at: load.postedAt,
    deleted_at: null,
    shipper_name: `${load.originCity} Distribution Center`,
    shipper_contact_name: 'Dock Supervisor',
    shipper_contact_phone: '(555) 010-2040',
    receiver_name: `${load.destCity} Receiving`,
    receiver_contact_name: 'Receiving Desk',
    receiver_contact_phone: '(555) 010-3080',
    pallets_count: 24,
    pieces_count: 24,
    full_partial: 'full',
    po_number: `PO-${48200 + n}`,
    special_instructions:
      load.equipment === 'reefer'
        ? 'Maintain 34°F continuous. Pre-cool trailer before arrival.'
        : 'Call 30 minutes out. Driver assist on unload.',
  };
}

// ── Bids ─────────────────────────────────────────────

interface BidSeed {
  id: string;
  loadId: string;
  carrier: 'carrier' | 'carrier2' | 'carrier3';
  amount: number;
  status: 'pending' | 'countered' | 'accepted' | 'declined';
  hoursOld: number;
  notes?: string;
  parentId?: string;
  signed?: boolean;
}

const CARRIER_INFO = {
  carrier: {
    id: DEMO_IDS.carrier,
    companyId: DEMO_IDS.carrierCompany,
    name: 'Rivera Transport Inc',
    signer: 'Marcus Rivera',
  },
  carrier2: {
    id: DEMO_IDS.carrier2,
    companyId: DEMO_IDS.carrier2Company,
    name: 'Blue Ridge Logistics',
    signer: 'Dana Brooks',
  },
  carrier3: {
    id: DEMO_IDS.carrier3,
    companyId: DEMO_IDS.carrier3Company,
    name: 'Summit Haulers',
    signer: 'Tom Alvarez',
  },
} as const;

const BID_SEEDS: BidSeed[] = [
  // Rivera is bidding on these
  {
    id: 'bid-001',
    loadId: 'load-005',
    carrier: 'carrier',
    amount: 1900,
    status: 'pending',
    hoursOld: 10,
    notes: 'Can pick up same day',
  },
  {
    id: 'bid-002',
    loadId: 'load-009',
    carrier: 'carrier',
    amount: 900,
    status: 'countered',
    hoursOld: 6,
    notes: 'Available for flatbed',
  },
  {
    id: 'bid-002-counter',
    loadId: 'load-009',
    carrier: 'carrier',
    amount: 920,
    status: 'pending',
    hoursOld: 2,
    parentId: 'bid-002',
    notes: 'Counter-offer from broker at $920 (was $900)',
  },
  // Competing bids the broker can review
  {
    id: 'bid-004',
    loadId: 'load-005',
    carrier: 'carrier2',
    amount: 1975,
    status: 'pending',
    hoursOld: 9,
    notes: 'Team drivers available',
  },
  {
    id: 'bid-005',
    loadId: 'load-005',
    carrier: 'carrier3',
    amount: 1850,
    status: 'pending',
    hoursOld: 7,
  },
  {
    id: 'bid-006',
    loadId: 'load-009',
    carrier: 'carrier3',
    amount: 940,
    status: 'pending',
    hoursOld: 5,
    notes: 'Tarps on board',
  },
  // Won loads Rivera is working (drives the carrier dashboard)
  {
    id: 'bid-010',
    loadId: 'load-001',
    carrier: 'carrier',
    amount: 3200,
    status: 'accepted',
    hoursOld: 46,
    signed: true,
  },
  {
    id: 'bid-011',
    loadId: 'load-002',
    carrier: 'carrier',
    amount: 2850,
    status: 'accepted',
    hoursOld: 20,
  },
  {
    id: 'bid-012',
    loadId: 'load-004',
    carrier: 'carrier',
    amount: 2400,
    status: 'accepted',
    hoursOld: 70,
    signed: true,
  },
  {
    id: 'bid-013',
    loadId: 'load-007',
    carrier: 'carrier',
    amount: 2100,
    status: 'accepted',
    hoursOld: 34,
    signed: true,
  },
  {
    id: 'bid-014',
    loadId: 'load-008',
    carrier: 'carrier',
    amount: 1100,
    status: 'accepted',
    hoursOld: 118,
    signed: true,
  },
  {
    id: 'bid-015',
    loadId: 'load-010',
    carrier: 'carrier',
    amount: 1650,
    status: 'accepted',
    hoursOld: 46,
    signed: true,
  },
];

function bidToRow(seed: BidSeed): Row {
  const carrier = CARRIER_INFO[seed.carrier];
  return {
    id: seed.id,
    load_id: seed.loadId,
    carrier_id: carrier.id,
    company_id: carrier.companyId,
    company_name: seed.parentId ? `Counter: ${carrier.name}` : carrier.name,
    amount_usd: seed.amount,
    status: seed.status,
    notes: seed.notes ?? null,
    parent_bid_id: seed.parentId ?? null,
    round: seed.parentId ? 2 : 1,
    signatory_name: seed.signed ? carrier.signer : null,
    signature_url: seed.signed ? SAMPLE_SIGNATURE_URL : null,
    signed_at: seed.signed ? hoursAgo(seed.hoursOld - 2) : null,
    created_at: hoursAgo(seed.hoursOld),
    updated_at: hoursAgo(seed.hoursOld),
    expires_at: hoursFromNow(48 - seed.hoursOld),
    deleted_at: null,
  };
}

function buildLoadsAndBids(): { loads: Row[]; bids: Row[] } {
  const bids = BID_SEEDS.map(bidToRow);
  const loads = DEMO_LOADS.map((load, i) => {
    const row = loadToRow(load, i);
    const open = row.status === 'posted' || row.status === 'bid_received';
    // Open loads show the bids that actually exist, so the broker's review list matches the count.
    return open ? { ...row, bid_count: bids.filter((b) => b.load_id === row.id).length } : row;
  });
  return { loads, bids };
}

// ── Documents ────────────────────────────────────────

function doc(id: string, loadId: string, type: string, name: string, extra: Row = {}): Row {
  const pdfUrl = SAMPLE_PDF_BY_TYPE[type];
  return {
    id,
    load_id: loadId,
    type,
    file_name: name,
    file_url: pdfUrl ?? SAMPLE_DOC_URL,
    file_size: 184_320,
    mime_type: pdfUrl ? 'application/pdf' : 'image/svg+xml',
    company_id: DEMO_IDS.carrierCompany,
    uploaded_by: DEMO_IDS.carrier,
    bol_number: null,
    signatory_name: null,
    signature_url: null,
    signed_at: null,
    deleted_at: null,
    created_at: hoursAgo(30),
    ...extra,
  };
}

const signedBy = (name: string, hours: number): Row => ({
  signatory_name: name,
  signature_url: SAMPLE_SIGNATURE_URL,
  signed_at: hoursAgo(hours),
});

const DOCUMENTS: Row[] = [
  doc('doc-bol-001', 'load-001', 'bill_of_lading', 'BOL-DR-1042.pdf', {
    bol_number: 'BOL-DR-1042',
    uploaded_by: DEMO_IDS.driver,
  }),
  doc('doc-bol-004', 'load-004', 'bill_of_lading', 'BOL-DR-1045.pdf', {
    bol_number: 'BOL-DR-1045',
    uploaded_by: DEMO_IDS.driver3,
    ...signedBy('Luis Ortega', 30),
  }),
  doc('doc-bol-007', 'load-007', 'bill_of_lading', 'BOL-DR-1048.pdf', {
    bol_number: 'BOL-DR-1048',
    uploaded_by: DEMO_IDS.driver2,
  }),
  doc('doc-bol-008', 'load-008', 'bill_of_lading', 'BOL-DR-1049.pdf', {
    bol_number: 'BOL-DR-1049',
    uploaded_by: DEMO_IDS.driver,
    ...signedBy('Carlos Mendez', 70),
  }),
  doc('doc-bol-010', 'load-010', 'bill_of_lading', 'BOL-DR-1051.pdf', {
    bol_number: 'BOL-DR-1051',
    uploaded_by: DEMO_IDS.driver2,
  }),
  doc('doc-rc-001', 'load-001', 'rate_confirmation', 'RateCon-DR-1042.pdf', {
    company_id: DEMO_IDS.brokerCompany,
    uploaded_by: DEMO_IDS.broker,
    ...signedBy('Marcus Rivera', 44),
  }),
  doc('doc-rc-002', 'load-002', 'rate_confirmation', 'RateCon-DR-1043.pdf', {
    company_id: DEMO_IDS.brokerCompany,
    uploaded_by: DEMO_IDS.broker,
    created_at: hoursAgo(19),
  }),
  doc('doc-rc-007', 'load-007', 'rate_confirmation', 'RateCon-DR-1048.pdf', {
    company_id: DEMO_IDS.brokerCompany,
    uploaded_by: DEMO_IDS.broker,
    ...signedBy('Marcus Rivera', 32),
  }),
  doc('doc-pod-004', 'load-004', 'proof_of_delivery', 'POD-DR-1045.jpg', {
    uploaded_by: DEMO_IDS.driver3,
    created_at: hoursAgo(6),
  }),
  doc('doc-pod-008', 'load-008', 'proof_of_delivery', 'POD-DR-1049.jpg', {
    uploaded_by: DEMO_IDS.driver,
    created_at: hoursAgo(66),
  }),
];

// ── Notifications ────────────────────────────────────

type NotificationSeed = [
  type: string,
  title: string,
  body: string,
  loadId: string | null,
  hours: number,
  read: boolean,
];

const NOTIFICATIONS_BY_USER: Record<string, NotificationSeed[]> = {
  [DEMO_IDS.carrier]: [
    [
      'bid_accepted',
      'Bid Accepted — Sign Rate Con',
      'Your bid on DR-1043 Nashville → Chicago was accepted. Sign the rate confirmation to dispatch.',
      'load-002',
      2,
      false,
    ],
    [
      'bid_countered',
      'Counter-Offer Received',
      'Apex Freight countered your $900 bid with $920 on DR-1050.',
      'load-009',
      3,
      false,
    ],
    [
      'load_status_change',
      'Load DR-1045 — delivered',
      'Load DR-1045 (Miami → Charlotte) is now delivered.',
      'load-004',
      5,
      false,
    ],
    [
      'load_assigned',
      'Driver Assigned',
      'Carlos Mendez assigned to DR-1042.',
      'load-001',
      12,
      true,
    ],
    ['bol_signed', 'BOL Signed', 'BOL signed for DR-1045 Miami → Charlotte.', 'load-004', 30, true],
  ],
  [DEMO_IDS.broker]: [
    [
      'new_bid',
      'New bid received',
      'Summit Haulers bid $1,850 on load DR-1046.',
      'load-005',
      7,
      false,
    ],
    [
      'new_bid',
      'New bid received',
      'Blue Ridge Logistics bid $1,975 on load DR-1046.',
      'load-005',
      9,
      false,
    ],
    [
      'new_bid',
      'New bid received',
      'Summit Haulers bid $940 on load DR-1050.',
      'load-009',
      5,
      false,
    ],
    [
      'load_status_change',
      'Load DR-1042 — in transit',
      'Load DR-1042 (Atlanta → Dallas) is now in transit.',
      'load-001',
      20,
      true,
    ],
    [
      'rate_con_signed',
      'Rate Con Signed',
      'Rivera Transport signed the rate confirmation for DR-1048.',
      'load-007',
      32,
      true,
    ],
  ],
  [DEMO_IDS.shipper]: [
    [
      'load_status_change',
      'Load DR-1051 — in transit',
      'Load DR-1051 (San Antonio → New Orleans) is now in transit.',
      'load-010',
      4,
      false,
    ],
    [
      'load_status_change',
      'Load DR-1045 — delivered',
      'Load DR-1045 (Miami → Charlotte) is now delivered. Confirm receipt to close out.',
      'load-004',
      6,
      false,
    ],
    [
      'bol_signed',
      'BOL Signed',
      'BOL signed at pickup for DR-1049 Detroit → Indianapolis.',
      'load-008',
      70,
      true,
    ],
  ],
  [DEMO_IDS.driver]: [
    [
      'load_assigned',
      'New Load Assigned',
      'You have been assigned load DR-1042: Atlanta, GA → Dallas, TX',
      'load-001',
      30,
      true,
    ],
    [
      'load_reminder',
      'Delivery Appointment',
      'DR-1042 delivery window opens tomorrow 7:00 AM at Dallas Receiving.',
      'load-001',
      1,
      false,
    ],
  ],
  [DEMO_IDS.driver2]: [
    [
      'load_reminder',
      'Delivery Appointment',
      'DR-1051 delivers tomorrow 7:00 AM at New Orleans Receiving.',
      'load-010',
      2,
      false,
    ],
    [
      'load_assigned',
      'Next Load Assigned',
      'After DR-1051: DR-1048 Denver, CO → Kansas City, MO picks up in 2 days.',
      'load-007',
      20,
      true,
    ],
  ],
  [DEMO_IDS.driver3]: [
    [
      'load_status_change',
      'POD Accepted',
      'Proof of delivery accepted for DR-1045 Miami → Charlotte.',
      'load-004',
      5,
      false,
    ],
    [
      'load_assigned',
      'New Load Assigned',
      'You have been assigned load DR-1045: Miami, FL → Charlotte, NC',
      'load-004',
      40,
      true,
    ],
  ],
};

function buildNotifications(): Row[] {
  return Object.entries(NOTIFICATIONS_BY_USER).flatMap(([userId, seeds]) =>
    seeds.map(([type, title, body, loadId, hours, read], i) => ({
      id: `notif-${userId}-${i + 1}`,
      user_id: userId,
      type,
      title,
      body,
      load_id: loadId,
      read,
      created_at: hoursAgo(hours),
    })),
  );
}

// ── Live tracking ────────────────────────────────────

type Waypoint = [lat: number, lng: number, hoursAgo: number, label: string];

const ROUTES: Array<{ loadNumber: string; driverId: string; points: Waypoint[] }> = [
  {
    loadNumber: 'DR-1042',
    driverId: DEMO_IDS.driver,
    points: [
      [33.749, -84.388, 20, 'Atlanta, GA'],
      [33.521, -86.802, 16, 'Birmingham, AL'],
      [32.299, -90.185, 10, 'Jackson, MS'],
      [32.525, -93.75, 4, 'Shreveport, LA'],
      [32.5, -94.74, 0.02, 'Longview, TX'],
    ],
  },
  {
    loadNumber: 'DR-1051',
    driverId: DEMO_IDS.driver2,
    points: [
      [29.424, -98.494, 8, 'San Antonio, TX'],
      [29.76, -95.37, 3, 'Houston, TX'],
      [30.08, -94.13, 0.03, 'Beaumont, TX'],
    ],
  },
  // DR-1048 hasn't picked up yet (Mike's next load), so it has no pings.
];

function buildLocationPings(): Row[] {
  return ROUTES.flatMap(({ loadNumber, driverId, points }) =>
    points.map(([lat, lng, hours], i) => ({
      id: `ping-${loadNumber}-${i + 1}`,
      load_number: loadNumber,
      driver_id: driverId,
      latitude: lat,
      longitude: lng,
      accuracy_m: 12,
      heading_deg: 270,
      speed_ms: hours < 1 ? 28 : 0,
      recorded_at: hoursAgo(hours),
    })),
  );
}

type MilestoneSeed = [
  label: string,
  location: string,
  hours: number | null,
  completed: boolean,
  current: boolean,
];

const MILESTONES: Record<string, MilestoneSeed[]> = {
  'DR-1042': [
    ['Picked up', 'Atlanta, GA', 20, true, false],
    ['In transit', 'Shreveport, LA', 4, true, false],
    ['Near destination', 'Longview, TX', 0.1, false, true],
    ['Delivered', 'Dallas, TX', null, false, false],
  ],
  'DR-1051': [
    ['Picked up', 'San Antonio, TX', 8, true, false],
    ['In transit', 'Houston, TX', 3, false, true],
    ['Delivered', 'New Orleans, LA', null, false, false],
  ],
  'DR-1048': [
    ['Dispatched', 'Denver, CO', 20, true, true],
    ['Picked up', 'Denver, CO', null, false, false],
    ['Delivered', 'Kansas City, MO', null, false, false],
  ],
  'DR-1045': [
    ['Picked up', 'Miami, FL', 30, true, false],
    ['In transit', 'Jacksonville, FL', 20, true, false],
    ['Delivered', 'Charlotte, NC', 6, true, true],
  ],
};

function buildMilestones(): Row[] {
  return Object.entries(MILESTONES).flatMap(([loadNumber, seeds]) =>
    seeds.map(([label, location, hours, completed, current], i) => ({
      id: `ms-${loadNumber}-${i + 1}`,
      load_number: loadNumber,
      label,
      location,
      milestone_timestamp: hours === null ? null : hoursAgo(hours),
      completed,
      current,
      sort_order: i + 1,
      created_at: hoursAgo(hours ?? 0),
    })),
  );
}

// ── Postgres functions ───────────────────────────────

function findById(rows: readonly Row[], id: unknown): Row | undefined {
  return rows.find((r) => r.id === id);
}

const awardLoad: (
  loadId: unknown,
  winningBidId: unknown,
  ctx: Parameters<DemoHandler>[1],
) => void = (loadId, winningBidId, { db }) => {
  const now = new Date().toISOString();
  db.update(
    'bids',
    (b) =>
      b.load_id === loadId &&
      b.id !== winningBidId &&
      (b.status === 'pending' || b.status === 'countered'),
    { status: 'declined', updated_at: now },
  );
  db.update('loads', (l) => l.id === loadId, { status: 'awarded' });
};

const RPC: Record<string, DemoHandler> = {
  send_notification: (args, { db }) => {
    const [created] = db.insert('notifications', [
      {
        user_id: args.p_user_id,
        type: args.p_type,
        title: args.p_title,
        body: args.p_body ?? null,
        load_id: args.p_load_id ?? null,
      },
    ]);
    return created?.id ?? null;
  },
  enqueue_notification: () => null,
  write_audit_log: () => null,
  notify_carriers_new_load: () => null,
  check_carrier_eligible: () => true,
  increment_bid_count: (args, { db }) => {
    const load = findById(db.read('loads'), args.load_id);
    if (load) db.update('loads', (l) => l === load, { bid_count: Number(load.bid_count ?? 0) + 1 });
    return null;
  },
  accept_bid: (args, ctx) => {
    const bid = findById(ctx.db.read('bids'), args.bid_id);
    if (!bid) throw new Error('Bid not found.');
    ctx.db.update('bids', (b) => b === bid, {
      status: 'accepted',
      updated_at: new Date().toISOString(),
    });
    awardLoad(bid.load_id, bid.id, ctx);
    return null;
  },
  book_now: (args, ctx) => {
    const { db, identity } = ctx;
    if (!identity) throw new Error('Sign in to book loads.');
    const load = findById(db.read('loads'), args.p_load_id);
    if (!load) throw new Error('Load not found.');
    if (load.status !== 'posted' && load.status !== 'bid_received') {
      throw new Error('This load is no longer available.');
    }
    const carrierCompany = findById(db.read('companies'), identity.companyId);
    const [bid] = db.insert('bids', [
      {
        load_id: load.id,
        carrier_id: identity.id,
        company_id: identity.companyId,
        company_name: carrierCompany?.name ?? identity.fullName,
        amount_usd: load.rate_usd,
        status: 'accepted',
        notes: 'Booked at posted rate',
      },
    ]);
    awardLoad(load.id, bid?.id, ctx);
    return null;
  },
};

export const coreDomain: DemoDomain = {
  seeds: () => {
    const { loads, bids } = buildLoadsAndBids();
    return {
      profiles: PROFILES,
      companies: COMPANIES,
      company_members: COMPANY_MEMBERS,
      loads,
      bids,
      documents: DOCUMENTS,
      notifications: buildNotifications(),
      location_pings: buildLocationPings(),
      tracking_milestones: buildMilestones(),
    };
  },
  rpc: RPC,
};
