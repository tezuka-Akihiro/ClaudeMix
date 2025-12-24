# subscription - 機能設計書

## 📋 機能概要

### 機能名

Subscription Management (サブスクリプション管理)

### 所属サービス

**account** の **subscription** セクションに配置

### 機能の目的・価値

- **解決する課題**: ユーザーが有料プランに登録し、サブスクリプションを管理できる機能を提供する
- **提供する価値**:
  - 複数プラン（1ヶ月/3ヶ月/6ヶ月）の選択
  - Stripe Checkoutによる安全な決済
  - サブスクリプション状態の管理（有効化、キャンセル、更新）
  - 請求履歴の表示
- **ビジネス効果**: 収益化、継続的な課金、ユーザーエンゲージメント向上

### 実装優先度

**MEDIUM** - MVPでは基本的な購読機能のみ実装、高度な機能は将来実装

## 🎯 機能要件

### 基本機能

#### 1. プラン選択と購読開始 (Plan Selection & Checkout)

**URL**: `/account/subscription`

**機能**:

- 利用可能なプランの表示（1ヶ月/3ヶ月/6ヶ月）
- プラン詳細の表示（価格、期間、特典）
- Stripe Checkoutへのリダイレクト
- 決済完了後のリダイレクト処理

**表示データ**:

- プラン名、価格、期間
- 現在のサブスクリプション状態
- 次回請求日（契約中の場合）

**処理フロー**:

1. 利用可能なプラン一覧取得
2. ユーザーのサブスクリプション状態取得
3. プラン選択
4. Stripe Checkout Session作成
5. Stripe Checkoutへリダイレクト
6. 決済完了後、Webhookでサブスクリプション状態更新
7. `/account/subscription?success=true`へリダイレクト

#### 2. サブスクリプション管理 (Subscription Management)

**URL**: `/account/subscription`

**機能**:

- 現在のサブスクリプション情報表示
- サブスクリプションキャンセル
- プラン変更（将来実装）
- 請求履歴表示（将来実装）

**表示データ**:

- 契約プラン名
- 契約状態（active/canceled/past_due/trialing）
- 契約開始日
- 次回請求日
- 月額料金

**処理フロー（キャンセル）**:

1. キャンセル確認ダイアログ表示
2. Stripe APIでサブスクリプションキャンセル
3. DBのサブスクリプション状態更新
4. 成功メッセージ表示

#### 3. Webhook処理 (Webhook Handler)

**URL**: `/api/webhooks/stripe`

**機能**:

- Stripeからのイベント受信
- イベント検証（署名チェック）
- サブスクリプション状態の同期

**処理対象イベント**:

- `checkout.session.completed`: 決済完了、サブスクリプション有効化
- `customer.subscription.updated`: サブスクリプション更新
- `customer.subscription.deleted`: サブスクリプションキャンセル
- `invoice.paid`: 請求成功
- `invoice.payment_failed`: 請求失敗

**処理フロー**:

1. Webhookイベント受信
2. 署名検証
3. イベントタイプ判定
4. サブスクリプション状態更新（D1 Database）
5. 200 OKレスポンス返却

## 📂 app/components要件

### UI Components

#### 1. PlanSelector

**配置**: `app/components/account/subscription/PlanSelector.tsx`

**責務**:

- 利用可能なプラン一覧の表示
- プラン選択UI

**主要なUI要素**:

- プランカード × 3（1ヶ月/3ヶ月/6ヶ月）
- プラン名、価格、期間、特典リスト
- 「購読する」ボタン（Button使用）
- 現在契約中のプランには「契約中」バッジ表示

#### 2. SubscriptionStatus

**配置**: `app/components/account/subscription/SubscriptionStatus.tsx`

**責務**:

- 現在のサブスクリプション情報の表示
- 管理アクション（キャンセル等）へのリンク

**主要なUI要素**:

- 契約プラン名表示
- 契約状態バッジ（active/canceled/past_due）
- 次回請求日表示
- 「キャンセル」ボタン（Button variant="danger"）

#### 3. CancelSubscriptionModal

**配置**: `app/components/account/subscription/CancelSubscriptionModal.tsx`

**責務**:

- サブスクリプションキャンセル確認モーダル
- キャンセル理由の選択（オプション）

**主要なUI要素**:

- キャンセル警告メッセージ
- キャンセル理由選択（将来実装）
- 「キャンセル実行」ボタン（Button variant="danger"）
- 「戻る」ボタン（Button variant="secondary"）

