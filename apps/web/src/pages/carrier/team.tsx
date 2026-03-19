import { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Navigation,
  Radio,
  Loader2,
  Truck,
} from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { BottomSheet } from '@/shared/components/bottom-sheet';
import { Badge } from '@/shared/components/ui/badge';
import { MapView } from '@/shared/components/map-view';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getMyActiveLoads, getCompanyDrivers } from '@/services/loads.service';
import { useLiveTracking } from '@/features/loads/hooks/use-live-tracking';
import type { Load } from '@freightx/shared';

/* ── Types ─────────────────────────────────────────────────────── */

interface DriverProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/* ── Driver cards — powered by company_members + loads ── */

function DriverCard({
  driver,
  loads,
  onTap,
}: {
  driver: DriverProfile;
  loads: Load[];
  onTap: () => void;
}) {
  const driverLoads = loads.filter((l) => l.assignedDriverId === driver.id);
  const activeLoad = driverLoads.find((l) => l.status === 'in_transit');
  const name = driver.full_name ?? driver.email ?? 'Unknown';

  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-fx-surface border border-fx-border rounded-2xl p-4 transition-colors active:bg-fx-surface-2"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-extrabold text-fx-orange">
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-fx-text truncate">{name}</p>
          <p className="text-[11px] text-fx-text-dim">
            {driverLoads.length} load{driverLoads.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <Badge variant={activeLoad ? 'orange' : 'green'}>
          {activeLoad ? 'In Transit' : 'Available'}
        </Badge>
      </div>
      {activeLoad && <ActiveLoadRow load={activeLoad} />}
    </button>
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

/* ── Driver detail bottom sheet ────────────────────────────────── */

function DriverDetailSheet({
  driver,
  loads,
  open,
  onClose,
}: {
  driver: DriverProfile | null;
  loads: Load[];
  open: boolean;
  onClose: () => void;
}) {
  if (!driver) return null;

  const name = driver.full_name ?? driver.email ?? 'Unknown';
  const driverLoads = loads.filter((l) => l.assignedDriverId === driver.id);
  const activeLoad = driverLoads.find((l) => l.status === 'in_transit');

  return (
    <BottomSheet open={open} onClose={onClose} title="Driver Details">
      <div className="space-y-4 pb-4">
        {/* Driver info header */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-extrabold text-fx-orange">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-fx-text">{name}</p>
            {driver.email && (
              <p className="text-xs text-fx-text-dim">{driver.email}</p>
            )}
          </div>
          <Badge variant={activeLoad ? 'orange' : 'green'}>
            {activeLoad ? 'In Transit' : 'Available'}
          </Badge>
        </div>

        {/* Live GPS map for active load */}
        {activeLoad && <DriverGpsMap load={activeLoad} />}

        {/* Assigned loads */}
        {driverLoads.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-2">
              Assigned Loads ({driverLoads.length})
            </p>
            <div className="space-y-2">
              {driverLoads.map((load) => (
                <ActiveLoadRow key={load.id} load={load} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Truck size={28} className="text-fx-text-dim mx-auto mb-2" />
            <p className="text-sm text-fx-text-muted">No loads assigned</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function DriverGpsMap({ load }: { load: Load }) {
  const ping = useLiveTracking(load.loadNumber);
  const speedMph = ping?.speed_ms != null ? Math.round(ping.speed_ms * 2.237) : null;
  const lastPing = ping?.recorded_at
    ? new Date(ping.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;
  const livePos: [number, number] | undefined =
    ping ? [ping.latitude, ping.longitude] : undefined;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest">
        Live Location — {load.loadNumber}
      </p>
      <MapView
        origin={{ city: load.originCity ?? '', state: load.originState ?? '' }}
        destination={{ city: load.destCity ?? '', state: load.destState ?? '' }}
        inTransit
        livePosition={livePos}
        heading={ping?.heading_deg}
        className="h-52 rounded-2xl"
      />
      {ping && (
        <div className="flex items-center gap-4 text-xs text-fx-text-dim">
          {speedMph != null && (
            <span className="flex items-center gap-1">
              <Navigation size={12} className="text-fx-orange" />
              {speedMph} mph
            </span>
          )}
          {lastPing && <span>Last ping: {lastPing}</span>}
          <span className="ml-auto text-green-400 flex items-center gap-1">
            <Radio size={12} /> Live
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main page — operational only ──────────────────────────────── */

export default function CarrierTeamPage() {
  const { company, user } = useAuth();

  const [loads, setLoads] = useState<Load[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const companyId = company?.id;
  const inTransitCount = loads.filter((l) => l.status === 'in_transit').length;

  useEffect(() => {
    if (!companyId || !user?.id) {
      setLoading(false);
      return;
    }

    // Fetch loads and drivers independently so one failure doesn't kill the other
    const loadsPromise = getMyActiveLoads(user.id).catch((err) => {
      console.error('Failed to load active loads:', err);
      return [] as Load[];
    });

    const driversPromise = getCompanyDrivers(companyId).catch((err) => {
      console.error('Failed to load company drivers:', err);
      return [] as Array<{ id: string; fullName: string; email: string }>;
    });

    Promise.all([loadsPromise, driversPromise])
      .then(async ([l, companyDrivers]) => {
        setLoads(l);

        // Source 1: Drivers from company_members (profile role = 'driver')
        const driverMap = new Map<string, DriverProfile>();
        for (const d of companyDrivers) {
          driverMap.set(d.id, {
            id: d.id,
            full_name: d.fullName,
            email: d.email,
            avatar_url: null,
          });
        }

        // Source 2: Drivers from load assignments (assigned_driver_id)
        const assignedIds = [
          ...new Set(l.map((load) => load.assignedDriverId).filter(Boolean) as string[]),
        ].filter((id) => !driverMap.has(id));

        if (assignedIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', assignedIds);
          for (const p of (profiles as DriverProfile[]) ?? []) {
            driverMap.set(p.id, p);
          }
        }

        setDriverProfiles([...driverMap.values()]);
      })
      .catch((err) => console.error('Failed to load team:', err))
      .finally(() => setLoading(false));
  }, [companyId, user?.id]);

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="Team" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-fx-orange animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-fx-surface border border-fx-border rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-fx-orange">{driverProfiles.length}</p>
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

            {/* Unassigned load banner */}
            {loads.filter((l) => l.status === 'in_transit' && !l.assignedDriverId).length > 0 && (
              <div className="bg-fx-orange/10 border border-fx-orange/20 rounded-2xl p-3 flex items-center gap-3">
                <Truck size={18} className="text-fx-orange shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-fx-orange">
                    {loads.filter((l) => l.status === 'in_transit' && !l.assignedDriverId).length} load(s) in transit without a driver assigned
                  </p>
                  <p className="text-[11px] text-fx-text-dim mt-0.5">
                    Assign a driver from load details to enable GPS tracking
                  </p>
                </div>
              </div>
            )}

            {/* Driver cards */}
            {driverProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={40} className="text-fx-text-dim mb-3" />
                <p className="font-bold text-fx-text">No drivers on your team</p>
                <p className="text-sm text-fx-text-muted mt-1">
                  Invite drivers from Profile → Team Members
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {driverProfiles.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    loads={loads}
                    onTap={() => setSelectedDriver(driver)}
                  />
                ))}
              </div>
            )}

            <DriverDetailSheet
              driver={selectedDriver}
              loads={loads}
              open={!!selectedDriver}
              onClose={() => setSelectedDriver(null)}
            />
          </>
        )}
      </div>

      <BottomNav role="carrier" />
    </div>
  );
}
