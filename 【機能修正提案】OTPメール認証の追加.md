# 【機能修正提案】OTPメール認証の追加

- **サービス**: `account`
- **セクション**: `authentication`
- **関連ドキュメント**:
  - `docs/proposals/email-authentication-strategy.md`（方針案）
  - `develop/account/authentication/func-spec.md`（現行機能設計書）
  - `app/specs/account/authentication-spec.yaml`（現行Spec）

---

## 1. 提案概要

既存のauthenticationセクションに、Resend APIを用いた6桁OTPコード方式のパスワードレス認証を追加し、パスワード不要のログイン手段を提供する。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- ログイン手段は「メール/パスワード認証」と「Google OAuth」の2つ。
- ログイン画面（`login.tsx`）にはパスワード入力フォームとGoogle OAuthボタンが配置されている。
- パスワードを持たないユーザー（OAuth専用）はパスワードログイン不可。
- パスワードリセットはKVトークン+メール送信で実装済みだが、認証手段としてのメールOTPは未実装。

### 修正後 (To-Be)

- ログイン手段に「OTPメール認証」が追加され、計3つになる。
- ログイン画面のUI優先順位を再設計する:
  1. Google OAuthボタン（最優先）
  2. メールアドレス入力 + 「次へ（OTP送信）」ボタン（メインストリーム）
  3. 「パスワードでログイン」リンク（控えめに配置）
- 新規ルート `auth.otp.tsx` でOTPコード入力画面を提供する。
- OTPトークンはCloudflare KVにJSON形式 `{ "code": "123456", "email": "...", "attempts": 0 }` で保存し、10分TTLで自動削除される。
- OTPコードの試行回数を管理し、最大3回失敗でKVからキーを削除する（ブルートフォース対策）。
- Resend APIを通じてOTPメールを送信する。
- OTP送信のAction層にレート制限を組み込む（IPアドレスまたはメールアドレス単位、KVでカウント管理）。
- OAuth既存ユーザーとの名寄せを保証する: 同一メールアドレスで既にユーザーが存在する場合（OAuth登録含む）、新規作成せず既存ユーザーに紐付けてセッションを発行する。
- ユーザーが存在しない場合も同一の画面遷移を行う（列挙攻撃対策）。ただしOTP検証時にユーザーが存在しなければ新規作成する。
- マジックリンクはスコープ外（将来フェーズ）。

## 3. 背景・目的

### 背景

- パスワード認証はUXの障壁（記憶・入力の手間）であり、弱いパスワードによるセキュリティリスクがある。
- Google OAuthは便利だが、Googleアカウントを使いたくないユーザーへの代替手段が不足している。
- パスワードリセット機能で既にKVトークン+メール送信の基盤が存在しており、OTP認証への拡張コストが低い。

### 目的

- **UX向上**: パスワード不要のログイン手段を提供し、認証のハードルを下げる。
- **セキュリティ向上**: パスワード漏洩リスクを低減する（パスワードレスユーザーの増加を期待）。
- **認証手段の多様化**: Google OAuth非利用ユーザーへの代替手段を強化する。

## 4. 変更の妥当性 (Pros / Cons)

Pros (利点):

- 既存のauthenticationセクション内に収まり、アーキテクチャを複雑化しない。
- KVトークン管理・メール送信の既存パターン（パスワードリセット）を再利用できる。
- Resend無料枠（3,000通/月）で運用コストが低い。
- POCコード（`generateAuthToken.ts`, `sendAuthEmail.server.ts`）が実装済みで、基盤が整っている。
- 3層分離アーキテクチャに完全準拠（lib: OTP生成/検証、data-io: KV保存/メール送信、routes: UI）。

Cons (懸念点):

- authenticationセクションのファイル数がさらに増加する（ルート1、コンポーネント1、lib 1〜2、data-io 1〜2の追加）。
- メール到達性に依存するため、メールが届かない場合のフォールバックが必要（既存のパスワード認証で代替可能）。
- login.tsx のUI構成変更（パスワードフォームの降格）は既存ユーザーの学習コストが発生する。

**総合評価**:
Consは管理可能な範囲であり、既存パターンの延長線上で実装できる。authenticationセクションの目的「ユーザーの本人確認」に合致し、Google OAuthと同様に認証手段の1つとして自然に収まる。レート制限・試行回数制限・名寄せロジックを仕様に組み込むことで、運用後の「見えないエラー」を予防する。**妥当性は高い**と判断する。

## 5 設計フロー

### GUIDING_PRINCIPLES.md

**変更あり** — 以下の3箇所を更新:

