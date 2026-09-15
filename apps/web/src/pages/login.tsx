import { useState, useEffect, useRef, type ReactNode } from 'react';
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
  Route,
  ChevronRight,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserRole } from '@/lib/database.types';
import { IS_DEMO_ENV } from '@/lib/demo/demo-env';
import { DEMO_LOGIN_ROLES, DEMO_PASSWORD } from '@/lib/demo/credentials';
import { DEMO_IDENTITIES, type DemoRole } from '@/lib/demo/identities';

const ROLE_ROUTES: Record<string, string> = {
  carrier: '/carrier',
  broker: '/broker',
  shipper: '/shipper',
  driver: '/driver',
  admin: '/admin',
};

interface RoleMeta {
  label: string;
  Icon: typeof Truck;
}

/** Roles are told apart by icon and label only — never by hue. */
const ROLE_META: Record<Exclude<DemoRole, 'admin'>, RoleMeta> = {
  carrier: { label: 'Carrier', Icon: Truck },
  broker: { label: 'Broker', Icon: Briefcase },
  shipper: { label: 'Shipper', Icon: Package },
  driver: { label: 'Driver', Icon: Route },
};

/** Company names of the seeded demo companies (see lib/demo/domains/core.ts COMPANIES). */
const DEMO_COMPANY_NAMES: Record<string, string> = {
  'demo-company-carrier': 'Rivera Transport Inc',
  'demo-company-broker': 'Apex Freight Solutions',
  'demo-company-shipper': 'Park Manufacturing Co',
};

