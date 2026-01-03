# `tests` ディレクトリ

## 1. 概要

このディレクトリは、プロジェクトにおける**テスト関連のすべてのアセットを集約する場所**です。

アプリケーションコード (`app/`) からテストの関心を完全に分離することで、プロジェクト全体の見通しを良くし、メンテナンス性を向上させることを目的としています。

## 2. ディレクトリ構造

`tests` ディレクトリ配下は、テストの種類（`e2e`, `unit`）ごとにディレクトリを分け、それぞれが自己完結するように構成されています。

```plaintext
tests/
├── e2e/
│   ├── account/                # アカウント機能のE2Eテスト
│   │   ├── authentication.spec.ts
│   │   ├── common.spec.ts
│   │   ├── password-reset.spec.ts
│   │   ├── profile.spec.ts
│   │   └── subscription.spec.ts
│   ├── blog/                   # ブログ機能のE2Eテスト
│   │   ├── access-control.spec.ts
│   │   ├── common.spec.ts
│   │   ├── post-detail.spec.ts
│   │   └── posts.spec.ts
│   ├── playwright.config.ts    # E2Eテスト (Playwright) の設定
│   ├── tsconfig.json           # E2EテストのTypeScript設定
│   ├── test-results/           # 実行結果 (Git管理外)
│   └── playwright-report/      # HTMLレポート (Git管理外)
├── unit/
│   ├── vitest.config.ts        # ユニットテスト (Vitest) の設定
│   ├── setup-test-env.ts       # テスト環境のセットアップ
│   └── coverage/               # カバレッジレポート (Git管理外)
└── utils/
    └── loadSpec.ts             # テスト用のspec読み込みユーティリティ
```

## 3. テストコードの配置ルール

テストコードの配置は、テストの性質に応じて最適な場所を選択するハイブリッドアプローチを採用しています。

### E2Eテスト (Playwright)

- **役割**: アプリケーション全体をユーザー視点でテストします。
- **配置**: `tests/e2e/` 配下に機能単位で集約します。
  - `account/`: アカウント関連機能のテスト（認証、プロフィール、パスワードリセット、サブスクリプション等）
  - `blog/`: ブログ関連機能のテスト（記事一覧、記事詳細、アクセス制御等）
  - 新しい機能を追加する場合は、機能名のディレクトリを作成してテストを配置します

### ユニットテスト (Vitest)

- **役割**: 特定のコンポーネントや関数の動作を単体でテストします。
- **配置**: テスト対象との関連性を最重視し、`app/` 配下にソースコードと隣接して配置（コロケーション）します。

### テストユーティリティ

- **役割**: E2Eテストとユニットテストで共通して使用するヘルパー関数を提供します。
- **配置**: `tests/utils/` 配下に集約します。
  - `loadSpec.ts`: テスト用のspec読み込みユーティリティ（`{section}-spec.yaml`を読み込む）

## 4. 関連コマンド

### E2Eテストコマンド

#### セットアップ

E2Eテストを実行する前に、Playwrightのブラウザをインストールする必要があります。

```bash
# Playwrightブラウザのインストール
npx playwright install

# システム依存関係も含めてインストール（Linux環境）
npx playwright install --with-deps
```

#### E2Eテストの実行手順（必須）

**重要**: E2Eテストを実行する前に、必ず以下の手順を守ってください：

1. **開発サーバーを起動**:

   ```bash
   npm run dev:wrangler
   ```

   - Wranglerでランタイム制約を反映した環境を使用（必須）
   - 通常の `npm run dev` では正しくテストできません

2. **E2Eテストを実行**:

   ```bash
   # ブログ機能のE2Eテストを実行（デフォルト）
   npm run test:e2e

   # 特定の機能のテストを実行（例: accountフォルダ内のテスト）
   npx playwright test tests/e2e/account --config=tests/e2e/playwright.config.ts --reporter=list

   # E2EテストをUIモードで実行
   npm run test:e2e:ui

   # E2Eテストをheadedモードで実行（ブラウザを表示）
   npm run test:e2e:headed

   # E2Eテストをデバッグモードで実行
   npm run test:e2e:debug

   # 直前のテスト結果をHTMLレポートで表示
   npm run test:e2e:report

   # E2Eテストのタイプチェックのみ実行
   npm run typecheck:e2e
   ```

3. **テスト終了後のクリーンアップ（必須）**:
   - 開発サーバーを**必ず停止**すること
   - 停止せずに放置するとポートが占有され次回起動に失敗します

#### テストデータの動的生成（必須）

E2Eテストを作成する際、**ハードコードされたテストデータは禁止**です。

**禁止事項**:

- 固定のメールアドレス、ユーザーID、その他のテストデータ
- 固定値の使用（データベース競合・テスト失敗の原因）

**必須パターン**:

```typescript
// メールアドレスの動的生成
const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;

// 例
const email = `profile-test-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
const newEmail = `new-email-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
```

**理由**:

- テストの再実行可能性を保証
- データベース上の重複エラーを防止
- 並列実行時の競合を回避

#### トラブルシューティング

##### テストが接続エラーで失敗する / コンポーネントが表示されない

**症状**: 以下のいずれかが発生した場合

- テストが `ERR_CONNECTION_REFUSED` で全て失敗
- モーダルやコンポーネントが表示されない
- ナビゲーションテストが予期せず失敗
- 開発サーバーが正常に起動しているのにテストが接続できない
- コード変更が反映されない（stale cache）

**原因**: Windows環境でのWranglerキャッシュ・プロセス問題

Windowsのファイルロック機構により、`.wrangler/state/v3`フォルダ内のSQLiteデータベースやキャッシュファイルがNode.jsプロセスによってロックされ、削除できない状態になる。

**解決策**: キャッシュクリーンアップスクリプトを実行

```bash
# Wranglerキャッシュをクリアして再起動
bash scripts/clean-wrangler-cache.sh
npm run dev:wrangler
```

このスクリプトは以下を自動実行します：

- `.wrangler/state/v3`フォルダの削除を試行
- 削除失敗時、自動的にNode.jsプロセスを停止
- D1マイグレーションの再適用

##### Playwrightブラウザがダウンロードできない

環境の制約によりPlaywrightブラウザのダウンロードが失敗する場合:

1. **CI/CD環境での実行**: GitHub ActionsなどのCI環境では、通常は問題なくインストールできます
2. **Dockerコンテナでの実行**: 公式のPlaywright Dockerイメージを使用することを検討してください
3. **タイプチェックのみ実行**: ブラウザがなくてもTypeScriptのタイプチェックは可能です: `npm run typecheck:e2e`

##### 環境変数でのブラウザ指定

特定のブラウザのみをインストールしたい場合:

```bash
# Chromiumのみインストール
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
npx playwright install chromium
```

### ユニットテスト (Vitest) の実行コマンド

```bash
# 全てのユニットテストを実行（watch mode）
npm test

# ユニットテストを1回だけ実行（CI向け）
npm run test:run

# テストカバレッジレポートを生成
npm run coverage

# ユニットテストをUIモードで実行
npm run test:ui
```

**注意**: ユニットテストは `app/` 配下にソースコードと隣接して配置されています（コロケーション方式）。例: `app/lib/blog/posts/filterPosts.test.ts`
