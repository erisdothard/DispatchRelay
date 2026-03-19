import { useState, useEffect } from 'react';
import { Users, MapPin, Package, Phone, Navigation, Radio, Loader2 } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyMembers, type CompanyMember } from '@/services/company-members.service';
import { getMyActiveLoads } from '@/services/loads.service';
import { useLiveTracking } from '@/features/loads/hooks/use-live-tracking';
import type { Load } from '@freightx/shared';

function DriverCard({ member, loads }: { member: CompanyMember; loads: Load[] }) {
  const driverLoads = loads.filter((l) => l.assignedDriverId === member.user_id);
  const activeLoad = driverLoads.find((l) => l.status === 'in_transit');

  return (
    <div className="bg-fx-surface border border-fx-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-extrabold text-fx-orange">
            {(member.full_name ?? 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-fx-text truncate">
            {member.full_name ?? member.email ?? 'Unknown'}
          </p>
          <p className="text-[11px] text-fx-text-dim">{member.role}</p>
        </div>
        <Badge variant={activeLoad ? 'orange' : 'green'}>
          {activeLoad ? 'In Transit' : 'Available'}
        </Badge>
      </div>

      {activeLoad && <ActiveLoadRow load={activeLoad} />}

      {!activeLoad && driverLoads.length > 0 && (
        <p className="text-xs text-fx-text-muted">
          {driverLoads.length} load{driverLoads.length !== 1 ? 's' : ''} assigned
        </p>
      )}
    </div>
  );
}

function ActiveLoadRow({ load }: { load: Load }) {
  const ping = useLiveTracking(load.loadNumber);
  const speedMph = ping?.speed_ms != null ? Math.round(ping.speed_ms * 2.237) : null;
  const lastPing = ping?.recorded_at
    ? new Date(ping.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-fx-surface-2 border border-fx-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-fx-orange">{load.loadNumber}</span>
        {ping ? (
          <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live GPS
          </span>
        ) : (
          <span className="text-[10px] text-fx-text-dim flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-fx-text-dim rounded-full" />
            No GPS
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-fx-orange shrink-0" />
        <p className="text-xs text-fx-text-muted truncate">
          {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
        </p>
      </div>
      {ping && (
        <div className="flex items-center gap-3 text-[11px] text-fx-text-dim">
          {speedMph != null && (
            <span className="flex items-center gap-1">
              <Navigation size={10} className="text-fx-orange" />
              {speedMph} mph
            </span>
          )}
          {lastPing && <span>Last: {lastPing}</span>}
          <span className="ml-auto text-green-400 flex items-center gap-1">
            <Radio size={10} /> Tracking
          </span>
        </div>
      )}
    </div>
  );
}

export default function CarrierTeamPage() {
  const { company, user } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id || !user?.id) {
      setLoading(false);
      return;
    }

    Promise.all([
      getCompanyMembers(company.id),
      getMyActiveLoads(user.id),
    ])
      .then(([m, l]) => {
        setMembers(m);
        setLoads(l);
      })
      .catch((err) => console.error('Failed to load team:', err))
      .finally(() => setLoading(false));
  }, [company?.id, user?.id]);

  const drivers = members.filter((m) => m.role !== 'owner');
  const inTransitCount = loads.filter((l) => l.status === 'in_transit' && l.assignedDriverId).length;

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="My Team" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Summary */}
        <div className="bg-fx-surface border border-fx-border rounded-2xl p-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-fx-orange">{drivers.length}</p>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mt-0.5">
              Drivers
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-fx-orange">{inTransitCount}</p>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mt-0.5">
              In Transit
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-fx-orange animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-fx-text-dim mb-3" />
            <p className="font-bold text-fx-text">No team members yet</p>
            <p className="text-sm text-fx-text-muted mt-1">
              Invite drivers from Profile → Team Members
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest">
              Drivers
            </p>
            {drivers.map((member) => (
              <DriverCard key={member.id} member={member} loads={loads} />
            ))}
          </div>
        )}
      </div>

      <BottomNav role="carrier" />
    </div>
  );
}
