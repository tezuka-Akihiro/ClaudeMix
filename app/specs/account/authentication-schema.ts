/**
 * Authentication Schema Layer (Valibot)
 *
 * このファイルは`app/specs/account/authentication-spec.yaml`から生成されます。
 * 手動編集は推奨されません。変更が必要な場合はSpec層を更新してください。
 *
 * 責務:
 * - クライアント・サーバー両方で使用可能なバリデーションスキーマ
 * - Spec層の制約をValibotスキーマとして実装
 * - 型安全性を提供（InferOutput）
 *
 * 注意: このファイルはConform/Valibotのクライアントサイドバリデーションでも
 * 使用されるため、`.server.ts`拡張子は使用していません。
 */

import * as v from 'valibot';

// TODO: Spec読み込みユーティリティの実装
// import { getSpec } from '~/utils/spec-loader.server';
// import type { AuthenticationSpec } from '~/specs/account/authentication-spec';
// import type { ValidationSpec } from '~/specs/shared/validation-spec';

// 一時的なハードコード（Spec読み込みユーティリティ実装後に削除）
const authSpec = {
  validation: {
    email: {
      error_messages: {
        required: 'メールアドレスを入力してください',
        invalid_format: '有効なメールアドレスを入力してください',
        already_exists: 'このメールアドレスは既に登録されています',
      },
    },
    password: {
      error_messages: {
        required: 'パスワードを入力してください',
        too_short: 'パスワードは8文字以上で入力してください',
        too_long: 'パスワードは128文字以下で入力してください',
        weak: 'パスワードは大文字、小文字、数字を含む必要があります',
      },
    },
    password_confirm: {
      error_messages: {
        required: 'パスワード確認を入力してください',
        mismatch: 'パスワードが一致しません',
      },
    },
  },
};

const validationSpec = {
  email: {
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    max_length: 254,
  },
  password: {
    min_length: 8,
    max_length: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
  },
};

// ==========================================
// 共通バリデーション（再利用可能）
// ==========================================

/**
 * Email Validation Schema
 *
 * Shared/validation-spec.yamlとauthentication-spec.yamlの
 * バリデーションルールを組み合わせています。
 */
export const EmailSchema = v.pipe(
  v.string(authSpec.validation.email.error_messages.required),
  v.email(authSpec.validation.email.error_messages.invalid_format),
  v.maxLength(
    validationSpec.email.max_length,
    authSpec.validation.email.error_messages.invalid_format
  ),
  v.regex(
    new RegExp(validationSpec.email.pattern),
    authSpec.validation.email.error_messages.invalid_format
  )
);

/**
 * Password Validation Schema
 *
 * Shared/validation-spec.yamlとauthentication-spec.yamlの
 * バリデーションルールを組み合わせています。
 */
export const PasswordSchema = v.pipe(
  v.string(authSpec.validation.password.error_messages.required),
  v.minLength(
    validationSpec.password.min_length,
    authSpec.validation.password.error_messages.too_short
  ),
  v.maxLength(
    validationSpec.password.max_length,
    authSpec.validation.password.error_messages.too_long
  ),
  v.regex(
    new RegExp(validationSpec.password.pattern),
    authSpec.validation.password.error_messages.weak
  )
);

// ==========================================
// Form Schemas
// ==========================================

/**
 * Login Form Schema
 *
 * 対応するYAML: forms.login
 * Fields: email, password
 */
export const LoginSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});

/**
 * Register Form Schema
 *
 * 対応するYAML: forms.register
 * Fields: email, password, passwordConfirm
 *
 * パスワード確認の一致チェックを含みます。
 */
export const RegisterSchema = v.pipe(
  v.object({
    email: EmailSchema,
    password: PasswordSchema,
    passwordConfirm: v.string(
      authSpec.validation.password_confirm.error_messages.required
    ),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['passwordConfirm']],
      (input) => input.password === input.passwordConfirm,
      authSpec.validation.password_confirm.error_messages.mismatch
    ),
    ['passwordConfirm']
  )
);

/**
 * Forgot Password Form Schema
 *
 * 対応するYAML: forms.forgot_password
 * Fields: email
 */
export const ForgotPasswordSchema = v.object({
  email: EmailSchema,
});

// ==========================================
// 型抽出（InferOutput）
// ==========================================

/**
 * 型は手書きせず、Valibotの InferOutput から自動抽出します。
 * これにより、スキーマと型の乖離をゼロにします。
 */

export type LoginFormData = v.InferOutput<typeof LoginSchema>;
export type RegisterFormData = v.InferOutput<typeof RegisterSchema>;
export type ForgotPasswordFormData = v.InferOutput<typeof ForgotPasswordSchema>;
