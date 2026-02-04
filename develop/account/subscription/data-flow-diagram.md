# data-flow-diagram.md - subscription Section

## 目的

`file-list.md`を基に、`subscription`セクションのコンポーネント間の依存関係とデータフローをMermaid図として可視化する。

---

## データフロー図

### プラン購読フロー

```mermaid
graph TD
    User((ユーザー)) --> PlanSelector["PlanSelector"]
    PlanSelector -- "プラン選択ボタンクリック" --> Action["account.subscription action<br/>(create-checkout)"]

    Action --> ValidatePlan["プランID検証"]
    ValidatePlan --> GetUser["getUserById.server<br/>(data-io/common)"]
    GetUser --> CreateCheckout["createStripeCheckoutSession.server<br/>(data-io)"]
    CreateCheckout --> StripeCheckout["Stripe Checkout<br/>(外部サイト)"]

    StripeCheckout -- "決済完了" --> Redirect["/account/subscription?success=true<br/>へリダイレクト"]
    Redirect --> PendingState["pending状態表示<br/>（決済完了を確認中...）"]
    PendingState --> Polling["3秒ごとにloaderを再実行<br/>（ポーリング）"]
    Polling -- "ステータス未反映" --> Timeout{"60秒経過?"}
    Timeout -- "No" --> Polling
    Timeout -- "Yes" --> TimeoutMsg["タイムアウトメッセージ表示<br/>（ページ再読み込み促す）"]

    StripeCheckout -- "決済完了（非同期）" --> Webhook["api.webhooks.stripe<br/>(Webhook受信)"]
    Webhook --> VerifySignature["verifyStripeWebhook.server<br/>(data-io)"]
    VerifySignature --> HandleEvent["checkout.session.completed<br/>イベント処理"]
    HandleEvent --> CreateSub["createSubscription.server<br/>(data-io)"]
    CreateSub --> UpdateUser["ユーザーのsubscriptionStatus更新<br/>(D1 Database)"]
    UpdateUser --> PollingDetect["次回ポーリング時に検出"]

    Polling -- "ステータスactive" --> ActiveState["通常のactive表示へ切り替え"]

    style PlanSelector fill:#fff4e1
    style Action fill:#f0f0f0
    style StripeCheckout fill:#e3f2fd
    style Webhook fill:#f0f0f0
    style Redirect fill:#e8f5e9
    style PendingState fill:#b3e5fc
    style Polling fill:#fff9c4
    style TimeoutMsg fill:#ffccbc
```

**ポーリングタイムアウト時のUX設計**:

- **タイムアウトメッセージ内容**（二重決済防止のため明確に記載）:
  ```
  決済処理に時間がかかっています。決済は完了している可能性があります。
  ページを再読み込みして確認してください。
  反映されない場合は数分後に再度ご確認いただくか、サポートにお問い合わせください。
  ```
- **重要**: 「失敗しました」のような誤解を招く表現は避ける（ユーザーが再度決済してしまうリスク）。
- **推奨**: タイムアウト後も自動リロード等は行わず、ユーザーの明示的なアクションを待つ。

### サブスクリプション状態表示フロー

```mermaid
graph TD
    User((ユーザー)) --> Loader["account.subscription loader"]
    Loader --> ValidateSession["セッション検証<br/>(AuthGuard)"]
    ValidateSession --> GetUser["getUserById.server<br/>(data-io/common)"]
    GetUser --> GetSub["getSubscriptionByUserId.server<br/>(data-io)"]
    GetSub --> GetPlans["利用可能なプラン一覧取得<br/>(subscription-spec.yaml)"]
    GetPlans --> Format["formatSubscriptionStatus<br/>(lib)"]
    Format --> Render["SubscriptionStatus<br/>コンポーネント表示"]

    style Loader fill:#f0f0f0
    style Render fill:#e8f5e9
```

### サブスクリプションキャンセルフロー

