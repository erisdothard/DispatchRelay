import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_HOME = {
  carrier: '/carrier',
  broker: '/broker',
  shipper: '/shipper',
  driver: '/driver',
} as const;

type PublicDemoRole = keyof typeof ROLE_HOME;

function resolveRole(requested: string | undefined): PublicDemoRole {
  const role = requested?.toLowerCase();
  return role && role in ROLE_HOME ? (role as PublicDemoRole) : 'carrier';
}

/**
 * Public demo entry: /demo, or /demo/:role for a specific persona. Signs in and lands
 * on that dashboard so a shared link never shows a login screen. Unknown roles fall
 * back to carrier — this URL is handed out publicly and a typo shouldn't dead-end.
 */
export default function DemoPage() {
  const { role } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; only enter demo mode once.
    if (started.current) return;
    started.current = true;

    const resolved = resolveRole(role);
    enterDemoMode(resolved);
    navigate(ROLE_HOME[resolved], { replace: true });
  }, [role, enterDemoMode, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-fx-text-dim">Loading demo…</p>
    </div>
  );
}
