/**
 * Carrier-side view of bid negotiations. A broker counter is stored as a child bid
 * (parent_bid_id → the carrier's bid), so the raw active-bids list holds two rows per
 * negotiation. These helpers fold each thread into one card and let the carrier answer it.
 */
import { supabase } from '@/lib/supabase';
import { acceptBid, type BidWithLoad } from '@/services/bids.service';

export interface Negotiation {
  /** Root of the thread — the carrier's original bid id. */
  id: string;
  loadId: string;
  load: BidWithLoad['load'];
  /** The carrier's own offer (absent if only the counter is still active). */
  myBid: BidWithLoad | null;
  /** Latest pending broker counter, if any. */
  counter: BidWithLoad | null;
  updatedAt: number;
}

const timeOf = (bid: BidWithLoad): number =>
  new Date(bid.updated_at ?? bid.created_at).getTime() || 0;

export function groupNegotiations(bids: readonly BidWithLoad[]): Negotiation[] {
  const threads = new Map<string, BidWithLoad[]>();
  for (const bid of bids) {
    const rootId = bid.parent_bid_id ?? bid.id;
    threads.set(rootId, [...(threads.get(rootId) ?? []), bid]);
  }

  return [...threads.entries()]
    .flatMap(([id, thread]): Negotiation[] => {
      const myBid = thread.find((b) => b.id === id) ?? null;
      const counter =
        thread
          .filter((b) => b.id !== id && b.status === 'pending')
          .sort((a, b) => timeOf(b) - timeOf(a))[0] ?? null;
      const anchor = counter ?? myBid ?? thread[0];
      if (!anchor) return [];
      return [
        {
          id,
          loadId: anchor.load_id,
          load: myBid?.load ?? counter?.load ?? anchor.load,
          myBid,
          counter,
          updatedAt: Math.max(...thread.map(timeOf)),
        },
      ];
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Carrier takes the broker's counter: the counter bid wins and the load is awarded. */
export async function acceptCounterOffer(negotiation: Negotiation): Promise<void> {
  if (!negotiation.counter) throw new Error('There is no counter-offer to accept.');
  await acceptBid(negotiation.counter.id);
}

/** Carrier turns the counter down: it closes and the carrier's original bid stands. */
export async function declineCounterOffer(
  negotiation: Negotiation,
  carrierName: string,
): Promise<void> {
  const { counter, myBid } = negotiation;
  if (!counter) throw new Error('There is no counter-offer to decline.');
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('bids')
    .update({ status: 'declined', updated_at: now })
    .eq('id', counter.id);
  if (error) throw new Error(error.message);

  if (myBid) {
    const { error: reopenError } = await supabase
      .from('bids')
      .update({ status: 'pending', updated_at: now })
      .eq('id', myBid.id);
    if (reopenError) throw new Error(reopenError.message);
  }

  const { data: load } = await supabase
    .from('loads')
    .select('posted_by, load_number')
    .eq('id', negotiation.loadId)
    .maybeSingle();
  if (!load?.posted_by) return;

  const stands = myBid ? ` Their $${myBid.amount_usd.toLocaleString()} bid stands.` : '';
  // Notification is best-effort; the decline itself already succeeded.
  supabase
    .rpc('send_notification', {
      p_user_id: load.posted_by,
      p_type: 'bid_countered',
      p_title: 'Counter-Offer Declined',
      p_body: `${carrierName} declined your $${counter.amount_usd.toLocaleString()} counter on ${load.load_number}.${stands}`,
      p_load_id: negotiation.loadId,
    })
    .then(
      () => undefined,
      () => undefined,
    );
}
