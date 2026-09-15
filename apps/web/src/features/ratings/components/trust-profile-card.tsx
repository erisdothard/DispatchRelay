import { Star, Shield, Clock, MessageSquare, Building2, CheckCircle2, Package } from 'lucide-react';
import type { TrustProfile } from '@/services/shipper-reviews.service';

interface Props {
  profile: TrustProfile;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-fx-text bg-fx-surface-2 border-fx-border-2',
  A: 'text-fx-text bg-fx-surface-2 border-fx-border-2',
  'B+': 'text-fx-text bg-fx-surface-2 border-fx-border',
  B: 'text-fx-text bg-fx-surface-2 border-fx-border',
  'C+': 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
  C: 'text-fx-text-muted bg-fx-surface-2 border-fx-border',
  D: 'text-fx-danger bg-fx-danger-dim border-transparent',
};

function RatingBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}) {
  if (value == null) return null;
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
        <span className="text-fx-text-muted">{icon}</span>
      </div>
      <span className="text-xs text-fx-text-muted flex-1">{label}</span>
      <div className="w-24 h-1.5 bg-fx-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-fx-orange transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-fx-text w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export function TrustProfileCard({ profile }: Props) {
  const gradeColor =
    GRADE_COLORS[profile.trust_grade] ?? 'text-fx-text-muted bg-fx-surface-2 border-fx-border';

  return (
    <div className="bg-fx-surface border border-fx-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--fx-border)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-fx-orange/10 border-2 border-fx-orange/30 flex items-center justify-center">
          <span className="text-lg font-extrabold text-fx-orange">
            {profile.company_name?.slice(0, 2).toUpperCase() ?? '??'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-fx-text">{profile.company_name}</p>
          <p className="text-xs text-fx-text-muted">{profile.review_count} reviews</p>
        </div>
        <span className={`text-lg font-extrabold px-3 py-1 rounded-xl border ${gradeColor}`}>
          {profile.trust_grade}
        </span>
      </div>

      {/* Overall rating */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--fx-border)' }}
      >
        <Star size={16} className="text-fx-orange fill-fx-orange" />
        <span className="text-xl font-extrabold text-fx-text">
          {profile.avg_overall.toFixed(1)}
        </span>
        <span className="text-xs text-fx-text-muted">/ 5.0 overall</span>
      </div>

      {/* Category breakdowns */}
      <div className="px-4 py-2">
        <RatingBar
          label="Loading Efficiency"
          value={profile.avg_loading_efficiency}
          icon={<Package size={13} />}
        />
        <RatingBar
          label="Dock Wait Time"
          value={profile.avg_dock_wait_time}
          icon={<Clock size={13} />}
        />
        <RatingBar
          label="Communication"
          value={profile.avg_communication}
          icon={<MessageSquare size={13} />}
        />
        <RatingBar
          label="Facility Quality"
          value={profile.avg_facility_quality}
          icon={<Building2 size={13} />}
        />
        <RatingBar
          label="Accuracy"
          value={profile.avg_accuracy}
          icon={<CheckCircle2 size={13} />}
        />
      </div>

      {/* Detention stats */}
      {profile.avg_detention_minutes != null && (
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--fx-border)' }}
        >
          <Shield size={14} className="text-fx-text-muted" />
          <span className="text-xs text-fx-text-muted">Avg Detention:</span>
          <span className="text-xs font-bold text-fx-text">
            {Math.round(profile.avg_detention_minutes)} min
          </span>
        </div>
      )}
    </div>
  );
}
