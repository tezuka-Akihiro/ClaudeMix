# subscription - 機能設計書

## 📋 機能概要

### 機能名

Subscription Management (サブスクリプション管理)

### 所属サービス

**account** の **subscription** セクションに配置

### 機能の目的・価値

- **核心思想**:
  - **権利の全う**: 購入済みの期間は常にアクセス権を保証する。中途解約（即時停止）という概念を排除する。
  - **透明性の確保**: ユーザーに次の決済タイミングを明示し、意図しない課金や操作ミスを防ぐ。
  - **疎結合な設計**: 自社DBでカード情報を保持せず、Stripeのステータスを尊重しつつ、アプリケーション側で厳格に権限判定を行う。

### 実装優先度

**HIGH** - 決済基盤の刷新に伴う最優先事項

## 🎯 機能要件

### 基本機能

#### 1. プラン選択と購読 (Plan Selection & Subscription)

**URL**: `/account/subscription`

**役割**: 「プラン選択」に特化。

- **純化**: 現在のプランの比較表示を廃止し、次なるプランの選択に集中させる。
- **制限**: 自動更新中断中はプラン追加・変更を制限（ボタン disabled）。

#### 2. アカウント設定内サブスクリプション管理

**URL**: `/account/settings`

**役割**: 「自動更新の制御」を担当。

- **自動更新の中断**: Stripe の `cancel_at_period_end = true` を実行。
- **自動更新の再開**: Stripe の `cancel_at_period_end = false` を実行。
- **バリデーション**: 自動更新ON状態での退会/カード削除を制限。

#### 3. Stripe同期 (Stripe Synchronization)

- **生ステータスの保存**: Webhook等で受け取る `subscription.status`（active, past_due, canceled 等）を簡略化せずにそのままDBへ保存する。
- **Google ID 紐付け**: Google認証の `sub` を `google_id` として `users` テーブルに紐付ける（旧 `oauth_id` からの移行）。

## 🧠 純粋ロジック要件

### lib層の関数

#### 1. isSubscriptionAccessible

**配置**: `app/lib/account/subscription/isSubscriptionAccessible.ts`

**責務**: サブスクリプションの閲覧権限判定 (SSoT)

**判定ロジック**:
- `status === 'active'` のみを真とする。
- 有効期限（`current_period_end`）内であること。
- `past_due`（決済不履行）時は即座に制限する（猶予期間なし）。

## 🔌 副作用要件

### data-io層の関数

- `createOAuthUser.server.ts`: `google_id` への保存を実装。
- `getUserByOAuth.server.ts`: `google_id` での検索を実装。
- `updateUserSubscriptionStatus.server.ts`: Stripe 生ステータスの更新。
- `updateSubscriptionCancellation.server.ts`: `canceled_at` の同期。

## 📊 データフロー

1. Stripe Webhook 受信 (`customer.subscription.updated` 等)
2. `subscription.status` をそのまま `users` および `subscriptions` テーブルに保存。
3. アプリケーション内での権限チェックは `isSubscriptionAccessible` に集約。

## 🧪 テスト要件

- **E2Eテスト**: 設定画面での自動更新トグル操作、および期限内のアクセス権保証の検証。
- **Logicテスト**: 各種 Stripe ステータスに対する権限判定の網羅。

---

**最終更新**: 2026-02-05
