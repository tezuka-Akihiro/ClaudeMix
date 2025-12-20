---
slug: "mcp-guide"
title: "AI開発の未来を変える「MCP」とは？ Claudeと開発ツールを連携させる新常識"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
category: "Claude Best Practices"
description: "AIとの開発、まだ手作業で消耗していませんか？本記事では、AIが自律的に開発ツールを操作する未来を実現する「Model Context Protocol (MCP)」を徹底解説。ClaudeMixでの具体的な活用事例も紹介します。"
tags: ["MCP", "architecture"]
---
## 📝 概要

「このファイルの内容を教えて」「このテストを実行して結果を教えて」

AI、特にClaudeを使った開発で、このようなやり取りを繰り返していませんか？ もしAIが、あなたの代わりに自律的にファイルを参照し、テストを実行し、その結果を解釈してくれたら、開発体験は劇的に変わるはずです。

この記事では、そんな未来を実現するための鍵となる技術、**Model Context Protocol (MCP)** について、社内向けにまとめたドキュメントを元に、分かりやすく解説します。

### この記事を読むと何がわかるか

- AI開発における「コンテキスト共有」の課題
- MCPが「AIのUSB-Cポート」と呼ばれる理由
- MCPの基本的な仕組みとアーキテクチャ
- 私たちのプロジェクト「ClaudeMix」で、MCPを使って開発ワークフローを自動化している具体的な方法

### ターゲット読者

- Claudeを使った開発の効率をさらに高めたいエンジニア
- AIに開発プロセスの一部を自律的に任せたいと考えているテックリード
- AIアプリケーションと外部ツールの連携に興味がある開発者

---

## 1. MCPとは何か？ なぜ必要なのか？

MCP（Model Context Protocol）（※）は、**AIアプリケーションが外部のデータソースやツールと文脈（コンテキスト）を共有するための、標準化されたオープンプロトコル（※）**です。

> ※ **MCP (Model Context Protocol)**: AIが外部ツールやデータと連携するための標準的な通信ルール。
> ※ **プロトコル**: コンピュータ同士が通信するときの約束事のこと（例: HTTPはWebの通信ルール）。

### アナロジー

#### MCPはAIアプリケーションのUSB-Cポートのようなもの

- USB-C: デバイスと周辺機器を標準的な方法で接続
- MCP: AIモデルと異なるデータソース/ツールを標準的な方法で接続

これまでのAIとのやり取りは、人間が手動で情報をコピー＆ペーストし、AIにコンテキストを「注入」する必要がありました。MCPは、このプロセスを自動化し、AIが自ら外部の世界（ファイルシステム、データベース、APIなど）と対話するための「標準語」を提供するのです。

---

## 2. MCPの仕組み：クライアント・ホスト・サーバーモデル（※）

> ※ **クライアント・サーバーモデル**: サービスを提供する側（サーバー）と、利用する側（クライアント）に役割を分ける仕組み。

```text
┌─────────────────────┐
│   MCP Host          │ ← AIアプリケーション（Claude Code（※）, Claude Desktop等）
│   ┌───────────┐     │
│   │ Client 1  │─────┼─→ MCP Server 1 (Google Drive)
│   ├───────────┤     │
│   │ Client 2  │─────┼─→ MCP Server 2 (Slack)
│   ├───────────┤     │
│   │ Client 3  │─────┼─→ MCP Server 3 (GitHub)
│   └───────────┘     │
└─────────────────────┘
```

> ※ **Claude Code**: Claudeを使った開発支援ツール。コードを読んだり、ファイルを操作したりできる。

### 主要コンポーネント

| コンポーネント | 役割 | 数 |
| :--- | :--- | :--- |
| **MCP Host** | AIアプリケーション本体、複数クライアントを調整・管理 | 1個 |
| **MCP Client** | 各サーバーとの接続を維持、文脈を取得 | 複数（サーバー数に応じて） |
| **MCP Server** | 外部データソース/ツールへのアクセスを提供 | 複数 |

### 接続モデル

**1対1の専用接続**: 各MCPクライアントは、対応する1つのMCPサーバーとの専用接続を維持

## 3. プロトコル層

### データ層

**定義**: JSON-RPC（※）ベースのクライアント・サーバー通信プロトコル

> ※ **JSON-RPC**: JSON形式でデータをやり取りする通信方式。シンプルで広く使われている。

**含まれる要素**:

- ライフサイクル管理
- コアプリミティブ:
  - **Tools**: 実行可能な機能
  - **Resources**: アクセス可能なデータ
  - **Prompts**: テンプレート化された指示
  - **Notifications**: イベント通知

### トランスポート層

**定義**: データ交換を可能にする通信メカニズムとチャネル

**含まれる要素**:

- トランスポート固有の接続確立
- メッセージフレーミング
- 認証

## 4. Anthropic製品での統合

| 製品 | 統合方法 | 用途 |
| :--- | :--- | :--- |
| **Messages API** | APIコネクター経由 | プログラマティックなMCPサーバー接続 |
| **Claude Code** | サーバー追加 or Claude Code自体をサーバー化 | 開発ツール統合 |
| **Claude.ai** | チームでMCPコネクター有効化 | エンタープライズ機能拡張 |
| **Claude Desktop** | ローカルMCPサーバー統合 | デスクトップアプリ拡張 |

