import { supabase } from '@/lib/supabase';
import type { BidRow } from '@/lib/database.types';
import {
  notifyNewBid,
  notifyBidAccepted,
  notifyBidDeclined,
  notifyBidCountered,
  notifyBookingConfirmed,
  smsBookingConfirmed,
} from './email-notifications.service';
import { recordBookingRateHistory } from './loads.service';
import { SubmitBidInputSchema } from '@/lib/schemas/bids.schema';

export type { BidRow };

export async function getBidsForLoad(loadId: string): Promise<BidRow[]> {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('load_id', loadId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BidRow[];
}

export async function getMyBids(carrierId: string): Promise<BidRow[]> {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('carrier_id', carrierId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BidRow[];
}

/** Active bids with load info for carrier "Bidding On" section */
export interface BidWithLoad extends BidRow {
  load: {
    load_number: string;
    origin_city: string;
    origin_state: string;
    dest_city: string;
    dest_state: string;
    rate_usd: number;
    equipment: string;
    pickup_date: string;
    status: string;
  } | null;
}

export async function getMyActiveBidsWithLoads(carrierId: string): Promise<BidWithLoad[]> {
  const { data, error } = await supabase
    .from('bids')
    .select(
      '*, loads(load_number, origin_city, origin_state, dest_city, dest_state, rate_usd, equipment, pickup_date, status)',
    )
    .eq('carrier_id', carrierId)
    .in('status', ['pending', 'countered'])
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    const loadData = Array.isArray(r.loads) ? r.loads[0] : r.loads;
    return { ...r, load: loadData ?? null } as BidWithLoad;
  });
}

