# Common - 機能設計書

## 📋 機能概要

### 機能名
**Common (共通機能・共有コンポーネント)**

### 所属サービス
**flow-auditor** の **common** セクションに配置

### 機能の目的・価値
- **解決する課題**: flow-auditor全体で共有される機能とUIコンポーネントを統一的に管理したい、重複コードを削減したい
- **提供する価値**: サービス/セクション選択、リフレッシュ/リトライ操作、共通UIコンポーネント（CardItem、Header、Footerなど）を提供し、design-flowとimplementation-flowセクション間で一貫したUXを実現
- **ビジネス効果**: コンポーネントの再利用により開発効率が向上し、UI/UXの一貫性が保たれる

### 実装優先度
**HIGH** - Flow Auditorの基盤となる共通機能・共有コンポーネント群

## 🎯 機能要件

### 基本機能
1. **サービス選択機能**: project.tomlからサービス一覧を読み込み、ドロップダウンで選択
2. **セクション選択機能**: 選択されたサービスのセクション一覧を読み込み、ドロップダウンで選択
3. **リフレッシュ機能**: 進捗データを再読み込みして最新状態を表示
4. **リトライ機能**: 選択されたチェックポイント以降のファイルをアーカイブして未完了状態に戻す
5. **最終更新ラベル**: タイムスタンプを「HH:MM」または「たった今」形式で表示
6. **カードアイテム**: 汎用カード型UIコンポーネント（pending/completed/selected/error状態）
7. **ヘッダーコンテナ**: ServiceSelector、SectionSelector、LastUpdatedLabelを配置
8. **フッターコンテナ**: RefreshButton、RetryButtonを配置

### 開発戦略: 段階的強化 (Progressive Enhancement)
1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ
```typescript
// Loader: サービス/セクション一覧の読み込み
interface LoaderInput {
  serviceName?: string // サービス名（オプショナル、未指定時は全サービス一覧を取得）
}

// Action: リトライ実行
interface RetryInput {
  _action: 'retry'
  checkpointId?: string // 単一チェックポイントID（Design Flow用）
  selectedCheckpoint?: string // カンマ区切りのファイルパス（Implementation Flow用）
}
```

### 出力データ
```typescript
interface CommonOutput {
  services: string[] // サービス一覧
  sections: SectionInfo[] // セクション一覧
  lastUpdated: Date // 最終更新日時
}

interface SectionInfo {
  key: string // セクションキー（例: "common", "design-flow"）
  name: string // 表示名（例: "Common Components", "設計フロー"）
}

interface ExecuteRetryResult {
  success: boolean // 成功/失敗
  archivedFiles: string[] // アーカイブされたファイルパスの配列
  errorMessage?: string // エラーメッセージ（エラー発生時）
}
```

### 🎨 UI層要件（app/routes, app/components）
```
1. [ユーザー入力受付・表示制御]
   - Header: ヘッダーコンテナ
     - ServiceSelector: サービス選択ドロップダウン
       - onChange時にURL SearchParams更新（service={serviceName}）
     - SectionSelector: セクション選択ドロップダウン
       - onChange時にURL SearchParams更新（section={sectionName}）
       - サービス未選択時は無効化（disabled={!selectedService}）
     - LastUpdatedLabel: 最終更新日時表示
       - timestampFormatterで「HH:MM」または「たった今」形式に変換
   - Footer: フッターコンテナ
     - RefreshButton: リフレッシュボタン
       - クリック時にloaderを再実行（navigate(0)またはrevalidate()）
       - ローディング中はボタンを無効化し、「Loading...」表示
     - RetryButton: リトライボタン
       - selectedCheckpointId === null の場合は無効化
       - クリック時に確認モーダル表示→retryアクション送信
   - CardItem: 汎用カード型UIコンポーネント（共有コンポーネント）
     - status: pending（赤色）/completed（緑色）/selected（青色）/error（赤色）
     - clickable: true の場合はクリック可能（is-clickable）、false の場合は無効（is-disabled）
     - onClick: 左クリック時のハンドラー（選択/選択解除）
     - onContextMenu: 右クリック時のハンドラー（パスのクリップボードコピー）
       - event.preventDefault()でブラウザの右クリックメニューを無効化
       - navigator.clipboard.writeText(path)でパスをコピー
       - コピー成功時にトースト通知「Copied: {path}」を2秒間表示
       - コピー失敗時にトースト通知「Failed to copy path」を2秒間表示
     - title属性: ファイルパス（tooltip表示）
     - data-testid属性: テスト用ID
     - data-checkpoint-id属性: チェックポイントID（design-flow用）
```

