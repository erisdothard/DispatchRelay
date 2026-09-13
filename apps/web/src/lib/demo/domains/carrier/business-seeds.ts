/**
 * Rivera Transport's commercial side: QuickPay/factoring history, direct load invitations,
 * open shipper/broker RFPs, preferred lanes and the spot-market lane index behind the
 * spot-rate, lane-suggestion and backhaul screens.
 */
import { DEMO_IDS } from '../../identities';
import { daysFromNow, hoursAgo, hoursFromNow } from '../../time';
import type { Row, SeedTables } from '../../types';

const COMPANY_ID = DEMO_IDS.carrierCompany;
const DAY = 24;

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ── QuickPay / factoring ─────────────────────────────

function factoringRequests(): Row[] {
  const request = (
    id: string,
    loadId: string | null,
    loadNumber: string,
    invoice: number,
    feePercent: number,
    status: string,
    hoursOld: number,
    extra: Row = {},
  ): Row => ({
    id,
    carrier_id: DEMO_IDS.carrier,
    company_id: COMPANY_ID,
    load_id: loadId,
    load_number: loadNumber,
    invoice_amount: invoice,
    fee_percent: feePercent,
    net_payout: round2(invoice * (1 - feePercent / 100)),
    status,
    factor_partner: 'FreightX QuickPay',
    notes: null,
    requested_at: hoursAgo(hoursOld),
    approved_at: null,
    funded_at: null,
    created_at: hoursAgo(hoursOld),
    updated_at: hoursAgo(hoursOld),
    ...extra,
  });
  // DR-1045 (delivered, POD on file) is intentionally left un-factored so the demo can request it.
  return [
    request('fr-rt-1041', null, 'DR-1041', 1850, 3, 'requested', 5, {
      notes: 'Signed POD attached — Memphis receiver',
    }),
    request('fr-rt-1049', 'load-008', 'DR-1049', 1100, 4, 'funded', 110, {
      approved_at: hoursAgo(108),
      funded_at: hoursAgo(101),
    }),
    request('fr-rt-1039', null, 'DR-1039', 1980, 3, 'approved', 30, {
      approved_at: hoursAgo(26),
    }),
    request('fr-rt-1036', null, 'DR-1036', 2750, 3, 'funded', DAY * 12, {
      approved_at: hoursAgo(DAY * 12 - 3),
      funded_at: hoursAgo(DAY * 11),
    }),
    request('fr-rt-1027', null, 'DR-1027', 3100, 3, 'denied', DAY * 18, {
      notes: 'Broker on credit hold — resubmit once cleared',
    }),
    request('fr-rt-1022', null, 'DR-1022', 2250, 5, 'funded', DAY * 26, {
      approved_at: hoursAgo(DAY * 26 - 2),
      funded_at: hoursAgo(DAY * 26 - 6),
    }),
  ];
}

// ── Direct load invitations ──────────────────────────

function loadInvitations(): Row[] {
  const invitation = (
    id: string,
    loadId: string,
    invitedBy: string,
    status: string,
    message: string | null,
    expiresInHours: number,
    hoursOld: number,
  ): Row => ({
    id,
    load_id: loadId,
    carrier_company_id: COMPANY_ID,
    invited_by: invitedBy,
    status,
    message,
    expires_at: hoursFromNow(expiresInHours),
    created_at: hoursAgo(hoursOld),
  });
  return [
    invitation(
      'linv-rt-003',
      'load-003',
      DEMO_IDS.broker,
      'pending',
      'Preferred-carrier invite — tarps required.',
      30,
      3,
    ),
    invitation(
      'linv-rt-006',
      'load-006',
      DEMO_IDS.shipper,
      'pending',
      'Machinery move, dock to dock. You ran this lane for us last month.',
      44,
      6,
    ),
    invitation('linv-rt-005', 'load-005', DEMO_IDS.broker, 'accepted', null, 20, 12),
  ];
}

// ── RFPs ─────────────────────────────────────────────

type LaneSeed = [
  originCity: string,
  originState: string,
  destCity: string,
  destState: string,
  loadsPerWeek: number,
  targetRate: number,
];

interface RfpSeed {
  id: string;
  companyId: string;
  createdBy: string;
  title: string;
  description: string;
  equipment: string;
  volume: string;
  deadlineDays: number;
  startDays: number;
  termDays: number;
  publishedDaysAgo: number;
  lanes: LaneSeed[];
}

