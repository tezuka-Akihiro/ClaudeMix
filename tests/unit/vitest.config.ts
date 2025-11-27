import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '../../app'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, './setup-test-env.ts'),
    root: path.resolve(__dirname, '../../'),

    /*
     * テスト対象ファイルの探索パス。
     * プロジェクトルートから見た相対パスで指定します。
     */
    include: [
      'app/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,ts}'
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      /* カバレッジレポートの出力先。`tests/unit/coverage/` になります。 */
      reportsDirectory: 'tests/unit/coverage',

      // trueにすることで、テストされていないファイルもカバレッジの対象に含めます
      all: true,

      // カバレッジ計測の対象とするソースコードファイルを指定します
      include: ['app/**/*.{ts,tsx}'],

      // カバレッジ計測から除外するファイルを指定します
      // (ルート定義、エントリーポイント、型定義など)
      exclude: [
        'app/entry.client.tsx',
        'app/entry.server.tsx',
        'app/root.tsx',
        'app/routes/**/*',
        'app/types/**/*',
        '**/*.d.ts',
      ],
    },
  },
});