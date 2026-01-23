# 開発フロー数式マニフェスト

このドキュメントは、TDD開発フロー全体を絵文字数式で定義します。この数式が、あなたの行動の全工程と順序を規定します。

## 🧮 開発フロー数式（実行可能な設計図）

💭🏗️▶️🗾📚️🖼️📋️🗂️🧬🎭⛏️️👁️🎨🪨🚧

### 数式の展開

💭 project-spec.yaml
🏗️ npm run start-dev.js

💭＆🏗️
=▶️🗾

「High-Level Design」
▶️REQUIREMENTS_ANALYSIS_PIPE.md
＆🗾GUIDING_PRINCIPLES.md
=📚️🖼️

「Low-Level Design」
📚️func-spec.md
＆🖼️uiux-spec.md
=📋️🗂️🧬

📋️section-spec.yaml
& 🗂️file_list.md
& 🧬data-flow-diagram.md
= 🎭⛏️

🎭MOCK_POLICY.md
＆⛏️TDD_WORK_FLOW.md
= (👁️👁️🎨🚧🪨🚧🪨🚧🪨🚧🪨)

👁️e2e-screen-test
👁️e2e-section-test
🎨CSS実装 (layer2-*.css, layer3.ts, layer4.ts)
🪨route
🚧components.test
🪨components
🚧logic.test
🪨logic
🚧data-io.test
🪨data-io

## 📊 絵文字の意味

| 絵文字 | 意味 | 成果物 | Phase |
| :--- | :--- | :--- | :--- |
| 💭 | プロジェクト定義 | project-spec.yaml | 前提条件 |
| 🏗️ | 開発環境構築 | npm run start-dev.js | 前提条件 |
| ▶️ | 要件分析パイプライン | REQUIREMENTS_ANALYSIS_PIPE.md | Phase 1 |
| 🗾 | 指導原則 | GUIDING_PRINCIPLES.md | Phase 1 |
| 📚️ | 機能設計書 | func-spec.md | Phase 2 |
| 🖼️ | 画面仕様書 | uiux-spec.md | Phase 2 |
| 📋️ | 外部変数仕様書 | section-spec.yaml | Phase 3 |
| 🗂️ | ファイルリスト | file-list.md | Phase 3 |
| 🧬 | データフロー図 | data-flow-diagram.md | Phase 3 |
| 🎭 | モックポリシー | MOCK_POLICY.md | Phase 4 |
| ⛏️ | TDD作業手順書 | TDD_WORK_FLOW.md | Phase 4 |
| 👁️ | E2Eテスト | screen.spec.ts, section.spec.ts | Phase 5 |
| 🎨 | CSS実装 | layer2-*.css, layer3.ts, layer4.ts | Phase 5 |
| 🪨 | 実装 | route, components, logic, data-io | Phase 5 |
| 🚧 | テスト | *.test.tsx,*.test.ts | Phase 5 |

## 🔄 数式の読み方

### 基本構文

- **`A & B = C`**: AとBを組み合わせてCを生成
- **`(A B C ...)`**: 並列または繰り返し実行

### 例

1. **`💭＆🏗️ = ▶️🗾`**
   - プロジェクト定義と開発環境構築を前提として、要件分析パイプラインと指導原則を作成

2. **`▶️REQUIREMENTS_ANALYSIS_PIPE.md ＆ 🗾GUIDING_PRINCIPLES.md = 📚️🖼️`**
   - 要件分析パイプラインと指導原則を元に、機能設計書と画面仕様書を作成

3. **`(👁️👁️🎨🚧🪨🚧🪨🚧🪨🚧🪨)`**
   - E2Eテスト、CSS実装、実装・テストのループを実行

## 🎯 数式の絶対ルール

1. **順序厳守**: 数式の左から右へ順番に実行すること
2. **スキップ禁止**: 中間成果物を飛ばして次のステップに進んではならない
3. **逸脱禁止**: 数式に記載されていない手順は実行してはならない
4. **前提条件**: `💭`（project-spec.yaml）が存在しない場合、開発フローを開始してはならない

## 📚 参照ドキュメント

- `docs/boilerplate_architecture/開発フロー簡略図.md`: フロー全体像（元ドキュメント）
- `docs/boilerplate_architecture/DESIGN_BLUEPRINT_FLOW.md`: 設計書生成フローの詳細
- `prompts/*.md`: 各フェーズの具体的な実行手順
