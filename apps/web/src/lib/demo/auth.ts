/**
 * Demo stand-in for Supabase Auth. The signed-in user is whichever persona was picked
 * on the login screen; credential-based flows return a friendly error instead.
 */
import { currentDemoIdentity } from './demo-session';

const SESSION_TTL_SECONDS = 3600;
const DEMO_AUTH_MESSAGE =
  'Sign-in is turned off in this demo. Pick a role on the login screen to explore FreightX.';

function authError() {
  return { name: 'AuthApiError', message: DEMO_AUTH_MESSAGE, status: 400 };
}

function demoUser() {
  const identity = currentDemoIdentity();
  if (!identity) return null;
  return {
    id: identity.id,
    email: identity.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: identity.fullName, role: identity.role },
    created_at: new Date(0).toISOString(),
  };
}

function demoSession() {
  const user = demoUser();
  if (!user) return null;
  return {
    access_token: 'demo',
    refresh_token: 'demo',
    token_type: 'bearer',
    expires_in: SESSION_TTL_SECONDS,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    user,
  };
}

export function createDemoAuth() {
  return {
    async getSession() {
      return { data: { session: demoSession() }, error: null };
    },
    async getUser() {
      const user = demoUser();
      return {
        data: { user },
        error: user
          ? null
          : { name: 'AuthSessionMissingError', message: 'Auth session missing!', status: 400 },
      };
    },
    async refreshSession() {
      const session = demoSession();
      return { data: { session, user: session?.user ?? null }, error: null };
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: { id: 'demo', callback: () => undefined, unsubscribe: () => undefined },
        },
      };
    },
    async updateUser() {
      return { data: { user: demoUser() }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithPassword() {
      return { data: { user: null, session: null }, error: authError() };
    },
    async signInWithOtp() {
      return { data: { user: null, session: null }, error: authError() };
    },
    async signInWithOAuth() {
      return { data: { provider: 'google', url: null }, error: authError() };
    },
    async signUp() {
      return { data: { user: null, session: null }, error: authError() };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: authError() };
    },
    async exchangeCodeForSession() {
      return { data: { user: null, session: null }, error: authError() };
    },
    async verifyOtp() {
      return { data: { user: null, session: null }, error: authError() };
    },
  };
}
