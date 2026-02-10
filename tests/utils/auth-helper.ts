import { type Page, expect } from '@playwright/test';

/**
 * Generates a unique email address for testing
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Creates an authenticated user session by registering a new user
 */
export async function createAuthenticatedUser(
  page: Page,
  options: {
    prefix?: string;
    email?: string;
    password?: string;
    useTestId?: boolean;
  } = {}
) {
  const {
    prefix = 'user',
    email = options.email || generateUniqueEmail(prefix),
    password = 'Password123',
    useTestId = false,
  } = options;

  await page.goto('/register');

  if (useTestId) {
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.fill('[data-testid="confirm-password-input"]', password);
    await page.click('[data-testid="submit-button"]');
  } else {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="passwordConfirm"]', password);
    await page.click('button[type="submit"]');
  }

  await expect(page).toHaveURL('/account');
  return { email, password };
}