const NON_DEMO_ROLE_CARDS: readonly UserRole[] = ['carrier', 'broker', 'shipper', 'driver'];

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-4 h-4 border-2 rounded-full animate-spin ${className}`}
    />
  );
}

export default function LoginPage() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === 'light' ? '/logo-user-1-light.svg' : '/logo-user-1.svg';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingProfile, setAwaitingProfile] = useState(false);
  const [pendingRole, setPendingRole] = useState<DemoRole | null>(null);
  // Demo builds lead with the account list; the email form waits behind a quiet toggle.
  const [emailFormOpen, setEmailFormOpen] = useState(!IS_DEMO_ENV);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const focusEmailOnOpen = useRef(false);

  const navigate = useNavigate();
  const { signIn, signInWithGoogle, profile, enterDemoMode } = useAuth();

  // Once profile loads after sign-in, navigate to the correct dashboard
  useEffect(() => {
    if (awaitingProfile && profile) {
      setAwaitingProfile(false);
      navigate(ROLE_ROUTES[profile.role] ?? '/carrier', { replace: true });
    }
  }, [awaitingProfile, profile, navigate]);

  useEffect(() => {
    if (emailFormOpen && focusEmailOnOpen.current) {
      focusEmailOnOpen.current = false;
      emailInputRef.current?.focus();
    }
  }, [emailFormOpen]);

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

  /** One tap = the same credential sign-in as typing the account's email and password. */
  async function signInAsDemoAccount(role: DemoRole) {
    if (pendingRole || loading) return;
    setError(null);
    setPendingRole(role);
    const { error } = await signIn(DEMO_IDENTITIES[role].email, DEMO_PASSWORD);
    if (error) {
      setPendingRole(null);
      setError(error);
      setEmailFormOpen(true);
      return;
    }
    setAwaitingProfile(true);
  }

  function toggleEmailForm() {
    setEmailFormOpen((open) => {
      focusEmailOnOpen.current = !open;
      return !open;
    });
  }

  const busy = loading || pendingRole !== null;

  const inputClass =
    'w-full h-12 bg-fx-surface border border-fx-border rounded-ios-xs px-4 text-[15px] text-fx-text placeholder:text-fx-text-dim outline-none transition-colors focus:border-fx-orange/60 focus:ring-2 focus:ring-fx-orange/20';

  const emailForm: ReactNode = (
    <form
      id="email-sign-in"
      onSubmit={handleSignIn}
      className={`flex flex-col gap-3 ${IS_DEMO_ENV ? 'pt-3 animate-fade-in' : 'mb-8'}`}
    >
      <div className="relative">
        <Mail
          size={15}
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim"
        />
        <input
          ref={emailInputRef}
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} pl-10`}
          autoComplete="email"
          required
        />
      </div>

      <div className="relative">
        <Lock
          size={15}
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim"
        />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} pl-10 pr-12`}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-fx-text-dim hover:text-fx-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60"
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {IS_DEMO_ENV ? (
        <p className="flex items-center gap-1.5 px-1 text-[13px] text-fx-text-dim">
          <KeyRound size={13} aria-hidden="true" className="shrink-0" />
          Demo password
          <code className="font-mono text-[13px] font-semibold text-fx-text">{DEMO_PASSWORD}</code>
        </p>
      ) : (
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
          className="text-[13px] text-fx-danger bg-fx-danger-dim rounded-ios-xs px-4 py-3"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full h-12 rounded-ios-xs flex items-center justify-center gap-2 text-[15px] font-semibold text-white active-scale disabled:opacity-60 mt-1 bg-orange-gradient shadow-orange-glow-sm transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fx-bg"
      >
        {loading ? (
          <Spinner className="w-5 h-5 border-white/30 border-t-white" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );

  if (IS_DEMO_ENV) {
    return (
      <div className="min-h-dvh flex flex-col px-5 pb-8" data-demo-build="">
        <IOSStatusBar />

        <div className="flex-1 flex flex-col justify-center pt-10">
          {/* Logo */}
          <header className="flex flex-col items-center pb-10">
            <img src={logoSrc} alt="DispatchRelay" className="h-10" />
            <p className="text-[15px] text-fx-text-dim mt-3 text-center">
              Explore the platform as any of four roles.
            </p>
          </header>

          <main className="flex flex-col">
            <section aria-labelledby="demo-accounts-heading">
              <h1
                id="demo-accounts-heading"
                className="px-4 mb-2 text-[13px] font-medium text-fx-text-dim"
              >
                Sign in as
              </h1>
              <ul className="overflow-hidden rounded-ios-sm border border-fx-border bg-fx-surface">
                {DEMO_LOGIN_ROLES.map((role, index) => {
                  const meta = ROLE_META[role as keyof typeof ROLE_META];
                  if (!meta) return null;
                  const { fullName, companyId } = DEMO_IDENTITIES[role];
                  const company = DEMO_COMPANY_NAMES[companyId];
                  const isPending = pendingRole === role;
                  const { Icon } = meta;
                  return (
                    <li key={role}>
                      <button
                        type="button"
                        onClick={() => signInAsDemoAccount(role)}
                        disabled={busy}
                        aria-busy={isPending || undefined}
                        className="group w-full flex items-stretch gap-3.5 pl-4 text-left transition-colors hover:bg-fx-surface-2 active:bg-fx-surface-3 focus-visible:outline-none focus-visible:bg-fx-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fx-orange/70 disabled:cursor-default disabled:hover:bg-transparent"
                      >
                        <span
                          aria-hidden="true"
                          className="self-center flex items-center justify-center w-10 h-10 shrink-0 rounded-[10px] bg-fx-surface-2 text-fx-text-muted transition-colors group-hover:bg-fx-surface-3 group-hover:text-fx-text group-focus-visible:bg-fx-surface-3 group-focus-visible:text-fx-text"
                        >
                          <Icon size={19} strokeWidth={1.9} />
                        </span>
                        <span
                          className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 pr-4 ${
                            index > 0 ? 'border-t border-fx-border' : ''
                          }`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-[16px] font-semibold leading-snug text-fx-text">
                              {meta.label}
                            </span>
                            <span className="block text-[13px] leading-snug text-fx-text-dim truncate">
                              {fullName}
                              {company ? ` · ${company}` : ''}
                            </span>
                          </span>
                          {isPending ? (
                            <Spinner className="border-fx-border-2 border-t-fx-orange" />
                          ) : (
                            <ChevronRight
                              size={18}
                              aria-hidden="true"
                              className="shrink-0 text-fx-text-dim transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-fx-orange group-focus-visible:text-fx-orange"
                            />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="mt-5">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={toggleEmailForm}
                  aria-expanded={emailFormOpen}
                  aria-controls="email-sign-in"
                  className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full text-[14px] text-fx-text-muted transition-colors hover:text-fx-text hover:bg-fx-surface/60 active:bg-fx-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60"
                >
                  Sign in with email
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${emailFormOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
              {emailFormOpen && emailForm}
            </div>
          </main>
        </div>

        <p className="mt-auto pt-10 text-center text-[12px] text-fx-text-dim">
          Sample data. Anything you change resets when the page reloads.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 pb-10">
      <IOSStatusBar />

      {/* Logo */}
      <div className="flex flex-col items-center pt-10 pb-10">
        <img src={logoSrc} alt="DispatchRelay" className="h-10 mb-2" />
        <p className="text-[14px] text-fx-text-dim mt-1 text-center">
          Welcome back. Let&apos;s move freight.
        </p>
      </div>

      {emailForm}

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
        {/* Google's brand mark keeps its own colours. */}
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
        Don&apos;t have an account?{' '}
        <button onClick={() => navigate('/onboarding')} className="text-fx-orange font-semibold">
          Create one
        </button>
      </p>

      {/* Role cards — one tap into a persona */}
      <div className="mt-8 pt-6 border-t border-fx-border">
        <p className="text-xs text-fx-text-dim text-center mb-3 uppercase tracking-widest font-bold">
          Demo Mode
        </p>
        <div className="grid gap-2 grid-cols-2">
          {NON_DEMO_ROLE_CARDS.map((role) => {
            const meta = ROLE_META[role as keyof typeof ROLE_META];
            const { Icon } = meta;
            return (
              <button
                key={role}
                onClick={() => {
                  enterDemoMode(role);
                  navigate(ROLE_ROUTES[role], { replace: true });
                }}
                className="flex items-center gap-2.5 rounded-xl border border-fx-border bg-fx-surface px-3 py-3 text-left text-fx-text transition-colors hover:bg-fx-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fx-orange/60"
              >
                <Icon size={20} className="text-fx-text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{meta.label}</p>
                  <p className="text-[10px] text-fx-text-dim">Demo</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
