# profile - 機能設計書

## 📋 機能概要

### 機能名

Profile Management (プロフィール管理)

### 所属サービス

**account** の **profile** セクションに配置

### 機能の目的・価値

- **解決する課題**: ユーザーが自身のアカウント情報を安全に管理できる機能を提供する
- **提供する価値**:
  - プロフィール情報の表示・編集
  - メールアドレス変更
  - パスワード変更
  - アカウント削除（退会処理）
- **ビジネス効果**: ユーザー体験の向上、アカウント管理の透明性、セキュリティ強化

### 実装優先度

**MEDIUM** - `authentication`セクション完了後に実装（subscriptionは後回し可能）

## 🎯 機能要件

### 基本機能

#### 1. プロフィール表示 (Profile Display)

**URL**: `/account/settings`

**機能**:

- 現在のユーザー情報の表示
- 有効期限の表示（サブスクリプション契約時）
- サブスクリプション状態の表示

**表示データ**:

- メールアドレス
- 有効期限
- サブスクリプション状態（active/inactive/trial）

**処理フロー**:

1. セッション検証（AuthGuardで実行）
2. ユーザー情報取得
3. UI表示

#### 2. メールアドレス変更 (Email Change)

**URL**: `/account/settings/email` (モーダルまたは同一ページ)

**機能**:

- メールアドレスの変更
- 新しいメールアドレスのバリデーション
- 重複チェック
- 現在のパスワードによる本人確認

**入力データ**:

- 新しいメールアドレス
- 新しいメールアドレス（確認）
- 現在のパスワード（本人確認用）

**処理フロー**:

1. 入力バリデーション（メールアドレス一致確認を含む）
2. パスワード検証（本人確認）
3. 新しいメールアドレスの重複チェック
4. メールアドレス更新（D1 Database）
5. 成功メッセージ表示

**出力データ**:

- 成功時: 成功メッセージ + 更新されたユーザー情報
- 失敗時: エラーメッセージ

**エラーハンドリング**:

- メールアドレス不一致: 「メールアドレスが一致しません」
- メールアドレス重複: 「このメールアドレスは既に使用されています」
- パスワード不正: 「パスワードが正しくありません」
- バリデーション失敗: 各フィールドにエラーメッセージ表示

#### 3. パスワード変更 (Password Change)

**URL**: `/account/settings/password` (モーダルまたは同一ページ)

**機能**:

- パスワードの変更
- 現在のパスワードによる本人確認
- 新しいパスワードの強度チェック

**入力データ**:

- 現在のパスワード
- 新しいパスワード
- 新しいパスワード確認

**処理フロー**:

1. 入力バリデーション
2. 現在のパスワード検証
3. 新しいパスワードのハッシュ化
4. パスワード更新（D1 Database）
5. 既存セッションの削除（セキュリティ対策）
6. 新しいセッション生成
7. 成功メッセージ表示

**出力データ**:

- 成功時: 成功メッセージ + 新しいセッション
- 失敗時: エラーメッセージ

**エラーハンドリング**:

- 現在のパスワード不正: 「現在のパスワードが正しくありません」
- パスワード不一致: 「パスワードが一致しません」
- 弱いパスワード: 「パスワードは大文字、小文字、数字を含む必要があります」

**セキュリティ要件**:

- パスワード変更後、すべてのセッションを削除
- 新しいセッションを自動生成（ログアウトさせない）

#### 4. アカウント削除 (Account Deletion)

**URL**: `/account/settings/delete` (モーダル)

**機能**:

- アカウント削除（退会処理）
- パスワード確認による本人確認
- 削除前の確認ダイアログ

**入力データ**:

- 現在のパスワード（本人確認用）
- 削除確認チェックボックス
- 残存期間放棄確認チェックボックス（サブスクリプション期間中のみ）

**処理フロー**:

1. 削除確認ダイアログ表示
2. アクティブなサブスクリプションの確認（D1: subscriptionsテーブル）
3. サブスクリプション期間中の場合、強力な警告を表示（既存と同じ）
4. パスワード検証
5. サブスクリプションが存在する場合、Stripeサブスクリプション停止（`cancel_at_period_end = true` または即時停止。**Customer オブジェクトは削除しない**）
6. `users` テーブルの `deleted_at` に現在時刻を記録（**物理削除しない**）
7. すべてのセッション削除（Workers KV）
8. `/login`へリダイレクト + 「退会手続きを受け付けました。30日後にデータが完全に削除されます」メッセージ

**出力データ**:

- 成功時: セッション削除 + ログインページへリダイレクト
- 失敗時: エラーメッセージ

**エラーハンドリング**:

- パスワード不正: 「パスワードが正しくありません」
- 削除未確認: 「削除を確認してください」
- **Stripe解約失敗**: 「サブスクリプションの解約に失敗しました。再度お試しください」

