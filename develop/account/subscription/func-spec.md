# subscription - 機能設計書

## 📋 機能概要

### 機能名

Subscription Management (サブスクリプション管理)

### 所属サービス

**account** の **subscription** セクションに配置

### 機能の目的・価値

- **解決する課題**: ユーザーが有料プランに登録し、サブスクリプションを管理できる機能を提供する
- **核心思想**:
  - **権利の全う**: 購入済みの期間は常にアクセス権を保証する。中途解約（即時停止）という概念を排除する。
  - **透明性の確保**: ユーザーに次の決済タイミングを明示し、意図しない課金や操作ミスを防ぐ。
  - **疎結合な設計**: 自社DBでカード情報を保持せず、Stripeのステータスを尊重しつつ、アプリケーション側で厳格に権限判定を行う。
- **提供する価値**:
  - 複数プランの選択とStripe Checkoutによる安全な決済
  - 自動更新の制御（中断・再開）と有効期限の明示
  - 厳格な権限管理（Stripeステータス連動）
- **ビジネス効果**: 収益化、ユーザーの信頼獲得、継続率向上

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
- 冪等性ガード（重複イベント処理防止）
- サブスクリプション状態の同期

**処理対象イベント**:

| イベント | 処理内容 |
|:--------|:--------|
| `checkout.session.completed` | subscriptionsレコード作成、stripeCustomerId保存、ステータス有効化 |
| `customer.subscription.updated` | cancel_at_period_end検知、解約予約状態の反映 |
| `customer.subscription.deleted` | ステータスをinactiveに変更（期間終了時） |
| `invoice.paid` | currentPeriodEnd更新（継続課金時の期限延長） |
| `invoice.payment_failed` | past_dueステータス設定、警告フラグ設定 |

**処理フロー**:

1. Webhookイベント受信
2. 署名検証
3. **冪等性チェック**: `isWebhookEventProcessed(eventId)`で重複確認
4. イベントタイプ判定
5. 対応するハンドラー実行
6. **イベント記録**: `recordWebhookEvent(eventId, eventType)`
7. 200 OKレスポンス返却

#### 4. サブスクリプションレコード管理 (Subscription Record Management)

**機能**:

- Webhook受信時のsubscriptionsテーブル操作
- ユーザー↔Stripe顧客IDのマッピング管理
- 有効期限データの同期

**checkout.session.completed 処理詳細**:

1. `metadata.userId`からユーザー特定
2. `session.subscription`からStripeサブスクリプションID取得
3. Stripe APIで詳細取得（period_start, period_end, customer_id）
4. **usersテーブル更新**: `stripeCustomerId`を保存
5. **subscriptionsテーブル作成**: 全フィールドを含むレコード挿入
6. **usersテーブル更新**: `subscriptionStatus`を'active'に

**invoice.paid 処理詳細**:

1. `invoice.customer`からStripe顧客ID取得
2. **usersテーブル検索**: `stripeCustomerId`でユーザー逆引き
3. `invoice.subscription`からサブスクリプションID取得
4. Stripe APIで最新期間取得
5. **subscriptionsテーブル更新**: `currentPeriodStart`, `currentPeriodEnd`を更新

**customer.subscription.updated 処理詳細**:

1. `subscription.id`でsubscriptionsレコード検索
2. `cancel_at_period_end`フラグ確認
3. trueの場合: `canceledAt`に`current_period_end`を設定（解約予約）
4. falseの場合: `canceledAt`をnullに（再開）
5. **ステータスは'active'のまま維持**（期間終了まで閲覧可能）

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

#### 3. キャンセル確認UI（SubscriptionStatus内でModalを使用）

**実装方式**: SubscriptionStatusコンポーネント内で共通Modal（`app/components/account/common/Modal.tsx`）を使用

**責務**:

- サブスクリプションキャンセル確認UIの表示（共通Modalを使用）
- キャンセル理由の選択（オプション、将来実装）

**主要なUI要素**:

- キャンセル警告メッセージ
- キャンセル理由選択（将来実装）
- 「キャンセル実行」ボタン（Button (common) variant="danger"）
- 「戻る」ボタン（Button (common) variant="secondary"）

**注**: 共通化徹底型の設計により、セクション固有のモーダルコンポーネントは作成せず、SubscriptionStatus内で共通Modalを直接使用します。

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

#### 4. formatSubscriptionEndDate

**配置**: `app/lib/account/subscription/formatSubscriptionEndDate.ts`

**責務**: サブスクリプション終了日の日本語フォーマット

**入力**: ISO 8601形式の日付文字列

**処理**: 「〇月〇日まで利用可能」形式に変換

**出力**: string

#### 5. isSubscriptionAccessible

**配置**: `app/lib/account/subscription/isSubscriptionAccessible.ts`

**責務**: サブスクリプションの閲覧権限判定

**入力**: subscriptionStatus, currentPeriodEnd, canceledAt

**処理**: 現在日時と比較し、閲覧可能か判定

**出力**: boolean

**判定ロジック**:
- status === 'active' のみを真とする集約関数で制御。
- `past_due`（決済不履行）への対応: 猶予期間は設けず、即座に権限を制限する。
- 判定は `app/lib/account/subscription/isSubscriptionAccessible.ts` で集約管理する。

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

#### 4. updateUserSubscriptionStatus.server.ts

**配置**: `app/data-io/account/subscription/updateUserSubscriptionStatus.server.ts`

**責務**: usersテーブルのsubscriptionStatus更新

