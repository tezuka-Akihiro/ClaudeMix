# Phase 3: Design Artifacts (📋️🗂️🧬)

あなたは、設計書を元に実装に必要なアーティファクト（成果物）を生成します。

## 🎯 目的

機能設計書と画面仕様書を分析し、**3大層分離アーキテクチャ**に準拠した実装ファイルリストとデータフロー図を作成する。

## 📋 成果物

1. **section-spec.yaml**: 外部変数仕様書（UIに依存しない設定値）
2. **file-list.md**: 実装ファイルリスト（3大層分離に準拠）
3. **data-flow-diagram.md**: データフロー図（Mermaid形式）

## 📍 前提条件

- Phase 2が完了している（func-spec.md, uiux-spec.mdが存在）
- セクション名が決定している

## ⚙️ 実行手順

### ステップ 1: section-spec.yaml（外部変数仕様書）の生成

1. **generator-operator**スキルを使用してテンプレートを生成します。

   ```
   `generator-operator`スキルを使用してspec.yamlを生成します。
   パラメータ: service={service}, section={section}
   ```

2. **出力先**: `app/specs/{service}/{section}-spec.yaml`

3. **内容記述**: `GUIDING_PRINCIPLES.md`を参考に、**UIに依存しない設定値**として以下を記述します：
   - API仕様、エンドポイント定義
   - データ型定義、バリデーションルール
   - 定数、メッセージテキスト
   - UIテキスト（ボタンラベル、エラーメッセージなど）

4. **検証**:
   ```bash
   node scripts/lint-template/engine.js app/specs/{service}/{section}-spec.yaml
   ```

5. **型定義の作成**: インターフェース定義を `{section}-spec.yaml` を見て `app/specs/{service}/types.ts` に作成します。

### ステップ 2: file-list.md（実装ファイルリスト）の作成

**目的**: 機能設計書と画面仕様書を分析し、3大層分離アーキテクチャに準拠した実装ファイルとテストファイルのリストを作成する。

**入力**: `func-spec.md`, `uiux-spec.md`

**出力**: `develop/{service}/{section}/file-list.md`

**指示**:

1. `func-spec.md`と`uiux-spec.md`を詳細に読み込む。

2. `ARCHITECTURE_MANIFESTO2.md`に定義されている3大層分離（UI, lib, data-io）の原則を厳格に適用する。

3. 各層の責務に基づき、機能実現のために必要な**すべての実装ファイルとテストファイル**を洗い出す。

4. ファイルパスは`scripts/generate/config.json`の`pathPattern`に従い、正確に記述する。
   - **例外**: `common`セクションのコンポーネントは、`app/components/{service}/common/`配下に配置する。

5. リストアップするファイルは、以下の形式で記述する。

   ```markdown
   # file-list.md - {section} Section

   ## 1. UI層（Routes）
   | ファイル名 | パス |
   | :--- | :--- |
   | {section}.tsx | app/routes/{service}.{section}.tsx |

   ## 2. UI層（Components）
   | ファイル名 | パス |
   | :--- | :--- |
   | {Component}.tsx | app/components/{service}/{section}/{Component}.tsx |
   | {Component}.test.tsx | app/components/{service}/{section}/{Component}.test.tsx |

   ## 3. 純粋ロジック層（lib層）
   | ファイル名 | パス |
   | :--- | :--- |
   | {logic}.ts | app/lib/{service}/{section}/{logic}.ts |
   | {logic}.test.ts | app/lib/{service}/{section}/{logic}.test.ts |

   ## 4. 副作用層（data-io層）
   | ファイル名 | パス |
   | :--- | :--- |
   | {dataAccess}.server.ts | app/data-io/{service}/{section}/{dataAccess}.server.ts |
   | {dataAccess}.test.ts | app/data-io/{service}/{section}/{dataAccess}.test.ts |
   ```

6. 検証:
   ```bash
   node scripts/lint-template/engine.js develop/{service}/{section}/file-list.md
   ```

### ステップ 3: data-flow-diagram.md（データフロー図）の作成

**目的**: `file-list.md`を基に、コンポーネント間の依存関係とデータフローをMermaid図として可視化し、オペレーターによる設計レビューを容易にする。

**入力**: `file-list.md`

**出力**: `develop/{service}/{section}/data-flow-diagram.md`

**指示**:

1. `file-list.md`を読み込み、各ファイルの層（UI, lib, data-io）と依存関係を解析する。

2. Remixのデータフロー（Route → Component, Route → data-io → lib）を考慮し、Mermaidの`graph TD`形式で図を生成する。

3. 生成された図は、オペレーターがAIの設計意図を承認するためのレビュー資料となる。

4. 検証:
   ```bash
   node scripts/lint-template/engine.js develop/{service}/{section}/data-flow-diagram.md
   ```

### ステップ 4: 設計レビュー

以下をオペレーター（人間）に報告し、承認を得る：

1. **ファイル構成の妥当性**:
   - 3大層分離に準拠しているか
   - 必要なファイルが漏れなくリストアップされているか

2. **データフローの正確性**:
   - 依存関係が正しいか（UI→data-io、data-io→lib、libは独立）
   - 循環参照がないか

3. **次フェーズへの準備**:
   - Phase 4（Implementation Prep）で必要な情報が揃っているか

## ✅ 完了条件

- [ ] section-spec.yamlが生成され、リント検証が合格している
- [ ] types.tsが生成され、型定義が正しい
- [ ] file-list.mdが生成され、3大層分離に準拠している
- [ ] data-flow-diagram.mdが生成され、データフローが正確に可視化されている
- [ ] オペレーターの承認を得ている

## 🔗 次フェーズ

**Phase 4: Implementation Prep** (`prompts/04-implementation-prep.md`)

## 📚 参照ドキュメント

- `docs/generator-collaboration.md`: テンプレート生成の詳細手順
- `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md`: 3大層アーキテクチャの詳細
- `scripts/generate/config.json`: ファイルパスのパターン定義
- `develop/{service}/{section}/func-spec.md`: 機能設計書
- `develop/{service}/{section}/uiux-spec.md`: 画面仕様書
