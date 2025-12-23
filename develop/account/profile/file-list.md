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
| EmailChangeForm.tsx | app/components/account/profile/EmailChangeForm.tsx | メールアドレス変更フォーム（モーダル） |
| EmailChangeForm.test.tsx | app/components/account/profile/EmailChangeForm.test.tsx | EmailChangeFormの単体テスト |
| PasswordChangeForm.tsx | app/components/account/profile/PasswordChangeForm.tsx | パスワード変更フォーム（モーダル） |
| PasswordChangeForm.test.tsx | app/components/account/profile/PasswordChangeForm.test.tsx | PasswordChangeFormの単体テスト |
| DeleteAccountModal.tsx | app/components/account/profile/DeleteAccountModal.tsx | アカウント削除確認モーダル |
| DeleteAccountModal.test.tsx | app/components/account/profile/DeleteAccountModal.test.tsx | DeleteAccountModalの単体テスト |

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
| deleteUser.server.ts | app/data-io/account/profile/deleteUser.server.ts | ユーザーをDBから削除 |
| deleteUser.server.test.ts | app/data-io/account/profile/deleteUser.server.test.ts | deleteUserの単体テスト（DBモック使用） |
| deleteAllUserSessions.server.ts | app/data-io/account/profile/deleteAllUserSessions.server.ts | ユーザーのすべてのセッションを削除 |
| deleteAllUserSessions.server.test.ts | app/data-io/account/profile/deleteAllUserSessions.server.test.ts | deleteAllUserSessionsの単体テスト（KVモック使用） |

---

## 依存関係サマリー

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

**UI Components (components/common)**:
- `FormField.tsx`: フォーム入力フィールド
- `Button.tsx`: ボタンコンポーネント
- `ErrorMessage.tsx`: エラーメッセージ表示
- `AccountLayout.tsx`: アカウントレイアウトコンテナ

**Specs**:
- `app/specs/account/common-spec.yaml`: セッション設定、バリデーションルール
- `app/specs/account/types.ts`: User, ValidationError型

---

## ファイル実装順序（TDD Workflow）

1. **Phase 1**: E2Eテスト作成（`tests/e2e/account/profile.spec.ts`）
2. **Phase 2.1**: data-io層（副作用層）の実装
   - updateUserEmail.server.ts
   - updateUserPassword.server.ts
   - deleteUser.server.ts
   - deleteAllUserSessions.server.ts
3. **Phase 2.2**: lib層（純粋ロジック層）の実装
   - validateEmailChange.ts
   - validatePasswordChange.ts
   - validateAccountDeletion.ts
4. **Phase 3.1**: Components実装
   - ProfileDisplay.tsx
   - EmailChangeForm.tsx
   - PasswordChangeForm.tsx
   - DeleteAccountModal.tsx
5. **Phase 3.2**: Routes実装
   - account.settings.tsx

---

**最終更新**: 2025-12-23
