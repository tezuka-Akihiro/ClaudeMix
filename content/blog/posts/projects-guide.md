---
slug: "projects-guide"
title: "claude projects 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "Claude Best Practices"
description: "Claudeがプロジェクト全体の文脈を理解するための共有メカニズム「Projects」の公式ガイドを要約。CLAUDE.mdの理想的な構成や、コンテキスト管理のベストプラクティスを解説します。"
tags: ["Projects", "architecture"]
---
**ソース**: <https://www.anthropic.com/engineering/claude-code-best-practices>

## 1. Claude Projectsとは

Claude Projects（Web版）とClaude Code（CLI）における**プロジェクト文脈の共有メカニズム**です。`CLAUDE.md`ファイルを中心に、プロジェクト固有の知識とルールをClaudeと共有します。

### 主要機能

- **200,000トークンのコンテキストウィンドウ** （約500ページの書籍相当）
- **カスタム指示** によるAI動作のテーラリング
- **チーム協調** 機能（Projects のみ）

## 2. CLAUDE.md の使用方法

### 目的

「特別なファイル」として、Claudeが会話開始時に**自動的に読み込み**、プロジェクトの文脈を取得します。

### 理想的な内容

Anthropic公式が推奨する記載事項:

1. **共通bashコマンド** とその目的
2. **コアファイル、ユーティリティ関数、コードスタイルガイドライン**
3. **テスト指示とリポジトリのエチケット**
4. **開発環境のセットアップ詳細**
5. **プロジェクト固有の警告や予期しない動作**

### 配置オプション

| 配置場所 | 用途 | 共有方法 |
| :--- | :--- | :--- |
| **リポジトリルート** | プロジェクト全体の文脈 | gitで共有（チーム全員） |
| **親ディレクトリ** | モノレポでの共通設定 | 階層的に継承 |
| **子ディレクトリ** | サブプロジェクト固有の設定 | オンデマンド読み込み |
| **ホームフォルダ** (`~/.claude/CLAUDE.md`) | 全セッション共通の個人設定 | ユーザーローカル |

### 最適化のポイント

**原則**: CLAUDE.mdは「頻繁に使用されるプロンプト」として扱い、反復的に改善する

**方法**:

1. `#`キーを使用してClaudeに自動的に指示を組み込ませる
2. プロンプト改善ツールを通してファイルを洗練させる
3. チームでレビューし、フィードバックを反映

## 3. コンテキスト管理のベストプラクティス

### 焦点化された文脈の維持

**原則**: 1つのチャットを1つのプロジェクトまたは機能にスコープ

**理由**: すべての文脈が関連性を保ち、Claudeの応答精度が向上

**実践**:

```bash
# 機能完了後、コンテキストをクリア
/clear

# 新しい会話を開始
# → 無関係な過去の文脈の影響を排除
```

### `/clear`の頻繁な使用

**タイミング**:

- タスク完了時
- トピックが切り替わる時
- 会話が長くなりすぎた時

**効果**:

- 文脈のノイズ除去
- 応答速度の向上
- 精度の向上

### チェックリスト/スクラッチパッドの活用

**用途**: 複雑な多段階ワークフローの管理

**例**:

```markdown
## タスクチェックリスト

- [x] E2Eテスト作成
- [x] UI層実装
- [ ] Logic層実装 ← 現在ここ
- [ ] Data-IO層実装
- [ ] E2Eテスト成功確認
```

### 計画優先のアプローチ

**原則**: コーディング前にClaudeに計画を立てさせる

**理由**: 文脈を保持しつつ、明確なロードマップを確立

**実践**:

```text
「まず計画を立ててください。コードは書かないでください」

→ Claudeが計画を提示
→ ユーザーが承認
→ 実装開始
```

## 4. カスタムスラッシュコマンド

### 定義

再利用可能なプロンプトテンプレートを`.claude/commands/`フォルダに格納

### 利点

- **デバッグループ、ログ分析などの反復ワークフロー**に最適
- チーム全体で共有可能（gitにコミット）
- 動的な入力のサポート（`$ARGUMENTS`）

