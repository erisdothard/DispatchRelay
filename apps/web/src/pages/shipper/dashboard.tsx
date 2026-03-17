import { useState, useEffect } from 'react';
import { Search, Package, Clock, TrendingDown, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { StatCard } from '@/shared/components/stat-card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getLoads } from '@/services/loads.service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { NotificationSheet } from '@/features/notifications/components/notification-sheet';
import type { Load } from '@freightx/shared';

const statusBadge: Record<string, 'orange' | 'blue' | 'green' | 'gray'> = {
  in_transit: 'orange',
  posted: 'blue',
  delivered: 'green',
};

const statusLabel: Record<string, string> = {
  in_transit: 'In Transit',
  posted: 'Awaiting Pickup',
  delivered: 'Delivered',
};

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    getLoads()
      .then((all) => setLoads(all.slice(0, 5)))
      .catch(console.error);
  }, []);

  const name = profile?.full_name ?? 'Shipper';

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
          <span className="text-sm text-fx-text-dim font-medium">Track by load # or PRO…</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Stats */}
        <div>
          <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
            Shipping Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Active Shipments"
              value={String(loads.filter((l) => l.status === 'in_transit').length || 4)}
              trend="flat"
              trendValue="2 in transit"
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

        {/* My Shipments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
              My Shipments
            </h2>
            <button
              onClick={() => navigate('/shipper/loads')}
              className="text-xs font-semibold text-fx-orange hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="bg-fx-surface border border-fx-border rounded-2xl divide-y divide-fx-border">
            {loads.length === 0 ? (
              <div className="p-6 text-center text-sm text-fx-text-muted">No shipments yet</div>
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
              { label: 'Book Shipment', icon: '📦', action: () => navigate('/shipper/loads') },
              { label: 'Track Load', icon: '📍', action: () => navigate('/track') },
              { label: 'Documents', icon: '📄', action: () => {} },
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

        <Button
          size="lg"
          fullWidth
          className="rounded-2xl font-bold"
          onClick={() => navigate('/shipper/loads')}
        >
          <Package size={18} />
          Book New Shipment
        </Button>
      </div>

      <BottomNav role="shipper" />

      <NotificationSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