### 🧠 純粋ロジック要件（app/lib）
```
2. [ビジネスロジック・計算処理]
   - timestampFormatter.ts: タイムスタンプフォーマッター
     - formatTimestamp: Date → "HH:MM" または "たった今"
       - 1分以内: "たった今"
       - それ以降: "HH:MM"形式（ゼロパディング）
       - 無効なDate: "--:--"
   - sectionListBuilder.ts: セクション一覧ビルダー
     - buildSectionList: project.tomlのパース結果とサービス名から、セクション一覧（SectionInfo[]）を構築
       - { key: "common", name: "Common Components" }形式
   - retryTargetCalculator.ts: リトライ対象計算ロジック
     - calculateRetryTargets: 単一チェックポイントID→アーカイブ対象ファイルパスの配列
       - 指定されたチェックポイント以降のファイルを抽出
       - exists: trueのファイルのみ対象
     - calculateRetryTargetsFromMultiple: 複数チェックポイントID→アーカイブ対象ファイルパスの配列（重複なし）
       - Implementation Flow用: 複数選択されたファイルをすべてアーカイブ対象に含める
       - Setを使用して重複を排除
   ※ファイルシステムへのアクセスは行わない（純粋関数）
```

### 🔌 副作用要件（app/data-io）
```
3. [外部システム連携・データ永続化]
   - loadServiceList.server.ts: サービス一覧読み込み
     - scripts/project.tomlを読み込み、services配下のキーを配列で返す
     - tomlパース: @iarna/toml
     - エラーハンドリング: エラー発生時は空配列を返す
   - loadSectionList.server.ts: セクション一覧読み込み
     - scripts/project.tomlを読み込み、指定されたサービスのsections配下を取得
     - buildSectionList（lib層）を呼び出してSectionInfo[]を返す
     - エラーハンドリング: エラー発生時は空配列を返す
   - loadFlowAuditorConfig.server.ts: flow-auditor設定読み込み
     - プロジェクト固有の設定を読み込む（将来拡張用）
   - executeRetry.server.ts: リトライ実行（ファイルアーカイブ）
     - retryTargetCalculator（lib層）を呼び出してアーカイブ対象ファイルを計算
     - タイムスタンプ付きアーカイブディレクトリ作成: _archive/{timestamp}/
     - fs.rename: 各ファイルをアーカイブディレクトリに移動
       - ディレクトリ構造を保持（例: develop/foo/bar.md → _archive/{timestamp}/develop/foo/bar.md）
     - 戻り値: ExecuteRetryResult ({ success, archivedFiles, errorMessage? })
     - エラーハンドリング: ファイルが存在しない場合はスキップ（ENOENT）、その他はエラー記録
```

## 📊 ビジネスルール・制約

### バリデーションルール
- **serviceName**: project.tomlに定義されたサービス名のみ許可
- **sectionName**: 選択されたサービスに定義されたセクション名のみ許可
- **checkpointId/selectedCheckpoint**: 空文字列不可、存在するチェックポイントIDのみ許可

### 操作制限
- **SectionSelector**: サービス未選択時は無効化
- **RetryButton**: selectedCheckpointId === null の場合は無効化
- **RefreshButton**: ローディング中は無効化

