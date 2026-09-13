import { test, expect } from '@playwright/test';
import { isDemoBuild, signInAsDemo, watchForProblems, type DemoRole } from './helpers/demo';

/** Every screen each demo persona can reach from its navigation. */
const SHARED_ROUTES = [
  '/messages',
  '/track',
  '/track/FX-1042',
  '/profile',
  '/profile/help',
  '/profile/notifications',
  '/profile/documents',
  '/profile/trust',
];

const ROLE_ROUTES: Record<DemoRole, string[]> = {
  carrier: [
    '/carrier',
    '/carrier/loads',
    '/carrier/fleet',
    '/carrier/map',
    '/carrier/team',
    '/carrier/team-settings',
    '/carrier/payments',
    '/carrier/invitations',
    '/carrier/alerts',
    '/carrier/rfps',
    '/carrier/fuel-cards',
    '/carrier/spot-rates',
    '/lane-intelligence',
  ],
  broker: ['/broker', '/broker/loads', '/broker/team', '/broker/api-keys', '/lane-intelligence'],
  shipper: ['/shipper', '/shipper/loads', '/shipper/dock-scheduling', '/shipper/rfps'],
  driver: [
    '/driver',
    '/driver/loads',
    '/driver/documents',
    '/driver/tire-log',
    '/driver/receipts',
    '/driver/expenses',
    '/driver/hos',
  ],
};

/** Time for lazy chunks, queries and realtime callbacks to settle after navigation. */
const SETTLE_MS = 800;

test.describe('Demo mode (no backend)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await isDemoBuild(page)), 'Only runs against a demo build');
  });

  test('login offers role cards instead of a credential form', async ({ page }) => {
    await expect(page.getByText('Choose a role')).toBeVisible();
    for (const label of ['Carrier', 'Broker', 'Shipper', 'Driver']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('account-only routes send visitors back to the role picker', async ({ page }) => {
    for (const path of ['/onboarding', '/forgot-password', '/reset-password', '/claim-account']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test('picking a role card lands on that dashboard with seeded data', async ({ page }) => {
    await page.getByText('Broker', { exact: true }).click();
    await expect(page).toHaveURL(/\/broker$/);
    await expect(page.getByText('Sarah Chen')).toBeVisible();
  });

  test('/demo links open straight into a dashboard, defaulting to carrier', async ({ page }) => {
    await page.goto('/demo/shipper');
    await expect(page).toHaveURL(/\/shipper$/);
    await expect(page.getByText('James Park')).toBeVisible();
    await page.goto('/demo/not-a-role');
    await expect(page).toHaveURL(/\/carrier$/);
    await expect(page.getByText('Marcus Rivera')).toBeVisible();
  });

  test('the chosen role survives a page reload', async ({ page }) => {
    await page.getByText('Driver', { exact: true }).click();
    await expect(page.getByText('Carlos Mendez')).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/driver$/);
    await expect(page.getByText('Carlos Mendez')).toBeVisible();
  });

  for (const role of Object.keys(ROLE_ROUTES) as DemoRole[]) {
    test(`${role}: every screen renders with no errors and no backend calls`, async ({ page }) => {
      test.setTimeout(120_000);
      await signInAsDemo(page, role);
      const problems = watchForProblems(page);

      for (const path of [...ROLE_ROUTES[role], ...SHARED_ROUTES]) {
        const before = problems.length;
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(SETTLE_MS);

        expect
          .soft(page.url(), `${path} should not bounce to login or 404`)
          .not.toMatch(/\/(login|404)$/);
        expect.soft(problems.slice(before), `${path} problems`).toEqual([]);
      }
    });
  }
});
