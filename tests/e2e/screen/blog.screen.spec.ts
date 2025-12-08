import { test, expect } from '@playwright/test';
import { loadSpec, getTestArticlesByCategory, getTestArticlesByTag } from '../../utils/loadSpec';

const TARGET_URL = '/blog';

// ファイル全体が完了したら5秒待機（次のファイル実行前に環境を休ませる）
test.afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
});

/**
 * @see docs/E2E_TEST_CRITERIA.md
 * @description
 * 画面レベルのテスト:
 * 開発の初期段階（Phase 1）で作成し、Happy Pathのゴールを定義します。
 * ページが正常に表示され、主要なセクションが描画されることを保証します。
 *
 * @reference
 * - develop/blog/common/func-spec.md
 * - develop/blog/common/uiux-spec.md
 * - develop/blog/common/spec.yaml
 */
/**
 * グループ1: 基本レイアウトの表示確認
 * @description ページを1回だけロードして、Layout/Header/Footerの表示を統合確認
 */
test.describe('E2E Screen Test for blog - Basic Layout', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * 統合テスト: BlogLayout、Header、Footerの表示確認
   * @description BlogLayoutが正常にレンダリングされ、Header/Footer/Contentエリアが配置されること
   */
  test('should display BlogLayout with Header, Content, and Footer', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 1. BlogLayoutが表示されること
    const blogLayout = page.getByTestId('blog-layout');
    await expect(blogLayout).toBeVisible();

    // 2. メインコンテンツエリアが表示されること
    const mainContent = page.getByTestId('blog-main');
    await expect(mainContent).toBeVisible();

    // 3. BlogHeaderが表示されること
    const blogHeader = page.getByTestId('blog-header');
    await expect(blogHeader).toBeVisible();

    // 4. タイトルリンクが表示され、正しいテキストを持つこと
    const titleLink = page.getByTestId('blog-header-title');
    await expect(titleLink).toBeVisible();
    await expect(titleLink).toHaveText('ClaudeMix Blog');

    // 5. menuボタンが表示されること
    const menuButton = page.getByTestId('blog-header-menu-button');
    await expect(menuButton).toBeVisible();

    // 6. BlogFooterが表示されること
    const blogFooter = page.getByTestId('blog-footer');
    await expect(blogFooter).toBeVisible();

    // 7. コピーライト表記が表示され、正しいテキストを持つこと
    const copyright = page.getByTestId('copyright');
    await expect(copyright).toBeVisible();
    await expect(copyright).toHaveText('© 2025 ClaudeMix');
  });

});

/**
 * グループ2: NavigationMenuのインタラクション確認
 * @description MenuButtonクリックでメニューが開閉し、メニュー項目でナビゲーションできること
 */
test.describe.serial('E2E Screen Test for blog - Navigation Menu', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * 統合テスト: NavigationMenuの開閉とナビゲーション確認
   * @description menuボタンクリック→メニュー開閉→ナビゲーション確認を1つのフローで実施
   */
  test('should open/close NavigationMenu and navigate correctly', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const menuButton = page.getByTestId('blog-header-menu-button');
    const navigationMenu = page.getByTestId('navigation-menu');

    // 1. 初期状態ではNavigationMenuが非表示
    await expect(navigationMenu).not.toBeVisible();

    // 2. menuボタンをクリックしてメニューを開く
    await menuButton.click();
    await page.waitForLoadState('networkidle');
    await navigationMenu.waitFor({ state: 'visible', timeout: 10000 });
    await expect(navigationMenu).toBeVisible();

    // 3. メニュー項目が表示され、数が2つ以上であること
    const menuItems = page.getByTestId('menu-item');
    await expect(menuItems.first()).toBeVisible();
    expect(await menuItems.count()).toBeGreaterThanOrEqual(2);

    // 4. 1つ目のメニュー項目をクリック
    const firstMenuItem = menuItems.first();
    await expect(firstMenuItem).toHaveText('はじめまして');
    await firstMenuItem.click();
    await page.waitForLoadState('networkidle');

    // 5. ページへ遷移すること
    await expect(page).toHaveURL('/blog/hazimemasite');
  });

  /**
   * メニュー外クリックで閉じる確認
   * @description オーバーレイクリックでNavigationMenuを閉じること
   */
  test('should close NavigationMenu when clicking outside or pressing Escape', async ({ page }) => {
    // 前のテストで /blog/welcome にいるので、/blog に戻る
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const menuButton = page.getByTestId('blog-header-menu-button');
    const navigationMenu = page.getByTestId('navigation-menu');

    // menuボタンをクリックしてメニューを開く
    await menuButton.click();
    await page.waitForLoadState('networkidle');
    await navigationMenu.waitFor({ state: 'visible', timeout: 10000 });
    await expect(navigationMenu).toBeVisible();

    // オーバーレイをクリックして閉じる
    const overlay = page.getByTestId('navigation-menu-overlay');
    await expect(overlay).toBeVisible();
    await overlay.click();
    await page.waitForLoadState('networkidle');
    await expect(navigationMenu).not.toBeVisible();

    // 再度メニューを開く
    await menuButton.click();
    await page.waitForLoadState('networkidle');
    await navigationMenu.waitFor({ state: 'visible', timeout: 10000 });
    await expect(navigationMenu).toBeVisible();

    // Escapeキーを押下してメニューを閉じる
    await page.keyboard.press('Escape');
    await expect(navigationMenu).not.toBeVisible();
  });

  /**
   * タイトルリンクのホーム遷移確認
   * @description ブログタイトルをクリックで /blog へ遷移すること
   */
  test('should navigate to home when title link is clicked', async ({ page }) => {
    // まず /blog ページに移動
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 記事一覧セクションが表示されるまで待つ
    const postsSection = page.getByTestId('posts-section');
    await expect(postsSection).toBeVisible();

    // 最初の記事カードを取得してクリック
    const firstPostCard = postsSection.getByTestId('post-card').first();
    await firstPostCard.click();
    await page.waitForLoadState('networkidle');

    // 詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/blog\/[^/]+/);

    // タイトルリンクをクリックしてホームへ戻る
    const titleLink = page.getByTestId('blog-header-title');
    await expect(titleLink).toBeVisible();
    await titleLink.click();
    await page.waitForLoadState('networkidle');

    // /blogページへ遷移すること
    await expect(page).toHaveURL('/blog');
  });
});

