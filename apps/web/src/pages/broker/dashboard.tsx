import { useState, useEffect } from 'react';
import { Search, TrendingUp, Package, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { StatCard } from '@/shared/components/stat-card';
import { LoadCard } from '@/features/loads/components/load-card';
import { useAuth } from '@/contexts/AuthContext';
import { getLoads } from '@/services/loads.service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { NotificationSheet } from '@/features/notifications/components/notification-sheet';
import { CarrierRelationshipsSheet } from '@/features/carriers/components/carrier-relationships-sheet';
import type { Load } from '@freightx/shared';

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [carrierNetworkOpen, setCarrierNetworkOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    getLoads().then(setLoads).catch(console.error);
  }, [user]);

  const name = profile?.full_name ?? 'Broker';

  // Real stats derived from loaded data
  const activeLoads = loads.filter(
    (l) => l.status !== 'delivered' && l.status !== 'cancelled' && l.status !== 'expired',
  ).length;
  const totalRevenue = loads.reduce((sum, l) => sum + l.rateUsd, 0);
  const revenueLabel =
    totalRevenue >= 1000 ? `$${(totalRevenue / 1000).toFixed(1)}k` : `$${totalRevenue}`;
  const recentLoads = loads.slice(0, 3);

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
          onClick={() => navigate('/broker/loads')}
          className="w-full h-12 bg-fx-surface border border-fx-border rounded-2xl flex items-center gap-3 px-4 hover:border-fx-orange/50 transition-all duration-200"
        >
          <Search size={16} className="text-fx-orange" />
          <span className="text-sm text-fx-text-dim font-medium">
            Search loads, carriers, lanes…
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Stats */}
        <div>
          <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Active Loads"
              value={String(activeLoads || '—')}
              trend="up"
              trendValue="from load board"
              icon={<Package size={16} />}
            />
            <StatCard
              label="Total Revenue"
              value={revenueLabel || '—'}
              trend="up"
              trendValue="all loaded loads"
              icon={<DollarSign size={16} />}
              highlight
            />
            <StatCard
              label="Avg Transit"
              value="1.8d"
              trend="down"
              trendValue="-0.3d improved"
              icon={<Clock size={16} />}
            />
            <StatCard
              label="On-Time Rate"
              value="94%"
              trend="up"
              trendValue="Industry avg 89%"
              icon={<TrendingUp size={16} />}
            />
          </div>
        </div>

        {/* My loads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-fx-text-muted uppercase tracking-widest">
              Recent Loads
            </h2>
            <button
              onClick={() => navigate('/broker/loads')}
              className="text-xs font-semibold text-fx-orange hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentLoads.length === 0 ? (
              <div className="bg-fx-surface border border-fx-border rounded-2xl p-6 text-center text-sm text-fx-text-muted">
                No loads posted yet
              </div>
            ) : (
              recentLoads.map((load) => (
                <LoadCard key={load.id} load={load} showBidButton={false} />
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
              { label: 'Post a Load', icon: '📦', action: () => navigate('/broker/loads') },
              { label: 'Find Carriers', icon: '🔍', action: () => navigate('/broker/loads') },
              { label: 'Messages', icon: '💬', action: () => navigate('/messages') },
              { label: 'Analytics', icon: '📊', action: () => {} },
              { label: 'Carrier Network', icon: '🤝', action: () => setCarrierNetworkOpen(true) },
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

      <BottomNav role="broker" />

      <NotificationSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />

      <CarrierRelationshipsSheet
        open={carrierNetworkOpen}
        onClose={() => setCarrierNetworkOpen(false)}
      />
    </div>
  );
}
