# TDD作業手順書: Operation

## 1. 概要

**開発名**: Operation (オペレーション) の実装
**目的**: 開発フローの進捗状況を手動で更新し、不具合修正・要件変更時に特定のフェーズへ戻る機能を実装する。[更新][リトライ]ボタンによる、フロー全体の制御と状態更新を提供し、開発者が開発フローの進捗を能動的にコントロールできるようにする。

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1.  **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2.  **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3.  **E2E拡張**: 最初のE2Eテストが成功した後、エラーケースや境界値などの詳細なE2Eテストを追加し、品質を盤石にします。
- **3大層分離アーキテクチャの厳守**:
    - **UI層**: ユーザーインタラクションとビューの描画のみ
    - **純粋ロジック層 (lib)**: 副作用を持たない計算処理とビジネスロジック
    - **副作用層 (data-io)**: ファイルシステム、外部API、DBアクセスなどの副作用処理

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義)

#### 1.1. 画面レベルE2Eテスト更新

- **1. E2Eテストファイル更新**:
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

- **2. Happy Pathのテスト記述**:
  - ファイル: `tests/e2e/flow-auditor.e2e.test.ts`
  - シナリオ:
    ```typescript
    test('Operation: 更新ボタンで全チェックポイント状態を再確認', async ({ page }) => {
      // 1. flow-auditorページにアクセス
      await page.goto('/');

      // 2. Operationセクションが表示されること
      await expect(page.locator('[data-testid="operation-section"]')).toBeVisible();

      // 3. 更新ボタンが表示されること
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await expect(refreshButton).toBeVisible();

      // 4. 更新ボタンをクリック
      await refreshButton.click();

      // 5. ローディング状態が表示されること
      await expect(refreshButton).toBeDisabled();

      // 6. 更新完了後、ボタンが再度有効になること
      await expect(refreshButton).toBeEnabled({ timeout: 1000 });

      // 7. 最終更新日時が更新されること
      const lastUpdatedLabel = page.locator('[data-testid="last-updated-label"]');
      await expect(lastUpdatedLabel).toContainText(/最終更新/);
    });

    test('Operation: リトライボタンの有効/無効切り替え', async ({ page }) => {
      // 1. flow-auditorページにアクセス
      await page.goto('/');

      // 2. リトライボタンが表示されること
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();

      // 3. selectedCheckpointId未選択時、リトライボタンが無効化されていること
      await expect(retryButton).toBeDisabled();

      // 4. design-flowセクションでチェックポイントを選択
      const checkpoint = page.locator('[data-testid="checkpoint-item"].completed').first();
      if (await checkpoint.count() > 0) {
        await checkpoint.click();

        // 5. リトライボタンが有効化されること
        await expect(retryButton).toBeEnabled();

        // 6. リトライボタンをクリック
        await retryButton.click();

        // 7. RetryModalが表示されること
        await expect(page.locator('[data-testid="retry-modal"]')).toBeVisible();
      }
    });
    ```

- **3. テストの失敗を確認**:
  ```bash
  npm run test:e2e
  ```
  - 実装がまだ存在しないため、このテストが失敗すること（RED）を確認

#### 1.2. セクションレベルE2Eテスト作成

- **1. E2Eテストファイル生成**:
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

- **2. 詳細シナリオのテスト記述**:
  - ファイル: `tests/e2e/flow-auditor/operation-section.e2e.test.ts`
  - 主要テストケース:
    - 更新ボタンクリックで全チェックポイント存在確認が実行される
    - 更新処理が500ms以内に完了する（パフォーマンス要件）
    - リトライボタンがselectedCheckpointIdに応じて有効/無効を切り替える
    - RetryModalに影響ファイルリストが表示される
    - リトライ実行後、ファイルがdevelop/archive/{timestamp}/へ移動される
    - ServiceSelector選択変更時、design-flow/implementation-flowが更新される
    - LastUpdatedLabelが正しいフォーマットで表示される

- **3. テストの失敗を確認**:
  ```bash
  npm run test:e2e
  ```
  - 詳細なテストケースが失敗すること（RED）を確認

### Phase 2: 層別TDD (ユニット/コンポーネント実装)

#### 2.1. 🔌 副作用層の実装（最も内側から）

**原則**: 副作用層は外部システムとのやり取りを担当し、UIコンポーネントやReactフックを含めない

