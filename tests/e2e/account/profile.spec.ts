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
import { extractTestId } from '~/spec-utils/extractTestId';

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
      await page.goto(spec.routes.settings.path);

      // Verify profile display
      await expect(page.getByTestId(extractTestId(spec.test.selectors.profile_display))).toBeVisible();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.email_change_button))).toBeVisible();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.password_change_button))).toBeVisible();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.delete_account_button))).toBeVisible();

      // Verify that "Expiry Date" label is present instead of "Registration Date"
      await expect(page.locator(`text=${spec.profile_display.sections.info.fields.subscription_expiry.label}`)).toBeVisible();
      await expect(page.locator('text=登録日')).not.toBeVisible();
    });

    test('should require authentication to access profile', async ({ page }) => {
      // Try to access profile without login
      await page.context().clearCookies();
      await page.goto(spec.routes.settings.path);

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
      await page.goto(spec.routes.settings.path);

      // Open email change modal
      await page.getByTestId(extractTestId(spec.test.selectors.email_change_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.email_change_modal))).toBeVisible();

      // Fill in new email and current password
      await page.getByTestId(extractTestId(spec.test.selectors.new_email_input)).fill(newEmail);
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(password);

      // Submit
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify success
      await expect(page.getByTestId(extractTestId(spec.test.selectors.success_message))).toBeVisible();
      await expect(page.locator(`text=${newEmail}`)).toBeVisible();
    });

    test('should reject email change with incorrect password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'email-reject', useTestId: true });

      // Navigate to profile settings
      await page.goto(spec.routes.settings.path);

      // Open email change modal
      await page.getByTestId(extractTestId(spec.test.selectors.email_change_button)).click();

      // Fill in new email with wrong password
      await page.getByTestId(extractTestId(spec.test.selectors.new_email_input)).fill('another@example.com');
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill('WrongPassword1');

      // Submit
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify error
      const modalError = page.getByTestId('modal-error-message');
      await expect(modalError).toBeVisible();
      await expect(modalError).toContainText(
        spec.validation.current_password.error_messages.incorrect
      );
    });

    test('should reject duplicate email', async ({ page }) => {
      // Setup: Create two users
      const { email: user1Email, password } = await createAuthenticatedUser(page, { prefix: 'user1', useTestId: true });
      await page.goto('/logout');

      await createAuthenticatedUser(page, { prefix: 'user2', useTestId: true });

      // Try to change email to existing email
      await page.goto(spec.routes.settings.path);
      await page.getByTestId(extractTestId(spec.test.selectors.email_change_button)).click();
      await page.getByTestId(extractTestId(spec.test.selectors.new_email_input)).fill(user1Email);
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(password);
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify error (email already exists)
      await expect(page.getByTestId('modal-error-message')).toContainText(
        spec.error_messages.email_change.email_exists
      );
    });

    test('should validate email format', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'email-format', useTestId: true });

      // Try to change to invalid email
      await page.goto(spec.routes.settings.path);
      await page.getByTestId(extractTestId(spec.test.selectors.email_change_button)).click();

      const emailInput = page.getByTestId(extractTestId(spec.test.selectors.new_email_input));
      await emailInput.fill('invalid-email');
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(password);

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
      await page.goto(spec.routes.settings.path);

      // Open password change modal
      await page.getByTestId(extractTestId(spec.test.selectors.password_change_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.password_change_modal))).toBeVisible();

      // Fill in password change form
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(oldPassword);
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_input)).fill(newPassword);
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_confirm_input)).fill(newPassword);

      // Submit
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify success
      await expect(page.getByTestId(extractTestId(spec.test.selectors.success_message))).toBeVisible();

      // Verify can login with new password
      await page.goto('/logout');
      await page.goto('/login');
      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill(newPassword);
      await page.getByTestId('submit-button').click();
      await expect(page).toHaveURL('/account');
    });

    test('should reject password change with incorrect current password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'password-reject', useTestId: true });

      // Try to change password with wrong current password
      await page.goto(spec.routes.settings.path);
      await page.getByTestId(extractTestId(spec.test.selectors.password_change_button)).click();
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill('Wrongpassword1');
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_input)).fill('AnotherPassword1');
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_confirm_input)).fill('AnotherPassword1');
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify error
      await expect(page.getByTestId('modal-error-message')).toContainText(
        spec.error_messages.password_change.incorrect_current
      );
    });

    test('should reject password change when new passwords do not match', async ({ page }) => {
      const { password } = await createAuthenticatedUser(page, { prefix: 'password-mismatch', useTestId: true });

      // Try to change password with mismatched new passwords
      await page.goto(spec.routes.settings.path);
      await page.getByTestId(extractTestId(spec.test.selectors.password_change_button)).click();
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(password);
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_input)).fill('Password456');
      await page.getByTestId(extractTestId(spec.test.selectors.new_password_confirm_input)).fill('Password789');
      await page.getByTestId(extractTestId(spec.test.selectors.save_button)).click();

      // Verify field error message for password mismatch
      await expect(page.locator('#new-password-confirm-error')).toContainText(
        spec.validation.new_password_confirm.error_messages.mismatch
      );
    });
  });

  test.describe('Account Deletion', () => {
    // Isolate tests that modify account state
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should successfully delete account', async ({ page }) => {
      const { email, password } = await createAuthenticatedUser(page, { prefix: 'delete-test', useTestId: true });

      // Navigate to profile settings
      await page.goto(spec.routes.settings.path);

      // Open delete account modal
      await page.getByTestId(extractTestId(spec.test.selectors.delete_account_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.delete_account_modal))).toBeVisible();

      // Verify warning message
      await expect(page.getByTestId(extractTestId(spec.test.selectors.delete_account_modal))).toContainText(
        spec.forms.delete_account.warning_message
      );

      // Fill in password and confirm
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill(password);
      await page.getByTestId(extractTestId(spec.test.selectors.confirmation_checkbox)).check();

      // Submit deletion
      await page.getByTestId(extractTestId(spec.test.selectors.delete_button)).click();

      // Verify redirect to login page
      await expect(page).toHaveURL('/login');

      // Verify cannot login with deleted account
      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill(password);
      await page.getByTestId('submit-button').click();
      // Should show invalid credentials error (user deleted)
      await expect(page.getByTestId(extractTestId(spec.test.selectors.error_message))).toBeVisible();
    });

    test('should reject account deletion with incorrect password', async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'nodelete-test', useTestId: true });

      // Try to delete with wrong password
      await page.goto(spec.routes.settings.path);
      await page.getByTestId(extractTestId(spec.test.selectors.delete_account_button)).click();
      await page.getByTestId(extractTestId(spec.test.selectors.current_password_input)).fill('WrongPassword1');
      await page.getByTestId(extractTestId(spec.test.selectors.confirmation_checkbox)).check();
      await page.getByTestId(extractTestId(spec.test.selectors.delete_button)).click();

      // Verify error
      await expect(page.getByTestId('modal-error-message')).toContainText(
        spec.error_messages.delete_account.incorrect_password
      );
    });
  });

  test.describe('Modal Interactions', () => {
    // Isolate from global setup to ensure stability
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await createAuthenticatedUser(page, { prefix: 'modal-test', useTestId: true });
    });

    test('should close email change modal on cancel', async ({ page }) => {
      await page.goto(spec.routes.settings.path);
      await expect(page.getByTestId(extractTestId(spec.test.selectors.profile_display))).toBeVisible();
      await page.getByTestId(extractTestId(spec.test.selectors.email_change_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.email_change_modal))).toBeVisible();

      await page.getByTestId(extractTestId(spec.test.selectors.cancel_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.email_change_modal))).not.toBeVisible();
    });

    test('should close password change modal on cancel', async ({ page }) => {
      await page.goto(spec.routes.settings.path);
      await expect(page.getByTestId(extractTestId(spec.test.selectors.profile_display))).toBeVisible();
      await page.getByTestId(extractTestId(spec.test.selectors.password_change_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.password_change_modal))).toBeVisible();

      await page.getByTestId(extractTestId(spec.test.selectors.cancel_button)).click();
      await expect(page.getByTestId(extractTestId(spec.test.selectors.password_change_modal))).not.toBeVisible();
    });
  });
});
