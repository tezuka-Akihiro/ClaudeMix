# 【機能修正提案】Stripe決済基盤：サブスクリプションライフサイクル管理

- **サービス**: `account`
- **セクション**: `subscription`
- **関連ドキュメント**:
  - `develop/account/subscription/func-spec.md`
  - `app/specs/account/subscription-spec.yaml`
  - `migrations/0001_initial_schema.sql`

---

## 1. 提案概要

現在の「決済の瞬間」のみに焦点を当てた暫定的な構造を、**サブスクリプションのライフサイクル（継続・変更・解約）を正しく管理できる本番対応基盤**に改修します。Stripeから届くあらゆる通知を特定のユーザーに確実に紐付ける「識別構造」を確立し、契約管理テーブルを活性化させることで、有効期限表示・按分計算・継続課金の自動化を実現します。

---

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

#### 致命的欠陥: ユーザー識別構造の不完全性

```
❌ users テーブルに stripeCustomerId がない
   → Stripeの invoice.paid 等で届くcustomer IDからユーザーを特定できない

❌ subscriptions テーブルが形骸化
   → Webhookでレコード作成されず、有効期限データがDBに存在しない

❌ Webhook処理が不完全
   → 現在3イベントのみ（checkout.session.completed, customer.subscription.deleted, invoice.payment_failed）
   → invoice.paid（継続課金）、customer.subscription.updated（解約予約）が未実装
```

#### 現在のWebhook処理フロー

```typescript
// api.webhooks.stripe.tsx (抜粋)
case 'checkout.session.completed': {
  const userId = session.metadata?.userId  // ✅ metadataからuserIdを取得
  await updateUserSubscriptionStatus(userId, 'active', context)  // ⚠️ usersテーブルのみ更新
  // ❌ subscriptionsテーブルへのレコード作成なし
  // ❌ stripeCustomerId, stripeSubscriptionId の保存なし
  break
}
```

#### 現在のDB構造

```sql
-- users テーブル
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscriptionStatus TEXT NOT NULL DEFAULT 'inactive',  -- ✅ 存在するが...
  -- ❌ stripeCustomerId がない!
);

-- subscriptions テーブル（形骸化）
CREATE TABLE subscriptions (
  stripeSubscriptionId TEXT,     -- ✅ 定義あり
  stripeCustomerId TEXT,          -- ✅ 定義あり
  currentPeriodEnd TEXT NOT NULL, -- ✅ 定義あり
  -- ⚠️ しかしWebhookでレコードが作成されない!
);
```

### 修正後 (To-Be)

#### 識別構造の確立

```
✅ users テーブルに stripeCustomerId を追加
   → invoiceイベントからcustomer IDでユーザー逆引き可能

✅ subscriptions テーブルを活性化
   → checkout完了時にレコード作成、全期間データをDB同期

✅ Webhook処理を完全化
   → 7イベント全対応（spec定義済み）
```

#### 改修後のWebhook処理フロー

```typescript
// api.webhooks.stripe.tsx (改修後)
case 'checkout.session.completed': {
  const userId = session.metadata?.userId
  const subscriptionId = session.subscription as string

  // Stripeからサブスクリプション詳細取得
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // ✅ usersテーブルのstripeCustomerId更新
  await updateUserStripeCustomerId(userId, subscription.customer as string, context)

  // ✅ subscriptionsテーブルにレコード作成
  await createSubscription({
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: subscription.customer as string,
    planId: session.metadata?.planId,
    status: 'active',
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  }, context)

  // ✅ usersテーブルのsubscriptionStatus更新
  await updateUserSubscriptionStatus(userId, 'active', context)
  break
}
```

#### 改修後のDB構造

```sql
-- users テーブル（追加カラム）
ALTER TABLE users ADD COLUMN stripeCustomerId TEXT;
CREATE INDEX idx_users_stripe_customer ON users(stripeCustomerId);

-- subscriptions テーブル（アクティブ化）
-- Webhookからレコード作成・更新が行われる
```

---

## 3. 背景・目的

### 背景

