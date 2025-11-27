# file-list.md - Operation Section

## 目的
operationセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 画面レベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| flow-auditor.e2e.test.ts | tests/e2e/flow-auditor.e2e.test.ts | flow-auditor画面全体のE2Eテスト（全セクション共通、既存更新） |

### 1.2 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| operation-section.e2e.test.ts | tests/e2e/flow-auditor/operation-section.e2e.test.ts | operationセクション単独のE2Eテスト（更新/リトライ機能） |

---

## 2. UI層（Phase 2）

### 2.1 Route
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| _index.tsx | app/routes/_index.tsx | メインルート（既存更新: operation用action追加、loader統合） |

### 2.2 Components（operation専用）

#### コアコンポーネント
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| OperationSection.tsx | app/components/flow-auditor/operation/OperationSection.tsx | operationセクション全体のコンテナ、loaderData/selectedCheckpointId統合 |
| OperationSection.test.tsx | app/components/flow-auditor/operation/OperationSection.test.tsx | ユニットテスト |
| ServiceSelector.tsx | app/components/flow-auditor/operation/ServiceSelector.tsx | サービス選択プルダウン（project.tomlから動的取得） |
| ServiceSelector.test.tsx | app/components/flow-auditor/operation/ServiceSelector.test.tsx | ユニットテスト |
| RefreshButton.tsx | app/components/flow-auditor/operation/RefreshButton.tsx | 更新ボタン（全チェックポイント再確認） |
| RefreshButton.test.tsx | app/components/flow-auditor/operation/RefreshButton.test.tsx | ユニットテスト |
| RetryButton.tsx | app/components/flow-auditor/operation/RetryButton.tsx | リトライボタン（selectedCheckpointId連携） |
| RetryButton.test.tsx | app/components/flow-auditor/operation/RetryButton.test.tsx | ユニットテスト |
| LastUpdatedLabel.tsx | app/components/flow-auditor/operation/LastUpdatedLabel.tsx | 最終更新日時表示 |
| LastUpdatedLabel.test.tsx | app/components/flow-auditor/operation/LastUpdatedLabel.test.tsx | ユニットテスト |
| RetryModal.tsx | app/components/flow-auditor/operation/RetryModal.tsx | リトライ確認モーダル（affected files表示） |
| RetryModal.test.tsx | app/components/flow-auditor/operation/RetryModal.test.tsx | ユニットテスト |

---

## 3. 純粋ロジック層（lib層、Phase 2）

### 3.1 operation固有ロジック
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| checkpointIdResolver.ts | app/lib/flow-auditor/operation/checkpointIdResolver.ts | チェックポイントIDから対象オブジェクトを解決 |
| checkpointIdResolver.test.ts | app/lib/flow-auditor/operation/checkpointIdResolver.test.ts | ユニットテスト |
| retryTargetCalculator.ts | app/lib/flow-auditor/operation/retryTargetCalculator.ts | チェックポイントID以降のアーカイブ対象ファイル計算 |
| retryTargetCalculator.test.ts | app/lib/flow-auditor/operation/retryTargetCalculator.test.ts | ユニットテスト |
| timestampGenerator.ts | app/lib/flow-auditor/operation/timestampGenerator.ts | アーカイブタイムスタンプ生成（YYYYMMDD_HHMMSS形式） |
| timestampGenerator.test.ts | app/lib/flow-auditor/operation/timestampGenerator.test.ts | ユニットテスト |

### 3.2 共通ロジック（全セクション共有）
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| checkpointStatus.ts | app/lib/flow-auditor/checkpointStatus.ts | ステータス判定（pending/completed、exists: true/false） |
| checkpointStatus.test.ts | app/lib/flow-auditor/checkpointStatus.test.ts | ユニットテスト（既存共有） |

---

## 4. 副作用層（data-io層、Phase 2）

### 4.1 operation専用
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| checkFileExistence.server.ts | app/data-io/flow-auditor/operation/checkFileExistence.server.ts | 単一ファイル存在確認（fs.existsSync） |
| checkFileExistence.server.test.ts | app/data-io/flow-auditor/operation/checkFileExistence.server.test.ts | ユニットテスト |
| checkAllCheckpoints.server.ts | app/data-io/flow-auditor/operation/checkAllCheckpoints.server.ts | 全チェックポイント存在確認（並列処理、Promise.all） |
| checkAllCheckpoints.server.test.ts | app/data-io/flow-auditor/operation/checkAllCheckpoints.server.test.ts | ユニットテスト |
| archiveFiles.server.ts | app/data-io/flow-auditor/operation/archiveFiles.server.ts | ファイルアーカイブ（fs.rename、develop/archive/{timestamp}/へ移動） |
| archiveFiles.server.test.ts | app/data-io/flow-auditor/operation/archiveFiles.server.test.ts | ユニットテスト |
| loadServices.server.ts | app/data-io/flow-auditor/operation/loadServices.server.ts | project.tomlから全サービス名取得 |
| loadServices.server.test.ts | app/data-io/flow-auditor/operation/loadServices.server.test.ts | ユニットテスト |

---

## 5. 型定義

### 5.1 operation専用型
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| types.ts | app/lib/flow-auditor/operation/types.ts | operation関連型定義（RefreshInput, RetryInput, OperationOutput, OperationCheckpoint） |

---

## 6. スタイル

### グローバルCSS（更新）
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| globals.css | app/styles/globals.css | `.flow-auditor-operation-section`, `.flow-auditor-refresh-button`, `.flow-auditor-retry-button`, `.flow-auditor-retry-modal` |

