---
paths:
  - "app/**/*.tsx"
---

# Layer 5: 実装層（TSX）

このルールは `app/**/*.tsx` に適用されます。

## 責務

- **Layer 3/4で定義された構造クラスの使用**: Tailwindクラスとして生成されたクラスのみを使用
- **マジックナンバーの禁止**: 具体的な数値を直接使用せず、トークンから生成されたクラスを使用

## 制約

### ❌ フロー制御クラスの直接使用禁止

`flex`, `grid`, `gap` などのレイアウト制御クラスは直接使用せず、Layer 3で定義された構造クラスを使用すること。

```tsx
// ❌ 禁止例: flex/gridの直接使用
export function SalesList() {
  return (
    <div className="flex gap-4"> {/* flex, gapの直接使用禁止 */}
      <SalesCard />
    </div>
  )
}

// ✅ 正しい例: Layer 3で定義された構造クラスを使用
export function SalesList() {
  return (
    <div className="card-list-container"> {/* Layer 3で定義 */}
      <SalesCard />
    </div>
  )
}
```

### ❌ マジックナンバークラスの使用禁止

`p-4`, `w-1/2`, `text-lg` のようなマジックナンバー的なクラスは使用せず、Layer 2のトークンから生成されたクラスを使用すること。

```tsx
// ❌ 禁止例: マジックナンバークラス
export function Button() {
  return (
    <button className="p-4 bg-blue-500 text-white rounded-md">
      {/* p-4, bg-blue-500などのマジックナンバー禁止 */}
      Click Me
    </button>
  )
}

// ✅ 正しい例: Layer 2/3で定義されたクラスを使用
export function Button() {
  return (
    <button className="button-primary">
      {/* Layer 2で色・サイズ、Layer 3でレイアウトを定義 */}
      Click Me
    </button>
  )
}
```

### ❌ インラインスタイルの使用禁止

CSSプロパティを直接JSXに記述することは禁止。

```tsx
// ❌ 禁止例: インラインスタイル
export function Card() {
  return (
    <div style={{ padding: '16px', backgroundColor: '#111111' }}>
      {/* インラインスタイル禁止 */}
      Content
    </div>
  )
}

// ✅ 正しい例: Layer 2/3で定義されたクラスを使用
export function Card() {
  return (
    <div className="card">
      Content
    </div>
  )
}
```

### ✅ 許可されるTailwindクラス

以下のTailwindクラスは例外的に使用可能です：

1. **条件付きスタイル**: 状態による表示切り替え
   ```tsx
   <div className={isActive ? 'opacity-100' : 'opacity-0'}>
   ```

2. **レスポンシブ**: ブレークポイント
   ```tsx
   <div className="hidden md:block">
   ```

3. **動的な値**: 実行時に決定される値
   ```tsx
   <div className={`opacity-${opacityValue}`}>
   ```

ただし、これらの場合でも可能な限りLayer 2/3でクラスを定義することを推奨します。

## 正しい実装例

```tsx
// ✅ Layer 2/3で定義されたクラスを使用
export function SalesDashboard({ data }: Props) {
  return (
    <div className="page-container"> {/* Layer 2で定義 */}
      <header className="page-header"> {/* Layer 2+3で定義 */}
        <h1>{data.title}</h1>
      </header>

      <div className="card-list-container"> {/* Layer 3で定義 */}
        {data.items.map(item => (
          <div key={item.id} className="checkpoint"> {/* Layer 2+3で定義 */}
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ✅ 条件付きスタイル（許可される例外）
export function StatusBadge({ status }: Props) {
  return (
    <div
      className={`
        badge
        ${status === 'active' ? 'badge-active' : 'badge-inactive'}
      `}
    >
      {status}
    </div>
  )
}
```

## 禁止される実装例

```tsx
// ❌ 禁止例1: flex/gridの直接使用
export function UserProfile() {
  return (
    <div className="flex flex-col gap-4">
      {/* flex, flex-col, gapの直接使用禁止 */}
      <UserAvatar />
      <UserInfo />
    </div>
  )
}

// ❌ 禁止例2: マジックナンバークラス
export function ProductCard() {
  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-md">
      {/* p-6, bg-gray-900などのマジックナンバー禁止 */}
      <h2 className="text-xl font-bold">Product Name</h2>
    </div>
  )
}

// ❌ 禁止例3: インラインスタイル
export function Banner() {
  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a' }}>
      {/* インラインスタイル禁止 */}
      Banner Content
    </div>
  )
}

// ❌ 禁止例4: Tailwind任意値（arbitrary values）
export function CustomBox() {
  return (
    <div className="w-[450px] p-[18px] bg-[#FF5733]">
      {/* 任意値の使用禁止 */}
      Custom Box
    </div>
  )
}
```

## スタイル追加が必要な場合の手順

1. **Layer 2で定義**: コンポーネントの色・サイズ・見た目を定義
   - `app/styles/{service}/layer2-{section}.css` に `.new-component` を追加

2. **Layer 3で定義**: レイアウトロジックを追加（必要な場合のみ）
   - `app/styles/{service}/layer3.ts` に `.new-component` のレイアウトを追加

3. **Layer 4で定義**: 例外的な構造を追加（必要な場合のみ）
   - `app/styles/{service}/layer4.ts` に疑似要素やアニメーションを追加

4. **実装層で使用**: TSXで定義されたクラスを使用
   ```tsx
   <div className="new-component">Content</div>
   ```

## AIエージェントへの指示

1. `app/**/*.tsx` でUIを実装する際は、Layer 2/3/4で定義されたクラスのみを使用すること
2. `flex`, `grid`, `gap` などのレイアウトクラスを直接使用しようとした場合は、Layer 3で構造クラスを定義することを提案すること
3. `p-4`, `bg-blue-500` などのマジックナンバークラスを使用しようとした場合は、Layer 2でコンポーネントクラスを定義することを提案すること
4. インラインスタイルを使用しようとした場合は、Layer 2/3でクラスを定義することを提案すること
5. 新しいスタイルが必要な場合は、Layer 2/3/4での定義を優先すること
6. 条件付きスタイル・レスポンシブ・動的な値など、例外的に許可される場合を理解すること