### 例

**ファイル**: `.claude/commands/debug-error.md`

```markdown
# デバッグエラー

以下のエラーをデバッグしてください:

$ARGUMENTS

デバッグ手順:
1. エラーメッセージの分析
2. 関連ファイルの特定
3. 原因の推測
4. 修正案の提示
```

**使用**:

```bash
/debug-error "TypeError: Cannot read property 'map' of undefined"
```

## 5. 推奨ワークフロー

### 1. Explore-Plan-Code-Commit

```text
1. Explore: 関連ファイル、画像、URLを読む（コードは書かない）
2. Plan: 明確な計画を立てる
3. Code: 実装
4. Commit: 変更をコミット
```

**重要**: 「コードを書かないでください」と明示的に指示

### 2. Test-Driven Development (TDD)

```text
1. テストを書く
2. 失敗を確認
3. 実装
4. テストが通るまで反復
```

### 3. Visual Iteration

```text
1. デザインモックまたはスクリーンショットを提供
2. 実装
3. スクリーンショットを撮影
4. 一致するまで反復
```

## 6. ツールアクセスの強化

### `/permissions`コマンド

許可されたツールの設定をカスタマイズ

### MCPサーバーの接続

外部機能の拡張（後述のMCPガイド参照）

### カスタムbashツールの文書化

CLAUDE.mdに記載することで、Claudeが自動的に使用可能

### `gh` CLIのインストール

GitHub統合の強化

```bash
# インストール
brew install gh  # macOS
winget install GitHub.cli  # Windows

# 認証
gh auth login
```

## 7. Layer 1（公式準拠）への適用

### Remix-boilerplateでの活用

#### CLAUDE.mdの構成

```markdown
# ClaudeMix Project Context

## Layer 1: プロジェクト基本情報（公式準拠）

**Project Name**: ClaudeMix Demo
**Concept**: Claudeとの協調開発を最適化するRemixボイラープレート
**Target**: Remix + Claude でMVP開発を行う開発者

**References**:
- Remix公式: https://remix.run
- 参考アプリ: https://zenn.dev/topics/blog

## 共通コマンド
- `npm run dev`: 開発サーバー起動
- `npm test`: テスト実行
- `npm run lint`: リント実行
- `npm run build`: 本番ビルド

## コアファイル
- `app/routes/`: Remixルート定義
- `app/components/`: UIコンポーネント
- `app/lib/`: 純粋ロジック層
- `app/data-io/`: 副作用層

## コードスタイル
- TypeScript厳格モード使用
- Prettier自動フォーマット
- 3層分離アーキテクチャ遵守

## テスト指示
- E2Eテストから開始（Outside-In TDD）
- 各層ごとに単体テスト作成
- カバレッジ80%以上を目標

## 予期しない動作
- Remixのloader/actionはサーバー専用（`.server.ts`推奨）
- クライアント側でのファイルシステムアクセス不可
```

#### Projects機能との統合

```text
.claude/
├── CLAUDE.md           # プロジェクト文脈
├── commands/           # カスタムコマンド
│   ├── layer1-official/
│   └── layer2-remix-specific/
└── skills/             # カスタムSkills
    ├── layer1-official/
    └── layer2-remix-specific/
```

## 8. Escape キーの活用

**用途**: 会話履歴を失わずに中断・リダイレクト

**使用シーン**:

- Claudeが間違った方向に進んでいる時
- 急な方向転換が必要な時
- 現在の出力を停止して新しい指示を与える時

**効果**: コンテキストを保持したまま修正可能

## 9. 参考リンク

- **Claude Code Best Practices**: <https://www.anthropic.com/engineering/claude-code-best-practices>
- **Claude Projects Guide**: <https://medium.com/@Xzavior/claude-projects-a-practical-guide-807a0def71fd>
- **Claude Projects for Engineers**: <https://generaitelabs.com/the-ultimate-guide-to-claude-projects-for-software-engineers/>