1. **セクション1 目的とスコープ**:
   - 主要機能に「OTPメール認証（パスワードレス）」を追加
   - 開発スコープ（範囲内）に「OTPメール認証（Resend API）」を追加

2. **セクション2.1 データストレージ戦略**:
   - KVストレージ選択基準テーブルに `OTP Tokens` 行を追加（Workers KV、10分TTL、JSON形式 `{ code, email, attempts }`）
   - KV Key命名規則に `otp:{email}`, `otp-rate:{email}` を追加

3. **セクション3 ルーティング規約**:
   - ルーティングテーブルに `auth.otp.tsx` → `/auth/otp` を追加

4. **セクション4 セクション間連携**:
   - `authentication` セクション説明に「OTPメール認証」を追加
   - データフローに「OTP認証: Route → data-io（レート制限チェック）→ lib（OTP生成）→ data-io（KV保存 + メール送信）→ Route（OTP検証）→ data-io（ユーザーupsert）→ lib（セッション生成）」を追加

### func-spec.md

**変更あり** — 以下を追加:

1. **機能要件に2つの機能を追加**:

   **6. OTPコード送信 (Send OTP)**
   - URL: `/login` (action、intent: `send-otp`)
   - 機能: メールアドレスを受け取り、6桁OTPを生成してResend API経由で送信。OTPをKVにJSON形式で保存（TTL: 10分）
   - 入力: メールアドレス
   - 処理フロー: メール形式バリデーション → レート制限チェック（KV） → OTP生成（lib） → KVに保存 → Resend APIでメール送信 → `/auth/otp?email=xxx` へリダイレクト
   - セキュリティ: ユーザー未登録でも同一画面遷移（列挙攻撃対策）、レート制限（メールアドレス単位、5分間に3回まで）

   **7. OTP検証・ログイン (Verify OTP)**
   - URL: `/auth/otp` (新規ルート)
   - 機能: 6桁コードを検証し、成功時にセッションを発行。ユーザーが存在しなければ新規作成（名寄せ）
   - 入力: メールアドレス（hidden）、6桁OTPコード
   - loader防衛: emailパラメータ未指定またはKVにOTPデータが存在しない場合、`/login`へリダイレクト（直接アクセス対策）
   - 処理フロー: OTPコード形式バリデーション → KVからOTPデータ取得 → コード照合 → 失敗時はattempts+1（3回でKV削除）→ 成功時はKVから削除 → ユーザーupsert（既存ユーザーに紐付けまたは新規作成）→ セッション生成 → リダイレクト
   - エラーハンドリング: コード不一致「認証コードが正しくありません」、期限切れ「認証コードの有効期限が切れています」、試行回数超過「認証コードが無効になりました」

2. **純粋ロジック要件に追加**:
   - `generateOtp()`: 既存（POC実装済み）。6桁数字OTP生成
   - `validateOtpFormat()`: 新規。6桁数字文字列の形式チェック

3. **副作用要件に追加**:
   - `sendAuthEmail.server.ts`: 既存（POC実装済み）。Resend API経由のメール送信
   - `saveOtpToken.server.ts`: 新規。KVにOTPデータをJSON保存（TTL: 10分）
   - `verifyOtpToken.server.ts`: 新規。KVからOTPデータ取得・照合・attempts更新
   - `upsertUserByEmail.server.ts`: 新規。メールでユーザー検索、存在すれば返却、なければ新規作成
   - `checkOtpRateLimit.server.ts`: 新規。KVでメールアドレス単位のレート制限チェック

4. **実装の優先順位を更新**:
   - Phase 2に「OTPメール認証」を追加（パスワードリセットと同列）

### uiux-spec.md

**変更あり** — 以下を追加・変更:

1. **Login Page 構造図を更新**:
   - 現在: EmailField + PasswordField + SubmitButton + OAuthButton
   - 変更後: OAuthButton → EmailField + 「次へ」SubmitButton (OTP送信) → 「パスワードでログイン」Link
   - login.tsx のAction が `intent` で分岐: `send-otp` / `login`（パスワード認証）

2. **OTP Verify Page 構造図を新規追加** (`auth.otp.tsx`):
   - OtpVerifyForm: OtpCodeField(6桁入力) + SubmitButton(「認証する」) + ResendLink(「コードを再送信」) + BackLink(「ログインに戻る」)
   - 状態遷移: Default → Filling → Submitting → Error/Success

