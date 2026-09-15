import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { VerificationStatus } from '@/lib/database.types';

interface Props {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

const CONFIG = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    className: 'text-fx-success bg-fx-success-dim border-transparent',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
  },
  failed: {
    icon: ShieldAlert,
    label: 'Failed',
    className: 'text-fx-danger bg-fx-danger-dim border-transparent',
  },
  expired: {
    icon: ShieldAlert,
    label: 'Expired',
    className: 'text-fx-danger bg-fx-danger-dim border-transparent',
  },
} satisfies Record<
  VerificationStatus,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    className: string;
  }
>;

export function VerifiedBadge({ status, size = 'sm' }: Props) {
  const { icon: Icon, label, className } = CONFIG[status];
  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${textSize} ${className}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      {label}
    </span>
  );
}
