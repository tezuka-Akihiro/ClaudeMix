import { test, expect, type Page } from '@playwright/test';
import { loadSpec, type AccountAuthenticationSpec } from '../../utils/loadSpec';
import { createAuthenticatedUser, generateUniqueEmail } from '../../utils/auth-helper';
import { extractTestId } from '~/lib/utils/extractTestId';

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
      await page.goto(spec.routes.register.path);

      // Verify page title (contains registration title)
      const titlePattern = new RegExp(spec.routes.register.title);
      await expect(page).toHaveTitle(titlePattern);

      // Verify form is displayed
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Verify form fields
      const emailInput = page.getByTestId(extractTestId(spec.test.selectors.email_input));
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = page.getByTestId(extractTestId(spec.test.selectors.password_input));
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const confirmPasswordInput = page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input));
      await expect(confirmPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Verify submit button
      const submitButton = page.getByTestId(extractTestId(spec.test.selectors.submit_button));
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(spec.forms.register.submit_button.label);
    });

    test('should register new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto(spec.routes.register.path);

      // Fill in registration form with unique email
      const email = generateUniqueEmail('newuser');
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('Password123');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('Password123');

      // Submit form
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Verify redirect to account page
      await expect(page).toHaveURL(spec.server_io.action.default_redirect);

      // Verify user is authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      // Navigate to registration page
      await page.goto(spec.routes.register.path);

      // Fill in registration form with mismatched passwords
      const email = generateUniqueEmail('mismatch');
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('Password123');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('DifferentPassword123');

      // Submit form
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Verify error message is displayed
      const errorMessage = page.getByTestId(extractTestId(spec.test.selectors.error_message)).first();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.validation.password_confirm.error_messages.mismatch);
    });
  });

  test.describe('User Login', () => {
    // Ensure unauthenticated state for login tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display login form', async ({ page }) => {
      // Navigate to login page
      await page.goto(spec.routes.login.path);

      // Verify page title (contains login title)
      const loginTitlePattern = new RegExp(spec.routes.login.title);
      await expect(page).toHaveTitle(loginTitlePattern);

      // Verify form is displayed
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Verify form fields
      const emailInput = page.getByTestId(extractTestId(spec.test.selectors.email_input));
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = page.getByTestId(extractTestId(spec.test.selectors.password_input));
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Verify submit button
      const submitButton = page.getByTestId(extractTestId(spec.test.selectors.submit_button));
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(spec.forms.login.submit_button.label);
    });

    test('should login existing user successfully', async ({ page }) => {
      // First, register a new user
      const email = generateUniqueEmail('logintest');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Logout
      await page.goto(spec.routes.logout.path);
      await expect(page).toHaveURL(spec.routes.logout.redirect_after);

      // Now test login
      await page.goto(spec.routes.login.path);
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill(password);

      // Submit form
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Verify redirect to account page
      await expect(page).toHaveURL(spec.server_io.action.default_redirect);

      // Verify user is authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
    });

    test('should show error when credentials are invalid', async ({ page }) => {
      // Navigate to login page
      await page.goto(spec.routes.login.path);

      // Fill in login form with invalid credentials (non-existent user)
      const email = generateUniqueEmail('nonexistent');
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('Wrong123');

      // Submit form
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Verify error message is displayed
      const errorMessage = page.getByTestId(extractTestId(spec.test.selectors.error_message));
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.error_messages.authentication.invalid_credentials);
    });

    test('should redirect to original page after login', async ({ page }) => {
      // First, register a user
      const email = generateUniqueEmail('redirect');
      const password = 'Password123';
      await createAuthenticatedUser(page, { email, password });

      // Logout
      await page.goto(spec.routes.logout.path);

      // Try to access protected page without authentication
      await page.goto('/account/settings');

      // Verify redirect to login with redirect-url parameter
      const expectedUrlPattern = new RegExp(`${spec.routes.login.path}\\?${spec.routes.login.redirect_param}=%2Faccount%2Fsettings$`);
      await expect(page).toHaveURL(expectedUrlPattern);

      // Login
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('Password123');
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

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
      await page.goto(spec.routes.logout.path);

      // Verify redirect to login page
      await expect(page).toHaveURL(spec.routes.logout.redirect_after);

      // Try to access protected page
      await page.goto('/account');

      // Verify redirect to login (session destroyed, URL-encoded)
      const expectedUrlPattern = new RegExp(`${spec.routes.login.path}\\?${spec.routes.login.redirect_param}=%2Faccount$`);
      await expect(page).toHaveURL(expectedUrlPattern);
    });
  });

  test.describe('Google OAuth Authentication', () => {
    // Ensure unauthenticated state for OAuth tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display Google login button on login page', async ({ page }) => {
      // Navigate to login page
      await page.goto(spec.routes.login.path);

      // Verify Google login button is displayed
      const googleButton = page.locator('[data-testid="google-login-button"]');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toContainText('Google');

      // Verify button links to /auth/google with redirect-url parameter
      const href = await googleButton.getAttribute('href');
      expect(href).toContain(`/auth/google?${spec.routes.login.redirect_param}=`);
    });

    test('should not display Apple login button on login page', async ({ page }) => {
      // Navigate to login page
      await page.goto(spec.routes.login.path);

      // Verify Apple login button is NOT displayed (removed)
      const appleButton = page.locator('[data-testid="apple-login-button"]');
      await expect(appleButton).not.toBeVisible();
    });

    test('should redirect to login with error when CSRF state mismatch', async ({ page }) => {
      // Simulate callback with mismatched state (no oauth_state cookie set)
      await page.goto(`/auth/callback/google?code=test_code&state=invalid_state`);

      // Verify redirect to login with error
      await expect(page).toHaveURL(new RegExp(`${spec.routes.login.path}\\?error=csrf-detected`));
    });

    test('should redirect to login with error when OAuth params missing', async ({ page }) => {
      // Simulate callback without required parameters
      await page.goto(`/auth/callback/google`);

      // Verify redirect to login with error
      await expect(page).toHaveURL(new RegExp(`${spec.routes.login.path}\\?error=oauth-invalid`));
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
      await expect(page).toHaveURL(spec.server_io.action.default_redirect);
    });
  });
});