### データ整合性
- **リトライ処理**: アーカイブ対象ファイルはexists: trueのファイルのみ
- **ファイル移動**: ディレクトリ構造を保持してアーカイブ
- **エラーハンドリング**: ファイルが存在しない場合はスキップ、その他のエラーは記録して処理継続

## 🚀 技術要件

### loader
- **目的**: サービス/セクション一覧と最終更新日時を取得する
- **処理**:
  1. loadServiceList.server.ts: サービス一覧を取得
  2. loadSectionList.server.ts: 指定されたサービスのセクション一覧を取得（サービス指定時のみ）
  3. 現在のタイムスタンプを取得
  4. コンポーネントに`{ services, sections, lastUpdated }`を返す

### action
- **目的**: リトライ/リフレッシュ操作を実行する
- **処理分岐**:
  - `_action: 'retry'`:
    - リクエスト: `{ checkpointId?, selectedCheckpoint? }`
    - 処理:
      1. checkpointIdまたはselectedCheckpointをパース
         - checkpointId: 単一文字列（Design Flow用）
         - selectedCheckpoint: カンマ区切り文字列（Implementation Flow用）→配列化
      2. executeRetry.server.ts: アーカイブ処理を実行
      3. 成功時: `redirect('/flow-auditor')`でURL SearchParamsをクリアして再読み込み
      4. 失敗時: エラー情報を含めて返却
  - `_action: 'refresh'`:
    - リクエスト: なし
    - 処理: loaderと同じ処理を実行（または単にrevalidate()を呼び出す）

### データベース要件
- **不要**: ファイルシステムとproject.tomlのみで完結（DBアクセスなし）

## 🔗 他機能・サービスとの連携

### データ連携
- **入力元**: project.toml - サービス/セクション一覧を取得
- **出力先**: design-flow - サービス/セクション選択状態を共有（URL SearchParams経由）
- **出力先**: implementation-flow - サービス/セクション選択状態を共有（URL SearchParams経由）

### 状態同期
- **影響する機能**: design-flow, implementation-flow - サービス/セクション選択変更時に再読み込み
- **影響する機能**: design-flow, implementation-flow - リフレッシュ時にloaderが再実行され、最新状態が反映
- **影響する機能**: design-flow, implementation-flow - リトライ時にアーカイブ処理を実行し、再読み込み

### UIコンポーネント依存
- **CardItem**: design-flow、implementation-flowで共有利用
  - design-flow: CheckpointItem（チェックポイント表示）
  - implementation-flow: FileCard（ファイル表示）

## 📈 成功指標・KPI

### 機能利用指標
- **サービス切り替え率**: セッションあたりの平均サービス切り替え回数 - 目標1回以上
- **セクション切り替え率**: セッションあたりの平均セクション切り替え回数 - 目標2回以上
- **リフレッシュ頻度**: セッションあたりの平均リフレッシュ回数 - 目標5回以上
- **リトライ実行率**: 全セッションの10%以上（手戻りが発生している証拠）

### ユーザー体験指標
- **サービス/セクション読み込み時間**: 300ms以内 - project.tomlの高速パース
- **リフレッシュレスポンス時間**: 500ms以内 - 存在確認の並列処理で高速化
- **リトライ処理時間**: 1秒以内 - ファイル移動の並列処理で高速化

---

> **💡 Key Principle**:
> commonセクションは「flow-auditorの基盤」として、design-flowとimplementation-flowセクション間で一貫したUX/UIを提供する。

> **🎯 Implementation Goal**:
> すべての操作（サービス/セクション選択、リフレッシュ、リトライ）は1秒以内に完了し、開発者のストレスを最小化する。

> **🔗 Dependency Note**:
> 本セクションは、project.tomlに依存する。project.tomlの変更時は、必ず本セクションの動作を検証すること。

> **🧩 Component Reusability**:
> - CardItem: design-flow/implementation-flow間で共有
> - Header/Footer: flow-auditorルート全体で使用
> - ServiceSelector/SectionSelector: 今後、他のサービスでも再利用可能な設計
