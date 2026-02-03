import { test, expect, type Page } from '@playwright/test';
import { loadSpec, type AccountAuthenticationSpec } from '../../utils/loadSpec';
import { createAuthenticatedUser, generateUniqueEmail } from '../../utils/auth-helper';

/**
 * E2E Test: Account Authentication Section
 *
 * Purpose: Define the end goal for authentication implementation
 * - User registration flow
 * - User login flow
 * - User logout flow
 * - Authentication state management
 */

// Spec cache for test suite
let spec: AccountAuthenticationSpec;

test.beforeAll(async () => {
  spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');
});


test.describe('Account Authentication - Happy Path', () => {
  test.describe('User Registration', () => {
    // Ensure unauthenticated state for registration tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display registration form', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Verify page title (contains registration title)
      const titlePattern = new RegExp(spec.routes.register.title);
      await expect(page).toHaveTitle(titlePattern);

      // Verify form is displayed
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Verify form fields
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const confirmPasswordInput = page.locator('input[name="passwordConfirm"]');
      await expect(confirmPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Verify submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(spec.forms.register.submit_button.label);
    });

    test('should register new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Fill in registration form with unique email
      const email = generateUniqueEmail('newuser');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="passwordConfirm"]', 'Password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify redirect to account page
      await expect(page).toHaveURL('/account');

      // Verify user is authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Fill in registration form with mismatched passwords
      const email = generateUniqueEmail('mismatch');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="passwordConfirm"]', 'DifferentPassword123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.validation.password_confirm.error_messages.mismatch);
    });
  });

  test.describe('User Login', () => {
    // Ensure unauthenticated state for login tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display login form', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Verify page title (contains login title)
      const loginTitlePattern = new RegExp(spec.routes.login.title);
      await expect(page).toHaveTitle(loginTitlePattern);

      // Verify form is displayed
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Verify form fields
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Verify submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(spec.forms.login.submit_button.label);
    });

    test('should login existing user successfully', async ({ page }) => {
      // First, register a new user
      const email = generateUniqueEmail('logintest');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Logout
      await page.goto('/logout');
      await expect(page).toHaveURL('/login');

      // Now test login
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);

      // Submit form
      await page.click('button[type="submit"]');

      // Verify redirect to account page
      await expect(page).toHaveURL('/account');

      // Verify user is authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
    });

    test('should show error when credentials are invalid', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Fill in login form with invalid credentials (non-existent user)
      const email = generateUniqueEmail('nonexistent');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Wrong123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.error_messages.authentication.invalid_credentials);
    });

    test('should redirect to original page after login', async ({ page }) => {
      // First, register a user
      const email = generateUniqueEmail('redirect');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Logout
      await page.goto('/logout');

      // Try to access protected page without authentication
      await page.goto('/account/settings');

      // Verify redirect to login with redirect-url parameter
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount%2Fsettings$/);

      // Login
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123');
      await page.click('button[type="submit"]');

      // Verify redirect to original page
      await expect(page).toHaveURL('/account/settings');
    });
  });

  test.describe('User Logout', () => {
    // Isolate logout test to prevent invalidating the global session
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should logout user successfully', async ({ page }) => {
      // Create a dedicated user for this test
      const email = generateUniqueEmail('logout');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Navigate to logout
      await page.goto('/logout');

      // Verify redirect to login page
      await expect(page).toHaveURL('/login');

      // Try to access protected page
      await page.goto('/account');

      // Verify redirect to login (session destroyed, URL-encoded)
      await expect(page).toHaveURL(/\/login\?redirect-url=%2Faccount$/);
    });
  });

  test.describe('Google OAuth Authentication', () => {
    // Ensure unauthenticated state for OAuth tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display Google login button on login page', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Verify Google login button is displayed
      const googleButton = page.locator('[data-testid="google-login-button"]');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toContainText('Google');

      // Verify button links to /auth/google
      await expect(googleButton).toHaveAttribute('href', '/auth/google');
    });

    test('should not display Apple login button on login page', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Verify Apple login button is NOT displayed (removed)
      const appleButton = page.locator('[data-testid="apple-login-button"]');
      await expect(appleButton).not.toBeVisible();
    });

    test('should redirect to login with error when CSRF state mismatch', async ({ page }) => {
      // Simulate callback with mismatched state (no oauth_state cookie set)
      await page.goto('/auth/callback/google?code=test_code&state=invalid_state');

      // Verify redirect to login with error
      await expect(page).toHaveURL(/\/login\?error=csrf-detected/);
    });

    test('should redirect to login with error when OAuth params missing', async ({ page }) => {
      // Simulate callback without required parameters
      await page.goto('/auth/callback/google');

      // Verify redirect to login with error
      await expect(page).toHaveURL(/\/login\?error=oauth-invalid/);
    });
  });

  test.describe('Authentication State Persistence', () => {
    // Use isolated session to verify persistence mechanism works for a fresh login
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should persist session across page reloads', async ({ page }) => {
      // Register and login
      const email = generateUniqueEmail('persistence');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Reload page
      await page.reload();

      // Verify still authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
      await expect(page).toHaveURL('/account');
    });
  });
});
