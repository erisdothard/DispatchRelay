import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Truck,
  Briefcase,
  Package,
  UserCircle,
  KeyRound,
} from 'lucide-react';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/database.types';
import { IS_DEMO_ENV } from '@/lib/demo/demo-env';
import { DEMO_LOGIN_ROLES, DEMO_PASSWORD } from '@/lib/demo/credentials';
import { DEMO_IDENTITIES } from '@/lib/demo/identities';

const ROLE_ROUTES: Record<string, string> = {
  carrier: '/carrier',
  broker: '/broker',
  shipper: '/shipper',
  driver: '/driver',
  admin: '/admin',
};

const ROLE_CARDS = [
  {
    role: 'carrier' as UserRole,
    label: 'Carrier',
    blurb: 'Bid on loads, dispatch drivers, run your fleet',
    icon: <Truck size={20} />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    role: 'broker' as UserRole,
    label: 'Broker',
    blurb: 'Post loads, compare bids, track shipments',
    icon: <Briefcase size={20} />,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    role: 'shipper' as UserRole,
    label: 'Shipper',
    blurb: 'Ship freight, schedule docks, confirm delivery',
    icon: <Package size={20} />,
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  {
    role: 'driver' as UserRole,
    label: 'Driver',
    blurb: 'Run loads, sign BOLs, log your hours',
    icon: <UserCircle size={20} />,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingProfile, setAwaitingProfile] = useState(false);

  const navigate = useNavigate();
  const { signIn, signInWithGoogle, profile, enterDemoMode } = useAuth();

  // Once profile loads after sign-in, navigate to the correct dashboard
  useEffect(() => {
    if (awaitingProfile && profile) {
      setAwaitingProfile(false);
      navigate(ROLE_ROUTES[profile.role] ?? '/carrier', { replace: true });
    }
  }, [awaitingProfile, profile, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setAwaitingProfile(true);
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  const inputClass =
    'w-full h-12 bg-fx-surface rounded-ios-xs px-4 text-[14px] text-white placeholder:text-fx-text-dim focus:ring-1 focus:ring-fx-orange/50 outline-none transition-all card-highlight';

  return (
    <div
      className="min-h-dvh flex flex-col px-6 pb-10"
      data-demo-build={IS_DEMO_ENV ? '' : undefined}
    >
      <IOSStatusBar />

      {/* Logo */}
      <div className="flex flex-col items-center pt-10 pb-10">
        <img src="/logo-user-1.svg" alt="DispatchRelay" className="h-10 mb-2" />
        <p className="text-[14px] text-fx-text-dim mt-1 text-center">
          {IS_DEMO_ENV
            ? 'Sign in with a demo account, or jump straight in as a role.'
            : "Welcome back. Let's move freight."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSignIn}
        className={`flex flex-col gap-3 ${IS_DEMO_ENV ? 'mb-4' : 'mb-8'}`}
      >
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} pl-10`}
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pl-10 pr-11`}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {!IS_DEMO_ENV && (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[13px] text-fx-orange font-semibold"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="text-[13px] text-red-400 bg-red-500/10 rounded-ios-xs px-4 py-3"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-ios-xs flex items-center justify-center gap-2 text-[15px] font-semibold text-white active-scale disabled:opacity-60 mt-1 bg-orange-gradient"
          style={{ boxShadow: '0 4px 20px rgba(232,96,48,0.4)' }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      {IS_DEMO_ENV ? (
        /* Demo accounts — tap one to fill the form */
        <section
          aria-labelledby="demo-accounts-heading"
          className="mb-8 rounded-xl border border-fx-border bg-fx-surface/60 p-3"
        >
          <div className="flex items-center justify-between gap-3 px-1 mb-2">
            <p
              id="demo-accounts-heading"
              className="text-xs uppercase tracking-widest font-bold text-fx-text-dim"
            >
              Demo accounts
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-fx-text-dim">
              <KeyRound size={13} aria-hidden="true" />
              Password <code className="text-fx-orange font-semibold">{DEMO_PASSWORD}</code>
            </p>
          </div>
          <ul className="flex flex-col">
            {DEMO_LOGIN_ROLES.map((role) => {
              const { email: demoEmail, fullName } = DEMO_IDENTITIES[role];
              const label = ROLE_CARDS.find((card) => card.role === role)?.label ?? role;
              return (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount(demoEmail)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] text-white truncate">{demoEmail}</span>
                      <span className="block text-[11px] text-fx-text-dim">
                        {label} · {fullName}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-fx-orange">Use</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <>
          {/* Google OAuth */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-fx-border" />
            <span className="text-xs text-fx-text-dim">or</span>
            <div className="flex-1 h-px bg-fx-border" />
          </div>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              const { error } = await signInWithGoogle();
              if (error) setError(error);
            }}
            disabled={loading}
            className="w-full h-12 rounded-ios-xs flex items-center justify-center gap-3 bg-fx-surface border border-fx-border text-fx-text text-[14px] font-semibold disabled:opacity-50 hover:border-fx-border-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.09 24.09 0 0 0 0 21.56l7.98-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-[13px] text-fx-text-dim mt-8">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/onboarding')}
              className="text-fx-orange font-semibold"
            >
              Create one
            </button>
          </p>
        </>
      )}

      {/* Role cards — one tap into a persona */}
      <div className={IS_DEMO_ENV ? '' : 'mt-8 pt-6 border-t border-fx-border'}>
        <p className="text-xs text-fx-text-dim text-center mb-3 uppercase tracking-widest font-bold">
          {IS_DEMO_ENV ? 'Or jump straight in' : 'Demo Mode'}
        </p>
        <div className={`grid gap-2 ${IS_DEMO_ENV ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {ROLE_CARDS.map(({ role, label, blurb, icon, color }) => (
            <button
              key={role}
              onClick={() => {
                enterDemoMode(role);
                navigate(ROLE_ROUTES[role], { replace: true });
              }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 text-left transition-all active:scale-95 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60 ${IS_DEMO_ENV ? 'py-4' : 'py-3'} ${color}`}
            >
              {icon}
              <div className="min-w-0">
                <p className="text-sm font-bold">{label}</p>
                <p className={IS_DEMO_ENV ? 'text-[12px] opacity-75' : 'text-[10px] opacity-60'}>
                  {IS_DEMO_ENV ? blurb : 'Demo'}
                </p>
              </div>
              {IS_DEMO_ENV && <ArrowRight size={16} className="ml-auto shrink-0 opacity-60" />}
            </button>
          ))}
        </div>
        {IS_DEMO_ENV && (
          <p className="text-center text-[12px] text-fx-text-dim mt-5">
            Sample data. Anything you change resets when the page reloads.
          </p>
        )}
      </div>
    </div>
  );
}