```mermaid
graph TD
    User((ユーザー)) --> SubStatus["SubscriptionStatus"]
    SubStatus -- "キャンセルボタンクリック" --> Modal["Modal (common)<br/>(キャンセル確認)"]
    Modal -- "キャンセル確認" --> Action["account.subscription action<br/>(cancel-subscription)"]

    Action --> ValidateSession["セッション検証"]
    ValidateSession --> GetSub["getSubscriptionByUserId.server<br/>(data-io)"]
    GetSub --> CancelStripe["cancelStripeSubscription.server<br/>(Stripe API: cancel_at_period_end=true)"]
    CancelStripe --> RecordCancel["canceled_at記録<br/>(DB: canceled_at, status維持)"]
    RecordCancel --> Success["成功メッセージ表示<br/>「期間終了まで利用可能」"]

    CancelStripe -- "Stripeが非同期送信" --> WebhookUpdated["api.webhooks.stripe<br/>(customer.subscription.updated)"]
    WebhookUpdated --> VerifySignature1["verifyStripeWebhook.server"]
    VerifySignature1 --> UpdateCancelFlag["cancel_at_period_end検知<br/>canceled_at更新"]

    Success -- "期間終了時" --> WebhookDeleted["api.webhooks.stripe<br/>(customer.subscription.deleted)"]
    WebhookDeleted --> VerifySignature2["verifyStripeWebhook.server"]
    VerifySignature2 --> FinalizeCancel["完全失効処理<br/>(status='canceled', アクセス不可)"]

    style Modal fill:#ffcccc
    style Action fill:#f0f0f0
    style Success fill:#e8f5e9
    style WebhookUpdated fill:#fff4e1
    style WebhookDeleted fill:#f0f0f0
```

**重要な注意事項**:

- **即座のキャンセル**: Stripe API呼び出しで `cancel_at_period_end: true` を設定。Stripeのステータスは `active` のまま。
- **アクセス制御**: `current_period_end` までは会員としてサービス利用可能（ビジネス要件）。
- **期間終了**: `current_period_end` に達した時点で `customer.subscription.deleted` Webhookが送信され、完全失効。
- **再登録**: アカウント削除後の再登録では、残存期間は復元されない（ビジネス要件）。

### Webhook処理フロー

```mermaid
graph TD
    Stripe["Stripe"] -- "Webhookイベント送信" --> Endpoint["api.webhooks.stripe"]

    Endpoint --> Verify["verifyStripeWebhook.server<br/>(data-io)"]
    Verify -- "署名検証成功" --> TypeCheck{"イベントタイプ判定"}
    Verify -- "署名検証失敗" --> Error400["400 Bad Request"]

    TypeCheck -- "checkout.session.completed" --> HandleCheckout["決済完了処理"]
    TypeCheck -- "customer.subscription.created" --> HandleCreated["サブスクリプション作成処理"]
    TypeCheck -- "customer.subscription.updated" --> HandleUpdated["サブスクリプション更新処理<br/>(cancel_at_period_end変更検知)"]
    TypeCheck -- "customer.subscription.deleted" --> HandleDeleted["期間終了・完全失効処理"]
    TypeCheck -- "invoice.paid" --> HandlePaid["請求成功処理"]
    TypeCheck -- "invoice.payment_failed" --> HandleFailed["請求失敗処理"]

    HandleCheckout --> CreateSub["createSubscription.server<br/>(data-io)"]
    HandleCreated --> CreateSub
    HandleUpdated --> UpdateSub["updateSubscriptionStatus.server<br/>(data-io)"]
    HandleDeleted --> UpdateSub
    HandlePaid --> UpdateSub
    HandleFailed --> UpdateSub

    CreateSub --> Success200["200 OK"]
    UpdateSub --> Success200

    style Endpoint fill:#f0f0f0
    style Verify fill:#fff4e1
    style Success200 fill:#e8f5e9
    style Error400 fill:#ffcccc
```

---

## コンポーネント責務

| コンポーネント | 責務 | 依存先 |
| :--- | :--- | :--- |
| **account.subscription.tsx** | サブスクリプション管理ページのRoute定義、loader/action処理 | PlanSelector, SubscriptionStatus, getSubscriptionByUserId.server, createStripeCheckoutSession.server |
| **api.webhooks.stripe.tsx** | Stripe Webhookの受信と処理、イベント署名検証 | verifyStripeWebhook.server, updateSubscriptionStatus.server, createSubscription.server |
| **PlanSelector** | プラン選択UI、購読ボタン配置 | Button (common), ErrorMessage (common) |
| **SubscriptionStatus** | サブスクリプション状態表示（Badge使用）、キャンセルUI（Modal使用） | Badge (common), Modal (common), Button (common), ErrorMessage (common) |

