# file-list.md - subscription Section

このドキュメントは、subscriptionセクションの実装に必要な**すべてのファイル**を3大層分離アーキテクチャに基づいてリストアップします。

---

## 1. E2Eテスト (Phase 1)

| ファイル名 | パス |
| :--- | :--- |
| subscription.spec.ts | tests/e2e/account/subscription.spec.ts |

**テストケース**:

- プラン選択画面の表示確認
- Stripe Checkout Session作成の成功シナリオ
- サブスクリプション状態の表示確認（active/canceled/past_due）
- キャンセルモーダルの開閉動作確認
- キャンセル実行の成功シナリオ
- Webhook処理の確認（モック使用）

---

## 2. UI層 (Phase 3)

### 2.1 Routes

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| account.subscription.tsx | app/routes/account.subscription.tsx | サブスクリプション管理ページのRoute定義（loader, action） |
| account.subscription.test.tsx | app/routes/account.subscription.test.tsx | subscriptionルートの単体テスト |
| api.webhooks.stripe.tsx | app/routes/api.webhooks.stripe.tsx | Stripe Webhook受信エンドポイント |
| api.webhooks.stripe.test.tsx | app/routes/api.webhooks.stripe.test.tsx | Webhook エンドポイントの単体テスト |

### 2.2 Components

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| PlanSelector.tsx | app/components/account/subscription/PlanSelector.tsx | プラン選択コンポーネント |
| PlanSelector.test.tsx | app/components/account/subscription/PlanSelector.test.tsx | PlanSelectorの単体テスト |
| SubscriptionStatus.tsx | app/components/account/subscription/SubscriptionStatus.tsx | サブスクリプション状態表示コンポーネント |
| SubscriptionStatus.test.tsx | app/components/account/subscription/SubscriptionStatus.test.tsx | SubscriptionStatusの単体テスト |
| CancelSubscriptionModal.tsx | app/components/account/subscription/CancelSubscriptionModal.tsx | サブスクリプションキャンセル確認モーダル |
| CancelSubscriptionModal.test.tsx | app/components/account/subscription/CancelSubscriptionModal.test.tsx | CancelSubscriptionModalの単体テスト |

---

## 3. 純粋ロジック層 (lib層、Phase 2.2)

### 3.1 ビジネスロジック

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| calculatePlanPrice.ts | app/lib/account/subscription/calculatePlanPrice.ts | プラン価格の計算（割引適用など） |
| calculatePlanPrice.test.ts | app/lib/account/subscription/calculatePlanPrice.test.ts | calculatePlanPriceの単体テスト |
| formatSubscriptionStatus.ts | app/lib/account/subscription/formatSubscriptionStatus.ts | サブスクリプション状態の表示用フォーマット |
| formatSubscriptionStatus.test.ts | app/lib/account/subscription/formatSubscriptionStatus.test.ts | formatSubscriptionStatusの単体テスト |
| calculateNextBillingDate.ts | app/lib/account/subscription/calculateNextBillingDate.ts | 次回請求日の計算 |
| calculateNextBillingDate.test.ts | app/lib/account/subscription/calculateNextBillingDate.test.ts | calculateNextBillingDateの単体テスト |

---

## 4. 副作用層 (data-io層、Phase 2.1)

### 4.1 Stripe連携

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| createStripeCheckoutSession.server.ts | app/data-io/account/subscription/createStripeCheckoutSession.server.ts | Stripe Checkout Session作成 |
| createStripeCheckoutSession.server.test.ts | app/data-io/account/subscription/createStripeCheckoutSession.server.test.ts | createStripeCheckoutSessionの単体テスト（Stripeモック使用） |
| cancelStripeSubscription.server.ts | app/data-io/account/subscription/cancelStripeSubscription.server.ts | Stripeでサブスクリプションキャンセル |
| cancelStripeSubscription.server.test.ts | app/data-io/account/subscription/cancelStripeSubscription.server.test.ts | cancelStripeSubscriptionの単体テスト（Stripeモック使用） |
| verifyStripeWebhook.server.ts | app/data-io/account/subscription/verifyStripeWebhook.server.ts | Stripe Webhookの署名検証 |
| verifyStripeWebhook.server.test.ts | app/data-io/account/subscription/verifyStripeWebhook.server.test.ts | verifyStripeWebhookの単体テスト（Stripeモック使用） |

