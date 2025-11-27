# Operation Section - ファイル生成依頼リスト

## 📋 概要
このファイルは、operationセクションの実装に必要な全ファイルを生成するための、GeneratorOperatorサブエージェントへの依頼リストです。

---

## 🧪 Phase 1: E2Eテスト生成

### 1.1 画面レベルE2Eテスト (更新)
```bash
@GeneratorOperator "flow-auditorサービスの画面レベルE2Eテストを更新してください。
- operationセクションの[更新]ボタンと[リトライ]ボタンのテストケースを追加
- selectedCheckpointIdがURL SearchParamsで正しく渡されることを確認
- 更新ボタンクリック後、全チェックポイントの状態が再確認される
- リトライボタンがselectedCheckpointId未選択時に無効化される
- リトライボタンクリック後、RetryModalが表示される

service: flow-auditor
section: (画面全体)
name: flow-auditor
category: test
test-type: e2e
action: update"
```

### 1.2 セクションレベルE2Eテスト
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションのE2Eテストを生成してください。
- [更新]ボタンクリックでcheckAllCheckpoints.server.tsが実行され、全チェックポイント状態が更新される
- [リトライ]ボタンがselectedCheckpointIdに基づいて有効/無効を切り替える
- RetryModalが正しく表示され、影響ファイルリスト（affected files）が表示される
- リトライ実行後、対象ファイルがdevelop/archive/{timestamp}/へアーカイブされる
- ServiceSelectorでサービス選択変更時、design-flow/implementation-flowセクションが更新される
- LastUpdatedLabelが最終更新日時をHH:MM形式で表示する（1分以内は「たった今」）

service: flow-auditor
section: operation
name: operation-section
category: test
test-type: e2e"
```

---

## 🔌 Phase 2.1: 副作用層 (data-io) 生成

### 2.1.1 checkFileExistence.server
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、checkFileExistence.serverという名前のdata-ioファイルを作成してください。
- 単一ファイルの存在確認（fs.existsSync）
- 入力: filePath (string) - 確認対象ファイルの絶対パス
- 出力: exists (boolean) - ファイルが存在する場合true
- 処理時間: 100ms以内に完了
- エラーハンドリング: 不正なパスの場合はfalseを返す

service: flow-auditor
section: operation
name: checkFileExistence.server
category: data-io"
```

### 2.1.2 checkAllCheckpoints.server
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、checkAllCheckpoints.serverという名前のdata-ioファイルを作成してください。
- 全チェックポイントの存在確認（並列処理、Promise.all）
- 入力: checkpoints (Array<{ id: string, path: string }>) - チェックポイントID・パス配列
- 出力: results (Array<OperationCheckpoint>) - 各チェックポイントにexists: booleanを付与
- 処理時間: Promise.allによる並列処理で500ms以内に完了
- checkFileExistence.server.tsを内部で使用
- エラーハンドリング: 個別ファイルのエラーでも処理継続（exists: falseとして扱う）

service: flow-auditor
section: operation
name: checkAllCheckpoints.server
category: data-io"
```

### 2.1.3 archiveFiles.server
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、archiveFiles.serverという名前のdata-ioファイルを作成してください。
- ファイルアーカイブ（fs.renameSync、develop/archive/{timestamp}/へ移動）
- 入力:
  - filePaths (string[]) - アーカイブ対象ファイルの絶対パス配列
  - archiveDir (string) - アーカイブ先ディレクトリ（例: develop/archive/20251009_164712）
- 出力: { success: boolean, archivedFiles: string[], errors: string[] }
- 処理:
  1. アーカイブディレクトリ作成（fs.mkdirSync、recursive: true）
  2. 各ファイルをfs.renameSync で移動（ディレクトリ構造を維持）
  3. エラー時はロールバック（全ファイルを元の位置に復元）
- 原子性保証: 1ファイルでもエラーが発生した場合、全処理をロールバック

service: flow-auditor
section: operation
name: archiveFiles.server
category: data-io"
```

