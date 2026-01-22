---
slug: "claude-md-refactoring"
title: "CLAUDE.md最適化：公式ベストプラクティスでコンテキスト負荷を削減"
description: "CLAUDE.mdが毎回の会話で不要な情報をロードし、コンテキストを圧迫していた問題を、Anthropic公式ベストプラクティスに準拠した構成への全面リファクタリングで解決。WHAT/WHY/HOWの3要素への集約と、詳細ドキュメントへのポインタ化により、Claude Codeとの協調開発効率を最大化。"
author: "ClaudeMix Team"
publishedAt: "2025-12-22"
category: "Claude Best Practices"
tags: ["CLAUDE.md", "architecture"]
freeContentHeading: "具体的なタスク"
---

## はじめに

### Claude Code Projectsでこんなことありませんか？

Claude Code Projectsを使い始め、`CLAUDE.md`でプロジェクトの文脈を共有しようとしました。
しかし、公式ドキュメントには「何を書くべきか」の具体的な指針が少なく、手探りで独自形式のCLAUDE.mdを作成しました。
動作はするものの、「本当に効率的な構成なのか」「毎回の会話で必要な情報だけがロードされているのか」という不安が残りました。

### この記事をお勧めしない人

- CLAUDE.mdを使っていない、または使う予定がない人
- コンテキストウィンドウの使用量を全く気にしない人
- Anthropic公式の推奨に従う必要がないと考える人

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### 最適化されていないCLAUDE.mdは危険です

☠ 毎回の会話で「フロー実行時のみ必要な指示」までロードされ、本来必要な「プロジェクト固有の常識」を圧迫する土壌ができあがります。

☠ やがて、複雑なリファクタリングや新機能実装のタスクで、コンテキストウィンドウの上限に近づき、重要な設計思想やアーキテクチャルールが削られるきっかけが発生します。

☠ ついに、AIが「アーキテクチャルール」や「設定管理の原則」といった重要なプロジェクト規範を見落とし、品質低下や手戻りが発生します。

### Anthropic公式準拠という明るい未来

✅ この記事を読めば、Claude Codeとの協調開発効率を最大化し、コンテキストを「毎回参照すべき情報」に集中できる明るい未来があります。

✅ 具体的には、Anthropic公式が推奨する5項目（共通コマンド、コアファイル、テスト指示、開発環境セットアップ、プロジェクト固有の警告）でCLAUDE.mdを最適化し、フロー特化の指示をスラッシュコマンドに分離する**設計図**を手に入れられます。
✅ 具体的には、Anthropic公式が推奨する「WHAT/WHY/HOW」の3要素でCLAUDE.mdを再構築し、詳細なルールを外部ドキュメントへの参照（ポインタ）に切り出す**設計図**を手に入れられます。
✅ この方法は、ClaudeMixプロジェクトで実証済みで、約1,600トークンのコンテキスト削減を実現し、AIがプロジェクト固有の常識により集中できるようになりました。

✅ この情報は、公式ベストプラクティスを実プロジェクトに適用した**実践知**であり、巷の情報では決して得られない具体的な改善プロセスです。

### このブログも同じでした

ClaudeMixプロジェクトも、「何を書くべきか」の基準がなく、独自形式のCLAUDE.mdで開発を進めていました。

この記事では、Anthropic公式ベストプラクティスへの全面移行プロセスと、具体的な改善効果（コンテキスト削減、検索性向上、責務の明確化）を持ち帰れるように書きました。

深掘りしたい方は、実際のコミット履歴と、変更前後のCLAUDE.mdの比較を確認できます。

## 開発の進捗

- **Before**: 独自形式のCLAUDE.mdで、フロー実行指示とプロジェクト固有の常識が混在していた状態
- **Current**: Anthropic公式ベストプラクティスに準拠したCLAUDE.mdに全面リファクタリング完了
- **Next**: 記事作成と、他のプロジェクトへの適用可能性の検証

## 具体的なタスク

### Before: 問題の発見