/**
 * @see docs/E2E_TEST_CRITERIA.md
 * @description
 * セクションレベルのテスト（メタデータ拡張 + フィルタ機能）:
 * Phase 1で主要な成功シナリオ（Happy Path）を定義し、開発のゴールを明確化します。
 *
 * @reference
 * - develop/blog/posts/func-spec.md
 * - develop/blog/posts/uiux-spec.md
 * - develop/blog/posts/spec.yaml
 * - develop/blog-metadata-enhancement.md
 * - develop/blog-filter-feature.md
 */
test.describe('E2E Section Test for blog posts - Metadata Enhancement', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * テスト1: 記事一覧でのメタデータ表示確認
   * @description 記事カードにdescriptionとtagsがピル型バッジで表示されること
   * Note: 全ての記事がdescriptionやtagsを持つわけではないため、少なくとも1つの記事カードで表示されることを確認
   */
  test('should display description and tags on each post card in posts list', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 記事カードが表示されるまで待つ
    const postCards = page.getByTestId('post-card');
    await expect(postCards.first()).toBeVisible();

    // 少なくとも1つの記事カードにdescriptionが表示されること
    const description = page.locator('.post-description').first();
    await expect(description).toBeVisible();

    // 少なくとも1つの記事カードにタグバッジが表示されること
    const tagBadges = page.getByTestId('tag-badge');
    await expect(tagBadges.first()).toBeVisible();

    // タグバッジが複数表示されること（最低1つ）
    const tagCount = await tagBadges.count();
    expect(tagCount).toBeGreaterThan(0);
  });

});

/**
 * グループ3: FilterFeatureの統合テスト
 * @description FilterPanelの表示・操作・フィルタリングを連続して確認
 */
