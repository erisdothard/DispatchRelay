import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, WifiOff, Settings2, Sparkles, Truck, ArrowRight } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { LoadCard } from '@/features/loads/components/load-card';
import { LoadDetailSheet } from '@/features/loads/components/load-detail-sheet';
import { MatchBadge } from '@/features/loads/components/match-badge';
import { AiSearchBar } from '@/features/loads/components/ai-search-bar';
import { CarrierPreferencesSheet } from '@/features/loads/components/carrier-preferences-sheet';
import { useLoads } from '@/features/loads/hooks/use-loads';
import { useMatchScores } from '@/features/loads/hooks/use-match-scores';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveLoads, getLoadById } from '@/services/loads.service';
import { getMyActiveBidsWithLoads } from '@/services/bids.service';
import type { BidWithLoad } from '@/services/bids.service';
import { realtimeSubscribe } from '@/lib/realtime-manager';
import { cn } from '@/shared/lib/utils';
import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';
import type { EquipmentType } from '@/lib/database.types';
import type { LoadFilters } from '@/services/loads.service';

const EQUIPMENT_FILTERS = ['All', 'van', 'reefer', 'flatbed', 'step_deck'];
type Tab = 'my_loads' | 'all' | 'matches' | 'history';

export default function CarrierLoadsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRecentFilter = searchParams.get('filter') === 'recent';

  const [tab, setTab] = useState<Tab>('my_loads');
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState('All');
  const [aiFilters, setAiFilters] = useState<LoadFilters>({});
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  // My Loads tab
  const [myLoads, setMyLoads] = useState<Load[]>([]);
  const [myLoadsLoading, setMyLoadsLoading] = useState(true);
  const [myLoadsError, setMyLoadsError] = useState<string | null>(null);
  // Active bids (pending/countered) — loads carrier has bid on but not yet awarded
  const [myBids, setMyBids] = useState<BidWithLoad[]>([]);

  const refreshMyLoads = useCallback(() => {
    if (!user?.id) return;
    setMyLoadsLoading(true);
    setMyLoadsError(null);
    Promise.all([getMyActiveLoads(user.id), getMyActiveBidsWithLoads(user.id)])
      .then(([loads, bids]) => {
        setMyLoads(loads);
        // Exclude bids on loads already in myLoads (already awarded to this carrier)
        const myLoadIds = new Set(loads.map((l) => l.id));
        setMyBids(bids.filter((b) => !myLoadIds.has(b.load_id)));
      })
      .catch((e) => setMyLoadsError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setMyLoadsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    refreshMyLoads();
  }, [refreshMyLoads]);

  useEffect(() => {
    if (!user?.id) return;
    return realtimeSubscribe({ table: 'loads', event: 'UPDATE' }, () => {
      refreshMyLoads();
    });
  }, [user?.id, refreshMyLoads]);

  // Keep selectedLoad in sync with fresh list data (prevents sheet closing on realtime refresh)
  useEffect(() => {
    if (!selectedLoad) return;
    const updated = myLoads.find((l) => l.id === selectedLoad.id);
    if (updated) setSelectedLoad(updated);
  }, [myLoads]);

  // All loads tab
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const {
    loads,
    loading: loadsLoading,
    error: loadsError,
    refresh: refreshLoads,
  } = useLoads({
    equipment: equipFilter === 'All' ? 'all' : (equipFilter as EquipmentType),
    search: search || undefined,
    postedAfter: isRecentFilter ? sevenDaysAgo.toISOString() : undefined,
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

  const loading =
    tab === 'my_loads' || tab === 'history'
      ? myLoadsLoading
      : tab === 'all'
        ? loadsLoading
        : matchLoading;
  const error =
    tab === 'my_loads' || tab === 'history'
      ? myLoadsError
      : tab === 'all'
        ? loadsError
        : matchError;
  const refresh =
    tab === 'my_loads' || tab === 'history'
      ? refreshMyLoads
      : tab === 'all'
        ? refreshLoads
        : refreshMatches;

  // In "matches" tab, show topMatches if prefs set; fall back to scoredLoads
  const hasPrefs =
    preferences &&
    (preferences.preferredEquipment.length > 0 ||
      preferences.preferredOriginStates.length > 0 ||
      preferences.preferredDestStates.length > 0);

  const matchList = hasPrefs ? topMatches : scoredLoads;

  // My Loads grouped by status (active pipeline only)
  const myAwarded = myLoads.filter((l) => l.status === 'awarded');
  const myInProgress = myLoads.filter((l) => ['dispatched', 'in_transit'].includes(l.status));
  const myDelivered = myLoads.filter((l) => l.status === 'delivered');

  // History — completed, cancelled, expired sorted newest first
  const myHistory = myLoads
    .filter((l) => ['completed', 'cancelled', 'expired'].includes(l.status))
    .sort((a, b) => new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime());

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader
        title={isRecentFilter ? 'Recent Loads (Last 7 Days)' : 'Load Board'}
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

      {/* Clear recent filter button */}
      {isRecentFilter && (
        <div className="px-5 pt-3 pb-2">
          <button
            onClick={() => setSearchParams({})}
            className="text-sm text-fx-orange flex items-center gap-1.5 hover:underline"
          >
            ← Show All Loads
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        className="px-5 pt-3 pb-1 flex gap-1"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['my_loads', 'matches', 'all', 'history'] as Tab[]).map((t) => (
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
            {t === 'my_loads'
              ? 'My Loads'
              : t === 'matches'
                ? 'Best Matches'
                : t === 'all'
                  ? 'All Loads'
                  : 'History'}
            {t === 'my_loads' &&
              myAwarded.length + myInProgress.length + myDelivered.length + myBids.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {myAwarded.length + myInProgress.length + myDelivered.length + myBids.length}
                </span>
              )}
            {t === 'matches' && topMatches.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {topMatches.length}
              </span>
            )}
            {t === 'history' && myHistory.length > 0 && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  tab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-fx-surface-2 text-fx-text-muted',
                )}
              >
                {myHistory.length}
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
      <div className="px-5 mb-3">
        <span className="text-xs font-semibold text-fx-text-muted">
          {loading
            ? 'Loading…'
            : tab === 'history'
              ? `${myHistory.length} past load${myHistory.length !== 1 ? 's' : ''}`
              : tab === 'my_loads'
                ? (() => {
                    const n =
                      myAwarded.length + myInProgress.length + myDelivered.length + myBids.length;
                    return `${n} active load${n !== 1 ? 's' : ''}`;
                  })()
                : tab === 'matches'
                  ? `${matchList.length} ${hasPrefs ? 'matched' : 'scored'} loads`
                  : `${loads.length} loads available`}
        </span>
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
          myAwarded.length + myInProgress.length + myDelivered.length + myBids.length === 0 &&
          myHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Truck size={36} className="text-fx-text-dim mb-4" />
              <p className="font-bold text-fx-text">No active loads</p>
              <p className="text-sm text-fx-text-muted mt-1">
                Bid on or book a load to see it here
              </p>
            </div>
          ) : myAwarded.length + myInProgress.length + myDelivered.length + myBids.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">🗂️</div>
              <p className="font-bold text-fx-text mb-1">No active loads right now</p>
              <p className="text-xs text-fx-text-dim">
                Past loads are in{' '}
                <button onClick={() => setTab('history')} className="text-fx-orange font-semibold">
                  History →
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Status summary rail */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5 mb-4">
                {[
                  {
                    label: 'Bidding',
                    count: myBids.length,
                    textColor: 'text-blue-400',
                    bgClass: 'bg-blue-400/10 border border-blue-400/25',
                  },
                  {
                    label: 'Needs Dispatch',
                    count: myAwarded.length,
                    textColor: 'text-amber-400',
                    bgClass: 'bg-amber-400/10 border border-amber-400/25',
                  },
                  {
                    label: 'Running',
                    count: myInProgress.length,
                    textColor: 'text-fx-orange',
                    bgClass: 'bg-fx-orange/10 border border-fx-orange/25',
                  },
                  {
                    label: 'Delivered',
                    count: myDelivered.length,
                    textColor: 'text-green-400',
                    bgClass: 'bg-green-400/10 border border-green-400/25',
                  },
                ]
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div
                      key={s.label}
                      className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl ${s.bgClass}`}
                    >
                      <span className={`text-[26px] font-extrabold leading-none ${s.textColor}`}>
                        {s.count}
                      </span>
                      <span className={`text-[12px] font-bold leading-tight ${s.textColor}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Bidding On — loads with pending/countered bids */}
              {myBids.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div style={{ borderLeft: '3px solid #60A5FA', paddingLeft: '12px' }}>
                    <p className="text-[17px] font-bold text-blue-400 leading-tight">Bidding On</p>
                    <p className="text-[11px] text-fx-text-dim mt-0.5">
                      Waiting for broker response
                    </p>
                  </div>
                  {myBids.map((bid) => {
                    const l = bid.load;
                    if (!l) return null;
                    const isCountered = bid.status === 'countered';
                    return (
                      <button
                        key={bid.id}
                        onClick={async () => {
                          try {
                            const fullLoad = await getLoadById(bid.load_id);
                            if (fullLoad) setSelectedLoad(fullLoad);
                          } catch {
                            /* fallback — do nothing */
                          }
                        }}
                        className={cn(
                          'w-full text-left rounded-ios p-4 active-scale transition-colors',
                          isCountered
                            ? 'bg-blue-500/[0.06] border border-blue-500/20'
                            : 'bg-fx-surface border border-white/[0.06]',
                        )}
                        style={
                          isCountered
                            ? { boxShadow: 'inset 3px 0 0 rgba(96,165,250,0.65)' }
                            : undefined
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[11px] text-fx-text-dim">{l.load_number}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[15px] font-bold text-white truncate">
                                {l.origin_city}, {l.origin_state}
                              </span>
                              <ArrowRight size={12} className="text-fx-text-dim shrink-0" />
                              <span className="text-[15px] font-bold text-white truncate">
                                {l.dest_city}, {l.dest_state}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[15px] font-bold text-white">
                              ${bid.amount_usd.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-fx-text-dim">
                              Ask ${l.rate_usd.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-fx-text-dim bg-fx-surface-2 px-2.5 py-0.5 rounded-full">
                              {EQUIPMENT_LABELS[l.equipment as keyof typeof EQUIPMENT_LABELS] ??
                                l.equipment}
                            </span>
                            <span
                              className={cn(
                                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                                isCountered
                                  ? 'text-blue-400 bg-blue-400/10'
                                  : 'text-fx-orange bg-fx-orange/10',
                              )}
                            >
                              {isCountered ? 'Counter Received' : 'Bid Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-blue-400">View →</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Needs Dispatch */}
              {myAwarded.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div style={{ borderLeft: '3px solid #F59E0B', paddingLeft: '12px' }}>
                    <p className="text-[17px] font-bold text-amber-400 leading-tight">
                      Needs Dispatch
                    </p>
                    <p className="text-[11px] text-fx-text-dim mt-0.5">
                      Assign a driver to get rolling
                    </p>
                  </div>
                  {myAwarded.map((load) => (
                    <LoadCard
                      key={load.id}
                      load={load}
                      onPress={setSelectedLoad}
                      onBid={setSelectedLoad}
                    />
                  ))}
                </div>
              )}

              {/* In Progress */}
              {myInProgress.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div style={{ borderLeft: '3px solid #E86030', paddingLeft: '12px' }}>
                    <p className="text-[17px] font-bold text-fx-orange leading-tight">
                      In Progress
                    </p>
                    <p className="text-[11px] text-fx-text-dim mt-0.5">
                      Truck is running — tap to monitor
                    </p>
                  </div>
                  {myInProgress.map((load) => (
                    <LoadCard
                      key={load.id}
                      load={load}
                      onPress={setSelectedLoad}
                      onBid={setSelectedLoad}
                    />
                  ))}
                </div>
              )}

              {/* Pending Close-Out */}
              {myDelivered.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div style={{ borderLeft: '3px solid #4ADE80', paddingLeft: '12px' }}>
                    <p className="text-[17px] font-bold text-green-400 leading-tight">
                      Pending Close-Out
                    </p>
                    <p className="text-[11px] text-fx-text-dim mt-0.5">
                      Delivered — waiting on broker to finalize
                    </p>
                  </div>
                  {myDelivered.map((load) => (
                    <LoadCard
                      key={load.id}
                      load={load}
                      onPress={setSelectedLoad}
                      onBid={setSelectedLoad}
                    />
                  ))}
                </div>
              )}

              {myHistory.length > 0 && (
                <div className="pt-2 pb-4 text-center">
                  <p className="text-xs text-fx-text-dim">
                    {myHistory.length} past load{myHistory.length !== 1 ? 's' : ''} in{' '}
                    <button
                      onClick={() => setTab('history')}
                      className="text-fx-orange font-semibold"
                    >
                      History →
                    </button>
                  </p>
                </div>
              )}
            </>
          )
        ) : tab === 'history' ? (
          myHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🗂️</div>
              <p className="font-bold text-fx-text">No past loads yet</p>
              <p className="text-sm text-fx-text-muted mt-1">
                Completed, cancelled, and expired loads will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myHistory.map((load) => (
                <LoadCard
                  key={load.id}
                  load={load}
                  onPress={setSelectedLoad}
                  onBid={setSelectedLoad}
                />
              ))}
            </div>
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
    </div>
  );
}