| 観点 | 現状の問題 |
|:-----|:----------|
| **データ不整合** | `users.subscriptionStatus` と `subscriptions` テーブルが同期されておらず、「有効期限がいつか」をアプリ側で取得できない |
| **運用負債** | 継続課金（invoice.paid）、解約予約（subscription.updated with cancel_at_period_end）が未実装で、手動運用が前提 |
| **セキュリティリスク** | Stripe customer ID が保存されていないため、悪意あるmetadata改竄に対する検証ができない |
| **UX低下** | 「〇月〇日まで利用可能」という期限表示ができず、ユーザーの信頼を損なう |

### 目的

- **目的1**: **識別構造の確立** - Stripeイベントとユーザーを100%確実に紐付け
- **目的2**: **契約管理テーブル活性化** - 有効期限・按分計算に必要なデータをDBに同期
- **目的3**: **ライフサイクル自動化** - 継続課金・解約予約・支払い失敗を自動処理
- **目的4**: **冪等性担保** - 重複イベント処理の防止

---

## 4. 変更の妥当性 (Pros / Cons)

### Pros (利点)

- **本番運用対応**: Stripeからのあらゆるイベントに対応でき、手動介入が不要になる
- **UX向上**: 有効期限表示、解約予約時の「〇月〇日まで閲覧可能」メッセージが実現
- **セキュリティ強化**: customer ID検証により、metadata改竄攻撃を防止
- **データ整合性**: users ↔ subscriptions の一貫性が保証される
- **将来拡張性**: 請求履歴、プラン変更機能の実装基盤が整う
- **Stripe機能活用**: 自前実装を避け、Stripeの提供機能（Customer Portal等）を活用可能に

### Cons (懸念点)

- **マイグレーション必要**: usersテーブルへのカラム追加が必要
- **実装範囲**: 新規data-io関数4つ、Webhook処理拡張、E2Eテスト追加が必要
- **既存ユーザー対応**: stripeCustomerIdが未設定の既存ユーザーへの対応検討が必要

### 総合評価

Consは存在するものの、**現状のままでは本番運用が不可能**という致命的な問題を解決するため、この変更は**必須かつ妥当性が極めて高い**と判断します。特に「決済したのに有料記事が見れない」「解約したのにすぐ見れなくなる」といったUX問題は、サービスの信頼性を著しく損なうため、早急な対応が必要です。

---

## 5 設計フロー

### GUIDING_PRINCIPLES.md

**変更なし** - 既存の原則（Stripeへの委託、手動運用排除）に沿った実装

### func-spec.md

**追記内容**:

```markdown
#### 4. サブスクリプションレコード管理 (Subscription Record Management)

**機能**:
- Webhook受信時のsubscriptionsテーブル操作
- ユーザー↔Stripe顧客IDのマッピング管理

**処理対象イベント（拡張）**:
- `checkout.session.completed`: レコード作成 + stripeCustomerId保存
- `invoice.paid`: currentPeriodEnd更新（継続課金）
- `customer.subscription.updated`: cancel_at_period_end反映（解約予約）
- `invoice.payment_failed`: past_dueステータス設定 + 警告表示フラグ
```

### uiux-spec.md

**追記内容**:

```markdown
#### 契約状況表示の拡張

| 状態 | 表示内容 |
|:----|:--------|
| active | 「有効」バッジ + 「次回請求日: 〇月〇日」 |
| canceled (期間内) | 「解約予約済み」バッジ + 「〇月〇日まで利用可能」 |
| past_due | 「支払い遅延」警告 + 「カード情報を更新してください」 |
| inactive | 「未契約」+ プラン選択へ誘導 |
```

### spec.yaml

**追記内容**:

```yaml
# webhook_events セクションに追加
webhook_events:
  # 既存...
  invoice_paid:
    event_type: "invoice.paid"
    description: "継続決済成功時に有効期限を自動延長"
    action: "extend_subscription_period"

# database セクションに追加
database:
  users_table:
    additional_columns:
      stripe_customer_id: "stripe_customer_id"
    indexes:
      - "idx_users_stripe_customer"

  webhook_events_table:
    name: "webhook_events"
    columns:
      id: "id"
      event_id: "event_id"  # Stripe event ID（冪等性ガード用）
      event_type: "event_type"
      processed_at: "processed_at"
```

