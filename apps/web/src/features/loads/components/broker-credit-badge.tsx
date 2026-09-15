import { useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BrokerMetrics {
  avg_days_to_pay: number;
  on_time_pct: number;
  payment_count: number;
}

interface BrokerCreditBadgeProps {
  companyId: string | null | undefined;
  inline?: boolean; // true = compact inline chip, false = full card row
}

export function BrokerCreditBadge({ companyId, inline = true }: BrokerCreditBadgeProps) {
  const [metrics, setMetrics] = useState<BrokerMetrics | null>(null);

  useEffect(() => {
    if (!companyId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('broker_payment_metrics')
      .select('avg_days_to_pay, on_time_pct, payment_count')
      .eq('company_id', companyId)
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: { avg_days_to_pay: number; on_time_pct: number; payment_count: number } | null;
        }) => {
          if (data && data.payment_count > 0) {
            setMetrics({
              avg_days_to_pay: Number(data.avg_days_to_pay),
              on_time_pct: Number(data.on_time_pct),
              payment_count: data.payment_count,
            });
          }
        },
      );
  }, [companyId]);

  if (!metrics) return null;

  // Neutral unless it's a problem: slow payers (> 30d) and poor on-time (< 70%) go danger.
  const daysColor = metrics.avg_days_to_pay <= 30 ? 'text-fx-text' : 'text-fx-danger';

  const onTimeColor = metrics.on_time_pct >= 70 ? 'text-fx-text' : 'text-fx-danger';

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-fx-surface-2 border border-fx-border">
          <Clock size={11} className={daysColor} />
          <span className={`text-[11px] font-bold ${daysColor}`}>
            Pays ~{Math.round(metrics.avg_days_to_pay)}d
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-fx-surface-2 border border-fx-border">
          <TrendingUp size={11} className={onTimeColor} />
          <span className={`text-[11px] font-bold ${onTimeColor}`}>
            {Math.round(metrics.on_time_pct)}% on-time
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 space-y-2 bg-fx-surface-2 border border-fx-border">
      <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest">
        Broker Payment History
      </p>
      <div className="flex gap-4">
        <div>
          <div className={`text-lg font-black ${daysColor}`}>
            {Math.round(metrics.avg_days_to_pay)}d
          </div>
          <div className="text-[10px] text-fx-text-dim">avg days to pay</div>
        </div>
        <div>
          <div className={`text-lg font-black ${onTimeColor}`}>
            {Math.round(metrics.on_time_pct)}%
          </div>
          <div className="text-[10px] text-fx-text-dim">on time</div>
        </div>
        <div>
          <div className="text-lg font-black text-fx-text">{metrics.payment_count}</div>
          <div className="text-[10px] text-fx-text-dim">payments</div>
        </div>
      </div>
    </div>
  );
}
