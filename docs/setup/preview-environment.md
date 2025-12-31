# Preview Environment Setup

このドキュメントでは、プレビュー環境専用のD1データベースとKVネームスペースを作成する手順を説明します。

## 🎯 目的

- **本番データの保護**: プレビュー環境（ブランチデプロイ）のテストデータが本番DBに保存されないようにする
- **安全なテスト**: テストアカウントを自由に作成・削除できる環境を提供

## 📋 前提条件

- Cloudflareアカウントへのアクセス権限
- Wrangler CLIのインストール（ローカル環境）
- Cloudflare APIトークン（CLI使用時）

## 🛠️ セットアップ手順

### 方法1: Wrangler CLI（推奨）

#### 1. D1データベースの作成

```bash
# プレビュー用D1データベースを作成
npx wrangler d1 create claudemix-preview
```

出力例：
```
✅ Successfully created DB 'claudemix-preview'

[[d1_databases]]
binding = "DB"
database_name = "claudemix-preview"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← このIDをコピー
```

#### 2. KVネームスペースの作成

```bash
# プレビュー用KVネームスペースを作成
npx wrangler kv:namespace create SESSION_KV --preview
```

出力例：
```
✅ Successfully created KV namespace

id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # ← このIDをコピー
```

#### 3. wrangler.tomlの更新

取得したIDを`wrangler.toml`の該当箇所に貼り付け：

```toml
# Preview environment configuration
[[env.preview.d1_databases]]
binding = "DB"
database_name = "claudemix-preview"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 手順1のIDに置き換え

[[env.preview.kv_namespaces]]
binding = "SESSION_KV"
id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # ← 手順2のIDに置き換え
```

#### 4. マイグレーションの適用

```bash
# プレビューDBにマイグレーションを適用
npx wrangler d1 migrations apply claudemix-preview
```

これにより、以下のマイグレーションが実行されます：
- `0001_initial_schema.sql` - 初期スキーマ（users, sessions, blog_postsテーブル）
- `0002_create_subscriptions_table.sql` - サブスクリプションテーブル
- `0003_add_subscription_status_to_users.sql` - ユーザーのサブスクリプション状態
- `0004_add_oauth_fields.sql` - OAuth認証フィールド

### 方法2: Cloudflare Dashboard（GUIで実施）

#### 1. D1データベースの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にアクセス
2. **Workers & Pages** → **D1** を開く
3. **Create database** をクリック
4. データベース名: `claudemix-preview`
5. **Create** をクリック
6. 作成されたデータベースの **Database ID** をコピー

#### 2. マイグレーションの適用（Dashboardから）

1. 作成したDB `claudemix-preview` を開く
2. **Console** タブを選択
3. 以下のSQLを順番に実行：

**0001_initial_schema.sql:**
```sql
-- migrations/0001_initial_schema.sql の内容をコピー&ペースト
```

**0002_create_subscriptions_table.sql:**
```sql
-- migrations/0002_create_subscriptions_table.sql の内容をコピー&ペースト
```

**0003_add_subscription_status_to_users.sql:**
```sql
-- migrations/0003_add_subscription_status_to_users.sql の内容をコピー&ペースト
```

**0004_add_oauth_fields.sql:**
```sql
-- migrations/0004_add_oauth_fields.sql の内容をコピー&ペースト
```

#### 3. KVネームスペースの作成

1. **Workers & Pages** → **KV** を開く
2. **Create namespace** をクリック
3. Namespace name: `claudemix-preview-SESSION_KV`
4. **Add** をクリック
5. 作成されたネームスペースの **ID** をコピー

#### 4. wrangler.tomlの更新

取得したIDを貼り付け（方法1の手順3と同じ）

## ✅ 動作確認

### 1. ローカルで確認

```bash
# プレビュー環境として起動
npm run preview
```

ブラウザで `http://localhost:8788` にアクセスし、テストアカウントを登録

### 2. デプロイ後の確認

1. ブランチをプッシュ
2. Cloudflare Pagesが自動デプロイ（preview環境）
3. プレビューURLでアクセス（例: `https://branch-name.claudemix.pages.dev`）
4. テストアカウントを登録

### 3. データの確認

```bash
# プレビューDBのユーザーを確認
npx wrangler d1 execute claudemix-preview --command="SELECT email FROM users"
```

または、Cloudflare Dashboard → D1 → `claudemix-preview` → Console:
```sql
SELECT * FROM users;
```

## 🗑️ テストデータのクリーンアップ

### 特定のユーザーを削除

```bash
npx wrangler d1 execute claudemix-preview \
  --command="DELETE FROM users WHERE email = 'test@example.com'"
```

### すべてのテストデータを削除

```bash
npx wrangler d1 execute claudemix-preview \
  --command="DELETE FROM users WHERE email LIKE '%test%'"
```

### Dashboard から削除

Cloudflare Dashboard → D1 → `claudemix-preview` → Console:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

## 📚 環境の使い分け

| 環境 | ブランチ | データベース | 用途 |
|------|---------|-------------|------|
| **Local** | - | `claudemix-dev` (ローカルDB) | ローカル開発 |
| **Preview** | feature/*<br>claude/*<br>など | `claudemix-preview` | ブランチのテスト |
| **Production** | main/master | `claudemix-prod` | 本番環境 |

## ⚠️ 注意事項

1. **preview環境は全ブランチで共有**
   - ブランチAで登録したユーザーは、ブランチBでもアクセス可能
   - データの衝突に注意（メールアドレスの重複など）

2. **KVの有効期限**
   - セッションデータは一定期間で自動削除される（通常7日間）
   - 長期間使わないテストアカウントのセッションは期限切れになる可能性

3. **本番データへの影響なし**
   - プレビュー環境のデータは完全に独立
   - 本番DBに影響を与えることはない

## 🔧 トラブルシューティング

### エラー: "Database not found"

wrangler.tomlのdatabase_idが正しく設定されているか確認してください。

### エラー: "KV namespace not found"

wrangler.tomlのKV namespace IDが正しく設定されているか確認してください。

### マイグレーションエラー

既に適用済みのマイグレーションを再度適用しようとした場合：
```bash
# マイグレーション状態を確認
npx wrangler d1 migrations list claudemix-preview
```

## 📝 更新履歴

- 2025-XX-XX: 初版作成（プレビュー環境の分離）
