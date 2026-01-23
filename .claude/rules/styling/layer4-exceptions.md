---
paths:
  - "app/styles/**/layer4.ts"
---

# Layer 4: Structure Exceptions（構造の例外）

このルールは `app/styles/{service-name}/layer4.ts` に適用されます。

## 責務

- **Layer 3でカバーできない例外的な構造を定義**: 疑似要素、子孫セレクタ、カスタムアニメーションなど
- **Tailwind pluginとして登録**: `addComponents` を使ってTailwind pluginとして登録

## 対象パターン（例外のみ）

### 1. 疑似要素（::before, ::after）

```typescript
// app/styles/blog/layer4.ts
import plugin from 'tailwindcss/plugin'

export const layer4Plugin = plugin(({ addComponents }) => {
  addComponents({
    '.checkpoint::before': {
      content: '""',
      display: 'block',
      width: '100%',
      height: '2px',
      backgroundColor: 'var(--color-interactive-primary)',
    },

    '.flow-connector::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      right: '-20px',
      width: '20px',
      height: '2px',
      backgroundColor: 'var(--color-accent-gold)',
    },
  })
})
```

### 2. 子孫セレクタ（.parent .child）

```typescript
addComponents({
  '.page-container > .section': {
    marginBottom: 'var(--layout-section-spacing-vertical)',
  },

  '.card-list-container .card-item:hover': {
    transform: 'scale(1.05)',
  },
})
```

### 3. カスタムアニメーション（@keyframes）

```typescript
import plugin from 'tailwindcss/plugin'

export const layer4Plugin = plugin(({ addComponents }) => {
  addComponents({
    '@keyframes fadeIn': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },

    '.fade-in-animation': {
      animation: 'fadeIn 0.5s ease-in',
    },

    '@keyframes slideIn': {
      '0%': {
        transform: 'translateX(-100%)',
        opacity: '0',
      },
      '100%': {
        transform: 'translateX(0)',
        opacity: '1',
      },
    },

    '.slide-in-animation': {
      animation: 'slideIn 0.3s ease-out',
    },
  })
})
```

## 制約

### ✅ Skin Tokens参照

Layer 1のトークン（`--color-*`, `--spacing-*`, `--layout-*` など）を `var()` で参照可能。

```typescript
addComponents({
  '.checkpoint::before': {
    backgroundColor: 'var(--color-interactive-primary)', // Layer 1トークン参照OK
  },
})
```

### ❌ !important の使用禁止

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint::before': {
    backgroundColor: 'var(--color-interactive-primary) !important', // !important禁止
  },
})
```

### ❌ マジックナンバーの禁止（Layer 2と同じ制約）

```typescript
// ❌ 禁止例
addComponents({
  '.checkpoint::before': {
    width: '40px', // ← var(--layout-*)を使用すること
    backgroundColor: '#FF0000', // ← var(--color-*)を使用すること
  },
})

// ✅ 正しい例
addComponents({
  '.checkpoint::before': {
    width: 'var(--layout-card-width)',
    backgroundColor: 'var(--color-interactive-primary)',
  },
})
```

### 例外: アニメーションのキーフレーム値

アニメーションのキーフレームでは、数値（0%, 100%など）やtransform値の直接指定が許可されます。

```typescript
// ✅ 許可（アニメーション固有の値）
addComponents({
  '@keyframes fadeIn': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
})
```

## 正しい実装例（まとめ）

```typescript
// app/styles/blog/layer4.ts
import plugin from 'tailwindcss/plugin'

export const layer4Plugin = plugin(({ addComponents }) => {
  addComponents({
    // 疑似要素
    '.checkpoint::before': {
      content: '""',
      display: 'block',
      width: '100%',
      height: '2px',
      backgroundColor: 'var(--color-interactive-primary)',
    },

    // 子孫セレクタ
    '.page-container > .section': {
      marginBottom: 'var(--layout-section-spacing-vertical)',
    },

    // カスタムアニメーション
    '@keyframes slideIn': {
      '0%': {
        transform: 'translateX(-100%)',
        opacity: '0',
      },
      '100%': {
        transform: 'translateX(0)',
        opacity: '1',
      },
    },

    '.slide-in-animation': {
      animation: 'slideIn 0.3s ease-out',
    },
  })
})
```

## AIエージェントへの指示

1. `app/styles/**/layer4.ts` で例外的な構造を定義する際は、疑似要素・子孫セレクタ・カスタムアニメーションのみを実装すること
2. Layer 3で実装可能なレイアウトをLayer 4で定義しようとした場合は、Layer 3で定義することを提案すること
3. !important を使用しようとした場合は、即座にエラーとして指摘すること
4. Layer 1トークンを `var()` で参照することを推奨すること
5. アニメーション以外でマジックナンバーを使用しようとした場合は、Layer 1トークンを使用することを指摘すること
