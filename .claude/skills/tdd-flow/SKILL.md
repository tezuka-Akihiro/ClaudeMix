---
name: tdd-flow
description: 新規機能開発や改修のTDD開発フロー全体を実行する。設計書生成から実装・テストまで、開発フロー数式マニフェストに従って自律的にタスクを完了する。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion, Task
---

# TDD開発フロースキル

新規機能開発や改修のTDD開発フロー全体を実行するスキルです。設計から実装まで、開発フロー数式マニフェストに従って自律的にタスクを完了します。

## When to Use

- 「新規機能を開発して」と指示された時
- 「TDD開発フローを実行して」と言われた時
- 設計書から実装まで一貫して行いたい時
- 「Phase 2から再開」のように特定フェーズから再開したい時

## コアミッション

1. **開発フロー数式マニフェストに従う**: 絵文字数式で定義された全工程を順番に実行
2. **自律的に判断・実行**: サブエージェント利用、ファイル生成、リント実行を自分で判断
3. **進捗を記録**: `TDD_WORK_FLOW.md`を常に最新に保つ
4. **ガードレールを実行**: コミット前に必ずすべてのリントを実行し、合格するまで修正
5. **3大層アーキテクチャを遵守**: UI層、純粋ロジック層、副作用層の責務を厳守

## 実行フロー概要

```text
Phase 1: High-Level Design (▶️🗾)
    ↓
Phase 2: Low-Level Design (📚️🖼️)
    ↓
Phase 3: Design Artifacts (📋️🗂️🧬)
    ↓
Phase 4: Implementation Prep (🎭⛏️)
    ↓
Phase 5: Implementation
    ├─ 5.1: E2Eテスト作成 (👁️)
    ├─ 5.2: CSS実装 (🎨)
    └─ 5.3: TDD実装ループ (🪨🚧)
    ↓
完成・コミット
```

## 各フェーズの概要

| Phase | 絵文字 | 成果物 | prompts |
| :--- | :--- | :--- | :--- |
| **Phase 1: High-Level Design** | ▶️🗾 | REQUIREMENTS_ANALYSIS_PIPE.md, GUIDING_PRINCIPLES.md | `prompts/01-high-level-design.md` |
| **Phase 2: Low-Level Design** | 📚️🖼️ | func-spec.md, uiux-spec.md | `prompts/02-low-level-design.md` |
| **Phase 3: Design Artifacts** | 📋️🗂️🧬 | section-spec.yaml, file-list.md, data-flow-diagram.md | `prompts/03-design-artifacts.md` |
| **Phase 4: Implementation Prep** | 🎭⛏️ | MOCK_POLICY.md, TDD_WORK_FLOW.md | `prompts/04-implementation-prep.md` |
| **Phase 5.1: E2Eテスト作成** | 👁️ | E2E Screen Test, E2E Section Test | `prompts/05-01-e2e-tests.md` |
| **Phase 5.2: CSS実装** | 🎨 | Layer 2/3/4 CSS | `prompts/05-02-css.md` |
| **Phase 5.3: TDD実装ループ** | 🪨🚧 | Routes/Components/Logic/Data-IO | `prompts/05-03-tdd-loop.md` |

詳細は `docs/phase-overview.md` を参照。

## 途中再開

「Phase 2から再開」のように指定可能。該当フェーズのプロンプトから実行を開始します。

## ガードレール

コード生成後、コミット前に以下のチェックを自律的に実行し、不合格の場合は自己修正してください：

| ガードレール項目 | 対応するスクリプト | 違反時の対処 |
| :--- | :--- | :--- |
| **I. コーディング規律の強制** | `./scripts/run-lint.sh` | 行数制限（ファイル400行）や、デザイントークン以外のハードコードを検出。違反箇所を最小限の修正で是正。 |
| **II. スコープ逸脱の監視** | `./scripts/run-lint.sh` | 禁止ワードを検出。違反箇所は直ちに削除し、MVPスコープを遵守。 |
| **III. スタイリング規律の強制** | `STYLING_CHARTER.md` | 実装者は常に「Tailwindクラス」のみを参照。`globals.css`のカスタムクラスへの直接参照は禁止。 |
| **IV. スタイリング規律の検証** | `./scripts/run-css-lint.sh` | `globals.css`の規約違反を検出。`tests/lint/css-arch-layer-report.md`に従って修正。 |
| **V. 全ガードレール一括実行** | `./scripts/run-all-checks.sh` | すべてのガードレールを順番に実行し、総合的な品質を確認。 |

