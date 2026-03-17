import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { IOSStatusBar } from '@/shared/components/ios-status-bar';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_ROUTES: Record<string, string> = {
  carrier: '/carrier',
  broker: '/broker',
  shipper: '/shipper',
  admin: '/admin',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingProfile, setAwaitingProfile] = useState(false);

  const navigate = useNavigate();
  const { signIn, profile } = useAuth();

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

  const inputClass =
    'w-full h-12 bg-fx-surface rounded-ios-xs px-4 text-[14px] text-white placeholder:text-fx-text-dim focus:ring-1 focus:ring-fx-orange/50 outline-none transition-all card-highlight';

  return (
    <div className="min-h-dvh flex flex-col px-6 pb-10">
      <IOSStatusBar />

      {/* Logo */}
      <div className="flex flex-col items-center pt-10 pb-10">
        <img src="/logo-user-1.svg" alt="FreightX" className="h-10 mb-2" />
        <p className="text-[14px] text-fx-text-dim mt-1">Welcome back. Let's move freight.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} className="flex flex-col gap-3 mb-8">
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fx-text-dim"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-[13px] text-fx-orange font-semibold"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 rounded-ios-xs px-4 py-3">{error}</p>
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

      <p className="text-center text-[13px] text-fx-text-dim mt-8">
        Don't have an account?{' '}
        <button onClick={() => navigate('/onboarding')} className="text-fx-orange font-semibold">
          Create one
        </button>
      </p>
    </div>
  );
}
