# Schema Structure Documentation

このドキュメントは、生成されるValibotスキーマファイルの構造を詳細に説明します。

## ファイル構造

```typescript
/**
 * ヘッダーコメント
 */

import * as v from 'valibot';

// 共通バリデーションスキーマ（再利用可能）
export const EmailSchema = v.pipe(...);
export const PasswordSchema = v.pipe(...);

// フォーム固有スキーマ
export const LoginSchema = v.object({...});
export const RegisterSchema = v.pipe(...);

// 型エクスポート（InferOutput）
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
export type RegisterFormData = v.InferOutput<typeof RegisterSchema>;
```

## 共通バリデーションスキーマ

### EmailSchema

```typescript
export const EmailSchema = v.pipe(
  v.string(spec.validation.email.error_messages.required),
  v.email(spec.validation.email.error_messages.invalid_format),
  v.maxLength(validationSpec.email.max_length, spec.validation.email.error_messages.too_long),
  v.regex(new RegExp(validationSpec.email.pattern), spec.validation.email.error_messages.invalid_format)
);
```

### PasswordSchema

```typescript
export const PasswordSchema = v.pipe(
  v.string(spec.validation.password.error_messages.required),
  v.minLength(validationSpec.password.min_length, spec.validation.password.error_messages.too_short),
  v.maxLength(validationSpec.password.max_length, spec.validation.password.error_messages.too_long),
  v.regex(new RegExp(validationSpec.password.pattern), spec.validation.password.error_messages.weak)
);
```

## フォーム固有スキーマ

### シンプルなフォーム

```typescript
export const LoginSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});
```

### パスワード確認付きフォーム

```typescript
export const RegisterSchema = v.pipe(
  v.object({
    email: EmailSchema,
    password: PasswordSchema,
    passwordConfirm: v.string(spec.validation.password_confirm.error_messages.required),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['passwordConfirm']],
      (input) => input.password === input.passwordConfirm,
      spec.validation.password_confirm.error_messages.mismatch
    ),
    ['passwordConfirm']
  )
);
```

## 型エクスポート

```typescript
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
export type RegisterFormData = v.InferOutput<typeof RegisterSchema>;
export type ForgotPasswordFormData = v.InferOutput<typeof ForgotPasswordSchema>;
```

## 命名規則

- **スキーマ名**: `{FormName}Schema`（例: `LoginSchema`, `RegisterSchema`）
- **型名**: `{FormName}FormData`（例: `LoginFormData`, `RegisterFormData`）
- **ファイル名**: `{section}-schema.server.ts`（例: `authentication-schema.server.ts`）

## エラーメッセージの取得

**必須**: 全てのエラーメッセージはSpec YAMLから取得します。

```typescript
// ✅ 正しい
v.string(spec.validation.email.error_messages.required)

// ❌ 禁止
v.string('メールアドレスを入力してください')
```

## .server.ts 拡張子

**重要**: 必ず `.server.ts` 拡張子を使用してください。

- Remixはこの拡張子を持つファイルをサーバーサイド専用として認識します
- クライアントバンドルから自動的に除外されます
- Lighthouse 100点維持のために必須です
