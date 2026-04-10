import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, WifiOff, Settings2, Sparkles, Truck } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { LoadCard } from '@/features/loads/components/load-card';
import { LoadDetailSheet } from '@/features/loads/components/load-detail-sheet';
import { MatchBadge } from '@/features/loads/components/match-badge';
import { AiSearchBar } from '@/features/loads/components/ai-search-bar';
import { CarrierPreferencesSheet } from '@/features/loads/components/carrier-preferences-sheet';
import { SavedSearchesSheet } from '@/features/loads/components/saved-searches-sheet';
import { useLoads } from '@/features/loads/hooks/use-loads';
import { useMatchScores } from '@/features/loads/hooks/use-match-scores';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveLoads } from '@/services/loads.service';
import { cn } from '@/shared/lib/utils';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import type { EquipmentType } from '@/lib/database.types';
import type { LoadFilters } from '@/services/loads.service';

const EQUIPMENT_FILTERS = ['All', 'van', 'reefer', 'flatbed', 'step_deck'];
type Tab = 'my_loads' | 'all' | 'matches';

export default function CarrierLoadsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState('All');
  const [aiFilters, setAiFilters] = useState<LoadFilters>({});
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);

  // My Loads tab
  const [myLoads, setMyLoads] = useState<Load[]>([]);
  const [myLoadsLoading, setMyLoadsLoading] = useState(true);
  const [myLoadsError, setMyLoadsError] = useState<string | null>(null);

  const refreshMyLoads = useCallback(() => {
    if (!user?.id) return;
    setMyLoadsLoading(true);
    setMyLoadsError(null);
    getMyActiveLoads(user.id)
      .then(setMyLoads)
      .catch((e) => setMyLoadsError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setMyLoadsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    refreshMyLoads();
  }, [refreshMyLoads]);

  // All loads tab
  const {
    loads,
    loading: loadsLoading,
    error: loadsError,
    refresh: refreshLoads,
  } = useLoads({
    equipment: equipFilter === 'All' ? 'all' : (equipFilter as EquipmentType),
    search: search || undefined,
    ...aiFilters,
  });

  // Best Matches tab
  const {
    topMatches,
    scoredLoads,
    preferences,
    loading: matchLoading,
    error: matchError,
    refresh: refreshMatches,
  } = useMatchScores();

  const loading = tab === 'my_loads' ? myLoadsLoading : tab === 'all' ? loadsLoading : matchLoading;
  const error = tab === 'my_loads' ? myLoadsError : tab === 'all' ? loadsError : matchError;
  const refresh =
    tab === 'my_loads' ? refreshMyLoads : tab === 'all' ? refreshLoads : refreshMatches;

  // In "matches" tab, show topMatches if prefs set; fall back to scoredLoads
  const hasPrefs =
    preferences &&
    (preferences.preferredEquipment.length > 0 ||
      preferences.preferredOriginStates.length > 0 ||
      preferences.preferredDestStates.length > 0);

  const matchList = hasPrefs ? topMatches : scoredLoads;

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader
        title="Load Board"
        showBack
        right={
          <button
            onClick={() => setPrefsOpen(true)}
            className="w-9 h-9 rounded-full bg-fx-surface border border-fx-border flex items-center justify-center hover:border-fx-orange/50 transition-colors"
          >
            <Settings2 size={15} className="text-fx-text-muted" />
          </button>
        }
      />

      {/* Tabs */}
      <div
        className="px-5 pt-3 pb-1 flex gap-1"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['my_loads', 'matches', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all',
              tab === t ? 'bg-fx-orange text-white' : 'text-fx-text-muted hover:text-fx-text',
            )}
          >
            {t === 'my_loads' && <Truck size={12} />}
            {t === 'matches' && <Sparkles size={12} />}
            {t === 'my_loads' ? 'My Loads' : t === 'matches' ? 'Best Matches' : 'All Loads'}
            {t === 'my_loads' && myLoads.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {myLoads.length}
              </span>
            )}
            {t === 'matches' && topMatches.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {topMatches.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-3 space-y-3">
        {/* AI search bar — both tabs */}
        <AiSearchBar
          onFilters={(f) => {
            // Reset manual filters so they don't compound with AI results
            setEquipFilter('All');
            setSearch('');
            setAiFilters(f);
            setTab('all');
          }}
          onClear={() => {
            setAiFilters({});
            setEquipFilter('All');
            setSearch('');
          }}
        />

        {/* Standard search + equipment chips — All Loads tab only */}
        {tab === 'all' && (
          <>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-orange"
              />
              <input
                type="text"
                placeholder="Search origin, destination, commodity…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-fx-surface border border-fx-border rounded-2xl pl-10 pr-10 text-sm text-white placeholder:text-fx-text-dim focus:border-fx-orange focus:ring-1 focus:ring-fx-orange/30 outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {EQUIPMENT_FILTERS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => setEquipFilter(eq)}
                  className={cn(
                    'shrink-0 h-8 px-4 rounded-xl text-xs font-semibold border transition-all duration-200',
                    equipFilter === eq
                      ? 'bg-fx-orange text-white border-fx-orange'
                      : 'bg-fx-surface border-fx-border text-fx-text-muted hover:border-fx-border-2',
                  )}
                >
                  {eq === 'All' ? 'All Equipment' : (EQUIPMENT_LABELS[eq as EquipmentType] ?? eq)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Best Matches hint */}
        {tab === 'matches' && !hasPrefs && !loading && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-ios-xs bg-fx-orange/10 border border-fx-orange/20">
            <Sparkles size={13} className="text-fx-orange shrink-0" />
            <p className="text-[12px] text-fx-text-muted">
              Set your preferences to see your best-matched loads first.{' '}
              <button onClick={() => setPrefsOpen(true)} className="text-fx-orange font-semibold">
                Set preferences →
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Active AI filter chips */}
      {Object.keys(aiFilters).length > 0 && (
        <div className="px-5 mb-1 flex flex-wrap gap-1.5">
          {aiFilters.equipment && (
            <span className="text-[11px] bg-fx-orange/15 text-fx-orange border border-fx-orange/30 px-2.5 py-1 rounded-full font-semibold">
              {EQUIPMENT_LABELS[aiFilters.equipment as keyof typeof EQUIPMENT_LABELS] ??
                aiFilters.equipment}
            </span>
          )}
          {aiFilters.originState && (
            <span className="text-[11px] bg-fx-surface border border-fx-border text-fx-text-muted px-2.5 py-1 rounded-full">
              From: {aiFilters.originState}
            </span>
          )}
          {aiFilters.destState && (
            <span className="text-[11px] bg-fx-surface border border-fx-border text-fx-text-muted px-2.5 py-1 rounded-full">
              To: {aiFilters.destState}
            </span>
          )}
          {aiFilters.minRatePerMile && (
            <span className="text-[11px] bg-fx-surface border border-fx-border text-fx-text-muted px-2.5 py-1 rounded-full">
              ≥ ${aiFilters.minRatePerMile}/mi
            </span>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-fx-text-muted">
          {loading
            ? 'Loading…'
            : tab === 'my_loads'
              ? `${myLoads.length} active load${myLoads.length !== 1 ? 's' : ''}`
              : tab === 'matches'
                ? `${matchList.length} ${hasPrefs ? 'matched' : 'scored'} loads`
                : `${loads.length} loads available`}
        </span>
        {tab === 'all' && (
          <button
            onClick={() => setSavedSearchesOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-fx-text-muted hover:text-fx-orange transition-colors"
          >
            <SlidersHorizontal size={13} />
            Filters
          </button>
        )}
      </div>

      {/* Load list */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-fx-border border-t-fx-orange rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <WifiOff size={36} className="text-fx-text-dim mb-4" />
            <p className="font-bold text-fx-text">Couldn't load the board</p>
            <p className="text-sm text-fx-text-muted mt-1 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm font-semibold text-fx-orange border border-fx-orange/30 px-5 py-2 rounded-xl hover:bg-fx-orange/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tab === 'my_loads' ? (
          myLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Truck size={36} className="text-fx-text-dim mb-4" />
              <p className="font-bold text-fx-text">No active loads</p>
              <p className="text-sm text-fx-text-muted mt-1">
                Bid on or book a load to see it here
              </p>
            </div>
          ) : (
            myLoads.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                onPress={setSelectedLoad}
                onBid={setSelectedLoad}
              />
            ))
          )
        ) : tab === 'matches' ? (
          matchList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles size={36} className="text-fx-text-dim mb-4" />
              <p className="font-bold text-fx-text">No strong matches yet</p>
              <p className="text-sm text-fx-text-muted mt-1">
                Update your preferences or check All Loads
              </p>
            </div>
          ) : (
            matchList.map((load) => (
              <div key={load.id} className="relative">
                <div className="absolute -top-1 right-0 z-10">
                  <MatchBadge score={load.matchScore} />
                </div>
                <LoadCard load={load} onPress={setSelectedLoad} onBid={setSelectedLoad} />
              </div>
            ))
          )
        ) : loads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-fx-text">No loads found</p>
            <p className="text-sm text-fx-text-muted mt-1 mb-4">
              {aiFilters.equipment
                ? `No ${EQUIPMENT_LABELS[aiFilters.equipment as keyof typeof EQUIPMENT_LABELS] ?? aiFilters.equipment} loads available right now`
                : 'Try adjusting your filters'}
            </p>
            {Object.keys(aiFilters).length > 0 && (
              <button
                onClick={() => {
                  setAiFilters({});
                  setEquipFilter('All');
                  setSearch('');
                }}
                className="text-sm font-semibold text-fx-orange border border-fx-orange/30 px-5 py-2 rounded-xl hover:bg-fx-orange/10 transition-colors"
              >
                Clear search — show all loads
              </button>
            )}
          </div>
        ) : (
          loads.map((load) => (
            <LoadCard key={load.id} load={load} onPress={setSelectedLoad} onBid={setSelectedLoad} />
          ))
        )}
      </div>

      <BottomNav role="carrier" />

      <LoadDetailSheet
        load={selectedLoad}
        onClose={() => {
          setSelectedLoad(null);
          refreshMyLoads();
        }}
        showBidButton
        role="carrier"
      />

      {preferences && (
        <CarrierPreferencesSheet
          open={prefsOpen}
          onClose={() => setPrefsOpen(false)}
          initial={preferences}
          onSaved={() => refreshMatches()}
        />
      )}

      <SavedSearchesSheet
        open={savedSearchesOpen}
        onClose={() => setSavedSearchesOpen(false)}
        currentFilters={{
          equipment: equipFilter === 'All' ? undefined : (equipFilter as EquipmentType),
          search: search || undefined,
          ...aiFilters,
        }}
        onApply={(filters) => {
          setAiFilters(filters);
          if (filters.equipment) setEquipFilter(filters.equipment);
          else setEquipFilter('All');
          if (filters.search) setSearch(filters.search);
          setSavedSearchesOpen(false);
        }}
      />
    </div>
  );
}
