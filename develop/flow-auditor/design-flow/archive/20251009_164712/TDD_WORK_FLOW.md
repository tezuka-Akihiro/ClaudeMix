# TDD作業手順書: Design Flow Section

## 1. 概要

**開発名**: Design Flow Section の実装
**目的**: 設計ドキュメント（func-spec.md, uiux-spec.md, spec.yaml）の存在確認結果を一覧表示し、設計プロセスの完了度を可視化する。

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1.  **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2.  **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3.  **E2E拡張**: 最初のE2Eテストが成功した後、エラーケース、境界値などの詳細なE2Eテストを追加し、品質を盤石にします。

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義) 

- **1. E2Eテストファイルの準備（画面レベル）**: 画面レベルのE2Eテストファイル `tests/e2e/flow-auditor.e2e.test.ts` を準備します。
  - **ファイルが存在しない場合**: `@GeneratorOperator` に依頼して、ファイルを新規作成します。
    - **依頼例**: `@GeneratorOperator "flow-auditor サービスの画面レベルE2Eテストを作成して"`
  - **ファイルが既に存在する場合**: 何もせず、次のステップに進みます。

- **2. E2Eテストファイルの準備（セクションレベル）**: セクションレベルのE2Eテストファイル `tests/e2e/flow-auditor/design-flow-section.e2e.test.ts` を準備します。
  - **ファイルが存在しない場合**: `@GeneratorOperator` に依頼して、ファイルを新規作成します。
    - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションのE2Eテストを作成して"`
  - **ファイルが既に存在する場合**: 何もせず、次のステップに進みます。

- **3. Happy Pathのテスト追記（セクションレベル）**: 準備したセクションレベルのテストファイルに、このセクションの最も重要な成功シナリオ（Happy Path）を検証するテストを**追記**します。
   - **テストシナリオ例**:
     - design-flowセクションが正常に表示される
     - 進捗ヘッダーに正しい進捗率（例: "📊 設計フロー進捗: 70% (7/10)"）が表示される
     - 進捗バーが正しい色と幅で表示される
     - 各フェーズグループ（Step 0, 1, 2）が正しく表示される
     - セクション別チェックポイントリスト（operation, design-flow, implementation-flow）が正しく表示される
     - チェックポイント項目が正しいステータス（✅/❌）で表示される
   - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、開発のゴールを定義します。
     - **セクションレベル**: 最も重要なユーザーアクションが成功するシナリオ。

 - **4. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
   - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: 層別TDD (ユニット/コンポーネント実装) 

#### 2.0. 🔌 副作用層の優先実装（共通ファイル存在確認）

**理由**: UI層とlib層が依存するファイル存在確認機能を先に実装します。

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、副作用層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスに、checkFileExistence という名前のdata-ioファイルを作成して（セクション共通）"`
- **2. テスト実装 (RED)**: `checkFileExistence.server.test.ts` に、以下のテストケースを記述します。
  - 正常系: ファイルが存在する場合、`true`を返す
  - 正常系: ファイルが存在しない場合、`false`を返す
  - 正常系: 複数ファイルの存在確認（`Promise.all`による並列処理）
  - 異常系: 無効なパスの場合、エラーハンドリング
- **3. 実装 (GREEN)**: `checkFileExistence.server.ts` を実装し、テストをパスさせます。
  - `fs.existsSync` を使用してファイル存在を確認
  - 並列処理による複数ファイル存在確認
- **4. リファクタリング**: エラーハンドリングやリソース管理を改善します。

#### 2.1. 🧠 純粋ロジック層の実装（共通ロジック）

**理由**: UI層が依存する進捗計算とステータス判定を先に実装します。

##### 2.1.1. checkpointStatus（ステータス判定）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスに、checkpointStatus という名前のlibファイルを作成して（セクション共通）"`
- **2. テスト実装 (RED)**: `checkpointStatus.test.ts` に、正常系・異常系・境界値のテストケースを記述します。
  - 正常系: `exists === true` の場合、ステータスが `completed` になる
  - 正常系: `exists === false` の場合、ステータスが `pending` になる
  - 境界値: チェックポイントリストが空の場合
- **3. 実装 (GREEN)**: `checkpointStatus.ts` を実装し、テストをパスさせます。
- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善します。

