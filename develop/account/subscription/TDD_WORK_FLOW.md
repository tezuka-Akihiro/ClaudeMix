# TDD作業手順書: subscription

## 1. 概要

**開発名**: subscription (サブスクリプション管理) の実装
**目的**: ユーザーがプラン選択、Stripe決済、サブスクリプション状態確認、キャンセルを行える機能を提供する

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1. **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2. **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3. **E2E拡張**: 最初のE2Eテストが成功した後、エラーケースや境界値などの詳細なE2Eテストを追加し、品質を盤石にします。

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義) 🔴未着手

- **1. E2Eテストの準備**:
  - テストファイル `tests/e2e/account/subscription.spec.ts` を**新規作成**します。
    - **依頼例**: `@GeneratorOperator "account サービス subscription のE2Eテストを作成して"`
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、開発のゴールを定義します。
  - **Happy Path シナリオ**:
    1. プラン選択画面が正しく表示される
    2. 3ヶ月プランを選択し、Stripe Checkout Session作成が成功する
    3. Webhookをシミュレートし、サブスクリプションステータスが`active`になることを確認
    4. サブスクリプション状態表示画面で`active`バッジが表示される
- **2. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
  - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: CSS実装（Layer 2/3/4） 🔴未着手

**目的**: `uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装します。

**実装対象**:

1. **Layer 2**: `app/styles/account/layer2-subscription.css`
2. **Layer 3**: `app/styles/account/layer3.ts`
3. **Layer 4**: `app/styles/account/layer4.ts`（必要な場合のみ）

**段階的更新の運用**:

- `uiux-spec.md` で該当セクションのコンポーネント設計を行い、このフェーズで既存のCSS実装ファイルに追記します
- **共通化の検討**: 既存セクションに類似コンポーネントがある場合、必ず共通化を検討してください
- **整合性の確認**: 追加時は、既存実装との整合性（命名規則、トークン使用等）を確認してください

**手順**:

1. **Layer 2 実装**:
   - `uiux-spec.md` で定義したコンポーネントを元に `layer2-subscription.css` を実装
   - コンポーネントセレクタ (`.{component}-{variant?}`) で定義
   - すべての値は `var(--*)` でLayer 1トークンを参照

2. **Layer 3 実装**:
   - `uiux-spec.md` の「認定済み並列配置」セクションを元に `layer3.ts` を実装
   - Tailwind plugin形式（`addComponents`）でレイアウトを定義
   - gap のみ `var(--spacing-*)` を直接参照可能

3. **Layer 4 実装**（必要な場合のみ）:
   - `uiux-spec.md` で定義した例外的な構造を元に `layer4.ts` を実装
   - 例外的な構造のみを定義

4. **検証**:

   ```bash
   npm run lint:css-arch
   ```

   - 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

5. **確認事項**:
   - ✅ Layer 2で色・サイズ・タイポグラフィが定義されている
   - ✅ Layer 3でフレックス・グリッドレイアウトのみが定義されている
   - ✅ margin が使用されていない（gap統一の原則）
   - ✅ `!important` が使用されていない
   - ✅ リント検証に合格している

### Phase 3: 層別TDD (ユニット/コンポーネント実装) 🔴未着手

**重要な実装順序**: 副作用層 → 純粋ロジック層 → UI層 の順で実装（依存関係の逆順）

#### 3.1. 🔌 副作用層の実装 (data-io)

**Phase 3.1.1: Stripe連携層**

1. **createStripeCheckoutSession.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、createStripeCheckoutSession という名前のdata-ioファイルを作成して"`
   - **責務**: Stripe Checkout Sessionを作成し、決済ページのURLを返す
   - **テスト観点**:
     - 正常系: 有効なプランIDでCheckout Session作成成功
     - 異常系: 無効なプランID、Stripe API接続エラー
     - モック: `stripe.checkout.sessions.create`をモック化
   - **実装のポイント**:
     - 環境変数 `STRIPE_SECRET_KEY` の検証
     - `success_url`, `cancel_url` の適切な設定
     - `metadata` にユーザーIDとプランIDを埋め込み（Webhook処理で使用）

