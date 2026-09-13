/**
 * Email + password sign-in for the demo personas. The password ships in the client bundle,
 * so it's a convenience for visitors, not a secret — there is no backend to protect.
 */
import { DEMO_IDENTITIES, type DemoRole } from './identities';
import type { DemoIdentity } from './types';

export const DEMO_PASSWORD: string =
  (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) || 'dispatchrelay';

/** Personas a visitor can sign in as (the admin screens aren't part of the demo). */
export const DEMO_LOGIN_ROLES: readonly DemoRole[] = ['carrier', 'broker', 'shipper', 'driver'];

export function demoIdentityForCredentials(email: string, password: string): DemoIdentity | null {
  if (password !== DEMO_PASSWORD) return null;
  const wanted = email.trim().toLowerCase();
  const role = DEMO_LOGIN_ROLES.find((r) => DEMO_IDENTITIES[r].email === wanted);
  return role ? DEMO_IDENTITIES[role] : null;
}
