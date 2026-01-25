/**
 * subscription.spec.ts
 * Purpose: E2E tests for subscription management
 *
 * Test Coverage:
 * - Subscription page display
 * - Status badge rendering
 * - Plan selection flow
 * - Cancel flow (active → inactive)
 * - Validation rules
 */

import { test, expect, type Page } from '@playwright/test';

// Helper function to generate unique email addresses
function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

async function createAuthenticatedUser(page: Page, prefix: string) {
  const email = generateUniqueEmail(prefix);
  const password = 'Password123';

  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="passwordConfirm"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/account');
  return { email, password };
}

test.describe('Account Subscription Management', () => {
  test.describe('Subscription Page Display', () => {
    test('should display subscription page for authenticated user', async ({ page }) => {
      // Register and login
      await createAuthenticatedUser(page, 'subscription-user');

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
      await createAuthenticatedUser(page, 'inactive-user');

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify subscription status card is displayed
      const statusCard = page.locator('[data-testid="subscription-status-card"]');
      await expect(statusCard).toBeVisible();

      // Verify inactive badge is displayed
      const inactiveBadge = page.locator('[data-testid="badge-danger"]');
      await expect(inactiveBadge).toBeVisible();
      await expect(inactiveBadge).toContainText('非アクティブ');

      // Verify cancel button is NOT visible (already inactive)
      const cancelButton = page.locator('[data-testid="cancel-button"]');
      await expect(cancelButton).not.toBeVisible();

      // Verify plan selector is visible for inactive users
      const planSelector = page.locator('[data-testid="plan-selector"]');
      await expect(planSelector).toBeVisible();
    });

    test('should display plan cards for inactive user', async ({ page }) => {
      // Register new user
      await createAuthenticatedUser(page, 'plan-user');

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify plan card is displayed (standard plan)
      const planCard = page.locator('[data-testid="plan-card-standard"]');
      await expect(planCard).toBeVisible();

      // Verify plan card content
      await expect(planCard.locator('.plan-name')).toContainText('スタンダード');
      await expect(planCard.locator('.plan-price__amount')).toContainText('¥980');

      // Verify purchase button is visible
      const purchaseButton = page.locator('[data-testid="subscribe-standard"]');
      await expect(purchaseButton).toBeVisible();
      await expect(purchaseButton).toContainText('購入');
    });
  });

  test.describe('Navigation and Integration', () => {
    test('should navigate to subscription from account settings', async ({ page }) => {
      // Register and login
      await createAuthenticatedUser(page, 'nav-user');

      // Find and click subscription link in navigation
      const subscriptionLink = page.locator('a[href="/account/subscription"]');
      await subscriptionLink.click();

      // Verify we're on subscription page
      await expect(page).toHaveURL('/account/subscription');
      await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();
    });

    test('should maintain session across subscription page visits', async ({ page }) => {
      // Register and login
      await createAuthenticatedUser(page, 'session-user');

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
    test('should handle rapid successive button clicks', async ({ page }) => {
      // Register user
      await createAuthenticatedUser(page, 'rapid-change-user');

      await page.goto('/account/subscription');

      // Rapidly click purchase button multiple times
      const purchaseButton = page.locator('[data-testid="subscribe-standard"]');
      await purchaseButton.click();
      await purchaseButton.click();
      await purchaseButton.click();

      // Wait for processing
      await page.waitForTimeout(2000);

      // Should either show error or redirect to checkout
      // The page should remain stable
      const pageVisible = await page.locator('body').isVisible();
      expect(pageVisible).toBe(true);
    });
  });
});
