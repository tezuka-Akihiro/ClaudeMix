# Phase 5.3: TDD実装ループ（🪨🚧🪨🚧🪨🚧🪨🚧）

あなたは、TDD開発フローの実装ループを実行します。

## 🎯 目的

**3大層分離アーキテクチャ**に従い、**Route → Components → Logic → Data-IO**の順序で、テスト駆動開発（TDD）により実装を完了する。

## 📋 成果物

1. **Route実装**: データフロー制御（loader/action）
2. **Components実装**: UI部品（テスト含む）
3. **Logic実装**: 純粋ロジック層（テスト含む）
4. **Data-IO実装**: 副作用層（テスト含む）

## 📍 前提条件

- Phase 5.2が完了している（CSS実装が完了している）
- file-list.mdに実装対象ファイルがリストアップされている
- MOCK_POLICY.mdにモック方針が定義されている

## 思考プロセス（CoT）

以下の順序で段階的に実装してください：

```text
Step 1: file-list.mdを読み込み、実装順序を確認する
  → Route → Components → Logic → Data-IO

Step 2: Route実装（loader/action）
  → データフロー制御のみ、UIはComponentsに委譲

Step 3: Components実装（Red → Green）
  → テスト作成 → 実装 → テスト合格

Step 4: Logic実装（Red → Green）
  → テスト作成 → 実装 → テスト合格 → 100%カバレッジ

Step 5: Data-IO実装（Red → Green）
  → テスト作成 → 実装 → テスト合格

Step 6: 最終検証
  → すべてのガードレールを実行し、合格を確認
```

## ⚙️ 実行手順

実装順序: **Route → Components → Logic → Data-IO**

### ステップ 1: Route実装（🪨）

**目的**: データフロー制御（loader/action）とページ構成を実装する。

**対象ファイル**: `app/routes/{service}.{section}.tsx`

**実装内容**:
- loader/actionの実装
- data-io層の関数呼び出し
- 最小限のJSX（20行以下）
- コンポーネントへの委譲

**実装例**:

```typescript
// app/routes/{service}.{section}.tsx
import { json, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { getData } from '~/data-io/{service}/{section}/getData.server'
import { MainComponent } from '~/components/{service}/{section}/MainComponent'

export async function loader({ context }: LoaderFunctionArgs) {
  const data = await getData(context.env)
  return json({ data })
}

export default function SectionPage() {
  const { data } = useLoaderData<typeof loader>()
  return <MainComponent data={data} />
}
```

**制約**:
- ✅ **副作用層（data-io）のみimport可能**
- ❌ **lib層の直接import禁止**

**ガードレール実行**:

```bash
# テンプレートリント実行
./scripts/run-lint.sh app/routes/{service}.{section}.tsx

# TypeScript検証
npm run typecheck
```

### ステップ 2: Components実装（🚧🪨）

**目的**: 再利用可能なUI部品を実装する。

**対象ファイル**: `app/components/{service}/{section}/*.tsx`

**実装順序**:
1. **テスト作成**（🚧）: `{Component}.test.tsx`
2. **実装**（🪨）: `{Component}.tsx`

**TDDサイクル**:

```text
Red（失敗）:
  1. テストを書く
  2. テストを実行 → 失敗を確認

Green（成功）:
  3. 最小限の実装を書く
  4. テストを実行 → 合格を確認

Refactor（改善）:
  5. リファクタリング（必要な場合）
  6. テストを実行 → 合格を維持
```

**実装例（テスト）**:

```typescript
// app/components/{service}/{section}/MainComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { MainComponent } from './MainComponent'

describe('MainComponent', () => {
  it('should display data', () => {
    const testData = { id: '1', name: 'Test' }
    render(<MainComponent data={testData} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

**実装例（コンポーネント）**:

```typescript
// app/components/{service}/{section}/MainComponent.tsx
interface Props {
  data: { id: string; name: string }
}

export function MainComponent({ data }: Props) {
  return (
    <div>
      <h1>{data.name}</h1>
    </div>
  )
}
```

**制約**:
- ❌ **副作用層の直接import禁止**

**ガードレール実行**:

```bash
# テンプレートリント実行
./scripts/run-lint.sh app/components/{service}/{section}/{Component}.tsx