### 2.1.4 loadServices.server
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、loadServices.serverという名前のdata-ioファイルを作成してください。
- project.tomlから全サービス名取得
- 入力: なし
- 出力: services (string[]) - サービス名配列（例: ['flow-auditor', 'user-auth', 'data-sync']）
- 処理:
  1. project.tomlをfs.readFileSyncで読み込み
  2. TOMLパース（@iarna/toml使用）
  3. [services]セクションからサービス名配列を抽出
- エラーハンドリング: project.toml読み込みエラー時は空配列を返す

service: flow-auditor
section: operation
name: loadServices.server
category: data-io"
```

---

## 🧠 Phase 2.2: 純粋ロジック層 (lib) 生成

### 2.2.1 checkpointIdResolver
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、checkpointIdResolverという名前のlibファイルを作成してください。
- チェックポイントIDから対象オブジェクトを解決
- 入力: checkpointId (string) - 例: 'design-flow-operation-requirements'
- 出力: { flow: string, section: string, category: string } | null
- 処理:
  1. checkpointId.split('-')でパース
  2. {flow}-{section}-{category}形式を検証（3パート以上であること）
  3. flowDefinitionから対象チェックポイントオブジェクトを取得
- 純粋関数（副作用なし）
- 不正な形式の場合はnullを返す

service: flow-auditor
section: operation
name: checkpointIdResolver
category: lib"
```

### 2.2.2 retryTargetCalculator
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、retryTargetCalculatorという名前のlibファイルを作成してください。
- チェックポイントID以降のアーカイブ対象ファイル計算
- 入力:
  - checkpointId (string) - 例: 'design-flow-operation-requirements'
  - allCheckpoints (OperationCheckpoint[]) - 順序保証あり、exists: boolean付き
- 出力: affectedFiles (string[]) - アーカイブ対象ファイルパス配列
- アルゴリズム:
  1. checkpointIdのインデックスを検索
  2. インデックス以降（自身を含む）をフィルタ
  3. exists: trueのファイルのみ抽出
  4. filePath配列として返す
- 純粋関数（副作用なし）
- checkpointIdが見つからない場合は空配列を返す

service: flow-auditor
section: operation
name: retryTargetCalculator
category: lib"
```

### 2.2.3 timestampGenerator
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、timestampGeneratorという名前のlibファイルを作成してください。
- アーカイブタイムスタンプ生成（YYYYMMDD_HHMMSS形式）
- 入力: date (Date) - デフォルト: new Date()
- 出力: timestamp (string) - 例: '20251009_164712'
- フォーマット: YYYYMMDD_HHMMSS
- 純粋関数（副作用なし）
- ゼロパディング: 月・日・時・分・秒は2桁（例: 01, 09）

service: flow-auditor
section: operation
name: timestampGenerator
category: lib"
```

### 2.2.4 checkpointStatus (共通ロジック)
```bash
@GeneratorOperator "flow-auditorサービスの共通ロジックとして、checkpointStatusという名前のlibファイルを確認してください。
- 既存ファイルの場合は何もしない（全セクション共有）
- ステータス判定（pending/completed、exists: true/false）
- 入力: checkpoint ({ exists: boolean })
- 出力: status ('pending' | 'completed')
- ロジック: exists === true → 'completed', exists === false → 'pending'
- 純粋関数（副作用なし）

service: flow-auditor
section: (共通)
name: checkpointStatus
category: lib
action: verify-exists"
```

---

## 🎨 Phase 2.3: UI層 (components) 生成

### 2.3.1 OperationSection
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、OperationSectionという名前のUIコンポーネントを作成してください。
- セクション全体の統合コンテナ
- Props:
  - loaderData: { designFlowStatus: OperationCheckpoint[], implementationFlowStatus: OperationCheckpoint[], lastUpdated: Date, services: string[] }
  - selectedCheckpointId: string | null（URL SearchParamsから取得）
- 内部状態:
  - isRefreshing: boolean（更新中フラグ）
  - isRetryModalOpen: boolean（モーダル表示フラグ）
  - selectedService: string（選択中サービス名）
- 子コンポーネント:
  - ServiceSelector
  - RefreshButton
  - RetryButton
  - LastUpdatedLabel
  - RetryModal（条件付き表示）