CLAUDE.mdを読み直したところ、「毎回の回答時に参照されるべき内容ではないもの」が大量に含まれていることに気づきました。
具体的には、特定の開発フロー実行時のみ必要な詳細な指示が、毎回の会話でロードされていました。
また、Anthropic公式が推奨する実践的な項目が欠けていました。

### Current: 全面リファクタリング

[CLAUDE.mdガイド](/blog/claudemd-guide)を参照し、以下の変更を実施しました：

1. **3要素への集約**: 記事全体を「WHAT（プロジェクト概要）」「WHY（設計思想）」「HOW（検証コマンド）」の3要素に再構築。
2. **情報のポインタ化**: 詳細なルールやアーキテクチャ定義を `@docs/` 配下の別ファイルに分離し、`CLAUDE.md` からは参照のみを行うように変更。
3. **コンテキストの軽量化**: 必須情報のみを残し、AIの「認知リソース」を確保。

この結果、約1,600トークンのコンテキスト削減を実現し、AIがプロジェクト固有の常識により集中できるようになりました。

### Next: 効果測定と展開

今後は、この最適化によるコンテキスト削減効果をモニタリングし、他のセクションにも適用していく予定です。

ここからは、実際にClaudeMixで実装した具体的なリファクタリングプロセスを公開します。

変更前後のCLAUDE.mdの比較、スラッシュコマンドへの分離基準、公式推奨形式への適合方法、そしてプロジェクト固有の制約を「備考」欄で明示する工夫まで、実際のコードと設定を交えて解説します。

## 課題と解決策

### 工夫したこと

#### 1. 公式推奨の「具体性」を徹底

Anthropic公式が推奨するCLAUDE.mdは、単なるルール集ではなく「コンテキストの地図」です。
プロジェクトの構造（Structure）や技術スタック（Stack）を明確に定義し、AIが迷子にならないための**WHAT（地図）**を提供しました。

この形式により、Claudeが「今どのような環境で作業しているか」を即座に理解できるようになりました。

#### 2. 詳細情報のポインタ化

「すべてのルールを1つのファイルに詰め込まない」という原則に従い、詳細なドキュメントへの参照（ポインタ）を活用しました。

- **CLAUDE.md**: アーキテクチャの核心（3層分離など）や、ドキュメントへのリンク一覧。
- **外部ドキュメント**: コーディング規約、スタイルガイド、YAML参照ガイドなど。

この分離により、コンテキストの「信号対雑音比」が大幅に向上し、AIが必要な時だけ詳細情報を参照する動きが可能になりました。

### ぶつかった壁

#### 1. 「思想（WHY）」の言語化

単に「こうしろ」と命じるのではなく、「なぜそうするのか」という設計思想をAIに理解させる必要がありました。
「3層アーキテクチャ」や「SSoT」といった概念を、簡潔かつ強力な言葉で定義することに苦労しました。

#### 2. 参照先の整備

`CLAUDE.md` をシンプルにするためには、参照先となるドキュメント（`@docs/`）が整備されている必要があります。
既存の散らばった情報を体系的なドキュメントとして再整理する作業が必要でした。

### 解決方法

#### 1. Design Philosophy (WHY) セクションの新設

「Design Philosophy」セクションを設け、アーキテクチャの意図や禁止事項（ハードコーディング禁止など）を明文化しました。これにより、AIの判断軸を固定しました。

#### 2. Detailed Documentation セクションでの集約

詳細なルールへのリンクを「Detailed Documentation」セクションに集約しました。AIは必要に応じてこれらのファイルを読みに行きます。

## コード抜粋

### 変更前のCLAUDE.md（問題のあった部分）

```markdown
## 🥇 1. 最上位行動原則 (マスター・ルール)

- **唯一の規範**: 開発フローは以下の2層で定義されています。
  - **Lv1: フロー骨格** (開発フロー簡略図)
  - **Lv2: フロー詳細** (各フロー定義書)
- **自律性の原則**: オペレーター（人間）からの指示は、フローのステップ指定のみです。
- **ドキュメントの更新**: 作業完了時、またはステータス変更時、必ず関連する進捗ログを正確に更新し、進捗を人間と共有してください。
```

