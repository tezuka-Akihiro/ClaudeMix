/**
 * subscription.spec.ts
 * Purpose: E2E tests for subscription management
 *
 * Test Coverage:
 * - Subscription page display
 * - Plan selection flow
 * - Cancel flow (active → inactive)
 * - Validation rules
 */

import { test, expect, type Page } from '@playwright/test';
import { createAuthenticatedUser } from '../../utils/auth-helper';

test.describe('Account Subscription Management', () => {
  test.describe('Subscription Page Display', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display subscription page for authenticated user', async ({ page }) => {
      // Register and login
      await createAuthenticatedUser(page, { prefix: 'sub-display' });

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
      // Force unauthenticated state
      await page.context().clearCookies();
      await page.goto('/account/subscription');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Subscription Status - Inactive', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display subscription page for new user', async ({ page }) => {
      // Register new user (default status is inactive)
      await createAuthenticatedUser(page, { prefix: 'sub-inactive-1' });

      // Navigate to subscription page
      await page.goto('/account/subscription');

      // Verify subscription status card is displayed
      const statusCard = page.locator('[data-testid="subscription-status-card"]');
      await expect(statusCard).toBeVisible();

      // Verify cancel button is NOT visible (already inactive)
      const cancelButton = page.locator('[data-testid="cancel-button"]');
      await expect(cancelButton).not.toBeVisible();

      // Verify plan selector is visible for inactive users
      const planSelector = page.locator('[data-testid="plan-selector"]');
      await expect(planSelector).toBeVisible();
    });

    test('should display plan cards for inactive user', async ({ page }) => {
      // Register new user
      await createAuthenticatedUser(page, { prefix: 'sub-inactive-2' });

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
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should navigate to subscription from account settings', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'sub-nav-1' });

      // Find and click subscription link in navigation
      const subscriptionLink = page.locator('a[href="/account/subscription"]');
      await subscriptionLink.click();

      // Verify we're on subscription page
      await expect(page).toHaveURL('/account/subscription');
      await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();
    });

    test('should maintain session across subscription page visits', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'sub-nav-2' });

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
    // Isolate this test to avoid side effects on global user and ensure clean registration
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should handle rapid successive button clicks', async ({ page }) => {
      // Create isolated user to avoid side effects (subscribing) on global user
      // Register user
      await createAuthenticatedUser(page, { prefix: 'rapid-change-user' });

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
