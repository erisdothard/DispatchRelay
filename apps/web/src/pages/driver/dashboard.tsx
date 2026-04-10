import { useState, useEffect } from 'react';
import { Search, Package, Clock, TrendingDown, CheckCircle, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { StatCard } from '@/shared/components/stat-card';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverLoads } from '@/services/loads.service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { NotificationSheet } from '@/features/notifications/components/notification-sheet';
import { useDriverLocation } from '@/features/loads/hooks/use-driver-location';
import { useGpsConsent } from '@/features/loads/hooks/use-gps-consent';
import { GpsConsentModal } from '@/features/loads/components/gps-consent-modal';
import type { Load } from '@freightx/shared';

/** Renders nothing — just activates GPS pinging for a single load */
function GpsPinger({ loadNumber }: { loadNumber: string }) {
  useDriverLocation({ loadNumber, active: true });
  return null;
}

const statusBadge: Record<string, 'orange' | 'blue' | 'green' | 'gray'> = {
  in_transit: 'orange',
  dispatched: 'blue',
  awarded: 'blue',
  delivered: 'green',
};

const statusLabel: Record<string, string> = {
  in_transit: 'In Transit',
  dispatched: 'Dispatched',
  awarded: 'Awarded',
  delivered: 'Delivered',
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [activeLoads, setActiveLoads] = useState<Load[]>([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [manualGpsToggle, setManualGpsToggle] = useState(() => {
    try {
      return localStorage.getItem('fx-gps-sharing') === 'true';
    } catch {
      return false;
    }
  });

  // GPS is on if: manual toggle is on OR any load is in_transit
  const hasInTransitLoads = activeLoads.some((l) => l.status === 'in_transit');
  const sharingLocation = manualGpsToggle || hasInTransitLoads;
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { hasConsented, grantConsent } = useGpsConsent();
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // Persist GPS sharing toggle across sessions
  useEffect(() => {
    try {
      localStorage.setItem('fx-gps-sharing', String(manualGpsToggle));
    } catch {
      /* ignored */
    }
  }, [manualGpsToggle]);

  useEffect(() => {
    if (user?.id) {
      getDriverLoads(user.id)
        .then((all) => {
          // Sort: in_transit first, then dispatched/awarded, then delivered/completed
          const priority: Record<string, number> = {
            in_transit: 0,
            dispatched: 1,
            awarded: 2,
            delivered: 3,
            completed: 4,
          };
          const sorted = [...all].sort(
            (a, b) => (priority[a.status] ?? 5) - (priority[b.status] ?? 5),
          );
          setLoads(sorted.slice(0, 5));
        })
        .catch(console.error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      // Fetch all assigned loads, filter to GPS-eligible (everything before delivered)
      const terminal = new Set([
        'delivered',
        'cancelled',
        'tonu',
        'rejected',
        'draft',
        'pending_approval',
      ]);
      getDriverLoads(user.id)
        .then((all) => setActiveLoads(all.filter((l) => !terminal.has(l.status))))
        .catch(console.error);
    }
  }, [user?.id]);

  const name = profile?.full_name ?? 'Driver';

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader
        greeting
        name={name}
        notificationCount={unreadCount}
        onNotificationClick={() => setNotifsOpen(true)}
      />

      {/* Search */}
      <div className="px-5 py-3">
        <button
          onClick={() => navigate('/track')}
          className="w-full h-12 bg-fx-surface border border-fx-border rounded-2xl flex items-center gap-3 px-4 hover:border-fx-orange/50 transition-all duration-200"
        >
          <Search size={16} className="text-fx-orange" />
          <span className="text-sm text-fx-text-dim font-medium">Track by load # or PRO...</span>
        </button>
      </div>

      {/* GPS pingers — auto-enabled for in_transit, manual toggle for others */}
      {activeLoads
        .filter((l) => l.status === 'in_transit' || sharingLocation)
        .map((l) => (
          <GpsPinger key={l.loadNumber} loadNumber={l.loadNumber} />
        ))}

      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Share Location banner */}
        <button
          onClick={() => {
            if (hasInTransitLoads) {
              // GPS is auto-locked when loads are in_transit
              return;
            }
            if (!manualGpsToggle && !hasConsented) {
              setConsentModalOpen(true);
              return;
            }
            setManualGpsToggle((v) => !v);
          }}
          className="w-full flex items-center justify-between rounded-2xl p-4 active-scale"
          style={{
            background: sharingLocation
              ? 'linear-gradient(135deg,rgba(34,197,94,0.18),rgba(34,197,94,0.08))'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${sharingLocation ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
            opacity: hasInTransitLoads ? 0.9 : 1,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: sharingLocation ? 'rgba(34,197,94,0.2)' : 'rgba(232,96,48,0.12)',
              }}
            >
              <Radio size={18} className={sharingLocation ? 'text-green-400' : 'text-fx-orange'} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-white">
                Share Location {hasInTransitLoads && '🔒'}
              </p>
              <p className="text-[11px] text-fx-text-dim mt-0.5">
                {hasInTransitLoads
                  ? 'GPS auto-enabled for in-transit loads'
                  : sharingLocation
                    ? activeLoads.length > 0
                      ? `Sharing GPS for ${activeLoads.length} load${activeLoads.length > 1 ? 's' : ''}`
                      : 'Sharing live GPS'
                    : 'Tap to share your GPS with carrier'}
              </p>
            </div>
          </div>
          <div
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{ background: sharingLocation ? '#22c55e' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: sharingLocation ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </div>
        </button>

        {/* Stats */}
        <div>
          <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
            My Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Active Loads"
              value={String(
                loads.filter((l) => ['in_transit', 'dispatched', 'awarded'].includes(l.status))
                  .length,
              )}
              trend="flat"
              trendValue="assigned to me"
              icon={<Package size={16} />}
            />
            <StatCard
              label="Avg Transit"
              value="2.1d"
              trend="down"
              trendValue="-0.5d vs last month"
              icon={<Clock size={16} />}
              highlight
            />
            <StatCard
              label="On-Time"
              value="96%"
              trend="up"
              trendValue="Above target"
              icon={<CheckCircle size={16} />}
            />
            <StatCard
              label="Avg Rate"
              value="$2.74"
              trend="down"
              trendValue="-$0.12 vs avg"
              icon={<TrendingDown size={16} />}
            />
          </div>
        </div>

        {/* My Loads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
              My Loads
            </h2>
            <button
              onClick={() => navigate('/driver/loads')}
              className="text-xs font-semibold text-fx-orange hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="bg-fx-surface border border-fx-border rounded-2xl divide-y divide-fx-border">
            {loads.length === 0 ? (
              <div className="p-6 text-center text-sm text-fx-text-muted">
                No loads assigned yet
              </div>
            ) : (
              loads.map((load) => (
                <div
                  key={load.id}
                  className="p-4 flex items-center gap-3 hover:bg-fx-surface-2 transition-colors cursor-pointer"
                  onClick={() => navigate(`/track/${load.loadNumber}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-fx-orange">{load.loadNumber}</span>
                      <Badge variant={statusBadge[load.status] ?? 'gray'} size="sm">
                        {statusLabel[load.status] ?? load.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-fx-text">
                      {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
                    </p>
                    {(load.originAddress || load.destAddress) && (
                      <p className="text-[11px] text-fx-text-dim mt-0.5">
                        {load.originAddress && (
                          <span>
                            {load.originAddress}
                            {load.originZip ? ` ${load.originZip}` : ''}
                          </span>
                        )}
                        {load.originAddress && load.destAddress && ' → '}
                        {load.destAddress && (
                          <span>
                            {load.destAddress}
                            {load.destZip ? ` ${load.destZip}` : ''}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-fx-text-muted mt-0.5">
                      {new Date(load.deliveryDate + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-fx-text-dim">›</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Send GPS',
                icon: '📍',
                action: () => {
                  if (!hasConsented) {
                    setConsentModalOpen(true);
                    return;
                  }
                  setManualGpsToggle(true);
                },
              },
              { label: 'Scan Receipt', icon: '🧾', action: () => navigate('/driver/receipts') },
              { label: 'Tire Log', icon: '🛞', action: () => navigate('/driver/tire-log') },
              { label: 'Messages', icon: '💬', action: () => navigate('/messages') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="bg-fx-surface border border-fx-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-fx-orange/50 hover:bg-fx-surface-2 transition-all duration-200"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-fx-text-muted">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="driver" />

      <NotificationSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />

      <GpsConsentModal
        open={consentModalOpen}
        onAllow={() => {
          grantConsent();
          setConsentModalOpen(false);
          setManualGpsToggle(true);
        }}
        onDismiss={() => setConsentModalOpen(false)}
      />
    </div>
  );
}