**問題点**:

- 特定のフロー実行時のみ必要な詳細指示が含まれている
- 毎回の会話でロードされ、コンテキストを圧迫

### 変更後のCLAUDE.md（公式推奨形式）

```markdown
# ClaudeMix Project Context

## Project Overview (WHAT)

- **Concept**: Remix MVP Boilerplate optimized for Claude-driven development.
- **Stack**: Remix, TypeScript, Tailwind CSS, Cloudflare Pages (Workers, D1, KV).
- **Structure**:
  - `app/routes/` - **UI Layer**: Routing, Loaders/Actions.
  - `app/components/` - **UI Layer**: Visual components.
  - `app/lib/` - **Pure Logic Layer**: Business logic, pure functions (No side effects).
  - `app/data-io/` - **Side Effects Layer**: DB access, API calls.
  - `content/{section}/` - **SSoT**: YAML specs for literals and configurations.
  - `app/specs/` - **Shared Specs**: Project-wide definitions and shared constants.

## Design Philosophy (WHY)

- **3-Layer Architecture**: Strict separation to ensure testability and maintainability.
  - UI depends on Data-IO.
  - Data-IO depends on Lib.
  - Lib is independent (Pure).
- **Single Source of Truth (SSoT)**: All literal values/configs must be in `*-spec.yaml`. Hardcoding is prohibited.
- **Styling**: Use Tailwind utility classes only. No custom CSS files or global styles.

## Verification Commands (HOW)

- `npm run dev:wrangler` - Start dev server with Cloudflare runtime constraints.
- `npm run typecheck` - Run TypeScript validation.
- `npm run lint:all` - Run all linters (Template, CSS, Markdown, Blog Metadata).
- `npm test` - Run unit tests (Vitest).
- `npm run generate` - Generate code using scaffolds (Structure Assurance).

## Detailed Documentation

- Architecture Rules: @docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md
- Styling Charter: @docs/CSS_structure/STYLING_CHARTER.md
- Spec/Yaml Guide: @docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md
- Common vs Shared: @docs/boilerplate_architecture/COMMON_VS_SHARED.md
- Project Definition: @app/specs/shared/project-spec.yaml
```

**改善点**:

- Anthropic公式推奨の「共通コマンドとその目的」形式に準拠
- 「備考」欄でプロジェクト固有のルール（「必須」「オペレーターが実行」）を明示
- Claudeが自律的に正しいコマンドを選択可能に

## 今回の学びと感想

### 学び1: Prompt EngineeringからContext Engineeringへの転換

これまでは「どう指示するか（Prompt）」に注力していましたが、今回のリファクタリングで「何を記憶させるか（Context）」の設計こそが重要だと痛感しました。
`CLAUDE.md` を単なるルール集ではなく、プロジェクトの「地図（WHAT）」と「思想（WHY）」を伝えるための**情報資産**として再定義することで、AIの自律性が格段に向上しました。

### 学び2: 「ポインタ化」によるコンテキスト汚染の防止

すべての情報を `CLAUDE.md` に詰め込むと、重要な指示ほど無視される「Brevity Bias」が発生します。
詳細なルールを `Rules` や `Skills` に切り出し、`CLAUDE.md` からは参照（ポインタ）のみを残す**段階的開示（Progressive Disclosure）**の手法は、AIの「認知リソース」を守るための必須テクニックでした。

## 感想

CLAUDE.mdの最適化は、単なるドキュメント整理ではなく、**AIという「新しいチームメンバー」のためのオンボーディング資料作成**そのものでした。
人間用のドキュメントと同じく、「要約（CLAUDE.md）」と「詳細（外部ドキュメント）」を分けることで、AIも人間も迷わずにプロジェクトの全体像を把握できるようになったのが最大の収穫です。

同じような課題で悩んだ方はいませんか？
もっと良い最適化方法があれば教えてください！