**セキュリティ要件**:

- 「30日間の冬眠期間後にデータが完全削除される」ことを明示
- パスワード確認必須
- 論理削除後は全セッション破棄、ログイン拒否
- **Stripeサブスクリプションを停止（Customerは保持）してから論理削除を実行**（課金継続を防止）

**重要**: アカウント削除（論理削除）時に**Stripeサブスクリプションの停止**を必ず実行してください。これを怠ると、ユーザーが退会後も課金が継続する重大な問題が発生します。

#### 新規機能: 物理抹消バッチ処理

- Cloudflare Workers Scheduled Handler（Cron Trigger）として実装
- 実行間隔: 1日1回（深夜帯推奨）
- 処理内容:
  1. `SELECT * FROM users WHERE deleted_at < datetime('now', '-30 days')` でレコード取得
  2. 各ユーザーに対して Stripe Customer 削除（`stripe.customers.del(stripe_customer_id)`）
  3. D1: `DELETE FROM subscriptions WHERE user_id = ?`
  4. D1: `DELETE FROM users WHERE id = ?`
  5. 実行結果をログ出力（成功件数、失敗件数）
  6. 失敗時はアラート（将来的にメール通知等）

#### 新規機能: アカウント復旧（冬眠中のみ）

冬眠中ユーザーがログインを試みた際に、アカウントを復旧できる「優しい防衛」導線。

- **トリガー**: ログインページでメール/パスワードを入力し、該当ユーザーの `deleted_at` が非NULL
- **UI**: ログインフォーム上に専用メッセージ「このアカウントは退会手続き中です。復旧しますか？」+ 「アカウントを復旧する」ボタンを表示
- **復旧処理フロー**:
  1. パスワード検証（ログイン時に既に入力済み）
  2. `restoreUser.server`（`UPDATE users SET deleted_at = NULL WHERE id = ?`）
  3. セッション生成 → `/account` へリダイレクト
- **Stripeサブスクリプション**: 自動再開はしない。ユーザーが必要であれば `/account/subscription` から再契約

#### authentication セクションへの波及

1. **ログイン処理** — `findUserByEmail` で取得したユーザーの `deleted_at` が非NULLの場合、通常のログインを拒否。専用メッセージ「このアカウントは退会手続き中です。復旧しますか？」を表示し、復旧ボタン（intent=`restore-account`）を提供

2. **会員登録処理** — `checkEmailExists` で取得したメールアドレスの `deleted_at` が非NULLの場合、「退会手続き中のアカウントが存在します」メッセージを表示し、ログインページへの導線を提供（復旧はログインページから行う）

#### subscription セクションへの波及

- **Webhook処理** — `user_id` で検索してユーザーが物理削除済み（レコード不在）の場合、404ではなく200を返し「対象ユーザー不在」をログに記録する（べき等性の確保）

## 📂 app/components要件

### UI Components

#### 1. ProfileDisplay

**配置**: `app/components/account/profile/ProfileDisplay.tsx`

**責務**:

- プロフィール情報の表示
- 編集ボタンの配置

**主要なUI要素**:

- メールアドレス表示
- 有効期限表示（サブスクリプション契約情報に基づく）
- サブスクリプション状態表示
- 「メールアドレス変更」ボタン
- 「パスワード変更」ボタン
- 「アカウント削除」ボタン

#### 2. EmailChangeForm

**配置**: `app/components/account/profile/EmailChangeForm.tsx`

**責務**:

- メールアドレス変更フォームの表示
- バリデーションエラーの表示

**主要なUI要素**:

- 新しいメールアドレス入力（FormField使用）
- 現在のパスワード入力（FormField使用）
- 保存ボタン（Button使用）
- キャンセルボタン（Button使用）
- エラーメッセージ表示（ErrorMessage使用）

**状態管理**:

- フォーム送信中フラグ
- バリデーションエラー表示

#### 3. PasswordChangeForm

**配置**: `app/components/account/profile/PasswordChangeForm.tsx`

**責務**:

- パスワード変更フォームの表示
- バリデーションエラーの表示

**主要なUI要素**:

- 現在のパスワード入力（FormField使用）
- 新しいパスワード入力（FormField使用）
- 新しいパスワード確認入力（FormField使用）
- 保存ボタン（Button使用）
- キャンセルボタン（Button使用）
- エラーメッセージ表示（ErrorMessage使用）

**状態管理**:

- フォーム送信中フラグ
- バリデーションエラー表示

#### 4. アカウント削除UI（ProfileDisplay内でModalを使用）

**実装方式**: ProfileDisplayコンポーネント内で共通Modal（`app/components/account/common/Modal.tsx`）を使用

**責務**:

- アカウント削除確認UIの表示（共通Modalを使用）
- パスワード確認

**主要なUI要素**:

