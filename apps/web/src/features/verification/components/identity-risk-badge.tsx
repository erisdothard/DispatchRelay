import { Shield, AlertTriangle, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getIdentityRiskProfile,
  type IdentityRiskProfile,
} from '@/services/identity-verification.service';

interface Props {
  userId: string;
}

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'text-fx-success bg-fx-surface-2 border-fx-border', label: 'Verified' },
  medium: { color: 'text-fx-text bg-fx-surface-2 border-fx-border-2', label: 'Review' },
  high: { color: 'text-fx-danger bg-fx-danger-dim border-transparent', label: 'High Risk' },
};

export function IdentityRiskBadge({ userId }: Props) {
  const { data: riskProfile } = useQuery<IdentityRiskProfile | null>({
    queryKey: ['identity-risk', userId],
    queryFn: () => getIdentityRiskProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  if (!riskProfile) return null;

  const config = RISK_CONFIG[riskProfile.risk_level] ?? RISK_CONFIG.medium;

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${config.color}`}>
        <Shield size={14} />
        <span className="text-xs font-bold">{config.label}</span>
      </div>

      {riskProfile.is_voip && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-fx-surface-2 border border-fx-border text-xs text-fx-text-muted">
          <Phone size={12} />
          <span className="font-semibold">VoIP phone detected</span>
        </div>
      )}

      {riskProfile.risk_factors.length > 0 && (
        <div className="space-y-1">
          {riskProfile.risk_factors.map((factor, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-fx-text-dim">
              <AlertTriangle size={9} className="text-fx-text-muted shrink-0" />
              {factor}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
