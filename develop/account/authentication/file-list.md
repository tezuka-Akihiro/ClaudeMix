# file-list.md - authentication Section

このドキュメントは、authenticationセクションの実装に必要な**すべてのファイル**を3大層分離アーキテクチャに基づいてリストアップします。

---

## 1. E2Eテスト (Phase 1)

| ファイル名 | パス |
| :--- | :--- |
| authentication.spec.ts | tests/e2e/account/authentication.spec.ts |

**テストケース**:

- 会員登録の成功シナリオ
- メールアドレス重複時のエラー表示
- ログインの成功シナリオ
- 認証失敗時のエラー表示
- ログアウトの成功シナリオ
- redirect-urlパラメータの動作確認
- Google OAuth認証の成功シナリオ
- Google OAuth CSRF検証失敗時のエラー表示

---

## 2. UI層 (Phase 3)

### 2.1 Routes

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| register.tsx | app/routes/register.tsx | 会員登録ページのRoute定義（loader, action） |
| register.test.tsx | app/routes/register.test.tsx | registerルートの単体テスト |
| login.tsx | app/routes/login.tsx | ログインページのRoute定義（loader, action） |
| login.test.tsx | app/routes/login.test.tsx | loginルートの単体テスト |
| logout.tsx | app/routes/logout.tsx | ログアウト処理専用Route（actionのみ） |
| logout.test.tsx | app/routes/logout.test.tsx | logoutルートの単体テスト |
| forgot-password.tsx | app/routes/forgot-password.tsx | パスワードリセットメール送信ページのRoute定義（loader, action） |
| forgot-password.test.tsx | app/routes/forgot-password.test.tsx | forgot-passwordルートの単体テスト |
| reset-password.$token.tsx | app/routes/reset-password.$token.tsx | パスワードリセット実行ページのRoute定義（loader, action） |
| reset-password.$token.test.tsx | app/routes/reset-password.$token.test.tsx | reset-passwordルートの単体テスト |
| auth.google.tsx | app/routes/auth.google.tsx | Google OAuth認証開始（state生成、リダイレクト） |
| auth.callback.google.tsx | app/routes/auth.callback.google.tsx | Google OAuthコールバック処理（CSRF検証、ユーザー作成/ログイン） |

### 2.2 Components

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| RegisterForm.tsx | app/components/account/authentication/RegisterForm.tsx | 会員登録フォームコンポーネント |
| RegisterForm.test.tsx | app/components/account/authentication/RegisterForm.test.tsx | RegisterFormの単体テスト |
| LoginForm.tsx | app/components/account/authentication/LoginForm.tsx | ログインフォームコンポーネント |
| LoginForm.test.tsx | app/components/account/authentication/LoginForm.test.tsx | LoginFormの単体テスト |
| ForgotPasswordForm.tsx | app/components/account/authentication/ForgotPasswordForm.tsx | パスワードリセットメール送信フォームコンポーネント |
| ForgotPasswordForm.test.tsx | app/components/account/authentication/ForgotPasswordForm.test.tsx | ForgotPasswordFormの単体テスト |
| ResetPasswordForm.tsx | app/components/account/authentication/ResetPasswordForm.tsx | パスワードリセット実行フォームコンポーネント |
| ResetPasswordForm.test.tsx | app/components/account/authentication/ResetPasswordForm.test.tsx | ResetPasswordFormの単体テスト |

---

## 3. 純粋ロジック層 (lib層、Phase 2.2)

### 3.1 パスワード処理

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| hashPassword.ts | app/lib/account/authentication/hashPassword.ts | パスワードのハッシュ化（bcrypt） |
| hashPassword.test.ts | app/lib/account/authentication/hashPassword.test.ts | hashPasswordの単体テスト |
| verifyPassword.ts | app/lib/account/authentication/verifyPassword.ts | パスワードの検証（bcrypt.compare） |
| verifyPassword.test.ts | app/lib/account/authentication/verifyPassword.test.ts | verifyPasswordの単体テスト |