### 4.2 サブスクリプションデータ管理

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| getSubscriptionByUserId.server.ts | app/data-io/account/subscription/getSubscriptionByUserId.server.ts | ユーザーのサブスクリプション情報取得 |
| getSubscriptionByUserId.server.test.ts | app/data-io/account/subscription/getSubscriptionByUserId.server.test.ts | getSubscriptionByUserIdの単体テスト（DBモック使用） |
| updateSubscriptionStatus.server.ts | app/data-io/account/subscription/updateSubscriptionStatus.server.ts | サブスクリプション状態をDB更新 |
| updateSubscriptionStatus.server.test.ts | app/data-io/account/subscription/updateSubscriptionStatus.server.test.ts | updateSubscriptionStatusの単体テスト（DBモック使用） |
| createSubscription.server.ts | app/data-io/account/subscription/createSubscription.server.ts | サブスクリプションレコードをDB作成 |
| createSubscription.server.test.ts | app/data-io/account/subscription/createSubscription.server.test.ts | createSubscriptionの単体テスト（DBモック使用） |
| deleteSubscription.server.ts | app/data-io/account/subscription/deleteSubscription.server.ts | サブスクリプションレコードをDB削除（アカウント削除時に使用） |
| deleteSubscription.server.test.ts | app/data-io/account/subscription/deleteSubscription.server.test.ts | deleteSubscriptionの単体テスト（DBモック使用） |

---

## 依存関係サマリー

### Common セクションへの依存

subscriptionセクションは、以下のcommonセクションのファイルに依存します：

**Pure Logic (lib/common)**:

- `createSessionData.ts`: セッションデータの生成（認証保護用）
- `validateSession.ts`: セッション検証

**Side Effects (data-io/common)**:

- `getSessionBySessionId.server.ts`: セッション取得
- `getUserById.server.ts`: ユーザー情報取得

**UI Components (components/common)**:

- `Button.tsx`: ボタンコンポーネント
- `ErrorMessage.tsx`: エラーメッセージ表示
- `Modal.tsx`: モーダルコンポーネント
- `Badge.tsx`: バッジコンポーネント
- `AccountLayout.tsx`: アカウントレイアウトコンテナ

**Specs**:

- `app/specs/account/common-spec.yaml`: セッション設定、バリデーションルール
- `app/specs/account/types.ts`: User, SessionData, ValidationError型

### Authentication セクションへの依存

**Side Effects (data-io/authentication)**:

- `findUserByEmail.server.ts`: ユーザー検索（メールアドレスでユーザー取得）

---

## ファイル実装順序（TDD Workflow）

1. **Phase 1**: E2Eテスト作成（`tests/e2e/account/subscription.spec.ts`）
2. **Phase 2.1**: data-io層（副作用層）の実装
   - createStripeCheckoutSession.server.ts
   - cancelStripeSubscription.server.ts
   - verifyStripeWebhook.server.ts
   - getSubscriptionByUserId.server.ts
   - updateSubscriptionStatus.server.ts
   - createSubscription.server.ts
3. **Phase 2.2**: lib層（純粋ロジック層）の実装
   - calculatePlanPrice.ts
   - formatSubscriptionStatus.ts
   - calculateNextBillingDate.ts
4. **Phase 3.1**: Components実装
   - PlanSelector.tsx
   - SubscriptionStatus.tsx
   - CancelSubscriptionModal.tsx
5. **Phase 3.2**: Routes実装
   - account.subscription.tsx
   - api.webhooks.stripe.tsx

---

## データベーススキーマ

### subscriptions テーブル

| カラム名 | 型 | 制約 | 説明 |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | サブスクリプションID（UUID） |
| user_id | TEXT | FOREIGN KEY, NOT NULL | ユーザーID |
| stripe_subscription_id | TEXT | UNIQUE | StripeのSubscription ID |
| stripe_customer_id | TEXT | NOT NULL | StripeのCustomer ID |
| plan_id | TEXT | NOT NULL | プランID（1month/3months/6months） |
| status | TEXT | NOT NULL | 状態（active/canceled/past_due/trialing/incomplete/incomplete_expired/unpaid） |
| current_period_start | TEXT | NOT NULL | 現在の請求期間開始日（ISO 8601） |
| current_period_end | TEXT | NOT NULL | 現在の請求期間終了日（ISO 8601） |
| canceled_at | TEXT | | キャンセル日時（ISO 8601） |
| created_at | TEXT | NOT NULL | 作成日時（ISO 8601） |
| updated_at | TEXT | NOT NULL | 更新日時（ISO 8601） |

**インデックス**:

- `idx_subscriptions_user_id` ON `user_id` (ユーザーごとのサブスクリプション検索)
- `idx_subscriptions_stripe_subscription_id` ON `stripe_subscription_id` (Webhook処理での検索)
- `idx_subscriptions_status` ON `status` (状態別の検索)

---

## 環境変数

subscriptionセクションで必要な環境変数：

| 環境変数名 | 説明 | 必須 |
|:---|:---|:---|
| STRIPE_SECRET_KEY | Stripe Secret Key（サーバー側） | ✓ |
| STRIPE_PUBLISHABLE_KEY | Stripe Publishable Key（クライアント側） | ✓ |
| STRIPE_WEBHOOK_SECRET | Webhook署名検証用Secret | ✓ |

---

## 外部依存パッケージ

```json
{
  "dependencies": {
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.0.0"
  }
}
```

---

**最終更新**: 2025-12-23