##### 2.1.2. progressCalculator（進捗率計算）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスに、progressCalculator という名前のlibファイルを作成して（セクション共通）"`
- **2. テスト実装 (RED)**: `progressCalculator.test.ts` に、正常系・異常系・境界値のテストケースを記述します。
  - 正常系: 完了数3、総数10の場合、進捗率が30%になる
  - 境界値: 完了数0、総数10の場合、進捗率が0%になる
  - 境界値: 完了数10、総数10の場合、進捗率が100%になる
  - 異常系: 総数が0の場合、エラーハンドリング（またはデフォルト0%）
- **3. 実装 (GREEN)**: `progressCalculator.ts` を実装し、テストをパスさせます。
- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善します。

#### 2.2. 🧠 純粋ロジック層の実装（design-flow固有ロジック）

##### 2.2.1. designFlowDefinition（チェックポイント定義）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、designFlowDefinition という名前のlibファイルを作成して"`
- **2. テスト実装 (RED)**: `designFlowDefinition.test.ts` に、正常系のテストケースを記述します。
  - 正常系: チェックポイント定義が正しく構造化されている
  - 正常系: Step 0（サービス登録）のチェックポイントが含まれる
  - 正常系: Step 1（設計フェーズ）のチェックポイントが含まれる
  - 正常系: Step 2（実装計画）のチェックポイントが含まれる
- **3. 実装 (GREEN)**: `designFlowDefinition.ts` を実装し、テストをパスさせます。
  - Step 0: project.toml, start-dev.js, REQUIREMENTS_ANALYSIS_PIPE.md
  - Step 1: GUIDING_PRINCIPLES.md, func-spec.md（全セクション）, uiux-spec.md（全セクション）, spec.yaml（全セクション）
  - Step 2: file-list.md, e2e-test-cases.md, generate-commands.md, TDD_WORK_FLOW.md
- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善します。

##### 2.2.2. phaseGroupBuilder（フェーズ別グループ構築）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、phaseGroupBuilder という名前のlibファイルを作成して"`
- **2. テスト実装 (RED)**: `phaseGroupBuilder.test.ts` に、正常系のテストケースを記述します。
  - 正常系: チェックポイントリストをフェーズ別にグループ化する
  - 正常系: Step 0（registration）、Step 1（design）、Step 2（planning）に分類される
- **3. 実装 (GREEN)**: `phaseGroupBuilder.ts` を実装し、テストをパスさせます。
- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善します。

##### 2.2.3. sectionCheckpointGrouper（セクション別チェックポイントグルーピング）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、純粋ロジック層のファイルを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、sectionCheckpointGrouper という名前のlibファイルを作成して"`
- **2. テスト実装 (RED)**: `sectionCheckpointGrouper.test.ts` に、正常系のテストケースを記述します。
  - 正常系: チェックポイントリストをセクション別（operation, design-flow, implementation-flow）にグループ化する
  - 正常系: 各セクションに該当するチェックポイントが正しく割り当てられる
- **3. 実装 (GREEN)**: `sectionCheckpointGrouper.ts` を実装し、テストをパスさせます。
- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善します。

#### 2.3. app/componentsの実装

##### 2.3.1. (初回のみ) サービス画面の作成

- **1. サービス全体ルートの作成**:
  - `@GeneratorOperator` に依頼して、サービス全体のルートファイルを作成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスのUIルートを作成して"`
  - このファイルは、各機能セクション（operation, design-flow, implementation-flow）のコンポーネントを呼び出すコンテナとなります。

##### 2.3.2. CheckpointItem（チェックポイント項目）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、CheckpointItem という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `CheckpointItem.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: `exists === true` の場合、✅アイコンとgreen-400色で表示される
  - 正常系: `exists === false` の場合、❌アイコンとred-400色で表示される
  - インタラクション: 未完了項目をクリックすると、`onCopyPath`が呼ばれる
- **3. 実装 (GREEN)**: `CheckpointItem.tsx` を実装し、テストをパスさせます。
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.3. PhaseHeader（フェーズヘッダー）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、PhaseHeader という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `PhaseHeader.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: フェーズ名とアイコンが正しく表示される
  - インタラクション: クリックすると、`onToggle`が呼ばれる
  - 状態変化: `isExpanded === true` の場合、"▼"アイコンが表示される
- **3. 実装 (GREEN)**: `PhaseHeader.tsx` を実装し、テストをパスさせます。
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.4. PhaseGroup（フェーズ別グループ）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、PhaseGroup という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `PhaseGroup.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: PhaseHeaderとCheckpointItemが正しく表示される
  - インタラクション: 折りたたみ/展開が正しく動作する
