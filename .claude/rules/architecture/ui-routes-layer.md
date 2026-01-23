---
paths:
  - "app/routes/**/*"
---

# UI層 - Routes（routes/）のルール

このルールは `app/routes/` 配下のすべてのファイルに適用されます。

## 責務

- **データフロー制御**: loader/actionによるデータ取得・更新
- **最小限のJSX**: 20行以下の単純な表示ロジック
- **副作用層のみimport**: `data-io/` の関数のみ呼び出し可能
- **表示はcomponentsに委譲**: 複雑なUIは `components/` に分離

## 許可される内容

### ✅ データフロー制御

- `loader` 関数でのデータ取得
- `action` 関数でのデータ更新
- `data-io/` 層の関数呼び出し

### ✅ 最小限のJSX

- 20行以下の単純な表示ロジック
- `components/` からのコンポーネントimport
- `useLoaderData`, `useActionData` などのRemix hooksの使用

### ✅ import可能な層

- `~/data-io/**` - データ取得・更新処理
- `~/components/**` - UIコンポーネント
- Remix hooks - `useLoaderData`, `useActionData`, `useNavigation` など

## 禁止される内容

### ❌ lib層の直接import禁止

- `~/lib/**` からの直接import禁止
- ビジネスロジックは `data-io/` 層経由で使用すること

### ❌ 複雑なJSXの記述禁止

- 20行を超えるJSXは `components/` に分離すること
- ループ・条件分岐が複雑な場合は専用コンポーネントを作成すること

### ❌ ビジネスロジックの直接実装禁止

- 計算・バリデーション・変換ロジックは `lib/` 層に分離すること
- routes内での複雑な処理は禁止

## 正しい実装例

```typescript
// ✅ 正しい例: シンプルなloader + 表示委譲
import type { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { getSalesData } from '~/data-io/sales' // data-io層のみimport可能
import { SalesDashboard } from '~/components/sales/Dashboard' // UI表示は委譲

export async function loader({ context }: LoaderFunctionArgs) {
  const data = await getSalesData(context.env.DB) // data-io層から取得
  return json({ data })
}

export default function Sales() {
  const { data } = useLoaderData<typeof loader>()
  return <SalesDashboard data={data} /> // 表示はcomponentsに委譲
}

// ✅ 正しい例: シンプルなaction
import type { ActionFunctionArgs } from '@remix-run/cloudflare'
import { redirect } from '@remix-run/cloudflare'
import { createUser } from '~/data-io/user' // data-io層を使用

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  await createUser(context.env.DB, email, password) // data-io層に委譲
  return redirect('/dashboard')
}

export default function Register() {
  return (
    <form method="post">
      <input type="email" name="email" />
      <input type="password" name="password" />
      <button type="submit">Register</button>
    </form>
  )
}
```

## 禁止される実装例

```typescript
// ❌ 禁止例: lib層の直接import
import { calculateProfit } from '~/lib/sales' // lib層の直接import禁止

export async function loader() {
  const revenue = 1000
  const costs = 600
  const profit = calculateProfit(revenue, costs) // lib層を直接使用
  return json({ profit })
}

// ✅ 正しくは data-io層経由で使用
// data-io/sales/profit.ts
import { calculateProfit } from '~/lib/sales'

export async function getSalesProfit(db: D1Database, saleId: string) {
  const { revenue, costs } = await db.query('SELECT revenue, costs FROM sales WHERE id = ?', saleId)
  return calculateProfit(revenue, costs) // data-io層でlib層を使用
}

// routes/sales.$id.tsx
import { getSalesProfit } from '~/data-io/sales/profit'

export async function loader({ params, context }: LoaderFunctionArgs) {
  const profit = await getSalesProfit(context.env.DB, params.id)
  return json({ profit })
}

// ❌ 禁止例: 複雑なJSX（20行超過）
export default function SalesList() {
  const { sales } = useLoaderData<typeof loader>()

  return (
    <div>
      <h1>Sales List</h1>
      <div className="grid">
        {sales.map(sale => (
          <div key={sale.id} className="card">
            <div className="header">
              <h2>{sale.title}</h2>
              <span>{sale.date}</span>
            </div>
            <div className="content">
              <p>{sale.description}</p>
              <div className="metrics">
                <span>Revenue: ${sale.revenue}</span>
                <span>Profit: ${sale.profit}</span>
              </div>
            </div>
            <div className="footer">
              <button>View Details</button>
              <button>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) // ← 20行を超える複雑なJSX
}

// ✅ 正しくは components に分離
// components/sales/SalesCard.tsx
export function SalesCard({ sale }: { sale: Sale }) {
  return (
    <div className="card">
      <div className="header">
        <h2>{sale.title}</h2>
        <span>{sale.date}</span>
      </div>
      <div className="content">
        <p>{sale.description}</p>
        <div className="metrics">
          <span>Revenue: ${sale.revenue}</span>
          <span>Profit: ${sale.profit}</span>
        </div>
      </div>
      <div className="footer">
        <button>View Details</button>
        <button>Edit</button>
      </div>
    </div>
  )
}

// routes/sales._index.tsx
import { SalesCard } from '~/components/sales/SalesCard'

export default function SalesList() {
  const { sales } = useLoaderData<typeof loader>()

  return (
    <div>
      <h1>Sales List</h1>
      <div className="grid">
        {sales.map(sale => (
          <SalesCard key={sale.id} sale={sale} />
        ))}
      </div>
    </div>
  )
}
```

## AIエージェントへの指示

1. `app/routes/` 配下でコードを生成する際は、データフロー制御（loader/action）に集中すること
2. `lib/` 層を直接importしようとした場合は、`data-io/` 層経由での使用を提案すること
3. JSXが20行を超える場合は、専用コンポーネントを `components/` に作成すること
4. ビジネスロジックが必要な場合は、`lib/` 層に分離し、`data-io/` 層経由で使用すること
5. loader/actionはシンプルに保ち、複雑な処理は他の層に委譲すること
