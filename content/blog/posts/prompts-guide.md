---
slug: "prompts-guide"
title: "claude prompts 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "Claude Best Practices"
description: "Claudeから質の高い出力を得るための「プロンプトエンジニアリング」公式ガイドを要約。明確性の原則から思考の連鎖（CoT）、XMLタグの活用まで、推奨される技術階層を具体的な実装例と共に解説します。"
tags: ["Prompts"]
---
**ソース**: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview>

## 1. プロンプトエンジニアリングとは

Claudeに与えるテキスト（質問や指示）を最適化し、関連性の高い出力を得るための技術です。

### ファインチューニングとの比較

| 特性 | プロンプトエンジニアリング | ファインチューニング |
| :--- | :--- | :--- |
| **速度** | はるかに高速（即座） | 遅い（学習時間が必要） |
| **リソース** | 最小限（GPU不要） | 高コスト（GPU必須） |
| **更新対応** | 容易（プロンプト変更のみ） | 困難（再学習が必要） |
| **必要データ** | 最小限 | 大量 |

**結論**: Anthropic公式は「プロンプトエンジニアリングを先に試すべき」と推奨

## 2. 推奨技術の階層

Claudeは以下の順序で技術を試すことを推奨:

1. **明確性と直接性** ← 最も広く効果的な基盤
2. **マルチショット例示** ← 複数の例を通じた学習
3. **思考の連鎖（CoT）** ← "Let Claude think"による推論促進
4. **XMLタグ活用** ← 構造化された入力の提供
5. **システムプロンプト** ← Claudeにロールを割り当て
6. **レスポンス事前入力** ← 出力形式の誘導
7. **複雑なプロンプト連鎖** ← 多段階タスク処理
8. **長文コンテキストのコツ** ← 大量情報の効率的な活用

## 3. 実装前の前提条件

プロンプトエンジニアリングを開始する前に、以下を確立する必要があります:

### ✅ 明確な成功基準

```text
悪い例: 「良い要約を作る」
良い例: 「3文以内、主要な論点を3つ含む、ビジネスパーソン向けの要約」
```

### ✅ 実証的なテスト方法

```text
悪い例: 主観的な評価
良い例:
- 10件のサンプルで出力を比較
- 期待される出力との一致率を測定
- A/Bテストで複数のプロンプトを比較
```

### ✅ 初期草案プロンプト

```text
最初から完璧を目指さず、草案から開始し、反復的に改善
```

## 4. 技術1: 明確性と直接性

### 明確性と直接性の原則

- **曖昧さを排除**: 「良い」「適切な」などの主観的な言葉を避ける
- **具体的な指示**: 何をどのように行うかを明示
- **期待される出力形式を示す**: 箇条書き、段落、JSON など

### 明確性と直接性の例

**悪い例**:

```text
このコードを改善して
```

**良い例**:

```text
このTypeScript関数を以下の点で改善してください:
1. 型安全性の向上（anyを排除）
2. エラーハンドリングの追加
3. コメントで各ステップを説明

改善後のコードのみを返してください（説明不要）。
```

## 5. 技術2: マルチショット例示

### マルチショット例示の原則

- 1つの例（ワンショット）より複数の例（マルチショット）が効果的
- 例は具体的で多様性を持たせる
- 期待される入出力パターンを示す

### マルチショット例示の例

```text
以下の形式で要約を作成してください:

例1:
入力: [300語の技術記事]
出力: 技術: React Hooks。利点: 状態管理の簡素化。対象: React開発者。

例2:
入力: [400語のビジネス記事]
出力: トピック: リモートワーク。利点: 生産性向上。対象: 経営者。

あなたのタスク:
入力: [実際の記事]
出力: ?
```

## 6. 技術3: 思考の連鎖（CoT）

### 思考の連鎖の原則

「Let Claude think」- Claudeに推論プロセスを明示的に示させる

### 実装方法

```text
以下の問題を解いてください。答える前に、段階的に思考プロセスを示してください:

問題: [複雑な問題]

思考プロセス:
1. [第一ステップ]
2. [第二ステップ]
...

最終回答: [結論]
```

