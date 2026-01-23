---
paths:
  - "app/styles/**/layer3.ts"
---

# Layer 3: Flexbox and Grid Layout（フレックスとグリッドレイアウト層）

このルールは `app/styles/{service-name}/layer3.ts` に適用されます。

## 責務

- **フレックスとグリッドレイアウトロジックのみ追加**: Layer 2で定義されたコンポーネントセレクタに、Flexbox/Gridレイアウトを追加
- **Tailwind pluginとして登録**: `addComponents` を使ってTailwind pluginとして登録し、Layer 2のCSSと統合
- **gap統一の原則**: Flexbox/Gridの**アイテム間の余白**は`margin`を使用せず、必ず`gap`で統一

## 命名規則

**Layer 2と同じセレクタ名を使用**: `.{component}-{variant?}`

例: `.checkpoint`, `.button-primary`（layer2-*.cssと同じ）

## 定義内容（フレックス・グリッドレイアウトのみ）

### ✅ 許可される定義

- フロー制御（display: flex, display: grid）
- 配置（align-items, justify-content, flex-direction, grid-template-columns など）
- 間隔（**gap, row-gap, column-gap のみ**）
- フレックス・グリッド関連プロパティ（flex-grow, flex-shrink, grid-area など）

### 正しい実装例

```typescript
// app/styles/blog/layer3.ts
import plugin from 'tailwindcss/plugin'

export const layer3Plugin = plugin(({ addComponents }) => {
  addComponents({
    '.checkpoint': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--spacing-3)', // gap例外: Layer 1トークン直接参照可能
    },

    '.card-list-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(var(--layout-card-width), 1fr))',
      gap: 'var(--spacing-4)', // gap例外: Layer 1トークン直接参照可能
    },

    '.page-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--spacing-3)',
    },

    '.flow-branch': {
      display: 'flex',
      flexDirection: 'row',
      gap: 'var(--spacing-4)',
      flexWrap: 'wrap',
    },
  })
})
```

## 禁止される定義

### ❌ 色の定義

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint': {
    color: 'var(--color-text-primary)', // ← Layer 2の責務
    backgroundColor: 'var(--color-background-primary)', // ← Layer 2の責務
  },
})
```

### ❌ サイズの定義

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint': {
    width: 'var(--layout-card-width)', // ← Layer 2の責務
    height: 'var(--layout-card-min-height)', // ← Layer 2の責務
    padding: 'var(--spacing-3)', // ← Layer 2の責務
  },
})
```

### ❌ アイテム間余白のためのmargin使用

```typescript
// ❌ 禁止例
addComponents({
  '.card-list-container': {
    display: 'grid',
  },
  '.card-list-container > *': {
    marginTop: '16px', // ← gapを使用すること
    marginLeft: '16px',
  },
})

// ✅ 正しい例
addComponents({
  '.card-list-container': {
    display: 'grid',
    gap: 'var(--spacing-4)', // gapで統一
  },
})
```

### ❌ タイポグラフィの定義

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint': {
    fontFamily: 'var(--font-family-primary)', // ← Layer 2の責務
    fontSize: 'var(--font-size-base)', // ← Layer 2の責務
  },
})
```

### ❌ 見た目の定義

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint': {
    boxShadow: 'var(--shadow-sm)', // ← Layer 2の責務
    borderRadius: 'var(--border-radius-md)', // ← Layer 2の責務
    transition: 'all 0.3s ease', // ← Layer 2の責務
  },
})
```

## 制約

### ❌ Layer 1直接参照原則禁止

基本的に `var(--color-*)`, `var(--spacing-*)` などLayer 1トークンの直接参照は禁止。

### ✅ gap例外

**gap/row-gap/column-gapのみ**、Layer 1の`var(--spacing-*)`トークンを直接参照可能。

これにより、Layer 2で中間変数を定義する必要がなくなります。

```typescript
// ✅ gap例外: Layer 1トークン直接参照可能
addComponents({
  '.checkpoint': {
    display: 'flex',
    gap: 'var(--spacing-3)', // ← 直接参照OK
  },
})
```

### ❌ !important の使用禁止

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint': {
    display: 'flex !important', // !important禁止
  },
})
```

## AIエージェントへの指示

1. `app/styles/**/layer3.ts` でレイアウトを定義する際は、Flexbox/Gridレイアウトロジックのみを実装すること
2. 色・サイズ・タイポグラフィ・見た目の定義を追加しようとした場合は、Layer 2で定義することを指摘すること
3. アイテム間余白のために `margin` を使用しようとした場合は、`gap` を使用することを提案すること
4. `gap`, `row-gap`, `column-gap` に限り、Layer 1トークンの直接参照が許可されていることを理解すること
5. !important を使用しようとした場合は、即座にエラーとして指摘すること
6. Tailwind pluginの `addComponents` を使用してCSSと統合すること
