import { test, expect } from '@playwright/test';
import { isDemoBuild } from './helpers/demo';

const NO_CREDENTIALS = 'Demo builds have no credential login';

test.describe('Auth flows', () => {
  test('splash page loads and shows login CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DispatchRelay/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    test.skip(await isDemoBuild(page), NO_CREDENTIALS);
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    test.skip(await isDemoBuild(page), NO_CREDENTIALS);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'notreal@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 8000 });
  });

  test('forgot password page is accessible', async ({ page }) => {
    test.skip(await isDemoBuild(page), NO_CREDENTIALS);
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('unauthenticated user redirected from protected route', async ({ page }) => {
    await page.goto('/carrier');
    // Should redirect to login or 404
    await expect(page).not.toHaveURL('/carrier');
  });

  test('carrier login → redirects to carrier dashboard', async ({ page }) => {
    test.skip(!process.env.TEST_CARRIER_EMAIL, 'TEST_CARRIER_EMAIL not set');
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_CARRIER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_CARRIER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/carrier', { timeout: 10000 });
  });

  test('broker login → redirects to broker dashboard', async ({ page }) => {
    test.skip(!process.env.TEST_BROKER_EMAIL, 'TEST_BROKER_EMAIL not set');
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_BROKER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_BROKER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/broker', { timeout: 10000 });
  });
});
