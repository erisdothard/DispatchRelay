import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, FileText } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { LaneSuggestionsFeed } from '@/features/loads/components/lane-suggestions-feed';
import { BackhaulCard } from '@/features/loads/components/backhaul-card';
import {
  useLaneSuggestions,
  useBackhaulOpportunities,
} from '@/features/loads/hooks/use-lane-suggestions';
import { useAuth } from '@/contexts/AuthContext';
import { getNavRole } from '@/shared/lib/utils';

type Tab = 'suggestions' | 'backhaul';

export default function CarrierAlertsPage() {
  const navigate = useNavigate();
  const { profile, company } = useAuth();
  const role = getNavRole(profile?.role);
  const [tab, setTab] = useState<Tab>('suggestions');

  const { suggestions, loading: suggestionsLoading } = useLaneSuggestions(company?.id);
  const { opportunities, loading: backhaulLoading } = useBackhaulOpportunities(company?.id);

  const loading = tab === 'suggestions' ? suggestionsLoading : backhaulLoading;

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="Alerts & Suggestions" showBack />

      {/* Quick links */}
      <div className="px-5 pt-2 pb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate('/carrier/invitations')}
          className="flex items-center gap-2 bg-fx-surface border border-fx-border rounded-xl p-3 text-left hover:border-fx-orange/40 transition-colors"
        >
          <Mail size={14} className="text-fx-orange shrink-0" />
          <span className="text-xs font-semibold text-fx-text-muted">Invitations</span>
        </button>
        <button
          onClick={() => navigate('/carrier/rfps')}
          className="flex items-center gap-2 bg-fx-surface border border-fx-border rounded-xl p-3 text-left hover:border-fx-orange/40 transition-colors"
        >
          <FileText size={14} className="text-fx-orange shrink-0" />
          <span className="text-xs font-semibold text-fx-text-muted">RFPs</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-3 flex gap-2">
        {(['suggestions', 'backhaul'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold border transition-colors ${
              tab === t
                ? 'bg-fx-orange/10 border-fx-orange/40 text-fx-orange'
                : 'bg-fx-surface border-fx-border text-fx-text-dim hover:border-zinc-600'
            }`}
          >
            {t === 'suggestions' ? 'Lane Suggestions' : 'Backhaul'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
          </div>
        )}

        {!loading && tab === 'suggestions' && <LaneSuggestionsFeed suggestions={suggestions} />}

        {!loading && tab === 'backhaul' && (
          <div className="space-y-2">
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-fx-text-muted text-sm">No backhaul opportunities</p>
                <p className="text-fx-text-dim text-xs mt-1">
                  Check back after completing a delivery.
                </p>
              </div>
            ) : (
              opportunities.map((opp) => <BackhaulCard key={opp.load_id} opportunity={opp} />)
            )}
          </div>
        )}
      </div>

      <BottomNav role={role} />
    </div>
  );
}