### 効果

- 複雑な推論タスクで精度向上
- デバッグが容易（推論プロセスが可視化）
- ハルシネーションの減少

## 7. 技術4: XMLタグ活用

### XMLタグ活用の原則

構造化されたデータを提供することで、Claudeの理解を助ける

### XMLタグ活用の例

```xml
<task>
  <objective>TypeScript関数のリファクタリング</objective>
  <constraints>
    <constraint>型安全性を保持</constraint>
    <constraint>既存のインターフェースを変更しない</constraint>
  </constraints>
  <input_code>
    <![CDATA[
    function process(data: any) {
      return data.map(x => x * 2);
    }
    ]]>
  </input_code>
</task>
```

### 利点

- 複数の情報源を明確に区別
- パースが容易
- ネストした構造を表現可能

## 8. 技術5: システムプロンプト

### システムプロンプトの原則

Claudeにロールや行動様式を割り当て、一貫した振る舞いを実現

### システムプロンプトの例

```text
# System Prompt
あなたは、Remixの3層分離アーキテクチャを理解した設計の専門家です。

## あなたの専門知識
- UI層: ユーザー操作と表示の責務のみ
- Logic層: 純粋関数による計算処理のみ
- Data-IO層: 外部システムとの通信のみ

## あなたの行動原則
1. 設計時、必ず3層に分解する
2. 各層の責務を越える提案はしない
3. スコープ外機能は明示的に除外する
```

### 活用シーン

- Skillsの実装（`.claude/skills/skill-name/SKILL.md`）
- CLAUDE.mdでのプロジェクト全体の指示
- APIでのsystem roleの定義

## 9. 技術6: レスポンス事前入力

### レスポンス事前入力の原則

出力の最初の部分を事前に提供し、形式を誘導

### レスポンス事前入力の例

```json
以下の形式でJSONを生成してください:

{
  "summary": "
```

→ Claudeは`"`から続きを生成

### レスポンス事前入力の利点

- 出力形式の厳密な制御
- 不要な前置き（"Sure, here's..."）の排除
- 構造化データの生成精度向上

## 10. Layer 1（公式準拠）への適用

### ClaudeMixでの活用方針

#### 1. Promptsとして実装

```text
.claude/commands/layer1-official/
├── structured-task.md          # XMLタグ活用
├── example-driven-implementation.md  # マルチショット例示
├── write-design-doc.md         # 明確性と直接性
└── tdd-cycle.md                # 思考の連鎖（CoT）
```

#### 2. 各技術のマッピング

| 技術 | Promptファイル | 用途 |
| :--- | :--- | :--- |
| 明確性と直接性 | `write-design-doc.md` | 要件定義作成支援 |
| マルチショット例示 | `example-driven-implementation.md` | コード生成 |
| 思考の連鎖（CoT） | `tdd-cycle.md` | テスト駆動開発 |
| XMLタグ活用 | `structured-task.md` | 複雑なタスク分解 |

#### 3. 設計書作成への適用

```markdown
# .claude/commands/layer1-official/write-design-doc.md

あなたは、明確な要件定義の専門家です。

## 原則（Claude公式推奨）
1. **明確性**: 曖昧な表現を避け、具体的に記述
2. **例示活用**: 抽象的な説明より、具体例を示す
3. **構造化**: XMLタグで情報を階層化
4. **段階的開示**: 概要→詳細の順で情報を提供

## テンプレート
<requirements>
  <overview>機能の目的を1文で</overview>
  <input_output>
    <input>入力データの型定義と例</input>
    <output>出力データの型定義と例</output>
  </input_output>
  <examples>
    <example>
      <scenario>具体的な使用シーン</scenario>
      <expected_behavior>期待される動作</expected_behavior>
    </example>
  </examples>
</requirements>
```

### 参考リンク

- **プロンプトエンジニアリング概要**: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview>
- **プロンプト入門**: <https://docs.anthropic.com/claude/docs/intro-to-prompting>
- **Claude 3 プロンプトガイド**: <https://www.promptingguide.ai/models/claude-3>
