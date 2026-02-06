import { test, expect, type Page } from '@playwright/test';
import { loadSpec, loadTestArticles, type TestArticleFrontmatter } from '../../utils/loadSpec';
import type { BlogPostsSpec, BlogCommonSpec } from '~/specs/blog/types';

// Seeded test user with active subscription (from migrations/seed.sql)
const SUBSCRIBED_USER = {
  email: 'tizuhanpen8+preview@gmail.com',
  password: '14801250At',
};

// Helper: Login as subscribed user (seeded in D1)
async function loginAsSubscribedUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', SUBSCRIBED_USER.email);
  await page.fill('input[name="password"]', SUBSCRIBED_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/account');
}

// テスト用変数（beforeAllで初期化）
let spec: BlogPostsSpec;
let commonSpec: BlogCommonSpec;
let testArticles: TestArticleFrontmatter[];
let testArticleSlug: string;

// ---
// Post Detail Section: Outside-In TDD Tests
// ---
test.describe('E2E Test for Blog - Post Detail', () => {

  test.beforeAll(async () => {
    spec = await loadSpec<BlogPostsSpec>('blog', 'posts');
    commonSpec = await loadSpec<BlogCommonSpec>('blog', 'common');
    testArticles = await loadTestArticles();
    // テスト記事の最初のものを使用
    testArticleSlug = testArticles[0]?.slug || 'test-e2e-filter';
  });

  /**
   * Post Detail Phase 1: Happy Path E2E Test
   * @description
   * 記事詳細ページの基本表示と主要機能の正常フローを検証
   * TDD_WORK_FLOW.md Phase 1 のゴール定義
   */
  test('Post Detail: 記事詳細の表示（タイトル、メタデータ、マークダウン変換、画像、Mermaid図）', async ({ page }) => {
    // テストデータ（テスト記事を使用）
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. PostDetailSectionが表示されること
    await expect(page.locator('[data-testid="post-detail-section"]')).toBeVisible();

    // 3. 記事タイトルが表示される
    const titleElement = page.locator('[data-testid="post-title"]');
    await expect(titleElement).toBeVisible();
    // タイトルが空でないことを確認（実際のタイトルは記事ファイルによって異なる）
    await expect(titleElement).not.toBeEmpty();

    // 4. 記事メタデータ（著者）が表示される
    const authorElement = page.locator('[data-testid="post-author"]');
    await expect(authorElement).toBeVisible();
    // 著者名が空でないことを確認（実際の著者は記事ファイルによって異なる）
    await expect(authorElement).not.toBeEmpty();

    // 5. 記事メタデータ（投稿日）が表示される
    const publishedDateElement = page.locator('[data-testid="post-published-date"]');
    await expect(publishedDateElement).toBeVisible();
    // 日付が表示されていることを確認
    await expect(publishedDateElement).not.toBeEmpty();

    // 6. マークダウン変換後のHTML本文が表示される
    const contentElement = page.locator('[data-testid="post-content-visible"]');
    await expect(contentElement).toBeVisible();
    // 本文が空でないことを確認
    await expect(contentElement).not.toBeEmpty();
  });

  /**
   * Post Detail: Mermaid図のレンダリング
   * @description
   * Mermaidコードブロックが正しくSVG図表にレンダリングされることを検証
   */
  test('Post Detail: Mermaidコードブロックが正しくSVG図表にレンダリングされる', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. Mermaid図が含まれているか確認（preタグにmermaidクラス）
    const mermaidElement = page.locator('pre.mermaid');
    if (await mermaidElement.count() > 0) {
      // 3. Mermaid.jsがクライアント側でSVGに変換されることを確認
      // 注: クライアント側のMermaid.js実行後にSVGが生成される
      const svgElement = mermaidElement.locator('svg');
      await expect(svgElement).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * Post Detail: シンタックスハイライト
   * @description
   * コードブロックがShikiによって正しくハイライトされることを検証
   */
  test('Post Detail: コードブロックがShikiでハイライトされる', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. Shikiが生成するpre.shikiが存在するか確認
    const shikiCodeBlock = page.locator('pre.shiki');
    if (await shikiCodeBlock.count() > 0) {
      // 3. Shikiが生成するインラインスタイル付きspanが含まれていることを確認
      const styledSpan = shikiCodeBlock.first().locator('span[style]').first();
      const styleAttr = await styledSpan.getAttribute('style');

      // Shikiはspan要素にインラインスタイルで色を指定する
      expect(styleAttr).toBeTruthy();
    }
  });

  /**
   * Post Detail: 画像の遅延読み込み
   * @description
   * 画像にloading="lazy"属性が付与されていることを検証
   */
  test('Post Detail: 画像に遅延読み込み属性が付与される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 画像が存在するか確認
    const image = page.locator('img').first();
    if (await image.count() > 0) {
      // 3. loading="lazy"属性が付与されていることを確認
      await expect(image).toHaveAttribute('loading', 'lazy');
    }
  });

  /**
   * Post Detail: 画像のレスポンシブ対応
   * @description
   * 記事コンテンツ内の画像にmax-width: 100%スタイルが適用されていることを検証
   * Note: サムネイル画像はCSSクラスでレスポンシブ対応のため、コンテンツ内画像のみ検証
   */
  test('Post Detail: 画像がレスポンシブ対応される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 記事コンテンツ内の画像が存在するか確認（サムネイルを除外）
    const contentImage = page.locator('[data-testid="post-content-visible"] img').first();
    if (await contentImage.count() > 0) {
      // 3. style属性にmax-widthが含まれていることを確認
      const styleAttr = await contentImage.getAttribute('style');
      expect(styleAttr).toContain('max-width');
    }
  });

  /**
   * Post Detail Error Path: 404エラー処理
   * @description
   * 存在しないslugでアクセスした場合、適切に404エラーが表示されることを検証
   */
  test('Post Detail: 存在しないslugで404エラーが表示される', async ({ page }) => {
    const NON_EXISTENT_SLUG = 'non-existent-article-slug-12345';
    const TARGET_URL = `/blog/${NON_EXISTENT_SLUG}`;

    // 1. 存在しない記事にアクセス
    const response = await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. HTTPステータスコードが404であること
    expect(response?.status()).toBe(404);

    // 3. 404エラーメッセージまたはエラーページが表示される
    // Remixのデフォルトエラーバウンダリーまたはカスタムエラーページを確認
    const errorElement = page.locator('body');
    await expect(errorElement).toContainText(/404|Not Found|ページが見つかりません/i);
  });


  /**
   * Post Detail TOC Feature: 目次の表示
   * @description
   * 記事本文の見出しが目次として表示されることを検証
   * 階層定義: develop/blog/post-detail/func-spec.md の「目次階層の定義」参照
   */
  test('Post Detail: 目次（Table of Contents）が表示される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 目次コンテナが表示される
    const tocContainer = page.locator('[data-testid="table-of-contents"]');
    await expect(tocContainer).toBeVisible();

    // 3. 目次アイテムが1つ以上存在する
    const tocItems = page.locator('[data-testid="toc-item"]');
    await expect(tocItems.first()).toBeVisible();
    expect(await tocItems.count()).toBeGreaterThan(0);

    // 4. 目次リンクが存在する
    const tocLinks = page.locator('[data-testid="toc-link"]');
    await expect(tocLinks.first()).toBeVisible();
  });

  /**
   * Post Detail TOC Feature: アンカーリンク動作
   * @description
   * 目次項目をクリックすると該当の見出しにスクロールすることを検証
   */
  test('Post Detail: 目次リンククリックで該当見出しへスクロールする', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 目次リンクを取得
    const tocLink = page.locator('[data-testid="toc-link"]').first();
    await expect(tocLink).toBeVisible();

    // 3. リンクのhref属性を取得（#で始まるアンカーリンク）
    const href = await tocLink.getAttribute('href');
    expect(href).toMatch(/^#.+/);

    // 4. 対応する見出し要素のIDを取得
    const headingId = href?.substring(1);

    // 5. リンクをクリック
    await tocLink.click();

    // 6. 対応する見出し要素が表示領域内にあることを確認
    const headingElement = page.locator(`[id="${headingId}"]`);
    await expect(headingElement).toBeInViewport({ timeout: 3000 });
  });

  /**
   * Post Detail TOC Feature: 見出しID付与
   * @description
   * マークダウン変換後の見出しにID属性が付与されていることを検証
   */
  test('Post Detail: 見出しにID属性が付与される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 記事コンテンツ内の見出し要素を取得（階層定義: func-spec.md参照）
    const contentElement = page.locator('[data-testid="post-content-visible"]');
    const headings = contentElement.locator('h2');

    // 3. 見出しが存在する場合、ID属性が付与されていることを確認
    const headingCount = await headings.count();
    if (headingCount > 0) {
      for (let i = 0; i < Math.min(headingCount, 3); i++) {
        const heading = headings.nth(i);
        const id = await heading.getAttribute('id');
        expect(id).toBeTruthy();
        expect(id).not.toBe('');
      }
    }
  });

  /**
   * Post Detail Heading-based Paywall: 未契約ユーザーは制限付きコンテンツのみ表示
   * @description
   * freeContentHeadingが設定された記事で、未契約ユーザーには指定見出しまでのみ表示され、
   * ペイウォールが表示されることを検証
   *
   * Note: このテストを実行するには、freeContentHeading付きのテスト記事が必要
   * 例: frontmatterに `freeContentHeading: "概要"` を設定した記事
   */
  test('Post Detail: 未契約ユーザーは見出しベースの制限コンテンツとペイウォールが表示される', async ({ page }) => {
    // TODO: freeContentHeading付きのテスト記事を作成後、TEST_SLUGを更新
    // 現在は既存記事でテスト（freeContentHeadingが未設定の場合は全文表示）
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 未契約状態で記事詳細ページにアクセス（デフォルトは未契約）
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 可視コンテンツが表示される
    const visibleContent = page.locator('[data-testid="post-content-visible"]');
    await expect(visibleContent).toBeVisible();
    await expect(visibleContent).not.toBeEmpty();

    // 3. freeContentHeadingが設定されている場合、ペイウォールが表示される
    // （設定されていない場合は全文表示され、ペイウォールは表示されない）
    const paywall = page.locator('text=続きを読むには会員登録が必要です');
    const paywallExists = await paywall.count() > 0;

    if (paywallExists) {
      // ペイウォールが表示される
      await expect(paywall).toBeVisible();

      // 非表示コンテンツは表示されない
      const hiddenContent = page.locator('[data-testid="post-content-hidden"]');
      await expect(hiddenContent).not.toBeVisible();
    }
  });

  /**
   * Post Detail Heading-based Paywall: 見出しベース分割の検証
   * @description
   * freeContentHeadingで指定された見出しセクションまでがvisibleContentに含まれ、
   * その次の見出しから先がhiddenContentに含まれることを検証
   *
   * Note: test-e2e-filter記事を使用
   * - frontmatter: freeContentHeading: "まとめ"
   * - visibleContent: ## FilterPanelのE2Eテスト設計 〜 ## まとめ
   * - hiddenContent: ## 参考リソース
   */
  test('Post Detail: 見出しベースで正しくコンテンツが分割される', async ({ page }) => {
    const TEST_SLUG = 'test-e2e-filter';
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. visibleContentに「トラブルシューティング」見出しが含まれる
    const visibleContent = page.locator('[data-testid="post-content-visible"]');
    await expect(visibleContent.locator('h2#トラブルシューティング')).toBeVisible();

    // 3. 「まとめ」見出しもvisibleContentに含まれる（freeContentHeadingで指定された見出しまで表示）
    await expect(visibleContent.locator('h2#まとめ')).toBeVisible();

    // 4. 「参考リソース」見出しはvisibleContentに含まれない（まとめの後なので非表示）
    await expect(visibleContent.locator('h2#参考リソース')).not.toBeVisible();

    // 5. ペイウォールが表示される
    await expect(page.locator('.paywall-message')).toBeVisible();

    // 6. hiddenContentは表示されない（未契約ユーザー）
    const hiddenContent = page.locator('[data-testid="post-content-hidden"]');
    await expect(hiddenContent).not.toBeVisible();
  });

  /**
   * Post Detail Heading-based Paywall: 契約ユーザーは全文表示
   * @description
   * 契約ユーザー（hasActiveSubscription: true）の場合、
   * freeContentHeadingの設定に関わらず全文が表示され、ペイウォールが表示されないことを検証
   */
  test('Post Detail: 契約ユーザーは全文が表示されペイウォールが表示されない', async ({ page }) => {
    // freeContentHeading付きの記事を使用（test-e2e-filter.md）
    const TEST_SLUG = 'test-e2e-filter';
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 0. 契約ユーザーとしてログイン（D1シードユーザー）
    await loginAsSubscribedUser(page);

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. visibleContentが表示される
    const visibleContent = page.locator('[data-testid="post-content-visible"]');
    await expect(visibleContent).toBeVisible();

    // 3. hiddenContentも表示される（全文表示）
    const hiddenContent = page.locator('[data-testid="post-content-hidden"]');
    await expect(hiddenContent).toBeVisible();

    // 4. hiddenContent内に「参考リソース」見出しが含まれることを確認
    await expect(hiddenContent.locator('h2#参考リソース')).toBeVisible();

    // 5. ペイウォールは表示されない
    await expect(page.locator('.paywall-message')).not.toBeVisible();
  });

  /**
   * Post Detail Heading-based Paywall: freeContentHeading未設定時の全文表示
   * @description
   * freeContentHeadingが設定されていない記事は、未契約ユーザーでも全文が表示され、
   * ペイウォールが表示されないことを検証（後方互換性）
   *
   * test-e2e-no-tags.md は freeContentHeading が未設定のテスト記事
   */
  test('Post Detail: freeContentHeading未設定の記事は全文表示される', async ({ page }) => {
    // freeContentHeadingが未設定の記事を使用（test-e2e-no-tags.md）
    const TEST_SLUG = 'test-e2e-no-tags';
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. 可視コンテンツが表示される
    const visibleContent = page.locator('[data-testid="post-content-visible"]');
    await expect(visibleContent).toBeVisible();
    await expect(visibleContent).not.toBeEmpty();

    // 3. 非表示コンテンツは空（freeContentHeading未設定のため全コンテンツがvisible）
    const hiddenContent = page.locator('[data-testid="post-content-hidden"]');
    // hiddenContentが存在しないか、空であることを確認
    const hiddenCount = await hiddenContent.count();
    if (hiddenCount > 0) {
      await expect(hiddenContent).toBeEmpty();
    }

    // 4. ペイウォールは表示されない（freeContentHeading未設定のため全文公開）
    const paywall = page.locator('.paywall-message');
    await expect(paywall).not.toBeVisible();
  });

  /**
   * Post Detail: スクロール位置リセット確認
   * @description
   * 記事間の遷移時にスクロール位置がトップにリセットされることを検証
   */
  test('Post Detail: scroll position resets to top on article navigation', async ({ page }) => {
    // 1. 最初の記事にアクセス（test-e2e-filterは十分な長さがある）
    const FIRST_SLUG = 'test-e2e-filter';
    const FIRST_URL = `/blog/${FIRST_SLUG}`;
    await page.goto(FIRST_URL, { waitUntil: 'networkidle' });

    // 2. コンテンツが完全にレンダリングされるのを待つ
    await page.locator('[data-testid="post-content-visible"]').waitFor({ state: 'visible' });

    // 3. ページがスクロール可能になるまで待機
    await page.waitForFunction(() => {
      return document.documentElement.scrollHeight > window.innerHeight;
    }, { timeout: 5000 });

    // 4. ページを下にスクロール
    await page.evaluate(() => window.scrollTo(0, 500));

    // 5. スクロールが反映されるのを待つ
    await page.waitForFunction(() => window.scrollY > 0, { timeout: 3000 });

    // 6. スクロール位置が下にあることを確認
    const scrollYBefore = await page.evaluate(() => window.scrollY);
    expect(scrollYBefore).toBeGreaterThan(0);

    // 7. 別の記事に遷移（ブログトップから別の記事を選択）
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    const postCards = page.getByTestId('post-card');
    const postCount = await postCards.count();

    if (postCount > 1) {
      // 最初の記事とは異なる記事をクリック
      const secondPostCard = postCards.nth(1);
      await secondPostCard.click();
      await page.waitForLoadState('networkidle');

      // 8. スクロール位置がトップにリセットされていることを確認
      const scrollYAfter = await page.evaluate(() => window.scrollY);
      expect(scrollYAfter).toBe(0);
    }
  });

  /**
   * Post Detail Thumbnail: サムネイル画像の表示
   * @description
   * 記事詳細ページでサムネイル画像が正しく表示されることを検証
   * - サムネイルコンテナが存在する場合、img要素が適切に設定されている
   * - loading="lazy"とdecoding="async"でCLS対策されている
   * - アスペクト比1200/630が適用されている
   *
   * Note: サムネイルはオプション。R2にアセットが存在する場合のみ表示される
   */
  test('Post Detail: サムネイル画像が適切な属性で表示される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. PostDetailSectionが表示されること
    await expect(page.locator('[data-testid="post-detail-section"]')).toBeVisible();

    // 3. サムネイルコンテナが存在するか確認（オプション）
    const thumbnailContainer = page.locator('[data-testid="article-thumbnail-container"]');
    const thumbnailCount = await thumbnailContainer.count();

    if (thumbnailCount > 0) {
      // 4. サムネイルコンテナが表示される
      await expect(thumbnailContainer).toBeVisible();

      // 5. サムネイル画像が存在し、適切な属性が設定されている
      const thumbnailImg = page.locator('[data-testid="article-thumbnail-image"]');
      await expect(thumbnailImg).toBeVisible();

      // 6. loading="lazy"属性が設定されている（CLS対策）
      await expect(thumbnailImg).toHaveAttribute('loading', 'lazy');

      // 7. decoding="async"属性が設定されている（パフォーマンス最適化）
      await expect(thumbnailImg).toHaveAttribute('decoding', 'async');

      // 8. src属性がR2のURLパターンに一致する
      const src = await thumbnailImg.getAttribute('src');
      expect(src).toBeTruthy();
      // R2のブログ画像パスパターン: {base_url}/blog/{slug}/thumbnail.webp
      const r2Config = commonSpec.r2_assets;
      const expectedPattern = new RegExp(
        `${r2Config.base_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${r2Config.blog_path}/.+/${r2Config.thumbnail.filename}`
      );
      expect(src).toMatch(expectedPattern);

      // 9. alt属性が設定されている（アクセシビリティ）
      const alt = await thumbnailImg.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).toContain('サムネイル');
    }
  });

  /**
   * Post Detail Thumbnail: サムネイルのCSSスタイル検証
   * @description
   * サムネイルコンテナにaspect-ratioが適用されていることを検証
   */
  test('Post Detail: サムネイルにアスペクト比が適用される', async ({ page }) => {
    const TEST_SLUG = testArticleSlug;
    const TARGET_URL = `/blog/${TEST_SLUG}`;

    // 1. 記事詳細ページにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. サムネイルコンテナが存在するか確認
    const thumbnailContainer = page.locator('[data-testid="article-thumbnail-container"]');
    const thumbnailCount = await thumbnailContainer.count();

    if (thumbnailCount > 0) {
      // 3. aspect-ratioスタイルが適用されていることを確認
      const aspectRatio = await thumbnailContainer.evaluate((el) => {
        return window.getComputedStyle(el).aspectRatio;
      });
      // CSSで aspect-ratio: 1200 / 630 を指定
      // ブラウザによって "1200 / 630" または "1.90476..." として返される
      expect(aspectRatio).toBeTruthy();
      expect(aspectRatio).not.toBe('auto');
    }
  });

});
