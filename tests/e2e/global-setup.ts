import { chromium, type FullConfig } from '@playwright/test';
import { createAuthenticatedUser } from '../utils/auth-helper';

const authFile = 'storageState.json';

/**
 * 全てのテストの前に一度だけ実行されるグローバルセットアップ。
 * ユーザーを一人作成し、その認証情報を `storageState.json` に保存します。
 * 各テストはこのファイルを読み込むことで、ログイン済みの状態から開始できます。
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  if (!baseURL) {
    throw new Error('`baseURL` が playwright.config.ts で設定されていません。');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(baseURL);
  await createAuthenticatedUser(page, { prefix: 'global-user' });

  await page.context().storageState({ path: authFile });
  await browser.close();
}

export default globalSetup;