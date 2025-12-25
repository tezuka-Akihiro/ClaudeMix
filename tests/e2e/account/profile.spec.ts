/**
 * profile.spec.ts
 * E2E tests for account profile section
 *
 * @layer E2E Test
 * @responsibility プロフィール設定機能の統合テスト
 */

import { expect, test } from '@playwright/test';

test.describe('Account Profile Section', () => {
  test.describe('Profile Display', () => {
    test('should display user profile information', async ({ page }) => {
      // Setup: Create and login as test user
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'profile-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Verify profile display
      await expect(page.locator('[data-testid="profile-display"]')).toBeVisible();
      await expect(page.locator('text=profile-test@example.com')).toBeVisible();
      await expect(page.locator('[data-testid="email-change-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-change-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-account-button"]')).toBeVisible();
    });

    test('should require authentication to access profile', async ({ page }) => {
      // Try to access profile without login
      await page.goto('/account/settings');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login\?redirect-url=/);
    });
  });

  test.describe('Email Change', () => {
    test('should successfully change email', async ({ page }) => {
      // Setup: Create and login as test user
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'email-change@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open email change modal
      await page.click('[data-testid="email-change-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).toBeVisible();

      // Fill in new email and current password
      await page.fill('[data-testid="new-email-input"]', 'new-email@example.com');
      await page.fill('[data-testid="current-password-input"]', 'password123');

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=new-email@example.com')).toBeVisible();
    });

    test('should reject email change with incorrect password', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'email-change@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open email change modal
      await page.click('[data-testid="email-change-button"]');

      // Fill in new email with wrong password
      await page.fill('[data-testid="new-email-input"]', 'another@example.com');
      await page.fill('[data-testid="current-password-input"]', 'wrongpassword');

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'パスワードが正しくありません'
      );
    });

    test('should reject duplicate email', async ({ page }) => {
      // Setup: Create two users
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'user1@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');
      await page.goto('/logout');

      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'user2@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Try to change email to existing email
      await page.goto('/account/settings');
      await page.click('[data-testid="email-change-button"]');
      await page.fill('[data-testid="new-email-input"]', 'user1@example.com');
      await page.fill('[data-testid="current-password-input"]', 'password123');
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        '既に登録されています'
      );
    });

    test('should validate email format', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'user2@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Try to change to invalid email
      await page.goto('/account/settings');
      await page.click('[data-testid="email-change-button"]');
      await page.fill('[data-testid="new-email-input"]', 'invalid-email');
      await page.fill('[data-testid="current-password-input"]', 'password123');
      await page.click('[data-testid="save-button"]');

      // Verify validation error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe('Password Change', () => {
    test('should successfully change password', async ({ page }) => {
      // Setup: Create and login as test user
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'password-change@example.com');
      await page.fill('[data-testid="password-input"]', 'oldpassword');
      await page.fill('[data-testid="confirm-password-input"]', 'oldpassword');
      await page.click('[data-testid="submit-button"]');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open password change modal
      await page.click('[data-testid="password-change-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).toBeVisible();

      // Fill in password change form
      await page.fill('[data-testid="current-password-input"]', 'oldpassword');
      await page.fill('[data-testid="new-password-input"]', 'newpassword123');
      await page.fill('[data-testid="new-password-confirm-input"]', 'newpassword123');

      // Submit
      await page.click('[data-testid="save-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Verify can login with new password
      await page.goto('/logout');
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'password-change@example.com');
      await page.fill('[data-testid="password-input"]', 'newpassword123');
      await page.click('[data-testid="submit-button"]');
      await expect(page).toHaveURL('/account');
    });

    test('should reject password change with incorrect current password', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'password-change@example.com');
      await page.fill('[data-testid="password-input"]', 'newpassword123');
      await page.click('[data-testid="submit-button"]');

      // Try to change password with wrong current password
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', 'wrongpassword');
      await page.fill('[data-testid="new-password-input"]', 'anotherpassword');
      await page.fill('[data-testid="new-password-confirm-input"]', 'anotherpassword');
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'パスワードが正しくありません'
      );
    });

    test('should reject password change when new passwords do not match', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'password-change@example.com');
      await page.fill('[data-testid="password-input"]', 'newpassword123');
      await page.click('[data-testid="submit-button"]');

      // Try to change password with mismatched new passwords
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', 'newpassword123');
      await page.fill('[data-testid="new-password-input"]', 'password456');
      await page.fill('[data-testid="new-password-confirm-input"]', 'password789');
      await page.click('[data-testid="save-button"]');

      // Verify error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('一致しません');
    });

    test('should validate new password strength', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'password-change@example.com');
      await page.fill('[data-testid="password-input"]', 'newpassword123');
      await page.click('[data-testid="submit-button"]');

      // Try to change to weak password
      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await page.fill('[data-testid="current-password-input"]', 'newpassword123');
      await page.fill('[data-testid="new-password-input"]', 'weak');
      await page.fill('[data-testid="new-password-confirm-input"]', 'weak');
      await page.click('[data-testid="save-button"]');

      // Verify validation error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe('Account Deletion', () => {
    test('should successfully delete account', async ({ page }) => {
      // Setup: Create and login as test user
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'delete-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Navigate to profile settings
      await page.goto('/account/settings');

      // Open delete account modal
      await page.click('[data-testid="delete-account-button"]');
      await expect(page.locator('[data-testid="delete-account-modal"]')).toBeVisible();

      // Verify warning message
      await expect(page.locator('[data-testid="delete-account-modal"]')).toContainText(
        '削除すると元に戻せません'
      );

      // Fill in password and confirm
      await page.fill('[data-testid="current-password-input"]', 'password123');
      await page.check('[data-testid="confirmation-checkbox"]');

      // Submit deletion
      await page.click('[data-testid="delete-button"]');

      // Verify redirect to login page
      await expect(page).toHaveURL('/login');

      // Verify cannot login with deleted account
      await page.fill('[data-testid="email-input"]', 'delete-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        '正しくありません'
      );
    });

    test('should reject account deletion with incorrect password', async ({ page }) => {
      // Setup: Create and login as test user
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'nodelete-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Try to delete with wrong password
      await page.goto('/account/settings');
      await page.click('[data-testid="delete-account-button"]');
      await page.fill('[data-testid="current-password-input"]', 'wrongpassword');
      await page.check('[data-testid="confirmation-checkbox"]');
      await page.click('[data-testid="delete-button"]');

      // Verify error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'パスワードが正しくありません'
      );
    });

    test('should require confirmation checkbox', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'nodelete-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      // Try to delete without checking confirmation
      await page.goto('/account/settings');
      await page.click('[data-testid="delete-account-button"]');
      await page.fill('[data-testid="current-password-input"]', 'password123');
      // Don't check the confirmation checkbox
      await page.click('[data-testid="delete-button"]');

      // Verify error or button disabled
      const deleteButton = page.locator('[data-testid="delete-button"]');
      await expect(
        deleteButton.isDisabled().then((disabled) => disabled || page.locator('[data-testid="error-message"]').isVisible())
      ).resolves.toBeTruthy();
    });

    test('should allow canceling account deletion', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'nodelete-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

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
    test('should close email change modal on cancel', async ({ page }) => {
      // Setup: Login
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'modal-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      await page.goto('/account/settings');
      await page.click('[data-testid="email-change-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).toBeVisible();

      await page.click('[data-testid="cancel-button"]');
      await expect(page.locator('[data-testid="email-change-modal"]')).not.toBeVisible();
    });

    test('should close password change modal on cancel', async ({ page }) => {
      // Setup: Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'modal-test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="submit-button"]');

      await page.goto('/account/settings');
      await page.click('[data-testid="password-change-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).toBeVisible();

      await page.click('[data-testid="cancel-button"]');
      await expect(page.locator('[data-testid="password-change-modal"]')).not.toBeVisible();
    });
  });
});