### Routes

#### 1. account.subscription.tsx

**配置**: `app/routes/account.subscription.tsx`

**責務**:

- サブスクリプション管理ページのRoute定義
- loader: サブスクリプション情報取得
- action: Stripe Checkout作成、サブスクリプションキャンセル

**loader処理**:

- セッション検証（AuthGuardで実行）
- ユーザーのサブスクリプション情報取得
- 利用可能なプラン一覧取得
- データ返却

**action処理**:

1. intent判定（create-checkout, cancel-subscription）
2. create-checkout: Stripe Checkout Session作成、URLを返却
3. cancel-subscription: Stripeでキャンセル実行、DB更新

#### 2. api.webhooks.stripe.tsx

**配置**: `app/routes/api.webhooks.stripe.tsx`

**責務**:

- Stripe Webhookの受信と処理
- イベント署名の検証
- サブスクリプション状態の同期

**処理**:

1. リクエストボディ取得
2. Stripe署名検証
3. イベントタイプ判定
4. 対応するハンドラー実行
5. 200 OKレスポンス

## 🧠 純粋ロジック要件

### lib層の関数

#### 1. calculatePlanPrice

**配置**: `app/lib/account/subscription/calculatePlanPrice.ts`

**責務**: プラン価格の計算（割引適用など）

**入力**: プランID

**処理**: プラン期間に応じた価格計算

**出力**: 価格（number）

#### 2. formatSubscriptionStatus

**配置**: `app/lib/account/subscription/formatSubscriptionStatus.ts`

**責務**: サブスクリプション状態の表示用フォーマット

**入力**: 状態（active/canceled/past_due/trialing）

**処理**: 日本語ラベルとバッジカラーを返却

**出力**: { label: string, variant: string }

#### 3. calculateNextBillingDate

**配置**: `app/lib/account/subscription/calculateNextBillingDate.ts`

**責務**: 次回請求日の計算

**入力**: 契約開始日、プラン期間

**処理**: 次回請求日を計算

**出力**: Date

## 🔌 副作用要件

### data-io層の関数

#### 1. createStripeCheckoutSession.server.ts

**配置**: `app/data-io/account/subscription/createStripeCheckoutSession.server.ts`

**責務**: Stripe Checkout Session作成

**入力**:

- ユーザーID
- プランID
- 成功時リダイレクトURL
- キャンセル時リダイレクトURL

**処理**: Stripe API呼び出し、Checkout Session作成

**出力**: Checkout Session URL

#### 2. cancelStripeSubscription.server.ts

**配置**: `app/data-io/account/subscription/cancelStripeSubscription.server.ts`

**責務**: Stripeでサブスクリプションキャンセル

**入力**: Stripe Subscription ID

**処理**: Stripe API呼び出し、サブスクリプションキャンセル

**出力**: 更新されたSubscription

#### 3. getSubscriptionByUserId.server.ts

**配置**: `app/data-io/account/subscription/getSubscriptionByUserId.server.ts`

**責務**: ユーザーのサブスクリプション情報取得

**入力**: ユーザーID

**処理**: D1 Databaseからサブスクリプション取得

**出力**: Subscription型またはnull

#### 4. updateSubscriptionStatus.server.ts

**配置**: `app/data-io/account/subscription/updateSubscriptionStatus.server.ts`

**責務**: サブスクリプション状態をDB更新

**入力**:

- ユーザーID
- 新しい状態
- Stripe Subscription ID
- 次回請求日

**処理**: D1 DatabaseでUPDATE文実行

**出力**: 更新されたSubscription型

#### 5. verifyStripeWebhook.server.ts

**配置**: `app/data-io/account/subscription/verifyStripeWebhook.server.ts`

**責務**: Stripe Webhookの署名検証

**入力**:

- リクエストボディ
- Stripe署名ヘッダー

**処理**: Stripe SDKで署名検証

**出力**: 検証済みEvent

## 📊 データフロー

### プラン購読フロー

```
ユーザー
    ↓
PlanSelector (プラン選択)
    ↓
account.subscription action (create-checkout)
    ↓
createStripeCheckoutSession.server (Checkout Session作成)
    ↓
Stripe Checkout (決済画面) ← ユーザーリダイレクト
    ↓
決済完了
    ↓
Stripe Webhook (checkout.session.completed)
    ↓
api.webhooks.stripe (イベント受信)
    ↓
updateSubscriptionStatus.server (DB更新)
    ↓
ユーザーのsubscription_status更新 (users.subscription_status = 'active')
    ↓
/account/subscription?success=true へリダイレクト
```

