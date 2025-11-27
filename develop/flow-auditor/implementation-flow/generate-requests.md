# generate-requests.md - implementation-flow Section

## 目的
implementation-flowセクションの実装に必要な**新規ファイル**を`@GeneratorOperator`で生成するための依頼リスト

**注意**:
- このリストには新規作成ファイルのみを記載
- 既存ファイルの差分修正は、TDD_WORK_FLOW.mdで指示
- テストファイルは自動生成されるため、個別依頼は不要

---

## 1. E2Eテスト（Phase 1）

**注意**: E2Eテストは、既存の`tests/e2e/screen/flow-auditor.screen.spec.ts`にテストケースを**追記**します。
新規ファイル生成は不要のため、generate-requestsには含めません。

---

## 2. 副作用層（data-io層、Phase 2.1）

### 2.1 checkImplementationFiles.server
~~~
@GeneratorOperator "flow-auditorサービスのimplementation-flowセクションに、checkImplementationFiles.serverという名前のdata-ioファイルを作成してください。
- 指定されたファイルパスリストの存在確認（fs.existsSync）
- FileExistsResult配列を返す（{ path: string, exists: boolean }）
- 並列チェックによる高速化（Promise.all）
- パステンプレートの{service}, {section}プレースホルダー置換は呼び出し側で実施済み

service: flow-auditor
section: implementation-flow
name: checkImplementationFiles.server
category: data-io"
~~~

### 2.2 executeRetry.server
~~~
@GeneratorOperator "flow-auditorサービスのimplementation-flowセクションに、executeRetry.serverという名前のdata-ioファイルを作成してください。
- 指定されたファイルパス配列を _archive/{timestamp}/ に移動（Surgical Retry用）
- fs.existsSync でファイル存在確認
- fs.renameSync でファイル移動
- アーカイブディレクトリの自動作成（fs.mkdirSync）
- 移動成功/失敗の結果を返す

service: flow-auditor
section: implementation-flow
name: executeRetry.server
category: data-io"
~~~

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

### 3.1 implementationFlowDefinition
~~~
@GeneratorOperator "flow-auditorサービスのimplementation-flowセクションに、implementationFlowDefinitionという名前のlibファイルを作成してください。
- file-list.mdを解析し、実装すべきファイル定義を取得する純粋関数
- FileDefinition配列を返す
- パステンプレートのプレースホルダー（{service}, {section}）の解決
- E2Eテスト、lib層、data-io層、UI層のファイル定義を抽出

service: flow-auditor
section: implementation-flow
name: implementationFlowDefinition
category: lib"
~~~

### 3.2 implementationFlowBuilder
~~~
@GeneratorOperator "flow-auditorサービスのimplementation-flowセクションに、implementationFlowBuilderという名前のlibファイルを作成してください。
- ファイル定義+存在確認結果からUI表示用データを構築する純粋関数
- LayerGroup配列（app/lib、app/data-io、app/components）を生成
- test-scriptペアのマッチング
- ファイル存在状態の統合

service: flow-auditor
section: implementation-flow
name: implementationFlowBuilder
category: lib"
~~~

### 3.3 filePairMatcher
~~~
@GeneratorOperator "flow-auditorサービスのimplementation-flowセクションに、filePairMatcherという名前のlibファイルを作成してください。
- ファイル選択時にペアを自動選択する純粋関数（Surgical Retry用）
- テストファイルを選択した場合、対応する実装ファイルを返す
- 実装ファイルを選択した場合、対応するテストファイルを返す
- .test.ts/.test.tsx の命名規則に基づくペアマッチング

service: flow-auditor
section: implementation-flow
name: filePairMatcher
category: lib"
~~~

---

## 4. UI層（共有コンポーネント、Phase 2.3）

### 4.1 CardItem (flow-auditor/shared)
~~~
@GeneratorOperator "flow-auditorサービスのsharedセクションに、CardItemという名前のUIコンポーネントを作成してください。
- カード型アイテムの基底コンポーネント（design-flowと共有）
- 選択状態に応じたスタイル（青グロー: border-blue-400 shadow-lg shadow-blue-400/50）
- 完成状態に応じたスタイル（緑グロー: border-green-400 shadow-lg shadow-green-400/50）
- クリック時のコールバック関数

service: flow-auditor
section: shared
name: CardItem
category: ui
ui-type: component"
~~~

---

## 既存ファイル（差分修正対象）

以下のファイルは既に実装済みのため、generate-requestsには含めず、TDD_WORK_FLOW.mdで差分修正として指示します:

### UI層 (implementation-flow固有)
- ImplementationFlowSection.tsx / .test.tsx
- ComponentGroup.tsx / .test.tsx
- GroupHeader.tsx
- TestScriptPair.tsx / .test.tsx
- FileCard.tsx / .test.tsx
- Arrow.tsx

### lib層
- implementationFlowTypes.ts（型定義のみ再利用）
