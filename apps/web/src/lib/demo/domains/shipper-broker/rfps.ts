/** Park Manufacturing's contract RFPs, their lanes and carrier proposals, plus get_rfp_summary. */
import { DEMO_IDS } from '../../identities';
import { daysFromNow, hoursAgo } from '../../time';
import type { DemoHandler, Row, SeedTables } from '../../types';

interface RfpSeed {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'evaluating' | 'awarded' | 'closed';
  startDays: number;
  endDays: number;
  deadlineDays: number;
  volume: string;
  equipment: string;
  ageDays: number;
}

const RFP_SEEDS: RfpSeed[] = [
  {
    id: 'rfp-001',
    title: '2027 Inbound Raw Materials Program',
    description:
      'Inbound steel blanks, resin and fasteners into the Detroit and Toledo plants. Drop-trailer preferred, 98% on-time required.',
    status: 'open',
    startDays: 90,
    endDays: 455,
    deadlineDays: 12,
    volume: '30 loads/week',
    equipment: 'van',
    ageDays: 9,
  },
  {
    id: 'rfp-002',
    title: 'Q4 Southeast Reefer Lanes',
    description:
      'Temperature-controlled adhesives and coatings to Southeast distributors. Continuous 45°F, temp logs required on delivery.',
    status: 'evaluating',
    startDays: 18,
    endDays: 110,
    deadlineDays: -3,
    volume: '10 loads/week',
    equipment: 'reefer',
    ageDays: 26,
  },
  {
    id: 'rfp-003',
    title: 'Steel Coil Flatbed — H1',
    description: 'Coil racks and chains required. Tarped loads only; 48-hour tender acceptance.',
    status: 'awarded',
    startDays: -60,
    endDays: 120,
    deadlineDays: -75,
    volume: '6 loads/week',
    equipment: 'flatbed',
    ageDays: 95,
  },
  {
    id: 'rfp-004',
    title: 'Holiday Peak Surge Capacity',
    description: 'Overflow capacity for November–December retail replenishment out of Detroit.',
    status: 'draft',
    startDays: 55,
    endDays: 110,
    deadlineDays: 21,
    volume: '12 loads/week',
    equipment: 'van',
    ageDays: 1,
  },
];

function rfpToRow(seed: RfpSeed): Row {
  const published = seed.status !== 'draft';
  return {
    id: seed.id,
    company_id: DEMO_IDS.shipperCompany,
    created_by: DEMO_IDS.shipper,
    title: seed.title,
    description: seed.description,
    contract_start: daysFromNow(seed.startDays),
    contract_end: daysFromNow(seed.endDays),
    // The UI reads `deadline`; the table's column is `closes_at` — keep both in sync.
    deadline: daysFromNow(seed.deadlineDays),
    closes_at: daysFromNow(seed.deadlineDays),
    volume_estimate: seed.volume,
    equipment: seed.equipment,
    requirements: {},
    status: seed.status,
    published_at: published ? hoursAgo(24 * (seed.ageDays - 1)) : null,
    visibility: 'public',
    created_at: hoursAgo(24 * seed.ageDays),
    updated_at: hoursAgo(24 * Math.max(seed.ageDays - 2, 0)),
  };
}

type LaneSeed = [
  id: string,
  rfpId: string,
  origin: [city: string, state: string],
  dest: [city: string, state: string],
  equipment: string,
  perWeek: number,
  target: number,
  awarded?: [companyId: string, rate: number],
];

const LANE_SEEDS: LaneSeed[] = [
  ['lane-001-a', 'rfp-001', ['Chicago', 'IL'], ['Detroit', 'MI'], 'van', 12, 1150],
  ['lane-001-b', 'rfp-001', ['Columbus', 'OH'], ['Detroit', 'MI'], 'van', 8, 980],
  ['lane-001-c', 'rfp-001', ['Indianapolis', 'IN'], ['Toledo', 'OH'], 'van', 6, 890],
  ['lane-001-d', 'rfp-001', ['Nashville', 'TN'], ['Detroit', 'MI'], 'van', 4, 1850],
  ['lane-002-a', 'rfp-002', ['Detroit', 'MI'], ['Atlanta', 'GA'], 'reefer', 5, 2950],
  ['lane-002-b', 'rfp-002', ['Toledo', 'OH'], ['Charlotte', 'NC'], 'reefer', 3, 2400],
  ['lane-002-c', 'rfp-002', ['Indianapolis', 'IN'], ['Jacksonville', 'FL'], 'reefer', 2, 2650],
  [
    'lane-003-a',
    'rfp-003',
    ['Detroit', 'MI'],
    ['Birmingham', 'AL'],
    'flatbed',
    4,
    2300,
    [DEMO_IDS.carrier3Company, 2240],
  ],
  [
    'lane-003-b',
    'rfp-003',
    ['Detroit', 'MI'],
    ['Houston', 'TX'],
    'flatbed',
    2,
    3400,
    [DEMO_IDS.carrier2Company, 3350],
  ],
  ['lane-004-a', 'rfp-004', ['Detroit', 'MI'], ['Dallas', 'TX'], 'van', 6, 2450],
  ['lane-004-b', 'rfp-004', ['Detroit', 'MI'], ['Memphis', 'TN'], 'van', 6, 1720],
];

