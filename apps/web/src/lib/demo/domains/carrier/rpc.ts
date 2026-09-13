/**
 * Carrier Postgres functions (`supabase.rpc`) and edge functions (`supabase.functions.invoke`)
 * for the demo backend. Reads come from ctx.db; writes go through ctx.db so screens refresh.
 */
import { distanceMiles, type LatLng } from '@/lib/us-city-coords';
import type { DemoDb, DemoHandler, Row } from '../../types';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** Straight-line → road miles. */
const ROAD_FACTOR = 1.2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helpers ──────────────────────────────────────────

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const timeOf = (v: unknown): number => new Date(str(v)).getTime() || 0;
const sumOf = (rows: readonly Row[], key: string): number =>
  rows.reduce((total, row) => total + num(row[key]), 0);

function companyOf(db: DemoDb, userId: string): string | null {
  const membership = db.read('company_members').find((m) => m.user_id === userId);
  return membership ? str(membership.company_id) : null;
}

function companyDrivers(db: DemoDb, companyId: string): Row[] {
  const memberIds = new Set(
    db
      .read('company_members')
      .filter((m) => m.company_id === companyId)
      .map((m) => m.user_id),
  );
  return db.read('profiles').filter((p) => memberIds.has(p.id) && p.role === 'driver');
}

function latestPing(db: DemoDb, driverId: unknown): Row | null {
  return (
    db
      .read('location_pings')
      .filter((p) => p.driver_id === driverId)
      .sort((a, b) => timeOf(b.recorded_at) - timeOf(a.recorded_at))[0] ?? null
  );
}

function roadMiles(from: LatLng, to: LatLng): number {
  return distanceMiles(from, to) * ROAD_FACTOR;
}

function formatInterval(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

// ── Invitations & team ───────────────────────────────

const getMyLoadInvitations: DemoHandler = (args, { db, identity }) => {
  if (!identity) return [];
  const statusFilter = str(args.p_status);
  const loads = db.read('loads');
  const companies = db.read('companies');
  const now = Date.now();
  return db
    .read('load_invitations')
    .filter((inv) => inv.carrier_company_id === identity.companyId)
    .map((inv) => {
      const expired = inv.status === 'pending' && inv.expires_at && timeOf(inv.expires_at) < now;
      return expired ? { ...inv, status: 'expired' } : inv;
    })
    .filter((inv) => !statusFilter || inv.status === statusFilter)
    .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at))
    .map((inv) => {
      const load = loads.find((l) => l.id === inv.load_id);
      const poster = companies.find((c) => c.id === load?.company_id);
      return {
        ...inv,
        invitation_id: inv.id,
        invited_at: inv.created_at,
        broker_name: str(poster?.name ?? load?.company_name),
        load_number: load?.load_number ?? null,
        origin: load ? `${str(load.origin_city)}, ${str(load.origin_state)}` : null,
        destination: load ? `${str(load.dest_city)}, ${str(load.dest_state)}` : null,
        equipment: load?.equipment ?? null,
        rate_usd: load?.rate_usd ?? null,
        load: load
          ? {
              load_number: load.load_number,
              origin_city: load.origin_city,
              origin_state: load.origin_state,
              destination_city: load.dest_city,
              destination_state: load.dest_state,
              rate_usd: load.rate_usd,
              equipment_type: load.equipment,
              pickup_date: load.pickup_date,
            }
          : undefined,
      };
    });
};

const getInviteByToken: DemoHandler = (args, { db }) => {
  const invite = db.read('company_invites').find((i) => i.token === args.p_token);
  if (!invite) return [];
  const company = db.read('companies').find((c) => c.id === invite.company_id);
  return [
    {
      email: invite.email,
      role: invite.role,
      company_name: str(company?.name),
      expires_at: invite.expires_at,
      is_valid: !invite.accepted_at && timeOf(invite.expires_at) > Date.now(),
    },
  ];
};

