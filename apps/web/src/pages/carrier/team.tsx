import { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Navigation,
  Radio,
  Loader2,
  Plus,
  Trash2,
  Crown,
  Shield,
  Truck,
  Calculator,
  Eye,
  Mail,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getCompanyMembers,
  getCompanyInvites,
  inviteMember,
  removeMember,
  updateMemberRole,
  revokeInvite,
  type CompanyMember,
  type CompanyInvite,
  type MemberRole,
} from '@/services/company-members.service';
import { getMyActiveLoads } from '@/services/loads.service';
import { useLiveTracking } from '@/features/loads/hooks/use-live-tracking';
import type { Load } from '@freightx/shared';

/* ── Types ─────────────────────────────────────────────────────── */

interface DriverProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/* ── Constants ─────────────────────────────────────────────────── */

const ROLE_META: Record<MemberRole, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-400' },
  admin: { label: 'Admin', icon: Shield, color: 'text-blue-400' },
  dispatcher: { label: 'Dispatcher', icon: Truck, color: 'text-fx-orange' },
  accounting: { label: 'Accounting', icon: Calculator, color: 'text-green-400' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-fx-text-dim' },
};

const INVITE_ROLES: MemberRole[] = ['admin', 'dispatcher', 'accounting', 'viewer'];

type Tab = 'drivers' | 'manage';

/* ── Driver cards (Drivers tab) — powered by loads, not company_members ── */

function DriverCard({ driver, loads }: { driver: DriverProfile; loads: Load[] }) {
  const driverLoads = loads.filter((l) => l.assignedDriverId === driver.id);
  const activeLoad = driverLoads.find((l) => l.status === 'in_transit');
  const name = driver.full_name ?? driver.email ?? 'Unknown';

  return (
    <div className="bg-fx-surface border border-fx-border rounded-2xl p-4">
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

/* ── Main page ─────────────────────────────────────────────────── */

export default function CarrierTeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'manage' ? 'manage' : 'drivers';
  const [tab, setTab] = useState<Tab>(initialTab);

  const { profile, company, user } = useAuth();

  // Drivers tab state — from loads
  const [loads, setLoads] = useState<Load[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);

  // Manage tab state — from company_members
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invites, setInvites] = useState<CompanyInvite[]>([]);

  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('dispatcher');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const companyId = company?.id;
  const myRole = members.find((m) => m.user_id === profile?.id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';
  const inTransitCount = loads.filter(
    (l) => l.status === 'in_transit' && l.assignedDriverId,
  ).length;

  useEffect(() => {
    if (!companyId || !user?.id) {
      setLoading(false);
      return;
    }

    Promise.all([
      getMyActiveLoads(user.id),
      getCompanyMembers(companyId),
      getCompanyInvites(companyId),
    ])
      .then(async ([l, m, i]) => {
        setLoads(l);
        setMembers(m);
        setInvites(i);

        // Get unique driver IDs from loads
        const driverIds = [
          ...new Set(l.map((load) => load.assignedDriverId).filter(Boolean) as string[]),
        ];

        if (driverIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', driverIds);
          setDriverProfiles((profiles as DriverProfile[]) ?? []);
        }
      })
      .catch((err) => console.error('Failed to load team:', err))
      .finally(() => setLoading(false));
  }, [companyId, user?.id]);

  function switchTab(t: Tab) {
    setTab(t);
    setSearchParams(t === 'manage' ? { tab: 'manage' } : {}, { replace: true });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await inviteMember({ companyId, email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      const updated = await getCompanyInvites(companyId);
      setInvites(updated);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    await removeMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function handleRoleChange(memberId: string, role: MemberRole) {
    await updateMemberRole(memberId, role);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }

  async function handleRevokeInvite(inviteId: string) {
    await revokeInvite(inviteId);
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="My Team" />

      {/* Tab bar */}
      <div className="px-5 pt-2 pb-1">
        <div className="flex bg-fx-surface border border-fx-border rounded-xl p-1">
          {(['drivers', 'manage'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-fx-orange text-white' : 'text-fx-text-muted hover:text-fx-text'
              }`}
            >
              {t === 'drivers' ? 'Drivers' : 'Manage'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-fx-orange animate-spin" />
          </div>
        ) : tab === 'drivers' ? (
          /* ── Drivers tab — real drivers from loads ──── */
          <>
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

            {driverProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={40} className="text-fx-text-dim mb-3" />
                <p className="font-bold text-fx-text">No drivers assigned yet</p>
                <p className="text-sm text-fx-text-muted mt-1">
                  Assign a driver to a load to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {driverProfiles.map((driver) => (
                  <DriverCard key={driver.id} driver={driver} loads={loads} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Manage tab ───────────────────────────────── */
          <>
            <div className="text-center">
              <Users size={32} className="text-fx-orange mx-auto mb-2" />
              <h1 className="text-xl font-bold text-fx-text">{company?.name ?? 'Your Company'}</h1>
              <p className="text-sm text-fx-text-muted">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Invite Form */}
            {canManage && (
              <div className="bg-fx-surface border border-fx-border rounded-2xl p-4">
                <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                  Invite Team Member
                </p>
                <form onSubmit={handleInvite} className="space-y-3">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full h-10 bg-fx-surface-2 border border-fx-border rounded-xl text-fx-text text-sm px-3 focus:border-fx-orange outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                      className="flex-1 h-10 bg-fx-surface-2 border border-fx-border rounded-xl text-fx-text text-sm px-3 focus:border-fx-orange outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      {INVITE_ROLES.map((r) => (
                        <option key={r} value={r} style={{ background: '#141414' }}>
                          {ROLE_META[r].label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-4 h-10 rounded-xl text-sm font-bold bg-fx-orange text-white disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {inviting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Invite
                    </button>
                  </div>
                  {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
                  {inviteSuccess && <p className="text-xs text-green-400">{inviteSuccess}</p>}
                </form>
              </div>
            )}

            {/* Members List */}
            <div>
              <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                Members
              </p>
              <div className="space-y-2">
                {members.map((member) => {
                  const meta = ROLE_META[member.role];
                  const Icon = meta?.icon ?? Eye;
                  const isMe = member.user_id === profile?.id;
                  const isOwner = member.role === 'owner';
                  return (
                    <div
                      key={member.id}
                      className="bg-fx-surface border border-fx-border rounded-2xl p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
                        <Icon size={16} className={meta?.color ?? 'text-fx-text-dim'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-fx-text truncate">
                          {member.full_name ?? member.email ?? 'Unknown'}
                          {isMe && (
                            <span className="ml-1.5 text-[10px] text-fx-text-dim">(you)</span>
                          )}
                        </p>
                        <p className="text-[11px] text-fx-text-dim">{member.email ?? ''}</p>
                      </div>
                      {canManage && !isOwner && !isMe ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as MemberRole)
                            }
                            className="h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-xs px-2 focus:border-fx-orange outline-none"
                            style={{ colorScheme: 'dark' }}
                          >
                            {INVITE_ROLES.map((r) => (
                              <option key={r} value={r} style={{ background: '#141414' }}>
                                {ROLE_META[r].label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[11px] font-bold ${meta?.color ?? 'text-fx-text-dim'}`}
                        >
                          {meta?.label ?? member.role}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                  Pending Invites
                </p>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-fx-surface border border-fx-border rounded-2xl p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
                        <Mail size={16} className="text-fx-text-dim" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-fx-text truncate">
                          {invite.email}
                        </p>
                        <p className="text-[11px] text-fx-text-dim">
                          {ROLE_META[invite.role]?.label ?? invite.role} · Expires{' '}
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav role="carrier" />
    </div>
  );
}
