import { test, expect } from '@playwright/test';

/**
 * E2E Test: Account Authentication Section
 *
 * Purpose: Define the end goal for authentication implementation
 * - User registration flow
 * - User login flow
 * - User logout flow
 * - Authentication state management
 */

test.describe('Account Authentication - Happy Path', () => {
  test.describe('User Registration', () => {
    test('should display registration form', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Verify page title
      await expect(page).toHaveTitle(/会員登録/);

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

      const passwordConfirmInput = page.locator('input[name="passwordConfirm"]');
      await expect(passwordConfirmInput).toBeVisible();
      await expect(passwordConfirmInput).toHaveAttribute('type', 'password');

      // Verify submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText('登録する');
    });

    test.skip('should register new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Fill in registration form
      await page.fill('input[name="email"]', 'newuser@example.com');
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

    test.skip('should show error when passwords do not match', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Fill in registration form with mismatched passwords
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="passwordConfirm"]', 'DifferentPassword123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('パスワードが一致しません');
    });
  });

  test.describe('User Login', () => {
    test('should display login form', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Verify page title
      await expect(page).toHaveTitle(/ログイン/);

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
      await expect(submitButton).toContainText('ログイン');
    });

    test.skip('should login existing user successfully', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Fill in login form
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'Password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify redirect to account page
      await expect(page).toHaveURL('/account');

      // Verify user is authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
    });

    test.skip('should show error when credentials are invalid', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');

      // Fill in login form with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('メールアドレスまたはパスワードが正しくありません');
    });

    test.skip('should redirect to original page after login', async ({ page }) => {
      // Try to access protected page without authentication
      await page.goto('/account/settings');

      // Verify redirect to login with redirect-url parameter
      await expect(page).toHaveURL('/login?redirect-url=/account/settings');

      // Login
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.click('button[type="submit"]');

      // Verify redirect to original page
      await expect(page).toHaveURL('/account/settings');
    });
  });

  test.describe('User Logout', () => {
    test.skip('should logout user successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/account');

      // Navigate to logout
      await page.goto('/logout');

      // Verify redirect to login page
      await expect(page).toHaveURL('/login');

      // Try to access protected page
      await page.goto('/account');

      // Verify redirect to login (session destroyed)
      await expect(page).toHaveURL('/login?redirect-url=/account');
    });
  });

  test.describe('Authentication State Persistence', () => {
    test.skip('should persist session across page reloads', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/account');

      // Reload page
      await page.reload();

      // Verify still authenticated
      const accountLayout = page.locator('[data-testid="account-layout"]');
      await expect(accountLayout).toBeVisible();
      await expect(page).toHaveURL('/account');
    });
  });
});