const acceptCompanyInvite: DemoHandler = (args, { db, identity }) => {
  if (!identity) throw new Error('Sign in to accept this invite.');
  const invite = db.read('company_invites').find((i) => i.token === args.p_token);
  if (!invite || invite.accepted_at || timeOf(invite.expires_at) <= Date.now()) {
    throw new Error('This invite is no longer valid.');
  }
  const now = new Date().toISOString();
  db.insert('company_members', [
    {
      company_id: invite.company_id,
      user_id: identity.id,
      role: invite.role,
      invited_by: invite.invited_by,
      joined_at: now,
    },
  ]);
  db.update('company_invites', (i) => i.id === invite.id, { accepted_at: now });
  return null;
};

// ── Lanes, market & backhaul ─────────────────────────

const getSpotRateIndex: DemoHandler = (args, { db }) => {
  const origin = str(args.p_origin_state).trim().toUpperCase();
  const dest = str(args.p_dest_state).trim().toUpperCase();
  const equipment = str(args.p_equipment).trim().toLowerCase();
  return db
    .read('spot_rate_index')
    .filter(
      (r) =>
        str(r.origin_state).startsWith(origin) &&
        str(r.destination_state).startsWith(dest) &&
        (!equipment || r.equipment_type === equipment),
    )
    .sort((a, b) => num(b.load_count) - num(a.load_count));
};

// Lane suggestions, backhaul, RFP summaries, carrier invitations and identity checks are
// owned by the shared and shipper-broker domains (see registry.test.ts).

// ── Fuel ─────────────────────────────────────────────

const getFuelSummary: DemoHandler = (args, { db, identity }) => {
  const companyId = str(args.p_company_id) || identity?.companyId;
  const since = Date.now() - num(args.p_days, 30) * DAY_MS;
  const transactions = db
    .read('fuel_transactions')
    .filter((t) => t.company_id === companyId && timeOf(t.transaction_date) >= since);
  const spent = sumOf(transactions, 'total_usd');
  const gallons = sumOf(transactions, 'gallons');
  return {
    total_spent: Math.round(spent),
    total_gallons: Math.round(gallons),
    avg_price_per_gallon: gallons > 0 ? round2(spent / gallons) : 0,
    transaction_count: transactions.length,
    savings_estimate: Math.round(sumOf(transactions, 'savings_usd')),
  };
};

// ── Drivers & GPS ────────────────────────────────────

const getFleetAvailabilitySummary: DemoHandler = (args, { db }) => {
  const groups = new Map<string, Row[]>();
  companyDrivers(db, str(args.p_company_id)).forEach((driver) => {
    const status = str(driver.current_duty_status) || 'off_duty';
    groups.set(status, [...(groups.get(status) ?? []), driver]);
  });
  return [...groups.entries()].map(([dutyStatus, drivers]) => ({
    duty_status: dutyStatus,
    driver_count: drivers.length,
    avg_time_in_status: formatInterval(
      drivers.reduce((total, d) => total + (Date.now() - timeOf(d.duty_status_updated_at)), 0) /
        drivers.length,
    ),
  }));
};

function driversWithGps(db: DemoDb, companyId: string | null) {
  if (!companyId) return [];
  return companyDrivers(db, companyId).flatMap((driver) => {
    const ping = latestPing(db, driver.id);
    return ping ? [{ driver, ping }] : [];
  });
}

const getOnDutyDriversForCarrier: DemoHandler = (args, { db }) =>
  driversWithGps(db, companyOf(db, str(args.p_carrier_id)))
    .filter(({ driver }) => str(driver.current_duty_status) !== 'off_duty')
    .map(({ driver, ping }) => ({
      driver_id: driver.id,
      driver_name: driver.full_name,
      duty_status: str(driver.current_duty_status) || 'on_duty',
      coords_lat: ping.latitude,
      coords_lng: ping.longitude,
      current_load_number: str(ping.load_number),
      last_update: ping.recorded_at,
    }));

