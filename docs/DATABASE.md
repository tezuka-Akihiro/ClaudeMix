# Database Setup Guide

このドキュメントでは、ClaudeMixのローカル開発環境でのデータベースセットアップ方法を説明します。

## 概要

ClaudeMixは以下のデータベースを使用します:

- **D1 (Cloudflare D1)**: SQLiteベースのデータベース
  - 本番環境: Cloudflare D1
  - ローカル開発: Wranglerが管理するローカルSQLite

## セットアップ手順

### 前提条件

- Node.js v18以上
- npm v9以上
- Wrangler CLI (自動インストール済み)

### 1. データベースの初期化

以下のコマンドでローカルデータベースをセットアップします:

#### Linux/Mac

```bash
./scripts/setup-db.sh
```

#### Windows

```cmd
scripts\setup-db.cmd
```

#### または npm script

```bash
npm run setup:db
```

このスクリプトは以下を実行します:

1. ローカルD1データベースの作成
2. マイグレーションの適用 (`migrations/*.sql`)

### 2. データベース構造

#### users テーブル

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

#### sessions テーブル

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## マイグレーション管理

### 新しいマイグレーションの作成

1. `migrations/`ディレクトリに新しいSQLファイルを作成:

   ```
   migrations/0002_add_new_feature.sql
   ```

2. マイグレーションを適用:

   ```bash
   wrangler d1 execute claudemix-dev --local --file=migrations/0002_add_new_feature.sql
   ```

### ローカルデータベースのリセット

```bash
# データベースを削除
rm -rf .wrangler/state/v3/d1/

# 再セットアップ
npm run setup:db
```

## トラブルシューティング

### エラー: "Database not found"

**原因**: ローカルデータベースが未作成
**解決策**: `npm run setup:db` を実行

### エラー: "wrangler not found"

**原因**: Wrangler CLIがインストールされていない
**解決策**: `npm install` を実行 (プロジェクトの依存関係に含まれています)

### エラー: "UNIQUE constraint failed"

**原因**: 同じメールアドレスのユーザーが既に存在
**解決策**:

- 異なるメールアドレスを使用
- またはデータベースをリセット

## 本番環境デプロイ

本番環境へのデプロイ時は、Cloudflare Dashboardで以下を設定:

1. D1データベースを作成
2. `wrangler.toml`の`database_id`を更新
3. マイグレーションを本番DBに適用:

   ```bash
   wrangler d1 execute claudemix-prod --file=migrations/0001_initial_schema.sql
   ```

## E2Eテスト用データベース

E2Eテストは開発用データベースを共有します。

テスト前に既存データをクリーンアップする場合:

```bash
# 全ユーザーとセッションを削除
wrangler d1 execute claudemix-dev --local --command "DELETE FROM sessions; DELETE FROM users;"
```

## 関連ファイル

- `migrations/0001_initial_schema.sql` - 初期スキーマ定義
- `wrangler.toml` - D1バインディング設定
- `scripts/setup-db.sh` - セットアップスクリプト (Linux/Mac)
- `scripts/setup-db.cmd` - セットアップスクリプト (Windows)
