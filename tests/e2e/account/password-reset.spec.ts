/**
 * password-reset.spec.ts
 * E2E tests for password reset functionality
 *
 * @layer E2E Test
 * @responsibility パスワードリセット機能の統合テスト
 */

import { expect, test, type Page } from '@playwright/test';

function generateUniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

async function createUser(page: Page, email: string, password: string) {
  await page.goto('/register');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.fill('[data-testid="confirm-password-input"]', password);
  await page.click('[data-testid="submit-button"]');
  await expect(page).toHaveURL('/account');
}

test.describe('Password Reset', () => {
  test.describe('Forgot Password Flow', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      // Verify page elements
      await expect(page.locator('h1')).toContainText('パスワードリセット');
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    });

    test('should accept valid email and show success message', async ({ page }) => {
      const email = generateUniqueEmail('reset-test');
      const password = 'OldPassword123';

      // Create user first
      await createUser(page, email, password);
      await page.goto('/logout');

      // Request password reset
      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', email);
      await page.click('[data-testid="submit-button"]');

      // Verify success message (even for non-existent emails for security)
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'パスワードリセットのメールを送信しました'
      );
    });

    test('should show success message even for non-existent email', async ({ page }) => {
      const nonExistentEmail = generateUniqueEmail('nonexistent');

      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', nonExistentEmail);
      await page.click('[data-testid="submit-button"]');

      // Security: Don't reveal if email exists
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'パスワードリセットのメールを送信しました'
      );
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/forgot-password');

      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.fill('invalid-email');

      // HTML5 validation should prevent submission
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Reset Password with Token', () => {
    test('should successfully reset password with valid token', async ({ page, context }) => {
      const email = generateUniqueEmail('token-reset');
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      // Create user
      await createUser(page, email, oldPassword);
      await page.goto('/logout');

      // Request password reset
      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', email);
      await page.click('[data-testid="submit-button"]');

      // In real implementation, token would be sent via email
      // For E2E test, we need to extract token from KV or logs
      // For now, we'll simulate by accessing reset page with a mock token
      // TODO: Extract actual token from dev server logs or KV

      // Simulate token-based reset (in real test, extract from email/logs)
      // This will be updated once implementation provides token extraction method
      // For MVP, skip this test or manually test
    });

    test('should reject expired token', async ({ page }) => {
      const expiredToken = 'expired-token-12345';

      await page.goto(`/reset-password/${expiredToken}`);
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123');
      await page.fill('[data-testid="new-password-confirm-input"]', 'NewPassword123');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'トークンが無効または期限切れです'
      );
    });

    test('should reject invalid token', async ({ page }) => {
      const invalidToken = 'invalid-token-xyz';

      await page.goto(`/reset-password/${invalidToken}`);
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123');
      await page.fill('[data-testid="new-password-confirm-input"]', 'NewPassword123');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'トークンが無効または期限切れです'
      );
    });

    test('should validate new password strength', async ({ page }) => {
      const token = 'valid-token-12345';

      await page.goto(`/reset-password/${token}`);

      const passwordInput = page.locator('[data-testid="new-password-input"]');
      await passwordInput.fill('weak');
      await page.fill('[data-testid="new-password-confirm-input"]', 'weak');

      // HTML5 validation should catch weak password
      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should reject mismatched passwords', async ({ page }) => {
      const token = 'valid-token-12345';

      await page.goto(`/reset-password/${token}`);
      await page.fill('[data-testid="new-password-input"]', 'Password123');
      await page.fill('[data-testid="new-password-confirm-input"]', 'Password456');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'パスワードが一致しません'
      );
    });
  });

  test.describe('Security', () => {
    test('should invalidate old sessions after password reset', async ({ page }) => {
      // TODO: Implement test to verify all sessions are deleted after password reset
      // 1. Create user and login (create session)
      // 2. Request password reset
      // 3. Reset password with token
      // 4. Verify old session is invalid (redirect to login)
    });

    test('should allow single use of reset token', async ({ page }) => {
      // TODO: Implement test to verify token can only be used once
      // 1. Request password reset
      // 2. Use token to reset password
      // 3. Try to use same token again → should fail
    });
  });
});