2. **cancelStripeSubscription.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、cancelStripeSubscription という名前のdata-ioファイルを作成して"`
   - **責務**: Stripeでサブスクリプションをキャンセル（`cancel_at_period_end`使用）
   - **テスト観点**:
     - 正常系: `cancel_at_period_end=true`でキャンセル成功
     - 異常系: 無効なサブスクリプションID、Stripe API接続エラー
     - モック: `stripe.subscriptions.update`をモック化
   - **実装のポイント**:
     - **ビジネス要件**: `cancel_at_period_end: true` を設定し、現在の請求期間終了まではアクセス可能にする
     - **アカウント削除時**: `cancel_immediately: true` で即座キャンセル（profileセクションから呼び出される）
     - エラーハンドリング: Stripe API失敗時の適切なエラーメッセージ

3. **verifyStripeWebhook.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、verifyStripeWebhook という名前のdata-ioファイルを作成して"`
   - **責務**: Stripe Webhookの署名検証を行い、セキュリティを確保
   - **テスト観点**:
     - 正常系: 有効な署名で検証成功
     - 異常系: 無効な署名、署名なし、タイムスタンプ改ざん
     - モック: `stripe.webhooks.constructEvent`をモック化
   - **実装のポイント**:
     - 環境変数 `STRIPE_WEBHOOK_SECRET` の検証
     - リプレイアタック対策（タイムスタンプ検証）

**Phase 3.1.2: サブスクリプションDB管理層**

4. **getSubscriptionByUserId.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、getSubscriptionByUserId という名前のdata-ioファイルを作成して"`
   - **責務**: ユーザーIDからサブスクリプション情報を取得
   - **テスト観点**:
     - 正常系: サブスクリプションが存在する場合に正しく取得
     - 正常系（境界値）: サブスクリプションが存在しない場合にnullを返す
     - 異常系: DB接続エラー
     - モック: Cloudflare D1の`prepare().bind().first()`をモック化
   - **実装のポイント**:
     - **依存**: `app/specs/account/types.ts` の `Subscription` 型を使用
     - 複数のサブスクリプションが存在する場合は最新のものを返す（ORDER BY created_at DESC LIMIT 1）

5. **updateSubscriptionStatus.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、updateSubscriptionStatus という名前のdata-ioファイルを作成して"`
   - **責務**: Webhook経由でサブスクリプション状態をDB更新
   - **テスト観点**:
     - 正常系: `status`, `current_period_end`, `canceled_at` の更新成功
     - 異常系: サブスクリプションが存在しない、DB接続エラー
     - モック: D1の`prepare().bind().run()`をモック化
   - **実装のポイント**:
     - `updated_at` の自動更新
     - `canceled_at` の適切な設定（`customer.subscription.updated`イベント時）

6. **createSubscription.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、createSubscription という名前のdata-ioファイルを作成して"`
   - **責務**: Webhook経由でサブスクリプションレコードをDB作成
   - **テスト観点**:
     - 正常系: 新規サブスクリプション作成成功
     - 異常系: 重複するstripe_subscription_id、DB接続エラー
     - モック: D1の`prepare().bind().run()`をモック化
   - **実装のポイント**:
     - UUID生成（`crypto.randomUUID()`）
     - `created_at`, `updated_at` の設定

7. **deleteSubscription.server.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、deleteSubscription という名前のdata-ioファイルを作成して"`
   - **責務**: アカウント削除時にサブスクリプションレコードを削除
   - **テスト観点**:
     - 正常系: サブスクリプション削除成功
     - 正常系（境界値）: サブスクリプションが存在しない場合もエラーにならない
     - 異常系: DB接続エラー
   - **モック**: D1の`prepare().bind().run()`をモック化
   - **実装のポイント**:
     - **使用箇所**: profileセクションのアカウント削除フローで使用
     - `cancelStripeSubscription.server.ts` の後に実行される

