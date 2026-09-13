/**
 * Carrier sourcing for brokers and shippers: extra marketplace carriers, preferred/blocked
 * relationships, load invitations, and the carrier-ranking / invite Postgres functions.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo, hoursFromNow } from '../../time';
import type { DemoContext, DemoHandler, Row, SeedTables } from '../../types';
import { findById, num, requireIdentity, str } from './helpers';

const GREAT_LAKES_CO = 'demo-company-carrier-4';
const REDLINE_CO = 'demo-company-carrier-5';

function carrierCompany(id: string, name: string, city: string, state: string, extra: Row): Row {
  return {
    id,
    owner_id: null,
    name,
    type: 'carrier',
    city,
    state,
    address: null,
    zip: null,
    phone: '(555) 010-4400',
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
    rating: 4.5,
    on_time_percent: 92,
    total_loads: 0,
    created_at: hoursAgo(24 * 500),
    updated_at: hoursAgo(24 * 3),
    ...extra,
  };
}

/** Marketplace carriers with no demo login — they give brokers someone to source and block. */
const EXTRA_CARRIERS: Row[] = [
  carrierCompany(GREAT_LAKES_CO, 'Great Lakes Carriers', 'Toledo', 'OH', {
    mc_number: 'MC-557310',
    dot_number: 'DOT-2419087',
    email: 'dispatch@greatlakescarriers.example',
    rating: 4.7,
    on_time_percent: 95,
    total_loads: 264,
  }),
  carrierCompany(REDLINE_CO, 'Redline Express LLC', 'Gary', 'IN', {
    mc_number: 'MC-615502',
    dot_number: 'DOT-3570112',
    verified: false,
    rating: 3.1,
    on_time_percent: 78,
    total_loads: 41,
  }),
];

type RelSeed = [
  id: string,
  companyId: string,
  carrierCompanyId: string,
  status: 'preferred' | 'blocked',
  notes: string,
  days: number,
];

const REL_SEEDS: RelSeed[] = [
  [
    'crel-001',
    DEMO_IDS.brokerCompany,
    DEMO_IDS.carrierCompany,
    'preferred',
    'Top performer on TN/GA lanes — 98% on-time with Apex',
    90,
  ],
  [
    'crel-002',
    DEMO_IDS.brokerCompany,
    DEMO_IDS.carrier2Company,
    'preferred',
    'Team drivers — first call for expedited reefer',
    45,
  ],
  [
    'crel-003',
    DEMO_IDS.brokerCompany,
    GREAT_LAKES_CO,
    'preferred',
    'Strong Midwest van coverage, drop trailers in Toledo',
    20,
  ],
  [
    'crel-004',
    DEMO_IDS.brokerCompany,
    REDLINE_CO,
    'blocked',
    'Two missed pickups in August; suspected double-brokering',
    12,
  ],
  [
    'crel-005',
    DEMO_IDS.shipperCompany,
    DEMO_IDS.carrierCompany,
    'preferred',
    'Handles our Detroit → Indy freight reliably',
    60,
  ],
];

function relToRow([id, companyId, carrierId, status, notes, days]: RelSeed): Row {
  return {
    id,
    company_id: companyId,
    carrier_id: carrierId,
    status,
    notes,
    created_by: companyId === DEMO_IDS.shipperCompany ? DEMO_IDS.shipper : DEMO_IDS.broker,
    created_at: hoursAgo(24 * days),
  };
}

type InviteSeed = [
  id: string,
  loadId: string,
  carrierCompanyId: string,
  invitedBy: string,
  status: string,
  hours: number,
  message: string | null,
];