function laneToRow([
  id,
  rfpId,
  [oCity, oState],
  [dCity, dState],
  equipment,
  perWeek,
  target,
  awarded,
]: LaneSeed): Row {
  return {
    id,
    rfp_id: rfpId,
    origin_city: oCity,
    origin_state: oState,
    dest_city: dCity,
    dest_state: dState,
    equipment,
    loads_per_week: perWeek,
    target_rate_usd: target,
    special_requirements:
      equipment === 'reefer' ? 'Continuous 45°F with downloadable temp log' : null,
    status: awarded ? 'awarded' : 'open',
    awarded_to: awarded?.[0] ?? null,
    awarded_rate: awarded?.[1] ?? null,
    created_at: hoursAgo(24 * 20),
  };
}

const CARRIER_SUBMITTER: Record<string, string> = {
  [DEMO_IDS.carrierCompany]: DEMO_IDS.carrier,
  [DEMO_IDS.carrier2Company]: DEMO_IDS.carrier2,
  [DEMO_IDS.carrier3Company]: DEMO_IDS.carrier3,
};

type ProposalSeed = [
  id: string,
  laneId: string,
  companyId: string,
  rate: number,
  capacity: number,
  transitDays: number,
  status: 'submitted' | 'shortlisted' | 'awarded' | 'rejected',
  notes: string | null,
];

const PROPOSAL_SEEDS: ProposalSeed[] = [
  [
    'prop-001',
    'lane-001-d',
    DEMO_IDS.carrierCompany,
    1795,
    4,
    1,
    'submitted',
    'Nashville domicile — backhaul fits our network.',
  ],
  [
    'prop-002',
    'lane-001-a',
    DEMO_IDS.carrier2Company,
    1120,
    10,
    1,
    'submitted',
    'Drop trailers available at both ends.',
  ],
  ['prop-003', 'lane-001-c', DEMO_IDS.carrier3Company, 915, 6, 1, 'submitted', null],
  [
    'prop-004',
    'lane-002-a',
    DEMO_IDS.carrierCompany,
    2880,
    5,
    2,
    'shortlisted',
    'Carrier-owned reefers, 2023 or newer. Temp logs via ELD.',
  ],
  [
    'prop-005',
    'lane-002-a',
    DEMO_IDS.carrier2Company,
    2990,
    3,
    2,
    'submitted',
    'Team service available for hot loads.',
  ],
  ['prop-006', 'lane-002-b', DEMO_IDS.carrier3Company, 2350, 3, 2, 'submitted', null],
  [
    'prop-007',
    'lane-002-c',
    DEMO_IDS.carrierCompany,
    2610,
    2,
    2,
    'submitted',
    'Can flex to 3/wk in November.',
  ],
  [
    'prop-008',
    'lane-003-a',
    DEMO_IDS.carrier3Company,
    2240,
    4,
    1,
    'awarded',
    'Coil racks + tarps standard.',
  ],
  ['prop-009', 'lane-003-b', DEMO_IDS.carrier2Company, 3350, 2, 2, 'awarded', null],
  ['prop-010', 'lane-003-a', DEMO_IDS.carrierCompany, 2290, 3, 1, 'rejected', null],
];

function proposalToRow([
  id,
  laneId,
  companyId,
  rate,
  capacity,
  transitDays,
  status,
  notes,
]: ProposalSeed): Row {
  const lane = LANE_SEEDS.find(([lid]) => lid === laneId);
  return {
    id,
    rfp_id: lane?.[1] ?? null,
    rfp_lane_id: laneId,
    carrier_company_id: companyId,
    submitted_by: CARRIER_SUBMITTER[companyId] ?? DEMO_IDS.carrier,
    proposed_rate_usd: rate,
    capacity_per_week: capacity,
    transit_days: transitDays,
    equipment_offered: lane?.[4] ?? null,
    notes,
    status,
    created_at: hoursAgo(24 * 6),
    updated_at: hoursAgo(24 * 2),
  };
}

const getRfpSummary: DemoHandler = (args, { db }) => {
  const rfpId = args.p_rfp_id;
  if (!db.read('rfps').some((r) => r.id === rfpId)) return null;
  const lanes = db.read('rfp_lanes').filter((l) => l.rfp_id === rfpId);
  const proposals = db.read('rfp_proposals').filter((p) => p.rfp_id === rfpId);
  const awardedLaneIds = new Set([
    ...lanes.filter((l) => l.status === 'awarded').map((l) => l.id),
    ...proposals.filter((p) => p.status === 'awarded').map((p) => p.rfp_lane_id),
  ]);
  const total = proposals.reduce((sum, p) => sum + Number(p.proposed_rate_usd ?? 0), 0);
  return {
    rfp_id: rfpId,
    total_lanes: lanes.length,
    total_proposals: proposals.length,
    lanes_awarded: awardedLaneIds.size,
    avg_proposed_rate: proposals.length ? Math.round(total / proposals.length) : 0,
  };
};

export function rfpSeeds(): SeedTables {
  return {
    rfps: RFP_SEEDS.map(rfpToRow),
    rfp_lanes: LANE_SEEDS.map(laneToRow),
    rfp_proposals: PROPOSAL_SEEDS.map(proposalToRow),
  };
}

export const RFP_RPC: Record<string, DemoHandler> = {
  get_rfp_summary: getRfpSummary,
};