- 削除警告メッセージ
- パスワード入力（FormField (common) 使用）
- 削除確認チェックボックス
- 削除ボタン（Button (common) variant="danger"）
- キャンセルボタン（Button (common) variant="secondary"）

**状態管理**:

- モーダル開閉状態（ProfileDisplay内で管理）
- チェックボックス状態
- フォーム送信中フラグ

**注**: 共通化徹底型の設計により、セクション固有のモーダルコンポーネントは作成せず、ProfileDisplay内で共通Modalを直接使用します。

### Routes

#### 1. account.settings.tsx

**配置**: `app/routes/account.settings.tsx`

**責務**:

- プロフィール設定ページのRoute定義
- loader: ユーザー情報取得
- action: メールアドレス変更、パスワード変更、アカウント削除の処理

**loader処理**:

- セッション検証（AuthGuardで実行）
- ユーザー情報取得
- プロフィールデータ返却

**action処理**:

1. intent判定（email-change, password-change, delete-account）
2. 各intentに応じた処理実行
3. 成功/失敗レスポンス返却

## 🧠 純粋ロジック要件

### lib層の関数

#### 1. validateEmailChange

**配置**: `app/lib/account/profile/validateEmailChange.ts`

**責務**: メールアドレス変更フォームのバリデーション

**入力**:

- 新しいメールアドレス
- 現在のパスワード

**処理**:

- メール形式チェック
- 必須項目チェック
- 現在のメールアドレスと同じでないかチェック

**出力**: バリデーションエラーの配列

#### 2. validatePasswordChange

**配置**: `app/lib/account/profile/validatePasswordChange.ts`

**責務**: パスワード変更フォームのバリデーション

**入力**:

- 現在のパスワード
- 新しいパスワード
- 新しいパスワード確認

**処理**:

- パスワード強度チェック
- パスワード一致チェック
- 必須項目チェック
- 現在のパスワードと同じでないかチェック

**出力**: バリデーションエラーの配列

#### 3. validateAccountDeletion

**配置**: `app/lib/account/profile/validateAccountDeletion.ts`

**責務**: アカウント削除フォームのバリデーション

**入力**:

- 現在のパスワード
- 削除確認フラグ

**処理**:

- パスワード必須チェック
- 削除確認チェック

**出力**: バリデーションエラーの配列

## 🔌 副作用要件

### data-io層の関数

#### 1. updateUserEmail.server.ts

**配置**: `app/data-io/account/profile/updateUserEmail.server.ts`

**責務**: ユーザーのメールアドレスをDB更新

**入力**:

- ユーザーID
- 新しいメールアドレス

**処理**: D1 DatabaseでUPDATE文実行（email, updated_at）

**出力**: 更新されたUser型

#### 2. updateUserPassword.server.ts

**配置**: `app/data-io/account/profile/updateUserPassword.server.ts`

**責務**: ユーザーのパスワードをDB更新

**入力**:

- ユーザーID
- ハッシュ化された新しいパスワード

**処理**: D1 DatabaseでUPDATE文実行（password, updated_at）

**出力**: 更新されたUser型

#### 3. softDeleteUser.server.ts

**配置**: `app/data-io/account/profile/softDeleteUser.server.ts`

**責務**: ユーザーの論理削除（冬眠開始）

**入力**: ユーザーID

**処理**: D1 Databaseで `deleted_at` に現在時刻を記録

**出力**: void

#### 4. restoreUser.server.ts

**配置**: `app/data-io/account/profile/restoreUser.server.ts`

**責務**: ユーザーの復旧（冬眠解除）

**入力**: ユーザーID

**処理**: D1 Databaseで `deleted_at` を NULL に更新

**出力**: void

#### 5. purgeExpiredUsers.server.ts

**配置**: `app/data-io/account/profile/purgeExpiredUsers.server.ts`

**責務**: 冬眠期間超過ユーザーの物理削除

**入力**: なし（内部で30日前以前のデータを検索）

**処理**:

1. 対象ユーザー取得
2. Stripe Customer削除
3. `subscriptions` レコード物理削除
4. `users` レコード物理削除

**出力**: 処理結果サマリー（成功・失敗件数）

## 📊 データフロー

### メールアドレス変更フロー

ユーザー入力
    ↓
EmailChangeForm (UI)
    ↓
account.settings.tsx action
    ↓
validateEmailChange (lib) - バリデーション
    ↓
findUserByEmail.server (data-io/auth) - 現在のユーザー取得
    ↓
verifyPassword (lib/auth) - パスワード検証
    ↓
checkEmailExists.server (data-io/auth) - 重複チェック
    ↓
updateUserEmail.server (data-io) - DB更新
    ↓
成功メッセージ表示

### パスワード変更フロー

ユーザー入力
    ↓
PasswordChangeForm (UI)
    ↓
account.settings.tsx action
    ↓