- **3. 実装 (GREEN)**: `PhaseGroup.tsx` を実装し、テストをパスさせます。
  - 子コンポーネント: PhaseHeader, CheckpointItem
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.5. SectionCheckpointList（セクション別チェックポイントリスト）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、SectionCheckpointList という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `SectionCheckpointList.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: セクション名（例: "operation"）が正しく表示される
  - 正常系: セクション内のチェックポイントリストが正しく表示される
  - インタラクション: セクションヘッダークリックで折りたたみ/展開
- **3. 実装 (GREEN)**: `SectionCheckpointList.tsx` を実装し、テストをパスさせます。
  - 子コンポーネント: CheckpointItem
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.6. ProgressBar（進捗バー）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、ProgressBar という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `ProgressBar.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: `progressRate === 30` の場合、幅30%のバーが表示される
  - 状態変化: `progressRate < 50` の場合、red-400色で表示される
  - 状態変化: `50 <= progressRate < 100` の場合、yellow-400色で表示される
  - 状態変化: `progressRate === 100` の場合、green-400色で表示される
- **3. 実装 (GREEN)**: `ProgressBar.tsx` を実装し、テストをパスさせます。
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.7. ProgressHeader（進捗ヘッダー）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、ProgressHeader という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `ProgressHeader.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: `completedCount === 7`, `totalCount === 10`, `progressRate === 70` の場合、"📊 設計フロー進捗: 70% (7/10)"が表示される
  - 状態変化: 進捗率に応じて色が変化する（red-400 / yellow-400 / green-400）
- **3. 実装 (GREEN)**: `ProgressHeader.tsx` を実装し、テストをパスさせます。
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.8. DesignFlowSection（親コンポーネント）

- **1. ファイル生成**: `@GeneratorOperator` に依頼して、UIコンポーネントを生成します。
  - **依頼例**: `@GeneratorOperator "flow-auditor サービスの design-flow セクションに、DesignFlowSection という名前のUIコンポーネントを作成して"`
- **2. テスト実装 (RED)**: `DesignFlowSection.test.tsx` に、コンポーネントが正しくレンダリングされるかのテストを記述します。
  - 正常系: ProgressHeader, ProgressBar, PhaseGroup, SectionCheckpointListが正しく表示される
  - 統合テスト: loaderからのデータが正しく各子コンポーネントに渡される
- **3. 実装 (GREEN)**: `DesignFlowSection.tsx` を実装し、テストをパスさせます。
  - 子コンポーネント: ProgressHeader, ProgressBar, PhaseGroup, SectionCheckpointList
- **4. リファクタリング**: コードの可読性を向上させます。

##### 2.3.9. flow-auditor.tsx（メインルート）

- **1. テスト実装 (RED)**: `flow-auditor.test.tsx` に、Routeが正しく動作するかのテストを記述します。
  - loader: チェックポイントの状態を正しく取得する
  - UI: DesignFlowSectionが正しく表示される
- **2. 実装 (GREEN)**: `flow-auditor.tsx` を実装し、テストをパスさせます。
  - loader: `checkFileExistence.server.ts`, `designFlowDefinition.ts`, `phaseGroupBuilder.ts`, `sectionCheckpointGrouper.ts` を利用してデータを取得
  - UI: DesignFlowSectionを呼び出す
- **3. リファクタリング**: コードの可読性を向上させます。

### Phase 3: E2E拡張と統合確認 

- **1. Happy Pathの成功確認**: `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認します。
- **2. 詳細E2Eテスト実装**: E2Eテストファイルに、エラーケース、境界値、他機能との連携など、より詳細なシナリオのテストケースを追記します。
   - **テストシナリオ例**:
     - エラーケース: 設計ドキュメントが1つも存在しない場合の表示
     - 境界値: 完了数0、総数0の場合の進捗率表示
     - インタラクション: 未完了項目クリック時のパスコピー
     - インタラクション: セクションヘッダークリック時の折りたたみ/展開
     - アクセシビリティ: `aria-label`の正しい設定
   - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、品質を盤石にします。
     - **セクションレベル**: 主要アクションのエラーハンドリング。
     - **コンポーネントレベル**: バリデーション、インタラクション、アクセシビリティの検証。