### キャンセルフロー

```
ユーザー
    ↓
SubscriptionStatus (キャンセルボタンクリック)
    ↓
CancelSubscriptionModal (確認ダイアログ)
    ↓
account.subscription action (cancel-subscription)
    ↓
cancelStripeSubscription.server (Stripeでキャンセル)
    ↓
updateSubscriptionStatus.server (DB更新)
    ↓
Stripe Webhook (customer.subscription.deleted)
    ↓
api.webhooks.stripe (イベント受信)
    ↓
サブスクリプション状態を'canceled'に更新
    ↓
成功メッセージ表示
```

## 🔒 セキュリティ要件

### 1. Webhook署名検証

- **必須**: すべてのWebhookリクエストでStripe署名を検証
- 検証失敗時は400 Bad Requestを返却

### 2. Stripe APIキーの管理

- **Publishable Key**: クライアント側で使用（公開可能）
- **Secret Key**: サーバー側のみで使用（環境変数）
- **Webhook Secret**: Webhook署名検証用（環境変数）

### 3. Checkout Session設定

- **mode**: 'subscription'
- **customer_email**: 自動設定（ユーザーのメールアドレス）
- **metadata**: ユーザーIDを含める（Webhook処理用）

## 🧪 テスト要件

### E2Eテスト

**配置**: `tests/e2e/account/subscription.spec.ts`

**テストケース**:

- プラン選択画面の表示
- Stripe Checkout Sessionの作成
- サブスクリプション状態の表示
- キャンセル機能の動作確認
- Webhook処理の確認（モック使用）

### 単体テスト

各関数ごとにテストファイルを作成：

- `calculatePlanPrice.test.ts`
- `formatSubscriptionStatus.test.ts`
- `calculateNextBillingDate.test.ts`
- `createStripeCheckoutSession.server.test.ts`（Stripeモック使用）
- `cancelStripeSubscription.server.test.ts`（Stripeモック使用）
- `verifyStripeWebhook.server.test.ts`（Stripeモック使用）

## 🚀 実装の優先順位

**Phase 1 (MVP)**: 基本購読機能

1. プラン選択とStripe Checkout
2. サブスクリプション状態表示
3. Webhook処理（checkout.session.completed, customer.subscription.deleted）
4. キャンセル機能

**Phase 2 (将来実装)**: 高度な機能

- プラン変更機能
- 請求履歴表示
- クーポン適用
- トライアル期間対応

## 📝 備考

### 依存関係

- **Stripe SDK**: `npm install stripe @stripe/stripe-js`
- **環境変数**:
  - `STRIPE_SECRET_KEY`: Stripe Secret Key
  - `STRIPE_PUBLISHABLE_KEY`: Stripe Publishable Key
  - `STRIPE_WEBHOOK_SECRET`: Webhook Secret

### データベーススキーマ（D1）

**subscriptionsテーブル**:

| カラム名 | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | サブスクリプションID（UUID） |
| user_id | TEXT | FOREIGN KEY, NOT NULL | ユーザーID |
| stripe_subscription_id | TEXT | UNIQUE | StripeのSubscription ID |
| stripe_customer_id | TEXT | NOT NULL | StripeのCustomer ID |
| plan_id | TEXT | NOT NULL | プランID（1month/3months/6months） |
| status | TEXT | NOT NULL | 状態（active/canceled/past_due/trialing） |
| current_period_start | TEXT | NOT NULL | 現在の請求期間開始日（ISO 8601） |
| current_period_end | TEXT | NOT NULL | 現在の請求期間終了日（ISO 8601） |
| canceled_at | TEXT | | キャンセル日時（ISO 8601） |
| created_at | TEXT | NOT NULL | 作成日時（ISO 8601） |
| updated_at | TEXT | NOT NULL | 更新日時（ISO 8601） |

> **注**: 具体的な型定義は `app/specs/account/types.ts` で定義します。

### Stripeプラン設定

Stripe Dashboardで以下のプランを作成：

- **1ヶ月プラン**: `price_xxx` (例: 980円/月)
- **3ヶ月プラン**: `price_yyy` (例: 2,800円/3ヶ月)
- **6ヶ月プラン**: `price_zzz` (例: 5,400円/6ヶ月)

---

**最終更新**: 2025-12-23
