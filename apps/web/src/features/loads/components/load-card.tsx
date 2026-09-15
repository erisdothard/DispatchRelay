import {
  ArrowRight,
  Scale,
  Calendar,
  Zap,
  Clock,
  Shield,
  AlertCircle,
  AlertTriangle,
  Snowflake,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import {
  analyzeRate,
  getLoadAge,
  getBrokerCreditLabel,
  calcGrossProfit,
} from '@/shared/lib/freight';
import { EQUIPMENT_LABELS } from '@dispatchrelay/shared';
import type { Load } from '@dispatchrelay/shared';
import type { LoadStatus } from '@/lib/database.types';
import { getLaneStats } from '@/services/rate-intelligence.service';
import { BrokerVerifiedBadge } from './broker-verified-badge';
import { BidButtonAnimated } from '@/features/bids/components/bid-button-animated';

/** Returns badge variant for a load status */
function getStatusBadgeVariant(status: LoadStatus): 'blue' | 'orange' | 'green' | 'red' | 'gray' {
  switch (status) {
    case 'posted':
    case 'awarded':
    case 'dispatched':
      return 'blue';
    case 'in_transit':
      return 'orange';
    case 'delivered':
    case 'completed':
      return 'green';
    case 'cancelled':
    case 'expired':
      return 'red';
    default:
      return 'gray';
  }
}

/** Returns human-readable label for a load status */
function getStatusLabel(status: LoadStatus): string {
  const labels: Record<LoadStatus, string> = {
    draft: 'Draft',
    posted: 'Posted',
    bid_received: 'Bids In',
    awarded: 'Awarded',
    dispatched: 'Dispatched',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status] ?? status;
}

/** Inline market badge — fetches lane avg via React Query (cached, deduplicated) */
function MarketBadge({ load }: { load: Load }) {
  const { data: stats } = useQuery({
    queryKey: ['lane-stats', load.originState, load.destState, load.equipment, 90],
    queryFn: () =>
      getLaneStats({
        originState: load.originState,
        destState: load.destState,
        equipment: load.equipment,
      }),
    staleTime: 5 * 60_000,
    enabled: load.ratePerMile > 0,
  });

  if (!stats || stats.sample_count < 3 || !stats.avg_rate_per_mile) return null;
  const delta = (load.ratePerMile - stats.avg_rate_per_mile) / stats.avg_rate_per_mile;
  if (Math.abs(delta) < 0.1) return null;

  const above = delta > 0;
  return (
    <span
      className={cn(
        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
        above
          ? 'text-fx-text bg-fx-surface-3 border-fx-border-2'
          : 'text-fx-danger bg-fx-danger-dim border-transparent',
      )}
    >
      {above ? 'Above Market' : 'Below Market'}
    </span>
  );
}

interface LoadCardProps {
  load: Load;
  onBid?: (load: Load) => void;
  onPress?: (load: Load) => void;
  showBidButton?: boolean;
  /** When false, bid button shows disabled with tooltip */
  carrierEligible?: boolean;
  carrierEligibleReason?: string | null;
  className?: string;
  variant?: 'full' | 'compact';
}

export function LoadCard({
  load,
  onBid,
  onPress,
  showBidButton = true,
  carrierEligible = true,
  carrierEligibleReason,
  className,
  variant = 'full',
}: LoadCardProps) {
  const rate = analyzeRate(load);
  const age = getLoadAge(load.postedAt);
  const credit = getBrokerCreditLabel(load.brokerCreditScore);
  const profit = calcGrossProfit(load);
  const isCancelled = load.status === 'cancelled';

  const isCompact = variant === 'compact';

  return (
    <div
      onClick={() => onPress?.(load)}
      className={cn(
        'bg-fx-surface rounded-ios card-highlight active-scale transition-colors',
        isCompact ? 'p-3' : 'p-5',
        onPress ? 'cursor-pointer' : '',
        isCancelled && 'opacity-60 bg-fx-surface/50',
        className,
      )}
    >
      {/* Top row: route + rate health dot */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Route */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold text-fx-text tracking-tight truncate">
            {load.originCity}, {load.originState}
          </span>
          <ArrowRight size={13} className="text-fx-text-dim shrink-0" strokeWidth={2.5} />
          <span className="text-[15px] font-bold text-fx-text tracking-tight truncate">
            {load.destCity}, {load.destState}
          </span>
        </div>

        {/* Rate health pill — unique DispatchRelay feature */}
        <div
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: `color-mix(in srgb, ${rate.color} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${rate.color} 25%, transparent)`,
            color: rate.color,
          }}
        >
          {rate.health === 'hot' && <Zap size={9} fill="currentColor" />}
          {rate.label}
        </div>
      </div>

      {/* Equipment + status + special tags */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="text-[11px] font-semibold text-fx-text-dim bg-fx-surface-2 px-2.5 py-1 rounded-full">
          {EQUIPMENT_LABELS[load.equipment] ?? load.equipment}
        </span>
        {/* Status badge */}
        {(() => {
          const badgeVariant = getStatusBadgeVariant(load.status);
          const label = getStatusLabel(load.status);
          const colors = {
            blue: { text: 'text-fx-text-muted', bg: 'bg-fx-surface-2', border: 'border-fx-border' },
            orange: { text: 'text-fx-text', bg: 'bg-fx-surface-3', border: 'border-fx-border-2' },
            green: {
              text: 'text-fx-success',
              bg: 'bg-fx-success-dim',
              border: 'border-transparent',
            },
            red: { text: 'text-fx-danger', bg: 'bg-fx-danger-dim', border: 'border-transparent' },
            gray: { text: 'text-fx-text-dim', bg: 'bg-fx-surface-2', border: 'border-fx-border' },
          };
          const c = colors[badgeVariant];
          return (
            <span
              className={cn(
                'text-[11px] font-semibold px-2.5 py-1 rounded-full border',
                c.text,
                c.bg,
                c.border,
              )}
            >
              {label}
            </span>
          );
        })()}
        {load.tempControlled && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fx-text-muted bg-fx-surface-2 px-2.5 py-1 rounded-full border border-fx-border">
            <Snowflake size={11} strokeWidth={2.25} aria-hidden="true" />
            Temp
          </span>
        )}
        {load.hazmat && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fx-orange bg-fx-orange/10 px-2.5 py-1 rounded-full border border-fx-orange/30">
            <AlertTriangle size={11} strokeWidth={2.25} aria-hidden="true" />
            HAZMAT
          </span>
        )}
        {load.bidCount !== undefined && load.bidCount > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-fx-text-dim">
            {load.bidCount} {load.bidCount === 1 ? 'bid' : 'bids'}
          </span>
        )}
      </div>

      {/* Stats row — hidden in compact mode */}
      {!isCompact && (
        <div
          className="flex items-center gap-0 mb-4 rounded-ios-xs overflow-hidden"
          style={{ border: '1px solid var(--fx-border)' }}
        >
          {[
            { icon: <Scale size={11} />, value: `${(load.weightLbs / 1000).toFixed(0)}k lbs` },
            {
              icon: <ArrowRight size={11} />,
              value: load.totalMiles ? `${load.totalMiles} mi` : '—',
            },
            {
              icon: <Calendar size={11} />,
              value: new Date(load.pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
            },
          ].map(({ icon, value }, i) => (
            <div
              key={i}
              className="flex-1 flex items-center justify-center gap-1 py-2"
              style={i < 2 ? { borderRight: '1px solid var(--fx-border)' } : {}}
            >
              <span className="text-fx-text-dim">{icon}</span>
              <span className="text-[11px] text-fx-text-dim font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rate + broker info + action */}
      <div className="flex items-end justify-between">
        <div>
          {/* Large rate */}
          <div className="flex items-baseline gap-1.5">
            {load.ratePerMile > 0 ? (
              <>
                <span
                  className={cn(
                    'font-extrabold leading-none tracking-[-0.03em]',
                    isCompact ? 'text-[20px]' : 'text-[28px]',
                  )}
                  style={{ color: rate.health === 'low' ? 'var(--fx-danger)' : 'var(--fx-text)' }}
                >
                  ${load.ratePerMile.toFixed(2)}
                </span>
                <span className="text-[12px] font-semibold text-fx-text-dim">/mi</span>
              </>
            ) : (
              <span
                className={cn(
                  'font-extrabold leading-none tracking-[-0.03em]',
                  isCompact ? 'text-[20px]' : 'text-[28px]',
                )}
                style={{ color: rate.health === 'low' ? 'var(--fx-danger)' : 'var(--fx-text)' }}
              >
                ${load.rateUsd.toLocaleString()}
              </span>
            )}
            {/* Market delta */}
            <span className="text-[10px] font-bold ml-0.5" style={{ color: rate.color }}>
              {rate.delta}
            </span>
          </div>

          {/* Sub row: company + credit + age + market badge */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {load.companyLogoUrl ? (
                <img
                  src={load.companyLogoUrl}
                  alt={load.companyName}
                  className="h-4 w-4 rounded object-cover"
                />
              ) : (
                <div className="h-4 w-4 rounded bg-fx-surface-2 flex items-center justify-center text-[8px] font-medium text-fx-text-muted">
                  {load.companyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-fx-text-dim truncate max-w-[110px]">
                {load.companyName}
              </span>
            </div>
            {credit && (
              <span
                className="text-[10px] font-bold flex items-center gap-0.5"
                style={{ color: credit.color }}
              >
                <Shield size={9} fill="currentColor" />
                {credit.label}
              </span>
            )}
            <BrokerVerifiedBadge companyId={load.companyId} compact />
            {profit && <span className="text-[10px] font-semibold text-fx-text-dim">{profit}</span>}
            {load.assigneeId && (
              <span className="text-[10px] font-semibold text-fx-text-muted bg-fx-surface-2 px-2 py-0.5 rounded-full border border-fx-border">
                Assigned
              </span>
            )}
            <MarketBadge load={load} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Age chip */}
          {age && (
            <div className="flex items-center gap-1">
              <Clock size={9} className="text-fx-text-dim" />
              <span className="text-[10px] text-fx-text-dim font-medium">{age}</span>
            </div>
          )}
          {showBidButton &&
            (load.status === 'posted' || load.status === 'bid_received') &&
            (carrierEligible ? (
              <BidButtonAnimated loadId={load.id} onBid={() => onBid?.(load)} />
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  disabled
                  className="h-9 px-5 rounded-full text-[13px] font-bold text-fx-text-dim bg-fx-surface-2 border border-fx-border cursor-not-allowed"
                >
                  Bid Now
                </button>
                {carrierEligibleReason && (
                  <span className="flex items-center gap-1 text-[9px] text-fx-orange max-w-[140px] text-right leading-tight">
                    <AlertCircle size={9} className="shrink-0" />
                    {carrierEligibleReason}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