#### 3.2. 🧠 純粋ロジック層の実装 (lib)

8. **calculatePlanPrice.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、calculatePlanPrice という名前のlibファイルを作成して"`
   - **責務**: プランIDから価格を計算（将来的に割引適用も可能）
   - **テスト観点**:
     - 正常系: 各プラン（1month, 3months, 6months）の価格計算
     - 異常系: 無効なプランID
   - **実装のポイント**:
     - **SSoT原則**: `app/specs/account/subscription-spec.yaml` から価格情報を動的に読み込む
     - 副作用なし（純粋関数）

9. **formatSubscriptionStatus.ts**
   - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、formatSubscriptionStatus という名前のlibファイルを作成して"`
   - **責務**: サブスクリプション状態（active/canceled/past_due等）を日本語表示用にフォーマット
   - **テスト観点**:
     - 正常系: 各ステータス（active, canceled, past_due, trialing等）の変換
     - 境界値: `canceled_at`が存在する場合は「期間終了まで有効」と追記
   - **実装のポイント**:
     - **SSoT原則**: `app/specs/account/subscription-spec.yaml` からステータスメッセージを読み込む
     - 副作用なし（純粋関数）

10. **calculateNextBillingDate.ts**
    - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、calculateNextBillingDate という名前のlibファイルを作成して"`
    - **責務**: `current_period_end` から次回請求日を計算し、表示用にフォーマット
    - **テスト観点**:
      - 正常系: ISO 8601形式の日付を日本語表示に変換
      - 境界値: 期限切れ（過去日）の場合の処理
    - **実装のポイント**:
      - 副作用なし（純粋関数）
      - タイムゾーン考慮（日本時間: Asia/Tokyo）

#### 3.3. 📱 UI層の実装 (Routes)

11. **api.webhooks.stripe.tsx**
    - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、api.webhooks.stripe という名前のrouteファイルを作成して"`
    - **責務**: Stripe Webhookを受信し、イベントに応じてDB更新
    - **テスト観点**:
      - 正常系: `checkout.session.completed`イベントでサブスクリプション作成
      - 正常系: `customer.subscription.updated`イベントで状態更新（`cancel_at_period_end`検知）
      - 正常系: `customer.subscription.deleted`イベントで完全失効
      - 異常系: 署名検証失敗、未知のイベントタイプ
      - モック: `verifyStripeWebhook`, `createSubscription`, `updateSubscriptionStatus`
    - **実装のポイント**:
      - **セキュリティ**: `verifyStripeWebhook.server.ts`で署名検証を必ず行う
      - **冪等性**: 同じイベントが複数回送信されても安全に処理
      - **エラーハンドリング**: Webhook失敗時はStripeが自動リトライするため、適切なHTTPステータスコードを返す
      - **イベント処理**:
        - `checkout.session.completed`: `createSubscription.server.ts`を呼び出し
        - `customer.subscription.updated`: `updateSubscriptionStatus.server.ts`を呼び出し、`cancel_at_period_end`フラグを`canceled_at`に記録
        - `customer.subscription.deleted`: `updateSubscriptionStatus.server.ts`を呼び出し、`status='canceled'`に設定

12. **account.subscription.tsx**
    - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、account.subscription という名前のrouteファイルを作成して"`
    - **責務**: サブスクリプション管理ページ（loader/action定義）
    - **テスト観点**:
      - loader: セッション検証、サブスクリプション情報取得
      - action（create-checkout）: Checkout Session作成、リダイレクト
      - action（cancel-subscription）: サブスクリプションキャンセル、Flash Message表示
      - 異常系: セッション期限切れ、Stripe API失敗
      - モック: すべての依存関数（getSession, getSubscriptionByUserId等）をモック化
    - **実装のポイント**:
      - **認証保護**: `app/components/account/common/AuthGuard.tsx`で保護（loaderでセッション検証）
      - **Intent-based Action**: `formData.get('intent')`で処理を分岐
        - `create-checkout`: プラン選択後のCheckout Session作成
        - `cancel-subscription`: サブスクリプションキャンセル
      - **依存ファイル**:
        - `getSessionBySessionId.server.ts` (common)
        - `getUserById.server.ts` (common)
        - `getSubscriptionByUserId.server.ts`
        - `createStripeCheckoutSession.server.ts`
        - `cancelStripeSubscription.server.ts`
      - **Polling UX**（決済確認画面）:
        - Checkout後、`?session_id=xxx`パラメータ付きでリダイレクト
        - `loader`内でポーリング的に`getSubscriptionByUserId`を実行
        - タイムアウト時のメッセージ:
          ```
          決済処理に時間がかかっています。決済は完了している可能性があります。
          ページを再読み込みして確認してください。
          反映されない場合は数分後に再度ご確認いただくか、サポートにお問い合わせください。
          ```
        - **重要**: 「失敗しました」のような誤解を招く表現は避ける（ユーザーが再度決済してしまうリスク）

