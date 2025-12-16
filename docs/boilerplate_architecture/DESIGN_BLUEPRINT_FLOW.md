# DESIGN_BLUEPRINT_FLOW.md

## 1. 目的

本ドキュメントは、AIエージェントが**完成した機能設計書群（*-func-spec.md, uiux-spec.mdなど）**を分析し、それを実装するための**実行可能なTDD作業手順書（TDD_WORK_FLOW.md）**を生成するための思考プロセスを定義します。

このフローは**セクションごと**に実行されます。

## 2. 作業フローの全体像

AIエージェントは、要件からTDD作業手順書を作成するまで、以下のステップを順番に実行します。

~~~mermaid
graph TD;
    A["入力: file-list.md"] --> B{"1. AI: ファイル生成依頼の作成"};
    B --> C["成果物: generate-requests.md"];
    C --> F{"3. AI: TDD作業手順書の最終生成"};
    A["入力: file-list.md"] --> D{"2. AI: モック計画書の作成"};
    D --> E["成果物: MOCK_POLICY.md"];
    E --> F{"3. AI: TDD作業手順書の最終生成"};
    F --> G["最終成果物: `TDD_WORK_FLOW.md`"];
~~~

## 3. 各ステップの詳細な指示（AIエージェント向け）

### ステップ 1: ファイル生成コマンドリストの作成

**目的**: `file-list.md` に記載された**新規作成ファイル**を生成するために、`@GeneratorOperator` サブエージェントへの依頼リストを作成する。

**入力**:

- `file-list.md`（ファイル構成）
- `scripts/generate/README.md`（@GeneratorOperatorの使用ルール）
- `scripts/generate/config.json`（正しいパラメータ定義）

**出力**: `generate-requests.md`

**重要な原則**:

- このリストには**新規作成ファイルのみ**を記載する
- 既存ファイルの差分修正は、TDD_WORK_FLOW.mdで指示する
- **テストファイルは自動生成される**ため、個別依頼は不要
  - 例: `Foo.ts`を依頼すると、`Foo.test.ts`も自動生成される
  - 例外: E2Eテストは別途依頼が必要（`category: documents`, `document-type: e2e-section-test`）

**指示**:

1. `file-list.md`の各ファイルを確認し、既存実装があるかを判定する
2. 新規作成ファイルについてのみ、`@GeneratorOperator`を呼び出すための自然言語による依頼文を作成する
3. 依頼文は、`scripts/generate/config.json`に定義された正しいパラメータを含める:
   - **UI層コンポーネント**: `category: ui`, `ui-type: component`
   - **lib層**: `category: lib`
   - **data-io層**: `category: data-io`
   - **E2Eテスト**: `category: documents`, `document-type: e2e-section-test`
   - **ドキュメント**: `category: documents`, `document-type: (func-spec | uiux-spec | tdd-workflow など)`

**依頼文の例**:

~~~
# UIコンポーネント（新規作成）
@GeneratorOperator "service-nameサービスのimplementation-flowセクションに、FileCardという名前のUIコンポーネントを作成してください。
- 個別ファイル表示カード
- ファイル存在状態に応じたスタイル（緑グロー: 完成、デフォルト: 未実装、青グロー: 選択中）
- ノードクリック時に選択状態をトグル

service: service-name
section: implementation-flow
name: FileCard
category: ui
ui-type: component"

# lib層（新規作成）
@GeneratorOperator "service-nameサービスのimplementation-flowセクションに、filePairMatcherという名前のlibファイルを作成してください。
- ファイル選択時にペアを自動選択する純粋関数
- テストファイル選択時、対応する実装ファイルを返す
- .test.ts/.test.tsx の命名規則に基づくペアマッチング

service: service-name
section: implementation-flow
name: filePairMatcher
category: lib"

# E2Eテスト（新規作成）
@GeneratorOperator "service-nameサービスのimplementation-flowセクションのE2Eテストを生成してください。
- file-list.mdベースの実装ファイル表示確認
- ノードクリック選択確認
- Surgical Retry実行確認

service: service-name
section: implementation-flow
category: documents
document-type: e2e-section-test"
~~~

**既存ファイルの扱い**:

generate-requests.mdには記載せず、末尾に参考情報として既存ファイルリストを追記する:

~~~markdown
---

## 既存ファイル（差分修正対象）

以下のファイルは既に実装済みのため、generate-requestsには含めず、TDD_WORK_FLOW.mdで差分修正として指示します:

### UI層
- ImplementationFlowSection.tsx / .test.tsx
- ComponentGroup.tsx / .test.tsx
...
~~~

⚙️ ステップ 2: モックポリシーの定義

**目的**: 外部依存（API・DB・Storageなど）に対するモック設計ポリシーをAIが明示的に確立する。

**入力**: spec.yaml, func-spec.md, data-flow-diagram.md

**出力**: `MOCK_POLICY.md`
**指示**:
1：`MOCK_POLICY.md`のテンプレート生成

- **例**:@GeneratorOperator “{{service}} サービスの {{section}} セクションに、I/O 層のモック設計方針（MOCK_POLICY.md）を生成して”
2：モック対象を洗い出し、それぞれの計画を記述する。

### ステップ 3: TDD作業手順書の最終生成

**目的**: これまでの中間生成物を統合し、開発者が実行可能な最終的な作業手順書を完成させる。
**入力**: `generate-requests.md`, `MOCK_POLICY.md`
**出力**: `TDD_WORK_FLOW.md`
**指示**:

1. `TDD_WORK_FLOW.md` のテンプレート生成

- **例**:@GeneratorOperator “{{service}} サービスの {{section}} セクションに、I/O 層のモック設計方針（TDD_WORK_FLOW.md）を生成して”

2. `generate-requests.md` の内容を反映させる。
3. 機能名や目的などを記述し、最終的な手順書を完成させる。
4. **重要**: `generate-requests.md` と `MOCK_POLICY.md` が存在しない場合は、このステップを実行せず、ステップ1または2に戻るようオペレーターに報告してください。
