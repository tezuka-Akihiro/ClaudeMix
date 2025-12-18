# AIエージェント アーキテクチャ・マニフェスト v2.0

このドキュメントは、AIエージェントが常に参照し、その判断基準とするための**「憲法」**として機能します。

## I. 基本原則 (Fundamental Principles)

開発全体の思想を明確に定義し、**3大層分離**による品質担保を実現します。

* **目標**: Remixのスマートレンダリングを構造的に実現し、CICD前での品質を担保すること。
* **フローの遵守**: 常にビュー（Routes/Loader/Action）起点で設計し、それに対応するデータ層を作成すること。モデルから先に作ってはならない。
* **3大層分離**: UI層・純粋ロジック層・副作用層の明確な分離により、テスト容易性を構造的に実現すること。
* **規律の強制**: 各層の責務を絶対に破らず、ESLintと自動化ツールによる違反検出を行うこと。

## II. 3大層分離の絶対ルール

このセクションでは、各層の定義と、AIがファイルを配置する際の絶対的なルールを定義します。

| 層 | シンボル | 配置ディレクトリ | 責務とAIへの指示 |
|:---|:---:|:---|:---|
| **UI層** | 🎨 | `routes/` `components/` | **データフロー制御と表示**: loader/actionによるデータフロー制御、ユーザーへの表示とインタラクション。副作用層のみをimport可能。 |
| **純粋ロジック層** | 🧠 | `lib/` | **副作用のないビジネスロジック**: 計算、データ変換、バリデーション等の純粋関数のみ。他の層のimport禁止。**テストカバレッジ100%必須**。 |
| **副作用層** | 🔌 | `data-io/` | **外部世界との通信**: DBアクセス、APIコール、ファイルI/O等。純粋ロジック層のimport可能。UIコードのimport禁止。 |

### 依存関係の原則

```text
app/components (routes/components)
    ↓ import可能
🔌 副作用層 (data-io) ← import可能 ← 🧠 純粋ロジック層 (lib)
```

**絶対ルール**: 純粋ロジック層は完全独立。他の層をimport禁止。

## III. 各層の詳細規約

### 🎨 **UI層（routes/ + components/）**

#### routes/ の責務

* **データフロー制御**: loader/actionによるデータ取得・更新
* **最小限のJSX**: 20行以下の単純な表示ロジック
* **副作用層のみimport**: `data-io/`の関数のみ呼び出し可能

```typescript
// ✅ 正しい例
export async function loader() {
  const data = await getSalesData() // data-io層から
  return json({ data })
}

export default function Sales() {
  const { data } = useLoaderData()
  return <SalesDashboard data={data} /> // 表示はcomponentsに委譲
}

// ❌ 禁止例
import { calculateProfit } from '~/lib/sales' // lib層の直接import禁止
```

#### components/ の責務

* **純粋なUI表示**: propsで受け取ったデータの表示
* **インタラクション制御**: ユーザー操作のハンドリング
* **推奨構造**: `{service}/{section}/`での整理

```typescript
// ✅ 正しい例
interface Props {
  data: SalesData
}

export function SalesDashboard({ data }: Props) {
  return <div>{/* 純粋なUI実装 */}</div>
}

// ❌ 禁止例
import { getSalesData } from '~/data-io/sales' // 副作用層の直接import禁止
```

### 🧠 **純粋ロジック層（lib/）**

#### 絶対的制約

* **純粋関数のみ**: 同じ入力に対して常に同じ出力
* **副作用禁止**: API呼び出し、DB接続、ファイルI/O、DOM操作一切禁止
* **他層のimport禁止**: 完全独立状態を維持
* **100%テストカバレッジ**: 例外なし

```typescript
// ✅ 正しい例
export function calculateProfit(revenue: number, costs: number): number {
  if (revenue < 0 || costs < 0) {
    throw new Error('Revenue and costs must be non-negative')
  }
  return revenue - costs
}

// ❌ 禁止例
export async function getProfit(id: string) { // async禁止（副作用の可能性）
  const data = await fetch(`/api/sales/${id}`) // 外部通信禁止
  return data.profit
}
```

