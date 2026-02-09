/**
 * password-reset.spec.ts
 * E2E tests for password reset functionality
 *
 * @layer E2E Test
 * @responsibility パスワードリセット機能の統合テスト
 */

import { expect, test, type Page } from '@playwright/test';
import { createAuthenticatedUser, generateUniqueEmail } from '../../utils/auth-helper';
import { loadSpec, type AccountAuthenticationSpec } from '../../utils/loadSpec';
import { extractTestId } from '~/lib/utils/extractTestId';

test.describe('Password Reset', () => {
  let spec: AccountAuthenticationSpec;

  test.beforeAll(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');
  });

  // Ensure unauthenticated state for password reset flows
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Forgot Password Flow', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto(spec.routes.forgot_password.path);

      // Verify page elements
      await expect(page.locator('h1')).toContainText(spec.forms.forgot_password.title);
      await expect(page.getByTestId(extractTestId(spec.test.selectors.email_input))).toBeVisible();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.submit_button))).toBeVisible();
    });

    test('should accept valid email and show success message', async ({ page }) => {
      const email = generateUniqueEmail('reset-test');
      const password = 'OldPassword123';

      // Create user first
      await createAuthenticatedUser(page, { email, password });
      await page.goto(spec.routes.logout.path);

      // Request password reset
      await page.goto(spec.routes.forgot_password.path);
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(email);
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Verify success message (even for non-existent emails for security)
      const successMessage = page.getByTestId('success-message');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText(spec.forms.forgot_password.success_message);
    });

    test('should show success message even for non-existent email', async ({ page }) => {
      const nonExistentEmail = generateUniqueEmail('nonexistent');

      await page.goto(spec.routes.forgot_password.path);
      await page.getByTestId(extractTestId(spec.test.selectors.email_input)).fill(nonExistentEmail);
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      // Security: Don't reveal if email exists
      const successMessage = page.getByTestId('success-message');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText(spec.forms.forgot_password.success_message);
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(spec.routes.forgot_password.path);

      const emailInput = page.getByTestId(extractTestId(spec.test.selectors.email_input));
      await emailInput.fill('invalid-email');

      // HTML5 validation should prevent submission
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Reset Password with Token', () => {
    test('should reject expired token', async ({ page }) => {
      const expiredToken = 'expired-token-12345';

      await page.goto(`/reset-password/${expiredToken}`);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('NewPassword123');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('NewPassword123');
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      await expect(page.getByTestId(extractTestId(spec.test.selectors.error_message))).toContainText(
        spec.error_messages.password_reset.token_expired
      );
    });

    test('should reject invalid token', async ({ page }) => {
      const invalidToken = 'invalid-token-xyz';

      await page.goto(`/reset-password/${invalidToken}`);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('NewPassword123');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('NewPassword123');
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      await expect(page.getByTestId(extractTestId(spec.test.selectors.error_message))).toContainText(
        spec.error_messages.password_reset.token_expired
      );
    });

    test('should validate new password strength', async ({ page }) => {
      const token = 'valid-token-12345';

      await page.goto(`/reset-password/${token}`);

      const passwordInput = page.getByTestId(extractTestId(spec.test.selectors.password_input));
      await passwordInput.fill('weak');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('weak');

      // HTML5 validation should catch weak password
      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should reject mismatched passwords', async ({ page }) => {
      const token = 'valid-token-12345';

      await page.goto(`/reset-password/${token}`);
      await page.getByTestId(extractTestId(spec.test.selectors.password_input)).fill('Password123');
      await page.getByTestId(extractTestId(spec.test.selectors.password_confirm_input)).fill('Password456');
      await page.getByTestId(extractTestId(spec.test.selectors.submit_button)).click();

      await expect(page.getByTestId(extractTestId(spec.test.selectors.error_message))).toContainText(
        spec.validation.password_confirm.error_messages.mismatch
      );
    });
  });
});
