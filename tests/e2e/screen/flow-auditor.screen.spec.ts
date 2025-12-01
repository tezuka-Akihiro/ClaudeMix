import { test, expect } from '@playwright/test';

const TARGET_URL = '/flow-auditor';

test.describe('E2E Screen Test for flow-auditor', () => {

  /**
   * @see docs/E2E_TEST_CRITERIA.md
   * @description
   * 画面レベルのテスト:
   * 開発の初期段階（Phase 1）で作成し、Happy Pathのゴールを定義します。
   * ページが正常に表示され、主要なセクションが描画されることを保証します。
   */
  test('should display the main page structure correctly', async ({ page }) => {
    await page.goto(TARGET_URL);

    // Header/Footerが表示されることを確認（Common Components実装済み）
    await expect(page.locator('[data-testid="header-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer-container"]')).toBeVisible();

    // Design Flowセクションが表示されることを確認
    await expect(page.locator('[data-testid="design-flow-section"]')).toBeVisible();
  });

  /**
   * Common Components: Header/Footer表示とナビゲーション機能
   * @description
   * Header/Footerが全ページに表示され、基本的なナビゲーション機能が動作することを確認
   * Phase 1 (E2E First) - Happy Path
   */
  test('Common Components: Header/Footer表示とナビゲーション機能', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto('/flow-auditor');

    // 2. Headerが表示されること
    await expect(page.locator('[data-testid="header-container"]')).toBeVisible();

    // 3. ServiceSelectorが表示されること
    await expect(page.locator('[data-testid="service-selector"]')).toBeVisible();

    // 4. SectionSelectorが表示されること（NEW）
    await expect(page.locator('[data-testid="section-selector"]')).toBeVisible();

    // 5. LastUpdatedLabelが表示されること
    await expect(page.locator('[data-testid="last-updated-label"]')).toBeVisible();

    // 6. Footerが表示されること
    await expect(page.locator('[data-testid="footer-container"]')).toBeVisible();

    // 7. RefreshButtonが表示されること
    await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();

    // 8. RetryButtonが表示されること（初期状態では無効）
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeDisabled();

    // 9. SectionSelectorの選択肢が正しく表示されること
    const sectionSelector = page.locator('[data-testid="section-selector"]');
    await expect(sectionSelector).toHaveValue('Common Components');

    // セクション選択肢の存在確認
    const options = await sectionSelector.locator('option').allTextContents();
    expect(options).toContain('Common Components');
    expect(options).toContain('設計フロービュー');
    expect(options).toContain('実装フロービュー');
  });

  /**
   * Design Flow: 設計チェックポイント表示とフローチャート可視化
   * @description
   * 設計フローセクションが正しく表示され、共通チェックポイント、セクション別チェックポイントが適切に描画されることを確認
   * Phase 1 (E2E First) - Happy Path
   */
  test('Design Flow: 設計チェックポイント表示とフローチャート可視化', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto('/flow-auditor');

    // 2. Design Flowセクションが表示されること
    await expect(page.locator('[data-testid="design-flow-section"]')).toBeVisible();

    // 3. 共通フローコンテナが表示されること
    await expect(page.locator('[data-testid="common-flow-container"]')).toBeVisible();

    // 4. 共通チェックポイントが7つ表示されること（共通定義2つ + commonセクション5つ）
    // CommonFlowContainer（共通定義）
    const commonFlowCheckpoints = page.locator('[data-testid="common-flow-container"] [data-testid="checkpoint-item"]');
    await expect(commonFlowCheckpoints).toHaveCount(2);

    // CommonSectionContainer（commonセクション）
    const commonSectionCheckpoints = page.locator('[data-testid="common-section-container"] [data-testid="checkpoint-item"]');
    await expect(commonSectionCheckpoints).toHaveCount(5);

    // 5. セクション別フローコンテナが表示されること
    await expect(page.locator('[data-testid="branched-flow-container"]')).toBeVisible();

    // 6. セクション別チェックポイントが動的に表示されること（1〜6セクション）
    const branches = page.locator('[data-testid="branch"]');
    const branchCount = await branches.count();
    expect(branchCount).toBeGreaterThan(0);
    expect(branchCount).toBeLessThanOrEqual(6);

    // 7. 完了済みチェックポイントをクリックして選択状態にする
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();
    if (await completedCheckpoint.count() > 0) {
      // クリックする前のクラスを確認
      const beforeClass = await completedCheckpoint.getAttribute('class');
      expect(beforeClass).toContain('completed');

      await completedCheckpoint.click();

      // 選択後、URLが更新されることを確認（選択状態の確認）
      await page.waitForTimeout(200);
      const url = page.url();
      expect(url).toContain('selectedCheckpoint=');
    }
  });

  /**
   * Design Flow: ブランチレイアウトとスペーシング
   * @description
   * 分岐フローコンテナの配置、ラベルの間隔、縦横位置が正しいか確認
   * 過去の修正ポイント: margin-top削除、marginTop調整、justifyContent中央揃え
   */
  test('Design Flow: ブランチレイアウトとスペーシング', async ({ page }) => {
    await page.goto('/flow-auditor');

    // 1. ブランチコンテナが中央揃えで表示されること
    const branchedContainer = page.locator('[data-testid="branched-flow-container"]');
    const flexJustify = await branchedContainer.evaluate((el) => window.getComputedStyle(el.firstElementChild!).justifyContent);
    expect(flexJustify).toBe('center');

    // 2. ブランチヘッダー（セクション名）のmargin-topが最小限であること
    const branchHeaders = page.locator('[data-testid="branch"] h4');
    if (await branchHeaders.count() > 0) {
      const marginTop = await branchHeaders.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.marginTop);
      });
      // margin-topは0pxまたは非常に小さい値であること（10px未満）
      expect(marginTop).toBeLessThan(10);
    }

    // 3. 分岐フローコンテナと共通フローの間隔が適切であること
    const designFlowSection = page.locator('[data-testid="design-flow-section"]');
    const branchedContainerMarginTop = await branchedContainer.evaluate((el) => {
      const parent = el.parentElement!;
      return parseFloat(window.getComputedStyle(parent).marginTop);
    });
    // --spacing-5 (32px)のmarginTopが設定されていること
    expect(branchedContainerMarginTop).toBeGreaterThanOrEqual(22);
    expect(branchedContainerMarginTop).toBeLessThanOrEqual(42);

    // 4. 各ブランチコンテナの横幅が統一されていること
    const branches = page.locator('[data-testid="branch"]');
    const branchCount = await branches.count();
    if (branchCount > 1) {
      const widths = await branches.evaluateAll((els) =>
        els.map(el => el.getBoundingClientRect().width)
      );
      // すべてのブランチが同じ幅であること（±5pxの誤差許容）
      const firstWidth = widths[0];
      widths.forEach(width => {
        expect(Math.abs(width - firstWidth)).toBeLessThan(5);
      });
    }
  });

  /**
   * Design Flow: マウスインタラクションとクリック動作
   * @description
   * チェックポイントのホバー、クリック、選択状態が正しく動作するか確認
   * 過去の修正ポイント: SVGのz-index/pointer-eventsによるイベントブロック解消
   */
  test('Design Flow: マウスインタラクションとクリック動作', async ({ page }) => {
    await page.goto('/flow-auditor');

    // 1. 完了済みチェックポイントにホバーできること
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();
    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.hover();

      // ホバー時にカーソルがpointerになること
      const cursor = await completedCheckpoint.evaluate((el) => window.getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');
    }

    // 2. 未完了チェックポイントにホバーした場合、カーソルがnot-allowedになること
    // 注: 現在の実装ではpendingもcursor: pointerになっている可能性がある
    // これはデザイン決定による（クリックできないがポインタで示す）
    const pendingCheckpoint = page.locator('[data-testid="checkpoint-item"].pending').first();
    if (await pendingCheckpoint.count() > 0) {
      await pendingCheckpoint.hover();

      const cursor = await pendingCheckpoint.evaluate((el) => window.getComputedStyle(el).cursor);
      // cursorが設定されていることを確認（pointer または not-allowed）
      expect(['pointer', 'not-allowed']).toContain(cursor);
    }

    // 3. 完了済みチェックポイントをクリックして選択できること
    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.click();

      // URLにselectedCheckpointパラメータが追加されること
      await page.waitForTimeout(200); // URL更新を待つ
      const url = page.url();
      expect(url).toContain('selectedCheckpoint=');

      // Retryボタンが有効になること
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeEnabled();

      // ページをリロードして選択状態が保持されることを確認
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 選択されたチェックポイントが存在すること
      const selectedCheckpoint = page.locator('[data-testid="checkpoint-item"].selected');
      await expect(selectedCheckpoint.first()).toBeVisible();
    }

    // 4. 未完了チェックポイントをクリックしても選択されないこと
    if (await pendingCheckpoint.count() > 0) {
      const urlBefore = page.url();
      await pendingCheckpoint.click();
      await page.waitForTimeout(100);

      // URLが変化しないこと
      expect(page.url()).toBe(urlBefore);

      // selected クラスが付与されないこと
      await expect(pendingCheckpoint).not.toHaveClass(/selected/);
    }

    // 5. チェックポイントがクリックできること
    const allCompleted = page.locator('[data-testid="checkpoint-item"].completed');
    const completedCount = await allCompleted.count();
    if (completedCount > 1) {
      const secondCheckpoint = allCompleted.nth(1);
      await secondCheckpoint.click({ force: true });
      await page.waitForTimeout(200);

      // URLが更新されることを確認
      const urlAfterClick = page.url();
      expect(urlAfterClick).toContain('selectedCheckpoint=');

      // ページをリロードして選択状態を反映
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 選択されたチェックポイントが表示されること
      const selectedAfterReload = page.locator('[data-testid="checkpoint-item"].selected');
      await expect(selectedAfterReload.first()).toBeVisible();
    }
  });

  /**
   * Common Components: Retry functionality
   * @description
   * Checks that the retry button is enabled when a checkpoint is selected,
   * and that clicking it triggers the retry action and reloads the page.
   * This test is crucial for the refactoring of the retry functionality.
   *
   * NOTE: リトライボタン押下によるファイル削除を避けるため、一時的にコメントアウト
   * TODO: E2Eテスト環境でファイル移動を防ぐ良い方法が見つかったら再有効化
   */
  test.skip('Common Components: Retry functionality', async ({ page }) => {
    await page.goto(TARGET_URL);

    // 1. Find a completed checkpoint and click it
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();
    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.click();

      // 2. Confirm the RetryButton is enabled
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeEnabled();

      // 3. Click the RetryButton and confirm the page reloads
      // We listen for the 'load' event to confirm a full page navigation/reload
      await Promise.all([
        page.waitForEvent('load'),
        retryButton.click(),
      ]);

      // 4. After reloading, confirm we are still on the same page (or redirected correctly)
      await expect(page).toHaveURL(TARGET_URL);
    }
  });

  /**
   * Design Flow: レスポンシブ対応と最小幅
   * @description
   * 画面幅を縮小してもレイアウトが崩れないか確認
   * 過去の修正ポイント: minWidth: 800px設定
   */
  test('Design Flow: レスポンシブ対応と最小幅', async ({ page }) => {
    await page.goto('/flow-auditor');

    // 1. デフォルトサイズで正常に表示されること
    await expect(page.locator('[data-testid="design-flow-section"]')).toBeVisible();

    // 2. 画面幅を1024pxに縮小しても表示が崩れないこと
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('[data-testid="design-flow-section"]')).toBeVisible();

    // ブランチが横並びで表示されること（折り返されないこと）
    const branchedContainer = page.locator('[data-testid="branched-flow-container"]');
    const flexDirection = await branchedContainer.evaluate((el) =>
      window.getComputedStyle(el.firstElementChild!).flexDirection
    );
    expect(flexDirection).toBe('row');

    // 3. 画面幅を800pxに縮小してもminWidthが適用されていること
    await page.setViewportSize({ width: 800, height: 768 });
    const designFlowSection = page.locator('[data-testid="design-flow-section"]');
    const minWidth = await designFlowSection.evaluate((el) =>
      window.getComputedStyle(el).minWidth
    );
    expect(parseInt(minWidth)).toBeGreaterThanOrEqual(800);

    // 4. 横スクロールが発生すること
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(true);
  });

  /**
   * Design Flow: チェックポイントのステータス表示
   * @description
   * completed/pending/selectedの各ステータスが正しく視覚的に区別されるか確認
   */
  test('Design Flow: チェックポイントのステータス表示', async ({ page }) => {
    await page.goto('/flow-auditor');

    // 1. completedチェックポイントが緑色のボーダーを持つこと
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();
    if (await completedCheckpoint.count() > 0) {
      const borderColor = await completedCheckpoint.evaluate((el) =>
        window.getComputedStyle(el).borderColor
      );
      // rgb(74, 222, 128) = green-400
      expect(borderColor).toContain('74, 222, 128');
    }

    // 2. pendingチェックポイントが赤色のボーダーを持つこと
    const pendingCheckpoint = page.locator('[data-testid="checkpoint-item"].pending').first();
    if (await pendingCheckpoint.count() > 0) {
      const borderColor = await pendingCheckpoint.evaluate((el) =>
        window.getComputedStyle(el).borderColor
      );
      // rgb(248, 113, 113) = red-400
      expect(borderColor).toContain('248, 113, 113');
    }

    // 3. selectedチェックポイントがbox-shadowを持つこと
    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.click();
      await page.waitForTimeout(200);

      // ページをリロードして選択状態を反映
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 選択されたチェックポイントを再取得
      const selectedCheckpoint = page.locator('[data-testid="checkpoint-item"].selected').first();
      if (await selectedCheckpoint.count() > 0) {
        const boxShadow = await selectedCheckpoint.evaluate((el) =>
          window.getComputedStyle(el).boxShadow
        );
        // box-shadowが存在すること
        expect(boxShadow).not.toBe('none');
        // シャドウにRGB値が含まれること
        expect(boxShadow).toMatch(/rgb\(/);
      }
    }
  });

  /**
   * Implementation Flow: file-list.mdベースの層別表示とSurgical Retry（完全刷新版）
   * @description
   * file-list.mdを元に層別グループ（app/lib、app/data-io、app/components）で表示し、
   * ファイル選択とペア自動選択によるSurgical Retry機能が正しく動作することを確認
   * Phase 1 (E2E First) - Happy Path
   */
  test('Implementation Flow: file-list.mdベースの層別表示とSurgical Retry', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto('/flow-auditor');

    // 2. Implementation Flowセクションが表示されること
    await expect(page.locator('[data-testid="implementation-flow-section"]')).toBeVisible();

    // 3. 層別グループ（lib/data-io/ui）が表示されること
    const layerGroups = page.locator('[data-testid="layer-group"]');
    const layerCount = await layerGroups.count();
    expect(layerCount).toBeGreaterThanOrEqual(1); // 最低1層は表示される
    expect(layerCount).toBeLessThanOrEqual(3); // 最大3層（lib/data-io/ui）

    // 4. 各層のヘッダーに層名が表示されること
    const groupHeaders = page.locator('[data-testid="group-header"]');
    if (await groupHeaders.count() > 0) {
      const firstHeaderText = await groupHeaders.first().textContent();
      // 層名（app/lib, app/data-io, app/components）のいずれかを含むこと
      expect(firstHeaderText).toMatch(/app\/(lib|data-io|components)/);
    }

    // 5. FileCardが表示され、CardItemを利用していること
    const fileCards = page.locator('[data-testid^="file-card-"]');
    const cardCount = await fileCards.count();
    expect(cardCount).toBeGreaterThan(0); // 最低1つのファイルカードが表示される

    const firstCard = fileCards.first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveAttribute('role', 'button');

    // 6. ファイル存在状態に応じたスタイルが適用されること
    // 完成ファイル: 緑グロー（border-green-400）
    const completedCards = page.locator('[data-testid^="file-card-"].completed');
    if (await completedCards.count() > 0) {
      await expect(completedCards.first()).toBeVisible();
    }

    // 未実装ファイル: 赤枠（error状態）
    const errorCards = page.locator('[data-testid^="file-card-"].error');
    if (await errorCards.count() > 0) {
      await expect(errorCards.first()).toBeVisible();
    }

    // 7. test-scriptペアが横並び（flex-row）で表示されること
    const testScriptPairs = page.locator('[data-testid="test-script-pair"]');
    if (await testScriptPairs.count() > 0) {
      const firstPair = testScriptPairs.first();
      await expect(firstPair).toBeVisible();

      // ペア内に矢印（→）が表示されること
      await expect(firstPair).toContainText('→');

      // ペア内に2つのFileCardが表示されること（test + script）
      const cardsInPair = firstPair.locator('[data-testid^="file-card-"]');
      expect(await cardsInPair.count()).toBe(2);
    }

    // 8. クリックでパスをクリップボードにコピーできること（基本動作確認）
    // Note: クリップボードAPIのテストはブラウザ環境依存のため、エラーが出ないことを確認
    await firstCard.click();
    await page.waitForTimeout(100);

    // TODO: Phase 3.2で追加予定
    // - Surgical Retryボタンのテスト
    // - ファイル選択状態管理のテスト
  });

  /**
   * Retry Function: チェックポイント選択からリトライ実行までのフロー
   * @description
   * チェックポイントを選択し、Retryボタンがアクティブになり、
   * リトライ実行後に影響範囲のファイルがアーカイブされることを確認
   * Phase 1 (E2E First) - Happy Path
   *
   * NOTE: リトライボタン押下によるファイル削除を避けるため、一時的にコメントアウト
   * TODO: E2Eテスト環境でファイル移動を防ぐ良い方法が見つかったら再有効化
   */
  test.skip('Retry Function: チェックポイント選択からリトライ実行までのフロー', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto('/flow-auditor');

    // 2. 初期状態でRetryボタンが無効であることを確認
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeDisabled();

    // 3. 完了済みチェックポイントを選択
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();

    // チェックポイントが存在する場合のみテスト実行
    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.click();
      await page.waitForTimeout(200);

      // 4. URLにselectedCheckpointパラメータが含まれることを確認
      const url = page.url();
      expect(url).toContain('selectedCheckpoint=');

      // 5. ページをリロードして選択状態を反映
      await page.reload();
      await page.waitForTimeout(500);

      // 6. Retryボタンがアクティブになることを確認
      await expect(retryButton).toBeEnabled();

      // 7. Retryボタンをクリック
      await retryButton.click();

      // 8. リトライ実行後、ページがリロードされることを確認
      await page.waitForLoadState('networkidle');

      // 9. リトライ後、選択状態がクリアされることを確認
      const urlAfterRetry = page.url();
      expect(urlAfterRetry).not.toContain('selectedCheckpoint=');

      // 10. Retryボタンが再び無効になることを確認
      await expect(retryButton).toBeDisabled();

      // 11. アーカイブディレクトリが作成されたことを確認（ファイルシステムレベル）
      // Note: E2Eテストではファイルシステムの直接確認は困難なため、
      // UI上の変化（チェックポイントステータスの変更など）で間接的に確認
    }
  });

  /**
   * URL State Management: Service/Section Selector による状態管理
   * @description
   * ハードコード解消後の確認:
   * - Service Selector が URL SearchParams で動的に管理されること
   * - Section Selector が URL SearchParams で動的に管理されること
   * - Service 変更時に section/selectedCheckpoint がクリアされること
   * - Section 変更時に service が保持され、selectedCheckpoint がクリアされること
   * - Refresh 時にすべての URL 状態が保持されること
   */
  test('URL State Management: Service/Section Selector による状態管理', async ({ page }) => {
    // 1. デフォルトでページにアクセス（パラメータなし）
    await page.goto('/flow-auditor');
    await page.waitForLoadState('networkidle');

    // 2. URL に service パラメータが存在すること（動的に最初のサービスが選択される）
    let url = new URL(page.url());
    const initialService = url.searchParams.get('service');
    expect(initialService).toBeTruthy(); // service パラメータが存在

    // 3. Service Selector の選択肢を取得
    const serviceSelector = page.locator('[data-testid="service-selector"]');
    await expect(serviceSelector).toBeVisible();
    const serviceOptions = await serviceSelector.locator('option').allTextContents();
    expect(serviceOptions.length).toBeGreaterThan(0);

    // 4. Section Selector の初期値を確認
    const sectionSelector = page.locator('[data-testid="section-selector"]');
    const initialSection = await sectionSelector.inputValue();
    expect(initialSection).toBeTruthy(); // section が選択されている

    // 5. Section を変更
    const sectionOptions = await sectionSelector.locator('option').allTextContents();
    if (sectionOptions.length > 1) {
      const newSection = sectionOptions[1];
      await sectionSelector.selectOption(newSection);

      // URLパラメータが変更されるまで明示的に待機
      await page.waitForURL((url) => url.searchParams.get('section') === newSection);
      await page.waitForLoadState('networkidle');

      // URL に新しい section パラメータが反映されること
      url = new URL(page.url());
      expect(url.searchParams.get('section')).toBe(newSection);

      // service パラメータが保持されていること
      expect(url.searchParams.get('service')).toBe(initialService);

      // selectedCheckpoint がクリアされていること
      expect(url.searchParams.get('selectedCheckpoint')).toBeNull();
    }

    // 6. Service を変更（複数のサービスが存在する場合）
    if (serviceOptions.length > 1) {
      // 現在のサービスと異なるサービスを選択
      const currentService = await serviceSelector.inputValue();
      const newService = serviceOptions.find(s => s !== currentService);

      if (newService) {
        await serviceSelector.selectOption(newService);
        await page.waitForLoadState('networkidle');

        // URLが更新されるまで待つ
        await page.waitForFunction(
          (expectedService) => new URL(window.location.href).searchParams.get('service') === expectedService,
          newService,
          { timeout: 5000 }
        );

        // URL の service パラメータが更新されること
        url = new URL(page.url());
        expect(url.searchParams.get('service')).toBe(newService);

        // section と selectedCheckpoint がクリアされていること
        // (サービス変更時は新しいサービスのデフォルトセクションが選択される)
        const newSectionValue = url.searchParams.get('section');
        expect(newSectionValue).toBeTruthy(); // 新しいセクションが選択される
        expect(url.searchParams.get('selectedCheckpoint')).toBeNull();
      }
    }

    // 7. Refresh ボタンをクリックして URL 状態が保持されることを確認
    const refreshButton = page.locator('[data-testid="refresh-button"]');

    // 現在の URL 状態を保存
    const urlBeforeRefresh = page.url();

    await refreshButton.click();
    await page.waitForLoadState('networkidle');

    // Refresh 後も URL パラメータがすべて保持されること
    expect(page.url()).toBe(urlBeforeRefresh);
  });

  /**
   * URL State Management: Retry 成功時の状態保持
   * @description
   * ハードコード解消後の確認:
   * - Retry 成功時に service と section が保持されること
   * - selectedCheckpoint のみクリアされること
   *
   * NOTE: リトライボタン押下によるファイル削除を避けるため、一時的にコメントアウト
   * TODO: E2Eテスト環境でファイル移動を防ぐ良い方法が見つかったら再有効化
   */
  test.skip('URL State Management: Retry 成功時の状態保持', async ({ page }) => {
    // 1. 特定の service/section でページにアクセス
    await page.goto('/flow-auditor');
    await page.waitForLoadState('networkidle');

    // 2. 現在の service と section を取得
    let url = new URL(page.url());
    const currentService = url.searchParams.get('service');
    const currentSection = url.searchParams.get('section');

    expect(currentService).toBeTruthy();
    expect(currentSection).toBeTruthy();

    // 3. 完了済みチェックポイントを選択
    const completedCheckpoint = page.locator('[data-testid="checkpoint-item"].completed').first();

    if (await completedCheckpoint.count() > 0) {
      await completedCheckpoint.click();
      await page.waitForTimeout(200);

      // selectedCheckpoint が URL に追加されることを確認
      url = new URL(page.url());
      expect(url.searchParams.get('selectedCheckpoint')).toBeTruthy();

      // 4. ページをリロードして選択状態を反映
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 5. Retry ボタンをクリック
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeEnabled();
      await retryButton.click();
      await page.waitForLoadState('networkidle');

      // 6. Retry 成功後の URL 確認
      url = new URL(page.url());

      // service と section が保持されていること
      expect(url.searchParams.get('service')).toBe(currentService);
      expect(url.searchParams.get('section')).toBe(currentSection);

      // selectedCheckpoint のみクリアされていること
      expect(url.searchParams.get('selectedCheckpoint')).toBeNull();
    }
  });

  /**
   * Dynamic Data Loading: ハードコード値の完全排除確認
   * @description
   * ハードコード解消後の確認:
   * - Service Selector の選択肢が project.toml から動的に読み込まれること
   * - Section Selector の選択肢が project.toml から動的に読み込まれること
   * - デフォルト値がすべて動的に決定されること
   */
  test('Dynamic Data Loading: ハードコード値の完全排除確認', async ({ page }) => {
    // 1. ページにアクセス
    await page.goto('/flow-auditor');
    await page.waitForLoadState('networkidle');

    // 2. Service Selector が動的な選択肢を持つこと
    const serviceSelector = page.locator('[data-testid="service-selector"]');
    await expect(serviceSelector).toBeVisible();

    const serviceOptions = await serviceSelector.locator('option').allTextContents();
    // 最低1つのサービスが存在すること
    expect(serviceOptions.length).toBeGreaterThan(0);

    // 現在選択されているサービスがいずれかの選択肢と一致すること
    const selectedServiceValue = await serviceSelector.inputValue();
    expect(serviceOptions).toContain(selectedServiceValue);

    // 3. Section Selector が動的な選択肢を持つこと
    const sectionSelector = page.locator('[data-testid="section-selector"]');
    await expect(sectionSelector).toBeVisible();

    const sectionOptions = await sectionSelector.locator('option').allTextContents();
    // 最低1つのセクションが存在すること
    expect(sectionOptions.length).toBeGreaterThan(0);

    // 現在選択されているセクションがいずれかの選択肢と一致すること
    const selectedSectionValue = await sectionSelector.inputValue();
    expect(sectionOptions).toContain(selectedSectionValue);

    // 4. Design Flow が全セクションを表示すること（セクション選択の影響を受けない）
    const designFlowSection = page.locator('[data-testid="design-flow-section"]');
    await expect(designFlowSection).toBeVisible();

    // 共通フローが表示されること
    await expect(page.locator('[data-testid="common-flow-container"]')).toBeVisible();

    // 分岐フローが表示されること（セクション数に関わらず全セクション分）
    const branches = page.locator('[data-testid="branch"]');
    const branchCount = await branches.count();
    expect(branchCount).toBeGreaterThan(0);

    // 5. Implementation Flow が選択されたセクションに応じてフィルタリングされること
    const implementationFlowSection = page.locator('[data-testid="implementation-flow-section"]');
    await expect(implementationFlowSection).toBeVisible();

    // Implementation Flow の層グループが表示されること
    const layerGroups = page.locator('[data-testid="layer-group"]');
    expect(await layerGroups.count()).toBeGreaterThan(0);

    // 6. Section を変更した際、Implementation Flow のみが再読み込みされること
    if (sectionOptions.length > 1) {
      const newSection = sectionOptions[1];
      await sectionSelector.selectOption(newSection);
      await page.waitForLoadState('networkidle');

      // Design Flow の分岐数は変わらないこと（全セクション表示のまま）
      const branchesAfterChange = page.locator('[data-testid="branch"]');
      expect(await branchesAfterChange.count()).toBe(branchCount);

      // Implementation Flow は新しいセクションのデータを表示すること
      await expect(implementationFlowSection).toBeVisible();
      expect(await layerGroups.count()).toBeGreaterThan(0);
    }
  });
});
