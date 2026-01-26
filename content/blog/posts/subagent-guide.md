---
slug: "subagent-guide"
title: "claude Subagent 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2026-01-21"
category: "ClaudeMix ガイド"
description: "Claude Codeの「Subagent（サブエージェント）」活用ガイド。メインコンテキストを汚さずに特定タスクを遂行する独立した専門員の作成方法、権限管理、そして2026年の最新機能であるHookやSkill注入による高度な統制技術を解説します。"
tags: ["Subagent"]
---

## 1. サブエージェント：製造ラインの「専門員」

サブエージェントとは、特定のタスク（調査、設計、修正など）に特化した、**独立したコンテキストを持つAI助手**です。

サブエージェントは以下の役割を果たします：

* **コンテキストの隔離（防衛）**: 膨大なログ調査やコード探索を別窓（サブエージェント）で行わせ、メインの会話（設計判断）を汚染させない。
* **権限の最小化（堅牢）**: 「読み取り専用」や「特定のコマンドのみ許可」など、AIの行動範囲を厳格に制限する。
* **コストと速度の最適化**: 調査には高速な `Haiku`、複雑な修正には `Sonnet` と使い分ける。

## 2. 内蔵サブエージェント（Built-in）

Claude Codeには、最初から「特定の役割」を与えられた専門員が配備されています。

| エージェント | デフォルトツール | 主な役割 | 特徴 |
| :--- | :--- | :--- | :--- |
| **Explore** | Read, Grep, Glob | コード探索・分析 | **読み取り専用**。高速に codebase を把握する。 |
| **Plan** | Read, Grep, Glob | 計画策定前の調査 | `plan mode` 時の調査専用。無限ループ防止設計。 |
| **general-purpose** | 全ツール | 複雑な多段タスク | 全ツール使用可能。探索から実装まで一気通貫。デフォルトの選択肢。 |

**注**: モデルは親エージェントから継承されます。`model`フィールドで明示的に指定しない限り、メインコンテキストと同じモデルが使用されます。

## 3. カスタムサブエージェントの構築（SKILLとの統合）

独自の「専門員」を作成することで、プロジェクト固有の規律（例：Remixの3層分離遵守）を強制できます。

### 基本的な作成フロー

1. `/agents` コマンドで対話的に作成、または `.claude/agents/*.md` を直接編集。
2. **YAML Frontmatter** で性格と権限を定義。
3. **Markdown本文** でシステムプロンプト（指示）を記述。

### 構成例：システムの延命医（Code Reviewer）

```markdown
---
name: code-extender
description: 5〜10年「死なない」コードにするための延命医。依存関係の複雑化やWeb標準からの逸脱を監視する。
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: default
---

あなたは「システムの延命医」です。
提供されたコード変更が、短期的な流行（設計負債）を産んでいないか、Web標準（Remix等）に準拠しているかを厳格にレビューしてください。

チェック項目：
- 構造の不自然さ（疎結合が保たれているか）
- 見えないエラー（適切なエラーハンドリング）
- 複雑すぎる増築案の排除

```

## 4. Skillsとの統合

### Skills の `context: fork` による独立実行

Skillsの `context` フィールドを `fork` に設定することで、特定のスキルをサブエージェント（独立したコンテキスト）として実行できます。

```yaml
---
name: deep-research
description: Research a topic thoroughly in isolated context
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

### context: inline vs fork の使い分け

| context値 | 実行方法 | 適用場面 | 特徴 |
| :--- | :--- | :--- | :--- |
| `inline` | 現在の会話コンテキスト内で実行 | ガイドライン、パターン、参考資料 | 会話履歴にアクセス可能 |
| `fork` | 独立したサブエージェントで実行 | 自己完結型タスク、大規模調査 | 会話履歴なし、明示的な指示が必要 |

**重要な違い**: `inline` は知識やガイドラインの提供に使用し、`fork` は自己完結型のタスクに使用します。

### agent フィールドによる専門化

`context: fork` 時に `agent` フィールドでサブエージェントのタイプを指定できます。

**読み取り専用の調査スキル**:

```yaml
---
name: analyze-codebase
context: fork
agent: Explore
allowed-tools: Grep, Read, Glob
---

Analyze the codebase structure and identify:

1. Main entry points
2. Key dependencies
3. Potential bottlenecks
```

**フル機能のスキル**:

```yaml
---
name: implement-feature
context: fork
agent: general-purpose
---

Implement the feature: $ARGUMENTS

1. Design the solution
2. Write the code
3. Add tests
4. Update documentation
```

`agent` を省略した場合、デフォルトで `general-purpose` が使用されます。

## 5. 2026年の高度な統制技術

### ① Hookによる「動的検問」

サブエージェントがツールを使う直前にスクリプトを実行し、特定の操作をブロックできます。

* **PreToolUse**: 例：DB操作エージェントに対し、`SELECT` 以外が含まれていたら即座に停止させる（exit 2）。

### ② Skillの注入（Preload Skills）

サブエージェント起動時に、特定の `SKILL.md`（ドメイン知識）を直接流し込めます。

```yaml
skills:
  - remix-best-practices
  - architectural-boundary
```

これにより、エージェントは起動した瞬間に「プロジェクトの掟」を理解した状態で作業を開始します。

### ③ バックグラウンド実行（並列統制）

`Ctrl+B` または指示により、サブエージェントをバックグラウンドで走らせることが可能です。

* **注意**: バックグラウンド時はユーザーへの確認ができないため、権限外の操作は自動拒否されます。

## 6. 戦略的使い分け：Main vs Subagent

「最大の努力で最小の結果（死なないこと）」を達成するための基準です。

* **Main会話でやるべきこと**:
* 全体設計の意思決定。
* 複数のフェーズを跨ぐ継続的な対話。

* **サブエージェントに投げるべきこと**:
* **高ボリュームな作業**: テスト実行、大量のログ解析（メインの記憶を消費させないため）。
* **隔離したい作業**: 破壊的な変更の試行、ライブラリの調査。
