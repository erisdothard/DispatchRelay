import type { Page } from '@playwright/test';

export type DemoRole = 'carrier' | 'broker' | 'shipper' | 'driver';

/** Demo builds (no backend configured) show only role cards on /login — no credential form. */
export async function isDemoBuild(page: Page): Promise<boolean> {
  await page.goto('/login');
  await page.getByText('Carrier', { exact: true }).waitFor();
  return (await page.locator('input[type="email"]').count()) === 0;
}

/** Signs in as a demo persona on every navigation, exactly like picking a role card. */
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
