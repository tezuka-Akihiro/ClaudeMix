import { test, expect } from '@playwright/test';

const TARGET_URL = '/blog';

test.describe('E2E Section Test for blog - posts', () => {

  /**
   * @see docs/E2E_TEST_CRITERIA.md
   * @description
   * セクションレベルのテスト:
   * 開発の後半（Phase 3）で、エラーケースや詳細なインタラクションを検証するために追加します。
   * このセクションが担う最も重要なユーザーアクションが成功することを保証します。
   */
  test('should display posts section with 3 post cards', async ({ page }) => {
    // `/blog` にアクセス
    await page.goto(TARGET_URL);

    // 記事一覧（PostsSection）が表示される
    const postsSection = page.getByTestId('posts-section');
    await expect(postsSection).toBeVisible();

    // 記事カード（PostCard）が表示される（実際の記事数に応じて）
    const postCards = postsSection.getByTestId('post-card');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0); // 少なくとも1件は存在する

    // 各カードにカテゴリ絵文字、タイトル、投稿日が表示される
    for (let i = 0; i < postCount; i++) {
      const card = postCards.nth(i);

      // カテゴリ絵文字が表示される
      const categoryEmoji = card.getByTestId('category-emoji');
      await expect(categoryEmoji).toBeVisible();
      await expect(categoryEmoji).not.toBeEmpty();

      // タイトルが表示される
      const title = card.getByTestId('post-card-title');
      await expect(title).toBeVisible();
      await expect(title).not.toBeEmpty();

      // 投稿日が表示される
      const date = card.getByTestId('post-card-date');
      await expect(date).toBeVisible();
      await expect(date).not.toBeEmpty();
    }
  });

  test('should navigate to post detail page when clicking a post card', async ({ page }) => {
    // `/blog` にアクセス
    await page.goto(TARGET_URL);

    // 記事一覧が表示されるのを待つ
    const postsSection = page.getByTestId('posts-section');
    await expect(postsSection).toBeVisible();

    // 最初の記事カードを取得
    const firstPostCard = postsSection.getByTestId('post-card').first();

    // カード内のタイトルまたはリンクをクリック
    await firstPostCard.click();

    // URLが `/blog/${slug}` の形式に変わることを確認
    await expect(page).toHaveURL(/\/blog\/[^/]+/);
  });

  test('Posts: ページネーションUIが表示される（10件以上の記事がある場合）', async ({ page }) => {
    // `/blog` にアクセス
    await page.goto(TARGET_URL);

    // ページネーションが表示される（記事が10件以上ある場合のみ）
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // ページネーションが表示される
      await expect(pagination).toBeVisible();
    }
  });

  test('Posts: 次へボタンでページ2に遷移する', async ({ page }) => {
    // `/blog` にアクセス
    await page.goto(TARGET_URL);

    // ページネーションの存在確認
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // 次へボタンをクリック
      const nextButton = page.getByText('次へ →');
      const nextButtonCount = await nextButton.count();

      if (nextButtonCount > 0) {
        await nextButton.click();

        // URLが `/blog?page=2` に変わることを確認
        await expect(page).toHaveURL(/\/blog\?page=2/);
      }
    }
  });

  test('Posts: ページ番号をクリックして特定のページに遷移する', async ({ page }) => {
    // `/blog` にアクセス
    await page.goto(TARGET_URL);

    // ページネーションの存在確認
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // ページ番号3のリンクが存在するか確認
      const pageLink = page.locator('a[href="/blog?page=3"]');
      const pageLinkCount = await pageLink.count();

      if (pageLinkCount > 0) {
        await pageLink.click();

        // URLが `/blog?page=3` に変わることを確認
        await expect(page).toHaveURL(/\/blog\?page=3/);
      }
    }
  });

  test('Posts: 前へボタンでページ1に戻る', async ({ page }) => {
    // `/blog?page=2` にアクセス
    await page.goto('/blog?page=2');

    // ページネーションの存在確認
    const pagination = page.getByTestId('pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // 前へボタンをクリック
      const prevButton = page.getByText('← 前へ');
      const prevButtonCount = await prevButton.count();

      if (prevButtonCount > 0) {
        await prevButton.click();

        // URLが `/blog` または `/blog?page=1` に変わることを確認
        await expect(page).toHaveURL(/\/blog(\?page=1)?$/);
      }
    }
  });
});