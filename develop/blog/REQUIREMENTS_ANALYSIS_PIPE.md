# REQUIREMENTS_ANALYSIS_PIPE.md

## 📌 共通セクション (`common`) について

サービス全体で共有される共通コンポーネント（ヘッダー、フッターなど）は、`common`という名前の架空のセクションとして扱います。

**実装順序**: `common`セクションは、他のセクション（design-flow, implementation-flowなど）よりも**先に実装**してください。他のセクションが共通コンポーネントに依存する可能性があるためです。

**コンポーネント配置**: `common`セクションで実装されるコンポーネントは、`app/components/blog/common/`配下に配置します。これは、そのサービス内での共通資産として管理するためです。

**設計書の作成**: `common`セクションの設計書（`func-spec.md`, `uiux-spec.md`など）は、他のセクションと同様に`develop/blog/common/`配下に作成します。

---

## GUIDING_PRINCIPLES.md
1. `project.toml` を参考に内容を記載します。
2. `node scripts/lint-template/engine.js develop/blog/GUIDING_PRINCIPLES.md` を実行して内容を検証します。

## func-spec.md（機能設計書）
1. **@GeneratorOperator** に依頼してテンプレートを生成します。
   ~~~
   @GeneratorOperator "func-spec.mdを生成してください。service: blog, section: {section}"
   ~~~
2. **出力先**: `develop/blog/<section>/func-spec.md`（設計ドキュメントとして集約管理）
3. `GUIDING_PRINCIPLES.md` を参考に、以下を**3大層分離の観点**で記述します：
   - **app/components要件**: ユーザーインターフェース、ユーザー体験
   - **🧠 純粋ロジック要件**: ビジネスルール、計算ロジック（副作用なし）
   - **🔌 副作用要件**: API通信、データベース操作、外部システム連携
4. `node scripts/lint-template/engine.js develop/blog/<section>/func-spec.md` を実行して内容を検証します。

## uiux-spec.md（画面仕様書）
1. **@GeneratorOperator** に依頼してテンプレートを生成します。
   ~~~
   @GeneratorOperator "uiux-spec.mdを生成してください。service: blog, section: {section}"
   ~~~
2. **出力先**: `develop/blog/<section>/uiux-spec.md`（設計ドキュメントとして集約管理）
3. `GUIDING_PRINCIPLES.md` を参考に、**UI層の責務分離**を意識して記述します：
   - **Route責務**: データフロー、loader/action、ページ全体の構成
   - **Component責務**: 再利用可能なUI部品、表示ロジック
4. ワイヤーフレーム、UIコンポーネント構成、インタラクションなどを定義します。
5. `node scripts/lint-template/engine.js develop/blog/<section>/uiux-spec.md` を実行して内容を検証します。

## spec.yaml（外部変数仕様書）
1. **@GeneratorOperator** に依頼してテンプレートを生成します。
   ~~~
   @GeneratorOperator "spec.yamlを生成してください。service: blog, section: {section}"
   ~~~
2. **出力先**: `develop/blog/<section>/spec.yaml`（設計ドキュメントとして集約管理）
3. `GUIDING_PRINCIPLES.md` を参考に、**UIに依存しない設定値**として以下を記述します：
   - API仕様、エンドポイント定義
   - データ型定義、バリデーションルール
   - 定数、メッセージテキスト
4. **注意**: 最終的に `app/lib/` への統合プロセスを別途検討します。
5. `node scripts/lint-template/engine.js develop/blog/<section>/spec.yaml` を実行して内容を検証します。

## file-list.md（実装ファイルリスト）
**目的**: 機能設計書と画面仕様書を分析し、3大層分離アーキテクチャに準拠した実装ファイルとテストファイルのリストを作成する。
**入力**: `func-spec.md`, `uiux-spec.md`
**出力**: `develop/blog/<section>/file-list.md`
**指示**:
1.  `func-spec.md` と `uiux-spec.md` を詳細に読み込む。
2.  `ARCHITECTURE_MANIFESTO2.md` に定義されている3大層分離（UI, lib, data-io）の原則を厳格に適用する。
3.  各層の責務に基づき、機能実現のために必要な**すべての実装ファイルとテストファイル**を洗い出す。
4.  ファイルパスは `scripts/generate/config.json` の `pathPattern` に従い、正確に記述する。
   - **例外**: `common`セクションのコンポーネントは、`app/components/blog/common/` 配下に配置する。
5.  リストアップするファイルは、以下の形式で記述する。
    ~~~markdown
    # file-list.md - operation Section
    
    ## 2. UI層（Phase 2）
    | ファイル名 | パス |
    |:---|:---|
    | OperationSection.tsx | app/components/service-name/operation/OperationSection.tsx |
    | RetryModal.tsx | app/components/service-name/operation/RetryModal.tsx |
    
    ## 3. 純粋ロジック層（lib層、Phase 2）
    | ファイル名 | パス |
    |:---|:---|
    | retryTargetCalculator.ts | app/lib/service-name/operation/retryTargetCalculator.ts |
    
    ## 4. 副作用層（data-io層、Phase 2）
    | ファイル名 | パス |
    |:---|:---|
    | archiveFiles.server.ts | app/data-io/service-name/operation/archiveFiles.server.ts |
    ~~~
   - このファイルが、後述する「設計レビュー図」の元データとなります。
6. `node scripts/lint-template/engine.js develop/blog/<section>/file-list.md` を実行して内容を検証します。

## data-flow-diagram.md（データフロー図）
**目的**: `file-list.md`を基に、コンポーネント間の依存関係とデータフローをMermaid図として可視化し、オペレーターによる設計レビューを容易にする。
**入力**: `file-list.md`
**出力**: `develop/blog/<section>/data-flow-diagram.md`
**指示**:
1.  `file-list.md`を読み込み、各ファイルの層（UI, lib, data-io）と依存関係を解析する。
2.  Remixのデータフロー（Route -> Component, Route -> data-io -> lib）を考慮し、Mermaidの`graph TD`形式で図を生成する。
3.  生成された図は、オペレーターがAIの設計意図を承認するためのレビュー資料となる。
4. `node scripts/lint-template/engine.js develop/blog/<section>/data-flow-diagram.md` を実行して内容を検証します。

## TDD_WORK_FLOW.md（開発手順書）
1. `docs\boilerplate_architecture\DESIGN_BLUEPRINT_FLOW.md` に従って中間データを用意する。
2. **出力先**: `develop/blog/<section>/TDD_WORK_FLOW.md`