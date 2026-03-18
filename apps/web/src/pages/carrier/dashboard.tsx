import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowUpRight, MapPin, Navigation, Package, User, UserCheck } from 'lucide-react';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveLoads } from '@/services/loads.service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { NotificationSheet } from '@/features/notifications/components/notification-sheet';
import { AssignDriverSheet } from '@/features/loads/components/assign-driver-sheet';

import type { Load } from '@freightx/shared';

const QUICK_ACTIONS = [
  {
    label: 'New Tracking',
    sub: 'Tracking ID',
    icon: <Navigation size={20} className="text-fx-orange" />,
    path: '/track',
  },
  {
    label: 'My Profile',
    sub: 'View profile',
    icon: <User size={20} className="text-fx-orange" />,
    path: '/profile',
  },
  {
    label: 'Your Location',
    sub: 'View map',
    icon: <MapPin size={20} className="text-fx-orange" />,
    path: '/carrier/fleet',
  },
  {
    label: 'Browse Loads',
    sub: 'Load board',
    icon: <Package size={20} className="text-fx-orange" />,
    path: '/carrier/loads',
  },
];

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { profile, company, user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [assignLoad, setAssignLoad] = useState<Load | null>(null);

  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    if (user?.id) {
      getMyActiveLoads(user.id).then(setLoads).catch(console.error);
    }
  }, [user?.id]);

  const recentLoads = loads.slice(0, 3);
  const currentLoad = loads.find((l) =>
    ['dispatched', 'in_transit', 'awarded'].includes(l.status)
  ) ?? loads[0] ?? null;


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
        {/* Quick actions 2×2 */}
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

        {/* Current Shipping */}
        {currentLoad && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[17px] font-bold text-white tracking-[-0.01em]">
                Current Shipping
              </p>
              <span className="text-[11px] font-semibold text-white bg-fx-orange px-2.5 py-1 rounded-full">
                Transit
              </span>
            </div>

            <div className="bg-fx-surface rounded-ios p-5 card-highlight">
              <p className="text-[13px] font-medium text-fx-text-dim mb-4">
                ID {currentLoad.loadNumber}
              </p>

              {/* Progress track */}
              <div className="relative mb-4">
                <div className="w-full h-[3px] bg-fx-border rounded-full" />
                <div
                  className="absolute left-0 top-0 h-[3px] rounded-full bg-orange-gradient"
                  style={{ width: '58%' }}
                />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-gradient ring-2 ring-fx-bg" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-gradient ring-2 ring-fx-bg shadow-orange-glow-sm"
                  style={{ left: '58%' }}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-fx-border ring-2 ring-fx-bg" />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-fx-text-dim">
                    {new Date(currentLoad.pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[15px] font-bold text-white mt-0.5 tracking-[-0.01em]">
                    {currentLoad.originCity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-fx-text-dim">
                    Estimated{' '}
                    {new Date(currentLoad.deliveryDate + 'T12:00:00').toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[15px] font-bold text-white mt-0.5 tracking-[-0.01em]">
                    {currentLoad.destCity}
                  </p>
                </div>
              </div>

              {/* Assign Driver button */}
              {!currentLoad.assignedDriverId && ['awarded', 'dispatched'].includes(currentLoad.status) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
            </div>
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
              {recentLoads.map((load, i) => (
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
                    <span className="text-[11px] font-bold text-white bg-black/25 px-2.5 py-1 rounded-full">
                      {load.status === 'delivered'
                        ? 'Delivered'
                        : load.status === 'in_transit'
                          ? 'In Transit'
                          : 'Posted'}
                    </span>
                  </div>
                </button>
              ))}
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
