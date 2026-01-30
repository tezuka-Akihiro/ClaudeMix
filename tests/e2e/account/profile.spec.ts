/**
 * profile.spec.ts
 * E2E tests for account profile section
 *
 * @layer E2E Test
 * @responsibility プロフィール設定機能の統合テスト
 */

import { expect, test, type Page } from '@playwright/test';
import { loadSpec, type AccountProfileSpec } from '../../utils/loadSpec';
import { createAuthenticatedUser, generateUniqueEmail } from '../../utils/auth-helper';

// Spec cache for test suite
let spec: AccountProfileSpec;

test.beforeAll(async () => {
  spec = await loadSpec<AccountProfileSpec>('account', 'profile');
});

test.describe('Account Profile Section', () => {
  test.describe('Profile Display', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display user profile information', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'profile-display', useTestId: true });

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Verify profile display
      await expect(page.locator('[data-testid="profile-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-change-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-change-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-account-button"]')).toBeVisible();
    });

    test('should require authentication to access profile', async ({ page }) => {
      // Try to access profile without login
      await page.context().clearCookies();
      await page.goto('/account/settings');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login\?redirect-url=/);
    });
  });

  test.describe('Email Change', () => {
    // Isolate tests that modify account state
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should successfully change email', async ({ page }) => {
      const { email, password } = await createAuthenticatedUser(page, { prefix: 'email-change', useTestId: true });
      const newEmail = generateUniqueEmail('new-email');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open email change modal
      await page.click('[data-testid="email-change-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).toBeVisible();

      // Fill in new email and current password
      await page.fill('[data-testid="new-email-input"]', newEmail);
      await page.fill('[data-testid="current-password-input"]', password);

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator(`text=${newEmail}`)).toBeVisible();
    });

    test('should reject email change with incorrect password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'email-reject', useTestId: true });

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open email change modal
      await page.click('[data-testid="email-change-button"]');

      // Fill in new email with wrong password
      await page.fill('[data-testid="new-email-input"]', 'another@example.com');
      await page.fill('[data-testid="current-password-input"]', 'WrongPassword1');

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="modal-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="modal-error-message"]')).toContainText(
        spec.validation.current_password.error_messages.incorrect
      );
    });

    test('should reject duplicate email', async ({ page }) => {
      // Setup: Create two users
      const { email: user1Email, password } = await createAuthenticatedUser(page, { prefix: 'user1', useTestId: true });
      await page.goto('/logout');

      await createAuthenticatedUser(page, { prefix: 'user2', useTestId: true });

      // Try to change email to existing email
      await page.goto('/account/settings');
      await page.click('[data-testid="email-change-button"]');
      await page.fill('[data-testid="new-email-input"]', user1Email);
      await page.fill('[data-testid="current-password-input"]', password);
      await page.click('[data-testid="save-button"]');

      // Verify error (email already exists)
      await expect(page.locator('[data-testid="modal-error-message"]')).toContainText(
        spec.error_messages.email_change.email_exists
      );
    });

    test('should validate email format', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'email-format', useTestId: true });

      // Try to change to invalid email
      await page.goto('/account/settings');
      await page.click('[data-testid="email-change-button"]');

      const emailInput = page.locator('[data-testid="new-email-input"]');
      await emailInput.fill('invalid-email');
      await page.fill('[data-testid="current-password-input"]', password);

      // Verify HTML5 validation prevents submission
      // Check if input is marked as invalid
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Password Change', () => {
    // Isolate tests that modify account state
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should successfully change password', async ({ page }) => {
      const { email, password: oldPassword } = await createAuthenticatedUser(page, { prefix: 'password-change', useTestId: true });
      const newPassword = 'NewPassword123';

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open password change modal
      await page.click('[data-testid="password-change-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).toBeVisible();

      // Fill in password change form
      await page.fill('[data-testid="current-password-input"]', oldPassword);
      await page.fill('[data-testid="new-password-input"]', newPassword);
      await page.fill('[data-testid="new-password-confirm-input"]', newPassword);

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Verify can login with new password
      await page.goto('/logout');
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', newPassword);
      await page.click('[data-testid="submit-button"]');
      await expect(page).toHaveURL('/account');
    });

    test('should reject password change with incorrect current password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'password-reject', useTestId: true });

      // Try to change password with wrong current password
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', 'Wrongpassword1');
      await page.fill('[data-testid="new-password-input"]', 'AnotherPassword1');
      await page.fill('[data-testid="new-password-confirm-input"]', 'AnotherPassword1');
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="modal-error-message"]')).toContainText(
        spec.error_messages.password_change.incorrect_current
      );
    });

    test('should reject password change when new passwords do not match', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'password-mismatch', useTestId: true });

      // Try to change password with mismatched new passwords
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', password);
      await page.fill('[data-testid="new-password-input"]', 'Password456');
      await page.fill('[data-testid="new-password-confirm-input"]', 'Password789');
      await page.click('[data-testid="save-button"]');

      // Verify field error message for password mismatch
      await expect(page.locator('#new-password-confirm-error')).toContainText(
        spec.validation.new_password_confirm.error_messages.mismatch
      );
    });

    test('should validate new password strength', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'password-weak', useTestId: true });

      // Try to change to weak password
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', password);
      await page.fill('[data-testid="new-password-input"]', 'weak');
      await page.fill('[data-testid="new-password-confirm-input"]', 'weak');
      await page.click('[data-testid="save-button"]');

      // Verify field validation error for weak password
      await expect(page.locator('#new-password-error')).toBeVisible();
    });
  });

  test.describe('Account Deletion', () => {
    // Isolate tests that modify account state
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should successfully delete account', async ({ page }) => {
      const { email, password } = await createAuthenticatedUser(page, { prefix: 'delete-test', useTestId: true });

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open delete account modal
      await page.click('[data-testid="delete-account-button"]');
      await expect(page.locator('[data-testid="delete-account-modal"]')).toBeVisible();

      // Verify warning message
      await expect(page.locator('[data-testid="delete-account-modal"]')).toContainText(
        spec.forms.delete_account.warning_message
      );

      // Fill in password and confirm
      await page.fill('[data-testid="current-password-input"]', password);
      await page.check('[data-testid="confirmation-checkbox"]');

      // Submit deletion
      await page.click('[data-testid="delete-button"]');

      // Verify redirect to login page
      await expect(page).toHaveURL('/login');

      // Verify cannot login with deleted account
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', password);
      await page.click('[data-testid="submit-button"]');
      // Should show invalid credentials error (user deleted)
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should reject account deletion with incorrect password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'nodelete-test', useTestId: true });

      // Try to delete with wrong password
      await page.goto('/account/settings');
      await page.click('[data-testid="delete-account-button"]');
      await page.fill('[data-testid="current-password-input"]', 'WrongPassword1');
      await page.check('[data-testid="confirmation-checkbox"]');
      await page.click('[data-testid="delete-button"]');

      // Verify error
      await expect(page.locator('[data-testid="modal-error-message"]')).toContainText(
        spec.error_messages.delete_account.incorrect_password
      );
    });

    test('should require confirmation checkbox', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'delete-checkbox', useTestId: true });

      // Try to delete without checking confirmation
      await page.goto('/account/settings');
      await page.click('[data-testid="delete-account-button"]');
      await page.fill('[data-testid="current-password-input"]', password);

      // Verify checkbox is required (HTML5 validation will prevent submission)
      const confirmationCheckbox = page.locator('[data-testid="confirmation-checkbox"]');
      const isRequired = await confirmationCheckbox.evaluate((el: HTMLInputElement) => el.required);
      expect(isRequired).toBe(true);

      // Verify checkbox is not checked
      const isChecked = await confirmationCheckbox.isChecked();
      expect(isChecked).toBe(false);
    });

    test('should allow canceling account deletion', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'delete-cancel', useTestId: true });

      // Open delete modal
      await page.goto('/account/settings');
      await page.click('[data-testid="delete-account-button"]');
      await expect(page.locator('[data-testid="delete-account-modal"]')).toBeVisible();

      // Cancel
      await page.click('[data-testid="cancel-button"]');

      // Verify modal closed and still on settings page
      await expect(page.locator('[data-testid="delete-account-modal"]')).not.toBeVisible();
      await expect(page).toHaveURL('/account/settings');
    });
  });

  test.describe('Modal Interactions', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'modal-test', useTestId: true });
    });

    test('should close email change modal on cancel', async ({ page }) => {
      await page.goto('/account/settings');
      await expect(page.locator('[data-testid="profile-display"]')).toBeVisible();
      await page.click('[data-testid="email-change-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).toBeVisible();

      await page.click('[data-testid="cancel-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).not.toBeVisible();
    });

    test('should close password change modal on cancel', async ({ page }) => {
      await page.goto('/account/settings');
      await expect(page.locator('[data-testid="profile-display"]')).toBeVisible();
      await page.click('[data-testid="password-change-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).toBeVisible();

      await page.click('[data-testid="cancel-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).not.toBeVisible();
    });
  });
});