##### 2.1.1. checkFileExistence.server

**目的**: 単一ファイルの存在確認（fs.existsSync）

- **テスト実装 (RED)**:
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

  - ファイル: `app/data-io/flow-auditor/operation/checkFileExistence.server.test.ts`
  - テストケース:
    - ファイルが存在する場合、trueを返す
    - ファイルが存在しない場合、falseを返す
    - 100ms以内に処理が完了する
    - 不正なパス（null, undefined, 空文字）の場合、falseを返す
    - 権限エラー時、falseを返す（エラーをスローしない）

- **実装 (GREEN)**:
  - ファイル: `app/data-io/flow-auditor/operation/checkFileExistence.server.ts`
  - 実装内容:
    - `fs.existsSync()`を使用してファイル存在確認
    - 関数シグネチャ: `checkFileExistence(filePath: string): boolean`
    - 入力検証: null/undefined/空文字チェック
    - エラーハンドリング: try-catchでfs.existsSyncをラップし、エラー時はfalseを返す
    - パスの正規化（`path.resolve()`）

- **リファクタリング**:
  - パスの正規化（Windows/Unix対応、`path.normalize()`使用）
  - 詳細なエラーログ出力（デバッグ用、本番環境では無効化）
  - 型定義の明確化（JSDocコメント追加）

##### 2.1.2. checkAllCheckpoints.server

**目的**: 全チェックポイントの存在確認（並列処理、Promise.all）

- **テスト実装 (RED)**:
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

  - ファイル: `app/data-io/flow-auditor/operation/checkAllCheckpoints.server.test.ts`
  - テストケース:
    - 全チェックポイントの存在確認が並列で実行される
    - 各チェックポイントに`exists: boolean`が付与される
    - 500ms以内に処理が完了する（パフォーマンス要件）
    - 個別ファイルのエラーでも処理が継続する
    - 空配列を渡した場合、空配列を返す
    - 50個のチェックポイントでも500ms以内に完了する（並列処理の効果検証）

- **実装 (GREEN)**:
  - ファイル: `app/data-io/flow-auditor/operation/checkAllCheckpoints.server.ts`
  - 実装内容:
    - `Promise.all()`で全チェックポイントを並列確認
    - 関数シグネチャ: `checkAllCheckpoints(checkpoints: CheckpointInput[]): Promise<OperationCheckpoint[]>`
    - 各チェックポイントに対して`checkFileExistence.server.ts`を呼び出し
    - 各チェックポイントに`exists: boolean`を付与して返す
    - 並列処理アルゴリズム:
      ```typescript
      const results = await Promise.all(
        checkpoints.map(async (checkpoint) => {
          const exists = await checkFileExistence(checkpoint.path);
          return {
            id: checkpoint.id,
            name: checkpoint.name,
            filePath: checkpoint.path,
            exists,
            category: checkpoint.category
          };
        })
      );
      ```

- **リファクタリング**:
  - バッチサイズの調整（大量ファイル時のメモリ対策、10件ずつ処理）
  - キャッシュ機構の検討（頻繁な呼び出し時の最適化）
  - 進捗コールバックの追加（長時間処理時のフィードバック）

##### 2.1.3. archiveFiles.server

**目的**: ファイルアーカイブ（fs.renameSync、develop/archive/{timestamp}/へ移動）

- **テスト実装 (RED)**:
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

  - ファイル: `app/data-io/flow-auditor/operation/archiveFiles.server.test.ts`
  - テストケース:
    - アーカイブディレクトリが正しく作成される（recursive: true）
    - 各ファイルが正しくアーカイブディレクトリに移動される
    - ディレクトリ構造が維持される（相対パスが保持される）
    - 1ファイルでもエラーが発生した場合、全ファイルがロールバックされる（原子性）
    - 成功時、`{ success: true, archivedFiles: [...], errors: [] }`を返す
    - エラー時、`{ success: false, archivedFiles: [], errors: [...] }`を返す
    - 存在しないファイルをアーカイブしようとした場合、エラーを含めて返す
    - 1秒以内に処理が完了する（パフォーマンス要件）