---

## 純粋ロジック層の関数依存関係

```mermaid
graph LR
    A[calculatePlanPrice] --> B[プラン期間から価格計算]
    A --> C[割引率適用]

    D[formatSubscriptionStatus] --> E[状態からラベル取得]
    D --> F[状態からバッジカラー取得]
    D --> G[状態から説明文取得]

    H[calculateNextBillingDate] --> I[契約開始日取得]
    H --> J[プラン期間加算]
    H --> K[次回請求日計算]
```

---

## 副作用層の関数依存関係

### Stripe API 連携

```mermaid
graph TD
    A[createStripeCheckoutSession.server] --> B[Stripe API]
    B --> C[stripe.checkout.sessions.create]
    C --> D[Checkout Session URL返却]

    E[cancelStripeSubscription.server] --> F[Stripe API]
    F --> G[stripe.subscriptions.update]
    G --> H[cancel_at_period_end: true設定]

    I[verifyStripeWebhook.server] --> J[Stripe SDK]
    J --> K[stripe.webhooks.constructEvent]
    K --> L[署名検証済みEvent返却]
```

### データベース操作

```mermaid
graph TD
    A[getSubscriptionByUserId.server] --> B[D1 Database]
    B --> C[SELECT * FROM subscriptions WHERE user_id]

    D[updateSubscriptionStatus.server] --> E[D1 Database]
    E --> F[UPDATE subscriptions SET status, updated_at]

    G[createSubscription.server] --> H[D1 Database]
    H --> I[INSERT INTO subscriptions]
```

---

## セキュリティフロー

### Webhook署名検証フロー

```mermaid
graph LR
    A[Webhookイベント受信] --> B[署名ヘッダー取得]
    B --> C[verifyStripeWebhook.server]
    C --> D[Stripe SDKで署名検証]
    D -- "成功" --> E[イベント処理続行]
    D -- "失敗" --> F[400 Bad Request返却]
```

### Checkout Session作成時のセキュリティ

```mermaid
graph LR
    A[ユーザー認証確認] --> B[セッション検証]
    B --> C[ユーザー情報取得]
    C --> D[metadataにuserIdを含める]
    D --> E[Stripe Checkout Session作成]
    E --> F[customer_emailを自動設定]
```

---

## プラン価格計算フロー

```mermaid
graph TD
    A[プランID] --> B[subscription-spec.yamlから価格取得]
    B --> C{割引率あり？}
    C -- "Yes" --> D[割引率適用]
    C -- "No" --> E[元の価格返却]
    D --> F[割引後価格返却]
```

---

## サブスクリプション状態フォーマットフロー

```mermaid
graph TD
    A[Subscription.status] --> B{状態判定}
    B -- "active" --> C[label: アクティブ, variant: success, color: green]
    B -- "canceled" --> D[label: キャンセル済み, variant: secondary, color: gray]
    B -- "past_due" --> E[label: 支払い遅延, variant: warning, color: amber]
    B -- "trialing" --> F[label: トライアル期間, variant: info, color: blue]
    B -- "incomplete" --> G[label: 未完了, variant: warning, color: amber]
    B -- "incomplete_expired" --> H[label: 期限切れ, variant: secondary, color: gray]
    B -- "unpaid" --> I[label: 未払い, variant: danger, color: red]
```

---

## 次回請求日計算フロー

```mermaid
graph TD
    A[契約開始日] --> B[プラン期間取得]
    B --> C{プラン種別}
    C -- "1month" --> D[+1ヶ月]
    C -- "3months" --> E[+3ヶ月]
    C -- "6months" --> F[+6ヶ月]
    D --> G[次回請求日返却]
    E --> G
    F --> G
```

---

## Webhookイベント処理の詳細フロー

### checkout.session.completed イベント

```mermaid
graph TD
    A[checkout.session.completed] --> B[セッションオブジェクト取得]
    B --> C[metadata.userIdからユーザー特定]
    C --> D[subscription_idからStripe Subscription取得]
    D --> E[createSubscription.server]
    E --> F[subscriptionsテーブルにINSERT]
    F --> G[usersテーブルのsubscriptionStatus更新]
    G --> H[200 OK返却]
```

