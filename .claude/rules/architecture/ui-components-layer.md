---
paths:
  - "app/components/**/*"
---

# UI層 - Components（components/）のルール

このルールは `app/components/` 配下のすべてのファイルに適用されます。

## 責務

- **純粋なUI表示**: propsで受け取ったデータの表示
- **インタラクション制御**: ユーザー操作のハンドリング
- **再利用可能なコンポーネント**: サービス・セクションごとに整理

## 推奨構造

- `app/components/{service}/{section}/` での整理
- 例: `app/components/blog/posts/`, `app/components/account/profile/`

## 許可される内容

### ✅ UI実装

- propsで受け取ったデータの表示
- ユーザーインタラクション（onClick, onChange など）
- ローカルステート（useState, useReducer）の使用
- UIアニメーション・トランジション

### ✅ React関連のimport

- `react` - useState, useEffect, useMemo など
- `@remix-run/react` - Link, Form など
- 他のコンポーネント - `~/components/**` からのimport

### ✅ スタイリング

- Tailwindクラスの使用（Layer 3/4で定義された構造クラス）
- CSS Modules（推奨されないが許可）

## 禁止される内容

### ❌ 副作用層の直接import禁止

- `~/data-io/**` からの直接import禁止
- データ取得・更新は親コンポーネント（routes）で行い、propsで受け取ること

### ❌ lib層の直接import禁止

- `~/lib/**` からの直接import禁止
- ビジネスロジックは親コンポーネントで処理し、結果をpropsで受け取ること

### ❌ ビジネスロジックの実装禁止

- 計算・バリデーション・変換ロジックは含めないこと
- 表示に必要な軽微な変換（日付フォーマットなど）は許可

## 正しい実装例

```typescript
// ✅ 正しい例: 純粋なUI表示
interface Props {
  data: SalesData
}

export function SalesDashboard({ data }: Props) {
  return (
    <div className="dashboard">
      <h1>{data.title}</h1>
      <div className="metrics">
        <span>Revenue: ${data.revenue}</span>
        <span>Profit: ${data.profit}</span>
      </div>
    </div>
  )
}

// ✅ 正しい例: インタラクション制御
interface Props {
  initialValue: string
  onSubmit: (value: string) => void
}

export function SearchInput({ initialValue, onSubmit }: Props) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(value) // 親コンポーネントに委譲
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  )
}

// ✅ 正しい例: 軽微なフォーマット処理（表示のみ）
interface Props {
  date: string // ISO 8601形式
}

export function DateDisplay({ date }: Props) {
  // 表示用の軽微なフォーマットは許可
  const formatted = new Date(date).toLocaleDateString('ja-JP')

  return <span>{formatted}</span>
}

// ✅ 正しい例: 子コンポーネントの組み合わせ
import { SalesCard } from '~/components/sales/SalesCard'
import { SalesChart } from '~/components/sales/SalesChart'

interface Props {
  sales: Sale[]
}

export function SalesList({ sales }: Props) {
  return (
    <div className="sales-list">
      {sales.map(sale => (
        <SalesCard key={sale.id} sale={sale} />
      ))}
      <SalesChart data={sales} />
    </div>
  )
}
```

## 禁止される実装例

```typescript
// ❌ 禁止例: data-io層の直接import
import { getSalesData } from '~/data-io/sales' // data-io層のimport禁止

export function SalesDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getSalesData().then(setData) // コンポーネント内でのデータ取得禁止
  }, [])

  return <div>{/* ... */}</div>
}

// ✅ 正しくは routes で取得してpropsで渡す
// routes/sales._index.tsx
import { getSalesData } from '~/data-io/sales'

export async function loader({ context }: LoaderFunctionArgs) {
  const data = await getSalesData(context.env.DB)
  return json({ data })
}

export default function Sales() {
  const { data } = useLoaderData<typeof loader>()
  return <SalesDashboard data={data} />
}

// components/sales/SalesDashboard.tsx
interface Props {
  data: SalesData // propsで受け取る
}

export function SalesDashboard({ data }: Props) {
  return <div>{/* ... */}</div>
}

// ❌ 禁止例: lib層の直接import
import { calculateProfit } from '~/lib/sales' // lib層のimport禁止

interface Props {
  revenue: number
  costs: number
}

export function ProfitDisplay({ revenue, costs }: Props) {
  const profit = calculateProfit(revenue, costs) // ビジネスロジックの直接実行禁止
  return <span>Profit: ${profit}</span>
}

// ✅ 正しくは親コンポーネントで計算してpropsで渡す
// routes/sales.$id.tsx
import { getSalesProfit } from '~/data-io/sales/profit' // data-io経由でlib層を使用

export async function loader({ params, context }: LoaderFunctionArgs) {
  const profit = await getSalesProfit(context.env.DB, params.id)
  return json({ profit })
}

export default function SalesDetail() {
  const { profit } = useLoaderData<typeof loader>()
  return <ProfitDisplay profit={profit} />
}

// components/sales/ProfitDisplay.tsx
interface Props {
  profit: number // 計算済みの値をpropsで受け取る
}

export function ProfitDisplay({ profit }: Props) {
  return <span>Profit: ${profit}</span>
}

// ❌ 禁止例: 複雑なビジネスロジック
interface Props {
  user: User
}

export function UserScore({ user }: Props) {
  // ❌ ビジネスロジックをコンポーネント内で実装
  let score = 0
  if (user.posts > 10) score += 50
  if (user.followers > 100) score += 30
  if (user.isVerified) score += 20

  return <div>Score: {score}</div>
}

// ✅ 正しくは親で計算済みの値を渡す
interface Props {
  score: number // 計算済みの値をpropsで受け取る
}

export function UserScore({ score }: Props) {
  return <div>Score: {score}</div>
}
```

## テスト要件

- コンポーネントの表示テスト（@testing-library/react）
- インタラクションのテスト（ボタンクリック、フォーム送信など）
- 条件分岐による表示切り替えのテスト
- propsの変更による再レンダリングのテスト

## AIエージェントへの指示

1. `app/components/` 配下でコードを生成する際は、純粋なUI表示に集中すること
2. データ取得が必要な場合は、親コンポーネント（routes）で行い、propsで受け取る設計を提案すること
3. `data-io/` や `lib/` を直接importしようとした場合は、即座にエラーとして指摘すること
4. ビジネスロジックが必要な場合は、親コンポーネントで処理し、結果をpropsで渡す設計を提案すること
5. コンポーネントは再利用可能で、テスト可能な設計にすること
6. 表示用の軽微なフォーマット処理（日付、通貨など）は許可するが、複雑な計算は禁止すること