- レイアウト: 横並び（flex）、左から順に配置
- デザイントークン: .flow-auditor-operation-section（globals.css）

service: flow-auditor
section: operation
name: OperationSection
category: ui
ui-type: component"
```

### 2.3.2 ServiceSelector
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、ServiceSelectorという名前のUIコンポーネントを作成してください。
- サービス選択プルダウン（project.tomlから動的取得）
- Props:
  - services: string[]（project.tomlから取得したサービス名配列）
  - selectedService: string（現在選択中のサービス）
  - onChange: (serviceName: string) => void（選択変更時コールバック）
- 機能:
  - サービス選択変更時、design-flow/implementation-flowセクションを更新
  - 選択中のサービスをハイライト表示
- アクセシビリティ: label for属性、aria-label
- デザイントークン: .flow-auditor-service-selector（globals.css）

service: flow-auditor
section: operation
name: ServiceSelector
category: ui
ui-type: component"
```

### 2.3.3 RefreshButton
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、RefreshButtonという名前のUIコンポーネントを作成してください。
- 更新ボタン（全チェックポイント再確認）
- Props:
  - isLoading: boolean（ローディング中フラグ）
  - onRefresh: () => void（クリック時コールバック）
- 機能:
  - クリック時、action送信（{ _action: 'refresh' }）
  - ローディング状態表示（スピナーアイコン + 「更新中...」テキスト）
  - ローディング中はボタン無効化
- アクセシビリティ: aria-busy、aria-label
- デザイントークン: .flow-auditor-refresh-button（globals.css）

service: flow-auditor
section: operation
name: RefreshButton
category: ui
ui-type: component"
```

### 2.3.4 RetryButton
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、RetryButtonという名前のUIコンポーネントを作成してください。
- リトライボタン（selectedCheckpointId連携）
- Props:
  - selectedCheckpointId: string | null（選択中のチェックポイントID）
  - isDisabled: boolean（selectedCheckpointId === null時true）
  - onOpenModal: () => void（モーダル表示トリガー）
- 機能:
  - クリック時、RetryModalを表示
  - selectedCheckpointId未選択時は無効化（グレーアウト + disabled属性）
  - ツールチップ: 無効時「チェックポイントを選択してください」
- アクセシビリティ: aria-disabled、aria-label、title属性
- デザイントークン: .flow-auditor-retry-button（globals.css）

service: flow-auditor
section: operation
name: RetryButton
category: ui
ui-type: component"
```

### 2.3.5 LastUpdatedLabel
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、LastUpdatedLabelという名前のUIコンポーネントを作成してください。
- 最終更新日時表示
- Props:
  - lastUpdated: Date（最終更新日時）
- 機能:
  - HH:MM形式で表示（例: 16:47）
  - 1分以内の場合は「たった今」と表示
  - 相対時間表示（1分前、5分前など）も対応
- フォーマット: toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
- デザイントークン: .flow-auditor-last-updated-label（globals.css）

service: flow-auditor
section: operation
name: LastUpdatedLabel
category: ui
ui-type: component"
```

### 2.3.6 RetryModal
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、RetryModalという名前のUIコンポーネントを作成してください。
- リトライ確認モーダル（affected files表示）
- Props:
  - isOpen: boolean（モーダル表示フラグ）
  - selectedCheckpointId: string（選択中のチェックポイントID）
  - checkpointLabel: string（例: 'func-spec.md (operation)'）
  - affectedFiles: string[]（retryTargetCalculatorで計算された影響ファイル）
  - onConfirm: (checkpointId: string) => void（実行ボタンクリック時）
  - onCancel: () => void（キャンセルボタンクリック時）
- 表示内容:
  - タイトル: 「{checkpointLabel}からリトライ」
  - 警告メッセージ: 「以下のファイルがアーカイブされます」
  - affected files一覧（スクロール可能リスト、最大高さ300px）
  - ボタン: [キャンセル] [実行]
- 機能:
  - 実行ボタンクリックでaction送信（{ _action: 'retry', checkpointId }）
  - キャンセルボタンまたは背景クリックでモーダル閉じる
  - ESCキーで閉じる
- アクセシビリティ: role="dialog", aria-modal="true", focus trap
- デザイントークン: .flow-auditor-retry-modal（globals.css）

service: flow-auditor
section: operation
name: RetryModal
category: ui
ui-type: component"
```