3. **コンポーネント設計に OtpVerifyForm を追加**:
   - 配置: `app/components/account/authentication/OtpVerifyForm.tsx`
   - 親: auth.otp.tsx Route
   - 子: FormField × 1（6桁コード入力）, Button, Link × 2
   - 状態遷移: Default → Filling → Submitting → Error → Filling / Success → redirect

4. **インタラクション設計に「OTPフロー」を追加**:
   - User → login.tsx「メールアドレス入力 + 次へ」→ Server「OTP生成・送信」→ auth.otp.tsx「6桁コード入力」→ Server「検証・セッション発行」→ リダイレクト

### spec.yaml (authentication-spec.yaml)

**変更あり** — 以下のセクションを追加:

1. **routes**: `otp_verify: { path: "/auth/otp", title: "認証コード入力" }`
2. **server_io.action.intents**: `send_otp: "send-otp"`, `verify_otp: "verify-otp"`
3. **forms.send_otp**: メールアドレスフィールド + 「次へ」ボタン
4. **forms.otp_verify**: OTPコードフィールド（6桁、inputmode: numeric） + 「認証する」ボタン + 「コードを再送信」リンク + 「ログインに戻る」リンク
5. **validation.otp**: `{ length: 6, pattern: "^\\d{6}$", error_messages: { required, invalid_format, expired, max_attempts } }`
6. **error_messages.otp**: `{ invalid_code, expired, max_attempts_exceeded, send_failed, rate_limited }`
7. **success_messages.otp**: `{ code_sent, login_completed }`
8. **otp_config**: `{ ttl_seconds: 600, max_attempts: 3, code_length: 6 }`
9. **rate_limit.otp_send**: `{ max_requests: 3, window_seconds: 300, kv_key_prefix: "otp-rate" }`
10. **test.selectors**: OTP関連セレクタを追加

### file-list.md

**変更あり** — 以下のファイルを追加:

**Routes（新規）**:

- `auth.otp.tsx` | `app/routes/auth.otp.tsx` | OTPコード検証ページ

**Routes（変更）**:

- `login.tsx` | `app/routes/login.tsx` | OTP送信intentの追加

**Components（新規）**:

- `OtpVerifyForm.tsx` | `app/components/account/authentication/OtpVerifyForm.tsx`
- `OtpVerifyForm.test.tsx` | `app/components/account/authentication/OtpVerifyForm.test.tsx`

**純粋ロジック層（新規）**:

- `validateOtpFormat.ts` | `app/lib/account/authentication/validateOtpFormat.ts`
- `validateOtpFormat.test.ts` | `app/lib/account/authentication/validateOtpFormat.test.ts`

**純粋ロジック層（既存POC）**:

- `generateAuthToken.ts` | `app/lib/account/authentication/generateAuthToken.ts` | 実装済み
- `generateAuthToken.test.ts` | `app/lib/account/authentication/generateAuthToken.test.ts` | 実装済み

**副作用層（新規）**:

- `saveOtpToken.server.ts` | `app/data-io/account/authentication/saveOtpToken.server.ts`
- `saveOtpToken.server.test.ts` | `app/data-io/account/authentication/saveOtpToken.server.test.ts`
- `verifyOtpToken.server.ts` | `app/data-io/account/authentication/verifyOtpToken.server.ts`
- `verifyOtpToken.server.test.ts` | `app/data-io/account/authentication/verifyOtpToken.server.test.ts`
- `upsertUserByEmail.server.ts` | `app/data-io/account/authentication/upsertUserByEmail.server.ts`
- `upsertUserByEmail.server.test.ts` | `app/data-io/account/authentication/upsertUserByEmail.server.test.ts`
- `checkOtpRateLimit.server.ts` | `app/data-io/account/authentication/checkOtpRateLimit.server.ts`
- `checkOtpRateLimit.server.test.ts` | `app/data-io/account/authentication/checkOtpRateLimit.server.test.ts`

**副作用層（既存POC）**:

- `sendAuthEmail.server.ts` | `app/data-io/account/authentication/sendAuthEmail.server.ts` | 実装済み

### data-flow-diagram.md

**変更あり** — 以下の2つのフロー図を追加:

1. **OTPコード送信フロー** (login.tsx action, intent: send-otp):
   - ユーザー → メール入力 → レート制限チェック(KV) → OTP生成(lib) → KV保存(JSON, TTL:10分) → Resend API送信 → /auth/otp へリダイレクト

2. **OTP検証・ログインフロー** (auth.otp.tsx action):
   - ユーザー → 6桁コード入力 → KVからOTPデータ取得 → コード照合 → 失敗時: attempts+1, 3回で削除 → 成功時: KV削除 → upsertUser(名寄せ) → セッション生成 → Cookie設定 → リダイレクト

