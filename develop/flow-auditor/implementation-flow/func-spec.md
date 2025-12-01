# Implementation Flow - 機能設計書

## 📋 機能概要

### 機能名
**Implementation Flow (実装フロービュー)**

### 所属サービス
**flow-auditor** の **implementation-flow** セクションに配置

### 機能の目的・価値
- **解決する課題**: 実装フェーズの成果物がTDDフローに従って作成されているかを監査したい、実装の進捗状況を可視化したい
- **提供する価値**: file-list.mdで定義された実装ファイルとテストファイルの存在状態をリアルタイムで監視し、TDDフローの完了度を層別（lib/data-io/ui）に表示
- **ビジネス効果**: 開発者が実装フェーズの進捗を一目で把握でき、未実装ファイルを即座に特定できる

### 実装優先度
**HIGH** - Flow Auditorのコア機能であり、TDD開発プロセスの監視を担う

## 🎯 機能要件

### 基本機能
1. **ファイル定義の読み込み**: file-list.mdから実装すべきファイル定義を取得
2. **存在確認**: 各ファイルパスの存在状態をチェック（fs.existsSync）
3. **test-scriptペアリング**: テストファイル（.test.ts/.test.tsx）と実装ファイルを自動ペアリング
4. **層別グループ表示**: lib/data-io/ui層別にファイルをグループ化して表示
5. **ペア選択機能**: ファイルクリック時に対応するペアファイルも自動選択（Surgical Retry用）
6. **リトライ実行**: 選択されたファイルをアーカイブに移動してフローを「未完了」状態に戻す

### 開発戦略: 段階的強化 (Progressive Enhancement)
1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ
```typescript
// Loader: file-list.mdの読み込み
interface LoaderInput {
  service: string // サービス名（例: "flow-auditor"）
  section: string // セクション名（例: "implementation-flow"）
}

// Action: リトライ実行
interface RetryInput {
  _action: 'retry'
  selectedCheckpoint: string // カンマ区切りのファイルパス（例: "path1,path2,path3"）
}
```

### 出力データ
```typescript
interface ImplementationFlowOutput {
  layerGroups: LayerGroup[] // 層別グループの配列（lib/data-io/ui）
}

interface LayerGroup {
  layer: 'e2e' | 'lib' | 'data-io' | 'ui' // 層分類
  displayName: string // 表示名（例: "app/lib"、"app/data-io"、"app/components"）
  pairs: TestScriptPair[] // test-scriptペアの配列
  unpairedFiles: FileDefinition[] // ペアにならなかったファイル
}

interface TestScriptPair {
  testFile: FileDefinition // テストファイル
  scriptFile: FileDefinition // 実装ファイル
}

interface FileDefinition {
  id: string // 一意識別子（例: "lib-foo"、"ui-bar-test"）
  name: string // ファイル名（例: "foo.ts"、"bar.test.tsx"）
  path: string // ファイルパス
  description: string // 説明
  layer: 'e2e' | 'lib' | 'data-io' | 'ui' // 層分類
  exists?: boolean // ファイル存在状態（true: 完了, false: 未完了）
  pairId?: string // ペアファイルのID
}
```

### 🎨 UI層要件（app/routes, app/components）
```
1. [ユーザー入力受付・表示制御]
   - ImplementationFlowSection: セクション全体のコンテナ、selectedFilePaths管理
     - LayerGroup配列を縦並びで表示
     - handleFileClick: クリックされたファイルとそのペアを選択状態に追加
     - URL SearchParams更新: selectedCheckpoint={path1},{path2},...
   - LayerGroup: 層別（lib/data-io/ui）のコンテナ
     - GroupHeader: 層名を表示（例: "🧠 app/lib"）
     - TestScriptPair配列を縦並びで表示
   - CardItem (共有コンポーネント): 個別ファイルの表示
     - 状態: pending（赤色）/completed（緑色）/selected（青色）
     - クリック: exists === true の場合のみクリック可能
     - ファイル名短縮表示: 20文字を超える場合は省略表示
```

### 🧠 純粋ロジック要件（app/lib）
```
2. [ビジネスロジック・計算処理]
   - implementationFlowTypes.ts: 型定義（ImplementationFlowOutput, LayerGroup, FileDefinition, TestScriptPair, FilePairInfo）
   - implementationFlowDefinition.ts: file-list.mdパース処理
     - parseFileListMarkdown: マークダウンテーブルを解析してFileDefinition配列を生成
     - setPairIds: テストファイルと実装ファイルのpairIdを設定
     - validateFileDefinitions: ID重複、path重複、必須フィールドの検証
     - groupFileDefinitionsByLayer: 層別にグループ化
   - implementationFlowBuilder.ts: UI表示用データ構築
     - buildImplementationFlow: ファイル定義+存在確認結果→LayerGroup配列
     - matchTestScriptPairs: テストファイルと実装ファイルをペアリング
     - createPairs: test-scriptペアを作成し、ペアにならなかったファイルも返す
   - filePairMatcher.ts: ペアファイル検索（Surgical Retry用）
     - findFilePair: 選択されたファイルのペアファイルを検索
     - findPairFilePath: クリックされたファイルパスからペアファイルパスを検索
   ※ファイルシステムへのアクセスは行わない（純粋関数）
```