export async function submitBid(params: {
  loadId: string;
  carrierId: string;
  companyId: string | null;
  companyName: string;
  amountUsd: number;
  notes?: string;
}): Promise<BidRow> {
  SubmitBidInputSchema.parse(params);
  const { data, error } = await supabase
    .from('bids')
    .insert({
      load_id: params.loadId,
      carrier_id: params.carrierId,
      company_id: params.companyId,
      company_name: params.companyName,
      amount_usd: params.amountUsd,
      notes: params.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Bump bid_count (non-critical)
  await supabase.rpc('increment_bid_count', { load_id: params.loadId }).then(
    () => undefined,
    () => undefined,
  );

  // Advance load status to bid_received (if still posted)
  await supabase
    .from('loads')
    .update({ status: 'bid_received' })
    .eq('id', params.loadId)
    .eq('status', 'posted')
    .then(
      () => undefined,
      () => undefined,
    );

  // Fetch load + poster for notification + email
  const { data: load } = await supabase
    .from('loads')
    .select('load_number, origin_city, origin_state, dest_city, dest_state, posted_by')
    .eq('id', params.loadId)
    .single();

  if (load?.posted_by) {
    // In-app notification to broker
    await supabase
      .from('notifications')
      .insert({
        user_id: load.posted_by,
        type: 'new_bid',
        title: 'New bid received',
        body: `${params.companyName} bid $${params.amountUsd.toLocaleString()} on load ${load.load_number}.`,
        load_id: params.loadId,
        read: false,
      })
      .then(
        () => undefined,
        () => undefined,
      );

    // Email (non-fatal)
    const { data: poster } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', load.posted_by)
      .single();

    if (poster?.email) {
      notifyNewBid({
        posterEmail: poster.email,
        loadNumber: load.load_number,
        origin: `${load.origin_city}, ${load.origin_state}`,
        dest: `${load.dest_city}, ${load.dest_state}`,
        amount: params.amountUsd,
        carrierName: params.companyName,
      }).then(
        () => undefined,
        () => undefined,
      );
    }
  }

  return data as BidRow;
}

export async function acceptBid(bidId: string): Promise<void> {
  // Get bid + load info before accepting for notifications
  const { data: bid } = await supabase
    .from('bids')
    .select(
      '*, loads(load_number, origin_city, origin_state, dest_city, dest_state, pickup_date, rate_usd, total_miles, id)',
    )
    .eq('id', bidId)
    .single();

  const { error } = await supabase.rpc('accept_bid', { bid_id: bidId });
  if (error) throw new Error(error.message);

  // Record rate history snapshot
  const rawLoad = bid?.loads as unknown as { id?: string };
  if (rawLoad?.id) {
    recordBookingRateHistory(rawLoad.id).then(
      () => undefined,
      () => undefined,
    );
  }

  // Email + in-app notification to carrier — bid accepted
  if (bid) {
    const { data: carrier } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', bid.carrier_id)
      .single();

    const load = Array.isArray(bid.loads) ? bid.loads[0] : bid.loads;
    if (load) {
      // In-app notification
      supabase
        .from('notifications')
        .insert({
          user_id: bid.carrier_id,
          type: 'bid_accepted',
          title: 'Bid Accepted — Sign Rate Con',
          body: `Your bid on load ${load.load_number} (${load.origin_city} → ${load.dest_city}) was accepted. Sign the rate confirmation to dispatch.`,
          load_id: (load as { id?: string }).id ?? null,
        })
        .then(
          () => undefined,
          () => undefined,
        );

      if (carrier?.email) {
        notifyBidAccepted({
          carrierEmail: carrier.email as string,
          loadNumber: load.load_number,
          origin: `${load.origin_city}, ${load.origin_state}`,
          dest: `${load.dest_city}, ${load.dest_state}`,
          pickupDate: load.pickup_date ?? '',
        }).then(
          () => undefined,
          () => undefined,
        );
      }
    }
  }
}

export async function bookNow(loadId: string): Promise<void> {
  // Get load info before booking
  const { data: load } = await supabase
    .from('loads')
    .select(
      'load_number, origin_city, origin_state, dest_city, dest_state, pickup_date, rate_usd, posted_by',
    )
    .eq('id', loadId)
    .single();

  const { error } = await supabase.rpc('book_now', { p_load_id: loadId });
  if (error) throw new Error(error.message);

  // Record rate history
  recordBookingRateHistory(loadId).then(
    () => undefined,
    () => undefined,
  );

  // Email both poster and carrier
  if (load) {
    const { data: authData } = await supabase.auth.getUser();
    const carrierId = authData.user?.id;

    // Get carrier info for SMS
    if (carrierId) {
      const { data: carrierProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', carrierId)
        .single();

      const { data: notifPrefs } = await supabase
        .from('notification_preferences')
        .select('phone_number, settings')
        .eq('user_id', carrierId)
        .maybeSingle();

      if (carrierProfile?.email) {
        notifyBookingConfirmed({
          email: carrierProfile.email as string,
          loadNumber: load.load_number,
          origin: `${load.origin_city}, ${load.origin_state}`,
          dest: `${load.dest_city}, ${load.dest_state}`,
          pickupDate: load.pickup_date ?? '',
          amount: load.rate_usd ?? 0,
        }).then(
          () => undefined,
          () => undefined,
        );
      }

      // SMS if opted in for bid_updates
      const smsEnabled = (notifPrefs?.settings as Record<string, { sms: boolean }>)?.bid_updates
        ?.sms;
      if (smsEnabled && notifPrefs?.phone_number) {
        smsBookingConfirmed({
          to: notifPrefs.phone_number,
          loadNumber: load.load_number,
          origin: `${load.origin_city}, ${load.origin_state}`,
          dest: `${load.dest_city}, ${load.dest_state}`,
        }).then(
          () => undefined,
          () => undefined,
        );
      }
    }

    // Email load poster — booking confirmed
    if (load.posted_by) {
      const { data: poster } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', load.posted_by)
        .single();

      if (poster?.email) {
        notifyBookingConfirmed({
          email: poster.email as string,
          loadNumber: load.load_number,
          origin: `${load.origin_city}, ${load.origin_state}`,
          dest: `${load.dest_city}, ${load.dest_state}`,
          pickupDate: load.pickup_date ?? '',
          amount: load.rate_usd ?? 0,
        }).then(
          () => undefined,
          () => undefined,
        );
      }
    }
  }
}

export async function declineBid(bidId: string): Promise<void> {
  // Get bid info for notifications
  const { data: bid } = await supabase
    .from('bids')
    .select('carrier_id, load_id, loads(load_number, id)')
    .eq('id', bidId)
    .single();

  const { error } = await supabase
    .from('bids')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', bidId);
  if (error) throw new Error(error.message);

  // Notify carrier — in-app + email
  if (bid) {
    const load = Array.isArray(bid.loads) ? bid.loads[0] : bid.loads;
    const loadNumber = (load as { load_number: string })?.load_number ?? '';
    const loadId = (load as { id?: string })?.id ?? null;

    // In-app notification (was missing)
    supabase
      .from('notifications')
      .insert({
        user_id: bid.carrier_id,
        type: 'bid_declined',
        title: 'Bid Declined',
        body: `Your bid on load ${loadNumber} was declined.`,
        load_id: loadId,
        read: false,
      })
      .then(
        () => undefined,
        () => undefined,
      );

    // Email
    const { data: carrier } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', bid.carrier_id)
      .single();

    if (carrier?.email && loadNumber) {
      notifyBidDeclined({
        carrierEmail: carrier.email as string,
        loadNumber,
      }).then(
        () => undefined,
        () => undefined,
      );
    }
  }
}

export async function counterBid(params: {
  originalBidId: string;
  loadId: string;
  carrierId: string;
  companyId: string | null;
  companyName: string;
  originalAmount: number;
  counterAmount: number;
}): Promise<BidRow> {
  // Mark original bid as countered (not declined)
  await supabase
    .from('bids')
    .update({ status: 'countered', updated_at: new Date().toISOString() })
    .eq('id', params.originalBidId);

  // Submit counter-bid
  const { data, error } = await supabase
    .from('bids')
    .insert({
      load_id: params.loadId,
      carrier_id: params.carrierId,
      company_id: params.companyId,
      company_name: `Counter: ${params.companyName}`,
      amount_usd: params.counterAmount,
      notes: `Counter-offer from broker at $${params.counterAmount.toLocaleString()} (was $${params.originalAmount.toLocaleString()})`,
      parent_bid_id: params.originalBidId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Fetch load info for notification context
  const { data: load } = await supabase
    .from('loads')
    .select('load_number, origin_city, origin_state, dest_city, dest_state, id')
    .eq('id', params.loadId)
    .single();

  if (load) {
    // In-app notification to carrier
    supabase
      .from('notifications')
      .insert({
        user_id: params.carrierId,
        type: 'bid_countered',
        title: 'Counter-Offer Received',
        body: `Broker countered your $${params.originalAmount.toLocaleString()} bid with $${params.counterAmount.toLocaleString()} on load ${load.load_number}.`,
        load_id: load.id,
        read: false,
      })
      .then(
        () => undefined,
        () => undefined,
      );

    // Email
    const { data: carrier } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', params.carrierId)
      .single();

    if (carrier?.email) {
      notifyBidCountered({
        carrierEmail: carrier.email as string,
        loadNumber: load.load_number,
        origin: `${load.origin_city}, ${load.origin_state}`,
        dest: `${load.dest_city}, ${load.dest_state}`,
        originalAmount: params.originalAmount,
        counterAmount: params.counterAmount,
      }).then(
        () => undefined,
        () => undefined,
      );
    }
  }

  return data as BidRow;
}