const RFP_SEEDS: RfpSeed[] = [
  {
    id: 'rfp-park-midwest-2027',
    companyId: DEMO_IDS.shipperCompany,
    createdBy: DEMO_IDS.shipper,
    title: 'Park Manufacturing — Midwest Outbound Van Program',
    description:
      'Annual dedicated capacity out of our Detroit plant. Drop trailers available; 98% on-time required.',
    equipment: 'van',
    volume: '~27 loads/week',
    deadlineDays: 9,
    startDays: 45,
    termDays: 365,
    publishedDaysAgo: 4,
    lanes: [
      ['Detroit', 'MI', 'Indianapolis', 'IN', 8, 1150],
      ['Detroit', 'MI', 'Chicago', 'IL', 10, 1275],
      ['Detroit', 'MI', 'Nashville', 'TN', 5, 2050],
      ['Detroit', 'MI', 'Atlanta', 'GA', 4, 2600],
    ],
  },
  {
    id: 'rfp-apex-se-reefer',
    companyId: DEMO_IDS.brokerCompany,
    createdBy: DEMO_IDS.broker,
    title: 'Apex Freight — Southeast Reefer Dedicated Lanes',
    description:
      'Temperature-controlled produce and dairy for two grocery accounts. Continuous-run reefers, team optional.',
    equipment: 'reefer',
    volume: '~13 loads/week',
    deadlineDays: 5,
    startDays: 30,
    termDays: 180,
    publishedDaysAgo: 2,
    lanes: [
      ['Nashville', 'TN', 'Chicago', 'IL', 6, 2800],
      ['Atlanta', 'GA', 'Dallas', 'TX', 4, 3150],
      ['Miami', 'FL', 'Charlotte', 'NC', 3, 2350],
    ],
  },
  {
    id: 'rfp-apex-gulf-flatbed',
    companyId: DEMO_IDS.brokerCompany,
    createdBy: DEMO_IDS.broker,
    title: 'Apex Freight — Gulf Coast Flatbed Program',
    description:
      'Steel and building materials out of Houston and Mobile. Tarps and chains required.',
    equipment: 'flatbed',
    volume: '~7 loads/week',
    deadlineDays: 14,
    startDays: 21,
    termDays: 120,
    publishedDaysAgo: 1,
    lanes: [
      ['Houston', 'TX', 'Memphis', 'TN', 4, 1900],
      ['Mobile', 'AL', 'Atlanta', 'GA', 3, 1450],
    ],
  },
];

function rfpTables(): { rfps: Row[]; lanes: Row[]; proposals: Row[] } {
  const rfps = RFP_SEEDS.map(
    (seed): Row => ({
      id: seed.id,
      company_id: seed.companyId,
      created_by: seed.createdBy,
      title: seed.title,
      description: seed.description,
      contract_start: daysFromNow(seed.startDays),
      contract_end: daysFromNow(seed.startDays + seed.termDays),
      // The UI reads `deadline`; the table column is `closes_at`.
      deadline: hoursFromNow(DAY * seed.deadlineDays),
      closes_at: hoursFromNow(DAY * seed.deadlineDays),
      volume_estimate: seed.volume,
      equipment: seed.equipment,
      requirements: {},
      status: 'open',
      published_at: hoursAgo(DAY * seed.publishedDaysAgo),
      visibility: 'public',
      created_at: hoursAgo(DAY * (seed.publishedDaysAgo + 1)),
      updated_at: hoursAgo(DAY * seed.publishedDaysAgo),
    }),
  );
  const lanes = RFP_SEEDS.flatMap((seed) =>
    seed.lanes.map(
      ([originCity, originState, destCity, destState, perWeek, target], i): Row => ({
        id: `${seed.id}-lane-${i + 1}`,
        rfp_id: seed.id,
        origin_city: originCity,
        origin_state: originState,
        dest_city: destCity,
        dest_state: destState,
        equipment: seed.equipment,
        loads_per_week: perWeek,
        target_rate_usd: target,
        special_requirements: null,
        status: 'open',
        awarded_to: null,
        awarded_rate: null,
        created_at: hoursAgo(DAY * (seed.publishedDaysAgo + 1)),
      }),
    ),
  );
  const proposal = (
    id: string,
    laneId: string,
    carrierCompanyId: string,
    submittedBy: string,
    rate: number,
    perWeek: number,
    hoursOld: number,
    notes: string | null,
  ): Row => ({
    id,
    rfp_id: 'rfp-apex-se-reefer',
    rfp_lane_id: laneId,
    carrier_company_id: carrierCompanyId,
    submitted_by: submittedBy,
    proposed_rate_usd: rate,
    capacity_per_week: perWeek,
    transit_days: 1,
    equipment_offered: 'reefer',
    notes,
    status: 'submitted',
    created_at: hoursAgo(hoursOld),
    updated_at: hoursAgo(hoursOld),
  });
  const proposals = [
    proposal(
      'rfpp-rt-1',
      'rfp-apex-se-reefer-lane-1',
      COMPANY_ID,
      DEMO_IDS.carrier,
      2750,
      3,
      20,
      'Home-based in Nashville — can cover Mon/Wed/Fri.',
    ),
    proposal(
      'rfpp-br-1',
      'rfp-apex-se-reefer-lane-1',
      DEMO_IDS.carrier2Company,
      DEMO_IDS.carrier2,
      2825,
      2,
      14,
      null,
    ),
  ];
  return { rfps, lanes, proposals };
}