const INVITE_SEEDS: InviteSeed[] = [
  [
    'linv-001',
    'load-003',
    DEMO_IDS.carrierCompany,
    DEMO_IDS.broker,
    'pending',
    5,
    'You ran this lane for us last month — want it again?',
  ],
  ['linv-002', 'load-003', GREAT_LAKES_CO, DEMO_IDS.broker, 'pending', 5, null],
  [
    'linv-003',
    'load-006',
    DEMO_IDS.carrier2Company,
    DEMO_IDS.shipper,
    'pending',
    3,
    'Reefer at 34°F — pre-cool required.',
  ],
  ['linv-004', 'load-005', DEMO_IDS.carrier3Company, DEMO_IDS.broker, 'accepted', 12, null],
];

function inviteToRow([id, loadId, companyId, invitedBy, status, hours, message]: InviteSeed): Row {
  return {
    id,
    load_id: loadId,
    carrier_company_id: companyId,
    invited_by: invitedBy,
    status,
    message,
    expires_at: hoursFromNow(48 - hours),
    created_at: hoursAgo(hours),
  };
}

// ── Carrier scoring ──────────────────────────────────

interface CarrierProfile {
  equipment: readonly string[];
  states: readonly string[];
  availability: number;
  savedSearch: number;
}

const DEFAULT_PROFILE: CarrierProfile = {
  equipment: ['van'],
  states: [],
  availability: 6,
  savedSearch: 2,
};

const CARRIER_PROFILES: Record<string, CarrierProfile> = {
  [DEMO_IDS.carrierCompany]: {
    equipment: ['van', 'reefer', 'flatbed'],
    states: ['GA', 'TN', 'TX', 'FL', 'NC', 'IL', 'CO', 'MO', 'LA', 'MI', 'IN'],
    availability: 13,
    savedSearch: 8,
  },
  [DEMO_IDS.carrier2Company]: {
    equipment: ['van', 'reefer'],
    states: ['TN', 'GA', 'NC', 'VA', 'OH', 'FL', 'AL'],
    availability: 11,
    savedSearch: 6,
  },
  [DEMO_IDS.carrier3Company]: {
    equipment: ['flatbed', 'step_deck', 'van'],
    states: ['AL', 'GA', 'TX', 'LA', 'FL', 'MS', 'WA', 'OR'],
    availability: 9,
    savedSearch: 7,
  },
  [GREAT_LAKES_CO]: {
    equipment: ['van', 'reefer', 'box_truck'],
    states: ['MI', 'OH', 'IN', 'IL', 'PA', 'KY'],
    availability: 12,
    savedSearch: 5,
  },
  [REDLINE_CO]: { equipment: ['van'], states: ['IN', 'IL'], availability: 4, savedSearch: 1 },
};

function marketplaceCarriers({ db }: DemoContext): Row[] {
  return db
    .read('companies')
    .filter((c) => c.type === 'carrier' && c.id !== DEMO_IDS.platformCompany);
}

function scoreCarrier(load: Row, carrier: Row, { db }: DemoContext): Row {
  const profile = CARRIER_PROFILES[str(carrier.id)] ?? DEFAULT_PROFILE;
  const relationship = db
    .read('carrier_relationships')
    .find((r) => r.company_id === load.company_id && r.carrier_id === carrier.id);
  const loadsWithPoster = new Set(
    db
      .read('loads')
      .filter((l) => l.company_id === load.company_id)
      .map((l) => l.id),
  );
  const pastWins = db
    .read('bids')
    .filter(
      (b) =>
        b.company_id === carrier.id && b.status === 'accepted' && loadsWithPoster.has(b.load_id),
    ).length;

  const equipment_score = profile.equipment.includes(str(load.equipment)) ? 25 : 8;
  const lane_preference_score =
    (profile.states.includes(str(load.origin_state)) ? 10 : 0) +
    (profile.states.includes(str(load.dest_state)) ? 10 : 0);
  const history_score = Math.min(15, 3 + pastWins * 3);
  const rating_score = Math.round(Math.min(Number(carrier.rating ?? 0), 5) * 2);
  const preferred_score = relationship?.status === 'preferred' ? 5 : 0;
  const is_blocked = relationship?.status === 'blocked';
  const parts = [
    equipment_score,
    lane_preference_score,
    profile.availability,
    history_score,
    profile.savedSearch,
    rating_score,
    preferred_score,
  ];
  return {
    company_id: carrier.id,
    company_name: carrier.name,
    mc_number: carrier.mc_number ?? null,
    total_score: parts.reduce((sum, n) => sum + n, 0),
    equipment_score,
    availability_score: profile.availability,
    lane_preference_score,
    history_score,
    saved_search_score: profile.savedSearch,
    rating_score,
    preferred_score,
    is_eligible: carrier.verified !== false && !is_blocked,
    is_blocked,
  };
}

