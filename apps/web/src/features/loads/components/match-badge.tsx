import { cn } from '@/shared/lib/utils';

interface MatchBadgeProps {
  score: number; // 0–100
  className?: string;
}

export function MatchBadge({ score, className }: MatchBadgeProps) {
  const color =
    score >= 80
      ? '#E86030' // fx-orange: a strong match is the highlight
      : 'var(--fx-text-muted)'; // neutral

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score}% match
    </div>
  );
}