### 🔌 副作用要件（app/data-io）
```
3. [外部システム連携・データ永続化]
   - readFileListMd.server.ts: file-list.mdを読み込んでマークダウンテキストを返す
     - fs.readFileSync: develop/{service}/{section}/file-list.md
     - エラーハンドリング: ファイルが存在しない場合はENOENTエラー
   - checkImplementationFiles.server.ts: ファイル存在確認
     - fs.existsSync: 各ファイルパスの存在をチェック
     - 並列実行: filePaths配列を一括処理
     - 戻り値: FileExistsResult[] ({ path, exists })
   - executeRetry.server.ts: リトライ実行（ファイルをアーカイブに移動）
     - タイムスタンプ付きアーカイブディレクトリ作成: _archive/{timestamp}/
     - fs.renameSync: 対象ファイルをアーカイブディレクトリに移動
     - ファイル名変換: パス区切り文字を"_"に置換（例: app/lib/foo.ts → app_lib_foo.ts）
     - 戻り値: FileArchiveResult[] ({ path, success, error? })
   - loadLayerDisplayNames.server.ts: 層の表示名読み込み
     - デフォルト: { lib: "app/lib", "data-io": "app/data-io", ui: "app/components" }
```

## 📊 ビジネスルール・制約

### バリデーションルール
- **file-list.md**: 必須フィールド（id, name, path, description, layer）が存在すること
- **FileDefinition.id**: 重複不可（パスから一意に生成）
- **FileDefinition.path**: 重複不可
- **selectedCheckpoint**: カンマ区切りのファイルパス文字列（例: "path1,path2"）

### 操作制限
- **ファイルクリック**: exists === true の場合のみクリック可能
- **リトライ実行**: 選択されたファイルが存在する場合のみアーカイブ対象

### データ整合性
- **ペアリング**: テストファイル（.test.ts/.test.tsx/.spec.ts）と実装ファイルは必ずペアで選択
- **層分離**: E2E層はUI表示対象から除外（tests/e2e配下は表示しない）
- **ファイル移動の原子性**: アーカイブ処理中のエラーは個別にキャッチし、成功/失敗を記録

## 🚀 技術要件

### loader
- **目的**: file-list.mdから実装すべきファイル定義を取得し、存在状態をチェックして層別にグループ化したデータを返す
- **処理**:
  1. readFileListMd.server.ts: file-list.mdを読み込む
  2. implementationFlowDefinition.parseFileListMarkdown: マークダウンをパース
  3. checkImplementationFiles.server.ts: 各ファイルの存在確認
  4. implementationFlowBuilder.buildImplementationFlow: UI表示用データ構築
  5. コンポーネントに`{ layerGroups }`を返す

### action
- **目的**: Footer内のRetryボタンから受け取った複数ファイルパスをアーカイブに移動する
- **処理分岐**:
  - `_action: 'retry'`:
    - リクエスト: `{ selectedCheckpoint: "path1,path2,path3" }`
    - 処理:
      1. FormDataから`selectedCheckpoint`を取得
      2. カンマ区切りをパースして配列化: `selectedCheckpoint.split(',')`
      3. executeRetry.server.ts: 対象ファイルをアーカイブ
      4. 成功時: `redirect('/flow-auditor')`でURL SearchParamsをクリアして再読み込み
      5. 失敗時: エラー情報を含めて返却

### データベース要件
- **不要**: ファイルシステムのみで完結（DBアクセスなし）

## 🔗 他機能・サービスとの連携

### データ連携
- **入力元**: file-list.md - 実装すべきファイル定義を取得
- **出力先**: common/RetryButton - 選択されたファイルパスを受け取りアーカイブ実行

### 状態同期
- **影響する機能**: common/RefreshButton - リフレッシュ時にloaderが再実行され、最新の存在状態が反映
- **更新通知**: action完了後、`redirect('/flow-auditor')`により自動的にloaderが再実行

### UIコンポーネント依存
- **CardItem (共有コンポーネント)**: flow-auditor/common/CardItem.tsx
  - pending/completed/selected状態の表示
  - クリック時のコールバック処理

## 📈 成功指標・KPI

### 機能利用指標
- **ファイル選択率**: セッションあたりの平均ファイル選択数 - 目標3回以上（Surgical Retry機能の利用）
- **リトライ実行率**: 全セッションの5%以上（実装の手戻りが発生している証拠）

### ユーザー体験指標
- **存在確認レスポンス時間**: 500ms以内 - ファイル存在確認の並列処理で高速化
- **リトライ成功率**: 95%以上 - アーカイブ処理のエラーハンドリング徹底

---

> **💡 Key Principle**:
> implementation-flowセクションは「TDD実装フローの監視塔」として、開発者が実装の進捗を一目で把握できる仕組みを提供する。

> **🎯 Implementation Goal**:
> 存在確認は500ms以内、リトライは1秒以内に完了し、開発者のストレスを最小化する。

> **🔗 Dependency Note**:
> 本セクションは、file-list.mdに依存する。file-list.mdの変更時は、必ず本セクションの動作を検証すること。