const findNearestAvailableDrivers: DemoHandler = (args, { db, identity }) => {
  const pickup: LatLng = [num(args.p_pickup_lat), num(args.p_pickup_lng)];
  const maxMiles = num(args.p_max_distance_miles, 250);
  return driversWithGps(db, identity ? identity.companyId : null)
    .map(({ driver, ping }) => ({
      driver_id: driver.id,
      driver_name: driver.full_name,
      duty_status: str(driver.current_duty_status) || 'on_duty',
      coords_lat: ping.latitude,
      coords_lng: ping.longitude,
      last_update: ping.recorded_at,
      distance_miles: Math.round(roadMiles(pickup, [num(ping.latitude), num(ping.longitude)])),
    }))
    .filter((d) => d.distance_miles <= maxMiles)
    .sort((a, b) => a.distance_miles - b.distance_miles)
    .slice(0, num(args.p_limit, 5));
};

export const CARRIER_RPC: Record<string, DemoHandler> = {
  get_my_load_invitations: getMyLoadInvitations,
  get_invite_by_token: getInviteByToken,
  accept_company_invite: acceptCompanyInvite,
  get_spot_rate_index: getSpotRateIndex,
  get_fuel_summary: getFuelSummary,
  get_fleet_availability_summary: getFleetAvailabilitySummary,
  get_onduty_drivers_for_carrier: getOnDutyDriversForCarrier,
  find_nearest_available_drivers: findNearestAvailableDrivers,
};

// ── Edge functions ───────────────────────────────────

/** Provisions a driver invite and returns the signup link the carrier shares. */
const inviteDriver: DemoHandler = (args, { db, identity }) => {
  if (!identity) throw new Error('Sign in to invite drivers.');
  const email = str(args.email).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error('Enter a valid email address.');

  const teamIds = new Set(
    db
      .read('company_members')
      .filter((m) => m.company_id === identity.companyId)
      .map((m) => m.user_id),
  );
  if (db.read('profiles').some((p) => teamIds.has(p.id) && str(p.email).toLowerCase() === email)) {
    throw new Error(`${email} is already on your team.`);
  }

  const signupLink = (token: unknown) => `${window.location.origin}/invite/${str(token)}`;
  const pending = db
    .read('company_invites')
    .find((i) => i.company_id === identity.companyId && i.email === email && !i.accepted_at);
  if (pending)
    return { success: true, invite_id: pending.id, signup_link: signupLink(pending.token) };

  const token = crypto.randomUUID().replace(/-/g, '');
  const [invite] = db.insert('company_invites', [
    {
      company_id: identity.companyId,
      email,
      role: 'driver',
      token,
      invited_by: identity.id,
      full_name: str(args.full_name).trim() || null,
      phone: str(args.phone).trim() || null,
      expires_at: new Date(Date.now() + 7 * DAY_MS).toISOString(),
      accepted_at: null,
    },
  ]);
  return { success: true, invite_id: invite?.id ?? null, signup_link: signupLink(token) };
};

/** No hosted Stripe page in the demo — the plan activates in place and no redirect happens. */
const createCheckoutSession: DemoHandler = (args, { db, identity }) => {
  const companyId = str(args.companyId) || identity?.companyId;
  if (!companyId) throw new Error('No company to subscribe.');
  const now = new Date().toISOString();
  const patch = {
    tier: str(args.tier) || 'carrier_pro',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * DAY_MS).toISOString(),
    updated_at: now,
  };
  const existing = db.read('subscriptions').some((s) => s.company_id === companyId);
  if (existing) db.update('subscriptions', (s) => s.company_id === companyId, patch);
  else db.insert('subscriptions', [{ company_id: companyId, ...patch }]);
  return { url: null, activated: true };
};

export const CARRIER_FUNCTIONS: Record<string, DemoHandler> = {
  'invite-driver': inviteDriver,
  'create-checkout-session': createCheckoutSession,
};
