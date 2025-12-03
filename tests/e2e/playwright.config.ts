import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /*
   * テストファイルが格納されているディレクトリ。
   * この設定ファイルからの相対パスで `screen` と `section` ディレクトリを探索します。
   */
  testDir: './',

  /*
   * テスト実行時のアーティファクト（トレース、スクリーンショット、ビデオ）の出力先。
   * この設定ファイルからの相対パスで `tests/e2e/test-results/` に出力されます。
   */
  outputDir: './test-results',

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* 1つのテストが失敗したら全体を停止 */
  maxFailures: 1,

  /* 安定性優先で順次実行（並列実行はVite HMR不安定のため無効化） */
  workers: 1,

  /*
   * レポーターの設定。
   * HTMLレポートが `tests/e2e/playwright-report/` に出力されます。
   */
  reporter: [['html', { outputFolder: './playwright-report' }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://[::1]:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* アクションのタイムアウト（デフォルト30秒を5秒に短縮） */
    actionTimeout: 5000,

    /* ナビゲーションのタイムアウト */
    navigationTimeout: 5000,
  },

  /* テスト全体のタイムアウト（デフォルト30秒） */
  timeout: 30000,

  /* expectアサーションのタイムアウト（デフォルト5秒） */
  expect: {
    timeout: 5000,
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});