# ClaudeMix - Remix Boilerplate Project Context

このドキュメントは、ClaudeMixプロジェクトにおける**プロジェクト固有の常識**を定義します。すべてのコード生成・編集時に、この規範を参照してください。

---

## 📋 プロジェクト基本情報

**プロジェクト名**: ClaudeMix (Remix Boilerplate)
**コンセプト**: Claudeとの協調開発を最適化したRemix MVPボイラープレート
**技術スタック**: Remix + TypeScript + Tailwind CSS + Cloudflare Pages
**対象**: Remix + Claude でMVP開発を行う開発者

**参考リンク**:

- Remix公式: <https://remix.run>
- Cloudflare Pages: <https://pages.cloudflare.com>

---

## 🔧 共通bashコマンドとその目的

開発時に頻繁に使用するコマンド一覧：

| コマンド | 目的 | 備考 |
| :--- | :--- | :--- |
| `npm run dev:wrangler` | 開発サーバー起動 | Wranglerでランタイム制約を反映した開発環境を起動（必須） |
| `npm test` | ユニットテスト実行 | Vitestを使用（E2Eはオペレーターが実行） |
| `npm run typecheck` | 型チェック | すべてのTypeScriptファイルを検証 |
| `npm run lint:all` | 全リント実行 | テンプレート、CSS、Markdown、ブログメタデータを検証 |
| `npm run lint:template` | テンプレートリント | 行数制限、ハードコード検出 |
| `npm run lint:css-arch` | CSSアーキテクチャ検証 | スタイリング規律の遵守を確認 |
| `npm run lint:md` | Markdownリント | ブログ記事のMarkdownを検証・修正 |
| `npm run generate` | コード生成 | スキャフォールドとリントを実行 |
| `npm run coverage` | カバレッジレポート生成 | テストカバレッジを確認 |

---

## 📁 コアファイルとプロジェクト構造

### ディレクトリ構造

app/
├── routes/              # Remixルート定義（UI層）
│   └── blog.*/         # ブログ機能のルート
├── components/          # UIコンポーネント（UI層）
│   └── blog/           # ブログ専用コンポーネント
├── lib/                 # 純粋ロジック層（副作用なし）
│   └── blog/           # ブログビジネスロジック
├── data-io/             # 副作用層（DB、API、ファイルI/O）
│   └── blog/           # ブログデータ取得
├── spec-loader/         # spec.yamlの動的読み込み
├── specs/               # 自動生成されたspec定義（ビルド時生成）
└── styles/              # Tailwindクラス定義層

docs/
├── boilerplate_architecture/  # 開発フロー定義書
├── CSS_structure/            # スタイリング規範
└── thinking/                 # 設計判断の記録

scripts/
├── generate/                 # コード生成スクリプト
├── lint-template/            # テンプレートリント
├── lint-css-arch/            # CSSアーキテクチャ検証
└── prebuild/                 # ビルド前処理

content/
└── blog/
    ├── posts/               # ブログ記事（Markdown）
    └── blog-spec.yaml       # ブログ機能の単一真実の源（SSoT）

### 重要なファイル

- `content/{section}/{section}-spec.yaml`: **すべてのリテラル値の定義源**（SSoT原則）
  - 例: `content/blog/blog-spec.yaml`
- `app/spec-loader/specLoader.server.ts`: {section}-spec.yamlを動的に読み込むユーティリティ
- `docs/CSS_structure/STYLING_CHARTER.md`: スタイリング規律の詳細定義
- `package.json`: すべてのnpmスクリプトの定義

---

## 🎨 コードスタイルガイドライン

### TypeScript厳格モード

- すべての`.ts`ファイルで厳格な型定義を使用
- `any`型の使用は禁止（特別な理由がない限り）
- Prettierによる自動フォーマットを適用

### 3大層アーキテクチャの責務（厳守）

すべてのコードは以下の3層に分離され、層の責務を超えた操作は**禁止**されます：