---

## 🎨 Phase 2.4: Route更新

### 2.4.1 _index.tsx更新
```bash
@GeneratorOperator "flow-auditorサービスのメインルート（_index.tsx）を更新してください。
- operationセクションのloaderとactionを追加

【loader更新内容】:
- loadServices.server.tsで全サービス名取得
- checkAllCheckpoints.server.tsで全チェックポイント状態確認
- design-flow、implementation-flowの両方のステータスを返す
- lastUpdated: new Date()を追加

【action追加内容】:
1. refreshアクション:
   - _action: 'refresh'を受け取る
   - checkAllCheckpoints.server.tsで全チェックポイント再確認
   - 処理後、loaderDataを再取得してUIを更新

2. retryアクション:
   - _action: 'retry', checkpointId: stringを受け取る
   - checkpointIdResolver.tsでチェックポイント解決
   - retryTargetCalculator.tsで影響ファイル計算
   - timestampGenerator.tsでタイムスタンプ生成
   - archiveFiles.server.tsでファイルアーカイブ実行
   - 成功時: リダイレクト先でトースト表示「{n}個のファイルをアーカイブしました」
   - 失敗時: エラーメッセージ返却

【エラーハンドリング】:
- archiveFiles.server.tsのロールバック失敗時は詳細エラーを返す
- 不正なcheckpointId時は400 Bad Requestを返す

service: flow-auditor
section: (ルート全体)
name: _index
category: ui
ui-type: route
action: update"
```

---

## 📝 Phase 2.5: 型定義

### 2.5.1 types.ts
```bash
@GeneratorOperator "flow-auditorサービスのoperationセクションに、typesという名前の型定義ファイルを作成してください。
- operation関連型定義

【定義する型】:
1. RefreshInput:
   - _action: 'refresh'

2. RetryInput:
   - _action: 'retry'
   - checkpointId: string

3. OperationOutput:
   - designFlowStatus: OperationCheckpoint[]
   - implementationFlowStatus: OperationCheckpoint[]
   - lastUpdated: Date
   - services: string[]

4. OperationCheckpoint:
   - id: string（チェックポイントID）
   - label: string（表示名、例: 'func-spec.md (operation)'）
   - filePath: string（ファイルの絶対パス）
   - exists: boolean（ファイル存在フラグ）
   - category: string（例: 'requirements', 'spec', 'uiux-spec'）

service: flow-auditor
section: operation
name: types
category: lib"
```

---

## 🎨 Phase 2.6: スタイル更新

### 2.6.1 globals.css更新
```bash
@GeneratorOperator "グローバルCSSファイル（globals.css）を更新してください。
- operationセクション専用のCSSクラスを追加

【追加するクラス】:
1. .flow-auditor-operation-section:
   - display: flex
   - gap: var(--spacing-md)
   - align-items: center
   - padding: var(--spacing-md)
   - background: var(--color-surface)
   - border-radius: var(--border-radius-md)

2. .flow-auditor-service-selector:
   - min-width: 200px
   - padding: var(--spacing-sm)
   - border: 1px solid var(--color-border)
   - border-radius: var(--border-radius-sm)

3. .flow-auditor-refresh-button:
   - padding: var(--spacing-sm) var(--spacing-md)
   - background: var(--color-primary)
   - color: var(--color-on-primary)
   - border: none
   - border-radius: var(--border-radius-sm)
   - cursor: pointer
   - transition: background 0.2s
   - &:hover: background: var(--color-primary-hover)
   - &:disabled: opacity: 0.5, cursor: not-allowed

4. .flow-auditor-retry-button:
   - padding: var(--spacing-sm) var(--spacing-md)
   - background: var(--color-warning)
   - color: var(--color-on-warning)
   - border: none
   - border-radius: var(--border-radius-sm)
   - cursor: pointer
   - transition: background 0.2s
   - &:hover: background: var(--color-warning-hover)
   - &:disabled: opacity: 0.5, cursor: not-allowed

5. .flow-auditor-last-updated-label:
   - font-size: var(--font-size-sm)
   - color: var(--color-text-secondary)

6. .flow-auditor-retry-modal:
   - position: fixed
   - top: 50%
   - left: 50%
   - transform: translate(-50%, -50%)
   - background: var(--color-surface)
   - border-radius: var(--border-radius-lg)
   - padding: var(--spacing-lg)
   - box-shadow: var(--shadow-lg)
   - max-width: 600px
   - width: 90%
   - max-height: 80vh
   - overflow-y: auto

注意: デザイントークン（CSS変数）が未定義の場合は、既存のglobals.cssで定義されているトークンを使用してください。

service: flow-auditor
section: (グローバル)
name: globals
category: style
action: update"
```

