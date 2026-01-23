# レイヤー別チェックリスト

ClaudeMixプロジェクトのコードレビュー時に使用するチェックリストです。

## レイヤー別チェック項目

### lib層のチェック項目

lib層は**純粋関数のみ**を含むレイヤーです。

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | 純粋関数のみか？（副作用禁止） | lib層の責務 |
| 2 | async/awaitを使用していないか？ | 非同期処理は data-io層 |
| 3 | 他層（ui, data-io）のimportがないか？ | レイヤー依存の原則 |
| 4 | 単一責任原則に従っているか？ | 関数の責務を明確に |
| 5 | テストカバレッジ100%を目指しているか？ | 純粋関数はテストしやすい |
| 6 | 関数名が動詞で始まっているか？ | calculate, validate, format等 |

**違反例**:

```typescript
// ❌ NG: async/awaitを使用（副作用）
export async function fetchUserData(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ✅ OK: 純粋関数
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((completed / total) * 100, 100);
}
```

### data-io層のチェック項目

data-io層は**副作用を伴う処理**を含むレイヤーです。

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | 副作用を伴う処理（API通信、DB操作等）か？ | data-io層の責務 |
| 2 | lib層の純粋関数を活用しているか？ | ビジネスロジックはlib層へ |
| 3 | ui層のコードをimportしていないか？ | レイヤー依存の原則 |
| 4 | エラーハンドリングが適切か？ | 外部依存の失敗を想定 |
| 5 | loader/action関数から呼び出される設計か？ | Remixのデータフロー |

**違反例**:

```typescript
// ❌ NG: ビジネスロジックをdata-io層に記述
export async function getUserProgress(userId: string) {
  const data = await db.progress.findUnique({ where: { userId } });
  // ビジネスロジック（lib層へ移動すべき）
  const progress = (data.completed / data.total) * 100;
  return progress;
}

// ✅ OK: lib層の純粋関数を活用
import { calculateProgress } from "~/lib/progress/calculator";

export async function getUserProgress(userId: string) {
  const data = await db.progress.findUnique({ where: { userId } });
  return calculateProgress(data.completed, data.total);
}
```

### ui層のチェック項目

ui層は**ユーザーインターフェース**を担当するレイヤーです。

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | loader/actionでデータフロー制御しているか？ | Remixの設計思想 |
| 2 | data-io層の関数のみをimportしているか？ | レイヤー依存の原則 |
| 3 | コンポーネントのJSXが20行以下か？ | 可読性・保守性 |
| 4 | ビジネスロジックを含んでいないか？ | lib層へ移動 |
| 5 | 適切にコンポーネント分割されているか？ | 再利用性・テスト容易性 |
| 6 | Tailwind CSSのデザイントークンを使用しているか？ | 一貫性 |

**違反例**:

```tsx
// ❌ NG: ビジネスロジックをコンポーネント内に記述
export default function ProgressDisplay({ completed, total }: Props) {
  // ビジネスロジック（lib層へ移動すべき）
  const progress = (completed / total) * 100;

  return <div>Progress: {progress}%</div>;
}

// ✅ OK: lib層の純粋関数を活用
import { calculateProgress } from "~/lib/progress/calculator";

export default function ProgressDisplay({ completed, total }: Props) {
  const progress = calculateProgress(completed, total);

  return <div>Progress: {progress}%</div>;
}
```

## TDD原則チェック項目

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | E2Eテスト（Phase 1）が存在するか？ | ユーザーストーリーの検証 |
| 2 | 各ユニットのテストが存在するか？ | 関数単位の検証 |
| 3 | テストが実装より先にコミットされているか？ | TDDの原則 |
| 4 | テストが失敗→成功のサイクルを経ているか？ | Red-Green-Refactor |
| 5 | TDD_WORK_FLOW.md に従っているか？ | プロジェクトの開発フロー |

**確認方法**:

```bash
# E2Eテストの存在確認
ls tests/e2e/*.spec.ts

# ユニットテストの存在確認
ls app/lib/**/*.test.ts

# テストカバレッジの確認
npm test -- --coverage
```

## コーディング品質チェック項目

### TypeScript品質

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | 型が明示的に定義されているか？ | 型安全性 |
| 2 | anyの使用を避けているか？ | 型安全性の低下を防ぐ |
| 3 | interface/typeが適切に定義されているか？ | 型の再利用性 |
| 4 | 型安全性が保たれているか？ | ランタイムエラーの防止 |

**違反例**:

```typescript
// ❌ NG: anyの使用
function processData(data: any) {
  return data.value;
}

// ✅ OK: 型を明示的に定義
interface DataInput {
  value: number;
}

function processData(data: DataInput): number {
  return data.value;
}
```

### 命名規則

| # | チェック項目 | 規則 |
|:---|:---|:---|
| 1 | ファイル名がkebab-caseか？ | `progress-calculator.ts` |
| 2 | 関数名がcamelCaseか？ | `calculateProgress` |
| 3 | 型名がPascalCaseか？ | `ProgressData` |
| 4 | 定数がUPPER_SNAKE_CASEか？ | `MAX_RETRY_COUNT` |
| 5 | 命名が意図を明確に表現しているか？ | `isValid` より `isValidEmail` |

### 構造

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | 1ファイル1責務を守っているか？ | 単一責任原則 |
| 2 | 適切にディレクトリ構造に配置されているか？ | プロジェクト構造の一貫性 |
| 3 | import文が整理されているか？ | 可読性 |

**import文の整理順序**:

```typescript
// 1. 外部ライブラリ
import { useState } from "react";
import { json } from "@remix-run/cloudflare";

// 2. 内部モジュール（レイヤー順）
import { calculateProgress } from "~/lib/progress/calculator";
import { getUserProgress } from "~/data-io/progress/queries";
import { ProgressDisplay } from "~/components/progress/ProgressDisplay";

// 3. 型定義
import type { ProgressData } from "~/types/progress";
```

### パフォーマンス

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | 不要な再レンダリングがないか？ | パフォーマンス最適化 |
| 2 | メモ化が適切に使用されているか？ | `useMemo`, `useCallback` |
| 3 | 無駄な計算がないか？ | 計算結果の再利用 |

## npm run generate 準拠チェック項目

| # | チェック項目 | 理由 |
|:---|:---|:---|
| 1 | ファイルが npm run generate で生成されているか？ | 構造保証 |
| 2 | 手動作成されたファイルが存在しないか？ | テンプレートの一貫性 |
| 3 | テンプレートに従った構造になっているか？ | プロジェクト標準 |
| 4 | 必要なテストファイルが同時生成されているか？ | TDDの徹底 |

---

このチェックリストは、レビュー時の参照用です。実際のレビュー手順は `prompts/01-review.md` を参照してください。
