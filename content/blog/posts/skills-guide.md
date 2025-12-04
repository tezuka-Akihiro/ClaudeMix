---
slug: "skills-guide"
title: "claude skills 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "Claude Best Practices"
description: "Claudeの機能を拡張するモジュール「Skills」の公式ガイドを要約。Skillsの構造、ベストプラクティス、そしてClaudeが文脈に応じて専門知識を自動的に活用する仕組みを解説します。"
tags: ["Skills", "architecture"]
---
# Claude Skills 公式ガイド要約

**ソース**: <https://code.claude.com/docs/en/skills>

## 1. Skills とは

Agent Skills は**Claudeの機能を拡張するモジュール化されたパッケージ**です。専門知識を発見可能な形でパッケージ化し、Claudeが文脈に応じて自動的に使用します。

### 重要な特徴

- **モデル起動型**: ユーザーが明示的に呼び出すのではなく、Claudeが文脈に基づいて自動判断
- **自動発見**: 3つのソース（個人用・プロジェクト・プラグイン）から自動検出
- **プログレッシブ開示**: 必要な場合のみ補助ファイルを読み込む段階的アプローチ

## 2. Skills の構造

### ファイル構成

```
my-skill/
├── SKILL.md (必須)
├── reference.md (オプション)
├── scripts/ (補助ファイル)
└── templates/
```

### SKILL.md の必須要素

```yaml
---
name: lowercase-name
description: Skillの機能と使用時機を説明
allowed-tools: (オプション) 許可するツール指定
---

# Skill名

Skillの詳細な説明、使用方法、例
```

**重要**: `description`フィールドは**Claudeの発見性に決定的**。何ができるか**かつ**いつ使うかを両方記載すること。

#### nameフィールド

- **制限**: 64文字以内
- **形式**: 小文字、ハイフン区切り
- **例**: `pdf-extraction`, `code-reviewer`

#### descriptionフィールド

- **制限**: 1024文字以内
- **重要性**: 「description field is critical for Claude to discover when to use your Skill」
- **内容**:
  - 何ができるか（機能）
  - いつ使うか（使用タイミング）
  - 具体的な手がかり（キーワード）

**良い例**:

```yaml
description: Extract text and tables from PDF files when user requests PDF analysis or data extraction
```

**悪い例**:

```yaml
description: Handles PDFs
```

#### allowed-toolsフィールド（オプション）

```yaml
allowed-tools: Read, Grep, Glob
```

- Claudeが使用できるツールを制限
- 指定時、権限確認が不要になる
- 読み取り専用やセキュリティ重視の場合に有効

## 3. Skillsの配置場所

| 種類 | パス | 用途 | 共有方法 |
|:---|:---|:---|:---|
| 個人用 | `~/.claude/skills/` | 個別ワークフロー | ユーザーローカル |
| プロジェクト | `.claude/skills/` | チーム共有 | git管理 |
| プラグイン | プラグイン内 | 配布可能 | プラグイン配布 |

**推奨**: プロジェクトSkillsをgitで管理 → チームメンバーがpullで自動利用可能

## 4. Skillsの発見・実行メカニズム

### 自動発見

Claudeは以下の3つのソースからSkillsを自動発見:

1. 個人用Skillsディレクトリ（`~/.claude/skills/`）
2. プロジェクトSkillsディレクトリ（`.claude/skills/`）
3. インストール済みプラグイン

### 文脈認識起動

1. ユーザーの質問・要求を分析
2. Skill descriptionと照合
3. 合致すれば自動的にSkillを起動
4. 必要に応じて補助ファイルを段階的に読み込み

### プログレッシブ開示

- 初期: SKILL.mdのみ読み込み
- 必要時: reference.md、scripts、templatesを順次読み込み
- **利点**: コンテキストの効率的使用

## 5. ベストプラクティス

### 焦点化

**原則**: 1 Skill = 1 機能

**理由**: 複数機能を1つのSkillに詰め込むと、発見性が低下し、Claudeが適切なタイミングで起動できなくなる。

**例**:

```
❌ 悪い: general-dev-helper (コード生成、テスト、レビュー全部)
✅ 良い:
   - code-generator
   - test-writer
   - code-reviewer
```

### 具体的説明

**原則**: 説明に手がかりとなるキーワードを含める

**例**:

```yaml
# 良い例
description: Extract text and tables from PDF files when user requests PDF analysis or data extraction

# 悪い例
description: PDF処理
```

### チームテスト

**原則**: 実際の使用シーンで検証

1. 複数のチームメンバーで試用
2. 意図しないタイミングで起動しないか確認
3. descriptionを調整・改善

## 6. デバッグのポイント

| 問題 | 確認事項 | 解決方法 |
|:---|:---|:---|
| Skillが起動しない | description の具体性 | キーワードを追加、使用タイミングを明記 |
| | ファイルパスが正しいか | `.claude/skills/skill-name/SKILL.md` 確認 |
| YAML構文エラー | 開閉の`---`が正しいか | フロントマター形式を確認 |
| | インデントが正しいか | スペース2個でインデント |
| 複数Skill競合 | description の用語が重複 | 各Skillの用語を明確に区別 |

## 7. Skillsの共有方法

### 推奨: プラグインで配布

**利点**:

- バージョン管理が容易
- 依存関係の明示
- エンタープライズ環境での配布に適している

### 代替: gitで共有

```bash
# プロジェクトリポジトリに含める
.claude/skills/my-skill/SKILL.md

# チームメンバーがpull
git pull
# → 自動的にSkillが利用可能に
```

## 8. Layer 1（公式準拠）への適用

### Remix-boilerplateでの活用

現在の絵文字数式フローの各フェーズを、Skillsとして実装することで:

- **理解に基づく実行**: AIがフローの「なぜ」を理解
- **自動適用**: 文脈に応じて適切なフェーズを自動実行
- **一貫性保持**: descriptionによる明確な使用タイミング定義

### 実装例

```yaml
---
name: requirements-clarification
description: Clarify ambiguous user requirements by asking targeted questions. Use when user provides vague feature requests or unclear specifications.
---

# Requirements Clarification Expert

When a user provides unclear requirements, guide them through structured clarification using:

1. Given-When-Then format
2. Concrete examples
3. Edge case identification
```

## 9. 参考リンク

- **公式ドキュメント**: <https://code.claude.com/docs/en/skills>
- **公式アナウンス**: <https://www.anthropic.com/news/skills>
- **API ドキュメント**: <https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview>
