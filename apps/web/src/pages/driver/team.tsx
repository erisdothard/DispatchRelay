import { useState, useEffect } from 'react';
import {
  Users,
  Loader2,
  Crown,
  Shield,
  Truck,
  Calculator,
  Eye,
} from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCompanyMembers,
  type CompanyMember,
  type MemberRole,
} from '@/services/company-members.service';

const ROLE_META: Record<MemberRole, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-400' },
  admin: { label: 'Admin', icon: Shield, color: 'text-blue-400' },
  dispatcher: { label: 'Dispatcher', icon: Truck, color: 'text-fx-orange' },
  accounting: { label: 'Accounting', icon: Calculator, color: 'text-green-400' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-fx-text-dim' },
};

export default function DriverTeamPage() {
  const { profile, company } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = company?.id;

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    getCompanyMembers(companyId)
      .then(setMembers)
      .catch((err) => console.error('Failed to load team:', err))
      .finally(() => setLoading(false));
  }, [companyId]);

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="My Team" showBack />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-fx-orange animate-spin" />
          </div>
        ) : (
          <>
            {/* Company header */}
            <div className="text-center">
              <Users size={32} className="text-fx-orange mx-auto mb-2" />
              <h1 className="text-xl font-bold text-fx-text">{company?.name ?? 'Your Company'}</h1>
              <p className="text-sm text-fx-text-muted">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Members List */}
            <div>
              <p className="text-[10px] font-bold text-fx-text-muted uppercase tracking-widest mb-3">
                Team Members
              </p>
              <div className="space-y-2">
                {members.map((member) => {
                  const meta = ROLE_META[member.role];
                  const Icon = meta?.icon ?? Eye;
                  const isMe = member.user_id === profile?.id;
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
                      <span
                        className={`text-[11px] font-bold ${meta?.color ?? 'text-fx-text-dim'}`}
                      >
                        {meta?.label ?? member.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {members.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={40} className="text-fx-text-dim mb-3" />
                <p className="font-bold text-fx-text">No team members found</p>
                <p className="text-sm text-fx-text-muted mt-1">
                  Ask your carrier to add you to their team
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav role="driver" />
    </div>
  );
}