function requireLoad(ctx: DemoContext, loadId: unknown): Row {
  const load = findById(ctx.db.read('loads'), loadId);
  if (!load) throw new Error('Load not found.');
  return load;
}

const rankCarriersForLoad: DemoHandler = (args, ctx) => {
  const load = requireLoad(ctx, args.p_load_id);
  const limit = num(args.p_limit) ?? 20;
  return marketplaceCarriers(ctx)
    .map((carrier) => scoreCarrier(load, carrier, ctx))
    .filter((score) => score.is_eligible)
    .sort((a, b) => Number(b.total_score) - Number(a.total_score))
    .slice(0, limit);
};

const scoreCarrierForLoad: DemoHandler = (args, ctx) => {
  const load = requireLoad(ctx, args.p_load_id);
  const carrier = findById(marketplaceCarriers(ctx), args.p_carrier_company_id);
  return carrier ? scoreCarrier(load, carrier, ctx) : null;
};

const inviteCarriersToLoad: DemoHandler = (args, ctx) => {
  const identity = requireIdentity(ctx, 'invite carriers');
  const load = requireLoad(ctx, args.p_load_id);
  const ids = Array.isArray(args.p_carrier_company_ids)
    ? [...new Set(args.p_carrier_company_ids.map(str).filter(Boolean))]
    : [];
  if (ids.length === 0) throw new Error('Select at least one carrier to invite.');
  const hours = num(args.p_expires_in_hours) ?? 48;
  const alreadyInvited = new Set(
    ctx.db
      .read('load_invitations')
      .filter((i) => i.load_id === load.id && i.status === 'pending')
      .map((i) => i.carrier_company_id),
  );
  const fresh = ids.filter((id) => !alreadyInvited.has(id));
  const created = ctx.db.insert(
    'load_invitations',
    fresh.map((companyId) => ({
      load_id: load.id,
      carrier_company_id: companyId,
      invited_by: identity.id,
      status: 'pending',
      message: null,
      expires_at: hoursFromNow(hours),
    })),
  );

  const inviter = findById(ctx.db.read('companies'), identity.companyId);
  const owners = ctx.db
    .read('companies')
    .filter((c) => fresh.includes(str(c.id)) && typeof c.owner_id === 'string');
  ctx.db.insert(
    'notifications',
    owners.map((c) => ({
      user_id: c.owner_id,
      type: 'load_invitation',
      title: 'Invited to Bid',
      body: `${str(inviter?.name) || identity.fullName} invited you to bid on ${str(load.load_number)}: ${str(load.origin_city)}, ${str(load.origin_state)} → ${str(load.dest_city)}, ${str(load.dest_state)}.`,
      load_id: load.id,
    })),
  );
  return created.length;
};

export function sourcingSeeds(): SeedTables {
  return {
    companies: EXTRA_CARRIERS,
    carrier_relationships: REL_SEEDS.map(relToRow),
    load_invitations: INVITE_SEEDS.map(inviteToRow),
  };
}

export const SOURCING_RPC: Record<string, DemoHandler> = {
  rank_carriers_for_load: rankCarriersForLoad,
  score_carrier_for_load: scoreCarrierForLoad,
  invite_carriers_to_load: inviteCarriersToLoad,
};
