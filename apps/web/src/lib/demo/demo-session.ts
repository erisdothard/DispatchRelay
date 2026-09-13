/**
 * Tracks whether demo mode is active and which persona is signed in. The chosen role is
 * kept in sessionStorage so a page refresh mid-walkthrough doesn't bounce to the login screen.
 */
import { IS_DEMO_ENV } from './demo-env';
import { isDemoRole, type DemoRole } from './identities';
import type { DemoIdentity } from './types';

const STORAGE_KEY = 'fx_demo_role';
let current: DemoIdentity | null = null;

/** True when every Supabase call should be served by the in-memory demo backend. */
export function isDemoActive(): boolean {
  return IS_DEMO_ENV || current !== null;
}

export function currentDemoIdentity(): DemoIdentity | null {
  return current;
}

export function startDemoSession(identity: DemoIdentity): void {
  current = identity;
  try {
    sessionStorage.setItem(STORAGE_KEY, identity.role);
  } catch {
    // Storage blocked (private mode) — the session just won't survive a refresh.
  }
}

export function endDemoSession(): void {
  current = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}

export function persistedDemoRole(): DemoRole | null {
  try {
    const role = sessionStorage.getItem(STORAGE_KEY);
    return isDemoRole(role) ? role : null;
  } catch {
    return null;
  }
}
