import { test, expect } from '@playwright/test';

const TARGET_URL = '/{{service}}';

test.describe('E2E Section Test for {{service}} - {{section}}', () => {

  /**
   * @see docs/E2E_TEST_CRITERIA.md
   * @description
   * セクションレベルのテスト:
   * 開発の後半（Phase 3）で、エラーケースや詳細なインタラクションを検証するために追加します。
   * このセクションが担う最も重要なユーザーアクションが成功することを保証します。
   */
  test('should handle the primary user action in the section', async ({ page }) => {
    await page.goto(TARGET_URL);

    // 例: フォームを入力して送信し、成功メッセージが表示されることを確認
    // const section = page.getByTestId('{{section}}-section');
    // await section.getByLabel('ユーザー名').fill('Test User');
    // await section.getByRole('button', { name: '保存' }).click();
    // await expect(page.getByText('保存しました')).toBeVisible();
  });
});