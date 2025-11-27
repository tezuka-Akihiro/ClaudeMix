# generate-requests.md - Design Flow Section

このドキュメントは、`file-list.md`に記載されたファイルを生成するための`@GeneratorOperator`サブエージェントへの依頼リストです。

---

## Phase 1: E2Eテスト生成

### 1.1 画面レベルE2E（全セクション共通）

~~~
@GeneratorOperator "flow-auditorサービスの画面レベルE2Eテストを生成してください。
service: flow-auditor
section: (セクション指定なし、画面全体)
name: flow-auditor.e2e.test
category: test
test-type: e2e"
~~~

### 1.2 セクションレベルE2E

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションのE2Eテストを生成してください。
- 共通チェックポイント表示確認
- セクション別チェックポイント動的表示確認（1-6セクション）
- チェックポイント選択機能確認
- SVG接続線描画確認
- セクション数超過警告表示確認（6超過時）

service: flow-auditor
section: design-flow
name: design-flow-section.e2e.test
category: test
test-type: e2e"
~~~

---

## Phase 2: UI層生成

### 2.1 Route更新（既存ファイル）

~~~
@GeneratorOperator "flow-auditorサービスのメインルート（_index.tsx）のloaderを更新してください。
- design-flowのチェックポイント状態を取得
- CommonFlow/BranchedFlowのデータ構造に対応

service: flow-auditor
section: (ルート全体)
name: _index
category: ui
ui-type: route
action: update"
~~~

### 2.2 Components生成（design-flow専用）

#### DesignFlowSection（親コンポーネント）

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、DesignFlowSectionという名前のUIコンポーネントを作成してください。
- loaderDataを受け取り、CommonFlowContainerとBranchedFlowContainerに振り分け
- selectedCheckpointIdをstateで管理
- onSelectハンドラを子コンポーネントに提供

service: flow-auditor
section: design-flow
name: DesignFlowSection
category: ui
ui-type: component"
~~~

#### CommonFlowContainer

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、CommonFlowContainerという名前のUIコンポーネントを作成してください。
- 共通チェックポイント（project.toml, start-dev.js, REQUIREMENTS_ANALYSIS_PIPE.md, GUIDING_PRINCIPLES.md）を縦1列表示
- CheckpointItemを配置

service: flow-auditor
section: design-flow
name: CommonFlowContainer
category: ui
ui-type: component"
~~~

#### BranchedFlowContainer

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、BranchedFlowContainerという名前のUIコンポーネントを作成してください。
- セクション別チェックポイントを動的列数で並列表示（grid-cols-1 md:grid-cols-2 lg:grid-cols-3）
- Branchコンポーネントを動的生成（最大6セクション）
- セクション数が6を超える場合はOverflowWarningを表示

service: flow-auditor
section: design-flow
name: BranchedFlowContainer
category: ui
ui-type: component"
~~~

#### Branch

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、Branchという名前のUIコンポーネントを作成してください。
- 単一セクション（例: operation）のチェックポイント群を縦1列表示
- セクション名をヘッダーに表示（ {sectionName}形式、グループ名は表示しない）
- CheckpointItemを配置

service: flow-auditor
section: design-flow
name: Branch
category: ui
ui-type: component"
~~~

#### CheckpointItem

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、CheckpointItemという名前のUIコンポーネントを作成してください。
- Props: checkpoint, isSelected, onSelect
- 状態に応じたスタイル適用（pending: 赤+点滅、completed: 緑、selected: 青）
- completed時のみホバー可能（選択中スタイルを適用）
- クリック時にonSelectを発火

service: flow-auditor
section: design-flow
name: CheckpointItem
category: ui
ui-type: component"
~~~

#### OverflowWarning

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、OverflowWarningという名前のUIコンポーネントを作成してください。
- セクション数が6を超える場合の警告メッセージ表示
- メッセージ: 「セクション数が最大値（6）を超えています。project.tomlを見直してください。」

service: flow-auditor
section: design-flow
name: OverflowWarning
category: ui
ui-type: component"
~~~

---

## Phase 2: lib層生成

### 3.1 design-flow固有ロジック

#### designFlowDefinition

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、designFlowDefinitionという名前のlibファイルを作成してください。
- 共通フローチェックポイント定義: [project.toml, start-dev.js, REQUIREMENTS_ANALYSIS_PIPE.md, GUIDING_PRINCIPLES.md]
- セクション別フローチェックポイント定義: [func-spec.md, uiux-spec.md, spec.yaml, TDD_WORK_FLOW.md]

