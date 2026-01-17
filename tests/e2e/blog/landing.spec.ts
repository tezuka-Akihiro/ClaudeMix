import { test, expect } from '@playwright/test';
import { loadSpec } from '../../utils/loadSpec';
import type { BlogLandingSpec } from '~/specs/blog/types';

const TARGET_URL = '/blog/landing/engineer';

// テスト全体で使用する spec データをキャッシュ
let landingSpec: BlogLandingSpec;

test.beforeAll(async () => {
  landingSpec = await loadSpec<BlogLandingSpec>('blog', 'landing');
});

// ファイル全体が完了したら5秒待機（次のファイル実行前に環境を休ませる）
test.afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
});

/**
 * Landing Section E2Eテスト
 * @description ランディングページの表示、ナビゲーション、スクロールアニメーションを確認
 *
 * @reference
 * - develop/blog/landing/func-spec.md
 * - develop/blog/landing/uiux-spec.md
 * - app/specs/blog/landing-spec.yaml
 */
test.describe.serial('E2E Section Test for blog - landing', () => {

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  /**
   * 統合テスト1: ランディングページの基本表示確認
   * @description すべての主要セクションが表示されることを確認
   */
  test('should display landing page with all main sections', async ({ page }) => {
    // 1. エンジニア向けLPにアクセス
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. HeroSection（ファーストビュー）が表示される
    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible();

    // 3. ScrollSection（スクロールアニメーション領域）が表示される
    const scrollSection = page.getByTestId('scroll-section');
    await expect(scrollSection).toBeVisible();

    // 4. MangaPanelGrid（漫画パネル配列）が表示される
    const mangaPanelGrid = page.getByTestId('manga-panel-grid');
    await expect(mangaPanelGrid).toBeVisible();

    // 5. CTASection（CTAボタン群）が表示される
    const ctaSection = page.getByTestId('cta-section');
    await expect(ctaSection).toBeVisible();

    // 6. LandingFooter（フッター）が表示される
    const landingFooter = page.getByTestId('landing-footer');
    await expect(landingFooter).toBeVisible();
  });

  /**
   * 統合テスト2: HeroSectionの内容確認
   * @description ファーストビューにキャッチコピーと漫画パネルが表示されること
   */
  test('should display catch copy and manga panels in HeroSection', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible();

    // キャッチコピーが表示されること
    const catchCopy = heroSection.getByTestId('catch-copy');
    await expect(catchCopy).toBeVisible();
    await expect(catchCopy).not.toBeEmpty();

    // 漫画パネルが表示されること（Above-the-fold: 1-2枚）
    const mangaPanels = heroSection.getByTestId('manga-panel');
    const panelCount = await mangaPanels.count();
    expect(panelCount).toBeGreaterThanOrEqual(landingSpec.business_rules.manga_panel_count.hero_min);
    expect(panelCount).toBeLessThanOrEqual(landingSpec.business_rules.manga_panel_count.hero_max);

    // 各漫画パネルに画像が表示されること
    for (let i = 0; i < panelCount; i++) {
      const panel = mangaPanels.nth(i);
      const img = panel.locator('img');
      await expect(img).toBeVisible();

      // 遅延ロード属性が設定されていること（hero以外）
      if (i >= landingSpec.business_rules.manga_panel_count.hero_max) {
        const loadingAttr = await img.getAttribute('loading');
        expect(loadingAttr).toBe('lazy');
      }
    }
  });

  /**
   * 統合テスト3: ScrollSectionのアニメーション要素確認
   * @description AnimatedBlockが表示され、data-animation属性が設定されていること
   */
  test('should display AnimatedBlocks with animation attributes', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const scrollSection = page.getByTestId('scroll-section');
    await expect(scrollSection).toBeVisible();

    // AnimatedBlockが表示されること
    const animatedBlocks = scrollSection.getByTestId('animated-block');
    const blockCount = await animatedBlocks.count();
    expect(blockCount).toBeGreaterThan(0);

    // 各AnimatedBlockにdata-animation属性が設定されていること
    for (let i = 0; i < Math.min(blockCount, 3); i++) {
      const block = animatedBlocks.nth(i);
      await expect(block).toBeVisible();

      const animationType = await block.getAttribute('data-animation');
      expect(animationType).toBeTruthy();
      expect(landingSpec.animation.types).toContain(animationType);
    }
  });

  /**
   * 統合テスト4: MangaPanelGridの表示確認
   * @description 漫画パネルがグリッドレイアウトで表示されること
   */
  test('should display manga panels in grid layout', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const mangaPanelGrid = page.getByTestId('manga-panel-grid');
    await expect(mangaPanelGrid).toBeVisible();

    // 漫画パネルが表示されること
    const mangaPanels = mangaPanelGrid.getByTestId('manga-panel');
    const panelCount = await mangaPanels.count();
    expect(panelCount).toBeGreaterThan(0);
    expect(panelCount).toBeLessThanOrEqual(landingSpec.business_rules.manga_panel_count.total_max);

    // 各パネルに画像が表示されること
    for (let i = 0; i < Math.min(panelCount, 3); i++) {
      const panel = mangaPanels.nth(i);
      const img = panel.locator('img');
      await expect(img).toBeVisible();

      // alt属性が設定されていること（アクセシビリティ）
      const altAttr = await img.getAttribute('alt');
      expect(altAttr).toBeTruthy();
    }
  });

  /**
   * 統合テスト5: CTASectionのボタン確認
   * @description CTAボタンが正しく表示され、適切なリンク先を持つこと
   */
  test('should display CTA buttons with correct links', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const ctaSection = page.getByTestId('cta-section');
    await expect(ctaSection).toBeVisible();

    // CTAボタンが表示されること
    const ctaButtons = ctaSection.getByTestId('cta-button');
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBe(landingSpec.cta.buttons.length);

    // 各ボタンのラベルとリンク先を確認
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i);
      const expectedButton = landingSpec.cta.buttons[i];

      await expect(button).toBeVisible();
      await expect(button).toHaveText(expectedButton.label);

      // aria-label属性が設定されていること
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBe(expectedButton.aria_label);

      // href属性が正しいこと
      const href = await button.getAttribute('href');
      expect(href).toBe(expectedButton.url);
    }
  });

  /**
   * 統合テスト6: LandingFooterの表示確認
   * @description フッターがシンプルな構成で表示されること
   */
  test('should display LandingFooter with simple structure', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const landingFooter = page.getByTestId('landing-footer');
    await expect(landingFooter).toBeVisible();

    // フッターリンクが表示されること（法務リンク等）
    const footerLinks = landingFooter.getByTestId('footer-link');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  /**
   * 統合テスト7: ターゲットパラメータ検証
   * @description 有効なターゲット（engineer）でアクセスできること
   */
  test('should accept valid target parameter (engineer)', async ({ page }) => {
    await page.goto('/blog/landing/engineer', { waitUntil: 'domcontentloaded' });

    // ページが正常にロードされること
    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible();

    // URLが変更されていないこと（リダイレクトされていない）
    await expect(page).toHaveURL('/blog/landing/engineer');
  });

  /**
   * 統合テスト8: 不正なターゲットパラメータのフォールバック
   * @description 不正なターゲットでデフォルト（engineer）にフォールバックすること
   */
  test('should fallback to default target for invalid parameter', async ({ page }) => {
    await page.goto('/blog/landing/invalid-target', { waitUntil: 'domcontentloaded' });

    // ページが正常にロードされること（エラーにならない）
    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible();

    // デフォルトターゲットのコンテンツが表示されること
    // （実装では、不正なターゲットをデフォルト値に置き換える）
  });

  /**
   * 統合テスト9: レスポンシブ表示確認（モバイル）
   * @description モバイル画面でも正常にレイアウトされること
   */
  test('should display correctly on mobile viewport', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 主要セクションが表示されること
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('scroll-section')).toBeVisible();
    await expect(page.getByTestId('manga-panel-grid')).toBeVisible();
    await expect(page.getByTestId('cta-section')).toBeVisible();
    await expect(page.getByTestId('landing-footer')).toBeVisible();
  });

  /**
   * 統合テスト10: CTAボタンナビゲーション確認
   * @description ドキュメントボタンをクリックして/blogへ遷移できること
   */
  test('should navigate to documentation when clicking first CTA button', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const ctaSection = page.getByTestId('cta-section');
    const ctaButtons = ctaSection.getByTestId('cta-button');

    // 最初のボタン（ドキュメント）をクリック
    const firstButton = ctaButtons.first();
    await expect(firstButton).toHaveText('ドキュメント');
    await firstButton.click();

    // /blogへ遷移すること
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/blog');
  });
});
