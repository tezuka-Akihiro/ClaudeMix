import { test, expect } from '@playwright/test';
import { loadSpec } from '../../utils/loadSpec';
import type { BlogPostsSpec } from '~/specs/blog/types';

// specから公開カテゴリを取得（未認証でアクセス可能なカテゴリ）
let TARGET_URL: string;
let publicCategory: string;

test.beforeAll(async () => {
  const spec = await loadSpec<BlogPostsSpec>('blog', 'posts');
  publicCategory = spec.access_control.public_categories[0];
  TARGET_URL = `/blog?category=${encodeURIComponent(publicCategory)}`;
});

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
      await expect(card.getByTestId('post-title')).toBeVisible();
      await expect(card.getByTestId('post-title')).not.toBeEmpty();
      await expect(card.getByTestId('post-date')).toBeVisible();
      await expect(card.getByTestId('post-date')).not.toBeEmpty();
    }

    // 4. 公開カテゴリの最初の記事カードをクリックして詳細ページへ遷移
    // カテゴリフィルタリングにより全ての記事が未認証でアクセス可能
    const firstPostCard = postsSection.getByTestId('post-card').first();
    await firstPostCard.click();
    await page.waitForLoadState('networkidle');

    // ナビゲーション完了を待機
    await page.waitForURL(/\/blog\/[^/]+/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/blog\/[^/]+/);
  });

  test('Posts: load more button displays and loads additional posts', async ({ page }) => {
    // 前のテストで詳細ページにいるので、/blog に戻る
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 1. LoadMoreButtonが表示されるか確認
    const loadMoreButton = page.getByTestId('load-more-button');
    const buttonCount = await loadMoreButton.count();

    if (buttonCount > 0) {
      await expect(loadMoreButton).toBeVisible();

      // 2. 初期表示の記事数を取得
      const postsSection = page.getByTestId('posts-section');
      const initialPostCards = postsSection.getByTestId('post-card');
      const initialCount = await initialPostCards.count();

      // 3. LoadMoreButtonをクリック
      await loadMoreButton.click();

      // 4. 追加記事が読み込まれるのを待つ
      await expect(postsSection.getByTestId('post-card').nth(initialCount)).toBeVisible();

      // 5. 記事が追加されたことを確認
      const updatedPostCards = postsSection.getByTestId('post-card');
      const updatedCount = await updatedPostCards.count();
      expect(updatedCount).toBeGreaterThan(initialCount);

      // 7. LoadMoreButtonが再度表示されることを確認（まだ記事がある場合）
      const buttonCountAfter = await loadMoreButton.count();
      if (buttonCountAfter > 0) {
        await expect(loadMoreButton).toBeVisible();
        await expect(loadMoreButton.getByText('More')).toBeVisible();
      }
    }
  });

  test('Posts: load more button hides when all posts are loaded', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const loadMoreButton = page.getByTestId('load-more-button');
    const buttonCount = await loadMoreButton.count();

    if (buttonCount > 0) {
      // すべての記事を読み込むまでLoadMoreButtonをクリック
      let maxClicks = 10; // 無限ループ防止
      while (maxClicks > 0) {
        const currentButtonCount = await loadMoreButton.count();
        if (currentButtonCount === 0) break;

        await loadMoreButton.click();
        await page.waitForTimeout(1000);
        maxClicks--;
      }

      // すべて読み込み済みの場合、LoadMoreButtonが非表示になることを確認
      const finalButtonCount = await loadMoreButton.count();
      if (finalButtonCount === 0) {
        await expect(loadMoreButton).not.toBeVisible();
      }
    }
  });
});