---

## ファイル数集計

| 層 | 実装ファイル | テストファイル | 合計 |
|:---|:---:|:---:|:---:|
| E2E | 2（1既存更新、1新規） | - | 2 |
| UI層（Route） | 1（既存更新） | - | 1 |
| UI層（Components） | 6 | 6 | 12 |
| lib層（operation固有） | 3 | 3 | 6 |
| lib層（共通） | 1（共通） | 1（共通） | 2（共通） |
| data-io層（operation固有） | 4 | 4 | 8 |
| 型定義 | 1 | - | 1 |
| スタイル | 1（既存更新） | - | 1 |
| **合計** | **19** | **14** | **33** |

---

## 補足

### コンポーネント責務

#### OperationSection.tsx
- **目的**: セクション全体の統合コンテナ
- **Props**:
  - `loaderData: { designFlowStatus, implementationFlowStatus, lastUpdated, services }`
  - `selectedCheckpointId: string | null`（URL SearchParamsから取得）
- **状態管理**:
  - `isRefreshing: boolean`（更新中フラグ）
  - `isRetryModalOpen: boolean`（モーダル表示フラグ）
  - `selectedService: string`（選択中サービス名）

#### ServiceSelector.tsx
- **Props**:
  - `services: string[]`（project.tomlから取得）
  - `selectedService: string`
  - `onChange: (serviceName: string) => void`
- **機能**: サービス選択プルダウン、選択変更時にdesign-flow/implementation-flowセクションを更新

#### RefreshButton.tsx
- **Props**:
  - `isLoading: boolean`
  - `onRefresh: () => void`
- **機能**: action送信（`{ _action: 'refresh' }`）、ローディング状態表示

#### RetryButton.tsx
- **Props**:
  - `selectedCheckpointId: string | null`
  - `isDisabled: boolean`（selectedCheckpointId === null時）
  - `onOpenModal: () => void`
- **機能**: モーダル表示トリガー、selectedCheckpointId未選択時は無効化

#### LastUpdatedLabel.tsx
- **Props**:
  - `lastUpdated: Date`
- **機能**: HH:MM形式で表示、1分以内は「たった今」

#### RetryModal.tsx
- **Props**:
  - `isOpen: boolean`
  - `selectedCheckpointId: string`
  - `checkpointLabel: string`（例: "func-spec.md (operation)"）
  - `affectedFiles: string[]`（retryTargetCalculatorで計算）
  - `onConfirm: (checkpointId: string) => void`
  - `onCancel: () => void`
- **機能**: affected files一覧表示、実行ボタンでaction送信（`{ _action: 'retry', checkpointId }`）

### lib層アルゴリズム

#### checkpointIdResolver.ts
- **入力**: `checkpointId: string`（例: "design-flow-operation-requirements"）
- **出力**: `{ flow: string, section: string, category: string }`
- **処理**:
  1. `checkpointId.split('-')`でパース
  2. `{flow}-{section}-{category}`形式を検証
  3. flowDefinitionから対象チェックポイントオブジェクトを取得

#### retryTargetCalculator.ts
- **入力**:
  - `checkpointId: string`
  - `allCheckpoints: OperationCheckpoint[]`（順序保証あり）
- **出力**: `affectedFiles: string[]`
- **アルゴリズム**:
  1. checkpointIdのインデックスを検索
  2. インデックス以降（自身を含む）をフィルタ
  3. `exists: true`のファイルのみ抽出
  4. `filePath`配列として返す

#### timestampGenerator.ts
- **入力**: `date: Date`（デフォルト: new Date()）
- **出力**: `timestamp: string`（例: "20251009_164712"）
- **フォーマット**: YYYYMMDD_HHMMSS

### data-io層仕様

#### checkFileExistence.server.ts
- **入力**: `filePath: string`
- **出力**: `exists: boolean`
- **処理**: `fs.existsSync(filePath)`

#### checkAllCheckpoints.server.ts
- **入力**: `checkpoints: { id: string, path: string }[]`
- **出力**: `results: OperationCheckpoint[]`
- **処理**:
  1. `Promise.all`で並列存在確認
  2. 各チェックポイントに`exists: boolean`を付与

#### archiveFiles.server.ts
- **入力**:
  - `filePaths: string[]`
  - `archiveDir: string`（例: "develop/archive/20251009_164712"）
- **出力**: `{ success: boolean, archivedFiles: string[], errors: string[] }`
- **処理**:
  1. アーカイブディレクトリ作成（`fs.mkdirSync`、recursive: true）
  2. 各ファイルを`fs.renameSync`で移動
  3. エラー時はロールバック（全ファイルを元の位置に復元）

#### loadServices.server.ts
- **入力**: なし
- **出力**: `services: string[]`
- **処理**:
  1. project.tomlを読み込み（`fs.readFileSync`）
  2. TOMLパース
  3. `[services]`セクションからサービス名配列を抽出

### 設計コンセプト
- **司令塔セクション**: 全フローの状態更新・制御を担う
- **selectedCheckpointId連携**: design-flowセクションからURL SearchParams経由で取得
- **並列処理**: checkAllCheckpoints.server.tsでPromise.allによる高速化（目標500ms以内）
- **アーカイブ原子性**: archiveFiles.server.tsでエラー時全ロールバック

### TDD原則
- E2E First → Double-Loop TDD（外→内、テスト→実装を交互に）
- 各層の責務厳守（UI層: インタラクション、lib層: 純粋関数、data-io層: 副作用）
