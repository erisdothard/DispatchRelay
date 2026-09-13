/**
 * Posting and settlement data for brokers and shippers: load templates, ratings,
 * accessorial charges, shipper reviews, and rate recommendations.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo } from '../../time';
import type { DemoHandler, Row, SeedTables } from '../../types';
import { findById, num, optionalStr, requireIdentity, str } from './helpers';

// broker_payment_metrics is seeded by domains/shared/account.ts — one row per company, since
// callers read it with .maybeSingle().

// ── Load templates (post-load sheet) ─────────────────

/** Mirrors the post-load form so a template fills every field when applied. */
const BLANK_FORM = {
  originAddress: '',
  originCity: '',
  originState: '',
  originZip: '',
  destAddress: '',
  destCity: '',
  destState: '',
  destZip: '',
  pickupDate: '',
  deliveryDate: '',
  equipment: 'van',
  commodity: '',
  weightLbs: '',
  rateUsd: '',
  totalMiles: '',
  fullPartial: 'full',
  hazmat: false,
  tempControlled: false,
  visibility: 'public',
  properShippingName: '',
  hazmatClass: '',
  unNumber: '',
  packingGroup: '',
  hazmatQuantity: '',
  emergencyPhone: '',
  placardRequired: false,
  reportableQuantity: false,
  assigneeId: null,
  freightClass: '',
  packagingType: '',
  poNumber: '',
  shipperReference: '',
  shipperName: '',
  shipperContactName: '',
  shipperContactPhone: '',
  shipperContactEmail: '',
  receiverName: '',
  receiverContactName: '',
  receiverContactPhone: '',
  receiverContactEmail: '',
  pickupApptStart: '',
  pickupApptEnd: '',
  deliveryApptStart: '',
  deliveryApptEnd: '',
  piecesCount: '',
  palletsCount: '',
  lengthIn: '',
  widthIn: '',
  heightIn: '',
  stackable: true,
  specialInstructions: '',
  loadingNotes: '',
  deliveryNotes: '',
};

type TemplateSeed = [
  id: string,
  userId: string,
  companyId: string,
  name: string,
  fields: Row,
  days: number,
];

const TEMPLATE_SEEDS: TemplateSeed[] = [
  [
    'ltpl-001',
    DEMO_IDS.broker,
    DEMO_IDS.brokerCompany,
    'ATL → DAL Dry Van (weekly)',
    {
      originAddress: '1237 Industrial Pkwy',
      originCity: 'Atlanta',
      originState: 'GA',
      originZip: '30336',
      destAddress: '453 Commerce Dr',
      destCity: 'Dallas',
      destState: 'TX',
      destZip: '75212',
      commodity: 'Consumer Electronics',
      weightLbs: '38000',
      rateUsd: '3200',
      totalMiles: '781',
      palletsCount: '24',
      shipperName: 'Atlanta Distribution Center',
      receiverName: 'Dallas Receiving',
      specialInstructions: 'Call 30 minutes out. Driver assist on unload.',
    },
    30,
  ],
  [
    'ltpl-002',
    DEMO_IDS.broker,
    DEMO_IDS.brokerCompany,
    'Nashville Reefer — Produce',
    {
      originCity: 'Nashville',
      originState: 'TN',
      originZip: '37210',
      destCity: 'Chicago',
      destState: 'IL',
      destZip: '60632',
      equipment: 'reefer',
      tempControlled: true,
      commodity: 'Fresh Produce',
      weightLbs: '42000',
      rateUsd: '2850',
      totalMiles: '474',
      specialInstructions: 'Maintain 34°F continuous. Pre-cool trailer before arrival.',
    },
    14,
  ],
  [
    'ltpl-003',
    DEMO_IDS.shipper,
    DEMO_IDS.shipperCompany,
    'Detroit → Indy Auto Parts',
    {
      originAddress: '8800 Michigan Ave',
      originCity: 'Detroit',
      originState: 'MI',
      originZip: '48210',
      destAddress: '5601 W Raymond St',
      destCity: 'Indianapolis',
      destState: 'IN',
      destZip: '46241',
      commodity: 'Automotive Parts',
      weightLbs: '28000',
      rateUsd: '1100',
      totalMiles: '287',
      palletsCount: '18',
      freightClass: '85',
      shipperName: 'Park Manufacturing — Detroit Plant',
      shipperContactName: 'Angela Ruiz',
      shipperContactPhone: '(313) 555-0188',
      receiverName: 'Park Indianapolis Cross-Dock',
    },
    40,
  ],
  [
    'ltpl-004',
    DEMO_IDS.shipper,
    DEMO_IDS.shipperCompany,
    'Detroit → Chicago Steel Coils (Flatbed)',
    {
      originCity: 'Detroit',
      originState: 'MI',
      originZip: '48210',
      destCity: 'Chicago',
      destState: 'IL',
      destZip: '60632',
      equipment: 'flatbed',
      commodity: 'Steel Coils',
      weightLbs: '44000',
      rateUsd: '1650',
      totalMiles: '283',
      stackable: false,
      specialInstructions: 'Coil racks and chains required. Tarp before departure.',
    },
    9,
  ],
];