### 3.2 バリデーション

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| validateRegistration.ts | app/lib/account/authentication/validateRegistration.ts | 会員登録フォームのバリデーション |
| validateRegistration.test.ts | app/lib/account/authentication/validateRegistration.test.ts | validateRegistrationの単体テスト |
| validateLogin.ts | app/lib/account/authentication/validateLogin.ts | ログインフォームのバリデーション |
| validateLogin.test.ts | app/lib/account/authentication/validateLogin.test.ts | validateLoginの単体テスト |

---

## 4. 副作用層 (data-io層、Phase 2.1)

### 4.1 ユーザーデータ操作

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| createUser.server.ts | app/data-io/account/authentication/createUser.server.ts | 新規ユーザーのDB登録（D1 Database） |
| createUser.server.test.ts | app/data-io/account/authentication/createUser.server.test.ts | createUserの単体テスト（DBモック使用） |
| findUserByEmail.server.ts | app/data-io/account/authentication/findUserByEmail.server.ts | メールアドレスでユーザー検索 |
| findUserByEmail.server.test.ts | app/data-io/account/authentication/findUserByEmail.server.test.ts | findUserByEmailの単体テスト（DBモック使用） |
| checkEmailExists.server.ts | app/data-io/account/authentication/checkEmailExists.server.ts | メールアドレスの存在確認 |
| checkEmailExists.server.test.ts | app/data-io/account/authentication/checkEmailExists.server.test.ts | checkEmailExistsの単体テスト（DBモック使用） |

### 4.2 OAuth認証

| ファイル名 | パス | 責務 |
| :--- | :--- | :--- |
| exchangeGoogleCode.server.ts | app/data-io/account/authentication/exchangeGoogleCode.server.ts | Google認可コードをトークンに交換しユーザー情報を取得 |
| getUserByOAuth.server.ts | app/data-io/account/authentication/getUserByOAuth.server.ts | OAuthプロバイダーとIDでユーザー検索 |
| createOAuthUser.server.ts | app/data-io/account/authentication/createOAuthUser.server.ts | OAuthユーザーの新規登録 |

---

## 依存関係サマリー

### Common セクションへの依存

authenticationセクションは、以下のcommonセクションのファイルに依存します：

**Pure Logic (lib/common)**:

- `createSessionData.ts`: セッションデータの生成
- `validateSession.ts`: セッション検証

**Side Effects (data-io/common)**:

- `getSession.server.ts`: セッション取得
- `saveSession.server.ts`: セッション保存
- `destroySession.server.ts`: セッション削除
- `getUserById.server.ts`: ユーザー情報取得

**UI Components (components/common)**:

- `FormField.tsx`: フォーム入力フィールド
- `Button.tsx`: ボタンコンポーネント
- `ErrorMessage.tsx`: エラーメッセージ表示

**Specs**:

- `app/specs/account/common-spec.yaml`: セッション設定、バリデーションルール、セキュリティ設定
- `app/specs/account/types.ts`: User, SessionData, FormFieldProps, ButtonProps, ErrorMessageProps

---

## ファイル実装順序（TDD Workflow）

1. **Phase 1**: E2Eテスト作成（`tests/e2e/section/account/authentication.spec.ts`）
2. **Phase 2.1**: data-io層（副作用層）の実装
   - createUser.server.ts
   - findUserByEmail.server.ts
   - checkEmailExists.server.ts
3. **Phase 2.2**: lib層（純粋ロジック層）の実装
   - hashPassword.ts
   - verifyPassword.ts
   - validateRegistration.ts
   - validateLogin.ts
4. **Phase 3.1**: Components実装
   - RegisterForm.tsx
   - LoginForm.tsx
5. **Phase 3.2**: Routes実装
   - register.tsx
   - login.tsx
   - logout.tsx

---

**最終更新**: 2026-02-03
