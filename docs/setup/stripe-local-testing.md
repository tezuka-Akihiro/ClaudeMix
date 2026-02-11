# Stripe ローカル開発・テストガイド

このドキュメントでは、ClaudeMix の開発環境において Stripe 連携機能をテストする方法について説明します。

## テスト方法の選択

開発状況に応じて、以下の 2 つの方法を選択できます。

1. **モックモード (推奨: UI/E2Eテスト)**: Stripe API を呼び出さずに、成功レスポンスをシミュレートします。
2. **リアルテストモード (推奨: 機能開発)**: Stripe のテスト用 API キーを使用し、実際に Stripe の決済画面や Webhook を連携させます。

---

## 1. モックモードの使用

Stripe API キーを設定せずに、チェックアウトフローの UI 挙動のみを確認したい場合に使用します。

### 設定方法

`.dev.vars` に以下の設定を追加します。

```bash
ENABLE_STRIPE_MOCK=true
```

### 挙動
- チェックアウトボタンをクリックすると、Stripe の決済画面へは遷移せず、即座に成功 URL（`/account/subscription?success=true`）にリダイレクトされます。
- サブスクリプションのキャンセル・再開操作も、API を呼び出さずに成功したとみなされます。
- **注意**: データベース上のステータスは自動的には更新されません（Webhook が飛ばないため）。

---

## 2. リアルテストモードの使用

Stripe のテスト環境を使用して、実際の決済フローとデータベース更新（Webhook）を確認する場合に使用します。

### 事前準備

1. [Stripe ダッシュボード](https://dashboard.stripe.com/)でテストモードのアカウントを作成します。
2. [Stripe CLI](https://stripe.com/docs/stripe-cli) をインストールします。

### 設定方法

1. `.dev.vars` にテスト用キーを設定します。

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe CLI 起動時に表示される値
```

2. プランの Price ID を `app/specs/account/subscription-spec.yaml` に設定します。

### Webhook のローカル転送

Stripe からの Webhook をローカルの開発サーバーで受信するために、Stripe CLI を使用します。

```bash
# Webhook のリスニングを開始（別ターミナルで実行）
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

実行時に表示される `Your webhook signing secret is whsec_...` という値を、`.dev.vars` の `STRIPE_WEBHOOK_SECRET` に設定してサーバーを再起動してください。

### テスト実行フロー

1. `npm run dev:wrangler` でサーバーを起動。
2. `stripe listen` で Webhook 転送を開始。
3. ブラウザで `/account/subscription` にアクセス。
4. プランを選択し、Stripe のテスト決済画面で[テスト用カード番号](https://stripe.com/docs/testing)（例: 4242...）を入力。
5. 決済完了後、自動的にアプリに戻り、Webhook によってデータベースのステータスが更新されることを確認。

---

## トラブルシューティング

### 500 Internal Server Error が発生する
- `STRIPE_SECRET_KEY` が正しく設定されているか確認してください。
- `ENABLE_STRIPE_MOCK=true` を設定している場合は、サーバーを再起動して設定を反映させてください。

### Webhook が届かない
- `stripe listen` が実行されているか確認してください。
- `.dev.vars` の `STRIPE_WEBHOOK_SECRET` が `stripe listen` で表示された値と一致しているか確認してください。
