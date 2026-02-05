import { test, expect } from '@playwright/test';
import { generateUniqueEmail } from '../utils/auth-helper';

/**
 * E2E Test: Authentication and Legal Pages
 *
 * Purpose: Verify that the core authentication flows and mandatory legal pages
 * are functional and correctly integrated with the new architecture.
 */

test.describe('Authentication Flow', () => {
  // Ensure we start with a clean state for each test
  test.use({ storageState: { cookies: [], origins: [] } });

  test('User Registration Success', async ({ page }) => {
    await page.goto('/register');

    const email = generateUniqueEmail('auth-e2e');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="confirm-password-input"]', 'Password123!');

    await page.click('[data-testid="submit-button"]');

    // Should redirect to account dashboard
    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator('[data-testid="account-layout"]')).toBeVisible();
  });

  test('User Login Success', async ({ page }) => {
    const email = generateUniqueEmail('login-e2e');
    const password = 'Password123!';

    // Step 1: Register
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.fill('[data-testid="confirm-password-input"]', password);
    await page.click('[data-testid="submit-button"]');
    await expect(page).toHaveURL(/\/account/);

    // Step 2: Logout
    await page.goto('/logout');
    await expect(page).toHaveURL('/login');

    // Step 3: Login
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="submit-button"]');

    // Should redirect back to account
    await expect(page).toHaveURL(/\/account/);
  });

  test('User Login Failure (Invalid Credentials)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123');
    await page.click('[data-testid="submit-button"]');

    // Should stay on login and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('Protected Route Access Denied', async ({ page }) => {
    // Attempt to access account without login
    await page.goto('/account');

    // Should redirect to login with redirect-url param
    await expect(page).toHaveURL(/\/login\?redirect-url/);
  });

  test('User Logout', async ({ page }) => {
    // Register and login first
    await page.goto('/register');
    const email = generateUniqueEmail('logout-e2e');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
    await page.click('[data-testid="submit-button"]');
    await expect(page).toHaveURL(/\/account/);

    // Logout
    await page.goto('/logout');
    await expect(page).toHaveURL('/login');

    // Verify session is gone by trying to go back to /account
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login\?redirect-url/);
  });
});

test.describe('Legal Pages', () => {
  test('Special Commercial Laws (特商法) is accessible via Landing Page Footer', async ({ page }) => {
    // Go to landing page
    await page.goto('/blog/landing/engineer');

    // Scroll to footer
    const footerLink = page.getByRole('button', { name: '特商法' });
    await footerLink.scrollIntoViewIfNeeded();
    await footerLink.click();

    // Verify modal content
    await expect(page.locator('h2')).toContainText('特商法');
    await expect(page.getByText('事業者名（販売者名）')).toBeVisible();
  });

  test('Terms of Service page is accessible', async ({ page }) => {
    await page.goto('/terms');
    // Basic check for content (handled via redirect to blog)
    await expect(page.locator('h1')).toContainText('利用規約');
  });

  test('Privacy Policy page is accessible', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('プライバシーポリシー');
  });
});
