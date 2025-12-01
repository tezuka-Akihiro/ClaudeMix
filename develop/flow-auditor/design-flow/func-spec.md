# Design Flow - 機能設計書

## 📋 機能概要

### 機能名
**Design Flow (設計フロービュー)**

### 所属サービス
**flow-auditor** の **design-flow** セクションに配置

### 機能の目的・価値
- **解決する課題**: 設計フェーズの成果物が開発フローに従って作成されているかを監査したい、設計の進捗状況を可視化したい
- **提供する価値**: 設計ドキュメント（func-spec.md、uiux-spec.md、file-list.mdなど）の存在状態をリアルタイムで監視し、設計フローの完了度をチェックポイント形式で表示
- **ビジネス効果**: 開発者が設計フェーズの進捗を一目で把握でき、未作成ドキュメントを即座に特定できる

### 実装優先度
**HIGH** - Flow Auditorのコア機能であり、設計プロセスの監視を担う

## 🎯 機能要件

### 基本機能
1. **チェックポイント定義の管理**: 共通チェックポイント（REQUIREMENTS_ANALYSIS_PIPE.md、GUIDING_PRINCIPLES.md）とセクション別チェックポイント（func-spec.md、uiux-spec.md、file-list.mdなど）を定義
2. **存在確認**: 各ドキュメントファイルの存在状態をチェック（fs.existsSync）
3. **プロジェクト構造の読み込み**: project.tomlからサービスのセクション定義を取得
4. **チェックポイントのグループ化**: 共通/commonセクション/セクション別（動的列数）にグループ化して表示
5. **チェックポイント選択機能**: チェックポイントクリック時に選択状態を管理（リトライ用）
6. **ステータス判定**: ファイル存在状態と選択状態からステータスを判定（pending/completed/selected）

### 開発戦略: 段階的強化 (Progressive Enhancement)
1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ
```typescript
// Loader: プロジェクト構造とチェックポイント定義の読み込み
interface LoaderInput {
  service: string // サービス名（例: "flow-auditor"）
  section?: string // セクション名（オプショナル、特定セクションのみチェックする場合）
}

// Action: チェックポイント選択（リトライ用）
interface SelectCheckpointInput {
  selectedCheckpoint: string // チェックポイントID（例: "func-spec"）
}
```

### 出力データ
```typescript
interface DesignFlowOutput {
  checkpoints: FlowGroup // チェックポイントのグループ化データ
  sections: Section[] // プロジェクトのセクション定義
  error?: string // エラーメッセージ（エラー発生時）
}

interface FlowGroup {
  common: Checkpoint[] // 共通チェックポイント（REQUIREMENTS_ANALYSIS_PIPE.md、GUIDING_PRINCIPLES.md）
  commonSection: Checkpoint[] // commonセクション専用チェックポイント（func-spec.md、uiux-spec.mdなど）
  branched: BranchedFlowGroup[] // セクション別チェックポイント（動的列数）
}

interface BranchedFlowGroup {
  sectionName: string // セクション名
  checkpoints: Checkpoint[] // そのセクションのチェックポイント配列
}

interface Checkpoint {
  id: string // チェックポイントID（例: "func-spec"）
  name: string // ファイル名（例: "func-spec.md"）
  path: string // ファイルパス
  exists: boolean // ファイル存在状態（true: 完了, false: 未完了）
  status: 'pending' | 'completed' | 'selected' // ステータス
  flowType: 'common' | 'branched' // フロータイプ
  section?: string // セクション名（branchedの場合に必須）
}

interface Section {
  name: string // セクション名
}
```

### 🎨 UI層要件（app/routes, app/components）
```
1. [ユーザー入力受付・表示制御]
   - DesignFlowSection: セクション全体のコンテナ、selectedCheckpointId管理
     - handleSelect: クリックされたチェックポイントを選択状態に設定
     - URL SearchParams更新: selectedCheckpoint={checkpointId}
     - エラー表示: エラー発生時はエラーボックスを表示
   - CommonFlowContainer: 共通チェックポイント縦1列表示
     - REQUIREMENTS_ANALYSIS_PIPE.md → "REQUIREMENTS_ANA..." に短縮表示
     - ファイル存在時のみクリック可能
   - CommonSectionContainer: commonセクション専用チェックポイント縦1列表示
     - commonセクションのチェックポイントを固定1列で表示
   - BranchedFlowContainer: セクション別チェックポイント動的列数表示
     - セクション数に応じて動的に列数を変更（1-6列）
     - 各セクションをBranchコンポーネントで表示
   - Branch: 単一セクションのチェックポイント群
     - セクション名をヘッダーに表示
     - そのセクションのチェックポイントを縦並びで表示
   - CardItem (共有コンポーネント): 個別チェックポイントの表示
     - 状態: pending（赤色）/completed（緑色）/selected（青色）
     - クリック: exists === true の場合のみクリック可能
```

### 🧠 純粋ロジック要件（app/lib）
```
2. [ビジネスロジック・計算処理]
   - designFlowDefinition.ts: チェックポイント定義（共通/セクション別）
     - getCommonCheckpointDefinitions: 共通チェックポイント定義（REQUIREMENTS_ANALYSIS_PIPE.md、GUIDING_PRINCIPLES.md）
     - getSectionCheckpointDefinitions: セクション別チェックポイント定義（func-spec.md、uiux-spec.md、file-list.md、TDD_WORK_FLOW.md、spec.yaml）
     - getAllCheckpointDefinitions: すべてのチェックポイント定義を取得
     - validateCheckpointDefinitions: ID重複、pathTemplateのプレースホルダー検証
   - flowGroupBuilder.ts: チェックポイントのグループ化
     - buildFlowGroups: チェックポイント配列とセクション配列から、共通/commonセクション/セクション別にグループ化
     - セクション数検証: 1-6の範囲内であることを検証（ValidationError）
     - セクション名重複チェック: セクション名が重複していないことを検証
   - checkpointStatus.ts: ステータス判定
     - determineCheckpointStatus: exists状態とselectedCheckpointIdから、ステータスを判定（selected > completed > pending）
   - retryCommandBuilder.ts: （未実装）チェックポイントIDからリトライコマンド生成
   ※ファイルシステムへのアクセスは行わない（純粋関数）
```

