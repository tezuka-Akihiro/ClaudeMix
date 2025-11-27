# file-list.md - implementation-flow Section

## 目的
implementation-flowセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| implementation-flow.spec.ts | tests/e2e/section/flow-auditor/implementation-flow.spec.ts | implementation-flowセクション単独のE2Eテスト |

---

## 2. UI層（Phase 2.3）

### 2.1 Components (implementation-flow固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| ImplementationFlowSection.tsx | app/components/flow-auditor/implementation-flow/ImplementationFlowSection.tsx | implementation-flowセクション全体のコンテナ |
| ImplementationFlowSection.test.tsx | app/components/flow-auditor/implementation-flow/ImplementationFlowSection.test.tsx | ユニットテスト |
| LayerGroup.tsx | app/components/flow-auditor/implementation-flow/LayerGroup.tsx | 層別グループのコンテナ（app/lib、app/data-io、app/components） |
| LayerGroup.test.tsx | app/components/flow-auditor/implementation-flow/LayerGroup.test.tsx | ユニットテスト |
| GroupHeader.tsx | app/components/flow-auditor/implementation-flow/GroupHeader.tsx | グループヘッダー（層名表示） |
| GroupHeader.test.tsx | app/components/flow-auditor/implementation-flow/GroupHeader.test.tsx | ユニットテスト |

### 2.2 Shared Components (flow-auditor内共有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| implementationFlowTypes.ts | app/lib/flow-auditor/implementation-flow/implementationFlowTypes.ts | 型定義（ImplementationFlowOutput, LayerGroup, FileDefinition, TestScriptPair） |
| implementationFlowDefinition.ts | app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts | file-list.mdを解析し、実装すべきファイル定義を取得する純粋関数 |
| implementationFlowDefinition.test.ts | app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts | ユニットテスト |
| implementationFlowBuilder.ts | app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.ts | ファイル定義+存在確認結果からUI表示用データを構築する純粋関数 |
| implementationFlowBuilder.test.ts | app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.test.ts | ユニットテスト |
| filePairMatcher.ts | app/lib/flow-auditor/implementation-flow/filePairMatcher.ts | ファイル選択時にペアを自動選択する純粋関数（Surgical Retry用） |
| filePairMatcher.test.ts | app/lib/flow-auditor/implementation-flow/filePairMatcher.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| readFileListMd.server.ts | app/data-io/flow-auditor/implementation-flow/readFileListMd.server.ts | file-list.mdを読み込んでマークダウンテキストを返す（fs.readFileSync） |
| readFileListMd.server.test.ts | app/data-io/flow-auditor/implementation-flow/readFileListMd.server.test.ts | ユニットテスト |
| checkImplementationFiles.server.ts | app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.ts | 指定されたファイルパスリストの存在確認（fs.existsSync）|
| checkImplementationFiles.server.test.ts | app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.test.ts | ユニットテスト |
| loadLayerDisplayNames.server.ts | app/data-io/flow-auditor/implementation-flow/loadLayerDisplayNames.server.ts | 層の表示名読み込み |
| executeRetry.server.ts | app/data-io/flow-auditor/implementation-flow/executeRetry.server.ts | 指定されたファイルパス配列を _archive/{timestamp}/ に移動（Surgical Retry用） |
| executeRetry.server.test.ts | app/data-io/flow-auditor/implementation-flow/executeRetry.server.test.ts | ユニットテスト |