#### 3.4. 📱 UI層の実装 (Components)

13. **PlanSelector.tsx**
    - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、PlanSelector という名前のUIコンポーネントを作成して"`
    - **責務**: プラン選択UI（1ヶ月/3ヶ月/6ヶ月プラン）
    - **テスト観点**:
      - 正常系: 各プランのレンダリング、選択ボタンのクリック
      - 境界値: サブスクリプション加入済みの場合はプラン変更不可のメッセージ表示
    - **実装のポイント**:
      - **スタイリング制約**:
        - ❌ `flex`, `grid`, `gap`の直接使用禁止 → Layer 3で定義された構造クラスを使用
        - ❌ `p-4`, `w-1/2`等のユーティリティクラスの直接使用禁止 → Layer 2で定義されたコンポーネントクラスを使用
      - **共通コンポーネント使用**:
        - `app/components/account/common/Button.tsx` (プラン選択ボタン)
      - **SSoT原則**: プラン情報は`app/specs/account/subscription-spec.yaml`から読み込む

14. **SubscriptionStatus.tsx**
    - **依頼例**: `@GeneratorOperator "account サービスの subscription セクションに、SubscriptionStatus という名前のUIコンポーネントを作成して"`
    - **責務**: サブスクリプション状態表示（共通Modal/Badgeを使用してキャンセル確認UIとステータスバッジを実装）
    - **テスト観点**:
      - 正常系: サブスクリプション状態（active/canceled）の表示
      - 正常系: キャンセルモーダルの開閉動作
      - 正常系: `canceled_at`が存在する場合は「期間終了まで有効」と表示
      - 境界値: サブスクリプション未加入の場合は「プランに加入していません」と表示
    - **実装のポイント**:
      - **共通コンポーネント使用**:
        - `app/components/account/common/Modal.tsx` (キャンセル確認モーダル)
        - `app/components/account/common/Badge.tsx` (ステータスバッジ)
        - `app/components/account/common/Button.tsx` (キャンセルボタン)
      - **lib関数使用**:
        - `formatSubscriptionStatus.ts`: ステータス表示用
        - `calculateNextBillingDate.ts`: 次回請求日表示用

### Phase 4: E2E拡張と統合確認 🔴未着手

- **1. Happy Pathの成功確認**: `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認します。
- **2. 詳細E2Eテスト実装**: E2Eテストファイルに、エラーケース、境界値、他機能との連携など、より詳細なシナリオのテストケースを追記します。
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、品質を盤石にします。
    - **セクションレベル**:
      - キャンセル失敗時のエラーハンドリング
      - Stripe API接続エラー時の挙動
      - Webhook処理の冪等性確認
    - **コンポーネントレベル**:
      - PlanSelectorのプラン切り替え
      - SubscriptionStatusのモーダル開閉
      - キャンセル確認メッセージの表示
- **3. E2Eテストのオールグリーンを確認**: `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認します。
- **4. スタイリング規律確認**: `npm run lint:css-arch` を実行し、`globals.css` 内に配置プロパティ（width, height, margin, padding, display, flex, grid など）が含まれていないことを確認します。
  - **違反が検出された場合**: `tests/lint/css-arch-layer-report.md` の内容に従って修正してください。
  - **原則**: 「描き方（色・フォント）」はデザイントークン（CSS変数）、「配置（位置・サイズ・間隔）」はTailwindクラス
  - **詳細**: `docs/CSS_structure/STYLING_CHARTER.md`
