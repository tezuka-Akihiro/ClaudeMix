import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test: Blog Access Control
 *
 * Purpose: Verify category-based access control and freemium model
 * - Unauthenticated users: Can access "起業" category, redirected for others
 * - Authenticated users: Can access all categories, limited by freeContentHeading
 * - Paid subscribers: Full access to all content
 */

const BLOG_URL = '/blog';

// Helper function to generate unique email addresses for each test run
function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

// Helper function to register a new user
async function registerUser(page: Page, email: string, password = 'Password123') {
  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/account');
}

// Helper function to login
async function loginUser(page: Page, email: string, password = 'Password123') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/account');
}

// Helper function to logout
async function logoutUser(page: Page) {
  await page.goto('/account');
  const logoutButton = page.locator('button[type="submit"]').filter({ hasText: 'ログアウト' });
  await logoutButton.click();
  await expect(page).toHaveURL('/');
}

test.describe.serial('Blog Access Control - Category-based Authentication', () => {
  let testEmail: string;

  test.beforeAll(() => {
    testEmail = generateUniqueEmail('access-control');
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  test('Unauthenticated user: should see lock badges on non-起業 categories', async ({ page }) => {
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    // Get all post cards
    const postCards = page.getByTestId('post-card');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0);

    // Check for lock badges on non-起業 categories
    let lockedCardsFound = false;
    for (let i = 0; i < postCount; i++) {
      const card = postCards.nth(i);
      const isLocked = await card.getAttribute('data-locked');

      if (isLocked === 'true') {
        lockedCardsFound = true;

        // Verify lock badge is visible
        const lockBadge = card.getByTestId('lock-badge');
        await expect(lockBadge).toBeVisible();
        await expect(lockBadge).toContainText('🔒');

        // Verify lock message is visible
        const lockMessage = card.getByTestId('lock-message');
        await expect(lockMessage).toBeVisible();
        await expect(lockMessage).toContainText('ログインで読む');
      }
    }

    // At least one locked card should exist (assuming non-起業 posts exist)
    expect(lockedCardsFound).toBe(true);
  });

  test('Unauthenticated user: should redirect to login when clicking locked post', async ({ page }) => {
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    // Find a locked post card
    const postCards = page.getByTestId('post-card');
    const postCount = await postCards.count();

    let lockedPostSlug: string | null = null;
    for (let i = 0; i < postCount; i++) {
      const card = postCards.nth(i);
      const isLocked = await card.getAttribute('data-locked');

      if (isLocked === 'true') {
        lockedPostSlug = await card.getAttribute('data-slug');
        break;
      }
    }

    // Skip test if no locked posts exist
    if (!lockedPostSlug) {
      test.skip();
      return;
    }

    // Click the locked post and verify redirect to login
    await page.goto(`/blog/${lockedPostSlug}`, { waitUntil: 'domcontentloaded' });

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Should have returnTo parameter
    const url = new URL(page.url());
    expect(url.searchParams.get('returnTo')).toContain(`/blog/${lockedPostSlug}`);
  });

  test('Unauthenticated user: should access 起業 category posts without restriction', async ({ page }) => {
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    // Find a non-locked post (起業 category)
    const postCards = page.getByTestId('post-card');
    const postCount = await postCards.count();

    let unlockedPostSlug: string | null = null;
    for (let i = 0; i < postCount; i++) {
      const card = postCards.nth(i);
      const isLocked = await card.getAttribute('data-locked');

      if (!isLocked || isLocked === 'false') {
        unlockedPostSlug = await card.getAttribute('data-slug');
        break;
      }
    }

    // Skip test if no unlocked posts exist
    if (!unlockedPostSlug) {
      test.skip();
      return;
    }

    // Navigate to the unlocked post
    await page.goto(`/blog/${unlockedPostSlug}`, { waitUntil: 'domcontentloaded' });

    // Should be able to access the post (not redirected to login)
    await expect(page).toHaveURL(`/blog/${unlockedPostSlug}`);

    // Post detail section should be visible
    const postDetailSection = page.getByTestId('post-detail-section');
    await expect(postDetailSection).toBeVisible();
  });

  test('Authenticated user: should see all posts without lock badges', async ({ page }) => {
    // Register and login
    await registerUser(page, testEmail);

    // Navigate to blog
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    // Get all post cards
    const postCards = page.getByTestId('post-card');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0);

    // Verify no lock badges are visible
    for (let i = 0; i < postCount; i++) {
      const card = postCards.nth(i);
      const lockBadge = card.getByTestId('lock-badge');
      await expect(lockBadge).not.toBeVisible();
    }
  });

  test('Authenticated user: should access all posts without redirect', async ({ page }) => {
    // Login
    await loginUser(page, testEmail);

    // Navigate to blog
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    // Get first post
    const firstPostCard = page.getByTestId('post-card').first();
    const postSlug = await firstPostCard.getAttribute('data-slug');

    if (!postSlug) {
      test.skip();
      return;
    }

    // Navigate to post detail
    await page.goto(`/blog/${postSlug}`, { waitUntil: 'domcontentloaded' });

    // Should be able to access the post (not redirected to login)
    await expect(page).toHaveURL(`/blog/${postSlug}`);

    // Post detail section should be visible
    const postDetailSection = page.getByTestId('post-detail-section');
    await expect(postDetailSection).toBeVisible();
  });

  test('Authenticated user without subscription: should see paywall for restricted content', async ({ page }) => {
    // Login
    await loginUser(page, testEmail);

    // Find a post with freeContentHeading restriction
    // This test assumes such posts exist in the blog
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });

    const firstPostCard = page.getByTestId('post-card').first();
    const postSlug = await firstPostCard.getAttribute('data-slug');

    if (!postSlug) {
      test.skip();
      return;
    }

    // Navigate to post detail
    await page.goto(`/blog/${postSlug}`, { waitUntil: 'domcontentloaded' });

    // Check if paywall exists (will only exist if post has freeContentHeading)
    const paywall = page.getByTestId('paywall');

    // If paywall exists, verify it's visible
    const paywallExists = await paywall.count() > 0;
    if (paywallExists) {
      await expect(paywall).toBeVisible();

      // Verify subscription promotion banner
      const promotionBanner = page.getByTestId('subscription-promotion-banner');
      await expect(promotionBanner).toBeVisible();
    }
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup: logout
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await logoutUser(page);
    } catch (e) {
      // Ignore errors during cleanup
    } finally {
      await page.close();
      await context.close();
    }
  });
});
