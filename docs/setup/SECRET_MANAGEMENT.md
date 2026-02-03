# シークレット管理ガイド

## 概要

ClaudeMixプロジェクトでは、環境変数を以下のように分類して管理します。

| 種類 | 管理場所 | Git管理 |
|------|----------|---------|
| 秘匿情報（シークレットキー、個人情報等） | `.dev.vars`（ローカル）/ Cloudflare Secrets（本番） | ❌ |
| 公開可能な設定（URL、公開キー等） | `wrangler.toml` の `[vars]` セクション | ✅ |

## 環境変数の分類

### シークレット（`.dev.vars` / Cloudflare Secrets）

| 変数名 | 説明 |
|--------|------|
| `LEGAL_PRIVATE_INFO` | 特商法の個人情報（名前\|住所\|電話番号） |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー（`sk_`） |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 署名検証用 |

### 公開設定（`wrangler.toml [vars]`）

| 変数名 | 説明 |
|--------|------|
| `APP_URL` | アプリケーションURL |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID（OAuthフローで公開） |
| `GOOGLE_REDIRECT_URI` | Google OAuth リダイレクトURI |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー（`pk_`、クライアント側で使用） |

## ローカル開発環境のセットアップ

### 1. `.dev.vars` ファイルの作成

```bash
cp .dev.vars.example .dev.vars
code .dev.vars  # 実際の値を設定
```

### 2. ローカルサーバーの起動

```bash
npm run dev:wrangler
```

## 本番環境へのシークレット設定

### 個別設定

```bash
npm run secret:set LEGAL_PRIVATE_INFO
npm run secret:set GOOGLE_CLIENT_SECRET
npm run secret:set STRIPE_SECRET_KEY
npm run secret:set STRIPE_WEBHOOK_SECRET
```

### 一括設定

```bash
cp secrets.json.example secrets.json
code secrets.json  # 実際の値を設定
npm run secret:bulk secrets.json
rm secrets.json    # セキュリティのため削除
```

### 設定確認

```bash
npm run secret:list
```
