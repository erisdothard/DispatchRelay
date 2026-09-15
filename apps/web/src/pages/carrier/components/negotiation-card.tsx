import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { EQUIPMENT_LABELS } from '@dispatchrelay/shared';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/shared/lib/utils';
import {
  acceptCounterOffer,
  declineCounterOffer,
  type Negotiation,
} from '@/pages/carrier/lib/negotiations';

interface NegotiationCardProps {
  negotiation: Negotiation;
  onOpen: (loadId: string) => void;
  /** Called after the carrier accepts or declines, so the parent can refetch. */
  onResolved: () => void;
}

const usd = (amount: number) => `$${amount.toLocaleString()}`;

/** One card per bid negotiation: the carrier's bid, folded together with any broker counter. */
export function NegotiationCard({ negotiation, onOpen, onResolved }: NegotiationCardProps) {
  const { company, profile } = useAuth();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { load, myBid, counter } = negotiation;
  if (!load) return null;

  const statusLabel = counter
    ? 'Counter Received'
    : myBid?.status === 'countered'
      ? 'Awaiting Broker'
      : 'Bid Pending';
  const amount = counter?.amount_usd ?? myBid?.amount_usd ?? 0;

  async function respond(action: 'accept' | 'decline') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'accept') {
        await acceptCounterOffer(negotiation);
      } else {
        await declineCounterOffer(
          negotiation,
          company?.name ?? profile?.full_name ?? 'The carrier',
        );
      }
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not respond to the counter-offer');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={cn(
        'rounded-ios transition-colors',
        counter
          ? 'bg-fx-surface border border-fx-border'
          : 'bg-fx-surface border border-fx-border hover:bg-fx-surface-2',
      )}
      style={counter ? { boxShadow: 'inset 3px 0 0 rgba(232,96,48,0.65)' } : undefined}
    >
      <button
        type="button"
        onClick={() => onOpen(negotiation.loadId)}
        className="w-full text-left p-4 active-scale rounded-ios outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/70"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-[11px] text-fx-text-dim">{load.load_number}</p>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className="text-[15px] font-bold text-fx-text truncate">
                {load.origin_city}, {load.origin_state}
              </span>
              <ArrowRight size={12} className="text-fx-text-dim shrink-0" />
              <span className="text-[15px] font-bold text-fx-text truncate">
                {load.dest_city}, {load.dest_state}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[15px] font-bold text-fx-text">{usd(amount)}</p>
            <p className="text-[10px] text-fx-text-dim">Ask {usd(load.rate_usd)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-fx-text-dim bg-fx-surface-2 px-2.5 py-0.5 rounded-full">
              {EQUIPMENT_LABELS[load.equipment as keyof typeof EQUIPMENT_LABELS] ?? load.equipment}
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                counter ? 'text-fx-orange bg-fx-orange/10' : 'text-fx-text-muted bg-fx-surface-2',
              )}
            >
              {statusLabel}
            </span>
          </div>
          <span className="text-[11px] font-bold text-fx-text-muted shrink-0">View →</span>
        </div>
      </button>

      {counter && (
        <div className="px-4 pb-4">
          <div className="pt-3 border-t border-fx-border">
            <p className="text-[12px] text-fx-text-muted">
              Counter received{' '}
              <span className="font-bold text-fx-text">{usd(counter.amount_usd)}</span>
              {myBid && <> (you bid {usd(myBid.amount_usd)})</>}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => void respond('accept')}
                disabled={busy !== null}
                className="flex-1 h-9 rounded-xl bg-fx-orange hover:bg-fx-orange-hover disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check size={13} />
                {busy === 'accept' ? 'Accepting…' : `Accept ${usd(counter.amount_usd)}`}
              </button>
              <button
                type="button"
                onClick={() => void respond('decline')}
                disabled={busy !== null}
                className="flex-1 h-9 rounded-xl border border-fx-border bg-fx-surface-2 hover:border-fx-danger hover:text-fx-danger disabled:opacity-50 text-fx-text-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <X size={13} />
                {busy === 'decline' ? 'Declining…' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="px-4 pb-3 text-[11px] text-fx-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
