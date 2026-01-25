# 【機能修正提案】Stripe決済機能の正規化

- **サービス**: `account`
- **セクション**: `subscription`
- **関連ドキュメント**:
  - `develop/account/subscription/func-spec.md`
  - `app/specs/account/subscription-spec.yaml`

---

## 1. 提案概要

Stripe AIエージェントが実装した「Stripe Elements (Payment Element)」方式を破棄し、設計書通りの「Stripe Checkout」方式で再実装することで、設計と実装の整合性を確保し、保守性・堅牢性を向上させる。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

Stripe AIエージェントによる無秩序な実装：

| ファイル | 問題点 |
|---------|--------|
| `app/lib/stripe.ts` | 配置が3層アーキテクチャに不適合 |
| `app/routes/checkout.tsx` | Payment Intent方式（設計と不整合） |
| `app/routes/webhook.tsx` | パスが設計と異なる（`/webhook` vs `/api/webhooks/stripe`） |
| `app/components/checkout/CheckoutForm.tsx` | Elements方式（設計と不整合） |
| `app/root.tsx` | `window.ENV`でStripeキー公開（不要になる） |

**技術的問題**:

- `paymentIntents.create()` 使用（設計は `checkout.sessions.create()`）
- `<PaymentElement />` 使用（設計はリダイレクト方式）
- 金額（¥1,000）がハードコード（spec.yamlにプラン設定あり）
- スタイルが `style jsx`（プロジェクト標準はTailwind CSS）
- テストなし（TDDプロセス未実施）

### 修正後 (To-Be)

設計書（func-spec.md, subscription-spec.yaml）に準拠した実装：

| 項目 | 修正後 |
|------|--------|
| **決済方式** | Stripe Checkout（リダイレクト方式） |
| **API** | `checkout.sessions.create()` |
| **Webhookパス** | `/api/webhooks/stripe`（設計通り） |
| **金額** | spec.yamlのplansから取得 |
| **スタイル** | Tailwind CSS |
| **ファイル配置** | 3層アーキテクチャに準拠 |

**削除対象ファイル**:

- `app/lib/stripe.ts`
- `app/routes/checkout.tsx`
- `app/routes/webhook.tsx`
- `app/components/checkout/CheckoutForm.tsx`
- `app/components/checkout/`ディレクトリ

**新規作成ファイル（設計書に準拠）**:

- `app/routes/account.subscription.tsx`（既存を拡張）
- `app/routes/api.webhooks.stripe.tsx`
- `app/data-io/account/subscription/createStripeCheckoutSession.server.ts`
- `app/data-io/account/subscription/cancelStripeSubscription.server.ts`
- `app/data-io/account/subscription/verifyStripeWebhook.server.ts`
- `app/components/account/subscription/PlanSelector.tsx`（将来のプラン追加に対応）

## 3. 背景・目的

### 背景

Stripe AIエージェントが設計書を参照せずに独自実装を行った結果：

1. **方式の不整合**: 設計は「Checkout」、実装は「Elements」
2. **SSoT違反**: 金額がハードコード（spec.yamlを参照していない）
3. **アーキテクチャ違反**: ファイル配置が3層に不適合
4. **TDD未実施**: テストなしで実装

### 目的

- **目的1**: 設計と実装の整合性確保
- **目的2**: SSoT原則の遵守（spec.yamlからの値参照）
- **目的3**: 3層アーキテクチャへの適合
- **目的4**: TDDによる品質保証

## 4. 変更の妥当性 (Pros / Cons)

### Pros (利点)

- **堅牢性向上**: Stripe Checkoutはクレジットカード情報がStripe側で完結、PCI DSS対応が容易
- **保守性向上**: Stripe側の更新が自動適用、SDK更新の負担軽減
- **実装工数削減**: リダイレクトするだけで決済画面が完成
- **設計整合性**: func-spec.md、subscription-spec.yamlと完全に一致
- **SSoT遵守**: プラン情報はspec.yamlから取得

### Cons (懸念点)

- **既存実装の破棄**: Stripe AIエージェントの実装を捨てることになる
- **デザイン自由度**: Checkoutページはカスタマイズに制限あり
- **リダイレクト体験**: ユーザーがStripeのドメインに一時的に遷移

### 総合評価

Consは存在するものの、**設計との整合性**と**堅牢性**を重視するClaudeMixの方針に合致しており、この変更は**非常に妥当性が高い**と判断します。特にMVP段階ではStripe Checkoutの「シンプルさ」が優先されるべきです。

## 5 設計フロー

以下の設計ドキュメントを上から順に確認し、編集内容を追記。

### 🗾GUIDING_PRINCIPLES.md

**変更なし** - 既存の原則に準拠した実装を行うため

