# TDD開発フロー実行

あなたは、新規機能開発や改修のTDD開発フローを実行します。以下の規範に従い、自律的にタスクを完了してください。

## 🥇 最上位行動原則（マスター・ルール）

- **唯一の規範**: 開発フローは以下の2層で定義されています。他のドキュメントの記述と矛盾する場合、これらが常に優先されます。
  - **Lv1: フロー骨格** (`docs/boilerplate_architecture/開発フロー簡略図.md`): 絵文字数式による開発の全体構造。テンプレート生成対象ファイルと生成順序を定義。
  - **Lv2: フロー詳細** (`docs/boilerplate_architecture/` 配下の各フロー定義書): 各フェーズの具体的な手順、中間成果物、検証方法を定義。
  - **重要**: これらに記載されていない手順は実行禁止です。記載された手順からの逸脱は許可されません。

- **自律性の原則**: オペレーター（人間）からの指示は、「Phase 2.1を完了せよ」など、フローのステップ指定のみです。あなたは、そのステップを完了するために必要なサブエージェント利用、ファイル生成、リント実行、テスト実行のすべてを自律的に判断・実行してください。

- **ドキュメントの更新**: 作業完了時、またはステータス変更時、必ず関連する **`TDD_WORK_FLOW.md` の進捗ログを正確に更新**し、進捗を人間と共有してください。

## 🗺️ 開発フロー数式マニフェスト（実行可能な設計図）

以下の数式が、あなたの行動の全工程と順序を規定します。すべての作業は、このレール上でのみ実行可能です。

```
💭🏗️▶️🗾📚️🖼️📋️🗂️🧬🎭⛏️️👁️🎨🪨🚧

💭project.toml
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
🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)
🪨route
🚧components.test
🪨components
🚧logic.test
🪨logic
🚧data-io.test
🪨data-io
```

## 📖 フロー詳細ドキュメントへの参照

各フェーズの詳細な手順、中間成果物、検証方法は以下のドキュメントを参照してください：

- `docs/boilerplate_architecture/開発フロー簡略図.md`: フロー全体像
- `docs/boilerplate_architecture/DESIGN_BLUEPRINT_FLOW.md`: 設計書生成フロー
- `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`: E2Eテストの基準
- `docs/boilerplate_architecture/ユニットテストの最低基準.md`: ユニットテストの基準

## 🛡️ ガードレールの自動実行

コード生成後、コミット前に以下のチェックを自律的に実行し、不合格の場合は自己修正してください：

| ガードレール項目 | 対応するスクリプト | 違反時の対処 |
| :--- | :--- | :--- |
| **I. コーディング規律の強制** | `node scripts/lint-template/engine.js` | 行数制限（ファイル400行）や、デザイントークン以外のハードコード（例: `#FFFFFF`）を検出。違反箇所を最小限の修正で是正してください。 |
| **II. スコープ逸脱の監視** | `node scripts/lint-template/engine.js` | 禁止ワード（例: プロジェクト範囲超過、不適切な外部サービス名）を提案または実装に含めていないかをチェック。違反箇所は直ちに削除し、MVPスコープを遵守してください。 |
| **III. スタイリング規律の強制** | `docs/CSS_structure/STYLING_CHARTER.md` | **実装者は常に「Tailwindクラス」のみを参照すること**。`globals.css`のカスタムクラスやトークンへの直接参照は禁止。階層飛越も禁止。詳細: [`STYLING_CHARTER.md`](docs/CSS_structure/STYLING_CHARTER.md) |
| **IV. スタイリング規律の検証** | `npm run lint:css-arch` | `globals.css`の規約違反や、実装層でのTailwindユーティリティクラスの直接使用を検出します。違反があった場合は、`tests/lint/css-arch-layer-report.md` の内容に従って修正してください。 |
| **V. ファイルリスト整合性の検証** | `node scripts/lint-file-list/check-diff.js <develop-section-path>` | file-list.mdに未定義のファイルを検出。設計書への追加または不要ファイルの削除を実施してください。 |

## 🎯 あなたの行動指針

1. **フロー骨格に従う**: `開発フロー簡略図.md`の数式に従い、ステップを順番に実行
2. **自律的に判断**: サブエージェント利用、ファイル生成、リント実行、テスト実行を自分で判断
3. **進捗を記録**: `TDD_WORK_FLOW.md`を常に最新に保つ
4. **ガードレールを実行**: コミット前に必ずすべてのリントを実行し、合格するまで修正
5. **3大層アーキテクチャを遵守**: UI層、純粋ロジック層、副作用層の責務を厳守（CLAUDE.md参照）
6. **SSoT原則を遵守**: すべてのリテラル値は`spec.yaml`に定義（CLAUDE.md参照）

---

**あなたの目標**: この規範に従い、完璧なコードを製造し、TDD開発フローを完遂することです。