| 層 | 配置場所 | 責務 | 許可される操作 | 禁止される操作 |
| :--- | :--- | :--- | :--- | :--- |
| **UI層** | `routes/`, `components/` | ユーザーとのインタラクションとビューの描画 | `loader`, `action`の定義、UIロジック、Componentのレンダリング | データベース直接アクセス、外部APIの直接呼び出し |
| **純粋ロジック層** | `lib/` | 複雑なビジネスロジックの処理 | 入出力型を用いた純粋関数の実行 | 副作用（API呼び出し、ファイルI/O）の実行 |
| **副作用層** | `data-io/` | 外部システムとの通信 | DBアクセス、`fetch` APIコール、ファイルI/O | UIコンポーネントのインポート、DOM操作 |

### Single Source of Truth (SSoT) 原則

**`{section}-spec.yaml`を唯一の信頼できる情報源とします。**

1. **値の一元管理**: カテゴリID、UIセレクタ、ビジネスルール等のリテラル値は`{section}-spec.yaml`で定義し、ハードコードを禁止
2. **動的参照**: 実装・テストでは`specloader`等のユーティリティを介して`{section}-spec.yaml`の値を動的に参照
3. **汎用的な記述**: 設計書や実装コメントでは、「複数回」「特定の条件下で」のような汎用表現を用い、具体的な値を記述しません（例: `3回`はNG）
4. **参照案内の禁止**: 「`{section}-spec.yaml`を参照」といったコメントは、コードの自己説明性を損なうため禁止

### スタイリング規律（Tailwind + 4層CSS）

**実装者は常に「Tailwindクラス」のみを参照すること。**

- `globals.css`のカスタムクラスやトークンへの直接参照は禁止
- 階層飛越も禁止（Layer 1 → Layer 4 への直接参照など）
- 詳細: [`docs/CSS_structure/STYLING_CHARTER.md`](docs/CSS_structure/STYLING_CHARTER.md)

### ファイル行数制限

- **1ファイル400行以下**: この制限を超える場合、適切に分割すること
- リントで自動検出: `npm run lint:template`

---

## 🧪 テスト指示とリポジトリのエチケット

### テスト戦略

Outside-In TDD (E2E → Unit)

1. **E2Eテストから開始**: `tests/e2e/`配下にPlaywrightテストを作成
2. **層ごとに単体テスト作成**: `lib/`, `data-io/`の各ファイルに`.test.ts`を併記
3. **カバレッジ80%以上を目標**: `npm run coverage`で確認

### テストファイルの配置

- **単体テスト**: 実装ファイルと同じディレクトリに`*.test.ts`として配置
  - 例: `app/lib/blog/posts/filterPosts.ts` → `app/lib/blog/posts/filterPosts.test.ts`
- **E2Eテスト**: `tests/e2e/`配下に配置
  - `tests/e2e/screen/`: 画面単位のテスト
  - `tests/e2e/section/`: セクション単位のテスト

### E2Eテスト実行規範（厳守）

#### テストデータの動的生成（必須）

**禁止事項**:

- ハードコードされたメールアドレス、ユーザーID、その他のテストデータ
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

#### E2Eテスト実行手順（必須）

1. **開発サーバー起動**:

   ```bash
   npm run dev:wrangler
   ```

   - Wranglerでランタイム制約を反映した環境を使用（必須）

2. **Playwright設定の明示的指定**:

   ```bash
   npx playwright test tests/e2e/account --config=tests/e2e/playwright.config.ts --reporter=list
   ```

   - `--config=tests/e2e/playwright.config.ts` の指定は**必須**
   - `--reporter=list` でHTMLレポート生成を抑制（推奨）

3. **テスト終了後のクリーンアップ（必須）**:

   - 開発サーバーを**必ず停止**すること
   - 停止せずに放置するとポートが占有され次回起動に失敗する

#### Windows/Wrangler固有の注意事項

**症状**: 以下のいずれかが発生した場合

- テストが `ERR_CONNECTION_REFUSED` で全て失敗
- モーダルやコンポーネントが表示されない
- ナビゲーションテストが予期せず失敗
- 開発サーバーが正常に起動しているのにテストが接続できない

**原因**: Windows環境でのWranglerキャッシュ・プロセス問題

