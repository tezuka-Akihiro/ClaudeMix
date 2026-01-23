# Phase 4: Implementation Prep (🎭⛏️)

あなたは、実装フェーズに入る前の準備を行います。

## 🎯 目的

モックポリシーと開発手順書を作成し、実装フェーズでのTDD開発を円滑に進める準備を整える。

## 📋 成果物

1. **MOCK_POLICY.md**: モックポリシー（テスト時の外部依存のモック化方針）
2. **TDD_WORK_FLOW.md**: 開発手順書（実装フローの具体的手順）

## 📍 前提条件

- Phase 3が完了している（file-list.md, data-flow-diagram.mdが存在）
- 実装に必要なファイルリストが確定している

## ⚙️ 実行手順

### ステップ 1: MOCK_POLICY.md（モックポリシー）の作成

**目的**: テスト時の外部依存をどのようにモック化するかの方針を定義する。

**出力**: `develop/{service}/{section}/MOCK_POLICY.md`

**内容**:

1. **モック対象の特定**:
   - data-io層の外部依存（DB、API、ファイルI/O）をリストアップ
   - Cloudflare Workers環境固有の依存（D1, KV, R2など）を特定

2. **モック方針の定義**:
   - **ユニットテスト**: data-io層はモック化し、lib層の純粋関数のみをテスト
   - **コンポーネントテスト**: loader/actionをモック化し、UIのみをテスト
   - **E2Eテスト**: 実際のCloudflare Workers環境でテスト（モック最小化）

3. **モック実装方法**:
   - Vitestの`vi.mock()`を使用
   - MSW (Mock Service Worker) を使用（API通信のモック）
   - テストフィクスチャの配置場所（`tests/fixtures/`）

**例**:

```markdown
# モックポリシー - {section} Section

## モック対象

| 層 | ファイル | 外部依存 | モック方法 |
| :--- | :--- | :--- | :--- |
| data-io | getUserData.server.ts | D1データベース | vi.mock() |
| data-io | sendEmail.server.ts | 外部API（SendGrid） | MSW |

## モック実装例

### getUserData.server.ts のモック

\`\`\`typescript
// app/lib/{service}/{section}/userLogic.test.ts
import { vi } from 'vitest'
import * as getUserData from '~/data-io/{service}/{section}/getUserData.server'

vi.mock('~/data-io/{service}/{section}/getUserData.server', () => ({
  getUserData: vi.fn().mockResolvedValue({ id: '1', name: 'Test User' })
}))
\`\`\`
```

### ステップ 2: TDD_WORK_FLOW.md（開発手順書）の生成

1. **generator-operator**スキルを使用してテンプレートを生成します。

   ```
   `generator-operator`スキルを使用してTDD_WORK_FLOW.mdを生成します。
   パラメータ: service={service}, section={section}
   ```

2. **出力先**: `develop/{service}/{section}/TDD_WORK_FLOW.md`

3. **内容の具体化**: テンプレートの内容に従って開発フローを具体化させる。

   - **Phase 5.1: E2Eテスト作成**
     - E2E Screen Test（画面遷移テスト）
     - E2E Section Test（機能テスト）
     - 参照: `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`

   - **Phase 5.2: CSS実装**
     - Layer 2: Component Styles（`layer2-{section}.css`）
     - Layer 3: Flexbox and Grid Layout（`layer3.ts`）
     - Layer 4: Structure Exceptions（`layer4.ts`）
     - 参照: `docs/CSS_structure/STYLING_CHARTER.md`

   - **Phase 5.3: TDD実装ループ**
     - 実装順序: Route → Components → Logic → Data-IO
     - 各ファイルの実装とテストをペアで実施
     - ガードレール実行（各ファイル生成後）

4. **進捗管理**:
   - `file-list.md`の各ファイルに対して、実装状態を記録
   - チェックボックス形式で進捗を可視化

### ステップ 3: 実装準備の確認

以下をオペレーター（人間）に報告し、承認を得る：

1. **モックポリシーの妥当性**:
   - 外部依存が適切にリストアップされているか
   - モック方法が明確に定義されているか

2. **開発手順書の完全性**:
   - 実装順序が明確か
   - ガードレールの実行タイミングが定義されているか

3. **実装フェーズへの準備**:
   - Phase 5（Implementation）で必要な情報が揃っているか

## ✅ 完了条件

- [ ] MOCK_POLICY.mdが生成され、モック方針が明確に定義されている
- [ ] TDD_WORK_FLOW.mdが生成され、実装手順が具体化されている
- [ ] file-list.mdの各ファイルに対して実装順序が決定している
- [ ] オペレーターの承認を得ている

## 🔗 次フェーズ

**Phase 5: Implementation** (`prompts/05-implementation.md`)

## 📚 参照ドキュメント

- `docs/generator-collaboration.md`: テンプレート生成の詳細手順
- `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`: E2Eテストの基準
- `docs/boilerplate_architecture/ユニットテストの最低基準.md`: ユニットテストの基準
- `docs/CSS_structure/STYLING_CHARTER.md`: スタイリング憲章
- `develop/{service}/{section}/file-list.md`: 実装ファイルリスト
- `develop/{service}/{section}/data-flow-diagram.md`: データフロー図
