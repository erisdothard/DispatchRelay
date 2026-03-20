import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowUpRight, MapPin, Navigation, UserCheck } from 'lucide-react';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveLoads } from '@/services/loads.service';
import { getBolStatusForLoads } from '@/services/documents.service';
import type { BolStatus } from '@/services/documents.service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { NotificationSheet } from '@/features/notifications/components/notification-sheet';
import { AssignDriverSheet } from '@/features/loads/components/assign-driver-sheet';

import { EQUIPMENT_LABELS } from '@freightx/shared';
import type { Load } from '@freightx/shared';

const QUICK_ACTIONS = [
  {
    label: 'Track Load',
    sub: 'Search by load #',
    icon: <Navigation size={20} className="text-fx-orange" />,
    path: '/track',
  },
  {
    label: 'My Fleet',
    sub: 'Trucks & GPS',
    icon: <MapPin size={20} className="text-fx-orange" />,
    path: '/carrier/fleet',
  },
];

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { profile, company, user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [bolStatuses, setBolStatuses] = useState<BolStatus[]>([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [assignLoad, setAssignLoad] = useState<Load | null>(null);

  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    if (user?.id) {
      getMyActiveLoads(user.id)
        .then((all) => {
          setLoads(all);
          const ids = all.map((l) => l.id);
          if (ids.length > 0) {
            getBolStatusForLoads(ids).then(setBolStatuses).catch(console.error);
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  const statusPriority: Record<string, number> = {
    in_transit: 0,
    dispatched: 1,
    awarded: 2,
    delivered: 3,
    completed: 4,
  };
  const recentLoads = [...loads]
    .sort((a, b) => (statusPriority[a.status] ?? 5) - (statusPriority[b.status] ?? 5))
    .slice(0, 3);
  const activeLoads = loads.filter((l) =>
    ['dispatched', 'in_transit', 'awarded'].includes(l.status),
  );

  // Carousel dot tracking
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / activeLoads.length;
    setActiveSlide(Math.round(scrollLeft / cardWidth));
  }, [activeLoads.length]);

  const name = profile?.full_name ?? 'Driver';
  const companyName = company?.name ?? '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <IOSStatusBar />

      {/* Header */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-orange-gradient flex items-center justify-center card-orange-highlight">
              <span className="text-sm font-bold text-white">{initials}</span>
            </div>
            <div className="absolute inset-0 rounded-full ring-2 ring-fx-orange/40" />
          </div>
          <div>
            <p className="text-xs text-fx-text-dim font-medium">
              {companyName.split(' ').slice(0, 2).join(' ')}
            </p>
            <p className="text-[17px] font-bold text-white tracking-[-0.01em]">
              Hi, {name.split(' ')[0]}!
            </p>
          </div>
        </div>

        <button
          className="w-11 h-11 rounded-full bg-fx-surface flex items-center justify-center relative card-highlight"
          onClick={() => setNotifsOpen(true)}
        >
          <Bell size={18} className="text-fx-text-muted" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 min-w-[16px] h-4 bg-fx-orange rounded-full ring-2 ring-fx-bg flex items-center justify-center px-0.5">
              <span className="text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 space-y-6 pb-2">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="bg-fx-surface rounded-ios-sm p-4 flex items-center gap-3 active-scale card-highlight text-left transition-colors hover:bg-fx-surface-2"
            >
              <div className="w-10 h-10 rounded-ios-xs bg-fx-orange/15 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{item.label}</p>
                <p className="text-[11px] text-fx-text-dim truncate mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Current Shipping — Carousel */}
        {activeLoads.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[17px] font-bold text-white tracking-[-0.01em]">
                Current Shipping
              </p>
              <span className="text-[11px] font-semibold text-white bg-fx-orange px-2.5 py-1 rounded-full">
                {activeLoads.length} Active
              </span>
            </div>

            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 -mx-5 px-5"
            >
              {activeLoads.map((currentLoad) => (
                <button
                  key={currentLoad.id}
                  onClick={() => navigate(`/track/${currentLoad.loadNumber}`)}
                  className="min-w-[85%] snap-center bg-fx-surface rounded-ios p-5 card-highlight text-left shrink-0 active-scale transition-colors"
                >
                  <p className="text-[13px] font-medium text-fx-text-dim">
                    ID {currentLoad.loadNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1 mb-4">
                    <span className="text-[11px] font-bold text-fx-orange bg-fx-orange/15 px-2 py-0.5 rounded-full">
                      {EQUIPMENT_LABELS[currentLoad.equipment] ?? currentLoad.equipment}
                    </span>
                    {currentLoad.weightLbs > 0 && (
                      <span className="text-[11px] text-fx-text-dim">
                        {currentLoad.weightLbs.toLocaleString()} lbs
                      </span>
                    )}
                    <span className="text-[11px] text-fx-text-dim">
                      ${currentLoad.rateUsd.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="relative mb-4">
                    <div className="w-full h-[3px] bg-fx-border rounded-full" />
                    <div
                      className="absolute left-0 top-0 h-[3px] rounded-full bg-orange-gradient"
                      style={{ width: currentLoad.status === 'in_transit' ? '58%' : '20%' }}
                    />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-gradient ring-2 ring-fx-bg" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-gradient ring-2 ring-fx-bg shadow-orange-glow-sm"
                      style={{ left: currentLoad.status === 'in_transit' ? '58%' : '20%' }}
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-fx-border ring-2 ring-fx-bg" />
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-fx-text-dim">
                        {new Date(currentLoad.pickupDate + 'T12:00:00').toLocaleDateString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </p>
                      <p className="text-[15px] font-bold text-white mt-0.5 tracking-[-0.01em]">
                        {currentLoad.originCity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-fx-text-dim">
                        Estimated{' '}
                        {new Date(currentLoad.deliveryDate + 'T12:00:00').toLocaleDateString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </p>
                      <p className="text-[15px] font-bold text-white mt-0.5 tracking-[-0.01em]">
                        {currentLoad.destCity}
                      </p>
                    </div>
                  </div>

                  {/* Assign Driver button */}
                  {!currentLoad.assignedDriverId &&
                    ['awarded', 'dispatched'].includes(currentLoad.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setAssignLoad(currentLoad);
                        }}
                        className="mt-4 w-full h-10 rounded-xl border border-fx-orange/30 text-fx-orange text-xs font-semibold flex items-center justify-center gap-2 hover:bg-fx-orange/10 transition-colors"
                      >
                        <UserCheck size={14} />
                        Assign Driver
                      </button>
                    )}
                  {currentLoad.assignedDriverId && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-semibold">
                      <UserCheck size={14} />
                      Driver Assigned
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Dot indicators */}
            {activeLoads.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {activeLoads.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeSlide ? 'w-4 bg-fx-orange' : 'w-1.5 bg-fx-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Shipping */}
        {recentLoads.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[17px] font-bold text-white tracking-[-0.01em]">Recent Shipping</p>
              <button
                onClick={() => navigate('/carrier/loads')}
                className="text-[13px] font-semibold text-fx-orange flex items-center gap-1"
              >
                See All <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {recentLoads.map((load, i) => {
                const bol = bolStatuses.find((b) => b.loadId === load.id);
                const showBolBadge = ['dispatched', 'in_transit'].includes(load.status);

                return (
                  <button
                    key={load.id}
                    onClick={() => navigate(`/track/${load.loadNumber}`)}
                    className="relative w-full bg-orange-gradient rounded-ios p-5 card-orange-highlight text-left active-scale overflow-hidden grain"
                    style={{
                      filter: i === 1 ? 'brightness(0.91)' : i === 2 ? 'brightness(0.82)' : 'none',
                    }}
                  >
                    <p
                      className="text-[32px] font-extrabold text-white leading-none mb-1"
                      style={{ letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {load.loadNumber}
                    </p>
                    <p className="text-[11px] text-white/50 font-medium mb-3 tracking-wide uppercase">
                      {load.commodity} · {load.totalMiles ? `${load.totalMiles} mi` : '—'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-white/80 font-semibold">
                        {load.originCity} → {load.destCity}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {showBolBadge && bol && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              bol.signed
                                ? 'bg-green-500/30 text-green-200'
                                : bol.hasBol
                                  ? 'bg-orange-400/30 text-orange-200'
                                  : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {bol.signed ? 'BOL Signed' : bol.hasBol ? 'BOL Pending' : 'No BOL'}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-white bg-black/25 px-2.5 py-1 rounded-full">
                          {load.status === 'delivered'
                            ? 'Delivered'
                            : load.status === 'completed'
                              ? 'Completed'
                              : load.status === 'in_transit'
                                ? 'In Transit'
                                : load.status === 'dispatched'
                                  ? 'Dispatched'
                                  : load.status === 'awarded'
                                    ? 'Awarded'
                                    : load.status === 'bid_received'
                                      ? 'Bid Received'
                                      : 'Posted'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {loads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🚛</div>
            <p className="font-bold text-fx-text">No loads yet</p>
            <p className="text-sm text-fx-text-muted mt-1">Browse the load board to get started</p>
          </div>
        )}
      </div>

      <BottomNav role="carrier" />

      <NotificationSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />

      {assignLoad && (
        <AssignDriverSheet
          open={!!assignLoad}
          onClose={() => setAssignLoad(null)}
          load={assignLoad}
          onAssigned={() => {
            setAssignLoad(null);
            if (user?.id) getMyActiveLoads(user.id).then(setLoads).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