- **実装 (GREEN)**:
  - ファイル: `app/data-io/flow-auditor/operation/archiveFiles.server.ts`
  - 実装内容:
    - 関数シグネチャ: `archiveFiles(filePaths: string[], archiveDir: string): ArchiveResult`
    - **フェーズ1: アーカイブディレクトリ作成**
      ```typescript
      fs.mkdirSync(archiveDir, { recursive: true });
      ```
    - **フェーズ2: ファイル移動（トランザクション的処理）**
      ```typescript
      const movedFiles: Array<{ from: string; to: string }> = [];
      try {
        for (const filePath of filePaths) {
          const relativePath = path.relative(process.cwd(), filePath);
          const archivePath = path.join(archiveDir, relativePath);
          const archiveSubDir = path.dirname(archivePath);
          fs.mkdirSync(archiveSubDir, { recursive: true });
          fs.renameSync(filePath, archivePath);
          movedFiles.push({ from: filePath, to: archivePath });
        }
        return { success: true, archivedFiles: movedFiles.map(f => f.to), errors: [] };
      } catch (error) {
        // ロールバック: 移動済みファイルを元の位置に戻す
        for (const { from, to } of movedFiles) {
          try {
            fs.renameSync(to, from);
          } catch (rollbackError) {
            // ロールバック失敗は致命的エラー
            console.error('Rollback failed:', rollbackError);
          }
        }
        return { success: false, archivedFiles: [], errors: [error.message] };
      }
      ```
    - **原子性保証**: エラー時に全ファイルをロールバック
    - ディレクトリ構造の維持（相対パスを保持）

- **リファクタリング**:
  - ドライラン機能の追加（実際にファイルを移動せずにシミュレーション）
  - プログレスコールバックの追加（大量ファイル時の進捗表示）
  - ロールバック失敗時の詳細ログ出力
  - 並列移動の検討（大量ファイル時の高速化）

##### 2.1.4. loadServices.server

**目的**: project.tomlから全サービス名取得

- **テスト実装 (RED)**:
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

  - ファイル: `app/data-io/flow-auditor/operation/loadServices.server.test.ts`
  - テストケース:
    - project.tomlから正しくサービス名配列を取得する
    - 各サービス名が文字列である
    - サービス数が1以上である（空でない）
    - project.tomlが存在しない場合、空配列を返す
    - TOMLパースエラー時、空配列を返す（エラーをスローしない）
    - サービス名に不正な文字が含まれていない（`/^[a-z0-9-]+$/`）

- **実装 (GREEN)**:
  - ファイル: `app/data-io/flow-auditor/operation/loadServices.server.ts`
  - 実装内容:
    - 関数シグネチャ: `loadServices(): string[]`
    - **フェーズ1: project.toml読み込み**
      ```typescript
      const projectTomlPath = path.join(process.cwd(), 'scripts', 'project.toml');
      const tomlContent = fs.readFileSync(projectTomlPath, 'utf-8');
      ```
    - **フェーズ2: TOMLパース**
      ```typescript
      import * as toml from '@iarna/toml';
      const parsed = toml.parse(tomlContent);
      ```
    - **フェーズ3: サービス名抽出**
      ```typescript
      const services = Object.keys(parsed.services || {});
      ```
    - エラーハンドリング: try-catchで全体をラップし、エラー時は空配列を返す
    - サービス名バリデーション（正規表現チェック）

- **リファクタリング**:
  - キャッシュ機構の追加（頻繁な呼び出し時の最適化）
  - サービス名のソート（アルファベット順）
  - 詳細なエラーログ出力（デバッグ用）

#### 2.2. 🧠 純粋ロジック層の実装（中間層）

**原則**: 純粋関数のみ、副作用（ファイルI/O、API呼び出し）を含めない

##### 2.2.1. checkpointIdResolver

**目的**: チェックポイントIDから対象オブジェクトを解決

- **テスト実装 (RED)**:
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

  - ファイル: `app/lib/flow-auditor/operation/checkpointIdResolver.test.ts`
  - テストケース:
    - 正しい形式のcheckpointId（'design-flow-operation-requirements'）から`{ flow: 'design-flow', section: 'operation', category: 'requirements' }`を返す
    - 不正な形式（パートが2つ以下）の場合、nullを返す
    - nullまたは空文字の場合、nullを返す
    - ハイフンを含むセクション名（'design-flow'）を正しくパースする
    - セクション名が複数ハイフン（'multi-word-section'）の場合も正しく処理する

