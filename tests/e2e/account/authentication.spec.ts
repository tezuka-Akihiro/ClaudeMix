import { test, expect, type Page } from '@playwright/test';
import { getAuthenticationSpec } from '../helpers/specHelper';

/**
 * E2E Test: Account Authentication Section
 *
 * Purpose: Define the end goal for authentication implementation
 * - User registration flow
 * - User login flow
 * - User logout flow
 * - Authentication state management
 */

// Load spec for assertions
const spec = getAuthenticationSpec();

// Helper function to generate unique email addresses for each test run
function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

async function registerUser(page: Page, email: string, password = 'Password123') {
  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/account');
}

test.describe('Account Authentication - Happy Path', () => {
  test.describe('User Registration', () => {
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

      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
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
      await page.fill('input[name="confirmPassword"]', 'Password123');

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
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.validation.password_confirm.error_messages.mismatch);
    });
  });

  test.describe('User Login', () => {
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
      await registerUser(page, email, password);

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
      await page.fill('input[name="password"]', 'WrongPassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(spec.error_messages.login.invalid_credentials);
    });

    test('should redirect to original page after login', async ({ page }) => {
      // First, register a user
      const email = generateUniqueEmail('redirect');
      const password = 'Password123';
      await registerUser(page, email, password);

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
    test('should logout user successfully', async ({ page }) => {
      // Register and login first
      const email = generateUniqueEmail('logout');
      const password = 'Password123';
      await registerUser(page, email, password);

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

  test.describe('Authentication State Persistence', () => {
    test('should persist session across page reloads', async ({ page }) => {
      // Register and login
      const email = generateUniqueEmail('persistence');
      const password = 'Password123';
      await registerUser(page, email, password);

      // Reload page
      await page.reload();

      // Verify still authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
      await expect(page).toHaveURL('/account');
    });
  });
});