### 📚️func-spec.md

**変更なし** - PlanSelectorコンポーネントは将来のプラン追加に備えて維持。spec.yamlのプラン数を減らすのみ

### 🖼️uiux-spec.md

**確認が必要** - Stripe Checkoutへのリダイレクトに関するUXフローの記載を確認

### 📋️spec.yaml

**変更内容**:

- `stripe.api_version`を実際に使用するバージョンに更新（`2024-12-18.acacia`）
- **プランを1つに集約（当面）**: 1ヶ月プラン（¥980）のみ有効化
  - `plans.three_months` → `enabled: false`に変更（将来用に構造維持）
  - `plans.six_months` → `enabled: false`に変更（将来用に構造維持）
- UIコンポーネント設定は維持（将来のプラン追加に対応）

### 🗂️file_list.md

**更新が必要** - 実際のファイル構成を反映:

- 削除: `app/lib/stripe.ts`, `app/routes/checkout.tsx`, `app/routes/webhook.tsx`, `app/components/checkout/`
- 追加: 設計書に記載のファイル群

### 🧬data-flow-diagram.md

**変更なし** - 既存のデータフローが正しい（Checkout Session方式）

## 6 TDD_WORK_FLOW.md 簡易版

### 👁️e2e-screen-test

`tests/e2e/account/subscription.spec.ts` - サブスクリプション管理画面のE2Eテスト（既存を拡張）

### 👁️e2e-section-test

同上

### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)

変更なし - Stripe Checkoutはリダイレクト方式のため追加CSS不要

### 🪨route

- `app/routes/account.subscription.tsx` - 既存ルートにaction追加（create-checkout, cancel-subscription）
- `app/routes/api.webhooks.stripe.tsx` - **新規** Webhookエンドポイント

### 🚧components.test

- `app/components/account/subscription/PlanSelector.test.tsx` - プラン選択コンポーネントのテスト（将来のプラン追加に備えて維持）
- `app/components/account/subscription/SubscriptionStatus.test.tsx` - 状態表示のテスト

### 🪨components

- `app/components/account/subscription/PlanSelector.tsx` - **新規** プラン選択UI（1プランでも動作、将来の拡張に対応）
- `app/components/account/subscription/SubscriptionStatus.tsx` - 既存を確認/修正
- `app/components/account/subscription/SubscriptionStatusCard.tsx` - 既存（決済ボタンの修正）

### 🚧logic.test

- `app/lib/account/subscription/calculatePlanPrice.test.ts`
- `app/lib/account/subscription/formatSubscriptionStatus.test.ts`
- `app/lib/account/subscription/calculateNextBillingDate.test.ts`

### 🪨logic

- `app/lib/account/subscription/calculatePlanPrice.ts` - プラン価格計算
- `app/lib/account/subscription/formatSubscriptionStatus.ts` - 状態フォーマット
- `app/lib/account/subscription/calculateNextBillingDate.ts` - 次回請求日計算

### 🚧data-io.test

- `app/data-io/account/subscription/createStripeCheckoutSession.server.test.ts`
- `app/data-io/account/subscription/cancelStripeSubscription.server.test.ts`
- `app/data-io/account/subscription/verifyStripeWebhook.server.test.ts`

### 🪨data-io

- `app/data-io/account/subscription/createStripeCheckoutSession.server.ts` - **新規**
- `app/data-io/account/subscription/cancelStripeSubscription.server.ts` - **新規**
- `app/data-io/account/subscription/verifyStripeWebhook.server.ts` - **新規**
- `app/data-io/account/subscription/getSubscriptionByUserId.server.ts` - 既存確認
- `app/data-io/account/subscription/updateSubscriptionStatus.server.ts` - 既存確認

### その他

**削除対象（Stripe AIエージェントの実装）**:

- `app/lib/stripe.ts`
- `app/routes/checkout.tsx`
- `app/routes/webhook.tsx`
- `app/components/checkout/CheckoutForm.tsx`
- `app/components/checkout/`ディレクトリ

**修正対象**:

- `app/root.tsx` - `window.ENV.STRIPE_PUBLISHABLE_KEY`の削除（Checkout方式では不要）
- `app/components/account/subscription/SubscriptionStatusCard.tsx` - 決済ボタンのリンク先変更
- `package.json` - `@stripe/react-stripe-js`, `@stripe/stripe-js`の削除（Checkout方式では不要）

**環境変数**:

- `STRIPE_SECRET_KEY` - 必須（サーバーサイド）
- `STRIPE_WEBHOOK_SECRET` - 必須（Webhook署名検証）
- `STRIPE_PUBLISHABLE_KEY` - 削除可（Checkout方式では不要）
