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
| `npm run dev:wrangler:clean` | クリーン起動 | キャッシュクリア後に開発サーバーを起動（キャッシュ問題発生時） |
| `npm run clean:wrangler` | Wranglerキャッシュクリア | `.wrangler`フォルダ削除とD1マイグレーション再適用 |
| `npm test` | ユニットテスト実行 | Vitestを使用（E2Eはオペレーターが実行） |
| `npm run typecheck` | 型チェック | すべてのTypeScriptファイルを検証 |
| `npm run lint:all {servicename}` | 全リント実行 | テンプレート、CSS、Markdown、ブログメタデータを検証 |
| `npm run lint:md` | Markdownリント | ブログ記事のMarkdownを検証・修正 |
| `npm run generate` | コード生成 | スキャフォールドとリントを実行 |

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

### specファイルの配置ルール

**3層のspec構造**

ClaudeMixでは、3層のspec構造を採用しています：

| 層 | 配置場所 | 責務 | 例 |
| --- | --------- | ----- | --- |
| **shared** | `app/specs/shared/` | サービス横断の共通設定 | validation, server, responsive, project |
| **common** | `app/specs/{service}/common-spec.yaml` | サービス内の共通設定 | navigation, theme, layout |
| **section** | `app/specs/{service}/{section}-spec.yaml` | セクション固有の設定 | categories, tags, forms |

**配置判断のガイドライン**

詳細は [`docs/specs/COMMON_VS_SHARED.md`](docs/specs/COMMON_VS_SHARED.md) を参照してください。

**簡易判断**:

1. 全サービスで統一すべき → `shared/`
2. サービス内で共有 → `{service}/common-spec.yaml`
3. セクション固有 → `{service}/{section}-spec.yaml`

### スタイリング規律（Tailwind + 4層CSS）

**実装者は常に「Tailwindクラス」のみを参照すること。**

- `globals.css`のカスタムクラスやトークンへの直接参照は禁止
- 階層飛越も禁止（Layer 1 → Layer 4 への直接参照など）
- 詳細: [`docs/CSS_structure/STYLING_CHARTER.md`](docs/CSS_structure/STYLING_CHARTER.md)

---

## 🧪 テスト指示とリポジトリのエチケット

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

---

**あなたの目標**: この規範に従い、堅牢でメンテナンス性の高いコードを生成することです。
