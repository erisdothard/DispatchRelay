import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileRow, CompanyRow, UserRole } from '@/lib/database.types';

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
  signOut: () => Promise<void>;
  createCompany: (data: CompanyInput) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<ProfileRow>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async (profileId: string) => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', profileId)
      .maybeSingle();
    setCompany(data ?? null);
  }, []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data ?? null);
      if (data) await fetchCompany(data.id);
    },
    [fetchCompany],
  );

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth initialization error:', err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, [fetchProfile]);

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCompany(null);
  }, []);

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
        signOut,
        createCompany,
        updateProfile,
        refreshProfile,
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
