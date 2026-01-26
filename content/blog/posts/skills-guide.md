---
slug: "skills-guide"
title: "claude skills 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2026-01-21"
category: "Claude Best Practices"
description: "Claude Codeの機能を拡張する「Skills」の公式ガイド。文脈に応じて自動起動するモジュール化されたパッケージの作成方法、SKILL.mdの構造、発見性を高める記述テクニック、そしてチームでの共有・運用ベストプラクティスを網羅的に解説します。"
tags: ["Skills"]
---
**ソース**: <https://code.claude.com/docs/en/skills>

## 1. Skills とは

Agent Skills は**Claudeの機能を拡張するモジュール化されたパッケージ**です。専門知識を発見可能な形でパッケージ化し、Claudeが文脈に応じて自動的に使用します。

### 重要な特徴

- **モデル起動型**: ユーザーが明示的に呼び出すのではなく、Claudeが文脈に基づいて自動判断
- **自動発見**: 3つのソース（個人用・プロジェクト・プラグイン）から自動検出
- **プログレッシブ開示**: 必要な場合のみ補助ファイルを読み込む段階的アプローチ
- **Slash Commandの統合**: 従来のカスタムスラッシュコマンド（`.claude/commands/`）はSkillsに統合されました。Skillsはコマンドの上位互換として機能します。

## 2. Skills の構造

### ファイル構成

```text
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
disable-model-invocation: (オプション) 自動実行の無効化
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

#### 完全なフロントマターフィールドリファレンス

| フィールド | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `name` | string | ディレクトリ名 | スキルの表示名（小文字、英数字、ハイフン、最大64文字） |
| `description` | string | Markdownの最初の段落 | スキルの機能説明。Claudeがいつ使用するかを判断する重要な情報 |
| `argument-hint` | string | なし | オートコンプリート時のヒント（例: `[issue-number]`, `[filename] [format]`） |
| `disable-model-invocation` | boolean | `false` | `true`の場合、Claudeによる自動実行を禁止（手動実行専用） |
| `user-invocable` | boolean | `true` | `false`の場合、`/`メニューから隠す（背景知識用） |
| `allowed-tools` | string | 全ツール | カンマ区切りのツールリスト。指定すると権限確認不要 |
| `model` | string | デフォルトモデル | スキル実行時に使用するモデル |
| `context` | string | `inline` | `inline`（デフォルト）または`fork`（独立したサブエージェントで実行） |
| `agent` | string | `general-purpose` | `context: fork`時のサブエージェントタイプ |
| `hooks` | object | なし | スキルのライフサイクルに紐づくフック |

#### 変数と動的コンテキスト

Skills内で使用できる3つの動的な置換機能:

##### A. `$ARGUMENTS` - 引数の展開

ユーザーまたはClaudeが提供した引数をプレースホルダーとして埋め込みます。

```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Implement the fix
3. Write tests
```

**使用例**: `/fix-issue 123` → Claudeは「Fix GitHub issue 123...」を受け取ります。

`$ARGUMENTS`がコンテンツに含まれていない場合、引数は `ARGUMENTS: <value>` として末尾に追加されます。

##### B. `${CLAUDE_SESSION_ID}` - セッションIDの取得

現在のセッションIDをログ記録や相関分析に使用できます。

```yaml
---
name: session-logger
description: Log activity for this session
---

Log the following to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

##### C. `` !`command` `` - コマンド実行

スキルコンテンツがClaudeに送られる**前に**シェルコマンドを実行し、その出力をプレースホルダーに埋め込みます（前処理、Claudeによる実行ではありません）。

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh:*)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

**実行フロー**:

1. 各 `` !`command` `` が即座に実行される（Claudeが見る前）
2. 出力がプレースホルダーを置換
3. Claudeは実際のデータが埋め込まれた完全なプロンプトを受け取る

**ヒント**: スキルコンテンツのどこかに「ultrathink」を含めると、拡張思考モードが有効化されます。

## 3. Skillsの配置場所

| 種類 | パス | 用途 | 共有方法 |
| :--- | :--- | :--- | :--- |
| 個人用 | `~/.claude/skills/` | 個別ワークフロー | ユーザーローカル |
| プロジェクト | `.claude/skills/` | チーム共有 | git管理 |
| プラグイン | プラグイン内 | 配布可能 | プラグイン配布 |

