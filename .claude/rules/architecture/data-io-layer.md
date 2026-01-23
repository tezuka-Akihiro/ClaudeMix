---
paths:
  - "app/data-io/**/*"
---

# 副作用層（data-io/）のルール

このルールは `app/data-io/` 配下のすべてのファイルに適用されます。

## 責務

- **外部システムとの通信**: データベース、API、ファイルシステム等との連携
- **純粋ロジックの活用**: `lib/` 層の関数を呼び出してビジネスロジックを実行
- **モック化対応**: テスト時の外部依存を切り離し可能な設計

## 許可される内容

### ✅ 外部通信

- データベースアクセス（D1, KV, R2 など）
- API呼び出し（fetch, axios など）
- ファイルI/O
- 外部サービスとの連携

### ✅ lib層の活用

- `~/lib/**` からのimportと関数呼び出し
- 純粋ロジック層のバリデーション・変換関数の利用

### ✅ async/await の使用

- 非同期処理が必要な外部通信では async/await を使用可能

## 禁止される内容

### ❌ UI層のimport禁止

1. **React コンポーネントのimport禁止**
   - `~/components/**` からのimport禁止
   - `~/routes/**` からのimport禁止

2. **UIライブラリの直接使用禁止**
   - `react`, `@remix-run/react` の直接import禁止
   - UIロジックは含めないこと

## 正しい実装例

```typescript
// ✅ 正しい例: データベースアクセス + lib層の活用
import { validateSalesData } from '~/lib/sales/validation' // lib層の関数を利用

export async function getSalesData(db: D1Database): Promise<SalesData> {
  const rawData = await db.query('SELECT * FROM sales') // 外部通信OK
  return validateSalesData(rawData) // 純粋ロジックで処理
}

// ✅ 正しい例: API呼び出し
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }
  return response.json()
}

// ✅ 正しい例: KVストレージへのアクセス
export async function getSessionData(
  kv: KVNamespace,
  sessionId: string
): Promise<SessionData | null> {
  const data = await kv.get(`session:${sessionId}`, 'json')
  return data
}

// ✅ 正しい例: lib層のバリデーション活用
import { isValidEmail } from '~/lib/validation/email'

export async function createUser(
  db: D1Database,
  email: string,
  password: string
): Promise<User> {
  // lib層のバリデーションを活用
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format')
  }

  // データベース操作
  const result = await db.insert('users', { email, password })
  return result
}
```

## 禁止される実装例

```typescript
// ❌ 禁止例: UI層のimport
import { UserCard } from '~/components/user/UserCard' // components層のimport禁止

export async function getUserWithCard(userId: string) {
  const user = await fetchUser(userId)
  return <UserCard user={user} /> // UIロジックは禁止
}

// ❌ 禁止例: Reactのimport
import { useState } from 'react' // React関連のimport禁止

export async function getUserData(userId: string) {
  const [data, setData] = useState(null) // UIステート管理は禁止
  // ...
}

// ❌ 禁止例: ビジネスロジックの直接実装（lib層で実装すべき）
export async function calculateUserScore(userId: string): Promise<number> {
  const userData = await fetchUser(userId)

  // ❌ この計算ロジックは lib層で実装すべき
  let score = 0
  if (userData.posts > 10) score += 50
  if (userData.followers > 100) score += 30
  return score
}

// ✅ 正しくは以下のように分離すべき
// lib/user/scoring.ts
export function calculateScore(posts: number, followers: number): number {
  let score = 0
  if (posts > 10) score += 50
  if (followers > 100) score += 30
  return score
}

// data-io/user/score.ts
import { calculateScore } from '~/lib/user/scoring'

export async function getUserScore(userId: string): Promise<number> {
  const userData = await fetchUser(userId)
  return calculateScore(userData.posts, userData.followers)
}
```

## テスト要件

- **テストカバレッジ80%以上**
- 外部依存はモック化してテストすること
- エラーハンドリングのテストを含めること
- 正常系・異常系の両方をカバーすること

## AIエージェントへの指示

1. `app/data-io/` 配下でコードを生成する際は、外部通信処理のみを実装すること
2. ビジネスロジックが必要な場合は、`app/lib/` 層に分離すること
3. UI層（`components/`, `routes/`）をimportしようとした場合は、即座にエラーとして指摘すること
4. データベース、API、ファイルI/Oなどの外部依存は、テスト時にモック化可能な設計にすること
5. 純粋な計算・変換・バリデーションは `lib/` 層に委譲すること
