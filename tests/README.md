# `tests` ディレクトリ

## 1. 概要

このディレクトリは、プロジェクトにおける**テスト関連のすべてのアセットを集約する場所**です。

アプリケーションコード (`app/`) からテストの関心を完全に分離することで、プロジェクト全体の見通しを良くし、メンテナンス性を向上させることを目的としています。

## 2. ディレクトリ構造

`tests` ディレクトリ配下は、テストの種類（`e2e`, `unit`, `lint`）ごとにディレクトリを分け、それぞれが自己完結するように構成されています。

~~~plaintext
tests/
├── e2e/
│   ├── playwright.config.ts    # E2Eテスト (Playwright) の設定
│   ├── screen/                 # 画面レベルのテストコード
│   ├── section/                # セクションレベルのテストコード
│   ├── test-results/           # 実行結果 (Git管理外)
│   └── playwright-report/      # HTMLレポート (Git管理外)
├── unit/
│   ├── vitest.config.ts        # ユニットテスト (Vitest) の設定
│   └── coverage/               # カバレッジレポート (Git管理外)
└── lint-report/            # 静的解析のレポート (Git管理外)
~~~

## 3. テストコードの配置ルール

テストコードの配置は、テストの性質に応じて最適な場所を選択するハイブリッドアプローチを採用しています。

### E2Eテスト (Playwright)

- **役割**: アプリケーション全体をユーザー視点でテストします。
- **配置**: `tests/e2e/` 配下に集約します。
  - `screen/`: ページ全体の骨格を検証するテスト (Outside-in TDDの起点)
  - `section/`: 特定の機能セクションの詳細な振る舞いを検証するテスト

### ユニットテスト (Vitest)

- **役割**: 特定のコンポーネントや関数の動作を単体でテストします。
- **配置**: テスト対象との関連性を最重視し、`app/` 配下にソースコードと隣接して配置（コロケーション）します。

## 4. 関連コマンド

### E2Eテスト (Playwright)

#### セットアップ

E2Eテストを実行する前に、Playwrightのブラウザをインストールする必要があります。

~~~bash
# Playwrightブラウザのインストール
npx playwright install

# システム依存関係も含めてインストール（Linux環境）
npx playwright install --with-deps
~~~

#### 実行コマンド

~~~bash
# 全てのE2Eテストを実行
npm run test:e2e

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
~~~

#### トラブルシューティング

##### Playwrightブラウザがダウンロードできない

環境の制約によりPlaywrightブラウザのダウンロードが失敗する場合:

1. **CI/CD環境での実行**: GitHub ActionsなどのCI環境では、通常は問題なくインストールできます
2. **Dockerコンテナでの実行**: 公式のPlaywright Dockerイメージを使用することを検討してください
3. **タイプチェックのみ実行**: ブラウザがなくてもTypeScriptのタイプチェックは可能です: `npm run typecheck:e2e`

##### 環境変数でのブラウザ指定

特定のブラウザのみをインストールしたい場合:

~~~bash
# Chromiumのみインストール
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
npx playwright install chromium
~~~

### ユニットテスト (Vitest)

~~~bash
# 全てのユニットテストを実行
npm test

# ユニットテストをUIモードで実行
npm run test:ui
~~~
