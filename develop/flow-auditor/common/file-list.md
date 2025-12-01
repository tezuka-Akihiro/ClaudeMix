# file-list.md - Common Components

## 目的
commonセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

###1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| common.spec.ts | tests/e2e/section/flow-auditor/common.spec.ts | commonセクション単独のE2Eテスト |

---

## 2. UI層（Phase 2）

### 2.0 Routes (flow-auditor全体のエントリーポイント)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| flow-auditor._index.tsx | app/routes/flow-auditor._index.tsx | flow-auditorのルートファイル（フラットルート形式） |

**注意**: ルートファイルに対してはユニットテストファイル（`.test.tsx`）を作成しません。ルートはE2Eテストでカバーします。

### 2.1 Components (common固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Header.tsx | app/components/flow-auditor/common/Header.tsx | ヘッダーコンテナ |
| Header.test.tsx | app/components/flow-auditor/common/Header.test.tsx | ユニットテスト |
| Footer.tsx | app/components/flow-auditor/common/Footer.tsx | フッターコンテナ |
| Footer.test.tsx | app/components/flow-auditor/common/Footer.test.tsx | ユニットテスト |
| SectionSelector.tsx | app/components/flow-auditor/common/SectionSelector.tsx | セクションセレクタ |
| SectionSelector.test.tsx | app/components/flow-auditor/common/SectionSelector.test.tsx | ユニットテスト |
| ServiceSelector.tsx | app/components/flow-auditor/common/ServiceSelector.tsx | サービスセレクタ |
| ServiceSelector.test.tsx | app/components/flow-auditor/common/ServiceSelector.test.tsx | ユニットテスト |
| LastUpdatedLabel.tsx | app/components/flow-auditor/common/LastUpdatedLabel.tsx | 最終更新ラベル |
| LastUpdatedLabel.test.tsx | app/components/flow-auditor/common/LastUpdatedLabel.test.tsx | ユニットテスト |
| CardItem.tsx | app/components/flow-auditor/common/CardItem.tsx | カード型アイテムの基底コンポーネント(design-flow/implementation-flowで共有) |
| CardItem.test.tsx | app/components/flow-auditor/common/CardItem.test.tsx | ユニットテスト |
| RefreshButton.tsx | app/components/flow-auditor/common/RefreshButton.tsx | リフレッシュボタン |
| RefreshButton.test.tsx | app/components/flow-auditor/common/RefreshButton.test.tsx | ユニットテスト |
| Toast.tsx | app/components/flow-auditor/common/Toast.tsx | トースト通知コンポーネント |
| Toast.test.tsx | app/components/flow-auditor/common/Toast.test.tsx | ユニットテスト |
| RetryButton.tsx | app/components/flow-auditor/common/RetryButton.tsx | リトライボタン |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| sectionListBuilder.ts | app/lib/flow-auditor/common/sectionListBuilder.ts | セクション一覧ビルダー |
| sectionListBuilder.test.ts | app/lib/flow-auditor/common/sectionListBuilder.test.ts | ユニットテスト |
| timestampFormatter.ts | app/lib/flow-auditor/common/timestampFormatter.ts | タイムスタンプフォーマッター |
| timestampFormatter.test.ts | app/lib/flow-auditor/common/timestampFormatter.test.ts | ユニットテスト |
| retryTargetCalculator.ts | app/lib/flow-auditor/common/retryTargetCalculator.ts | リトライ対象計算ロジック |
| retryTargetCalculator.test.ts | app/lib/flow-auditor/common/retryTargetCalculator.test.ts | ユニットテスト |
| copyToClipboard.ts | app/lib/flow-auditor/common/copyToClipboard.ts | クリップボードコピーユーティリティ |
| copyToClipboard.test.ts | app/lib/flow-auditor/common/copyToClipboard.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| loadServiceList.server.ts | app/data-io/flow-auditor/common/loadServiceList.server.ts | サービス一覧読み込み |
| loadServiceList.server.test.ts | app/data-io/flow-auditor/common/loadServiceList.server.test.ts | ユニットテスト |
| loadSectionList.server.ts | app/data-io/flow-auditor/common/loadSectionList.server.ts | セクション一覧読み込み |
| loadSectionList.server.test.ts | app/data-io/flow-auditor/common/loadSectionList.server.test.ts | ユニットテスト |
| loadFlowAuditorConfig.server.ts | app/data-io/flow-auditor/common/loadFlowAuditorConfig.server.ts | flow-auditor設定読み込み |
| executeRetry.server.ts | app/data-io/flow-auditor/common/executeRetry.server.ts | リトライ実行 |
| executeRetry.server.test.ts | app/data-io/flow-auditor/common/executeRetry.server.test.ts | ユニットテスト |