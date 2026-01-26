---
slug: "mcp-guide"
title: "AI開発の未来を変える「MCP」とは？ Claudeと開発ツールを連携させる新常識"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "ガイド"
description: "Claudeと外部ツールを連携させる標準プロトコル「MCP (Model Context Protocol)」の完全ガイド。GitHubやDBとの接続方法、HTTP/Stdioサーバーの使い分け、Tool Searchによるコンテキスト最適化など、AIをチームの一員として機能させるための実装手法を解説します。"
tags: ["MCP"]
---

## 📝 概要

AIとの開発は「指示」から「協調」のフェーズへ。
**Model Context Protocol (MCP)** は、Claudeがあなたの開発環境（ファイル、DB、外部API）と直接対話するための標準プロトコルです。

これまでの「コピペによるコンテキスト注入」は不要です。MCPを導入することで、Claudeは自律的にIssueを読み、DBスキーマを確認し、プルリクエストを作成する「チームメンバー」へと進化します。

### 本ガイドで得られる知識

- **最新の接続方式**: HTTP / Stdio サーバーの使い分け
- **新機能**: Tool Searchによるコンテキストの最適化
- **実戦フロー**: GitHub、PostgreSQL、Sentryとの高度な連携
- **セキュリティ**: スコープ管理（Local / Project / User）による安全な運用

---

## 1. MCPのアーキテクチャ：AIの「手」を標準化する

MCPは、AIアプリケーション（Host）と外部データ（Server）を繋ぐUSB-Cポートのような役割を果たします。

### 主要コンポーネント

- **MCP Host**: Claude CodeやClaude Desktop。複数のクライアントを統制。
- **MCP Server**: Google Drive, GitHub, Slack, または自作のツール。
- **リソースとツール**: AIが「読めるデータ（Resources）」と「実行できる機能（Tools）」。

---

## 2. Claude Code へのサーバー追加（最新コマンド）

現在、主に3つのトランスポート方式がサポートされています。

### ① HTTPサーバー（推奨・クラウド連携用）

リモートサービスとの接続に最適です。

```bash
# 基本構文
claude mcp add --transport http <名前> <URL>

# 実例：Notionとの連携
claude mcp add --transport http notion [https://mcp.notion.com/mcp](https://mcp.notion.com/mcp)

```

### ② Stdioサーバー（ローカルツール用）

自身のPC上のスクリプトやバイナリを実行します。

```bash
# 実例：Airtableサーバー（APIキーを環境変数で渡す）
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable -- npx -y airtable-mcp-server

```

### ③ Windowsユーザー向けの注意

WSL以外で`npx`を使用する場合、`cmd /c`ラッパーが必要です。

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package

```

---

## 3. インストールスコープの使い分け

設定の保存場所を適切に選ぶことで、セキュリティと共有のバランスを取ります。

| スコープ | 保存先 | 用途 |
| --- | --- | --- |
| **local** (既定) | `~/.claude.json` | 現在のプロジェクトのみで有効な個人設定。 |
| **project** | `.mcp.json` | **gitで共有可能**。チーム全員で同じツール（テスト実行機等）を共有。 |
| **user** | `~/.claude.json` | 全プロジェクトで共通して使う個人用ツール（GitHub連携等）。 |

---

## 4. 2026年の新機能：MCP Tool Search

大量のMCPサーバーを接続すると、ツールの説明だけでAIの記憶（コンテキスト）が埋まってしまいます。これを解決するのが **Tool Search** です。

- **自動最適化**: ツール定義がコンテキストの10%を超えると、Claudeは必要なツールのみをオンデマンドで検索・ロードします。
- **設定**: `ENABLE_TOOL_SEARCH=auto`（デフォルト）で動作。大量のツールを抱えても、AIの推論精度が落ちません。

---

## 5. 実戦活用シナリオ

### シナリオA：Issueから実装・PR作成まで

1. **GitHub連携**: `claude mcp add --transport http github https://api.githubcopilot.com/mcp/`
2. **指示**: 「Issue #123の内容を分析して、必要な修正を行い、PRを作成して」
3. **挙動**: ClaudeがIssueを読み、ローカルコードを修正し、`gh`ツールでPRを出します。

### シナリオB：本番エラーの自動デバッグ

1. **Sentry連携**: Sentry MCPを接続。
2. **指示**: 「過去24時間で最も発生しているエラーのスタックトレースを確認し、修正案を提示して」
3. **挙動**: ClaudeがSentryからログを取得し、該当コードを特定して修正計画を立てます。

---

## 6. 管理・メンテナンス

設定したサーバーの状態確認や削除は以下のコマンドで行います。

```bash
# 接続中のサーバー一覧とステータス表示
claude mcp list

# 特定サーバーの詳細確認
claude mcp get github

# サーバーの削除
claude mcp remove github

# (Claude Code起動中) 認証や再接続の対話メニュー
/mcp

```

---

## 7. 開発者のためのベストプラクティス

1. **最小権限**: MCPサーバーには必要最小限のAPIスコープのみ付与してください。
2. **計画優先**: ツールを動かす前に必ず `「まず計画を立てて」` と伝え、無駄なAPIコールを防ぎます。
3. **.mcp.json の活用**: チーム開発ではプロジェクトスコープを使用し、リントやテストの自動実行環境をコードと共に管理しましょう。

---

**参照元**:

- [Anthropic公式: Connect Claude Code to tools via MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol 公式サイト](https://modelcontextprotocol.io/)