### file_list.md

**追記内容**:

```markdown
#### 新規ファイル

**マイグレーション**:
- `migrations/0003_add_stripe_customer_id.sql` - usersテーブルにstripeCustomerId追加

**Data-IO**:
- `app/data-io/account/subscription/createSubscription.server.ts` - subscriptionsレコード作成
- `app/data-io/account/subscription/updateSubscriptionPeriod.server.ts` - 期間更新
- `app/data-io/account/subscription/updateUserStripeCustomerId.server.ts` - stripeCustomerId保存
- `app/data-io/account/subscription/cancelStripeSubscription.server.ts` - Stripe APIキャンセル呼び出し
- `app/data-io/account/subscription/getSubscriptionByStripeId.server.ts` - stripeSubscriptionIdで検索
- `app/data-io/account/subscription/getUserByStripeCustomerId.server.ts` - stripeCustomerIdで逆引き
- `app/data-io/account/subscription/recordWebhookEvent.server.ts` - 冪等性ガード用イベント記録
- `app/data-io/account/subscription/isWebhookEventProcessed.server.ts` - 重複チェック

**Logic**:
- `app/lib/account/subscription/formatSubscriptionEndDate.ts` - 期限日フォーマット
- `app/lib/account/subscription/isSubscriptionAccessible.ts` - 閲覧権限判定

**Components**:
- `app/components/account/subscription/SubscriptionStatusDisplay.tsx` - 状態表示強化版
- `app/components/account/subscription/PaymentWarningBanner.tsx` - 支払い警告バナー
```

### data-flow-diagram.md

**追記内容**:

```markdown
### 継続課金フロー（新規）

```
Stripe (invoice.paid)
    ↓
api.webhooks.stripe
    ↓ isWebhookEventProcessed() で重複チェック
    ↓ recordWebhookEvent() で記録
    ↓
getUserByStripeCustomerId(customer_id)
    ↓
updateSubscriptionPeriod(subscription_id, new_period_end)
    ↓
subscriptions.currentPeriodEnd 更新
```

### 解約予約フロー（新規）

```
ユーザー → 「キャンセル」ボタン
    ↓
account.subscription action (cancel-subscription)
    ↓
cancelStripeSubscription(subscription_id)  // cancel_at_period_end: true
    ↓
Stripe Webhook (customer.subscription.updated)
    ↓
subscriptions.canceledAt = current_period_end  // 期間終了日を設定
subscriptions.status = 'active'  // まだactiveのまま！
    ↓
ユーザー → 「〇月〇日まで利用可能」表示
    ↓
(期間終了後)
Stripe Webhook (customer.subscription.deleted)
    ↓
subscriptions.status = 'inactive'
users.subscriptionStatus = 'inactive'
```
```

---

## 6 TDD_WORK_FLOW.md 簡易版

### e2e-screen-test

- `tests/e2e/account/subscription.spec.ts` - 既存拡張: 解約予約後の期限表示、支払い警告表示テスト追加

### e2e-section-test

- `tests/e2e/account/subscription-lifecycle.spec.ts` - **新規**: 5シナリオ網羅テスト（初回購読、解約予約、有効期限切れ、支払い失敗、データ整合性）

### CSS実装 (layer2.css, layer3.ts, layer4.ts)

- `app/styles/account/layer2-subscription.css` - 既存拡張: 支払い警告バナー、期限表示スタイル追加

### route

- `app/routes/api.webhooks.stripe.tsx` - 既存大幅改修: 7イベント対応、subscriptionsテーブル操作追加
- `app/routes/account.subscription.tsx` - 既存改修: 解約処理をStripe API経由に変更、期限表示追加

### components.test

- `app/components/account/subscription/SubscriptionStatusDisplay.test.tsx` - **新規**
- `app/components/account/subscription/PaymentWarningBanner.test.tsx` - **新規**

