/**
 * Account-level data every role touches: notification settings, devices, saved searches,
 * share links, the notification queue, trust profiles, identity checks and theme.
 */
import { DEMO_IDS } from '../../identities';
import { hoursAgo, hoursFromNow } from '../../time';
import type { DemoDb, DemoHandler, Row } from '../../types';

const { carrier, broker, shipper, driver, driver2 } = DEMO_IDS;

// ── Notification preferences ───────────────────────────

const channel = (push: boolean, email: boolean, sms: boolean) => ({ push, email, sms });

const NOTIFICATION_PREFERENCES: Row[] = [
  {
    user_id: carrier,
    phone_number: '+1 (615) 555-0100',
    settings: {
      new_loads: channel(true, true, false),
      bid_updates: channel(true, true, true),
      load_status: channel(true, true, false),
      messages: channel(true, false, true),
      reminders: channel(true, true, false),
      marketing: channel(false, false, false),
    },
    updated_at: hoursAgo(24 * 9),
  },
  {
    user_id: driver,
    phone_number: '+1 (615) 555-0142',
    settings: {
      new_loads: channel(false, false, false),
      bid_updates: channel(false, false, false),
      load_status: channel(true, false, true),
      messages: channel(true, false, true),
      reminders: channel(true, false, true),
      marketing: channel(false, false, false),
    },
    updated_at: hoursAgo(24 * 20),
  },
];

// ── Devices ────────────────────────────────────────────

function device(
  id: string,
  userId: string,
  platform: string,
  model: string,
  os: string,
  hoursOld: number,
): Row {
  return {
    id,
    user_id: userId,
    device_id: `${platform}-${id}`,
    platform,
    app_version: platform === 'web' ? null : '3.4.1',
    os_version: os,
    device_model: model,
    push_token: platform === 'web' ? null : `demo-push-${id}`,
    push_enabled: platform !== 'web',
    locale: 'en-US',
    timezone: 'America/Chicago',
    last_active_at: hoursAgo(hoursOld),
    created_at: hoursAgo(24 * 90),
  };
}

const MOBILE_DEVICES: Row[] = [
  device('dev-carrier-ios', carrier, 'ios', 'iPhone 15 Pro', 'iOS 18.6', 0.2),
  device('dev-carrier-web', carrier, 'web', 'Chrome on macOS', 'macOS 15', 26),
  device('dev-broker-web', broker, 'web', 'Chrome on Windows', 'Windows 11', 0.3),
  device('dev-broker-ios', broker, 'ios', 'iPhone 14', 'iOS 18.5', 5),
  device('dev-shipper-web', shipper, 'web', 'Edge on Windows', 'Windows 11', 1),
  // Driver phones are seeded by the driver domain (driver/tracking.ts).
];

// ── Saved searches ─────────────────────────────────────

function savedSearch(
  id: string,
  userId: string,
  name: string,
  filters: Row,
  alert: boolean,
  hoursOld: number,
): Row {
  return {
    id,
    user_id: userId,
    name,
    filters,
    alert_enabled: alert,
    last_alerted_at: alert ? hoursAgo(hoursOld / 4) : null,
    created_at: hoursAgo(hoursOld),
    updated_at: hoursAgo(hoursOld),
  };
}

const SAVED_SEARCHES: Row[] = [
  savedSearch(
    'ss-carrier-1',
    carrier,
    'Nashville reefer outbound',
    { originState: 'TN', equipment: 'reefer' },
    true,
    24 * 12,
  ),
  savedSearch(
    'ss-carrier-2',
    carrier,
    'Texas flatbeds $2.50+',
    { originState: 'TX', equipment: 'flatbed', minRatePerMile: 2.5 },
    true,
    24 * 6,
  ),
  savedSearch(
    'ss-carrier-3',
    carrier,
    'Georgia → Texas dry van',
    { originState: 'GA', destState: 'TX', equipment: 'van' },
    false,
    24 * 30,
  ),
  savedSearch('ss-driver-1', driver, 'Home to Nashville', { destState: 'TN' }, true, 24 * 15),
];

// ── Public tracking links ──────────────────────────────

const TRACKING_TOKENS: Row[] = [
  {
    id: 'tt-fx1042',
    load_number: 'DR-1042',
    token: 'demo-dr1042',
    created_by: broker,
    expires_at: hoursFromNow(24 * 6),
    revoked: false,
    created_at: hoursAgo(20),
  },
  {
    id: 'tt-fx1051',
    load_number: 'DR-1051',
    token: 'demo-dr1051',
    created_by: shipper,
    expires_at: hoursFromNow(24 * 6),
    revoked: false,
    created_at: hoursAgo(8),
  },
  {
    id: 'tt-fx1045',
    load_number: 'DR-1045',
    token: 'demo-dr1045',
    created_by: shipper,
    expires_at: hoursFromNow(24 * 2),
    revoked: false,
    created_at: hoursAgo(30),
  },
];