- **5. 表示確認&承認**: `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認します。
  - **確認項目**:
    - プラン選択画面の表示
    - Stripe Checkoutへのリダイレクト（テストモードで確認）
    - 決済完了後のサブスクリプション状態表示
    - キャンセルボタンの動作とモーダル表示
    - キャンセル後の期間終了までのアクセス維持
- **6. Stripe Webhookのテスト**: Stripe CLIを使用してWebhookイベントを送信し、DB更新が正しく行われることを確認します。
  ```bash
  stripe listen --forward-to localhost:8787/api/webhooks/stripe
  stripe trigger checkout.session.completed
  stripe trigger customer.subscription.updated
  stripe trigger customer.subscription.deleted
  ```
- **7. (任意) モデルベーステストの検討**: 状態が複雑に変化するコンポーネントに対して、`E2E_TEST_CRITERIA.md` のモデルベーステスト(MCP)の導入を検討し、UIの堅牢性をさらに高めます。

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1. **再現テストの作成 (E2E or ユニット)**: まず、発見された不具合を再現する**失敗するテスト**を記述します。これは多くの場合、E2Eテストか、特定のコンポーネントの統合テストになります。
2. **原因特定とユニットテストの強化**:
    - デバッグを行い、不具合の根本原因となっている純粋ロジック（lib）やコンポーネントを特定します。
    - その原因を最小単位で再現する**失敗するユニットテスト**を追加します。
3. **実装の修正 (GREEN)**: 追加したユニットテストがパスするように、原因となったコードを修正します。
4. **再現テストの成功確認 (GREEN)**: 最初に作成した再現テスト（E2E/統合テスト）を実行し、こちらもパスすることを確認します。
5. **知見の共有**: この経験を「学んだこと・気づき」セクションに記録し、チームの知識として蓄積します。

---

## 5. 進捗ログ

| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|

## 6. 学んだこと・気づき

### ビジネス要件の明確化

- **サブスクリプションキャンセル vs アカウント削除**:
  - サブスクリプションキャンセル: `cancel_at_period_end=true`を使用し、支払った期間終了までアクセス維持
  - アカウント削除: `cancel_immediately=true`で即座解約、即座にアクセス喪失
  - 再登録時は残存期間は復元されない（ビジネス要件）

### Stripe Webhookの重要性

- **冪等性**: 同じWebhookイベントが複数回送信される可能性があるため、`stripe_subscription_id`での重複チェックが必須
- **セキュリティ**: `verifyStripeWebhook.server.ts`での署名検証は必須（攻撃者による偽装Webhook防止）
- **リトライメカニズム**: Webhook処理失敗時、Stripeが自動リトライするため、適切なHTTPステータスコード（200/400/500）を返す

### Double-Loop TDDの効果

- E2Eテスト（Outer Loop）が開発のゴールを明確にし、ユニットテスト（Inner Loop）が各層の品質を保証
- 副作用層 → 純粋ロジック層 → UI層の順で実装することで、依存関係が明確になり、テストが書きやすい

### スタイリング規律の重要性

- Tailwindクラスのみを参照することで、デザインシステムの一貫性を保持
- Layer 2（コンポーネント）とLayer 3（レイアウト）の分離により、責務が明確化

## 7. さらなる改善提案

- **プラン変更機能**: 現在のプランから別のプランへの変更機能（Stripeの`proration`を使用）
- **請求履歴表示**: 過去の請求履歴をStripe APIから取得して表示
- **支払い方法変更**: カード情報の更新機能（Stripe Customer Portalの活用を検討）
- **トライアル期間**: 初回登録時の無料トライアル機能
- **割引クーポン**: Stripe Couponを使用した割引適用機能
