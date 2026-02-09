# 【機能修正提案】Stripe決済フロー修正

- **サービス**: `account`
- **セクション**: `subscription`
- **関連ドキュメント**:
  - `develop/account/subscription/func-spec.md`
  - `develop/account/subscription/uiux-spec.md`
  - `develop/account/subscription/data-flow-diagram.md`
  - `app/specs/account/subscription-spec.yaml`
  - `app/routes/account.subscription.tsx`
  - `app/routes/api.webhooks.stripe.tsx`

---

## 1. 提案概要

購入ボタンから Stripe Checkout への遷移が `useFetcher` の外部URL リダイレクト非対応により動作しないバグを修正し、サンドボックス環境で購入→Webhook→ステータス更新の全フローを検証可能にする。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- 購入ボタンのクリックで `fetcher.submit()` → action → `redirect(stripeCheckoutUrl)` を実行
- `useFetcher` は内部的に `fetch()` API を使用するため、外部URL（`https://checkout.stripe.com/...`）への 302 リダイレクトを **ブラウザナビゲーション**ではなく **AJAX リクエスト**として処理
- 結果: Stripe の HTML レスポンスを Remix のローダー応答として解釈しようとし、**サイレントに失敗**（ユーザーには何も起こらない）
- サンドボックスでの E2E テストは購入ボタンのクリックまでで、Stripe Checkout への実際の遷移は未検証

### 修正後 (To-Be)

- action から Stripe Checkout URL を JSON で返却し、クライアント側で `window.location.href` によりナビゲーション
- 購入ボタン → Stripe Checkout → 決済完了 → Webhook → D1 更新 → 成功画面表示の全フローが動作
- サンドボックス環境（Stripe テストモード）で全フローの E2E 検証済み

## 3. 背景・目的

### 背景

Stripe サブスクリプション機能は設計・実装ともに完了しているが、購入ボタンの `useFetcher` + `redirect()` の組み合わせにより外部URL への遷移が機能しない。これは Remix の `useFetcher` が `fetch()` API を内部利用することによる仕様上の制約であり、コード上のバグ。

### 目的

- **目的1**: 購入フローの正常動作（Stripe Checkout への遷移を実現）
- **目的2**: サンドボックス環境での全決済フロー（購入→Webhook→ステータス反映）の検証
- **目的3**: 本番環境導入に向けた基盤整備（本番キー設定手順の確立）

## 4. 変更の妥当性 (Pros / Cons)

Pros (利点):

- 最小限の変更（action の戻り値形式 + クライアント側の useEffect 追加）で根本原因を解消
- Remix の設計思想に沿った対処（fetcher は内部リクエスト用、外部遷移は明示的に処理）
- サンドボックス検証により本番導入前にフロー全体の品質を担保できる
- 既存のテスト・Webhook 実装・data-io 層に変更不要

Cons (懸念点):

- action の戻り値形式が `redirect()` から `json({ checkoutUrl })` に変わるため、E2E テストの期待値を調整する必要がある
- `window.location.href` による遷移は SPA のクライアントサイドナビゲーションではなくフルページリロード（ただし外部サイトへの遷移なので問題なし）

**総合評価**:

Cons は実質的な影響がなく、Pros が大きい。3大層分離アーキテクチャへの影響も route 層の action/UI のみに限定されるため、**妥当性は非常に高い**。

## 5 設計フロー

### 🗾GUIDING_PRINCIPLES.md

**変更なし** - アーキテクチャ原則・データストレージ戦略に影響なし。

### 📚️func-spec.md

**変更なし** - 機能要件自体は変わらない。購入フローの内部実装詳細の修正であり、機能仕様レベルの変更ではない。

### 🖼️uiux-spec.md

**変更なし** - UI の表示・インタラクションパターンは同一。内部的な遷移メカニズムの変更のみ。

### 📋️spec.yaml

**変更なし** - プラン設定、エラーメッセージ、ルーティング設定はすべて既存のまま利用可能。

### 🗂️file-list.md

**変更あり** - E2E テストファイルの追記（ライフサイクルテストの明記）

```diff
## 1. E2Eテスト

| ファイル名 | パス |
| :--- | :--- |
| subscription.spec.ts | tests/e2e/account/subscription.spec.ts |
+| subscription-lifecycle.spec.ts | tests/e2e/account/subscription-lifecycle.spec.ts |
```

### 🧬data-flow-diagram.md

**変更あり** - Checkout フローの詳細追記

