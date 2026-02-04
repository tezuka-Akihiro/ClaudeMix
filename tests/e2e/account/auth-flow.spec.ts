import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (Remix Auth)', () => {
  test('should show login page with Google button and without Apple button', async ({ page }) => {
    await page.goto('/login');

    // Google button should exist
    const googleButton = page.getByRole('button', { name: /Google/i });
    await expect(googleButton).toBeVisible();

    // Apple button should NOT exist
    const appleButton = page.getByRole('button', { name: /Apple/i });
    await expect(appleButton).not.toBeVisible();
  });

  test('should be able to register a new user via Form', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード', { exact: true }).fill('Password123!');
    await page.getByLabel('パスワード確認').fill('Password123!');

    await page.getByRole('button', { name: '登録する' }).click();

    // Should redirect to account page
    await expect(page).toHaveURL('/account');
    await expect(page.getByText('マイページ')).toBeVisible();
  });

  test('should be able to logout and then login via Form', async ({ page }) => {
    // Note: Assuming a user is created in previous test or using a seed
    const email = 'test-auth-flow@example.com';
    const password = 'Password123!';

    // 1. Register
    await page.goto('/register');
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード', { exact: true }).fill(password);
    await page.getByLabel('パスワード確認').fill(password);
    await page.getByRole('button', { name: '登録する' }).click();
    await expect(page).toHaveURL('/account');

    // 2. Logout
    await page.goto('/account');
    await page.getByRole('link', { name: 'ログアウト' }).click();
    await expect(page).toHaveURL('/login');

    // 3. Login
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/account');
  });
});
