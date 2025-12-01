# file-list.md - Design Flow Section

## 目的
design-flowセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| design-flow.spec.ts | tests/e2e/section/flow-auditor/design-flow.spec.ts | design-flowセクション単独のE2Eテスト |

---

## 2. UI層（Phase 2.3）

### 2.1 Components (design-flow固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| DesignFlowSection.tsx | app/components/flow-auditor/design-flow/DesignFlowSection.tsx | design-flowセクション全体のコンテナ、selectedCheckpointId管理 |
| DesignFlowSection.test.tsx | app/components/flow-auditor/design-flow/DesignFlowSection.test.tsx | ユニットテスト |
| CommonFlowContainer.tsx | app/components/flow-auditor/design-flow/CommonFlowContainer.tsx | 共通チェックポイント縦1列表示 |
| CommonFlowContainer.test.tsx | app/components/flow-auditor/design-flow/CommonFlowContainer.test.tsx | ユニットテスト |
| CommonSectionContainer.tsx | app/components/flow-auditor/design-flow/CommonSectionContainer.tsx | commonセクション専用チェックポイント縦1列表示 |
| CommonSectionContainer.test.tsx | app/components/flow-auditor/design-flow/CommonSectionContainer.test.tsx | ユニットテスト |
| BranchedFlowContainer.tsx | app/components/flow-auditor/design-flow/BranchedFlowContainer.tsx | セクション別チェックポイント動的列数表示 |
| BranchedFlowContainer.test.tsx | app/components/flow-auditor/design-flow/BranchedFlowContainer.test.tsx | ユニットテスト |
| Branch.tsx | app/components/flow-auditor/design-flow/Branch.tsx | 単一セクションのチェックポイント群 |
| Branch.test.tsx | app/components/flow-auditor/design-flow/Branch.test.tsx | ユニットテスト |

### 2.2 Shared Components (flow-auditor内共有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

### 3.1 design-flow固有ロジック
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| designFlowDefinition.ts | app/lib/flow-auditor/design-flow/designFlowDefinition.ts | チェックポイント定義（共通/セクション別） |
| designFlowDefinition.test.ts | app/lib/flow-auditor/design-flow/designFlowDefinition.test.ts | ユニットテスト |
| flowGroupBuilder.ts | app/lib/flow-auditor/design-flow/flowGroupBuilder.ts | 共通/セクション別グループ化、セクション数検証（1-6） |
| flowGroupBuilder.test.ts | app/lib/flow-auditor/design-flow/flowGroupBuilder.test.ts | ユニットテスト |
| retryCommandBuilder.ts | app/lib/flow-auditor/design-flow/retryCommandBuilder.ts | チェックポイントIDからリトライコマンド生成 |
| retryCommandBuilder.test.ts | app/lib/flow-auditor/design-flow/retryCommandBuilder.test.ts | ユニットテスト |
| checkpointStatus.ts | app/lib/flow-auditor/design-flow/checkpointStatus.ts | ステータス判定（pending/completed/selected） |
| checkpointStatus.test.ts | app/lib/flow-auditor/design-flow/checkpointStatus.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

### 4.1 design-flow専用
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| checkDesignFiles.ts | app/data-io/flow-auditor/design-flow/checkDesignFiles.ts | 設計ドキュメント存在確認（fs.existsSync） |
| checkDesignFiles.test.ts | app/data-io/flow-auditor/design-flow/checkDesignFiles.test.ts | ユニットテスト |
| loadProjectSections.server.ts | app/data-io/flow-auditor/design-flow/loadProjectSections.server.ts | project.tomlからセクション定義取得 |
| loadProjectSections.server.test.ts | app/data-io/flow-auditor/design-flow/loadProjectSections.server.test.ts | ユニットテスト |
| loadCheckpointDefinitions.server.ts | app/data-io/flow-auditor/design-flow/loadCheckpointDefinitions.server.ts | チェックポイント定義読み込み |