// ── Lanes & market ───────────────────────────────────

function lanePreferences(): Row[] {
  const pref = (
    id: string,
    origin: string,
    dest: string,
    equipment: string,
    minRpm: number,
  ): Row => ({
    id,
    carrier_company_id: COMPANY_ID,
    origin_state: origin,
    dest_state: dest,
    equipment,
    min_rate_per_mile: minRpm,
    max_deadhead_miles: 150,
    active: true,
    created_at: hoursAgo(DAY * 30),
    updated_at: hoursAgo(DAY * 30),
  });
  return [
    pref('lp-rt-tn-il', 'TN', 'IL', 'van', 2.5),
    pref('lp-rt-ga-tx', 'GA', 'TX', 'van', 2.3),
    pref('lp-rt-tx-la', 'TX', 'LA', 'reefer', 2.8),
    pref('lp-rt-tn-ga', 'TN', 'GA', 'flatbed', 2.6),
  ];
}

type MarketLane = [
  origin: string,
  dest: string,
  equipment: string,
  avgRpm: number,
  lowRpm: number,
  highRpm: number,
  loadCount: number,
  trendPct: number,
];

/** Trailing-7-day spot market, $/mile. Demo-only table read by get_spot_rate_index. */
const MARKET_LANES: MarketLane[] = [
  ['TX', 'TX', 'van', 2.66, 2.2, 3.15, 240, 0.3],
  ['GA', 'TX', 'van', 2.41, 2.05, 2.88, 212, 2.7],
  ['TN', 'IL', 'van', 2.58, 2.21, 3.05, 184, 4.2],
  ['TX', 'TN', 'van', 2.29, 1.94, 2.66, 176, -1.8],
  ['IL', 'TN', 'van', 2.12, 1.8, 2.49, 158, -2.6],
  ['FL', 'NC', 'van', 2.34, 1.98, 2.71, 143, -3.1],
  ['MI', 'IN', 'van', 2.87, 2.4, 3.36, 121, 0.9],
  ['GA', 'FL', 'reefer', 2.52, 2.15, 2.95, 109, 1.9],
  ['TX', 'LA', 'reefer', 2.96, 2.52, 3.44, 97, 5.8],
  ['TN', 'IL', 'reefer', 3.08, 2.66, 3.57, 91, 3.9],
  ['CA', 'AZ', 'flatbed', 3.12, 2.7, 3.66, 88, 0.6],
  ['TN', 'GA', 'flatbed', 2.78, 2.4, 3.2, 86, 3.6],
  ['FL', 'GA', 'flatbed', 2.63, 2.25, 3.02, 72, 2.1],
  ['CO', 'MO', 'reefer', 2.74, 2.36, 3.18, 64, 3.3],
  ['WA', 'OR', 'step_deck', 3.35, 2.88, 3.92, 41, -0.4],
];

const TREND_FLAT_BAND = 1;

function spotRateIndex(): Row[] {
  return MARKET_LANES.map(([origin, dest, equipment, avg, low, high, count, trend]) => ({
    id: `spot-${origin}-${dest}-${equipment}`.toLowerCase(),
    origin_state: origin,
    destination_state: dest,
    equipment_type: equipment,
    avg_rate: avg,
    min_rate: low,
    max_rate: high,
    load_count: count,
    trend_direction: Math.abs(trend) < TREND_FLAT_BAND ? 'stable' : trend > 0 ? 'up' : 'down',
    trend_pct: trend,
    period: 'Last 7 days',
  }));
}

export function businessSeeds(): SeedTables {
  const { rfps, lanes, proposals } = rfpTables();
  return {
    factoring_requests: factoringRequests(),
    load_invitations: loadInvitations(),
    rfps,
    rfp_lanes: lanes,
    rfp_proposals: proposals,
    carrier_lane_preferences: lanePreferences(),
    spot_rate_index: spotRateIndex(),
  };
}