- **3. E2Eテストのオールグリーンを確認**: `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認します。
- **4. 表示確認&承認**: `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認します。
  - design-flowセクションが正常に表示される
  - 進捗率が正しく表示される
  - 進捗バーが正しい色と幅で表示される
  - 各フェーズグループが正しく展開/折りたたみできる
  - セクション別チェックポイントリストが正しく表示される
  - チェックポイント項目が正しいステータスで表示される
  - 未完了項目をクリックするとパスがコピーされる
- **5. (任意) モデルベーステストの検討**: 状態が複雑に変化するコンポーネント（PhaseGroup、SectionCheckpointList）に対して、`E2E_TEST_CRITERIA.md` のモデルベーステスト(MCP)の導入を検討し、UIの堅牢性をさらに高めます。

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1.  **再現テストの作成 (E2E or ユニット)**: まず、発見された不具合を再現する**失敗するテスト**を記述します。これは多くの場合、E2Eテストか、特定のコンポーネントの統合テストになります。
2.  **原因特定とユニットテストの強化**:
    - デバッグを行い、不具合の根本原因となっている純粋ロジック（lib）やコンポーネントを特定します。
    - その原因を最小単位で再現する**失敗するユニットテスト**を追加します。
3.  **実装の修正 (GREEN)**: 追加したユニットテストがパスするように、原因となったコードを修正します。
4.  **再現テストの成功確認 (GREEN)**: 最初に作成した再現テスト（E2E/統合テスト）を実行し、こちらもパスすることを確認します。
5.  **知見の共有**: この経験を「学んだこと・気づき」セクションに記録し、チームの知識として蓄積します。

---

## 5. 進捗ログ
| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|
| 2025-10-04 | Design Flow完全実装 | Phase 1-3全完了 (E2E 2/2 GREEN) | operation/implementation-flow実装 |

**Phase 1完了**: E2E First
- 画面レベルE2E作成 (RED確認)
- セクションレベルE2E作成 (RED確認)

**Phase 2完了**: Double-Loop TDD
- 2.0: data-io層 - checkFileExistence (4テストパス)
- 2.1-2.2: lib層 - 5ファイル実装 (checkpointStatus, progressCalculator, designFlowDefinition, phaseGroupBuilder, sectionCheckpointGrouper)
- 2.3: UI層 - 7コンポーネント + 1ルート実装

**Phase 3完了**: E2E統合確認
- 画面レベルE2E: ✅ PASS
- セクションレベルE2E: ✅ PASS
- アクセスURL: http://localhost:3000/flow-auditor

**コミット**: feature/flow-auditor-design-flow (7fb2958)

## 6. 学んだこと・気づき
- **Outside-In TDDの有効性**: E2Eテストをゴールとして設定することで、実装の方向性が明確になった
- **型システムの恩恵**: TypeScriptの型推論により、lib層とUI層の連携がスムーズ
- **Vitestモックの注意点**: fs/promisesのモック時にdefault exportが必要（CommonJS/ESM互換性）
- **Playwrightの制約**: 小さいUI要素（h-2など）はtoBeVisible()でhiddenと判定される → toHaveCount()使用
- **3層アーキテクチャの分離**: data-io(副作用) → lib(純粋ロジック) → UI(表示)の明確な責務分離が保守性向上に貢献

## 7. さらなる改善提案
- **operationセクション実装**: Refresh/Retryボタン、ServiceSelector実装
- **implementation-flowセクション実装**: TDD進捗監視機能
- **ユニットテストの拡充**: 現在はE2Eテストのみ。lib層の詳細なユニットテスト追加
- **エラーハンドリング強化**: ファイル読み込みエラー時のフォールバック処理
- **パフォーマンス最適化**: 19チェックポイントの並列ファイル存在確認（現在はPromise.all使用済み）
- **UIアニメーション**: 進捗バーのトランジション、チェックポイント更新時のフィードバック
- **アクセシビリティ向上**: キーボードナビゲーション、スクリーンリーダー対応
