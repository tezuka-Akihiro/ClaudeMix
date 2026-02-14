# file-list.md - profile Section

このドキュメントは、profileセクションの実装に必要な**すべてのファイル**を3大層分離アーキテクチャに基づいてリストアップします。

---

## 1. E2Eテスト (Phase 1)

| ファイル名 | パス |
| :--- | :--- |
| profile.spec.ts | tests/e2e/account/profile.spec.ts |

**テストケース**:

- プロフィール表示の成功シナリオ
- メールアドレス変更の成功シナリオ
- メールアドレス重複時のエラー表示
- パスワード変更の成功シナリオ
- パスワード変更後のセッション再生成確認
- アカウント削除の成功シナリオ

---

## 2. UI層 (Phase 3)

### 2.1 Routes

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| account.settings.tsx | app/routes/account.settings.tsx | プロフィール設定ページのRoute定義（loader, action） |
| account.settings.test.tsx | app/routes/account.settings.test.tsx | settingsルートの単体テスト |

### 2.2 Components

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| ProfileDisplay.tsx | app/components/account/profile/ProfileDisplay.tsx | プロフィール情報表示コンポーネント |
| ProfileDisplay.test.tsx | app/components/account/profile/ProfileDisplay.test.tsx | ProfileDisplayの単体テスト |
| EmailChangeForm.tsx | app/components/account/profile/EmailChangeForm.tsx | メールアドレス変更フォーム（共通Modalと組み合わせて使用） |
| EmailChangeForm.test.tsx | app/components/account/profile/EmailChangeForm.test.tsx | EmailChangeFormの単体テスト |
| PasswordChangeForm.tsx | app/components/account/profile/PasswordChangeForm.tsx | パスワード変更フォーム（共通Modalと組み合わせて使用） |
| PasswordChangeForm.test.tsx | app/components/account/profile/PasswordChangeForm.test.tsx | PasswordChangeFormの単体テスト |

**注**: アカウント削除確認は、ProfileDisplayコンポーネント内で共通Modal（app/components/account/common/Modal.tsx）を直接使用します。

---

## 3. 純粋ロジック層 (lib層、Phase 2.2)

### 3.1 バリデーション

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| validateEmailChange.ts | app/lib/account/profile/validateEmailChange.ts | メールアドレス変更フォームのバリデーション |
| validateEmailChange.test.ts | app/lib/account/profile/validateEmailChange.test.ts | validateEmailChangeの単体テスト |
| validatePasswordChange.ts | app/lib/account/profile/validatePasswordChange.ts | パスワード変更フォームのバリデーション |
| validatePasswordChange.test.ts | app/lib/account/profile/validatePasswordChange.test.ts | validatePasswordChangeの単体テスト |
| validateAccountDeletion.ts | app/lib/account/profile/validateAccountDeletion.ts | アカウント削除フォームのバリデーション |
| validateAccountDeletion.test.ts | app/lib/account/profile/validateAccountDeletion.test.ts | validateAccountDeletionの単体テスト |

---

## 4. 副作用層 (data-io層、Phase 2.1)

### 4.1 ユーザーデータ更新

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| updateUserEmail.server.ts | app/data-io/account/profile/updateUserEmail.server.ts | ユーザーのメールアドレスをDB更新 |
| updateUserEmail.server.test.ts | app/data-io/account/profile/updateUserEmail.server.test.ts | updateUserEmailの単体テスト（DBモック使用） |
| updateUserPassword.server.ts | app/data-io/account/profile/updateUserPassword.server.ts | ユーザーのパスワードをDB更新 |
| updateUserPassword.server.test.ts | app/data-io/account/profile/updateUserPassword.server.test.ts | updateUserPasswordの単体テスト（DBモック使用） |
| softDeleteUser.server.ts | app/data-io/account/profile/softDeleteUser.server.ts | ユーザーの論理削除（冬眠開始） |
| softDeleteUser.server.test.ts | app/data-io/account/profile/softDeleteUser.server.test.ts | softDeleteUserの単体テスト（DBモック使用） |
| restoreUser.server.ts | app/data-io/account/profile/restoreUser.server.ts | ユーザーの復旧（冬眠解除） |
| restoreUser.server.test.ts | app/data-io/account/profile/restoreUser.server.test.ts | restoreUserの単体テスト（DBモック使用） |
| purgeExpiredUsers.server.ts | app/data-io/account/profile/purgeExpiredUsers.server.ts | 冬眠期間超過ユーザーの物理削除 |
| purgeExpiredUsers.server.test.ts | app/data-io/account/profile/purgeExpiredUsers.server.test.ts | purgeExpiredUsersの単体テスト |