# テスト実行
npm test app/components/{service}/{section}/{Component}.test.tsx
```

### ステップ 3: Logic実装（🚧🪨）

**目的**: ビジネスロジックを純粋関数として実装する。

**対象ファイル**: `app/lib/{service}/{section}/*.ts`

**実装順序**:
1. **テスト作成**（🚧）: `{logic}.test.ts`
2. **実装**（🪨）: `{logic}.ts`

**実装例（テスト）**:

```typescript
// app/lib/{service}/{section}/calculateTotal.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotal } from './calculateTotal'

describe('calculateTotal', () => {
  it('should calculate total correctly', () => {
    expect(calculateTotal(100, 20)).toBe(120)
  })

  it('should throw error for negative values', () => {
    expect(() => calculateTotal(-100, 20)).toThrow()
  })
})
```

**実装例（ロジック）**:

```typescript
// app/lib/{service}/{section}/calculateTotal.ts
export function calculateTotal(price: number, tax: number): number {
  if (price < 0 || tax < 0) {
    throw new Error('Price and tax must be non-negative')
  }
  return price + tax
}
```

**制約**:
- ❌ **他の層のimport禁止**（完全独立）
- ❌ **副作用禁止**（API呼び出し、DB接続、ファイルI/O、DOM操作一切禁止）
- ✅ **100%テストカバレッジ必須**

**ガードレール実行**:

```bash
# テンプレートリント実行
./scripts/run-lint.sh app/lib/{service}/{section}/{logic}.ts

# カバレッジ取得（100%必須）
./scripts/run-coverage.sh app/lib/{service}/{section}/{logic}.test.ts
```

### ステップ 4: Data-IO実装（🚧🪨）

**目的**: 外部システムとの通信を実装する。

**対象ファイル**: `app/data-io/{service}/{section}/*.server.ts`

**実装順序**:
1. **テスト作成**（🚧）: `{dataAccess}.test.ts`
2. **実装**（🪨）: `{dataAccess}.server.ts`

**実装例（テスト）**:

```typescript
// app/data-io/{service}/{section}/getData.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getData } from './getData.server'

describe('getData', () => {
  it('should fetch data from database', async () => {
    const mockEnv = {
      DB: {
        prepare: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      },
    }
    const result = await getData(mockEnv as any)
    expect(result).toEqual({ id: '1', name: 'Test' })
  })
})
```

**実装例（データアクセス）**:

```typescript
// app/data-io/{service}/{section}/getData.server.ts
export async function getData(env: Env) {
  const result = await env.DB.prepare('SELECT * FROM data').first()
  return result
}
```

**制約**:
- ✅ **lib層のimport可能**
- ❌ **UI層のimport禁止**

**モック化**: `MOCK_POLICY.md`に従って外部依存をモック化

**ガードレール実行**:

```bash
# テンプレートリント実行
./scripts/run-lint.sh app/data-io/{service}/{section}/{dataAccess}.server.ts

# テスト実行
npm test app/data-io/{service}/{section}/{dataAccess}.test.ts
```

### ステップ 5: 最終検証

すべての実装が完了したら、スクリプトを使用してすべてのガードレールを実行します。

```bash
# 全ガードレールを一括実行
./scripts/run-all-checks.sh
```

このスクリプトは以下を順番に実行します：
1. テンプレートリント
2. CSS規律検証
3. TypeScript検証
4. ユニットテスト
5. E2Eテスト

すべてのガードレールが合格するまで修正を繰り返してください。

### ステップ 6: コミット

ガードレールがすべて合格したら、変更をコミットします。

```bash
git add .
git commit -m "feat: implement {section} section

- Add E2E tests (screen, section)
- Implement CSS layers (layer2, layer3, layer4)
- Implement Route with loader/action
- Implement Components with tests
- Implement Logic with 100% coverage
- Implement Data-IO with tests

https://claude.ai/code/session_XXXXXX"
```

## ✅ 完了条件

- [ ] Routeが実装され、loader/actionが動作している
- [ ] Componentsがすべて実装され、テストが合格している
- [ ] Logicがすべて実装され、100%テストカバレッジを達成している
- [ ] Data-IOがすべて実装され、テストが合格している
- [ ] すべてのガードレールが合格している
- [ ] E2Eテストが合格している（Green状態）
- [ ] 変更がコミットされている

## 🎉 開発フロー完了

すべての完了条件を満たしたら、TDD開発フローが完了です。

## 📚 参照ドキュメント

- `docs/guardrails.md`: ガードレール実行ルールの詳細
- `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md`: 3大層アーキテクチャの詳細
- `docs/boilerplate_architecture/ユニットテストの最低基準.md`: ユニットテストの基準
- `develop/{service}/{section}/MOCK_POLICY.md`: モックポリシー
- `develop/{service}/{section}/TDD_WORK_FLOW.md`: 開発手順書
- `develop/{service}/{section}/file-list.md`: 実装ファイルリスト
- `scripts/run-lint.sh`: テンプレートリント実行スクリプト
- `scripts/run-coverage.sh`: カバレッジ取得スクリプト
- `scripts/run-all-checks.sh`: 全ガードレール実行スクリプト