### customer.subscription.updated イベント

```mermaid
graph TD
    A[customer.subscription.updated] --> B[Subscriptionオブジェクト取得]
    B --> C[stripe_subscription_idからレコード検索]
    C --> D[updateSubscriptionStatus.server]
    D --> E[status, current_period_end更新]
    E --> F[200 OK返却]
```

### invoice.payment_failed イベント

```mermaid
graph TD
    A[invoice.payment_failed] --> B[Invoiceオブジェクト取得]
    B --> C[subscription_idからレコード検索]
    C --> D[updateSubscriptionStatus.server]
    D --> E[status: past_due に更新]
    E --> F[200 OK返却]
```

### invoice.paid イベント（継続課金）

```mermaid
graph TD
    A[invoice.paid] --> B[Invoiceオブジェクト取得]
    B --> C[invoice.customerからStripe顧客ID取得]
    C --> D[getUserByStripeCustomerId.server<br/>ユーザー逆引き]
    D --> E[invoice.subscriptionからサブスクリプションID取得]
    E --> F[Stripe APIで最新期間取得]
    F --> G[updateSubscriptionPeriod.server]
    G --> H[currentPeriodStart, currentPeriodEnd更新]
    H --> I[200 OK返却]

    style D fill:#fff4e1
    style G fill:#e8f5e9
```

**重要な注意事項**:

- **ユーザー逆引き**: `invoice`イベントには`metadata`がないため、`customer`IDからusersテーブルを逆引きする必要がある
- **stripeCustomerId必須**: checkout.session.completed時にusersテーブルにstripeCustomerIdを保存しておく必要がある

---

## 冪等性ガードフロー（新規）

```mermaid
graph TD
    A[Webhookイベント受信] --> B[署名検証]
    B --> C{isWebhookEventProcessed?}
    C -- "処理済み" --> D[200 OK<br/>即座に返却]
    C -- "未処理" --> E[イベント処理実行]
    E --> F[recordWebhookEvent<br/>イベント記録]
    F --> G[200 OK返却]

    style C fill:#fff4e1
    style F fill:#e8f5e9
```

**冪等性ガードの目的**:

- Stripeは配信失敗時に同じイベントを再送する
- 重複処理を防止することで、データの整合性を保つ
- webhook_eventsテーブルにeventIdを記録し、処理済みチェックを行う

---

## エラーハンドリングフロー

### Stripe Checkout Session作成エラー

```mermaid
graph LR
    A[createStripeCheckoutSession.server] --> B{Stripe API呼び出し}
    B -- "成功" --> C[Checkout URLを返却]
    B -- "失敗" --> D[エラーログ記録]
    D --> E[エラーメッセージ返却]
    E --> F[ユーザーに再試行促す]
```

### Webhook処理エラー

```mermaid
graph LR
    A[api.webhooks.stripe] --> B{署名検証}
    B -- "成功" --> C[イベント処理]
    B -- "失敗" --> D[400 Bad Request]
    C --> E{DB更新}
    E -- "成功" --> F[200 OK]
    E -- "失敗" --> G[エラーログ記録]
    G --> H[500 Internal Server Error]
    H --> I[Stripeが自動リトライ]
```

---

## パフォーマンス最適化ポイント

### Stripe Checkout Session作成の最適化

```mermaid
graph TD
    A[ユーザーリクエスト] --> B[セッション検証<br/>（キャッシュ活用）]
    B --> C[プラン情報取得<br/>（spec.yamlから即座に取得）]
    C --> D[Stripe API呼び出し<br/>（タイムアウト3秒）]
    D --> E[Checkout URLを返却]
```

### Webhook処理の最適化

```mermaid
graph TD
    A[Webhookイベント受信] --> B[署名検証<br/>（高速なSDK処理）]
    B --> C[イベントタイプ判定<br/>（switch文で分岐）]
    C --> D[DB更新<br/>（トランザクション使用）]
    D --> E[200 OK即座に返却<br/>（5秒以内）]
```

---

**最終更新**: 2025-12-23
