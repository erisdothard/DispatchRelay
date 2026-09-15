import { AlertTriangle, Check } from 'lucide-react';
import { acknowledgeViolation, type HosViolation } from '@/services/hos.service';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  violations: HosViolation[];
  driverId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-fx-danger bg-fx-danger-dim border-transparent',
  warning: 'text-fx-orange bg-fx-orange/10 border-fx-orange/25',
  info: 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
};

export function HosViolationsList({ violations, driverId }: Props) {
  const queryClient = useQueryClient();
  const [acking, setAcking] = useState<string | null>(null);

  async function handleAck(violationId: string) {
    setAcking(violationId);
    try {
      await acknowledgeViolation(violationId);
      void queryClient.invalidateQueries({ queryKey: ['hos-violations', driverId] });
    } finally {
      setAcking(null);
    }
  }

  if (violations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-fx-success-dim flex items-center justify-center mx-auto mb-3">
          <Check size={20} className="text-fx-success" />
        </div>
        <p className="text-fx-text-muted text-sm">No violations</p>
        <p className="text-fx-text-dim text-xs mt-1">You're in compliance!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {violations.map((v) => {
        const severityColor = SEVERITY_COLORS[v.severity] ?? SEVERITY_COLORS.warning;
        const isAcked = v.resolved;

        return (
          <div
            key={v.id}
            className={`bg-fx-surface border rounded-xl p-4 space-y-2 ${
              isAcked ? 'border-fx-border opacity-60' : 'border-fx-border-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={14}
                  className={isAcked ? 'text-fx-text-dim' : 'text-fx-danger'}
                />
                <span className="text-sm font-semibold text-fx-text">
                  {v.violation_type.replace(/_/g, ' ')}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${severityColor}`}
              >
                {v.severity}
              </span>
            </div>

            <p className="text-xs text-fx-text-muted">{v.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-fx-text-dim">
                {new Date(v.violation_date).toLocaleDateString()}
              </span>

              {isAcked ? (
                <span className="text-[10px] text-fx-success font-semibold flex items-center gap-1">
                  <Check size={10} /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => handleAck(v.id)}
                  disabled={acking === v.id}
                  className="text-xs font-semibold text-fx-orange hover:text-fx-orange/80 disabled:opacity-40 transition-colors"
                >
                  {acking === v.id ? '...' : 'Acknowledge'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
