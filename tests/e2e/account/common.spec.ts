import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test: Account Common Section (Happy Path)
 *
 * Purpose: Define the end goal for common section implementation
 * - Verify AccountLayout renders correctly
 * - Verify AccountNav displays navigation items
 * - Verify authentication guard redirects unauthenticated users
 */

async function createAuthenticatedSession(page: Page, prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
  const password = 'Password123';

  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="passwordConfirm"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/account');
  return { email, password };
}

test.describe('Account Common Section - Happy Path', () => {
  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page }) => {
      await createAuthenticatedSession(page, 'test-common');
    });

    test('should render AccountLayout with AccountNav', async ({ page }) => {
      // Navigate to /account
      await page.goto('/account');

      // Verify AccountLayout is rendered
      const layout = page.locator('[data-testid="account-layout"]');
      await expect(layout).toBeVisible();

      // Verify AccountNav is rendered
      const nav = page.locator('[data-testid="account-nav"]');
      await expect(nav).toBeVisible();

      // Verify 4 navigation items are displayed
      const navItems = nav.locator('[data-testid="nav-item"]');
      await expect(navItems).toHaveCount(4);

      // Verify navigation item labels
      await expect(navItems.nth(0)).toContainText('マイページ');
      await expect(navItems.nth(1)).toContainText('サービス一覧');
      await expect(navItems.nth(2)).toContainText('設定');
      await expect(navItems.nth(3)).toContainText('サブスクリプション');

      // Verify current page (マイページ) is highlighted
      const activeItem = nav.locator('[data-testid="nav-item"][aria-current="page"]');
      await expect(activeItem).toBeVisible();
      await expect(activeItem).toContainText('マイページ');
    });

    test('should navigate between account pages', async ({ page }) => {
      await page.goto('/account');

      // Click on 設定 navigation item
      const nav = page.locator('[data-testid="account-nav"]');
      await nav.locator('text=設定').click();

      // Verify URL changed to /account/settings
      await expect(page).toHaveURL('/account/settings');

      // Verify 設定 is now highlighted
      const activeItem = nav.locator('[data-testid="nav-item"][aria-current="page"]');
      await expect(activeItem).toContainText('設定');
    });

    test('should display account index page with announcements and logout button', async ({ page }) => {
      await page.goto('/account');

      // Verify announcements section is displayed
      const announcementHeading = page.getByRole('heading', { name: 'お知らせ' });
      await expect(announcementHeading).toBeVisible();

      // Verify logout button is present
      const logoutButton = page.locator('[data-testid="logout-button"]');
      await expect(logoutButton).toBeVisible();
      await expect(logoutButton).toHaveClass(/btn-primary/);
      await expect(logoutButton).toHaveText('ログアウト');
    });

    test('should display services page with service links', async ({ page }) => {
      await page.goto('/account/services');

      // Verify page title is displayed
      const pageTitle = page.locator('h1:has-text("サービス一覧")');
      await expect(pageTitle).toBeVisible();

      // Verify blog service link is present (using ClaudeMix label from spec)
      const blogServiceLink = page.locator('[data-testid="service-link"]:has-text("ClaudeMix")');
      await expect(blogServiceLink).toBeVisible();
      await expect(blogServiceLink).toHaveClass(/btn-primary/);
      await expect(blogServiceLink).toHaveAttribute('href', '/blog');
    });

    test('should navigate to services page from navigation', async ({ page }) => {
      await page.goto('/account');

      // Click on サービス一覧 navigation item
      const nav = page.locator('[data-testid="account-nav"]');
      await nav.locator('text=サービス一覧').click();

      // Verify URL changed to /account/services
      await expect(page).toHaveURL('/account/services');

      // Verify サービス一覧 is now highlighted
      const activeItem = nav.locator('[data-testid="nav-item"][aria-current="page"]');
      await expect(activeItem).toContainText('サービス一覧');
    });
  });

  test.describe('Unauthenticated User', () => {
    test('should redirect to login with redirect-url parameter', async ({ page }) => {
      // Navigate to /account without authentication
      await page.goto('/account');

      // Verify redirected to /login with redirect-url parameter (URL-encoded)
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount$/);

      // Verify login page is displayed
      const loginForm = page.locator('form');
      await expect(loginForm).toBeVisible();
    });

    test('should redirect to login when accessing /account/settings', async ({ page }) => {
      // Navigate to /account/settings without authentication
      await page.goto('/account/settings');

      // Verify redirected to /login with redirect-url parameter (URL-encoded)
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount%2Fsettings$/);
    });

    test('should redirect to login when accessing /account/subscription', async ({ page }) => {
      // Navigate to /account/subscription without authentication
      await page.goto('/account/subscription');

      // Verify redirected to /login with redirect-url parameter (URL-encoded)
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount%2Fsubscription$/);
    });

    test('should redirect to login when accessing /account/services', async ({ page }) => {
      // Navigate to /account/services without authentication
      await page.goto('/account/services');

      // Verify redirected to /login with redirect-url parameter (URL-encoded)
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount%2Fservices$/);
    });
  });
});

test.describe('Common Components', () => {
  test.describe('FlashMessage', () => {
    test('should display flash message from URL parameter', async ({ page }) => {
      // Navigate with flash message URL parameter
      await page.goto('/login?message=session-expired');

      // Verify flash message is displayed
      const flashMessage = page.locator('[data-testid="flash-message"]');
      await expect(flashMessage).toBeVisible();
      await expect(flashMessage).toContainText('セッションの有効期限が切れました');

      // Verify flash message auto-closes after delay
      // Use Playwright's built-in waiting instead of fixed timeout
      await expect(flashMessage).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Modal', () => {
    test.beforeEach(async ({ page }) => {
      await createAuthenticatedSession(page, 'test-modal');
    });

    test('should open and close modal with focus trap', async ({ page }) => {
      // Navigate to settings page with modal triggers
      await page.goto('/account/settings');

      // Open modal (using email-change-button as test subject)
      const modalTrigger = page.locator('[data-testid="email-change-button"]');
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
