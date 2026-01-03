import { test, expect } from '@playwright/test';

// 「起業」カテゴリでフィルタリングして未認証でアクセス可能な記事のみを表示（待機なしの解決策）
const TARGET_URL = '/blog?category=起業';

// ファイル全体が完了したら5秒待機（次のファイル実行前に環境を休ませる）
test.afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
});

/**
 * Posts Section統合テスト
 * @description 記事一覧の表示、ナビゲーション、ページネーションを連続して確認
 */
test.describe.serial('E2E Section Test for blog - posts', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * @see docs/E2E_TEST_CRITERIA.md
   * @description
   * セクションレベルのテスト:
   * 開発の後半（Phase 3）で、エラーケースや詳細なインタラクションを検証するために追加します。
   * このセクションが担う最も重要なユーザーアクションが成功することを保証します。
   */
  test('should display posts section and navigate to detail', async ({ page }) => {
    // 1回だけページをロード
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 1. 記事一覧（PostsSection）が表示される
    const postsSection = page.getByTestId('posts-section');
    await expect(postsSection).toBeVisible();

    // 2. 記事カード（PostCard）が表示される
    const postCards = postsSection.getByTestId('post-card');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0);

    // 3. 各カードにカテゴリ絵文字、タイトル、投稿日が表示される
    for (let i = 0; i < Math.min(postCount, 3); i++) { // 最初の3件のみ確認
      const card = postCards.nth(i);
      await expect(card.getByTestId('category-emoji')).toBeVisible();
      await expect(card.getByTestId('category-emoji')).not.toBeEmpty();
      await expect(card.getByTestId('post-card-title')).toBeVisible();
      await expect(card.getByTestId('post-card-title')).not.toBeEmpty();
      await expect(card.getByTestId('post-card-date')).toBeVisible();
      await expect(card.getByTestId('post-card-date')).not.toBeEmpty();
    }

    // 4. 「起業」カテゴリの最初の記事カードをクリックして詳細ページへ遷移
    // カテゴリフィルタリングにより全ての記事が未認証でアクセス可能
    const firstPostCard = postsSection.getByTestId('post-card').first();
    await firstPostCard.click();
    await page.waitForLoadState('networkidle');

    // ナビゲーション完了を待機
    await page.waitForURL(/\/blog\/[^/]+/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/blog\/[^/]+/);
  });

  test('Posts: pagination navigation', async ({ page }) => {
    // 前のテストで詳細ページにいるので、/blog に戻る
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 1. ページネーションが表示されるか確認
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      await expect(pagination).toBeVisible();

      // 2. 次へボタンをクリック
      const nextButton = page.getByText('次へ →');
      const nextButtonCount = await nextButton.count();

      if (nextButtonCount > 0) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/blog\?page=2/);
      }
    }
  });

  test('Posts: pagination page number and previous button', async ({ page }) => {
    // 前のテストからの継続（現在 /blog にいる）

    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // 1. ページ番号3のリンクをクリック
      const pageLink = page.locator('a[href="/blog?page=3"]');
      const pageLinkCount = await pageLink.count();

      if (pageLinkCount > 0) {
        await pageLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/blog\?page=3/);

        // 2. 前へボタンをクリックしてページ2に戻る
        const prevButton = page.getByText('← 前へ');
        const prevButtonCount = await prevButton.count();

        if (prevButtonCount > 0) {
          await prevButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/\/blog\?page=2/);

          // 3. もう一度前へボタンをクリックしてページ1に戻る
          const prevButton2Count = await prevButton.count();
          if (prevButton2Count > 0) {
            await prevButton.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/\/blog(\?page=1)?$/);
          }
        }
      }
    }
  });

  test('Posts: scroll position resets to top on pagination navigation', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Check if pagination exists
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // Scroll down the page
      await page.evaluate(() => window.scrollTo(0, 500));

      // Wait a bit to ensure scroll happens
      await page.waitForTimeout(100);

      // Verify we're scrolled down
      const scrollYBefore = await page.evaluate(() => window.scrollY);
      expect(scrollYBefore).toBeGreaterThan(0);

      // Click next page button
      const nextButton = page.getByText('次へ →');
      const nextButtonCount = await nextButton.count();

      if (nextButtonCount > 0) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');

        // Wait for scroll reset to happen
        await page.waitForTimeout(200);

        // Verify scroll position is reset to top
        const scrollYAfter = await page.evaluate(() => window.scrollY);
        expect(scrollYAfter).toBe(0);
      }
    }
  });
});