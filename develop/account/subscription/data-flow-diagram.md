# data-flow-diagram.md - subscription Section

## 目的

`subscription`セクションのコンポーネント間の依存関係とデータフローを可視化する。

---

## データフロー図

### サブスクリプション状態同期フロー (Webhook)

```mermaid
graph TD
    Stripe["Stripe"] -- "Webhookイベント送信<br/>(customer.subscription.updated等)" --> Endpoint["api.webhooks.stripe"]

    Endpoint --> Verify["verifyStripeWebhook.server"]
    Verify -- "署名検証成功" --> TypeCheck{"イベントタイプ判定"}

    TypeCheck -- "ステータス変更" --> SyncStatus["status をそのまま保存<br/>(active, past_due, canceled 等)"]
    SyncStatus --> UpdateDB["users & subscriptions テーブル更新"]
    UpdateDB --> Success200["200 OK"]

    style Endpoint fill:#f0f0f0
    style SyncStatus fill:#e8f5e9
```

### 権限判定フロー (SSoT)

```mermaid
graph TD
    Request["有料コンテンツへのリクエスト"] --> GetStatus["DBから status, current_period_end 取得"]
    GetStatus --> AccessCheck["isSubscriptionAccessible (Pure Logic)"]
    AccessCheck -- "status === 'active' && 有効期限内" --> Grant["閲覧許可"]
    AccessCheck -- "それ以外 (past_due等含む)" --> Deny["閲覧制限・プラン案内へ"]

    style AccessCheck fill:#fff4e1
```

### 自動更新トグルフロー (設定画面)

```mermaid
graph TD
    User((ユーザー)) --> Settings["account.settings"]
    Settings -- "中断ボタン" --> Action["Action (interrupt-renewal)"]
    Action --> StripeAPI["Stripe API<br/>(cancel_at_period_end = true)"]
    StripeAPI --> SyncDB["DB更新 (canceled_at)"]
    SyncDB --> OptimisticUI["設定画面の表示が 'OFF' に変化"]

    style Action fill:#f0f0f0
    style OptimisticUI fill:#e8f5e9
```

---

## 重要な設計方針

- **疎結合**: カード情報は自社DBで持たず、Stripeの `status` をマスターとする。
- **権利全う**: `cancel_at_period_end` を使用し、中断後も `active` 期間内はサービスを提供。
- **即時制限**: `past_due` は猶予期間を設けず、アプリ側で即座に非 `active` として扱う。

---

**最終更新**: 2026-02-05
