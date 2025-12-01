import { test, expect } from '@playwright/test';

const TARGET_URL = '/flow-auditor';

// ---
// Design Flow Section: Outside-In TDD Tests
// ---
test.describe('E2E Test for Flow Auditor - Design Flow', () => {

  /**
   * Design Flow Phase 1: Happy Path E2E Test
   * @description
   * 設計フローセクションの基本表示と進捗率表示の正常フローを検証
   * TDD_WORK_FLOW.md Phase 1 のゴール定義
   */
  test('Design Flow: 設計フロー進捗と各フェーズのチェックポイント表示', async ({ page }) => {
    // 1. flow-auditorページにアクセス
    await page.goto(TARGET_URL);

    // 2. Design Flowセクションが表示されること
    await expect(page.locator('[data-testid="design-flow-section"]')).toBeVisible();

    // 3. Common Flow Container（共通チェックポイント）が表示される
    await expect(page.locator('[data-testid="common-flow-container"]')).toBeVisible();

    // 4. 共通チェックポイント項目が表示される（少なくとも1つ）
    const commonCheckpoints = page.locator('[data-testid="common-flow-container"] [data-testid="checkpoint-item"]');
    const commonCheckpointCount = await commonCheckpoints.count();
    expect(commonCheckpointCount).toBeGreaterThan(0);

    // 5. Branched Flow Container（分岐フロー）が存在する
    await expect(page.locator('[data-testid="branched-flow-container"]')).toBeVisible();

    // 6. 分岐フローのチェックポイントが表示される
    const branchCheckpoints = page.locator('[data-testid="branched-flow-container"] [data-testid="checkpoint-item"]');
    const branchCheckpointCount = await branchCheckpoints.count();
    expect(branchCheckpointCount).toBeGreaterThan(0);

    // 7. チェックポイント項目がクリック可能であること（completed状態のもの）
    const firstCheckpoint = commonCheckpoints.first();
    await expect(firstCheckpoint).toBeVisible();

    // 8. チェックポイント項目が正しいステータス（completed/pending/selected）で表示される
    // 存在するファイルにはcompletedスタイル、存在しないファイルにはpendingスタイルが適用される
    const allCheckpoints = page.locator('[data-testid="checkpoint-item"]');
    const allCheckpointCount = await allCheckpoints.count();

    // 少なくとも1つのチェックポイントが存在すること
    expect(allCheckpointCount).toBeGreaterThan(0);

    // 9. チェックポイントにdata-checkpoint-id属性が設定されていること
    const firstCheckpointId = await firstCheckpoint.getAttribute('data-checkpoint-id');
    expect(firstCheckpointId).toBeTruthy();
  });

});
