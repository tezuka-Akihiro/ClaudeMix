import { test, expect, type Page } from '@playwright/test';
import { createAuthenticatedUser } from '../../utils/auth-helper';
import { loadSpec } from '../../utils/loadSpec';
import type { AccountCommonSpec } from '~/specs/account/types';
import { extractTestId } from '~/lib/utils/extractTestId';

/**
 * E2E Test: Account Common Section (Happy Path)
 *
 * Purpose: Define the end goal for common section implementation
 * - Verify AccountLayout renders correctly
 * - Verify AccountNav displays navigation items
 * - Verify authentication guard redirects unauthenticated users
 */

test.describe('Account Common Section - Happy Path', () => {
  let spec: AccountCommonSpec;

  test.beforeAll(async () => {
    spec = await loadSpec<AccountCommonSpec>('account', 'common');
  });

  test.describe('Authenticated User', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'common-user' });
    });

    test('should render AccountLayout with AccountNav', async ({ page }) => {
      // Navigate to /account
      await page.goto('/account');

      // Verify AccountLayout is rendered
      const layout = page.getByTestId(extractTestId(spec.ui_selectors.layout.account_layout));
      await expect(layout).toBeVisible();

      // Verify AccountNav is rendered
      const nav = page.getByTestId(extractTestId(spec.ui_selectors.navigation.account_nav));
      await expect(nav).toBeVisible();

      // Verify navigation items count are displayed
      const navItems = nav.getByTestId(extractTestId(spec.ui_selectors.navigation.nav_item));
      await expect(navItems).toHaveCount(spec.navigation.menu_items.length);

      // Verify navigation item labels from spec
      for (let i = 0; i < spec.navigation.menu_items.length; i++) {
        await expect(navItems.nth(i)).toContainText(spec.navigation.menu_items[i].label);
      }

      // Verify current page (first item) is highlighted
      const firstItem = spec.navigation.menu_items[0];
      const activeItem = nav.locator(`${spec.ui_selectors.navigation.nav_item}[aria-current="page"]`);
      await expect(activeItem).toBeVisible();
      await expect(activeItem).toContainText(firstItem.label);
    });

    test('should navigate between account pages', async ({ page }) => {
      const settingsItem = spec.navigation.menu_items.find(item => item.path === '/account/settings');
      if (!settingsItem) throw new Error('Settings item not found in spec');

      await page.goto('/account');

      // Click on settings navigation item
      const nav = page.getByTestId(extractTestId(spec.ui_selectors.navigation.account_nav));
      await nav.locator(`text=${settingsItem.label}`).click();

      // Verify URL changed to /account/settings
      await expect(page).toHaveURL(settingsItem.path);

      // Verify settings is now highlighted
      const activeItem = nav.locator(`${spec.ui_selectors.navigation.nav_item}[aria-current="page"]`);
      await expect(activeItem).toContainText(settingsItem.label);
    });

    test('should display account index page with announcements and logout button', async ({ page }) => {
      await page.goto('/account');

      // Verify announcements section is displayed
      const announcementHeading = page.getByRole('heading', { name: 'お知らせ' });
      await expect(announcementHeading).toBeVisible();

      // Verify logout button is present
      const logoutButton = page.getByTestId('logout-button');
      await expect(logoutButton).toBeVisible();
      await expect(logoutButton).toHaveClass(/btn-primary/);
      await expect(logoutButton).toHaveText('ログアウト');
    });

    test('should display services page with service links', async ({ page }) => {
      const servicesItem = spec.navigation.menu_items.find(item => item.path === '/account/services');
      if (!servicesItem) throw new Error('Services item not found in spec');

      await page.goto(servicesItem.path);

      // Verify page title is displayed
      const pageTitle = page.locator(`h1:has-text("${servicesItem.label}")`);
      await expect(pageTitle).toBeVisible();

      // Verify blog service link is present (using ClaudeMix label from spec)
      const blogService = spec.services.items.find(s => s.path === '/blog');
      if (!blogService) throw new Error('Blog service not found in spec');

      const blogServiceLink = page.locator(`[data-testid="service-link"]:has-text("${blogService.label}")`);
      await expect(blogServiceLink).toBeVisible();
      await expect(blogServiceLink).toHaveClass(/btn-primary/);
      await expect(blogServiceLink).toHaveAttribute('href', blogService.path);
    });

    test('should navigate to services page from navigation', async ({ page }) => {
      const servicesItem = spec.navigation.menu_items.find(item => item.path === '/account/services');
      if (!servicesItem) throw new Error('Services item not found in spec');

      await page.goto('/account');

      // Click on services navigation item
      const nav = page.getByTestId(extractTestId(spec.ui_selectors.navigation.account_nav));
      await nav.locator(`text=${servicesItem.label}`).click();

      // Verify URL changed to /account/services
      await expect(page).toHaveURL(servicesItem.path);

      // Verify services item is now highlighted
      const activeItem = nav.locator(`${spec.ui_selectors.navigation.nav_item}[aria-current="page"]`);
      await expect(activeItem).toContainText(servicesItem.label);
    });
  });

  test.describe('Unauthenticated User', () => {
    // Ensure unauthenticated state for these tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should redirect to login with redirect-url parameter', async ({ page }) => {
      const loginPath = spec.redirect.login_path;
      const redirectParam = spec.redirect.query_param_name;
      const expectedUrlPattern = new RegExp(`${loginPath.replace('/', '\\/')}\\?${redirectParam}=%2Faccount$`);

      // Navigate to /account without authentication
      await page.goto('/account');

      // Verify redirected to login with redirect parameter (URL-encoded)
      await expect(page).toHaveURL(expectedUrlPattern);

      // Verify login page is displayed
      const loginForm = page.locator('form');
      await expect(loginForm).toBeVisible();
    });

    test('should redirect to login when accessing /account/settings', async ({ page }) => {
      const loginPath = spec.redirect.login_path;
      const redirectParam = spec.redirect.query_param_name;
      const expectedUrlPattern = new RegExp(`${loginPath.replace('/', '\\/')}\\?${redirectParam}=%2Faccount%2Fsettings$`);

      // Navigate to /account/settings without authentication
      await page.goto('/account/settings');

      // Verify redirected to login with redirect parameter (URL-encoded)
      await expect(page).toHaveURL(expectedUrlPattern);
    });

    test('should redirect to login when accessing /account/subscription', async ({ page }) => {
      const loginPath = spec.redirect.login_path;
      const redirectParam = spec.redirect.query_param_name;
      const expectedUrlPattern = new RegExp(`${loginPath.replace('/', '\\/')}\\?${redirectParam}=%2Faccount%2Fsubscription$`);

      // Navigate to /account/subscription without authentication
      await page.goto('/account/subscription');

      // Verify redirected to login with redirect parameter (URL-encoded)
      await expect(page).toHaveURL(expectedUrlPattern);
    });

    test('should redirect to login when accessing /account/services', async ({ page }) => {
      const loginPath = spec.redirect.login_path;
      const redirectParam = spec.redirect.query_param_name;
      const expectedUrlPattern = new RegExp(`${loginPath.replace('/', '\\/')}\\?${redirectParam}=%2Faccount%2Fservices$`);

      // Navigate to /account/services without authentication
      await page.goto('/account/services');

      // Verify redirected to login with redirect parameter (URL-encoded)
      await expect(page).toHaveURL(expectedUrlPattern);
    });
  });
});