service: flow-auditor
section: design-flow
name: designFlowDefinition
category: lib"
~~~

#### flowGroupBuilder

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、flowGroupBuilderという名前のlibファイルを作成してください。
- チェックポイントを「共通（common）」「セクション別（branched）」にグループ化
- project.tomlから動的にセクション一覧を取得
- セクション数検証（1-6の範囲、超過時はエラー）

service: flow-auditor
section: design-flow
name: flowGroupBuilder
category: lib"
~~~

#### retryCommandBuilder

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、retryCommandBuilderという名前のlibファイルを作成してください。
- 選択されたチェックポイントIDからリトライコマンドを生成
- 出力例: 'claude-code retry --from design-flow-requirements'

service: flow-auditor
section: design-flow
name: retryCommandBuilder
category: lib"
~~~

### 3.2 共通ロジック（セクション指定なし）

#### checkpointStatus

~~~
@GeneratorOperator "flow-auditorサービスに、checkpointStatusという名前のlibファイルを作成してください（セクション共通）。
- ステータス判定: pending/completed/selected
- exists真偽値から状態を決定

service: flow-auditor
section: (共通)
name: checkpointStatus
category: lib"
~~~

---

## Phase 2: data-io層生成

### 4.1 design-flow専用

#### checkDesignFiles.server

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、checkDesignFiles.serverという名前のdata-ioファイルを作成してください。
- 設計ドキュメントの存在確認（fs.existsSync）
- 共通対象: scripts/project.toml, scripts/start-dev.js, develop/{service}/REQUIREMENTS_ANALYSIS_PIPE.md, GUIDING_PRINCIPLES.md
- セクション別対象: develop/{service}/{section}/func-spec.md, uiux-spec.md, spec.yaml, TDD_WORK_FLOW.md

service: flow-auditor
section: design-flow
name: checkDesignFiles.server
category: data-io"
~~~

#### loadProjectSections.server

~~~
@GeneratorOperator "flow-auditorサービスのdesign-flowセクションに、loadProjectSections.serverという名前のdata-ioファイルを作成してください。
- project.tomlから対象サービスのセクション定義を取得
- 出力: { name: string }[] 形式のセクション配列

service: flow-auditor
section: design-flow
name: loadProjectSections.server
category: data-io"
~~~

---

## 生成順序の推奨

DESIGN_BLUEPRINT_FLOW.mdとTDD原則に従い、以下の順序で生成することを推奨します：

### Phase 1（E2E First）
1. 画面レベルE2E
2. セクションレベルE2E

### Phase 2（Double-Loop TDD: Outside-In）

#### UI層（外側から）
1. Route更新（_index.tsx loader）
2. DesignFlowSection（親コンポーネント）
3. CommonFlowContainer + BranchedFlowContainer
4. Branch + CheckpointItem
5. OverflowWarning

#### lib層（内側へ）
1. designFlowDefinition（チェックポイント定義）
2. flowGroupBuilder（グループ化ロジック）
3. checkpointStatus（共通: ステータス判定）
4. retryCommandBuilder（コマンド生成）

#### data-io層（最も内側）
1. checkDesignFiles.server（ファイル存在確認）
2. loadProjectSections.server（セクション定義取得）

### テストと実装の交互実行
各ファイル生成時、テストファイルを先に生成し、その後実装ファイルを生成する。

---

## 変更点（修正計画3による更新）

### 削除されたコンポーネント
- ProgressHeader, ProgressBar
- PhaseGroup, PhaseHeader
- SectionCheckpointList

### 追加されたコンポーネント
- CommonFlowContainer, BranchedFlowContainer
- Branch
- OverflowWarning

### lib層の変更
- phaseGroupBuilder → flowGroupBuilder
- sectionCheckpointGrouper → 削除
- progressCalculator → 削除
- retryCommandBuilder → 追加

### data-io層の変更
- checkFileExistence → checkDesignFiles.server（design-flow専用化）
- loadProjectSections.server → 追加

---

## 注意事項

- **サブエージェントへの依頼**: 上記の依頼文は自然言語形式であり、GeneratorOperatorが内部で適切なコマンドライン引数に変換します。
- **セクション共通ファイル**: `checkpointStatus`, `_index.tsx`（Route）は全セクション共有のため、セクション指定なしで生成します。
- **TDD原則**: E2Eテスト（Phase 1）を先に実行し、失敗を確認してから、ユニットテスト・実装（Phase 2）に進みます。
- **動的セクション数**: 最大6セクション、project.tomlから取得した実際のセクション数に応じて表示します。
