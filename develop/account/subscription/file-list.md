# file-list.md - subscription Section

このドキュメントは、subscriptionセクションの実装に必要な**すべてのファイル**を3大層分離アーキテクチャに基づいてリストアップします。

---

## 1. E2Eテスト

| ファイル名 | パス |
| :--- | :--- |
| subscription.spec.ts | tests/e2e/account/subscription.spec.ts |

**テストケース**:
- 設定画面での自動更新「中断」「再開」のトグル操作。
- 権利の全うの検証（中断後も期限内はアクセス可能）。
- 決済不履行（past_due）時の即時制限の検証。

---

## 2. UI層

### 2.1 Routes

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| account.subscription.tsx | app/routes/account.subscription.tsx | サブスクリプション状態の表示専用ページ。 |
| account.settings.tsx | app/routes/account.settings.tsx | アカウント設定ページ。自動更新の制御ロジックを配置。 |
| api.webhooks.stripe.tsx | app/routes/api.webhooks.stripe.tsx | Stripe Webhook受信。生ステータスの同期。 |

### 2.2 Components

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| ProfileDisplay.tsx | app/components/account/profile/ProfileDisplay.tsx | 設定画面内でのサブスクリプション情報と自動更新トグル表示。 |
| SubscriptionStatusDisplay.tsx | app/components/account/subscription/SubscriptionStatusDisplay.tsx | サブスク画面内での詳細なプラン状態表示。 |

---

## 3. 純粋ロジック層 (lib層)

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| isSubscriptionAccessible.ts | app/lib/account/subscription/isSubscriptionAccessible.ts | 閲覧権限判定（SSoT）。`active` のみ許可。 |

---

## 4. 副作用層 (data-io層)

### 4.1 Stripe連携

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| cancelStripeSubscription.server.ts | app/data-io/account/subscription/cancelStripeSubscription.server.ts | Stripe `cancel_at_period_end` のトグル操作。 |

### 4.2 サブスクリプションデータ管理

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| getSubscriptionByUserId.server.ts | app/data-io/account/subscription/getSubscriptionByUserId.server.ts | ユーザーのサブスク情報取得。 |
| updateUserSubscriptionStatus.server.ts | app/data-io/account/subscription/updateUserSubscriptionStatus.server.ts | ステータス更新（生ステータス保存）。 |
| updateSubscriptionCancellation.server.ts | app/data-io/account/subscription/updateSubscriptionCancellation.server.ts | `canceled_at` の同期。 |

---

## データベーススキーマ (D1)

### users テーブル

- `google_id`: Google OAuth ユーザーID (旧 `oauth_id`)
- `subscription_status`: Stripe の生ステータスを保存。

### subscriptions テーブル

- `status`: Stripe の生ステータスを保存。
- `current_period_end`: 有効期限。

---

**最終更新**: 2026-02-05
