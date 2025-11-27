import { test, expect } from '@playwright/test';

const TARGET_URL = '/{{service}}';

test.describe('E2E Screen Test for {{service}}', () => {

  /**
   * @see docs/E2E_TEST_CRITERIA.md
   * @description
   * 画面レベルのテスト:
   * 開発の初期段階（Phase 1）で作成し、Happy Pathのゴールを定義します。
   * ページが正常に表示され、主要なセクションが描画されることを保証します。
   */
  test('should display the main page structure correctly', async ({ page }) => {
    await page.goto(TARGET_URL);

    // ページの主要な見出しが表示されることを確認
    await expect(page.getByRole('heading', { name: '{{service}}', level: 1 })).toBeVisible();

    // この画面を構成する主要なセクションが描画されていることを確認 (例)
    // await expect(page.getByTestId('{{section1}}-section')).toBeVisible();
    // await expect(page.getByTestId('{{section2}}-section')).toBeVisible();
  });
});