### components

- `app/components/account/subscription/SubscriptionStatusDisplay.tsx` - **新規**: 契約状況の詳細表示
- `app/components/account/subscription/PaymentWarningBanner.tsx` - **新規**: 支払い警告バナー
- `app/components/account/subscription/SubscriptionStatusCard.tsx` - 既存改修: SubscriptionStatusDisplayを内包

### logic.test

- `app/lib/account/subscription/formatSubscriptionEndDate.test.ts` - **新規**
- `app/lib/account/subscription/isSubscriptionAccessible.test.ts` - **新規**

### logic

- `app/lib/account/subscription/formatSubscriptionEndDate.ts` - **新規**: 期限日の日本語フォーマット
- `app/lib/account/subscription/isSubscriptionAccessible.ts` - **新規**: 閲覧権限判定ロジック

### data-io.test

- `app/data-io/account/subscription/createSubscription.server.test.ts` - **新規**
- `app/data-io/account/subscription/updateSubscriptionPeriod.server.test.ts` - **新規**
- `app/data-io/account/subscription/cancelStripeSubscription.server.test.ts` - **新規**
- `app/data-io/account/subscription/getUserByStripeCustomerId.server.test.ts` - **新規**
- `app/data-io/account/subscription/recordWebhookEvent.server.test.ts` - **新規**

### data-io

- `app/data-io/account/subscription/createSubscription.server.ts` - **新規**: subscriptionsレコード作成
- `app/data-io/account/subscription/updateSubscriptionPeriod.server.ts` - **新規**: 期間更新
- `app/data-io/account/subscription/updateUserStripeCustomerId.server.ts` - **新規**: stripeCustomerId保存
- `app/data-io/account/subscription/cancelStripeSubscription.server.ts` - **新規**: Stripe APIキャンセル
- `app/data-io/account/subscription/getSubscriptionByStripeId.server.ts` - **新規**: stripeSubscriptionIdで検索
- `app/data-io/account/subscription/getUserByStripeCustomerId.server.ts` - **新規**: stripeCustomerIdで逆引き
- `app/data-io/account/subscription/recordWebhookEvent.server.ts` - **新規**: 冪等性ガード
- `app/data-io/account/subscription/isWebhookEventProcessed.server.ts` - **新規**: 重複チェック

### その他

- `migrations/0003_add_stripe_customer_id.sql` - **新規**: usersテーブルカラム追加
- `migrations/0004_create_webhook_events_table.sql` - **新規**: 冪等性ガード用テーブル

---

## E2Eテスト要件: 必達5シナリオ

| ケース | 操作 | 確認項目 |
|:-------|:-----|:---------|
| **1. 初回購読** | プラン選択→Stripe決済→完了 | `subscriptionStatus='active'`, `currentPeriodEnd`保存, 有料記事閲覧可 |
| **2. 解約予約** | マイページ→キャンセル | Stripe `cancel_at_period_end=true`, DB `status='active'`継続, 期限表示 |
| **3. 有効期限切れ** | Test Clockで期間終了 | `subscriptionStatus='inactive'`, 有料記事→プラン選択へリダイレクト |
| **4. 支払い失敗** | Webhook `invoice.payment_failed` 送信 | 警告バナー表示, 猶予期間中は閲覧可 |
| **5. データ整合性** | 決済完了Webhook | `metadata.userId`で**正しいユーザー**のレコードが更新される |

---

## 実装優先順位

| 優先度 | 実装内容 |
|:-------|:---------|
| **P0 (必須)** | マイグレーション(stripeCustomerId), createSubscription, Webhook拡張(checkout.session.completed完全版) |
| **P1 (重要)** | cancelStripeSubscription, customer.subscription.updated処理, 期限表示UI |
| **P2 (推奨)** | invoice.paid処理, 支払い警告バナー, 冪等性ガード |
| **P3 (将来)** | Customer Portal連携, 請求履歴表示 |

---

**作成日**: 2026-02-03
**ステータス**: Phase 1完了 - ユーザー確認待ち
