# `generate` スクリプト

このディレクトリには、プロジェクトのファイル生成を自動化し、開発プロセスを標準化するためのスクリプトが含まれています。

## 概要

中心となるのは `npm run generate` コマンドです。これは、AIエージェントが使用することを前提とした、引数ベースのファイル生成ツールです。プロジェクトで定義された「3大層分離アーキテクチャ」に準拠した実装ファイルとテストファイルを、コマンドラインから直接生成します。

## 実行ポリシー: サブエージェント経由での利用

**重要**: この `npm run generate` コマンドは、低レベルなツールであり、AIエージェントや人間開発者が**直接実行することは固く禁止されています。**

すべてのファイル生成は、必ず専門のサブエージェントである **`@GeneratorOperator`** を介して実行されなければなりません。

### なぜ直接実行が禁止されるのか？

`@GeneratorOperator`を介さずにコマンドを直接実行することは、アーキテクチャの「ガードレール」から逸脱し、以下のような致命的なリスクを生み出します。

- **アーキテクチャ違反**: 純粋ロジック層(`lib`)に副作用のあるコードが混入するなど、3大層分離の原則が破壊されます。
- **品質のばらつき**: 引数の渡し間違いや解釈の違いにより、意図しない場所にファイルが生成される可能性があります。
- **非効率な手戻り**: 規約違反のコードが後工程のLinterやレビューで検出され、大規模な手戻りが発生します。

`@GeneratorOperator`は、これらのヒューマンエラー（AIエラー）を防ぎ、開発プロセス全体を保護します。

| 比較項目 | 手動生成 / コマンド直接実行 | サブエージェント経由の生成 |
| :--- | :--- | :--- |
| **規約遵守** | あなたの解釈やコマンド知識に依存 | **`@GeneratorOperator` が実行を保証**し、**`@GeneratorMaintainer` がテンプレートを保証** |
| **品質** | ばらつきが生じやすい | **テンプレートにより一貫性が保たれる** |
| **効率** | コマンドの調査や間違いによる手戻りが発生 | **`@GeneratorOperator` に任せることで、最初から規約に準拠したコードで開発を開始できる** |

詳細は `docs/knowledges/テンプレート起点コーディング.md` を参照してください。

## メリットの詳細

- **規律の強制**: `@GeneratorOperator` は、コマンドの引数を正しく構築し、アーキテクチャ規律に沿ったファイル生成を保証する唯一の担当者です。
- **品質の担保**: 直接実行は、引数の渡し間違いや規約違反のコード生成につながり、後工程で大規模な手戻りを発生させる原因となります。
- **思想の具現化**: このルールは、「規約をドキュメントとして書く」のではなく、「規約をサブエージェントの振る舞いとして実装する」という、このボイラープレートの核心思想を具現化するものです。

詳細は `docs/knowledges/テンプレート起点コーディング.md` を参照してください。

## 使い方

```bash
npm run generate -- --category <category> [--ui-type <ui-type>] --service <service> --section <section> --name <name>
```

### 引数

- `--category`: 生成するファイルの層を指定します (`ui`, `lib`, `data-io`, `documents`)。
- `--ui-type`: `category`が`ui`の場合に指定します (`route`, `component`)。
- `--document-type`: `category`が`documents`の場合に指定します (`func-spec`, `uiux-spec`など)。
- `--service`: 所属するサービス名。
- `--section`: 所属するセクション名。
- `--name`: ファイル名（クラス名やコンポーネント名）。

### 例

**例1 (純粋ロジック層):** `app/lib/sales/summary/ProfitCalculator.ts` とそのテストを生成する場合

```bash
npm run generate -- --category lib --service sales --section summary --name ProfitCalculator
```

**例2 (UI層 - コンポーネント):** `app/components/sales/summary/SalesChart.tsx` とそのテストを生成する場合

```bash
npm run generate -- --category ui --ui-type component --service sales --section summary --name SalesChart
```

**例3 (ドキュメント - spec.yaml):** `app/specs/sales/summary-spec.yaml` を生成する場合

```bash
npm run generate -- --category documents --document-type spec-yaml --service sales --section summary
```

### 生成されるファイル

- **実装ファイル**: `app/` ディレクトリ配下の適切な場所に生成されます。
- **テストファイル**: 実装ファイルと同時に、対応するテストファイル（`.test.ts` または `.test.tsx`）も自動で生成されます。これにより、TDD（テスト駆動開発）が自然に促進されます。
- **設計ドキュメント**: `develop/` ディレクトリ配下に、機能設計書や画面仕様書などの設計ドキュメントが生成されます。

## 📜 生成履歴の管理

`npm run generate`コマンドが実行されるたびに、その実行履歴が記録されます。これにより、プロジェクト内のファイルがいつ、どのようなパラメータで生成されたかを追跡できます。

### 履歴ファイルの場所

- **パス**: `tests/scripts/generate/generation.log`

このファイルはGitの追跡対象に含めることを推奨します。これにより、コードレビュー時に「どのファイルが自動生成されたか」の背景情報として役立ちます。

### 履歴のフォーマット

履歴は1行1レコードで、以下の形式で追記されます。

```text
[ISO形式のタイムスタンプ] npm run generate -- <実行された引数>
```

**例:**

```text
[2024-05-22T10:30:00.123Z] npm run generate -- --category lib --service blog --section posts --name PostFetcher
```

## 設定

生成可能なファイルの種類、パス、使用するテンプレートは、すべて `scripts/generate/config.json` ファイルで一元管理されています。新しい種類のファイルを追加したい場合や、既存のパスを変更したい場合は、このファイルを編集してください。