---

## ✅ 生成順序とチェックリスト

### Phase 1: E2E First
- [ ] 1.1 flow-auditor.e2e.test.ts（更新）
- [ ] 1.2 operation-section.e2e.test.ts（新規）

### Phase 2.1: 副作用層（data-io）
- [ ] 2.1.1 checkFileExistence.server.ts + test
- [ ] 2.1.2 checkAllCheckpoints.server.ts + test
- [ ] 2.1.3 archiveFiles.server.ts + test
- [ ] 2.1.4 loadServices.server.ts + test

### Phase 2.2: 純粋ロジック層（lib）
- [ ] 2.2.1 checkpointIdResolver.ts + test
- [ ] 2.2.2 retryTargetCalculator.ts + test
- [ ] 2.2.3 timestampGenerator.ts + test
- [ ] 2.2.4 checkpointStatus.ts（共通、確認のみ）

### Phase 2.3: UI層（components）
- [ ] 2.3.1 OperationSection.tsx + test
- [ ] 2.3.2 ServiceSelector.tsx + test
- [ ] 2.3.3 RefreshButton.tsx + test
- [ ] 2.3.4 RetryButton.tsx + test
- [ ] 2.3.5 LastUpdatedLabel.tsx + test
- [ ] 2.3.6 RetryModal.tsx + test

### Phase 2.4: Route更新
- [ ] 2.4.1 _index.tsx（更新）

### Phase 2.5: 型定義
- [ ] 2.5.1 types.ts

### Phase 2.6: スタイル更新
- [ ] 2.6.1 globals.css（更新）

---

## 📊 ファイル数集計

| Phase | 新規ファイル | 更新ファイル | テストファイル | 合計 |
|:---|:---:|:---:|:---:|:---:|
| Phase 1（E2E） | 1 | 1 | - | 2 |
| Phase 2.1（data-io） | 4 | - | 4 | 8 |
| Phase 2.2（lib） | 3 | - | 3 | 6 |
| Phase 2.3（UI） | 6 | - | 6 | 12 |
| Phase 2.4（Route） | - | 1 | - | 1 |
| Phase 2.5（型定義） | 1 | - | - | 1 |
| Phase 2.6（スタイル） | - | 1 | - | 1 |
| **合計** | **15** | **3** | **13** | **31** |

---

## 🎯 重要な実装ポイント

### アーキテクチャ遵守
- UI層: インタラクションとビューのみ（副作用禁止）
- lib層: 純粋関数のみ（副作用禁止）
- data-io層: 副作用（ファイルI/O、API呼び出し）のみ

### パフォーマンス目標
- checkAllCheckpoints.server.ts: 500ms以内（Promise.all並列処理）
- checkFileExistence.server.ts: 100ms以内（単一ファイル確認）
- archiveFiles.server.ts: ロールバック機能付き（原子性保証）

### エラーハンドリング
- 各data-io関数は詳細なエラーメッセージを返す
- archiveFiles.server.tsはロールバック機能を実装
- 不正な入力時は適切なHTTPステータスコードを返す

### テスト戦略
- E2E First: 失敗テストから開始
- Double-Loop TDD: 外→内、テスト→実装を交互に
- 各層の責務に応じたテストを記述