## 6 TDD_WORK_FLOW.md 簡易版

### e2e-screen-test

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| 変更 | `tests/e2e/account/authentication.spec.ts` | OTPフロー関連テストケース追加（送信成功、検証成功、コード不一致、試行超過、レート制限、直接アクセス防御） |

### e2e-section-test

変更なし（screen-testに含む）

### CSS実装

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| 変更 | `app/styles/layer2.css` | OTP入力フィールドのスタイル追加（必要に応じて） |
| 変更なし | `app/styles/layer3.ts`, `app/styles/layer4.ts` | 既存のフォームトークンで対応可能 |

### route

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| 変更 | `app/routes/login.tsx` | OTP送信intent（`send-otp`）の分岐処理をactionに追加。UI構造変更（Google OAuth → OTP送信フォーム → パスワードログインリンク） |
| **新規** | `app/routes/auth.otp.tsx` | OTP検証ページ。loader: 直接アクセス防御（email未指定/KVデータなし → /loginリダイレクト）。action: OTPコード検証 → ユーザーupsert → セッション生成 |

### components.test

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/components/account/authentication/OtpVerifyForm.test.tsx` | OtpVerifyFormのレンダリング、6桁コード入力、送信、エラー表示、再送信リンク、戻るリンクのテスト |

### components

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/components/account/authentication/OtpVerifyForm.tsx` | OTPコード検証フォーム。FormField×1（6桁コード、inputmode: numeric）、hidden email、Button、Link×2 |

### logic.test

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/lib/account/authentication/validateOtpFormat.test.ts` | 6桁数字の正常系、非数字、桁数不足/過多、空文字のテスト |
| 既存 | `app/lib/account/authentication/generateAuthToken.test.ts` | POC実装済み（変更不要） |

### logic

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/lib/account/authentication/validateOtpFormat.ts` | OTPコード形式バリデーション。パターン: `^\d{6}$` |
| 既存 | `app/lib/account/authentication/generateAuthToken.ts` | POC実装済み（変更不要） |

### data-io.test

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/data-io/account/authentication/saveOtpToken.server.test.ts` | KV保存のモックテスト（JSON形式、TTL: 10分） |
| **新規** | `app/data-io/account/authentication/verifyOtpToken.server.test.ts` | KV取得・照合のモックテスト（正常、不一致、期限切れ、試行超過） |
| **新規** | `app/data-io/account/authentication/upsertUserByEmail.server.test.ts` | 既存ユーザー返却 / 新規作成のモックテスト |
| **新規** | `app/data-io/account/authentication/checkOtpRateLimit.server.test.ts` | レート制限チェックのモックテスト（正常、上限到達） |

### data-io

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| **新規** | `app/data-io/account/authentication/saveOtpToken.server.ts` | KVにOTPデータをJSON保存 `{ code, email, attempts: 0 }`、TTL: 600秒 |
| **新規** | `app/data-io/account/authentication/verifyOtpToken.server.ts` | KVからOTPデータ取得 → コード照合 → attempts更新 / 削除 |
| **新規** | `app/data-io/account/authentication/upsertUserByEmail.server.ts` | メールでD1検索 → 存在すれば返却、なければINSERT |
| **新規** | `app/data-io/account/authentication/checkOtpRateLimit.server.ts` | KVでメール単位カウント管理（5分間に3回まで） |
| 既存 | `app/data-io/account/authentication/sendAuthEmail.server.ts` | POC実装済み（変更不要） |

### その他

| 対象 | パス | 内容 |
| :--- | :--- | :--- |
| 変更済み | `app/specs/account/authentication-spec.yaml` | OTP関連設定追加済み（Phase 2で反映完了） |
| 変更なし | `app/specs/account/types.ts` | 必要に応じてOTP関連型を追加（実装時に判断） |
| 変更なし | `app/specs/account/authentication-schema.ts` | 必要に応じてOTPバリデーションスキーマ追加（実装時に判断） |

### 実装順序

```text
1. data-io.test → data-io（副作用層から先に）
   - checkOtpRateLimit.server
   - saveOtpToken.server
   - verifyOtpToken.server
   - upsertUserByEmail.server

2. logic.test → logic（純粋ロジック層）
   - validateOtpFormat

3. components.test → components（UIコンポーネント）
   - OtpVerifyForm

4. route（ルート統合）
   - auth.otp.tsx（新規）
   - login.tsx（OTP送信intent追加 + UI変更）

5. e2e-screen-test（統合テスト）
   - authentication.spec.ts にOTPシナリオ追加
```