---

## 5. Scheduled Worker

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| scheduled.ts | app/scheduled.ts | Cloudflare Workers Cron Trigger エントリポイント |

---

## 依存関係サマリー

### Subscription セクションへの依存（アカウント削除時）

profileセクションの**アカウント削除機能**は、以下のsubscriptionセクションのファイルに依存します：

**Side Effects (data-io/subscription)**:

- `getSubscriptionByUserId.server.ts`: ユーザーのアクティブなサブスクリプション取得
- `cancelStripeSubscription.server.ts`: **Stripeでサブスクリプション停止（Customer保持）**（アカウント削除前に必須）
- `deleteSubscription.server.ts`: サブスクリプションレコードをDB削除（物理抹消バッチで使用）

**重要**: アカウント削除（論理削除）時、Stripeサブスクリプションを停止せずにユーザーを冬眠させると、課金が継続する重大な問題が発生します。必ず`cancelStripeSubscription.server`を呼び出してください。

### Authentication セクションへの依存

profileセクションは、以下のauthenticationセクションのファイルに依存します：

**Pure Logic (lib/authentication)**:

- `verifyPassword.ts`: パスワード検証
- `hashPassword.ts`: パスワードハッシュ化

**Side Effects (data-io/authentication)**:

- `findUserByEmail.server.ts`: ユーザー検索
- `checkEmailExists.server.ts`: メールアドレス重複チェック

### Common セクションへの依存

**Pure Logic (lib/common)**:

- `createSessionData.ts`: セッションデータの生成

**Side Effects (data-io/common)**:

- `saveSession.server.ts`: セッション保存
- `destroySession.server.ts`: セッション削除
- `deleteAllUserSessions.server.ts`: ユーザーのすべてのセッションを削除（パスワード変更、アカウント削除時に使用）

**UI Components (components/common)**:

- `FormField.tsx`: フォーム入力フィールド
- `Button.tsx`: ボタンコンポーネント
- `ErrorMessage.tsx`: エラーメッセージ表示
- `AccountLayout.tsx`: アカウントレイアウトコンテナ
- `Modal.tsx`: モーダルコンポーネント

**Specs**:

- `app/specs/account/common-spec.yaml`: セッション設定、バリデーションルール
- `app/specs/account/types.ts`: User, ValidationError型

---

## ファイル実装順序（TDD Workflow）

### Phase 1: プロフィール表示・編集（authenticationセクション完了後に実装可能）

1. **Phase 1-1**: E2Eテスト作成（`tests/e2e/account/profile.spec.ts`）- プロフィール表示、メールアドレス変更、パスワード変更のみ
2. **Phase 1-2**: data-io層（副作用層）の実装
   - updateUserEmail.server.ts
   - updateUserPassword.server.ts
3. **Phase 1-3**: lib層（純粋ロジック層）の実装
   - validateEmailChange.ts
   - validatePasswordChange.ts
4. **Phase 1-4**: Components実装
   - ProfileDisplay.tsx
   - EmailChangeForm.tsx
   - PasswordChangeForm.tsx
5. **Phase 1-5**: Routes実装
   - account.settings.tsx（アカウント削除機能を除く）

### Phase 2: アカウント削除と3フェーズ化（**subscriptionセクション完了後に実装**）

1. **Phase 2-1**: E2Eテスト更新（アカウント削除、復旧、物理抹消シナリオを追加）
2. **Phase 2-2**: data-io層の実装
   - softDeleteUser.server.ts
   - restoreUser.server.ts
   - purgeExpiredUsers.server.ts
3. **Phase 2-3**: Scheduled Workerの実装
   - app/scheduled.ts
4. **Phase 2-4**: lib層の実装
   - validateAccountDeletion.ts
5. **Phase 2-5**: ProfileDisplay更新（アカウント削除UI追加）
   - ProfileDisplay.tsxに、共通Modal（app/components/account/common/Modal.tsx）を使用したアカウント削除確認UIを追加
6. **Phase 2-6**: Routes更新
   - account.settings.tsx（アカウント削除actionの追加、復旧対応）

**重要**: Phase 2はsubscriptionセクションの`cancelStripeSubscription.server`と`deleteSubscription.server`に依存するため、subscriptionセクション実装後に着手してください。

---

**最終更新**: 2026-02-14
