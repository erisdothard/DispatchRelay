import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileRow, CompanyRow, UserRole } from '@/lib/database.types';
import { IS_DEMO_ENV } from '@/lib/demo/demo-env';
import { demoIdentityFor } from '@/lib/demo/identities';
import {
  endDemoSession,
  isDemoActive,
  persistedDemoRole,
  startDemoSession,
} from '@/lib/demo/demo-session';

interface AuthState {
  user: User | null;
  profile: ProfileRow | null;
  company: CompanyRow | null;
  session: Session | null;
  loading: boolean;
}

interface CompanyInput {
  name: string;
  mc_number?: string;
  dot_number?: string;
  broker_authority?: string;
  phone?: string;
  email?: string;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: (role?: UserRole, inviteToken?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createCompany: (data: CompanyInput) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<ProfileRow>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  /** Demo mode — bypass auth with a mock profile for the given role */
  enterDemoMode: (role: UserRole) => void;
  isDemo: boolean;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchCompany = useCallback(async (profileId: string, role?: string) => {
    // 1. For non-drivers, check owned company first
    if (role !== 'driver') {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', profileId)
        .maybeSingle();
      if (data) {
        setCompany(data);
        return;
      }
    }

    // 2. Fallback: find company via company_members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('company_members')
      .select('company_id')
      .eq('user_id', profileId)
      .limit(1)
      .maybeSingle();
    if (membership) {
      const { data: co } = await supabase
        .from('companies')
        .select('*')
        .eq('id', membership.company_id)
        .single();
      setCompany(co ?? null);
      return;
    }

    // 3. Last resort for drivers: check owned company
    if (role === 'driver') {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', profileId)
        .maybeSingle();
      setCompany(data ?? null);
      return;
    }

    setCompany(null);
  }, []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data ?? null);
      if (data) await fetchCompany(data.id, data.role);
    },
    [fetchCompany],
  );

  /**
   * Demo mode — sign in as a seeded persona. Profile and company load through the
   * demo backend exactly like a real sign-in, so every screen sees consistent data.
   */
  const enterDemoMode = useCallback(
    (role: UserRole) => {
      const identity = demoIdentityFor(role);
      startDemoSession(identity);
      setIsDemo(true);
      setUser({ id: identity.id, email: identity.email } as User);
      setSession({ access_token: 'demo' } as Session);
      setLoading(true);
      fetchProfile(identity.id).finally(() => setLoading(false));
    },
    [fetchProfile],
  );

  useEffect(() => {
    // Resume a demo walkthrough after a refresh; demo builds never touch real auth.
    const demoRole = persistedDemoRole();
    if (demoRole) {
      enterDemoMode(demoRole);
      return;
    }
    if (IS_DEMO_ENV) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        // A demo session may have started while this was in flight (e.g. landing
        // straight on /demo) — applying a null real session here would wipe it.
        if (isDemoActive()) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isDemoActive()) return;
        console.error('Auth initialization error:', err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isDemoActive()) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setCompany(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, enterDemoMode]);

  /** Sign in with email + password */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  /**
   * Sign up — passes full_name + role as metadata so the DB trigger
   * creates the profile row automatically. No manual insert needed.
   */
  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: UserRole) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  /**
   * Sign in with Google OAuth. Persists role + invite token to localStorage
   * before the redirect so auth-callback.tsx can pick them up.
   */
  const signInWithGoogle = useCallback(async (role?: UserRole, inviteToken?: string) => {
    if (role) localStorage.setItem('fx_oauth_role', role);
    else localStorage.removeItem('fx_oauth_role');
    if (inviteToken) localStorage.setItem('fx_oauth_invite_token', inviteToken);
    else localStorage.removeItem('fx_oauth_invite_token');

    const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemo) endDemoSession();
    else await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setIsDemo(false);
  }, [isDemo]);

  /**
   * Create the company for the current user (called in onboarding Step 3).
   * Also marks profile.onboarding_complete = true.
   */
  const createCompany = useCallback(
    async (data: CompanyInput) => {
      if (!user || !profile) return { error: 'Not authenticated' };

      const { error: companyErr } = await supabase.from('companies').insert({
        owner_id: user.id,
        type: profile.role === 'admin' || profile.role === 'driver' ? 'carrier' : profile.role,
        name: data.name,
        mc_number: data.mc_number ?? null,
        dot_number: data.dot_number ?? null,
        broker_authority: data.broker_authority ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
      });
      if (companyErr) return { error: companyErr.message };

      // Mark onboarding complete
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);

      // Refresh local state
      await fetchProfile(user.id);
      return { error: null };
    },
    [user, profile, fetchProfile],
  );

  const updateProfile = useCallback(
    async (data: Partial<ProfileRow>) => {
      if (!user) return { error: 'Not authenticated' };
      const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
      if (!error) await fetchProfile(user.id);
      return { error: error?.message ?? null };
    },
    [user, fetchProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        company,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        createCompany,
        updateProfile,
        refreshProfile,
        enterDemoMode,
        isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