function templateToRow([id, userId, companyId, name, fields, days]: TemplateSeed): Row {
  return {
    id,
    user_id: userId,
    company_id: companyId,
    name,
    template_data: { ...BLANK_FORM, ...fields },
    created_at: hoursAgo(24 * days),
    updated_at: hoursAgo(24 * days),
  };
}

// ── Ratings (completed/delivered loads only) ─────────

type RatingSeed = [
  id: string,
  loadId: string,
  raterId: string,
  ratedCompanyId: string,
  scores: [number, number, number, number],
  comment: string,
  hours: number,
];

const RATING_SEEDS: RatingSeed[] = [
  [
    'rating-001',
    'load-008',
    DEMO_IDS.carrier,
    DEMO_IDS.shipperCompany,
    [5, 5, 5, 4],
    'Fast loading at the Detroit plant — in and out in 40 minutes.',
    60,
  ],
  [
    'rating-002',
    'load-008',
    DEMO_IDS.shipper,
    DEMO_IDS.carrierCompany,
    [5, 5, 5, 5],
    'Driver called ahead and delivered early. Clean paperwork.',
    58,
  ],
  [
    'rating-003',
    'load-004',
    DEMO_IDS.carrier,
    DEMO_IDS.shipperCompany,
    [4, 4, 5, 4],
    'Lumper wait at the Charlotte receiver, otherwise smooth.',
    18,
  ],
  [
    'rating-004',
    'load-004',
    DEMO_IDS.shipper,
    DEMO_IDS.carrierCompany,
    [5, 5, 4, 5],
    'Luis kept us posted at every stop — clean POD, no damage.',
    5,
  ],
];

function ratingToRow([
  id,
  loadId,
  raterId,
  ratedCompanyId,
  [overall, comm, reliability, prof],
  comment,
  hours,
]: RatingSeed): Row {
  return {
    id,
    load_id: loadId,
    rater_id: raterId,
    rated_company_id: ratedCompanyId,
    overall,
    communication: comm,
    reliability,
    professionalism: prof,
    comment,
    created_at: hoursAgo(hours),
  };
}

// ── Accessorial charges ──────────────────────────────

type AccessorialSeed = [
  id: string,
  loadId: string,
  type: string,
  amount: number,
  status: 'pending' | 'approved' | 'denied',
  notes: string,
  hours: number,
  approver?: string,
];

const ACCESSORIAL_SEEDS: AccessorialSeed[] = [
  [
    'acc-001',
    'load-001',
    'detention',
    150,
    'pending',
    '3h detention at Atlanta DC — 07:00 appt, loaded 10:10',
    14,
  ],
  [
    'acc-002',
    'load-004',
    'lumper',
    85,
    'approved',
    'Lumper receipt #44817 at Charlotte Receiving',
    22,
    DEMO_IDS.shipper,
  ],
  [
    'acc-003',
    'load-001',
    'fuel_surcharge',
    120,
    'pending',
    'DOE diesel index up $0.18/gal since tender',
    10,
  ],
  [
    'acc-004',
    'load-008',
    'layover',
    250,
    'denied',
    'Layover not pre-approved — delivery window was met',
    64,
    DEMO_IDS.shipper,
  ],
  ['acc-005', 'load-010', 'detention', 75, 'pending', '1.5h wait at San Antonio pickup', 6],
];