- **実装 (GREEN)**:
  - ファイル: `app/lib/flow-auditor/operation/checkpointIdResolver.ts`
  - 実装内容:
    - 関数シグネチャ: `resolveCheckpointId(checkpointId: string): CheckpointResolution | null`
    - **パースアルゴリズム**:
      ```typescript
      // 形式: {flow}-{section}-{category}
      // 例: "design-flow-operation-requirements"
      // → flow: "design-flow", section: "operation", category: "requirements"

      const parts = checkpointId.split('-');
      if (parts.length < 3) return null;

      // flowは常に "{phase}-flow" 形式（例: design-flow, implementation-flow）
      const flow = `${parts[0]}-${parts[1]}`; // "design-flow"

      // sectionは3番目以降、categoryの前まで
      const category = parts[parts.length - 1]; // "requirements"
      const section = parts.slice(2, -1).join('-'); // "operation"

      return { flow, section, category };
      ```
    - 入力検証（null/undefined/空文字チェック）
    - 型定義: `CheckpointResolution = { flow: string; section: string; category: string }`

- **リファクタリング**:
  - エラーメッセージの詳細化（どの部分が不正かを明示）
  - 正規表現による厳密なバリデーション
  - flowの種類（design-flow, implementation-flow）の列挙型定義

##### 2.2.2. retryTargetCalculator

**目的**: チェックポイントID以降のアーカイブ対象ファイル計算

- **テスト実装 (RED)**:
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

  - ファイル: `app/lib/flow-auditor/operation/retryTargetCalculator.test.ts`
  - テストケース:
    - design-flowのチェックポイントID指定時、該当以降のdesign-flowファイル + 全implementation-flowファイルを返す
    - 該当チェックポイント自身も含まれる
    - exists: falseのファイルは除外される
    - checkpointIdが見つからない場合、空配列を返す
    - implementation-flowのチェックポイントID指定時（将来拡張用）、該当以降のimplementation-flowファイルのみを返す
    - 空配列を渡した場合、空配列を返す

- **実装 (GREEN)**:
  - ファイル: `app/lib/flow-auditor/operation/retryTargetCalculator.ts`
  - 実装内容:
    - 関数シグネチャ: `calculateRetryTargets(checkpointId: string, allCheckpoints: OperationCheckpoint[]): string[]`
    - **アルゴリズム**:
      ```typescript
      // 1. checkpointIdを解析
      const resolution = resolveCheckpointId(checkpointId);
      if (!resolution) return [];

      // 2. 対象チェックポイントのインデックスを検索
      const targetIndex = allCheckpoints.findIndex(cp => cp.id === checkpointId);
      if (targetIndex === -1) return [];

      // 3. flowに応じてアーカイブ対象を決定
      let affectedCheckpoints: OperationCheckpoint[];

      if (resolution.flow === 'design-flow') {
        // design-flowの場合: 該当以降のdesign-flow + 全implementation-flow
        const designFlowCheckpoints = allCheckpoints
          .filter(cp => cp.id.startsWith('design-flow'))
          .slice(targetIndex);
        const implementationFlowCheckpoints = allCheckpoints
          .filter(cp => cp.id.startsWith('implementation-flow'));
        affectedCheckpoints = [...designFlowCheckpoints, ...implementationFlowCheckpoints];
      } else if (resolution.flow === 'implementation-flow') {
        // implementation-flowの場合: 該当以降のimplementation-flowのみ
        affectedCheckpoints = allCheckpoints
          .filter(cp => cp.id.startsWith('implementation-flow'))
          .slice(targetIndex);
      } else {
        return [];
      }

      // 4. exists: trueのファイルのみ抽出
      return affectedCheckpoints
        .filter(cp => cp.exists)
        .map(cp => cp.filePath);
      ```
    - 依存関係ルール: design-flow変更時は全implementation-flowも影響を受ける

- **リファクタリング**:
  - flowの種類による分岐ロジックの整理（Strategy Pattern検討）
  - 依存関係ルールの外部設定化（拡張性向上）
  - テストケースの拡充（エッジケース追加）

##### 2.2.3. timestampGenerator

**目的**: アーカイブタイムスタンプ生成（YYYYMMDD_HHMMSS形式）

- **テスト実装 (RED)**:
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

  - ファイル: `app/lib/flow-auditor/operation/timestampGenerator.test.ts`
  - テストケース:
    - 正しいフォーマット（YYYYMMDD_HHMMSS）で返す
    - ゼロパディングが正しく適用される（例: 2025-01-09 08:05:03 → "20250109_080503"）
    - 同じDateオブジェクトを渡した場合、同じタイムスタンプを返す（純粋関数）
    - 引数なし（デフォルト）の場合、現在時刻のタイムスタンプを返す
    - 無効なDateオブジェクトの場合、エラーをスローする