**推奨**: プロジェクトSkillsをgitで管理 → チームメンバーがpullで自動利用可能

**ネストされたディレクトリ**: モノレポ構成などでは、サブディレクトリ内の `.claude/skills/` も自動的に検出されます（例: `packages/frontend/.claude/skills/`）。

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

### プログレッシブ開示（Progressive Disclosure）

Skillsは3段階のレベルで段階的にコンテンツを読み込みます。これにより、関連するコンテンツのみがコンテキストウィンドウを占有します。

#### レベル1: メタデータ（常に読み込まれる）

**コンテンツタイプ**: 指示

YAMLフロントマターの発見情報がClaudeの起動時にシステムプロンプトに含まれます。

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files.
---
```

**トークンコスト**: スキルあたり約100トークン

この軽量なアプローチにより、多数のスキルをインストールしてもコンテキストペナルティがありません。

#### レベル2: 指示（トリガー時に読み込まれる）

**コンテンツタイプ**: 指示

SKILL.mdの本文には、ワークフロー、ベストプラクティス、ガイダンスが含まれます。

````markdown
# PDF Processing

## Quick start

Use pdfplumber to extract text from PDFs:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For advanced form filling, see [FORMS.md](FORMS.md).
````

Skillのdescriptionにマッチするリクエストがあると、ClaudeはbashでSKILL.mdをファイルシステムから読み取ります。この時点でコンテンツがコンテキストウィンドウに入ります。

**トークンコスト**: 5,000トークン未満

#### レベル3以上: リソースとコード（必要に応じて読み込まれる）

**コンテンツタイプ**: 指示、コード、リソース

Skillsは追加の資料をバンドルできます:

```text
pdf-skill/
├── SKILL.md (メイン指示)
├── FORMS.md (フォーム記入ガイド)
├── REFERENCE.md (詳細なAPIリファレンス)
└── scripts/
    └── fill_form.py (ユーティリティスクリプト)
```

- **指示**: 追加のMarkdownファイル（FORMS.md、REFERENCE.md）
- **コード**: 実行可能スクリプト（fill_form.py、validate.py）をClaudeがbashで実行
- **リソース**: データベーススキーマ、APIドキュメント、テンプレート、サンプル

Claudeはこれらのファイルを参照時のみアクセスします。ファイルシステムモデルにより、各コンテンツタイプに異なる強みがあります：

- 指示: 柔軟なガイダンス
- コード: 信頼性の高い操作（コンテキストを消費しない）
- リソース: 事実の参照

**トークンコスト**: 実質的に無制限（アクセスされたコンテンツのみカウント）

#### プログレッシブ開示の利点

| レベル | 読み込みタイミング | トークンコスト | コンテンツ |
| :--- | :--- | :--- | :--- |
| **レベル1: メタデータ** | 常時（起動時） | スキルあたり約100トークン | YAMLフロントマターの`name`と`description` |
| **レベル2: 指示** | スキルトリガー時 | 5,000トークン未満 | SKILL.md本文の指示とガイダンス |
| **レベル3以上: リソース** | 必要に応じて | 実質的に無制限 | bashで実行されるバンドルファイル（コンテキストに読み込まれない） |

この段階的な開示により、任意の時点で関連するコンテンツのみがコンテキストウィンドウを占有します。

## 5. ベストプラクティス

### 焦点化

**原則**: 1 Skill = 1 機能

**理由**: 複数機能を1つのSkillに詰め込むと、発見性が低下し、Claudeが適切なタイミングで起動できなくなる。

**例**:

```text
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
| :--- | :--- | :--- |
| Skillが起動しない | description の具体性 | キーワードを追加、使用タイミングを明記 |
| | ファイルパスが正しいか | `.claude/skills/skill-name/SKILL.md` 確認 |
| YAML構文エラー | 開閉の`---`が正しいか | フロントマター形式を確認 |
| | インデントが正しいか | スペース2個でインデント |
| 複数Skill競合 | description の用語が重複 | 各Skillの用語を明確に区別 |