**入力**: ユーザーID, 新しい状態('active' | 'inactive')

**処理**: D1 DatabaseでUPDATE文実行

**出力**: boolean（更新成功/失敗）

#### 5. createSubscription.server.ts

**配置**: `app/data-io/account/subscription/createSubscription.server.ts`

**責務**: subscriptionsテーブルにレコード作成

**入力**:

- userId
- stripeSubscriptionId
- stripeCustomerId
- planId
- status
- currentPeriodStart
- currentPeriodEnd

**処理**: D1 DatabaseでINSERT文実行

**出力**: 作成されたsubscription ID

#### 6. updateSubscriptionPeriod.server.ts

**配置**: `app/data-io/account/subscription/updateSubscriptionPeriod.server.ts`

**責務**: サブスクリプション期間の更新（継続課金時）

**入力**: stripeSubscriptionId, currentPeriodStart, currentPeriodEnd

**処理**: D1 DatabaseでUPDATE文実行

**出力**: boolean（更新成功/失敗）

#### 7. updateUserStripeCustomerId.server.ts

**配置**: `app/data-io/account/subscription/updateUserStripeCustomerId.server.ts`

**責務**: usersテーブルにstripeCustomerIdを保存

**入力**: userId, stripeCustomerId

**処理**: D1 DatabaseでUPDATE文実行

**出力**: boolean（更新成功/失敗）

#### 8. getUserByStripeCustomerId.server.ts

**配置**: `app/data-io/account/subscription/getUserByStripeCustomerId.server.ts`

**責務**: Stripe顧客IDからユーザーを逆引き

**入力**: stripeCustomerId

**処理**: D1 DatabaseでSELECT文実行

**出力**: User型またはnull

#### 9. getSubscriptionByStripeId.server.ts

**配置**: `app/data-io/account/subscription/getSubscriptionByStripeId.server.ts`

**責務**: StripeサブスクリプションIDからsubscriptionレコード取得

**入力**: stripeSubscriptionId

**処理**: D1 DatabaseでSELECT文実行

**出力**: Subscription型またはnull

#### 10. recordWebhookEvent.server.ts

**配置**: `app/data-io/account/subscription/recordWebhookEvent.server.ts`

**責務**: 処理済みWebhookイベントを記録（冪等性ガード）

**入力**: eventId, eventType

**処理**: D1 DatabaseでINSERT文実行（webhook_eventsテーブル）

**出力**: void

#### 11. isWebhookEventProcessed.server.ts

**配置**: `app/data-io/account/subscription/isWebhookEventProcessed.server.ts`

**責務**: Webhookイベントが処理済みか確認

**入力**: eventId

**処理**: D1 DatabaseでSELECT文実行

**出力**: boolean（処理済み: true）

#### 12. verifyStripeWebhook.server.ts

**配置**: `app/data-io/account/subscription/verifyStripeWebhook.server.ts`

**責務**: Stripe Webhookの署名検証

**入力**:

- リクエストボディ
- Stripe署名ヘッダー

**処理**: Stripe SDKで署名検証

**出力**: 検証済みEvent

## 📊 データフロー

### プラン購読フロー

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
Modal (common) (キャンセル確認UI)
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

**usersテーブル（追加カラム・変更）**:

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| stripeCustomerId | TEXT | | Stripe顧客ID（Webhook処理でのユーザー逆引き用） |
| google_id | TEXT | | Google OAuthでのユーザーID（旧 oauth_id からリネーム） |

**インデックス**: `idx_users_stripe_customer_id` ON `stripeCustomerId`

**subscriptionsテーブル**:

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | サブスクリプションID（UUID） |
| userId | TEXT | FOREIGN KEY, NOT NULL | ユーザーID |
| stripeSubscriptionId | TEXT | UNIQUE | StripeのSubscription ID |
| stripeCustomerId | TEXT | NOT NULL | StripeのCustomer ID |
| planId | TEXT | NOT NULL | プランID（standard/supporter） |
| status | TEXT | NOT NULL | 状態（active/canceled/past_due/trialing） |
| currentPeriodStart | TEXT | NOT NULL | 現在の請求期間開始日（ISO 8601） |
| currentPeriodEnd | TEXT | NOT NULL | 現在の請求期間終了日（ISO 8601） |
| canceledAt | TEXT | | キャンセル予約日時（period_end、ISO 8601） |
| createdAt | TEXT | NOT NULL | 作成日時（ISO 8601） |
| updatedAt | TEXT | NOT NULL | 更新日時（ISO 8601） |

**webhook_eventsテーブル（新規）**:

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | レコードID（UUID） |
| eventId | TEXT | UNIQUE, NOT NULL | StripeイベントID（冪等性キー） |
| eventType | TEXT | NOT NULL | イベントタイプ |
| processedAt | TEXT | NOT NULL | 処理日時（ISO 8601） |
| createdAt | TEXT | NOT NULL | 作成日時（ISO 8601） |

**インデックス**: `idx_webhook_events_event_id` ON `eventId`

> **注**: 具体的な型定義は `app/specs/account/types.ts` で定義します。

### Stripeプラン設定

Stripe Dashboardで以下のプランを作成：

- **1ヶ月プラン**: `price_xxx` (例: 980円/月)
- **3ヶ月プラン**: `price_yyy` (例: 2,800円/3ヶ月)
- **6ヶ月プラン**: `price_zzz` (例: 5,400円/6ヶ月)

---

**最終更新**: 2025-12-23
