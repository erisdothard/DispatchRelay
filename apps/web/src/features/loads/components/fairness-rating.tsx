import { useQuery } from '@tanstack/react-query';
import { getRateFairness } from '@/services/rate-intelligence.service';
import type { RateFairness } from '@/services/rate-intelligence.service';
import { cn } from '@/shared/lib/utils';

const LABEL_STYLES: Record<
  RateFairness['fairness_label'],
  { color: string; bg: string; border: string }
> = {
  Excellent: {
    color: 'text-fx-orange',
    bg: 'bg-fx-orange/15',
    border: 'border-fx-orange/30',
  },
  'Above Average': {
    color: 'text-fx-text',
    bg: 'bg-fx-surface-3',
    border: 'border-fx-border-2',
  },
  Fair: { color: 'text-fx-text-muted', bg: 'bg-fx-surface', border: 'border-fx-border' },
  'Below Market': { color: 'text-fx-danger', bg: 'bg-fx-danger-dim', border: 'border-transparent' },
};

const CONFIDENCE_LABEL: Record<RateFairness['confidence'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Limited data',
};

export function FairnessRating({ loadId }: { loadId: string }) {
  const { data: fairness } = useQuery({
    queryKey: ['rate-fairness', loadId],
    queryFn: () => getRateFairness(loadId),
    staleTime: 5 * 60_000,
    enabled: !!loadId,
  });

  if (!fairness) return null;

  const style = LABEL_STYLES[fairness.fairness_label];

  return (
    <div className="rounded-xl bg-fx-surface-2 border border-fx-border p-4 mb-4">
      {/* Header + label */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
          Market Fairness
        </p>
        <span
          className={cn(
            'text-[11px] font-bold px-2.5 py-1 rounded-full border',
            style.color,
            style.bg,
            style.border,
          )}
        >
          {fairness.fairness_label}
        </span>
      </div>

      {/* Percentile bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-fx-text-dim">Percentile</span>
          <span className={cn('text-sm font-bold', style.color)}>{fairness.percentile}th</span>
        </div>
        <div className="h-2 rounded-full bg-fx-surface overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              fairness.percentile >= 75
                ? 'bg-fx-orange'
                : fairness.percentile >= 50
                  ? 'bg-fx-orange/75'
                  : fairness.percentile >= 25
                    ? 'bg-fx-orange/50'
                    : 'bg-fx-orange/30',
            )}
            style={{ width: `${fairness.percentile}%` }}
          />
        </div>
      </div>

      {/* Market comparison row */}
      <div
        className="flex items-center gap-0 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--fx-border)' }}
      >
        {[
          { label: 'Min', value: `$${fairness.market_min.toFixed(2)}` },
          { label: 'Avg', value: `$${fairness.market_avg.toFixed(2)}` },
          { label: 'This', value: `$${fairness.rate_per_mile.toFixed(2)}` },
          { label: 'Max', value: `$${fairness.market_max.toFixed(2)}` },
        ].map((item, i) => (
          <div
            key={item.label}
            className={cn('flex-1 text-center py-2', item.label === 'This' && 'bg-fx-surface')}
            style={i < 3 ? { borderRight: '1px solid var(--fx-border)' } : {}}
          >
            <p className="text-[9px] font-semibold text-fx-text-dim uppercase">{item.label}</p>
            <p
              className={cn(
                'text-[12px] font-bold',
                item.label === 'This' ? style.color : 'text-fx-text',
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Confidence + sample count */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px] text-fx-text-dim">
          {CONFIDENCE_LABEL[fairness.confidence]} ({fairness.sample_count} samples)
        </span>
        <span className="text-[10px] text-fx-text-dim">90-day window</span>
      </div>
    </div>
  );
}