### 🔌 副作用要件（app/data-io）
```
3. [外部システム連携・データ永続化]
   - checkDesignFiles.ts: 設計ドキュメントの存在確認
     - 共通ファイル: REQUIREMENTS_ANALYSIS_PIPE.md、GUIDING_PRINCIPLES.md
     - セクション別ファイル: func-spec.md、uiux-spec.md、spec.yaml、file-list.md、TDD_WORK_FLOW.md
     - fs.existsSync: 各ファイルパスの存在をチェック
     - 戻り値: CheckDesignFilesResult ({ allExist, commonFiles, sectionFiles, missingFiles })
   - loadProjectSections.server.ts: project.tomlからセクション定義を取得
     - tomlパース: scripts/project.tomlを読み込み、サービス定義を取得
     - セクション抽出: 指定されたサービスのセクション配列を返す
     - 戻り値: LoadProjectSectionsResult ({ sections: Section[] })
   - loadCheckpointDefinitions.server.ts: チェックポイント定義読み込み
     - チェックポイント定義を読み込み、pathTemplateのプレースホルダーを置換
```

## 📊 ビジネスルール・制約

### バリデーションルール
- **CheckpointDefinition.id**: 重複不可
- **CheckpointDefinition.pathTemplate**: プレースホルダーは {service} と {section} のみ許可
- **セクション数**: 1-6の範囲内（ValidationError）
- **セクション名**: 重複不可

### 操作制限
- **チェックポイントクリック**: exists === true の場合のみクリック可能
- **トグル動作**: 選択済みのチェックポイントをクリックすると選択を解除
- **複数選択との共存**: implementation-flow由来の複数選択（カンマ区切り）の場合は、単一選択に置き換える

### データ整合性
- **チェックポイント定義**: 共通チェックポイントとセクション別チェックポイントを明確に分離
- **commonセクションの特殊扱い**: commonセクションは固定1列で表示し、branchedグループには含めない
- **ステータス優先順位**: selected > completed > pending

## 🚀 技術要件

### loader
- **目的**: プロジェクト構造とチェックポイント定義を読み込み、各ドキュメントの存在状態をチェックしてグループ化したデータを返す
- **処理**:
  1. loadProjectSections.server.ts: project.tomlからセクション定義を取得
  2. designFlowDefinition.getAllCheckpointDefinitions: チェックポイント定義を取得
  3. pathTemplateのプレースホルダー置換: {service} と {section} を実際の値で置換
  4. checkDesignFiles.ts: 各ドキュメントの存在確認
  5. checkpointStatus.determineCheckpointStatus: ステータス判定
  6. flowGroupBuilder.buildFlowGroups: チェックポイントをグループ化
  7. コンポーネントに`{ checkpoints: FlowGroup, sections: Section[], error?: string }`を返す

### action
- **目的**: チェックポイント選択状態の更新（現在はURL SearchParamsで管理）
- **処理**: 現在はaction不要（すべてクライアントサイドで処理）
- **将来拡張**: リトライ機能の実装時に、選択されたチェックポイント以降のファイルをアーカイブする処理を追加予定

### データベース要件
- **不要**: ファイルシステムとproject.tomlのみで完結（DBアクセスなし）

## 🔗 他機能・サービスとの連携

### データ連携
- **入力元**: project.toml - サービスのセクション定義を取得
- **入力元**: designFlowDefinition.ts - チェックポイント定義を取得
- **出力先**: common/RetryButton - 選択されたチェックポイントIDを受け取りリトライ実行（将来拡張）

### 状態同期
- **影響する機能**: common/RefreshButton - リフレッシュ時にloaderが再実行され、最新の存在状態が反映
- **影響する機能**: implementation-flow - 選択状態を共有（URL SearchParams経由）

### UIコンポーネント依存
- **CardItem (共有コンポーネント)**: flow-auditor/common/CardItem.tsx
  - pending/completed/selected状態の表示
  - クリック時のコールバック処理
  - チェックポイント名の短縮表示

## 📈 成功指標・KPI

### 機能利用指標
- **チェックポイント選択率**: セッションあたりの平均チェックポイント選択数 - 目標2回以上（リトライ機能の利用）
- **設計完了率**: 全チェックポイントのうち完了（exists === true）しているチェックポイントの割合 - 目標80%以上

### ユーザー体験指標
- **存在確認レスポンス時間**: 500ms以内 - ファイル存在確認の並列処理で高速化
- **グループ化表示レスポンス時間**: 300ms以内 - 純粋関数による高速なグループ化処理

---

> **💡 Key Principle**:
> design-flowセクションは「設計フローの監視塔」として、開発者が設計の進捗を一目で把握できる仕組みを提供する。

> **🎯 Implementation Goal**:
> 存在確認とグループ化は500ms以内に完了し、開発者のストレスを最小化する。

> **🔗 Dependency Note**:
> 本セクションは、project.tomlとdesignFlowDefinition.tsに依存する。これらの変更時は、必ず本セクションの動作を検証すること。

> **📐 UI Layout Note**:
> - 共通チェックポイント: 固定1列（縦並び）
> - commonセクション: 固定1列（縦並び）
> - セクション別チェックポイント: 動的列数（1-6列、セクション数に応じて変化）
