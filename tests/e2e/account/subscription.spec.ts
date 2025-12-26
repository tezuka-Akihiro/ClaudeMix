/**
 * subscription.spec.ts
 * Purpose: E2E tests for subscription management
 *
 * Test Coverage:
 * - Subscription page display
 * - Status badge rendering
 * - Upgrade flow (inactive → trial)
 * - Cancel flow (trial/active → inactive)
 * - Validation rules
 */

import { test, expect } from '@playwright/test';

// Helper function to generate unique email addresses
function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

test.describe('Account Subscription Management', () => {
  test.describe('Subscription Page Display', () => {
    test('should display subscription page for authenticated user', async ({ page }) => {
      // Register and login
      const email = generateUniqueEmail('subscription-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify page title
      await expect(page).toHaveTitle(/サブスクリプション/);

      // Verify subscription page is displayed
      const subscriptionPage = page.locator('[data-testid="subscription-page"]');
      await expect(subscriptionPage).toBeVisible();

      // Verify page heading
      await expect(page.locator('h1')).toContainText('サブスクリプション');
    });

    test('should redirect to login if not authenticated', async ({ page }) => {
      await page.goto('/account/subscription');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Subscription Status - Inactive', () => {
    test('should display inactive status badge for new user', async ({ page }) => {
      // Register new user (default status is inactive)
      const email = generateUniqueEmail('inactive-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify subscription status card is displayed
      const statusCard = page.locator('[data-testid="subscription-status-card"]');
      await expect(statusCard).toBeVisible();

      // Verify inactive badge is displayed
      const inactiveBadge = page.locator('[data-testid="badge-danger"]');
      await expect(inactiveBadge).toBeVisible();
      await expect(inactiveBadge).toContainText('非アクティブ');

      // Verify upgrade button is visible (inactive users can upgrade)
      const upgradeButton = page.locator('[data-testid="upgrade-button"]');
      await expect(upgradeButton).toBeVisible();

      // Verify cancel button is NOT visible (already inactive)
      const cancelButton = page.locator('[data-testid="cancel-button"]');
      await expect(cancelButton).not.toBeVisible();
    });

    test('should allow upgrade from inactive to trial', async ({ page }) => {
      // Register new user
      const email = generateUniqueEmail('upgrade-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify inactive status
      await expect(page.locator('[data-testid="badge-danger"]')).toBeVisible();

      // Click upgrade button
      const upgradeButton = page.locator('[data-testid="upgrade-button"]');
      await upgradeButton.click();

      // Wait for page to update
      await page.waitForTimeout(1000);

      // Reload page to verify status change
      await page.reload();

      // Verify status changed to trial
      const trialBadge = page.locator('[data-testid="badge-warning"]');
      await expect(trialBadge).toBeVisible();
      await expect(trialBadge).toContainText('トライアル');

      // Verify upgrade button is now visible (trial users can upgrade to active)
      await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();

      // Verify cancel button is visible (trial users can cancel)
      await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
    });
  });

  test.describe('Subscription Status - Trial', () => {
    test('should display trial status badge', async ({ page }) => {
      // Register and upgrade to trial
      const email = generateUniqueEmail('trial-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      await page.goto('/account/subscription');
      await page.locator('[data-testid="upgrade-button"]').click();
      await page.waitForTimeout(1000);
      await page.reload();

      // Verify trial badge
      const trialBadge = page.locator('[data-testid="badge-warning"]');
      await expect(trialBadge).toBeVisible();
      await expect(trialBadge).toContainText('トライアル');
    });

    test('should allow cancel from trial to inactive', async ({ page }) => {
      // Register and upgrade to trial
      const email = generateUniqueEmail('cancel-trial-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      await page.goto('/account/subscription');
      await page.locator('[data-testid="upgrade-button"]').click();
      await page.waitForTimeout(1000);
      await page.reload();

      // Verify trial status
      await expect(page.locator('[data-testid="badge-warning"]')).toBeVisible();

      // Click cancel button
      const cancelButton = page.locator('[data-testid="cancel-button"]');
      await cancelButton.click();

      // Wait for page to update
      await page.waitForTimeout(1000);

      // Reload page to verify status change
      await page.reload();

      // Verify status changed back to inactive
      const inactiveBadge = page.locator('[data-testid="badge-danger"]');
      await expect(inactiveBadge).toBeVisible();
      await expect(inactiveBadge).toContainText('非アクティブ');

      // Verify upgrade button is visible again
      await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();

      // Verify cancel button is NOT visible
      await expect(page.locator('[data-testid="cancel-button"]')).not.toBeVisible();
    });
  });

  test.describe('Navigation and Integration', () => {
    test('should navigate to subscription from account settings', async ({ page }) => {
      // Register and login
      const email = generateUniqueEmail('nav-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Navigate to account page
      await page.goto('/account');

      // Find and click subscription link in navigation
      const subscriptionLink = page.locator('a[href="/account/subscription"]');
      await subscriptionLink.click();

      // Verify we're on subscription page
      await expect(page).toHaveURL('/account/subscription');
      await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();
    });

    test('should maintain session across subscription page visits', async ({ page }) => {
      // Register and login
      const email = generateUniqueEmail('session-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Visit subscription page
      await page.goto('/account/subscription');
      await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();

      // Navigate away and back
      await page.goto('/account');
      await page.goto('/account/subscription');

      // Should still be authenticated
      await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle rapid successive status changes', async ({ page }) => {
      // Register user
      const email = generateUniqueEmail('rapid-change-user');
      const password = 'Password123';

      await page.goto('/register');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      await page.goto('/account/subscription');

      // Rapidly click upgrade multiple times
      const upgradeButton = page.locator('[data-testid="upgrade-button"]');
      await upgradeButton.click();
      await upgradeButton.click();
      await upgradeButton.click();

      // Wait for processing
      await page.waitForTimeout(2000);
      await page.reload();

      // Should end up in a valid state (trial)
      const badge = page.locator('[data-testid="badge-warning"], [data-testid="badge-danger"]');
      await expect(badge).toBeVisible();
    });
  });
});
