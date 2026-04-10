import { ArrowRight, Scale, Calendar, Zap, Clock, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import {
  analyzeRate,
  getLoadAge,
  getBrokerCreditLabel,
  calcGrossProfit,
} from '@/shared/lib/freight';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import { getLaneStats } from '@/services/rate-intelligence.service';

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
          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
          : 'text-amber-400 bg-amber-400/10 border-amber-400/20',
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
  className?: string;
}

export function LoadCard({ load, onBid, onPress, showBidButton = true, className }: LoadCardProps) {
  const rate = analyzeRate(load);
  const age = getLoadAge(load.postedAt);
  const credit = getBrokerCreditLabel(load.brokerCreditScore);
  const profit = calcGrossProfit(load);
  const isCancelled = load.status === 'cancelled';

  return (
    <div
      onClick={() => onPress?.(load)}
      className={cn(
        'bg-fx-surface rounded-ios p-5 card-highlight active-scale transition-colors',
        onPress ? 'cursor-pointer' : '',
        isCancelled && 'opacity-60 bg-fx-surface/50',
        className,
      )}
    >
      {/* Top row: route + rate health dot */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Route */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold text-white tracking-tight truncate">
            {load.originCity}, {load.originState}
          </span>
          <ArrowRight size={13} className="text-fx-text-dim shrink-0" strokeWidth={2.5} />
          <span className="text-[15px] font-bold text-white tracking-tight truncate">
            {load.destCity}, {load.destState}
          </span>
        </div>

        {/* Rate health pill — unique FreightX feature */}
        <div
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: `${rate.color}1A`,
            border: `1px solid ${rate.color}40`,
            color: rate.color,
          }}
        >
          {rate.health === 'hot' && <Zap size={9} fill="currentColor" />}
          {rate.label}
        </div>
      </div>

      {/* Equipment + special tags */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="text-[11px] font-semibold text-fx-text-dim bg-fx-surface-2 px-2.5 py-1 rounded-full">
          {EQUIPMENT_LABELS[load.equipment] ?? load.equipment}
        </span>
        {isCancelled && (
          <span className="text-[11px] font-semibold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
            CANCELLED
          </span>
        )}
        {load.tempControlled && (
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20">
            ❄ Temp
          </span>
        )}
        {load.hazmat && (
          <span className="text-[11px] font-semibold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
            ⚠ HAZMAT
          </span>
        )}
        {load.bidCount !== undefined && load.bidCount > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-fx-text-dim">
            {load.bidCount} {load.bidCount === 1 ? 'bid' : 'bids'}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div
        className="flex items-center gap-0 mb-4 rounded-ios-xs overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
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
            style={i < 2 ? { borderRight: '1px solid rgba(255,255,255,0.06)' } : {}}
          >
            <span className="text-fx-text-dim">{icon}</span>
            <span className="text-[11px] text-fx-text-dim font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Rate + broker info + action */}
      <div className="flex items-end justify-between">
        <div>
          {/* Large rate */}
          <div className="flex items-baseline gap-1.5">
            {load.ratePerMile > 0 ? (
              <>
                <span
                  className="text-[28px] font-extrabold leading-none tracking-[-0.03em]"
                  style={{ color: rate.health === 'low' ? '#F87171' : '#FFFFFF' }}
                >
                  ${load.ratePerMile.toFixed(2)}
                </span>
                <span className="text-[12px] font-semibold text-fx-text-dim">/mi</span>
              </>
            ) : (
              <span
                className="text-[28px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ color: rate.health === 'low' ? '#F87171' : '#FFFFFF' }}
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
            <span className="text-[11px] text-fx-text-dim truncate max-w-[110px]">
              {load.companyName}
            </span>
            {credit && (
              <span
                className="text-[10px] font-bold flex items-center gap-0.5"
                style={{ color: credit.color }}
              >
                <Shield size={9} fill="currentColor" />
                {credit.label}
              </span>
            )}
            {profit && <span className="text-[10px] font-semibold text-fx-text-dim">{profit}</span>}
            {load.assigneeId && (
              <span className="text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
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
          {showBidButton && (load.status === 'posted' || load.status === 'bid_received') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBid?.(load);
              }}
              className="h-9 px-5 rounded-full text-[13px] font-bold text-white active-scale transition-all bg-orange-gradient"
              style={{ boxShadow: '0 2px 12px rgba(232,96,48,0.35)' }}
            >
              Bid Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