test.describe.serial('E2E Section Test for blog posts - Filter Feature (Happy Path)', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * 統合テスト1: FilterToggleButton表示とパネル開閉、タググループ表示
   * @description FilterPanelの基本動作を1つのテストで確認
   */
  test('should display and interact with FilterPanel', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const filterToggleButton = page.getByTestId('filter-toggle-button');
    const filterPanel = page.getByTestId('filter-panel');

    // 1. FilterToggleButtonが表示されること
    await expect(filterToggleButton).toBeVisible();

    // 2. 初期状態ではFilterPanelが非表示
    await expect(filterPanel).not.toBeVisible();

    // 3. FilterToggleButtonをクリックしてパネルを開く
    await filterToggleButton.click();
    await page.waitForLoadState('networkidle');
    await expect(filterPanel).toBeVisible();

    // 4. FilterPanel内にCategorySelectorとTagGridが含まれること
    const categorySelector = page.getByTestId('category-selector');
    const tagGrid = page.getByTestId('tag-grid');
    await expect(categorySelector).toBeVisible();
    await expect(tagGrid).toBeVisible();

    // 5. グループヘッダーが表示され、数が4つであること
    const groupHeaders = page.getByTestId('tag-group-header');
    await expect(groupHeaders.first()).toBeVisible();
    await expect(groupHeaders).toHaveCount(4);
    await expect(groupHeaders.first()).toHaveText('Remix');

    // 6. 各グループコンテナ内にタグボタンが存在すること
    const groupContainers = page.getByTestId('tag-group-container');
    const firstGroupContainer = groupContainers.first();
    const tagButtonsInGroup = firstGroupContainer.getByTestId('tag-button');
    await expect(tagButtonsInGroup.first()).toBeVisible();

    // 7. Escapeキーを押下してパネルを閉じる
    await page.keyboard.press('Escape');
    await expect(filterPanel).not.toBeVisible();
    await expect(filterToggleButton).toBeVisible();
  });

  /**
   * 統合テスト2: カテゴリとタグによるフィルタリング確認
   * @description カテゴリフィルタ→タグフィルタ→オーバーレイクリックを連続して確認
   */
  test('should filter posts by category and tags', async ({ page }) => {
    // テストデータ準備
    const spec = await loadSpec('blog','posts');
    const categoryToTest = spec.categories[2]; // "Tutorials & Use Cases"
    const testArticlesByCategory = await getTestArticlesByCategory(categoryToTest.id);
    expect(testArticlesByCategory.length).toBeGreaterThan(0);
    const testArticleByCategory = testArticlesByCategory[0];

    const testTag = 'Playwright';
    const testArticlesByTag = await getTestArticlesByTag(testTag);
    expect(testArticlesByTag.length).toBeGreaterThan(0);
    const testArticleByTag = testArticlesByTag[0];

    // まず /blog ページに移動
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 1. カテゴリフィルタのテスト
    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await filterToggleButton.click();
    await page.waitForLoadState('networkidle');

    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    const categorySelector = page.getByTestId('category-selector');
    await categorySelector.selectOption(categoryToTest.name);

    const filterSubmitButton = page.getByTestId('filter-submit-button');
    await filterSubmitButton.click({ force: true });

    await expect(filterPanel).not.toBeVisible();

    const testArticleCard1 = page.locator(`[data-testid="post-card"][data-slug="${testArticleByCategory.slug}"]`);
    await expect(testArticleCard1).toBeVisible();

    const categoryPattern = categoryToTest.name.replace(/\s/g, '(\\+|%20)').replace(/&/g, '%26');
    await expect(page).toHaveURL(new RegExp(`category=${categoryPattern}`));

    // 2. タグフィルタのテスト（/blog に戻る）
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    await filterToggleButton.click();
    await page.waitForLoadState('networkidle');
    await expect(filterPanel).toBeVisible();

    const tagGrid = page.getByTestId('tag-grid');
    const tagButtons = tagGrid.getByTestId('tag-button');
    const tagButton = tagButtons.filter({ hasText: testTag });
    await tagButton.click();
    await expect(tagButton).toHaveAttribute('aria-pressed', 'true');

    await filterSubmitButton.click({ force: true });
    await expect(filterPanel).not.toBeVisible();

    const testArticleCard2 = page.locator(`[data-testid="post-card"][data-slug="${testArticleByTag.slug}"]`);
    await expect(testArticleCard2).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`tags=${testTag}`));

    // 3. オーバーレイクリックで閉じる確認
    await filterToggleButton.click();
    await page.waitForLoadState('networkidle');
    await expect(filterPanel).toBeVisible();

    const overlay = page.getByTestId('filter-overlay');
    const overlayBox = await overlay.boundingBox();
    if (overlayBox) {
      await page.mouse.click(overlayBox.x + overlayBox.width / 2, overlayBox.y + 40);
    }

    await expect(filterPanel).not.toBeVisible();
  });

  /**
   * タググループからのフィルタ選択確認
   * @description 特定のグループ内のタグを選択してフィルタを適用できること
   */
test('should filter posts by selecting a tag from a specific group', async ({ page }) => {
    const testTag = 'Playwright';
    const testGroupName = 'Remix';
    const testArticles = await getTestArticlesByTag(testTag);
    expect(testArticles.length).toBeGreaterThan(0);
    const testArticle = testArticles[0];

    // まず /blog ページに移動
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await filterToggleButton.click();
    await page.waitForLoadState('networkidle');

    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    // "Remix" グループコンテナを特定
    const remixGroupContainer = page.getByTestId('tag-group-container').filter({ hasText: testGroupName });
    await expect(remixGroupContainer).toBeVisible();

    // "Remix" グループ内の "Playwright" タグボタンをクリック
    const tagButton = remixGroupContainer.getByTestId('tag-button').filter({ hasText: testTag });
    await tagButton.click();
    await expect(tagButton).toHaveAttribute('aria-pressed', 'true');

    // FilterSubmitButtonをクリック
    const filterSubmitButton = page.getByTestId('filter-submit-button');
    await filterSubmitButton.click({ force: true });

    // テスト用記事が表示されることを確認
    const testArticleCard = page.locator(`[data-testid="post-card"][data-slug="${testArticle.slug}"]`);
    await expect(testArticleCard).toBeVisible();
  });
});