function accessorialToRow([
  id,
  loadId,
  type,
  amount,
  status,
  notes,
  hours,
  approver,
]: AccessorialSeed): Row {
  return {
    id,
    load_id: loadId,
    booking_id: null,
    type,
    amount_usd: amount,
    notes,
    status,
    created_by: DEMO_IDS.carrier,
    approved_by: status === 'approved' ? (approver ?? null) : null,
    approved_at: status === 'approved' ? hoursAgo(hours - 2) : null,
    created_at: hoursAgo(hours),
    updated_at: hoursAgo(status === 'pending' ? hours : hours - 2),
  };
}

// ── Postgres functions ───────────────────────────────

function rating(value: unknown): number | null {
  const n = num(value);
  return n === null ? null : Math.min(Math.max(Math.round(n), 1), 5);
}

const submitShipperReview: DemoHandler = (args, ctx) => {
  const identity = requireIdentity(ctx, 'review shippers');
  const load = findById(ctx.db.read('loads'), args.p_load_id);
  if (!load) throw new Error('Load not found.');
  const overall = rating(args.p_overall);
  if (overall === null) throw new Error('Choose an overall rating.');
  const duplicate = ctx.db
    .read('shipper_reviews')
    .some((r) => r.load_id === load.id && r.carrier_company_id === identity.companyId);
  if (duplicate) throw new Error('You already reviewed this shipper for this load.');

  const detention = num(args.p_detention_minutes);
  const [row] = ctx.db.insert('shipper_reviews', [
    {
      carrier_company_id: identity.companyId,
      shipper_company_id: load.company_id,
      load_id: load.id,
      reviewer_id: identity.id,
      overall,
      loading_efficiency: rating(args.p_loading_efficiency),
      dock_wait_time: rating(args.p_dock_wait_time),
      communication: rating(args.p_communication),
      facility_quality: rating(args.p_facility_quality),
      accuracy: rating(args.p_accuracy),
      comment: optionalStr(args.p_comment),
      detention_occurred: detention !== null && detention > 0,
      detention_minutes: detention,
      would_work_again: overall >= 3,
    },
  ]);
  // Return the client-facing ShipperReview shape alongside the table columns.
  return {
    ...row,
    reviewer_company_id: identity.companyId,
    reviewed_company_id: load.company_id,
    overall_rating: overall,
  };
};

const URGENCY_FACTOR: Record<string, number> = { urgent: 1.12, standard: 1, flexible: 0.94 };

const getShipperRateRecommendation: DemoHandler = (args, { db }) => {
  const origin = str(args.p_origin_state).toUpperCase();
  const dest = str(args.p_dest_state).toUpperCase();
  const equipment = str(args.p_equipment);
  const comps = db
    .read('loads')
    .filter(
      (l) =>
        l.origin_state === origin &&
        l.dest_state === dest &&
        (!equipment || l.equipment === equipment) &&
        Number(l.rate_usd) > 0,
    );
  const marketAvg = comps.length
    ? Math.round(comps.reduce((sum, l) => sum + Number(l.rate_usd), 0) / comps.length)
    : 2150;
  const factor = URGENCY_FACTOR[str(args.p_urgency) || 'standard'] ?? 1;
  const recommended = Math.round((marketAvg * factor) / 25) * 25;
  const confidence = comps.length >= 3 ? 'high' : comps.length >= 1 ? 'medium' : 'low';
  return {
    origin_state: origin,
    destination_state: dest,
    equipment_type: equipment || 'van',
    recommended_rate: recommended,
    market_avg: marketAvg,
    confidence,
    recommendation:
      confidence === 'low'
        ? 'Limited lane history — post near the national average and watch early bids.'
        : `Post at $${recommended.toLocaleString()} to cover within 4 hours on this lane.`,
  };
};

export function marketplaceSeeds(): SeedTables {
  return {
    load_templates: TEMPLATE_SEEDS.map(templateToRow),
    ratings: RATING_SEEDS.map(ratingToRow),
    accessorial_charges: ACCESSORIAL_SEEDS.map(accessorialToRow),
  };
}

export const MARKETPLACE_RPC: Record<string, DemoHandler> = {
  submit_shipper_review: submitShipperReview,
  get_shipper_rate_recommendation: getShipperRateRecommendation,
};
