import { supabase } from '@/lib/supabase';
import { rowToLoad, rowToMilestone } from '@/lib/mappers';
import type { LoadRow, EquipmentType, LoadStatus } from '@/lib/database.types';
import type { Load, TrackingMilestone } from '@freightx/shared';
import { recordLaneRate } from './rate-intelligence.service';
import { notifyLoadStatusChange } from './email-notifications.service';
import { LoadFiltersSchema, CreateLoadInputSchema } from '@/lib/schemas/loads.schema';

export const PAGE_SIZE = 25;

export interface LoadFilters {
  equipment?: EquipmentType | 'all';
  status?: LoadStatus | 'all';
  search?: string;
  postedBy?: string;
  originState?: string;
  destState?: string;
  minRatePerMile?: number;
  page?: number; // 0-indexed
}

export interface LoadsPage {
  loads: Load[];
  hasMore: boolean;
  total: number | null;
}

export async function getLoads(filters: LoadFilters = {}): Promise<Load[]> {
  LoadFiltersSchema.parse(filters);
  const page = filters.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('loads')
    .select('*, assignee_profile:assignee_id(full_name)', { count: 'estimated' })
    .order('posted_at', { ascending: false })
    .range(from, to);

  if (filters.equipment && filters.equipment !== 'all') {
    query = query.eq('equipment', filters.equipment);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.postedBy) {
    query = query.eq('posted_by', filters.postedBy);
  }
  if (filters.originState) {
    query = query.eq('origin_state', filters.originState.toUpperCase());
  }
  if (filters.destState) {
    query = query.eq('dest_state', filters.destState.toUpperCase());
  }
  if (filters.minRatePerMile && filters.minRatePerMile > 0) {
    query = query.gte('rate_per_mile', filters.minRatePerMile);
  }
  if (filters.search) {
    // Use full-text search if search_vector column exists, otherwise fall back to ilike
    const s = `%${filters.search}%`;
    query = query.or(
      `load_number.ilike.${s},origin_city.ilike.${s},dest_city.ilike.${s},company_name.ilike.${s},commodity.ilike.${s}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToLoad);
}

export async function getLoadsPage(filters: LoadFilters = {}): Promise<LoadsPage> {
  const page = filters.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('loads')
    .select('*, assignee_profile:assignee_id(full_name)', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(from, to);

  if (filters.equipment && filters.equipment !== 'all') {
    query = query.eq('equipment', filters.equipment);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.postedBy) {
    query = query.eq('posted_by', filters.postedBy);
  }
  if (filters.originState) {
    query = query.eq('origin_state', filters.originState.toUpperCase());
  }
  if (filters.destState) {
    query = query.eq('dest_state', filters.destState.toUpperCase());
  }
  if (filters.minRatePerMile && filters.minRatePerMile > 0) {
    query = query.gte('rate_per_mile', filters.minRatePerMile);
  }
  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(
      `load_number.ilike.${s},origin_city.ilike.${s},dest_city.ilike.${s},company_name.ilike.${s},commodity.ilike.${s}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const loads = (data ?? []).map(rowToLoad);
  return {
    loads,
    hasMore: count != null ? from + loads.length < count : loads.length === PAGE_SIZE,
    total: count,
  };
}

export async function getLoadByNumber(loadNumber: string): Promise<Load | null> {
  const { data, error } = await supabase
    .from('loads')
    .select('*')
    .eq('load_number', loadNumber)
    .single();
  if (error) return null;
  return rowToLoad(data);
}

export async function createLoad(load: Omit<LoadRow, 'id' | 'created_at'>): Promise<Load> {
  CreateLoadInputSchema.parse(load);
  const { data, error } = await supabase.from('loads').insert(load).select().single();
  if (error) throw error;

  // Notify carriers of new load
  await notifyCarriersOfNewLoad(data);

  return rowToLoad(data);
}

/**
 * Notify all carriers when a new load is posted
 */
async function notifyCarriersOfNewLoad(load: LoadRow) {
  const { data: carriers } = await supabase.from('profiles').select('id').eq('role', 'carrier');
  if (!carriers || carriers.length === 0) return;

  const notifications = carriers.map((carrier) => ({
    user_id: carrier.id,
    type: 'new_load',
    title: 'New Load Available',
    message: `New ${load.equipment} load from ${load.origin_city} to ${load.dest_city} - $${load.rate_usd?.toLocaleString() ?? 'Call for rate'}`,
    data: {
      load_id: load.id,
      load_number: load.load_number,
      equipment: load.equipment,
      origin_city: load.origin_city,
      origin_state: load.origin_state,
      dest_city: load.dest_city,
      dest_state: load.dest_state,
      rate: load.rate_usd,
    },
  }));

  await supabase.from('notifications').insert(notifications);
}

export async function updateLoad(id: string, updates: Partial<LoadRow>): Promise<Load> {
  // Snapshot before for audit diff
  const { data: before } = await supabase.from('loads').select('*').eq('id', id).single();

  const { data, error } = await supabase
    .from('loads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Email on status change — get poster email
  if (updates.status && before?.status !== updates.status && data.posted_by) {
    const { data: poster } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.posted_by)
      .single();

    if (poster?.email) {
      notifyLoadStatusChange({
        email: poster.email,
        loadNumber: data.load_number,
        origin: `${data.origin_city}, ${data.origin_state}`,
        dest: `${data.dest_city}, ${data.dest_state}`,
        status: updates.status,
      }).then(
        () => undefined,
        () => undefined,
      );
    }
  }

  return rowToLoad(data);
}

/**
 * Record rate history snapshot when a load is booked/awarded.
 * Call this after acceptBid or bookNow succeeds.
 */
export async function recordBookingRateHistory(loadId: string): Promise<void> {
  const { data: load } = await supabase.from('loads').select('*').eq('id', loadId).single();
  if (!load?.rate_usd || !load?.origin_state || !load?.dest_state) return;

  await recordLaneRate({
    originState: load.origin_state,
    destState: load.dest_state,
    equipment: load.equipment,
    rateUsd: load.rate_usd,
    totalMiles: load.total_miles,
    loadId: load.id,
  });
}

/**
 * Get loads where this carrier has an accepted bid (awarded/dispatched/in_transit/delivered).
 */
export async function getMyActiveLoads(carrierId: string): Promise<Load[]> {
  // 1. Find all accepted bids for this carrier
  const { data: bids, error: bidErr } = await supabase
    .from('bids')
    .select('load_id')
    .eq('carrier_id', carrierId)
    .eq('status', 'accepted');
  if (bidErr) throw bidErr;
  if (!bids || bids.length === 0) return [];

  const loadIds = bids.map((b) => b.load_id);

  // 2. Fetch those loads
  const { data, error } = await supabase
    .from('loads')
    .select('*')
    .in('id', loadIds)
    .order('pickup_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToLoad);
}

/**
 * Assign a driver to a load.
 */
export async function assignDriver(loadId: string, driverId: string): Promise<Load> {
  const { data, error } = await supabase
    .from('loads')
    .update({ assigned_driver_id: driverId })
    .eq('id', loadId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(
        'Unable to assign driver — you may not have permission to update this load. Ensure you have an accepted bid on this load.',
      );
    }
    throw error;
  }

  // Notify driver of assignment
  await supabase.from('notifications').insert({
    user_id: driverId,
    type: 'load_assigned',
    title: 'New Load Assigned',
    body: `You have been assigned load ${data.load_number}: ${data.origin_city}, ${data.origin_state} → ${data.dest_city}, ${data.dest_state}`,
    load_id: data.id,
  });

  return rowToLoad(data);
}

/**
 * Assign a co-driver (second driver) to a load.
 */
export async function assignCoDriver(loadId: string, driverId: string | null): Promise<Load> {
  const { data, error } = await supabase
    .from('loads')
    .update({ second_driver_id: driverId })
    .eq('id', loadId)
    .select()
    .single();
  if (error) throw error;

  if (driverId) {
    await supabase.from('notifications').insert({
      user_id: driverId,
      type: 'load_assigned',
      title: 'Co-Driver Assignment',
      body: `You have been assigned as co-driver on load ${data.load_number}: ${data.origin_city}, ${data.origin_state} → ${data.dest_city}, ${data.dest_state}`,
      load_id: data.id,
    });
  }

  return rowToLoad(data);
}

/**
 * Get loads assigned to a specific driver (primary or co-driver).
 */
export async function getDriverLoads(driverId: string, status?: string): Promise<Load[]> {
  let query = supabase
    .from('loads')
    .select('*')
    .or(`assigned_driver_id.eq.${driverId},second_driver_id.eq.${driverId}`)
    .order('pickup_date', { ascending: true });

  if (status) {
    query = query.eq('status', status as LoadStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToLoad);
}

/**
 * Get company drivers (profiles that are company_members with role 'driver' or profiles with role 'driver' in the same company).
 */
export async function getCompanyDrivers(
  companyId: string,
): Promise<Array<{ id: string; fullName: string; email: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('company_members')
    .select('user_id, profiles!company_members_user_id_fkey(id, full_name, email, role)')
    .eq('company_id', companyId);

  if (error) throw error;

  interface MemberRow {
    profiles?: { id: string; full_name?: string; email: string; role: string };
  }

  return ((data ?? []) as MemberRow[])
    .filter(
      (m): m is MemberRow & { profiles: NonNullable<MemberRow['profiles']> } =>
        m.profiles?.role === 'driver',
    )
    .map((m) => ({
      id: m.profiles.id,
      fullName: m.profiles.full_name ?? m.profiles.email,
      email: m.profiles.email,
    }));
}

export async function getTrackingMilestones(loadNumber: string): Promise<TrackingMilestone[]> {
  const { data, error } = await supabase
    .from('tracking_milestones')
    .select('*')
    .eq('load_number', loadNumber)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMilestone);
}