test.describe('Common Components', () => {
  let spec: AccountCommonSpec;

  test.beforeAll(async () => {
    spec = await loadSpec<AccountCommonSpec>('account', 'common');
  });

  test.describe('FlashMessage', () => {
    // Ensure unauthenticated state to test login page behavior
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display flash message from URL parameter', async ({ page }) => {
      const loginPath = spec.redirect.login_path;
      const sessionExpiredMessage = spec.error_messages.auth.session_expired;

      // Navigate with flash message URL parameter
      // Note: the 'message' parameter handling is in login.tsx, which uses authentication-spec
      // but the message content should be consistent.
      await page.goto(`${loginPath}?message=session-expired`);

      // Verify flash message is displayed
      const flashMessage = page.getByTestId('flash-message');
      await expect(flashMessage).toBeVisible();
      // Note: we check if it contains the message from common spec
      await expect(flashMessage).toContainText(sessionExpiredMessage);

      // Verify flash message auto-closes after delay
      // Use Playwright's built-in waiting instead of fixed timeout
      await expect(flashMessage).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Modal', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'modal-user' });
    });

    test('should open and close modal with focus trap', async ({ page }) => {
      // Navigate to settings page with modal triggers
      await page.goto('/account/settings');

      // Open modal (using email-change-button as test subject)
      const modalTrigger = page.getByTestId('email-change-button');
      await modalTrigger.click();

      // Verify modal is visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute('aria-modal', 'true');

      // Wait for initial focus to be set to first visible input
      const firstInput = modal.locator('input:not([type="hidden"])').first();
      await expect(firstInput).toBeFocused();

      // Verify focus is trapped inside modal
      // Press Tab and verify focus stays within modal
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInsideModal = await modal.locator(':focus').count() > 0;
      expect(isInsideModal).toBe(true);

      // Close modal with Escape key
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

});