### 🔌 **副作用層（data-io/）**

#### 責務範囲

* **外部システムとの通信**: DB、API、ファイルシステム等
* **純粋ロジックの活用**: lib層の関数を呼び出し可能
* **モック化対応**: テスト時の外部依存を切り離し可能

```typescript
// ✅ 正しい例
import { validateSalesData } from '~/lib/sales/validation' // lib層は利用可能

export async function getSalesData(): Promise<SalesData> {
  const rawData = await db.query('SELECT * FROM sales') // 副作用OK
  return validateSalesData(rawData) // 純粋ロジックで処理
}

// ❌ 禁止例
import { SalesChart } from '~/components/sales' // UI層のimport禁止
```

## IV. 自動化による規約強制

### ESLintルール（必須実装）

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    // 核心ルール
    'custom/pure-logic-isolation': ['error', {
      'lib/**': {
        bannedImports: ['react', '@remix-run/react', '~/data-io/**', '~/components/**', '~/routes/**']
      }
    }],
    'custom/ui-layer-simplicity': ['error', {
      'routes/**': { maxJsxLines: 20, maxComplexity: 3 }
    }],
    'custom/test-coverage-enforcement': ['error', {
      'lib/**': { threshold: 100 },
      'data-io/**': { threshold: 80 }
    }],
    'custom/no-side-effects-in-lib': 'error',
    'custom/iframe-usage': 'error'
  }
}
```

### 品質ゲート（CI/CD統合）

```bash
# pre-commit hook
npm run quality-gate

✅ 3大層分離ルール検証
✅ テストカバレッジ閾値チェック
✅ 依存関係違反検出
✅ 純粋ロジック層の独立性確認
```

## V. 開発プロセスの標準化

### 対話型ファイル生成（必須ツール）

```bash
npm run new

? どの層のファイルを作成しますか？
❯ app/components（routes）
  app/components（components）
  🧠 純粋ロジック層（lib）
  🔌 副作用層（data-io）

# 選択に応じて適切なテンプレートとテストファイルを自動生成
```

### TDD開発フロー（推奨）

1. **機能設計書**: ビジネスロジックの仕様を明確化
2. **純粋ロジック層**: lib/でのTDD実装（100%カバレッジ）
3. **副作用層**: data-io/での外部通信実装
4. **UI層**: routes/→components/の順で実装
5. **品質検証**: 自動化ツールによる最終チェック

## VI. 移行ガイドライン

### 既存コードの段階的移行

1. **フェーズ1**: 新機能から3大層分離を適用
2. **フェーズ2**: 既存lib/から副作用を分離してdata-io/へ移動
3. **フェーズ3**: UI層の複雑なロジックをlib/に分離

### 具体的な移行例

```typescript
// Before: 混在したlib層
lib/sales.ts
export async function getUserData() { /* 副作用 */ }
export function validateUser() { /* 純粋関数 */ }

// After: 明確に分離
lib/sales/validation.ts
export function validateUser() { /* 純粋関数のみ */ }

data-io/sales/user.ts
export async function getUserData() { /* 副作用のみ */ }
```

## VII. 成功指標

### 必達目標

* [ ] 純粋ロジック層テストカバレッジ: 100%
* [ ] 副作用層テストカバレッジ: 80%+
* [ ] アーキテクチャ違反: 0件（自動検出）
* [ ] 新機能開発時間: 30%短縮
* [ ] バグ発生率: 50%減

## VIII. AIエージェントへの指示

このマニフェストを実装する際、AIエージェントは以下を必ず遵守してください：

1. **3大層分離の絶対遵守**: 例外は一切認めない
2. **純粋ロジック層の完全独立**: 他層のimportは絶対禁止
3. **テストファイルの必須生成**: 実装と同時にテスト作成
4. **自動化ツールの活用**: ESLint、品質ゲートの確実な実行
5. **段階的な実装推奨**: 純粋ロジック→副作用→UIの順序

AIエージェントにこのドキュメントを最高位のコンテキストとして常に参照させることで、あなたの設計思想がコードに具現化されます。
