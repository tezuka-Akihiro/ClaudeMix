import { test, expect } from '@playwright/test';
import { loadBlogPostsSpec, getTestArticlesByCategory, getTestArticlesByTag } from '../utils/loadSpec';

const TARGET_URL = '/blog';

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
test.describe('E2E Screen Test for blog', () => {

  /**
   * テスト1: BlogLayoutの表示確認
   * @description BlogLayoutが正常にレンダリングされ、Header/Footer/Contentエリアが配置されること
   */
  test('should display BlogLayout with Header, Content, and Footer areas', async ({ page }) => {
    await page.goto(TARGET_URL);

    // BlogLayoutが表示されること
    const blogLayout = page.getByTestId('blog-layout');
    await expect(blogLayout).toBeVisible();

    // メインコンテンツエリアが表示されること
    const mainContent = page.getByTestId('blog-main');
    await expect(mainContent).toBeVisible();
  });

  /**
   * テスト2: BlogHeaderの表示確認
   * @description ブログタイトルとmenuボタンが左右に配置されること
   */
  test('should display BlogHeader with title and menu button', async ({ page }) => {
    await page.goto(TARGET_URL);

    // BlogHeaderが表示されること
    const blogHeader = page.getByTestId('blog-header');
    await expect(blogHeader).toBeVisible();

    // タイトルリンクが表示され、正しいテキストを持つこと
    const titleLink = page.getByTestId('blog-header-title');
    await expect(titleLink).toBeVisible();
    await expect(titleLink).toHaveText('ClaudeMix Blog');

    // menuボタンが表示されること
    const menuButton = page.getByTestId('blog-header-menu-button');
    await expect(menuButton).toBeVisible();
  });

  /**
   * テスト3: BlogFooterの表示確認
   * @description コピーライト表記が正常に表示されること
   */
  test('should display BlogFooter with copyright text', async ({ page }) => {
    await page.goto(TARGET_URL);

    // BlogFooterが表示されること
    const blogFooter = page.getByTestId('blog-footer');
    await expect(blogFooter).toBeVisible();

    // コピーライト表記が表示され、正しいテキストを持つこと
    const copyright = page.getByTestId('copyright');
    await expect(copyright).toBeVisible();
    await expect(copyright).toHaveText('© 2025 ClaudeMix');
  });

  /**
   * テスト4: NavigationMenuの開閉確認
   * @description menuボタンクリックでNavigationMenuが開閉すること
   */
  test('should open and close NavigationMenu when menu button is clicked', async ({ page }) => {
    await page.goto(TARGET_URL);

    const menuButton = page.getByTestId('blog-header-menu-button');
    const navigationMenu = page.getByTestId('navigation-menu');

    // 初期状態ではNavigationMenuが非表示（または閉じている状態）
    // Note: 実装により visibility: hidden や display: none の場合がある
    await expect(navigationMenu).not.toBeVisible();

    // menuボタンをクリックしてメニューを開く
    await menuButton.click();

    // NavigationMenuが表示されること
    await expect(navigationMenu).toBeVisible();

    // オーバーレイをクリックしてメニューを閉じる
    const overlay = page.getByTestId('navigation-menu-overlay');
    await overlay.click();

    // NavigationMenuが非表示になること
    await expect(navigationMenu).not.toBeVisible();
  });

  /**
   * テスト5: NavigationMenuナビゲーション確認
   * @description メニュー項目クリックで対応するページへ遷移すること
   */
  test('should navigate to correct page when menu item is clicked', async ({ page }) => {
    await page.goto(TARGET_URL);

    const menuButton = page.getByTestId('blog-header-menu-button');

    // menuボタンをクリックしてメニューを開く
    await menuButton.click();

    // NavigationMenuが表示されること
    const navigationMenu = page.getByTestId('navigation-menu');
    await expect(navigationMenu).toBeVisible();

    // メニュー項目が表示されること
    const menuItems = page.getByTestId('menu-item');
    await expect(menuItems.first()).toBeVisible();

    // メニュー項目の数が2つであること（挨拶記事、Articles）
    await expect(menuItems).toHaveCount(2);

    // 1つ目のメニュー項目（挨拶記事）をクリック
    const firstMenuItem = menuItems.first();
    await expect(firstMenuItem).toHaveText('挨拶記事');
    await firstMenuItem.click();

    // /blog/welcomeページへ遷移すること
    await expect(page).toHaveURL('/blog/welcome');
  });

  /**
   * テスト6: タイトルリンクのホーム遷移確認
   * @description ブログタイトルをクリックで /blog へ遷移すること
   */
  test('should navigate to home when title link is clicked', async ({ page }) => {
    // まず記事一覧から1つ目の記事をクリックして詳細ページへ移動
    await page.goto(TARGET_URL);

    // 記事カードが表示されるまで待つ
    const firstPost = page.getByTestId('post-card').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // 詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/blog\/[^/]+/);

    // メニューが閉じていることを確認
    const navigationMenu = page.getByTestId('navigation-menu');
    await expect(navigationMenu).not.toBeVisible();

    // タイトルリンクをクリック
    const titleLink = page.getByTestId('blog-header-title');
    await titleLink.click();

    // /blogページへ遷移すること
    await expect(page).toHaveURL('/blog');
  });

  /**
   * テスト7: メニュー外クリックで閉じる確認
   * @description メニュー外の領域をクリックでNavigationMenuを閉じること
   */
  test('should close NavigationMenu when clicking outside', async ({ page }) => {
    await page.goto(TARGET_URL);

    const menuButton = page.getByTestId('blog-header-menu-button');
    const navigationMenu = page.getByTestId('navigation-menu');

    // menuボタンをクリックしてメニューを開く
    await menuButton.click();
    await expect(navigationMenu).toBeVisible();

    // メニューオーバーレイまたはメニュー外の領域をクリック
    const overlay = page.getByTestId('navigation-menu-overlay');
    if (await overlay.isVisible()) {
      await overlay.click();
    } else {
      // オーバーレイがない場合、メインコンテンツエリアをクリック
      const mainContent = page.getByTestId('blog-main');
      await mainContent.click();
    }

    // NavigationMenuが閉じること
    await expect(navigationMenu).not.toBeVisible();
  });

  /**
   * テスト8: Escキーでメニューを閉じる確認
   * @description Escキー押下でNavigationMenuを閉じること
   */
  test('should close NavigationMenu when Escape key is pressed', async ({ page }) => {
    await page.goto(TARGET_URL);

    const menuButton = page.getByTestId('blog-header-menu-button');
    const navigationMenu = page.getByTestId('navigation-menu');

    // menuボタンをクリックしてメニューを開く
    await menuButton.click();
    await expect(navigationMenu).toBeVisible();

    // Escapeキーを押下
    await page.keyboard.press('Escape');

    // NavigationMenuが閉じること
    await expect(navigationMenu).not.toBeVisible();
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

  /**
   * テスト1: 記事一覧でのメタデータ表示確認
   * @description 記事カードにdescriptionとtagsがピル型バッジで表示されること
   * Note: 全ての記事がdescriptionやtagsを持つわけではないため、少なくとも1つの記事カードで表示されることを確認
   */
  test('should display description and tags on each post card in posts list', async ({ page }) => {
    await page.goto(TARGET_URL);

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

test.describe('E2E Section Test for blog posts - Filter Feature (Happy Path)', () => {

  /**
   * テスト1: FilterToggleButton表示確認
   * @description FilterToggleButtonが記事一覧の一番上に表示されること
   */
  test('should display FilterToggleButton at the top of posts list', async ({ page }) => {
    await page.goto(TARGET_URL);

    // FilterToggleButtonが表示されること
    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await expect(filterToggleButton).toBeVisible();
  });

  /**
   * テスト2: FilterPanel開閉確認
   * @description FilterToggleButtonをクリックするとFilterPanelがモーダル形式で表示され、Escapeキーで閉じること
   */
  test('should open FilterPanel with toggle button and close with Escape key', async ({ page }) => {
    await page.goto(TARGET_URL);

    const filterToggleButton = page.getByTestId('filter-toggle-button');
    const filterPanel = page.getByTestId('filter-panel');

    // 初期状態ではFilterPanelが非表示
    await expect(filterPanel).not.toBeVisible();

    // FilterToggleButtonをクリックしてパネルを開く
    await filterToggleButton.click();

    // FilterPanelが表示されること
    await expect(filterPanel).toBeVisible();

    // FilterPanel内にCategorySelectorとTagGridが含まれること
    const categorySelector = page.getByTestId('category-selector');
    const tagGrid = page.getByTestId('tag-grid');
    await expect(categorySelector).toBeVisible();
    await expect(tagGrid).toBeVisible();

    // Escapeキーを押下してパネルを閉じる
    await page.keyboard.press('Escape');

    // FilterPanelが非表示になること
    await expect(filterPanel).not.toBeVisible();

    // FilterToggleButtonが再び表示されること
    await expect(filterToggleButton).toBeVisible();
  });

  /**
   * テスト3: カテゴリフィルタ選択確認
   * @description CategorySelectorでカテゴリを選択して決定ボタンをクリックすると、該当カテゴリの記事のみが表示されること
   */
  test('should filter posts by category when category is selected and submit button is clicked', async ({ page }) => {
    // spec.yamlからテストデータを読み込む
    const spec = await loadBlogPostsSpec();
    const categoryToTest = spec.categories[2]; // カテゴリ3: "Tutorials & Use Cases"
    const testArticles = await getTestArticlesByCategory(categoryToTest.id);

    // テスト用記事が存在することを確認
    expect(testArticles.length).toBeGreaterThan(0);
    const testArticle = testArticles[0];

    await page.goto(TARGET_URL);

    // FilterToggleButtonをクリックしてパネルを開く
    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await filterToggleButton.click();

    // FilterPanelが表示されること
    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    // CategorySelectorでカテゴリを選択（spec.yamlから取得）
    const categorySelector = page.getByTestId('category-selector');
    await categorySelector.selectOption(categoryToTest.name);

    // FilterSubmitButtonをクリック（force: trueで画面外でもクリック）
    const filterSubmitButton = page.getByTestId('filter-submit-button');
    await filterSubmitButton.click({ force: true });

    // FilterPanelが自動的に閉じること
    await expect(filterPanel).not.toBeVisible();

    // テスト用記事が表示されることを確認（件数チェックではなく存在確認）
    const testArticleCard = page.locator(`[data-testid="post-card"][data-slug="${testArticle.slug}"]`);
    await expect(testArticleCard).toBeVisible();

    // URLパラメータにカテゴリが含まれること (+ または %20 の両方を許容)
    const categoryPattern = categoryToTest.name.replace(/\s/g, '(\\+|%20)').replace(/&/g, '%26');
    await expect(page).toHaveURL(new RegExp(`category=${categoryPattern}`));
  });

  /**
   * テスト4: タグフィルタ選択確認（AND条件）
   * @description CategorySelectorを"All Categories"のままタグを選択すると、該当タグを含む記事のみが表示されること
   */
  test('should filter posts by tags when tags are selected with "All Categories"', async ({ page }) => {
    // spec.yamlからテストデータを読み込む
    const testTag = 'Playwright'; // テスト記事で使用しているタグ
    const testArticles = await getTestArticlesByTag(testTag);

    // テスト用記事が存在することを確認
    expect(testArticles.length).toBeGreaterThan(0);
    const testArticle = testArticles[0];

    await page.goto(TARGET_URL);

    // FilterToggleButtonをクリックしてパネルを開く
    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await filterToggleButton.click();

    // FilterPanelが表示されること
    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    // CategorySelectorが "All Categories" (空文字列) であることを確認
    const categorySelector = page.getByTestId('category-selector');
    await expect(categorySelector).toHaveValue('');

    // TagGrid内のタグボタンを選択
    const tagGrid = page.getByTestId('tag-grid');
    const tagButtons = tagGrid.getByTestId('tag-button');

    // テストタグを見つけてクリック
    const tagButton = tagButtons.filter({ hasText: testTag });
    await tagButton.click();

    // タグボタンが選択状態（aria-pressed="true"）になること
    await expect(tagButton).toHaveAttribute('aria-pressed', 'true');

    // FilterSubmitButtonをクリック（force: trueで画面外でもクリック）
    const filterSubmitButton = page.getByTestId('filter-submit-button');
    await filterSubmitButton.click({ force: true });

    // FilterPanelが自動的に閉じること
    await expect(filterPanel).not.toBeVisible();

    // テスト用記事が表示されることを確認（件数チェックではなく存在確認）
    const testArticleCard = page.locator(`[data-testid="post-card"][data-slug="${testArticle.slug}"]`);
    await expect(testArticleCard).toBeVisible();

    // URLパラメータにタグが含まれること
    await expect(page).toHaveURL(new RegExp(`tags=${testTag}`));
  });

  /**
   * テスト5: FilterPanel背景クリックで閉じる確認
   * @description FilterPanel外の背景（オーバーレイ）をクリックすると、パネルが閉じること
   */
  test('should close FilterPanel when clicking on overlay', async ({ page }) => {
    await page.goto(TARGET_URL);

    // FilterToggleButtonをクリックしてパネルを開く
    const filterToggleButton = page.getByTestId('filter-toggle-button');
    await filterToggleButton.click();

    // FilterPanelが表示されること
    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    // オーバーレイの上部(ヘッダー領域)をクリック
    const overlay = page.getByTestId('filter-overlay');
    const overlayBox = await overlay.boundingBox();
    if (overlayBox) {
      // ヘッダーの高さ領域（上部約80px）をクリック
      await page.mouse.click(overlayBox.x + overlayBox.width / 2, overlayBox.y + 40);
    }

    // FilterPanelが閉じること
    await expect(filterPanel).not.toBeVisible();
  });
});