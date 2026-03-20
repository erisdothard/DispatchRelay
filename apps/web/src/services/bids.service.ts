import { supabase } from '@/lib/supabase';
import type { BidRow } from '@/lib/database.types';
import {
  notifyNewBid,
  notifyBidAccepted,
  notifyBidDeclined,
  notifyBookingConfirmed,
  smsBookingConfirmed,
} from './email-notifications.service';
import { recordBookingRateHistory } from './loads.service';

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

export async function submitBid(params: {
  loadId: string;
  carrierId: string;
  companyId: string | null;
  companyName: string;
  amountUsd: number;
  notes?: string;
}): Promise<BidRow> {
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

  // Email load poster about new bid (non-fatal)
  const { data: load } = await supabase
    .from('loads')
    .select('load_number, origin_city, origin_state, dest_city, dest_state, posted_by')
    .eq('id', params.loadId)
    .single();

  if (load) {
    const { data: poster } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', load.posted_by!)
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

  // Email carrier — bid accepted
  if (bid) {
    const { data: carrier } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', bid.carrier_id)
      .single();

    const load = Array.isArray(bid.loads) ? bid.loads[0] : bid.loads;
    if (carrier?.email && load) {
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
  // Get bid info for email
  const { data: bid } = await supabase
    .from('bids')
    .select('carrier_id, load_id, loads(load_number)')
    .eq('id', bidId)
    .single();

  const { error } = await supabase
    .from('bids')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', bidId);
  if (error) throw new Error(error.message);

  // Email carrier — bid declined
  if (bid) {
    const { data: carrier } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', bid.carrier_id)
      .single();

    const load = Array.isArray(bid.loads) ? bid.loads[0] : bid.loads;
    if (carrier?.email && load) {
      notifyBidDeclined({
        carrierEmail: carrier.email as string,
        loadNumber: (load as { load_number: string }).load_number,
      }).then(
        () => undefined,
        () => undefined,
      );
    }
  }
}