// ── Notification queue (admin health page) ─────────────

type QueueSeed = [
  type: string,
  recipient: string,
  subject: string | null,
  status: string,
  attempts: number,
  hoursOld: number,
  error?: string,
];

const QUEUE: QueueSeed[] = [
  ['email', 'broker@dispatchrelay.co', 'New bid on load DR-1046', 'sent', 1, 7],
  ['email', 'broker@dispatchrelay.co', 'New bid on load DR-1050', 'sent', 1, 5],
  ['email', 'carrier@dispatchrelay.co', 'Counter-offer on load DR-1050', 'sent', 1, 3],
  ['email', 'carrier@dispatchrelay.co', 'Your bid on DR-1043 was accepted!', 'sent', 1, 2],
  ['sms', '+16155550142', null, 'sent', 1, 1],
  ['email', 'shipper@dispatchrelay.co', 'Load DR-1051 status: in transit', 'sent', 2, 4],
  ['push', 'dev-driver-ios', 'Delivery appointment tomorrow', 'sent', 1, 1],
  ['email', 'dispatch@blueridgelogistics.com', 'Bid update for load DR-1046', 'sent', 1, 0.5],
  [
    'email',
    'ops@summithaulers.com',
    'Counter-offer on load DR-1050',
    'failed',
    3,
    2.5,
    'SMTP 451: temporary mailbox unavailable',
  ],
  ['sms', '+12055550199', null, 'failed', 2, 1.5, 'Carrier rejected: unreachable handset'],
  [
    'email',
    'old-contact@parkmfg.com',
    'BOL signed for load DR-1049',
    'dead',
    5,
    60,
    'SMTP 550: mailbox does not exist',
  ],
  ['email', 'carrier@dispatchrelay.co', 'Weekly lane digest', 'pending', 0, 0.1],
];

function buildQueue(): Row[] {
  return QUEUE.map(([type, recipient, subject, status, attempts, hours, error], i) => ({
    id: `nq-${i + 1}`,
    type,
    recipient,
    subject,
    payload: {},
    status,
    attempts,
    error_message: error ?? null,
    created_at: hoursAgo(hours),
    next_retry_at: status === 'failed' ? hoursFromNow(0.5) : hoursAgo(hours),
  }));
}

// ── Broker payment metrics (load detail sheet) ─────────

const BROKER_PAYMENT_METRICS: Row[] = [
  {
    id: 'bpm-apex',
    company_id: DEMO_IDS.brokerCompany,
    avg_days_to_pay: 18,
    on_time_payment_pct: 97,
    total_paid_loads: 1204,
    updated_at: hoursAgo(12),
  },
  {
    id: 'bpm-park',
    company_id: DEMO_IDS.shipperCompany,
    avg_days_to_pay: 24,
    on_time_payment_pct: 94,
    total_paid_loads: 301,
    updated_at: hoursAgo(12),
  },
  {
    id: 'bpm-crossroads',
    company_id: 'demo-company-broker-2',
    avg_days_to_pay: 21,
    on_time_payment_pct: 92,
    total_paid_loads: 540,
    updated_at: hoursAgo(12),
  },
];

// Route replay (breadcrumb_snapshots) is seeded by the driver domain, which ties each
// trail to the HOS timeline — see driver/tracking.ts.

// ── Trust profiles ─────────────────────────────────────

interface TrustSeed {
  overall: number;
  loading: number | null;
  dock: number | null;
  communication: number | null;
  facility: number | null;
  accuracy: number | null;
  reviews: number;
  grade: string;
  detention: number | null;
}

const TRUST: Record<string, TrustSeed> = {
  [DEMO_IDS.shipperCompany]: {
    overall: 4.6,
    loading: 4.5,
    dock: 4.2,
    communication: 4.8,
    facility: 4.4,
    accuracy: 4.7,
    reviews: 38,
    grade: 'A',
    detention: 34,
  },
  [DEMO_IDS.brokerCompany]: {
    overall: 4.8,
    loading: null,
    dock: null,
    communication: 4.9,
    facility: null,
    accuracy: 4.7,
    reviews: 112,
    grade: 'A+',
    detention: null,
  },
  'demo-company-broker-2': {
    overall: 4.3,
    loading: null,
    dock: null,
    communication: 4.2,
    facility: null,
    accuracy: 4.4,
    reviews: 41,
    grade: 'B',
    detention: null,
  },
  // Carriers are reviewed on communication and on-time accuracy — dock/facility metrics are shipper-only.
  [DEMO_IDS.carrierCompany]: {
    overall: 4.8,
    loading: null,
    dock: null,
    communication: 4.9,
    facility: null,
    accuracy: 4.8,
    reviews: 86,
    grade: 'A+',
    detention: null,
  },
  [DEMO_IDS.carrier2Company]: {
    overall: 4.6,
    loading: null,
    dock: null,
    communication: 4.5,
    facility: null,
    accuracy: 4.6,
    reviews: 51,
    grade: 'A',
    detention: null,
  },
  [DEMO_IDS.carrier3Company]: {
    overall: 4.3,
    loading: null,
    dock: null,
    communication: 4.1,
    facility: null,
    accuracy: 4.4,
    reviews: 27,
    grade: 'B',
    detention: null,
  },
};

