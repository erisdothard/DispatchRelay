import { useParams } from 'react-router-dom';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { TrustProfileCard } from '@/features/ratings/components/trust-profile-card';
import { useTrustProfile } from '@/features/ratings/hooks/use-trust-profile';
import { useAuth } from '@/contexts/AuthContext';
import { getNavRole } from '@/shared/lib/utils';

export default function TrustProfilePage() {
  const { companyId } = useParams<{ companyId?: string }>();
  const { profile: userProfile, company } = useAuth();
  const role = getNavRole(userProfile?.role);

  const targetId = companyId ?? company?.id;
  const { profile, loading, error } = useTrustProfile(targetId);

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader title="Trust Profile" showBack />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-fx-orange/30 border-t-fx-orange rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && !profile && (
          <div className="text-center py-20">
            <p className="text-fx-text-muted text-sm">No trust profile found.</p>
            <p className="text-fx-text-dim text-xs mt-1">
              Reviews will appear here after completed loads.
            </p>
          </div>
        )}

        {profile && <TrustProfileCard profile={profile} />}
      </div>

      <BottomNav role={role} />
    </div>
  );
}