validatePasswordChange (lib) - バリデーション
    ↓
findUserByEmail.server (data-io/auth) - 現在のユーザー取得
    ↓
verifyPassword (lib/auth) - 現在のパスワード検証
    ↓
hashPassword (lib/auth) - 新しいパスワードハッシュ化
    ↓
updateUserPassword.server (data-io) - DB更新
    ↓
deleteAllUserSessions.server (data-io/common) - 既存セッション削除
    ↓
createSessionData (lib/common) - 新しいセッション生成
    ↓
saveSession.server (data-io/common) - セッション保存
    ↓
成功メッセージ表示

### アカウント削除フロー（論理削除）

ユーザー入力
    ↓
ProfileDisplay + Modal (common) (UI)
    ↓
account.settings.tsx action
    ↓
validateAccountDeletion (lib) - バリデーション
    ↓
findUserByEmail.server (data-io/auth) - ユーザー取得
    ↓
verifyPassword (lib/auth) - パスワード検証
    ↓
Stripeサブスクリプション停止（Customer保持）
    ↓
softDeleteUser.server (data-io) - 論理削除（deleted_at記録）
    ↓
deleteAllUserSessions.server (data-io/common) - すべてのセッション削除
    ↓
Cookie無効化 + /login へリダイレクト（冬眠開始メッセージ）

## 🔒 セキュリティ要件

### 1. 本人確認

- **すべての変更操作にパスワード確認を要求**
- メールアドレス変更: 現在のパスワード必須
- パスワード変更: 現在のパスワード必須
- アカウント削除: 現在のパスワード必須

### 2. パスワード変更時のセッション管理

- **パスワード変更後、すべてのセッションを削除**
- 他のデバイスでのログインを無効化
- 変更を行った本人のセッションは再生成（ログアウトさせない）

### 3. アカウント削除の安全策

- **削除確認チェックボックス必須**
- パスワード確認必須
- 「30日間の冬眠期間後にデータが完全削除される」ことを明示

### 4. メールアドレス変更の検証

- **重複チェック必須**
- 形式バリデーション
- パスワード確認

## 🧪 テスト要件

### E2Eテスト

**配置**: `tests/e2e/account/profile.spec.ts`

**テストケース**:

- プロフィール表示の成功シナリオ
- メールアドレス変更の成功シナリオ
- メールアドレス重複時のエラー表示
- パスワード変更の成功シナリオ
- パスワード変更後のセッション再生成確認
- アカウント削除（論理削除）の成功シナリオ
- アカウント復旧の成功シナリオ
- 物理抹消バッチの動作確認
- パスワード不正時のエラー表示

### 単体テスト

各関数ごとにテストファイルを作成：

- `validateEmailChange.test.ts`
- `validatePasswordChange.test.ts`
- `validateAccountDeletion.test.ts`
- `updateUserEmail.server.test.ts`（DBモック使用）
- `updateUserPassword.server.test.ts`（DBモック使用）
- `softDeleteUser.server.test.ts`（DBモック使用）
- `restoreUser.server.test.ts`（DBモック使用）
- `purgeExpiredUsers.server.test.ts`（DBモック/Stripeモック使用）
- `deleteAllUserSessions.server.test.ts`（KVモック使用）

## 🚀 実装の優先順位

**Phase 1**: プロフィール表示・編集（authenticationセクション完了後に実装可能）

1. プロフィール表示（ProfileDisplay）
2. メールアドレス変更（EmailChangeForm）
3. パスワード変更（PasswordChangeForm）

**Phase 2**: アカウント削除（**subscriptionセクション完了後に実装**）

- アカウント削除機能（ProfileDisplay内で共通Modalを使用）
- **依存関係**: subscriptionセクションの`cancelStripeSubscription.server`、`deleteSubscription.server`に依存
- **理由**: アカウント削除時にStripeサブスクリプションを解約する必要があるため、subscriptionセクションの実装が先行必須

## 📝 備考

### 依存関係

- **authenticationセクションへの依存**:
  - findUserByEmail.server: ユーザー検索
  - verifyPassword: パスワード検証
  - hashPassword: パスワードハッシュ化
  - checkEmailExists.server: メールアドレス重複チェック

- **commonセクションへの依存**:
  - createSessionData: セッション生成
  - saveSession.server: セッション保存
  - destroySession.server: セッション削除
  - FormField, Button, ErrorMessage: 共通UIコンポーネント

### 外部ライブラリ

- **bcrypt**: パスワードハッシュ化（authenticationセクションで既に導入済み）

### UI/UX考慮事項

- **モーダルまたは同一ページ**: メールアドレス変更、パスワード変更をモーダルで実装するか、別ページで実装するかは実装時に決定
- **削除確認**: アカウント削除は必ずモーダルで確認ダイアログを表示

---

**最終更新**: 2026-02-14
