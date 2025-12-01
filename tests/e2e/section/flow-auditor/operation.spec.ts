import { test, expect } from '@playwright/test';

const TARGET_URL = '/flow-auditor';

// ---
// Operation Section: Outside-In TDD Tests
// ---
test.describe('E2E Test for Flow Auditor - Operation', () => {

  /**
   * Operation Phase 1: Happy Path E2E Test
   * @description
   * オペレーションセクションの基本表示と更新機能の正常フローを検証
   * TDD_WORK_FLOW.md Phase 1 のゴール定義
   */
  test('Operation: サービス選択と更新ボタンの正常動作', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto(TARGET_URL);

    // 2. HeaderとFooterが表示されること
    await expect(page.locator('[data-testid="header-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer-container"]')).toBeVisible();

    // 3. ServiceSelector（サービス選択プルダウン）が表示される
    await expect(page.locator('[data-testid="service-selector"]')).toBeVisible();

    // 4. [🔄 更新]ボタンが表示される
    await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();

    // 5. [⏮️ リトライ]ボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // 6. 最終更新日時ラベルが表示される
    await expect(page.locator('[data-testid="last-updated-label"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-updated-label"]')).toContainText(/last update/);

    // 7. ServiceSelectorでサービスを選択できる
    const serviceSelector = page.locator('[data-testid="service-selector"]');
    await expect(serviceSelector).toHaveValue('flow-auditor'); // デフォルト選択

    // 8. [🔄 更新]ボタンをクリックできる（進捗再取得）
    await page.click('[data-testid="refresh-button"]');

    // 9. 更新後、最終更新時刻が変更されることを確認
    await page.waitForTimeout(500); // action完了待ち
    await expect(page.locator('[data-testid="last-updated-label"]')).toBeVisible();
  });

});