詳細は `docs/guardrails.md` を参照。

## generator-operatorとの連携

Phase 1〜4では、各設計書のテンプレート生成時に `generator-operator` スキルを呼び出します。

```text
# 例: func-spec.md生成
`generator-operator`スキルを使用してfunc-spec.mdを生成します。
パラメータ: service=blog, section=posts
```

詳細は `docs/generator-collaboration.md` を参照。

## 成果物

| フェーズ | 成果物 | 配置場所 |
| :--- | :--- | :--- |
| Phase 1 | GUIDING_PRINCIPLES.md | `develop/{service}/GUIDING_PRINCIPLES.md` |
| Phase 2 | func-spec.md, uiux-spec.md | `develop/{service}/{section}/` |
| Phase 3 | section-spec.yaml, file-list.md, data-flow-diagram.md | `app/specs/{service}/`, `develop/{service}/{section}/` |
| Phase 4 | MOCK_POLICY.md, TDD_WORK_FLOW.md | `develop/{service}/{section}/` |
| Phase 5.1 | E2E Screen Test, E2E Section Test | `tests/e2e/{service}/{section}/` |
| Phase 5.2 | Layer 2/3/4 CSS | `app/styles/{service}/` |
| Phase 5.3 | Routes, Components, Logic, Data-IO, Tests | `app/routes/`, `app/components/`, `app/lib/`, `app/data-io/` |

## 参照ドキュメント

| ファイル | 役割 |
| :--- | :--- |
| `prompts/*.md` | 各フェーズの金型 |
| `scripts/*.sh` | ガードレール実行ラッパー（定型化されたコマンド実行） |
| `docs/flow-formula.md` | 開発フロー数式マニフェスト（絵文字数式の詳細） |
| `docs/master-rules.md` | 最上位行動原則（マスタールール） |
| `docs/guardrails.md` | ガードレール実行ルール |
| `docs/phase-overview.md` | 各フェーズの詳細と成果物 |
| `docs/generator-collaboration.md` | generator-operatorとの連携方法（REQUIREMENTS_ANALYSIS_PIPEの統合） |

## 外部ドキュメント参照

| ドキュメント | 役割 |
| :--- | :--- |
| `docs/boilerplate_architecture/DESIGN_BLUEPRINT_FLOW.md` | 設計書生成フローの詳細 |

**Note**: 以下のルールは `.claude/rules/` で自動的に適用されます：
- アーキテクチャルール（architecture/）
- スタイリングルール（styling/）
- テスト基準（testing/）

## 連携スキル

- **generator-operator**: 設計書テンプレート生成（Phase 1〜4）
- **debugger**: 実装時のエラー診断・修正（Phase 5）
- **architecture-guardian**: アーキテクチャ違反の検出・修正提案（全フェーズ）

## 注意事項

1. **フロー数式マニフェストが最高位**: `docs/flow-formula.md`に記載されていない手順は実行禁止
2. **自律性の原則**: オペレーター（人間）からの指示は、「Phase 2.1を完了せよ」など、フローのステップ指定のみ。サブエージェント利用、ファイル生成、リント実行のすべてを自律的に判断・実行
3. **進捗記録の徹底**: 作業完了時、またはステータス変更時、必ず `TDD_WORK_FLOW.md` の進捗ログを正確に更新
4. **ガードレールの必須実行**: コミット前に必ずすべてのガードレールを実行し、合格するまで修正
5. **3大層分離の絶対遵守**: UI層、純粋ロジック層、副作用層の責務を厳守（ARCHITECTURE_MANIFESTO2.md参照）
6. **SSoT原則の遵守**: すべてのリテラル値は`*-spec.yaml`に定義（YAML_REFERENCE_GUIDE.md参照）
