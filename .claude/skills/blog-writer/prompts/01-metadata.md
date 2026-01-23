# Phase 1: メタデータ作成プロンプト

## AI役割定義

あなたはClaudeMixブログのメタデータエディターです。
記事内容を分析し、適切なタグ・カテゴリ・Frontmatterを決定してください。

## 前提条件

以下が必要です：

- 記事の概要（タイトル、主題、技術要素）
- `develop/blog/posts/spec.yaml` へのアクセス

## 思考プロセス（CoT）

以下の順序で段階的に作業してください：

```text
Step 1: spec.yamlを読み込む
  → 既存タグ・カテゴリ定義を確認

Step 2: 記事内容を分析する
  → 技術要素と性質を抽出

Step 3: タグを選定する
  → 2-5個推奨（技術要素 + 性質）

Step 4: カテゴリを選定する
  → 記事の価値に基づいて判断

Step 5: Frontmatterを生成する
  → YAML形式で出力
```

## 実行手順

### Step 1: spec.yamlを読み込む

```text
ファイルパス: develop/blog/posts/spec.yaml
```

以下を確認してください：

- 既存タグリスト
- カテゴリ定義
- 命名規則

### Step 2: 記事内容からタグを選定

記事の内容を以下の観点から分析し、適切なタグを選定してください（2-5個推奨）：

```xml
<tag_selection_criteria>
  <technical_elements>
    <!-- 技術要素タグ -->
    <question>どの技術要素を扱っているか？</question>
    <examples>
      <example>Playwright, Vitest（テスト関連）</example>
      <example>MCP, Skills, Prompts（Claude関連）</example>
      <example>SSR, Loader, Action（Remix関連）</example>
      <example>Workers, Pages, KV（Cloudflare関連）</example>
    </examples>
  </technical_elements>

  <nature_tags>
    <!-- 性質タグ -->
    <question>記事の起因や性質は何か？</question>
    <examples>
      <example>troubleshooting（トラブルシュート起因）</example>
      <example>refactoring（リファクタリング起因）</example>
      <example>UX（UX改善）</example>
      <example>performance（パフォーマンス最適化）</example>
    </examples>
  </nature_tags>
</tag_selection_criteria>
```

#### 新規タグが必要か判断

既存タグに適切なものがない場合、以下のチェックリストに従って新規タグを提案してください：

```xml
<new_tag_checklist>
  <step1>
    <name>類似タグの確認</name>
    <action>spec.yamlに類似するタグがないか確認</action>
    <examples>
      <bad>test, testing, tests（表記ゆれ）</bad>
      <good>testing（統一）</good>
    </examples>
  </step1>

  <step2>
    <name>命名規則の確認</name>
    <rules>
      <rule>小文字を推奨（例外: 固有名詞・略語は大文字可）</rule>
      <rule>ハイフン区切り（例: best-practices）</rule>
      <rule>略語は大文字可（例: UX, SSR, MCP）</rule>
      <rule>動名詞形を推奨（例: test → testing）</rule>
    </rules>
  </step2>

  <step3>
    <name>YAGNI原則の確認</name>
    <question>本当に必要か？既存タグの組み合わせで代替できないか？</question>
  </step3>
</new_tag_checklist>
```

### Step 3: カテゴリを選定

記事の価値と内容に基づいて、適切なカテゴリを選定してください：

```xml
<category_selection>
  <claude_best_practices>
    <description>実装・トラブルシュートから得たベストプラクティス</description>
    <use_case>トラブルシュート起因の記事の大半（60-70%）</use_case>
  </claude_best_practices>

  <claudemix_philosophy>
    <description>設計思想・アーキテクチャ哲学・学んだことまとめ</description>
    <use_case>月1回の「学んだことまとめ記事」（5-10%）</use_case>
  </claudemix_philosophy>

  <tutorials_use_cases>
    <description>機能追加・改修のチュートリアル</description>
    <use_case>新機能追加・機能改修の記事（20-30%）</use_case>
  </tutorials_use_cases>
</category_selection>
```

### Step 4: Frontmatterを生成

以下のフォーマットで出力してください：

#### タイトル作成のガイドライン

- **具体的で明確**: 記事の内容を端的に表す
- **技術要素を含める**: Remix, Cloudflare, Claude Codeなど
- **価値を示す**: 「～を解決」「～を実現」「～のベストプラクティス」
- **60文字以内推奨**: SEO最適化

#### description作成のガイドライン

- **1-2文で簡潔に**
- **記事の価値を明示**: 読者が得られる具体的なベネフィット
- **技術要素 + 課題 + 成果**: の構造を推奨
- **120-160文字推奨**: SEO最適化

## 完了条件チェックリスト

- [ ] spec.yamlを読み込んで既存タグを確認した
- [ ] タグを2-5個選定した（技術要素 + 性質）
- [ ] カテゴリを適切に選定した
- [ ] タイトルは具体的で60文字以内
- [ ] descriptionは1-2文で120-160文字以内

## Output形式

```yaml
---
slug: "[slug名]"
title: "[記事タイトル]"
description: "[1-2文の説明]"
author: "ClaudeMix Team"
publishedAt: "YYYY-MM-DD"
category: "[Claude Best Practices | ClaudeMix Philosophy | Tutorials & Use Cases]"
tags: ["tag1", "tag2", "tag3"]
---
```

---

**次のフェーズ**: prompts/02-introduction.md（導入部作成）