**解決策**: **PC再起動**

- サーバー再起動やビルドクリアでは解決しない
- PC再起動により、キャッシュ・メモリ・プロセスが完全にクリアされる

**実績**: Navigation、FlashMessage、Modal表示問題は全てPC再起動で解決

### コミット前の必須チェック

**以下のリントをすべて通過させること**:

```bash
npm run lint:all
```

これには以下が含まれます：

- テンプレートリント（行数制限、ハードコード検出）
- CSSアーキテクチャ検証
- ブログメタデータ検証
- Markdownリント（`markdownlint --fix`による自動修正とエラー解消）

### gitエチケット

- **ブランチ命名**: `claude/<feature-name>-<session-id>`の形式を厳守
- **コミットメッセージ**: 簡潔で明確な「why」を記述
- **プッシュ前**: 必ず`npm run lint:all`と`npm test`を実行

---

## 🛠️ 開発環境のセットアップ詳細

### 必須ツール

- **Node.js**: v18以上
- **npm**: v9以上
- **Playwright**: E2Eテスト用ブラウザを自動インストール

### 初回セットアップ

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール
npx playwright install

# 開発サーバー起動（ランタイム制約を反映）
npm run dev:wrangler
```

### ビルドプロセスの理解

**prebuildスクリプトの自動実行**:

`npm run build`実行時、以下が自動的に実行されます：

1. `npm run lint:md`: Markdownのリント
2. `npm run lint:blog-metadata`: ブログメタデータの検証
3. `node scripts/prebuild/generate-blog-posts.js`: ブログ記事の生成
4. `node scripts/prebuild/generate-specs.js`: spec定義の生成

### Cloudflare Pages デプロイ

```bash
# プレビュー環境
npm run preview

# Wranglerでローカルプレビュー
npm run dev:wrangler
```

---

## ⚠️ プロジェクト固有の警告や予期しない動作

### Remixの特性

1. **`loader`/`action`はサーバー専用**:
   - `.server.ts`拡張子を使用すること
   - クライアント側では実行されない
   - ファイルシステムアクセスはサーバー側でのみ可能

2. **ハイドレーションエラーに注意**:
   - サーバーとクライアントでレンダリング結果が異なる場合にエラー
   - `useEffect`での条件分岐に注意

### ビルド時の注意点

1. **`app/specs/`は自動生成される**:
   - 手動編集禁止
   - 元データは`content/{section}/{section}-spec.yaml`（例: `content/blog/blog-spec.yaml`）

2. **メモリ不足の可能性**:
   - 開発サーバーは`--max-old-space-size=4096`で起動
   - ビルド時にメモリエラーが出る場合、Node.jsのヒープサイズを増やす

### リントエラーの対処

- **`npm run lint:css-arch`でエラー**: `tests/lint/css-arch-layer-report.md`の内容に従って修正
- **`npm run lint:template`でエラー**: 行数制限超過またはハードコード検出。ファイルを分割するか、`{section}-spec.yaml`に定義を移行
- **Markdownエラー**: `markdownlint <path> --fix`を実行して自動修正し、残ったエラーを手動で解消すること

---

## 🧠 知識集積層の活用

開発プロセスで得られた暗黙知を形式知化し、将来の意思決定を支援します：

| ディレクトリ | 目的 | 記録内容 |
| :--- | :--- | :--- |
| `docs/thinking/` | 設計判断や思考過程を外部化 | 迷った点、却下した案、判断理由などを短文で記録 |
| `_docs/features/` | 新機能の追加・改修の目的と背景を記録 | 実装目的、画面構成、データ構造、リスク、完了条件などを簡潔にまとめる |
| `docs/deleted/` | 削除・廃止した機能やファイルの履歴を残す | 削除理由、影響範囲、代替手段、再発防止策を記録 |

**記録タイミング**:

- 重要な設計判断を行ったとき
- 新機能を追加するとき
- コードを削除するとき
- 予期しない問題に遭遇したとき

---

**あなたの目標**: この規範に従い、堅牢でメンテナンス性の高いコードを生成することです。
