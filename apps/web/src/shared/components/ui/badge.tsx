import { cn } from '@/shared/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  orange: 'bg-fx-orange/15 text-fx-orange border border-fx-orange/30',
  blue: 'bg-fx-surface-2 text-fx-text border border-fx-border-2',
  green: 'bg-fx-success-dim text-fx-success border border-transparent',
  yellow: 'bg-fx-surface-3 text-fx-text border border-fx-border-2',
  red: 'bg-fx-danger-dim text-fx-danger border border-transparent',
  gray: 'bg-fx-surface-2 text-fx-text-muted border border-fx-border',
  purple: 'bg-fx-surface-2 text-fx-text-muted border border-fx-border-2',
};

export function Badge({ children, variant = 'gray', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold tracking-wide',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