## 5. 事前構築済みサーバー

Anthropicが提供する主要なエンタープライズシステム用サーバー:

- **Google Drive**: ドキュメントアクセス
- **Slack**: メッセージ履歴、チャンネル情報
- **GitHub**: リポジトリ、Issue、PR
- **Git**: ローカルリポジトリ操作
- **Postgres**: データベースクエリ
- **Puppeteer**: Webスクレイピング、自動化

## 6. SDK と仕様

### 提供されるSDK

- **Python**
- **TypeScript**
- **C#**
- **Java**

### 公開リソース

- **GitHub**: <https://github.com/modelcontextprotocol>
- **仕様**: <https://spec.modelcontextprotocol.io>
- **公式サイト**: <https://modelcontextprotocol.io>

## 7. Claude Code での MCP 使用

### サーバーの追加方法

```bash
# MCPサーバーを追加
claude mcp add <server-name>

# 利用可能なサーバー一覧
claude mcp list
```

### 設定ファイル

`.claude/mcp.json`:

```json
{
  "mcpServers": {
    "test-runner": {
      "command": "npm",
      "args": ["test"],
      "description": "Layer 1: テスト実行の自動化（公式推奨）"
    },
    "coverage-checker": {
      "command": "npm",
      "args": ["run", "test:coverage"],
      "description": "Layer 2: 層ごとのカバレッジ検証"
    }
  }
}
```

### Claude Code自体をMCPサーバーとして使用

他のAIアプリケーションからClaude Codeの機能を利用可能

## 8. セキュリティモデル

### 基本原則

- **ローカル優先**: Claude Desktopではローカルサーバーをサポート
- **明示的な許可**: サーバーへのアクセスはユーザーが明示的に許可
- **サンドボックス化**: 各サーバーは独立した環境で実行

### ベストプラクティス

1. **最小権限の原則**: サーバーには必要最小限の権限のみ付与
2. **認証の実装**: トランスポート層での適切な認証
3. **データ検証**: サーバーから受信したデータの検証
4. **エラーハンドリング**: 適切なエラー処理と復旧メカニズム

## 9. MCP サーバーの実装（概要）

### 基本構造

```python
# Python SDK example
from mcp import Server, Tool, Resource

server = Server("my-server")

@server.tool()
def my_tool(arg: str) -> str:
    """ツールの説明"""
    return f"Result: {arg}"

@server.resource("data://mydata")
def my_resource() -> dict:
    """リソースの提供"""
    return {"data": "value"}

if __name__ == "__main__":
    server.run()
```

### 実装ステップ

1. **サーバー定義**: サーバーの名前と説明を設定
2. **Tools実装**: 実行可能な機能を定義
3. **Resources実装**: アクセス可能なデータを定義
4. **Prompts実装**: テンプレート化された指示を定義（オプション）
5. **トランスポート設定**: 通信方法を設定
6. **テスト**: ローカル環境でテスト

## 10. Layer 1（公式準拠）への適用

### Remix-boilerplate での活用

#### 品質チェックツールの統合

`.claude/mcp.json`:

```json
{
  "mcpServers": {
    "lint-checker": {
      "command": "node",
      "args": ["scripts/lint-template/engine.js"],
      "description": "コーディング規律の強制"
    },
    "test-runner": {
      "command": "npm",
      "args": ["test"],
      "description": "テスト実行の自動化"
    },
    "coverage-checker": {
      "command": "npm",
      "args": ["run", "test:coverage"],
      "description": "カバレッジ検証"
    },
    "css-arch-checker": {
      "command": "npm",
      "args": ["run", "lint:css-arch"],
      "description": "CSSアーキテクチャ検証"
    }
  }
}
```

#### 自動実行フロー

```text
1. ユーザー: 「実装完了しました」
2. Claude: MCPサーバー「lint-checker」を起動
   → リント結果を取得
3. Claude: 問題があれば自動修正
4. Claude: MCPサーバー「test-runner」を起動
   → テスト結果を取得
5. Claude: テストが失敗していれば修正
6. Claude: MCPサーバー「coverage-checker」を起動
   → カバレッジレポートを分析
7. Claude: 「全てのチェックに合格しました」
```

### メリット

- **自動化**: 手動でのコマンド実行が不要
- **一貫性**: 常に同じチェックプロセスを実行
- **効率性**: Claudeが結果を解釈し、即座に対応

### 参考リンク

- **MCP Documentation**: <https://docs.claude.com/en/docs/mcp>
- **Official Announcement**: <https://www.anthropic.com/news/model-context-protocol>
- **GitHub Repository**: <https://github.com/modelcontextprotocol>
- **Specification**: <https://spec.modelcontextprotocol.io>
- **Architecture Overview**: <https://modelcontextprotocol.io/docs/learn/architecture>
- **Claude Code MCP Integration**: <https://docs.anthropic.com/en/docs/claude-code/mcp>
