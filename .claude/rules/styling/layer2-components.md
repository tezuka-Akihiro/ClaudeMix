---
paths:
  - "app/styles/**/layer2-*.css"
---

# Layer 2: Component Styles（コンポーネントスタイル層）

このルールは `app/styles/{service-name}/layer2-{section-name}.css` に適用されます。

## 責務

- **コンポーネント単位のCSSセレクタ定義**: コンポーネントの「見た目」と「サイズ」を定義
- **Layer 1トークンの組み合わせ**: Application Tokensを `var()` で参照して構築
- **99%の完成度**: このレイヤーでコンポーネントスタイルをほぼ完成させる（Layer 3では複雑なレイアウトロジックのみ追加）

## セクションごとの分離

Lighthouse最適化のため、セクション（機能・画面）ごとにCSSファイルを分離できます。

**命名規則**: `layer2-{section-name}.css`

- `layer2-common.css` - サービス全体の共通コンポーネント
- `layer2-posts.css` - 記事一覧ページ専用
- `layer2-post-detail.css` - 記事詳細ページ専用

各ページは必要なCSSのみインポートすることで、不要なCSSの読み込みを削減できます。

## 命名規則（CSSセレクタ）

**フォーマット**: `.{component}-{variant?}` または `.{category}-{component}-{variant?}`

### 基本パターン

```css
.checkpoint { /* コンポーネント名のみ */ }
.button-primary { /* コンポーネント名 + バリアント */ }
```

### カテゴリベースパターン

特定の役割や用途が明確な場合、カテゴリプレフィックスを使用：

```css
/* ページレベルコンポーネント */
.page-header { }
.page-footer { }
.page-container { }

/* フォーム要素 */
.select-input { }
.select-container { }
.select-label { }

/* ドメイン固有のコンポーネント */
.flow-branch { }
.flow-connector { }
```

### 禁止される命名パターン

```css
/* ❌ サービス名プレフィックス */
.service-name-button { } /* サービス名は不要 */
.user-management-card { } /* サービス名は不要 */

/* ❌ 過度に汎用的な名前 */
.container { } /* 具体的な名前を使用: .page-container など */
.wrapper { } /* 具体的な名前を使用 */
.box { } /* 具体的な名前を使用 */
```

## 定義内容

### ✅ 許可される定義

- 色（color, background-color, border-color など）
- サイズ（width, height, padding など）
- **コンポーネント自体の外側余白**（margin）
- タイポグラフィ（font-family, font-size, font-weight など）
- 見た目（box-shadow, border-radius, transition など）
- 位置（position, top, right, bottom, left, z-index）
- オーバーフロー（overflow, overflow-x, overflow-y）
- 状態別スタイル（`:hover`, `.completed`, `.pending` など）

### 正しい実装例

```css
.checkpoint {
  /* 色: Layer 1トークンを参照 */
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-interactive-primary);

  /* サイズ: Layer 1トークンを参照 */
  width: var(--layout-card-width);
  min-height: var(--layout-card-min-height);
  padding: var(--spacing-3);

  /* 外側余白（コンポーネント自体の余白） */
  margin: var(--spacing-4) 0;

  /* タイポグラフィ */
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);

  /* 見た目 */
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.checkpoint:hover {
  background-color: var(--color-interactive-primary-bg);
}

.checkpoint.completed {
  border-color: var(--color-status-success);
}
```

## 制約

### ❌ Layer 5からの直接参照禁止

実装（TSX）から `.checkpoint` を直接使用してはならない。Layer 3経由で使用すること。

### ❌ CSS変数（トークン）の定義禁止

Layer 2では新しいCSS変数を定義してはなりません。すべてのCSS変数はLayer 1で定義されます。

```css
/* ❌ 禁止例 */
.checkpoint {
  --custom-size: 40px; /* CSS変数の定義禁止 */
  width: var(--custom-size);
}
```

### ❌ マジックナンバーの禁止

具体的な値を直接定義してはなりません。**必ずLayer 1のApplication Tokensを `var()` で参照してください。**

**禁止される値**：

```css
/* ❌ 色の直接指定 */
color: #FFF;
background: rgb(255, 255, 255);
border-color: rgba(0, 0, 0, 0.5);

/* ❌ サイズの直接指定 */
width: 40px;
padding: 2rem;
font-size: 1.5em;

/* ❌ 単位なし数値（例外を除く） */
font-weight: 400;
opacity: 0.5;
z-index: 10;
```

**例外1: bool値としての0と1**

```css
/* ✅ 許可 */
opacity: 0;
opacity: 1;
flex: 1;
z-index: 0;
```

**例外2: ショートハンドプロパティにおける単位付きの0**

```css
/* ✅ 許可（ショートハンドの複数値） */
margin: 0px 10px;
padding: 0 var(--spacing-4);
border-width: 0 1px;

/* ❌ 禁止（単一値の場合、単位なし0を使用） */
margin: 0px;

/* ❌ 禁止（マジックナンバー10pxはトークンを使用） */
margin: 0 10px; /* var(--spacing-*)を使用すること */
```

**例外3: 普遍的な全幅/全高を示す100%**

```css
/* ✅ 許可 */
width: 100%;
height: 100%;
max-width: 100%;
```

理由: `100%`はWeb標準として普遍的な「全幅/全高」の意味を持ち、トークン化しても意味的価値が増えないため。

### ❌ フレックス・グリッドの禁止

`flex`, `grid`, `gap`, `display: flex` などのFlexbox/Gridレイアウトは定義しない（Layer 3の責務）。

```css
/* ❌ 禁止例 */
.checkpoint {
  display: flex; /* Layer 3で定義 */
  gap: 16px; /* Layer 3で定義 */
}
```

### ❌ !important の使用禁止

```css
/* ❌ 禁止例 */
.checkpoint {
  color: var(--color-text-primary) !important; /* !important禁止 */
}
```

## 正しい実装例（まとめ）

```css
/* ✅ Layer 1トークンのみ参照 */
.page-container {
  max-width: var(--layout-page-container-width);
  padding: var(--layout-page-container-padding);
  background-color: var(--color-background-primary);
  margin: 0; /* bool値としての0は許可 */
}

.button-primary {
  background-color: var(--color-interactive-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  transition: background-color 0.3s ease; /* 単位なし数値はtransition-durationのみ許可 */
}

.button-primary:hover {
  background-color: var(--color-interactive-primary-bg);
  opacity: 1; /* bool値としての1は許可 */
}
```

## AIエージェントへの指示

1. `app/styles/**/layer2-*.css` でスタイルを定義する際は、Layer 1トークンのみを参照すること
2. マジックナンバー（具体的な値）を直接記述しようとした場合は、即座にエラーとして指摘すること
3. フレックス・グリッドレイアウトが必要な場合は、Layer 3で定義することを提案すること
4. !important を使用しようとした場合は、即座にエラーとして指摘すること
5. 新しいCSS変数を定義しようとした場合は、Layer 1で定義することを提案すること
6. セレクタ命名は `.{component}-{variant?}` または `.{category}-{component}-{variant?}` の形式を厳守すること