```diff
+### Checkout フロー (購入)
+
+```mermaid
+graph TD
+    User((ユーザー)) --> Button["購入ボタン click"]
+    Button --> Fetcher["fetcher.submit (POST)"]
+    Fetcher --> Action["action: createStripeCheckoutSession"]
+    Action --> JSON["json({ checkoutUrl })"]
+    JSON --> Effect["useEffect: window.location.href"]
+    Effect --> StripeCheckout["Stripe Checkout (外部)"]
+    StripeCheckout -- "決済完了" --> SuccessRedirect["/account/subscription?success=true"]
+    StripeCheckout -- "Webhook" --> WebhookEndpoint["api.webhooks.stripe"]
+```
```

## 6 TDD_WORK_FLOW.md 簡易版

### 👁️e2e-screen-test

- `tests/e2e/account/subscription.spec.ts` — 購入ボタンクリック後のfetcher状態変化（処理中→遷移）の検証を調整

### 👁️e2e-section-test

- `tests/e2e/account/subscription-lifecycle.spec.ts` — 変更なし（Webhook モック経由のライフサイクルテストは既存のまま）

### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)

- 変更なし

### 🪨route

- `app/routes/account.subscription.tsx` — **action**: `redirect(checkoutUrl)` → `json({ checkoutUrl })` に変更。**UI**: `useEffect` で `fetcher.data?.checkoutUrl` を検知し `window.location.href` で遷移

### 🚧components.test

- 変更なし

### 🪨components

- 変更なし

### 🚧logic.test

- 変更なし

### 🪨logic

- 変更なし

### 🚧data-io.test

- 変更なし

### 🪨data-io

- 変更なし

### その他

- サンドボックス検証手順書（下記に記載）

---

## 7 サンドボックス検証手順

### 前提条件

- `.dev.vars` に以下が設定済み:
  - `STRIPE_SECRET_KEY` (sk_test_...)
  - `STRIPE_WEBHOOK_SECRET` (whsec_...)
- `wrangler.toml` に `STRIPE_PUBLISHABLE_KEY` (pk_test_...) が設定済み
- Stripe Dashboard でテストモードが有効

### 検証 1: 購入フロー（Stripe Checkout 遷移）

1. `npm run dev:wrangler` でローカルサーバー起動
2. ブラウザで `/register` にアクセスし、テストユーザーを作成
3. `/account/subscription` にアクセス
4. 「スタンダード」プランの「購入」ボタンをクリック
5. **期待**: Stripe Checkout 画面が表示される（`checkout.stripe.com` に遷移）
6. テストカード `4242 4242 4242 4242` (有効期限: 任意の未来日, CVC: 任意3桁) で決済
7. **期待**: `/account/subscription?success=true` にリダイレクトされ、成功メッセージが表示

### 検証 2: Webhook 受信（ローカル）

1. Stripe CLI をインストール: `stripe login`
2. Webhook のローカル転送を開始: `stripe listen --forward-to localhost:8788/api/webhooks/stripe`
3. 表示される Webhook Signing Secret (`whsec_...`) を `.dev.vars` の `STRIPE_WEBHOOK_SECRET` に設定
4. 検証 1 の購入フローを実行
5. **期待**: Stripe CLI のログに `checkout.session.completed` イベントが表示
6. **期待**: D1 の `subscriptions` テーブルにレコードが作成される
7. **期待**: D1 の `users` テーブルの `subscription_status` が `active` に更新

### 検証 3: ステータス反映の確認

1. 検証 2 完了後、`/account/subscription` をリロード
2. **期待**: 購入済みプランのボタンが「契約中」と表示される
3. `/account/settings` にアクセス
4. **期待**: サブスクリプション状態が表示される

### 検証 4: 決済失敗テスト

1. 新しいテストユーザーを作成
2. `/account/subscription` で購入ボタンをクリック
3. テストカード `4000 0000 0000 0002`（常に拒否）で決済を試みる
4. **期待**: Stripe Checkout 上でエラーメッセージが表示される

### 検証 5: 決済キャンセルテスト

1. `/account/subscription` で購入ボタンをクリック
2. Stripe Checkout 画面で「← 戻る」をクリック
3. **期待**: `/account/subscription` にリダイレクトされる（エラーなし）

### テストカード一覧（Stripe テストモード）

| カード番号 | 動作 |
| :--- | :--- |
| `4242 4242 4242 4242` | 成功 |
| `4000 0000 0000 0002` | 拒否 |
| `4000 0025 0000 3155` | 3D Secure 認証要求 |
