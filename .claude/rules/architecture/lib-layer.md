---
paths:
  - "app/lib/**/*"
---

# 純粋ロジック層（lib/）のルール

このルールは `app/lib/` 配下のすべてのファイルに適用されます。

## 責務

- **副作用のないビジネスロジック**: 計算、データ変換、バリデーション等の純粋関数のみ
- **100%テストカバレッジ必須**: 例外なくすべての関数にテストを記述すること

## 絶対的制約

### ✅ 許可される内容

- 純粋関数（同じ入力に対して常に同じ出力を返す関数）
- データ変換・計算ロジック
- バリデーション関数
- 型定義・インターフェース

### ❌ 禁止される内容

1. **副作用の禁止**
   - API呼び出し（fetch, axios など）
   - データベース接続・クエリ
   - ファイルI/O（fs.readFile, fs.writeFile など）
   - DOM操作（document, window の使用）
   - 外部ストレージへのアクセス（localStorage, sessionStorage など）

2. **非決定的な関数の禁止**
   - `Date.now()`, `Math.random()` などの非決定的な値の直接使用
   - これらが必要な場合は、引数として受け取ること

3. **async/await の使用禁止**
   - 純粋ロジック層では非同期処理は認められません
   - 非同期処理が必要な場合は `data-io/` 層で実装してください

4. **他層のimport禁止**
   - `~/routes/**` からのimport禁止
   - `~/components/**` からのimport禁止
   - `~/data-io/**` からのimport禁止
   - React関連（`react`, `@remix-run/react`）のimport禁止

5. **同じlib層内でのimportのみ許可**
   - `~/lib/**` からのimportのみ可能

## 正しい実装例

```typescript
// ✅ 正しい例: 純粋関数
export function calculateProfit(revenue: number, costs: number): number {
  if (revenue < 0 || costs < 0) {
    throw new Error('Revenue and costs must be non-negative')
  }
  return revenue - costs
}

// ✅ 正しい例: データ変換
export function formatUserName(firstName: string, lastName: string): string {
  return `${lastName} ${firstName}`
}

// ✅ 正しい例: バリデーション
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ✅ 正しい例: 非決定的な値を引数で受け取る
export function isExpired(expiryDate: Date, currentDate: Date): boolean {
  return currentDate > expiryDate
}
```

## 禁止される実装例

```typescript
// ❌ 禁止例: async関数（副作用の可能性）
export async function getProfit(id: string) {
  const data = await fetch(`/api/sales/${id}`)
  return data.profit
}

// ❌ 禁止例: 外部通信
export function fetchUserData(userId: string) {
  return fetch(`/api/users/${userId}`)
}

// ❌ 禁止例: DOM操作
export function updateUI(message: string) {
  document.getElementById('status').textContent = message
}

// ❌ 禁止例: 非決定的な値の直接使用
export function isExpired(expiryDate: Date): boolean {
  return Date.now() > expiryDate.getTime() // Date.now()を直接使用
}

// ❌ 禁止例: 他層のimport
import { getSalesData } from '~/data-io/sales' // data-io層のimport禁止
import { Button } from '~/components/ui/button' // components層のimport禁止
```

## テスト要件

- **テストカバレッジ100%必須**
- すべての関数に対して単体テストを記述すること
- エッジケース、エラーケースも含めてテストすること
- テストファイルは `*.test.ts` または `*.spec.ts` の命名規則に従うこと

## AIエージェントへの指示

1. `app/lib/` 配下でコードを生成する際は、必ず純粋関数のみを実装すること
2. 副作用が必要な処理は `app/data-io/` 層に移動すること
3. 実装と同時にテストファイルを生成すること
4. 他層をimportしようとした場合は、即座にエラーとして指摘すること
5. async/await が必要な場合は、`data-io/` 層での実装を提案すること
