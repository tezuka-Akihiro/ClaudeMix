---
paths:
  - "app/styles/globals.css"
---

# Layer 1: Application Tokens（アプリケーショントークン層）

このルールは `app/styles/globals.css` に適用されます。

## 責務

- **サービス横断の意味的トークン定義**: アプリケーション全体で共通使用される、意味的な役割を持つトークンを定義
- **完全なスケールは不要**: 実際にアプリケーションで使用する値のみを定義

## 命名規則

**フォーマット**: `--{category}-{role}-{variant?}`

- `{category}`: カテゴリ（例: `color`, `spacing`, `font`, `layout`）
- `{role}`: **意味的な役割**（例: `background`, `text`, `interactive`, `status`）
- `{variant}`: バリアント（例: `primary`, `secondary`, `success`, `error`）※省略可

## 定義する値の例

### ✅ 意味的な役割を持つトークン

```css
:root {
  /* アプリ全体の主要な背景色 */
  --color-background-primary: #111111;

  /* アプリ全体のセカンダリ背景色 */
  --color-background-secondary: #1a1a1a;

  /* アプリ全体の主要なテキスト色 */
  --color-text-primary: #ffffff;

  /* アプリ全体のサブテキスト色 */
  --color-text-secondary: #999999;

  /* アプリ全体のアクセント色 */
  --color-accent-gold: #BFA978;

  /* アプリ全体のインタラクティブ要素の色 */
  --color-interactive-primary: #22d3ee;
  --color-interactive-primary-bg: rgb(34 211 238 / 0.3);

  /* アプリ全体のステータス色 */
  --color-status-success: #4ade80;
  --color-status-error: #ef4444;

  /* アプリ全体の標準的な間隔 */
  --spacing-3: 16px;
  --spacing-4: 24px;

  /* アプリ全体のページ構造 */
  --layout-page-container-width: 800px;
  --layout-page-container-padding: 32px;

  /* アプリ全体のヘッダー/フッター */
  --layout-header-height: 80px;
  --layout-footer-height: 80px;

  /* アプリ全体のセクション（「1サービスは複数セクションの縦連結」に対応） */
  --layout-section-width: 800px;
  --layout-section-spacing-vertical: 32px;
  --layout-section-padding: 32px;

  /* アプリ全体のカードアイテム */
  --layout-card-width: 176px;
  --layout-card-min-height: 32px;

  /* アプリ全体のボタン */
  --layout-button-width-default: 100px;
}
```

## 禁止される定義

### ❌ サービス固有の意味的トークン

```css
/* ❌ サービス固有の色定義 → Layer 2で定義 */
--color-flow-checkpoint-active: #xxx;
--color-user-card-background: #xxx;
```

### ❌ ファンデーショントークン的な定義

```css
/* ❌ 具体的な色名のみ（意味的な役割を持たせること） */
--color-gray-900: #111111;  /* 非推奨: --color-background-primary など意味的なトークンを使用 */
--color-blue-400: #60a5fa;  /* 非推奨: --color-interactive-primary など意味的なトークンを使用 */
```

### ❌ 抽象的なスケールトークン

```css
/* ❌ 抽象的なサイズ定義（意味的な役割を持たせること） */
--layout-width-lg: 800px;  /* 非推奨: --layout-page-container-width, --layout-section-width など意味的なトークンを使用 */
```

## 制約

### ❌ 変数参照の禁止

- Layer 1では他のCSS変数を参照してはならない
- 例: `color: var(--other-token)` は不可

### ✅ 具体値のみ許可

- HEXコード: `#111111`
- px値: `16px`
- rgb値: `rgb(0 0 0 / 0.5)`

### ❌ 直接参照禁止

- 実装（TSX）やLayer 3/4から直接参照してはならない
- Layer 2のみが参照可能

## Layer 1とLayer 2の関係

- **Layer 1（globals.css）**: サービス全体の意味的トークン
  - 例: `--color-background-primary`, `--color-text-primary`, `--layout-section-width`, `--layout-header-height`

- **Layer 2（{service-name}/layer2-{section-name}.css）**: サービス固有のコンポーネントスタイル
  - 例: `.page-container { max-width: var(--layout-page-container-width); padding: var(--layout-page-container-padding); }`
  - 例: `.checkpoint { background: var(--color-background-primary); color: var(--color-text-primary); }`

## AIエージェントへの指示

1. `app/styles/globals.css` でトークンを定義する際は、必ず意味的な役割を持つ命名にすること
2. 具体的な色名やスケール番号のみのトークンは定義しないこと
3. 他のCSS変数を参照する定義は禁止（具体値のみ使用）
4. サービス固有のトークンは Layer 2 で定義すること
5. トークンの命名は `--{category}-{role}-{variant?}` の形式を厳守すること
