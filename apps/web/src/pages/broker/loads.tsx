import { useState } from 'react';
import { Plus, Search, X, SlidersHorizontal, WifiOff } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { LoadCard } from '@/features/loads/components/load-card';
import { PostLoadSheet } from '@/features/loads/components/post-load-sheet';
import { LoadDetailSheet } from '@/features/loads/components/load-detail-sheet';
import { useLoads } from '@/features/loads/hooks/use-loads';
import { cn } from '@/shared/lib/utils';
import type { Load } from '@freightx/shared';
import type { LoadStatus } from '@/lib/database.types';

const STATUS_FILTERS = ['All', 'posted', 'in_transit', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  All: 'All Loads',
  posted: 'Posted',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function BrokerLoadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showPost, setShowPost] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const { loads, loading, error, refresh } = useLoads({
    status: statusFilter === 'All' ? 'all' : (statusFilter as LoadStatus),
    search: search || undefined,
  });

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="My Loads" showBack />

      <div className="px-5 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-orange" />
          <input
            type="text"
            placeholder="Search loads by lane, ID, commodity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-fx-surface border border-fx-border rounded-2xl pl-10 pr-10 text-sm text-fx-text placeholder:text-fx-text-dim focus:border-fx-orange focus:ring-1 focus:ring-fx-orange/30 outline-none transition-all"
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

        {/* Status filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'shrink-0 h-8 px-4 rounded-xl text-xs font-semibold border transition-all duration-200',
                statusFilter === s
                  ? 'bg-fx-orange text-white border-fx-orange'
                  : 'bg-fx-surface border-fx-border text-fx-text-muted hover:border-fx-border-2',
              )}
            >
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Post Load CTA */}
      <button
        onClick={() => setShowPost(true)}
        className="mx-5 mb-1 w-[calc(100%-40px)] h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white"
        style={{
          background: 'linear-gradient(145deg, #F07040, #C03A12)',
          boxShadow: '0 4px 16px rgba(232,96,48,0.35)',
        }}
      >
        <Plus size={17} />
        Post New Load
      </button>

      {/* Results count */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-fx-text-muted">
          {loading ? 'Loading…' : `${loads.length} loads`}
        </span>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-fx-text-muted">
          <SlidersHorizontal size={13} />
          Filters
        </button>
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
            <p className="font-bold text-fx-text">Couldn't load your loads</p>
            <p className="text-sm text-fx-text-muted mt-1 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm font-semibold text-fx-orange border border-fx-orange/30 px-5 py-2 rounded-xl hover:bg-fx-orange/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-bold text-fx-text">No loads found</p>
            <p className="text-sm text-fx-text-muted mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          loads.map((load) => (
            <LoadCard key={load.id} load={load} showBidButton={false} onPress={setSelectedLoad} />
          ))
        )}
      </div>

      <BottomNav role="broker" />

      <PostLoadSheet open={showPost} onClose={() => setShowPost(false)} onCreated={refresh} />

      <LoadDetailSheet
        load={selectedLoad}
        onClose={() => setSelectedLoad(null)}
        showBidButton={false}
        role="broker"
      />
    </div>
  );
}
