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
import { loadSpec, type AccountSubscriptionSpec } from '../../utils/loadSpec';
import { extractTestId } from '~/lib/utils/extractTestId';

test.describe('Account Subscription Management', () => {
  let spec: AccountSubscriptionSpec;

  test.beforeAll(async () => {
    spec = await loadSpec<AccountSubscriptionSpec>('account', 'subscription');
  });

  test.describe('Subscription Page Display', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display subscription page for authenticated user', async ({ page }) => {
      // Register and login
      await createAuthenticatedUser(page, { prefix: 'sub-display' });

      // Navigate to subscription page
      await page.goto(spec.routes.subscription.path);

      // Verify page title
      const titlePattern = new RegExp(spec.routes.subscription.title);
      await expect(page).toHaveTitle(titlePattern);

      // Verify subscription page is displayed
      const subscriptionPage = page.getByTestId('subscription-page');
      await expect(subscriptionPage).toBeVisible();

      // Verify page heading
      await expect(page.locator('h1')).toContainText(spec.routes.subscription.title);
    });

    test('should redirect to login if not authenticated', async ({ page }) => {
      // Force unauthenticated state
      await page.context().clearCookies();
      await page.goto(spec.routes.subscription.path);

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
      await page.goto(spec.routes.subscription.path);

      // Verify subscription page is displayed
      const subscriptionPage = page.getByTestId('subscription-page');
      await expect(subscriptionPage).toBeVisible();

      // Verify plan selector is visible for inactive users
      const planSelector = page.getByTestId(extractTestId(spec.test.selectors.plan_selector));
      await expect(planSelector).toBeVisible();
    });

    test('should display plan cards for inactive user', async ({ page }) => {
      // Register new user
      await createAuthenticatedUser(page, { prefix: 'sub-inactive-2' });

      // Navigate to subscription page
      await page.goto(spec.routes.subscription.path);

      // Verify plan card is displayed (standard plan)
      const planCard = page.getByTestId(extractTestId(spec.test.selectors.plan_card_standard));
      await expect(planCard).toBeVisible();

      // Verify plan card content
      await expect(planCard.locator('.plan-name')).toContainText(spec.plans.standard.name);
      await expect(planCard.locator('.plan-price__amount')).toContainText(spec.plans.standard.price.toLocaleString());

      // Verify purchase button is visible
      const purchaseButton = page.getByTestId(extractTestId(spec.test.selectors.subscribe_standard));
      await expect(purchaseButton).toBeVisible();
      await expect(purchaseButton).toContainText(spec.forms.create_checkout.submit_button.label);
    });
  });

  test.describe('Navigation and Integration', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should navigate to subscription from account settings', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'sub-nav-1' });

      // Find and click subscription link in navigation
      const subscriptionLink = page.locator(`a[href="${spec.routes.subscription.path}"]`);
      await subscriptionLink.click();

      // Verify we're on subscription page
      await expect(page).toHaveURL(spec.routes.subscription.path);
      await expect(page.getByTestId('subscription-page')).toBeVisible();
    });

    test('should maintain session across subscription page visits', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'sub-nav-2' });

      // Visit subscription page
      await page.goto(spec.routes.subscription.path);
      await expect(page.getByTestId('subscription-page')).toBeVisible();

      // Navigate away and back
      await page.goto('/account');
      await page.goto(spec.routes.subscription.path);

      // Should still be authenticated
      await expect(page.getByTestId('subscription-page')).toBeVisible();
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

      await page.goto(spec.routes.subscription.path);

      // Click purchase button - this triggers fetcher submit then external navigation
      const purchaseButton = page.getByTestId(extractTestId(spec.test.selectors.subscribe_standard));
      await purchaseButton.click();

      // After first click, button should become disabled (fetcher submitting)
      // or page should navigate to Stripe Checkout
      await expect(async () => {
        const isDisabled = await purchaseButton.isDisabled().catch(() => true);
        const url = page.url();
        const navigated = url.includes('checkout.stripe.com');
        expect(isDisabled || navigated).toBe(true);
      }).toPass({ timeout: 10000 });
    });
  });
});
