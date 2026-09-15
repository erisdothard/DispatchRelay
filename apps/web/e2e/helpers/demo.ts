import type { Locator, Page } from '@playwright/test';

export type DemoRole = 'carrier' | 'broker' | 'shipper' | 'driver';

/** Shared demo-account password — matches VITE_DEMO_PASSWORD's default in the app. */
export const DEMO_PASSWORD = process.env.VITE_DEMO_PASSWORD ?? 'dispatchrelay';

/** Demo builds (no backend configured) mark the login screen with `data-demo-build`. */
export async function isDemoBuild(page: Page): Promise<boolean> {
  await page.goto('/login');
  await page.locator('input[type="email"], [data-demo-build]').first().waitFor();
  return (await page.locator('[data-demo-build]').count()) > 0;
}

/**
 * Reveals the email + password form. Demo builds keep it collapsed behind
 * "Sign in with email"; other builds show it straight away.
 */
export async function openEmailSignIn(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Sign in with email' });
  if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await page.locator('input[type="email"]').waitFor();
}

const ROLE_LABELS: Record<DemoRole, string> = {
  carrier: 'Carrier',
  broker: 'Broker',
  shipper: 'Shipper',
  driver: 'Driver',
};

/** The one-tap sign-in row for a demo account on the login screen. */
export function demoAccountButton(page: Page, role: DemoRole): Locator {
  return page.getByRole('button', { name: new RegExp(`^${ROLE_LABELS[role]}\\b`) });
}

/** Signs in as a demo persona on every navigation, as if the account had been picked at login. */
export async function signInAsDemo(page: Page, role: DemoRole): Promise<void> {
  await page.addInitScript((r) => sessionStorage.setItem('fx_demo_role', r), role);
}

/**
 * Collects everything that means a demo screen is broken: console errors, uncaught
 * exceptions, any request to Supabase, and failed requests (ignoring aborted navigations).
 */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`uncaught: ${err.message}`));
  page.on('request', (req) => {
    if (new URL(req.url()).hostname.endsWith('supabase.co'))
      problems.push(`supabase request: ${req.url()}`);
  });
  page.on('requestfailed', (req) => {
    const reason = req.failure()?.errorText ?? '';
    if (!reason.includes('ERR_ABORTED')) problems.push(`request failed: ${req.url()} (${reason})`);
  });
  return problems;
}
