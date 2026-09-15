import { ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface VerificationSealProps {
  verified?: boolean;
  label?: string;
  className?: string;
}

export function VerificationSeal({ verified = true, label, className }: VerificationSealProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide border',
        verified
          ? 'bg-fx-success-dim text-fx-success border-transparent'
          : 'bg-fx-danger-dim text-fx-danger border-transparent',
        className,
      )}
    >
      {verified ? <ShieldCheck size={14} /> : <XCircle size={14} />}
      <span>{label ?? (verified ? 'Verified' : 'Unverified')}</span>
    </div>
  );
}

export default VerificationSeal;
