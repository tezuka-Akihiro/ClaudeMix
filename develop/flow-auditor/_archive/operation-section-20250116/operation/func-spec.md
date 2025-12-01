# Operation - 機能設計書

## 📋 機能概要

### 機能名
**Operation (オペレーション)**

### 所属サービス
**flow-auditor** の **operation** セクションに配置

### 機能の目的・価値
- **解決する課題**: 開発フローの進捗状況を手動で更新したい、不具合修正・要件変更時に特定のフェーズへ戻りたい
- **提供する価値**: [更新][リトライ]ボタンによる、フロー全体の制御と状態更新
- **ビジネス効果**: 開発者が開発フローの進捗を能動的にコントロールできる

### 実装優先度
**HIGH** - Flow Auditorのコア機能であり、他の2セクション（design-flow, implementation-flow）の状態更新を担う

## 🎯 機能要件

### 基本機能
1. **更新ボタン**: 全チェックポイントのファイル存在を再確認し、最新の進捗状態を表示
2. **リトライボタン**: 対象ステップ以降のファイルをアーカイブに移動し、フローを「未完了」状態に戻す
3. **状態表示**: 更新後のフロー状態（完了/未完了）を即座に反映

### 開発戦略: 段階的強化 (Progressive Enhancement)
1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ
```typescript
// 更新アクション
interface RefreshInput {
  _action: 'refresh' // アクション種別
}

// リトライアクション
interface RetryInput {
  _action: 'retry'
  checkpointId: string // リトライ開始チェックポイントID（形式: {flow}-{section}-{category}、例: "design-flow-operation-requirements"）
}
```

### 出力データ
```typescript
interface OperationOutput {
  designFlowStatus: OperationCheckpoint[] // 設計フローの各チェックポイント状態
  implementationFlowStatus: OperationCheckpoint[] // 実装フローの各チェックポイント状態
  lastUpdated: Date // 最終更新日時
}

// オペレーションセクション専用のチェックポイント型（存在確認のみ、状態管理しない）
interface OperationCheckpoint {
  name: string // チェックポイント名（例: "func-spec.md"）
  path: string // ファイルパス
  exists: boolean // 存在するか（true: 完了, false: 未完了）
}
```

### 🎨 UI層要件（app/routes, app/components）
```
1. [ユーザー入力受付・表示制御]
   - [更新]ボタン: クリック時にrefreshアクションを送信
   - [リトライ]ボタン: design-flowセクションで選択中のチェックポイントIDを取得し、確認モーダル表示→retryアクション送信
   - selectedCheckpointId連携: design-flowセクションからURL SearchParams経由で取得
     - 実装方式: `const selectedCheckpointId = new URLSearchParams(window.location.search).get('selectedCheckpoint')`
     - URL形式: `/flow-auditor?selectedCheckpoint=design-flow-operation-requirements`
   - ローディング状態: action実行中はボタンを無効化し、スピナー表示
   - 成功/エラー状態: トースト通知で結果を表示
```

### 🧠 純粋ロジック要件（app/lib）
```
2. [ビジネスロジック・計算処理]
   - flowDefinition.ts: チェックポイント定義（設計・実装フローの各ファイルパス）
   - checkpointStatus.ts: ファイル存在有無からステータス判定（pending/completed）
   - checkpointIdResolver.ts: チェックポイントIDから対象ファイルパスを解決
   - retryTargetCalculator.ts: チェックポイントID以降のアーカイブ対象ファイルを計算
     - アルゴリズム:
       1. checkpointIdを"{flow}-{section}-{category}"形式でパース
       2. flowが"design-flow"の場合:
          - 該当チェックポイント以降の全design-flowファイル
          - + 全implementation-flowファイル（実装は設計に依存するため）
       3. flowが"implementation-flow"の場合（注: 現在未使用、将来拡張用）:
          - 該当チェックポイント以降の全implementation-flowファイルのみ
       4. 各ファイルパスをflowDefinition.tsから取得し、配列で返す
   ※ファイルシステムへのアクセスは行わない（純粋関数）
```

### 🔌 副作用要件（app/data-io）
```
3. [外部システム連携・データ永続化]
   - checkFileExistence.server.ts: fs.existsSyncでファイル存在確認
   - archiveFiles.server.ts: fs.renameでファイルをdevelop/archive/{timestamp}/へ移動
   ※リトライ時: 指定ステップ以降の全ファイルをアーカイブ
```

## 📊 ビジネスルール・制約

### バリデーションルール
- **checkpointId**: design-flowまたはimplementation-flowで定義された有効なIDのみ許可
- **checkpointId形式**: "{flow}-{section}-{category}" (例: "design-flow-operation-requirements")

### 操作制限
- **リトライ実行**: 確認モーダルで「本当に戻しますか？」の警告表示（誤操作防止）
- **アーカイブ容量**: 過去10回分のアーカイブのみ保持（古いものは自動削除）

### データ整合性
- **ファイル移動の原子性**: アーカイブ処理中のエラーは全てロールバック
- **同時実行制御**: 複数ユーザーの同時リトライは排他制御（最初の1件のみ受付）

## 🚀 技術要件

### loader
- **目的**: 現在のフロー状態（全チェックポイントの存在確認結果）を取得する
- **処理**:
  - flowDefinition.tsから設計・実装フローの定義を取得
  - checkFileExistence.server.tsで各ファイルの存在を確認
  - checkpointStatus.tsで状態判定（exists: true/false）
  - コンポーネントに`{ designFlowStatus, implementationFlowStatus, lastUpdated }`を返す

### action
- **目的**: [更新][リトライ]ボタンのクリック処理を実行する
- **処理分岐**:
  - `_action: 'refresh'`:
    - リクエスト: なし（単純な再読み込み）
    - 処理: loaderと同じ存在確認処理を実行
    - レスポンス: 更新後の状態を返す（リダイレクトなし）
  - `_action: 'retry'`:
    - リクエスト: `{ checkpointId }`
    - 処理:
      1. checkpointIdResolver.tsでチェックポイントを解決
      2. retryTargetCalculator.tsでアーカイブ対象ファイルリストを計算
      3. archiveFiles.server.tsで対象ファイルをアーカイブ
    - レスポンス: 成功メッセージ + リダイレクト（現在のページをリロード）

### データベース要件
- **不要**: ファイルシステムのみで完結（DBアクセスなし）

## 🔗 他機能・サービスとの連携

### データ連携
- **送信先**: design-flowセクション - 設計フローの状態更新をトリガー
- **送信先**: implementation-flowセクション - 実装フローの状態更新をトリガー

### 状態同期
- **影響する機能**: design-flow, implementation-flow の表示状態
- **更新通知**: action完了後、自動的にloaderが再実行され、最新状態が各セクションに反映

## 📈 成功指標・KPI

### 機能利用指標
- **更新ボタンクリック数**: セッションあたりの平均クリック数 - 目標5回以上（頻繁な進捗確認）
- **リトライボタン使用率**: 全セッションの10%以上（不具合修正・要件変更が発生している証拠）

### ユーザー体験指標
- **状態更新レスポンス時間**: 500ms以内 - ファイル存在確認の並列処理で高速化
- **リトライ成功率**: 95%以上 - アーカイブ処理のエラーハンドリング徹底

---

> **💡 Key Principle**:
> オペレーションセクションは「フロー全体の司令塔」として、開発者が能動的に進捗をコントロールできる仕組みを提供する。

> **🎯 Implementation Goal**:
> [更新]は500ms以内、[リトライ]は1秒以内に完了し、開発者のストレスを最小化する。