function trustProfile(db: DemoDb, companyId: unknown): Row | null {
  const seed = TRUST[String(companyId)];
  if (!seed) return null;
  const company = db.read('companies').find((c) => c.id === companyId);
  return {
    company_id: companyId,
    company_name: company?.name ?? 'Unknown company',
    avg_overall: seed.overall,
    avg_loading_efficiency: seed.loading,
    avg_dock_wait_time: seed.dock,
    avg_communication: seed.communication,
    avg_facility_quality: seed.facility,
    avg_accuracy: seed.accuracy,
    review_count: seed.reviews,
    trust_grade: seed.grade,
    avg_detention_minutes: seed.detention,
  };
}

// ── Postgres & edge functions ──────────────────────────

const setThemePreference: DemoHandler = (args, { identity, db }) => {
  if (!identity) throw new Error('Not signed in.');
  const theme = String(args.p_theme ?? 'dark');
  if (!['light', 'dark', 'system'].includes(theme)) throw new Error('Unknown theme.');
  db.update('profiles', (p) => p.id === identity.id, {
    theme,
    updated_at: new Date().toISOString(),
  });
  return null;
};

const getIdentityRiskProfile: DemoHandler = (args, { db }) => {
  const profile = db.read('profiles').find((p) => p.id === args.p_user_id);
  if (!profile) return null;
  const phoneVerified = !!profile.phone_verified_at;
  const isVoip = profile.phone_carrier_type === 'voip';
  const factors = [
    ...(phoneVerified ? [] : ['Phone number not verified']),
    ...(isVoip ? ['VoIP phone number'] : []),
  ];
  return {
    user_id: profile.id,
    risk_level: factors.length >= 2 ? 'high' : factors.length === 1 ? 'medium' : 'low',
    is_voip: isVoip,
    phone_verified: phoneVerified,
    email_verified: true,
    identity_verified: phoneVerified,
    risk_factors: factors,
    last_checked: hoursAgo(6),
  };
};

const verifyPhoneNumber: DemoHandler = (args, { identity, db }) => {
  const digits = String(args.p_phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) throw new Error('Enter a valid 10-digit phone number.');
  if (identity) {
    db.update('profiles', (p) => p.id === identity.id, {
      phone_verified_at: new Date().toISOString(),
      phone_carrier_type: 'mobile',
    });
  }
  return { verified: true, is_voip: false };
};

const marketplaceTrustSummary: DemoHandler = () => {
  const seeds = Object.values(TRUST);
  return {
    total_companies: seeds.length,
    avg_trust_score:
      Math.round((seeds.reduce((s, t) => s + t.overall, 0) / seeds.length) * 10) / 10,
    companies_with_a_plus: seeds.filter((t) => t.grade === 'A+').length,
  };
};

export const ACCOUNT_RPC: Record<string, DemoHandler> = {
  set_theme_preference: setThemePreference,
  get_shipper_trust_profile: (args, { db }) => trustProfile(db, args.p_shipper_company_id),
  get_broker_trust_profile: (args, { db }) => trustProfile(db, args.p_broker_company_id),
  get_marketplace_trust_summary: marketplaceTrustSummary,
  get_identity_risk_profile: getIdentityRiskProfile,
  verify_phone_number: verifyPhoneNumber,
};

export const ACCOUNT_FUNCTIONS: Record<string, DemoHandler> = {
  'calendar-sync': (args, { db }) => {
    const load = db.read('loads').find((l) => l.id === args.load_id);
    if (!load) throw new Error('Load not found.');
    return { synced: true, event_id: `demo-cal-${String(load.load_number)}` };
  },
};

export function buildAccountSeeds(): Record<string, Row[]> {
  return {
    notification_preferences: NOTIFICATION_PREFERENCES,
    mobile_devices: MOBILE_DEVICES,
    saved_searches: SAVED_SEARCHES,
    tracking_tokens: TRACKING_TOKENS,
    notification_queue: buildQueue(),
    broker_payment_metrics: BROKER_PAYMENT_METRICS,
    calendar_integrations: [
      {
        id: 'cal-driver',
        user_id: driver,
        provider: 'google',
        calendar_id: 'primary',
        enabled: true,
        token_expires_at: hoursFromNow(24 * 20),
        created_at: hoursAgo(24 * 40),
        updated_at: hoursAgo(24 * 2),
      },
    ],
  };
}