- **実装 (GREEN)**:
  - ファイル: `app/lib/flow-auditor/operation/timestampGenerator.ts`
  - 実装内容:
    - 関数シグネチャ: `generateTimestamp(date: Date = new Date()): string`
    - **フォーマットアルゴリズム**:
      ```typescript
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}${month}${day}_${hours}${minutes}${seconds}`;
      ```
    - 入力検証（無効なDateオブジェクトチェック）
    - 純粋関数（同じ入力に対して同じ出力）

- **リファクタリング**:
  - タイムゾーン対応（UTC/JST切り替え）
  - カスタムフォーマットのサポート
  - ミリ秒の追加（衝突回避）

##### 2.2.4. checkpointStatus (共通ロジック)

**目的**: ステータス判定（pending/completed）

- **テスト実装 (RED)**:
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

  - ファイル: `app/lib/flow-auditor/checkpointStatus.test.ts` (既存共有)
  - テストケース:
    - existsがtrueの場合、'completed'を返す
    - existsがfalseの場合、'pending'を返す

- **実装確認**:
  - ファイル: `app/lib/flow-auditor/checkpointStatus.ts` (既存共有)
  - 既存実装を確認し、operationセクションでも使用可能であることを検証

#### 2.3. 🎨 UI層の実装（最も外側）

**原則**: ユーザーインタラクションとビューの描画のみ、ビジネスロジックはlibに委譲

##### 2.3.1. OperationSection (親コンポーネント)

**URL駆動の状態管理**:
  - **原則として、データ取得や状態計算のための`useEffect`を禁止します。**
  - 選択されたチェックポイントの状態はURLのSearch Params (`?selectedCheckpoint=...`) を介して受け取ります。
  - リトライコマンドの生成など、状態に依存するロジックはサーバーサイドの`loader`内で完結させ、UIコンポーネントは結果の表示に専念します。

**目的**: セクション全体の統合コンテナ、selectedCheckpointId統合

- **テスト実装 (RED)**:
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

  - ファイル: `app/components/flow-auditor/operation/OperationSection.test.tsx`
  - テストケース:
    - 全子コンポーネント（ServiceSelector, RefreshButton, RetryButton, LastUpdatedLabel）がレンダリングされる
    - selectedCheckpointIdがURL SearchParamsから正しく取得される
    - RefreshButtonクリック時、isRefreshingがtrueになる
    - RetryButtonクリック時、RetryModalが表示される
    - RetryModal閉じる時、isRetryModalOpenがfalseになる

- **実装 (GREEN)**:
  - ファイル: `app/components/flow-auditor/operation/OperationSection.tsx`
  - 実装内容:
    - **Props型定義**
    - **selectedCheckpointId取得**（URL SearchParams使用）
    - **内部状態管理**（isRefreshing, isRetryModalOpen, selectedService）
    - **ハンドラ実装**（handleRefresh, handleOpenRetryModal, handleRetry）
    - **レイアウト**: flexレイアウト、左から順に配置

- **リファクタリング**:
  - `useCallback`でハンドラのメモ化
  - ローディング状態の一元管理（`useReducer`検討）
  - エラーバウンダリの追加

（続く: ServiceSelector, RefreshButton, RetryButton, LastUpdatedLabel, RetryModal, Route更新、types.ts、globals.css更新の詳細は、generate-requests.mdの内容を踏襲）

##### 2.3.2～2.3.7. 各UIコンポーネントの実装

（ServiceSelector, RefreshButton, RetryButton, LastUpdatedLabel, RetryModal, Route更新の詳細は、上記のgenerate-requests.mdの内容に従う）

#### 2.4. 型定義とスタイル

##### 2.4.1. types.ts (型定義)
##### 2.4.2. globals.css 更新

（詳細は上記のgenerate-requests.mdに記載された内容を参照）

### Phase 2.4: アーキテクチャガードレール検証

**目的**: CLAUDE.mdに定義された自動チェック機構で、実装がアーキテクチャ規約を遵守しているか検証する

#### 2.4.1. 3大層分離チェック

- **実行**:
  ```bash
  node scripts/lint-structure.js
  ```

- **確認事項**:
  - ✅ data-io層にReactフック（useState, useEffect等）が含まれていないこと
  - ✅ lib層に副作用（fs, fetch, localStorage等）が含まれていないこと
  - ✅ lib層が他層（data-io, ui）をimportしていないこと
  - ✅ すべてのチェックがPASSすること

- **違反時の対処**:
  - data-io層でReactフック検出 → UI層に移動
  - lib層で副作用検出 → data-io層に移動
  - lib層で他層import検出 → 依存関係を逆転（DI/純粋関数化）

#### 2.4.2. コーディング規律チェック

- **実行**:
  ```bash
  node scripts/lint-template/engine.js
  ```

- **確認事項**:
  - ✅ ファイル行数が400行以内であること
  - ✅ 関数行数が50行以内であること
  - ✅ ハードコードされた色コード（#FFFFFF, rgb()等）がないこと
  - ✅ デザイントークン（var(--flow-auditor-*)）を使用していること
  - ✅ 禁止ワード（プロジェクトスコープ超過）が含まれていないこと

- **違反時の対処**:
  - **ファイル分割**（400行超過時）
  - **関数分割**（50行超過時）
  - **デザイントークンへの置き換え**（色コード検出時）
  - **スコープ遵守**（禁止ワード検出時）

### Phase 3: E2E拡張と統合確認

#### 3.1. Happy Pathの成功確認

- **実行**: `npm run test:e2e`
- **確認事項**: Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）

#### 3.2. 詳細E2Eテスト実装

- **追加シナリオ**:
  - 更新処理が500ms以内に完了することを確認（パフォーマンステスト）
  - リトライ処理が1秒以内に完了することを確認（パフォーマンステスト）
  - アーカイブ失敗時のロールバック処理が正常に動作すること
  - 不正なcheckpointId入力時に適切なエラーメッセージが表示されること

#### 3.3. E2Eテストのオールグリーンを確認

- **実行**: `npm run test:e2e`
- **確認事項**: すべてのE2Eテストが成功すること

#### 3.4. 表示確認&承認

- **起動**: `npm run dev`
- **確認項目**:
  1. 視覚的品質（サイバーパンクデザイン、グローエフェクト）
  2. インタラクション（ボタンクリック、モーダル表示）
  3. パフォーマンス（更新500ms以内、リトライ1秒以内）
  4. エラーハンドリング（アーカイブ失敗時のロールバック）
  5. アクセシビリティ（キーボード操作、スクリーンリーダー対応）

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1.  **再現テストの作成 (E2E or ユニット)**
2.  **原因特定とユニットテストの強化**
3.  **実装の修正 (GREEN)**
4.  **再現テストの成功確認 (GREEN)**
5.  **知見の共有**

---

## 5. 進捗ログ

| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|
| 2025-10-10 | TDD_WORK_FLOW.md生成 | ✅ Phase 1-3の詳細手順作成<br>✅ 3大層分離の明確化（副作用→ロジック→UI）<br>✅ func-spec.md/uiux-spec.md/file-list.md/generate-requests.mdの完全反映<br>✅ design-flow/TDD_WORK_FLOW.mdの構造を踏襲 | Phase 1: E2Eテスト実装開始 |

## 6. 学んだこと・気づき

（実装開始後、実際の経験から得られた知見を記録）

## 7. さらなる改善提案

- **リアルタイム更新**: ファイル監視により、ドキュメント作成時に自動的にチェックポイント状態を更新
- **アーカイブ履歴表示**: 過去のアーカイブ一覧を表示し、特定のタイムスタンプからの復元機能
- **バッチリトライ**: 複数のチェックポイントを一括選択してリトライする機能
- **進捗率の可視化**: セクションごとの進捗率をプログレスバーで表示し、開発完了度を定量的に把握
- **リトライプレビュー**: アーカイブ実行前に、影響ファイルの内容をプレビュー表示
- **キーボードショートカット**: 更新/リトライをキーボードで操作（Ctrl+R: 更新、Ctrl+Shift+R: リトライ）
- **エクスポート機能**: フロー状態をJSON/PNG形式でエクスポートし、外部ツールで活用
- **並列アーカイブ**: 大量ファイルアーカイブ時の並列処理による高速化
- **差分表示**: リトライ前後のファイル差分を表示し、変更内容を確認
