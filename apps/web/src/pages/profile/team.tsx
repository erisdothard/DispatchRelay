import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Crown, Shield, Truck, Calculator, Eye, Loader2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
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

const ROLE_META: Record<MemberRole, { label: string; icon: React.ElementType; color: string }> = {
  owner:      { label: 'Owner',      icon: Crown,       color: 'text-yellow-400' },
  admin:      { label: 'Admin',      icon: Shield,      color: 'text-blue-400'   },
  dispatcher: { label: 'Dispatcher', icon: Truck,       color: 'text-fx-orange'  },
  accounting: { label: 'Accounting', icon: Calculator,  color: 'text-green-400'  },
  viewer:     { label: 'Viewer',     icon: Eye,         color: 'text-fx-text-dim'},
};

const INVITE_ROLES: MemberRole[] = ['admin', 'dispatcher', 'accounting', 'viewer'];

export default function TeamPage() {
  const navigate = useNavigate();
  const { profile, company } = useAuth();
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

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      getCompanyMembers(companyId),
      getCompanyInvites(companyId),
    ]).then(([m, i]) => {
      setMembers(m);
      setInvites(i);
      setLoading(false);
    });
  }, [companyId]);

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
      // Refresh invites
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
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
  }

  async function handleRevokeInvite(inviteId: string) {
    await revokeInvite(inviteId);
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={24} className="text-fx-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="Team" showBack backAction={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="text-center">
          <Users size={32} className="text-fx-orange mx-auto mb-2" />
          <h1 className="text-xl font-bold text-fx-text">{company?.name ?? 'Your Company'}</h1>
          <p className="text-sm text-fx-text-muted">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Invite Form */}
        {canManage && (
          <div className="bg-fx-surface border border-fx-border rounded-2xl p-4">
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">Invite Team Member</p>
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
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
          <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">Members</p>
          <div className="space-y-2">
            {members.map((member) => {
              const meta = ROLE_META[member.role];
              const Icon = meta.icon;
              const isMe = member.user_id === profile?.id;
              const isOwner = member.role === 'owner';
              return (
                <div key={member.id} className="bg-fx-surface border border-fx-border rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fx-text truncate">
                      {member.full_name ?? member.email ?? 'Unknown'}
                      {isMe && <span className="ml-1.5 text-[10px] text-fx-text-dim">(you)</span>}
                    </p>
                    <p className="text-[11px] text-fx-text-dim">{member.email ?? ''}</p>
                  </div>
                  {canManage && !isOwner && !isMe ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                        className="h-8 bg-fx-surface-2 border border-fx-border rounded-lg text-fx-text text-xs px-2 focus:border-fx-orange outline-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        {INVITE_ROLES.map((r) => (
                          <option key={r} value={r} style={{ background: '#141414' }}>{ROLE_META[r].label}</option>
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
                    <span className={`text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">Pending Invites</p>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="bg-fx-surface border border-fx-border rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fx-surface-2 border border-fx-border flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-fx-text-dim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fx-text truncate">{invite.email}</p>
                    <p className="text-[11px] text-fx-text-dim">
                      {ROLE_META[invite.role].label} · Expires {new Date(invite.expires_at).toLocaleDateString()}
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
      </div>

      <BottomNav role={profile?.role ?? 'carrier'} />
    </div>
  );
}
