---
slug: "mcp-guide"
title: "AI開発の未来を変える「MCP」とは？ Claudeと開発ツールを連携させる新常識"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "ClaudeMix ガイド"
description: "Claudeと外部ツールを連携させる標準プロトコル「MCP (Model Context Protocol)」の完全ガイド。GitHubやDBとの接続方法、HTTP/Stdioサーバーの使い分け、Tool Searchによるコンテキスト最適化など、AIをチームの一員として機能させるための実装手法を解説します。"
tags: ["MCP"]
freeContentHeading: "MCPのアーキテクチャ：AIの「手」を標準化する"
---

## はじめに

### AIに「今のコードベースの外側」のことを聞いても、的外れな回答が返ってきませんか？

最新のIssue、本番環境のDBスキーマ、Slackでの議論。これらをAIに伝えるために、人間がコピペを繰り返す。
この手動のコンテキスト注入は、情報の鮮度を落とすだけでなく、AIが「今、現実に起きていること」から切り離され、空想の提案を始める原因となります。

### この記事をお勧めしない人

- AIは「コードの断片を生成するだけ」のツールで十分だと思っている人。
- 外部ツールとの連携に伴う、プロトコルの理解や設定を「面倒な作業」だと感じる人。
- AIをチームの一員としてではなく、単なる「高性能な検索エンジン」として扱いたい人。

### 「隔離されたAI」が招く情報の断絶

- AIが最新の外部データにアクセスできないと、修正案が既存のIssueやドキュメントと矛盾し、手戻りが発生する。
- 人間が情報の橋渡し役（プロキシ）として働き続けることで、開発の純粋な思考時間が奪われていく。
- やがてAIの回答は「一般論」に終始するようになり、プロジェクト固有の複雑な課題には手も足も出なくなります。

### MCP という「AIの標準インターフェース」

- この記事を読めば、AIが外部ツールと直接対話する「標準の口」を手に入れ、真の自律稼働を実現する明るい未来があります。
- 具体的には、GitHubやDB、SentryとAIを繋ぎ、コンテキストの自動同期を可能にする MCP の実装手法を習得できます。
- この方法は、最新のAI開発において、人間がコピペから解放され、より高度な設計に集中するための必須基盤です。
- この情報は、AIを「独立した開発者」へと進化させるための、2026年のエンジニアにとっての最強の武器です。

### このブログもそうでした

筆者も、AIに外部の情報を伝えるためのコピペ作業に疲れ果て、AIの「無知」による誤提案に何度も泣かされました。
この記事で、プロトコルという名の「手」をAIに授け、開発環境全体をAIの味方にするためのTipsを凝縮しました。
AIの可能性を限界まで引き出したい方は、MCPの仕組みと活用法を確認できます。

---

## 開発の進捗

- **Before**: 外部ツール（GitHub/DB等）の情報をAIに伝える際、手動のコピペに頼らざるを得ず、情報の不整合が発生していた。
- **Current**: Model Context Protocol (MCP) を導入し、AIが直接外部リソースやツールにアクセスできる「標準の口」を確立。
- **Next**: 自作のMCPサーバーを拡充し、プロジェクト固有の社内ツールや独自ドメインのデータともAIをシームレスに連携させる。

## 具体的なタスク

- **Before**: 各ツールのAPI仕様を都度プロンプトに記述し、AIのコンテキストを浪費していた。
- **Current**: HTTP/Stdioトランスポートを用いたMCPサーバー接続と、Tool Searchによるコンテキスト最適化を実装。
- **Next**: `.mcp.json` によるプロジェクト単位のツール共有を徹底し、チーム全体でAIの自律性を底上げする。

## MCPのアーキテクチャ：AIの「手」を標準化する

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
