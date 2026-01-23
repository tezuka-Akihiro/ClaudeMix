# Implementation Examples

このドキュメントは、Valibotスキーマの実装例と良い例/悪い例の対比を提供します。

## 完全な実装例

### authentication-schema.server.ts

```typescript
/**
 * Authentication Schema Layer (Valibot)
 *
 * このファイルは`app/specs/account/authentication-spec.yaml`から生成されます。
 * 手動編集は推奨されません。変更が必要な場合はSpec層を更新してください。
 */

import * as v from 'valibot';

// 一時的なハードコード（Spec読み込みユーティリティ実装後に削除）
const spec = {
  validation: {
    email: {
      error_messages: {
        required: 'メールアドレスを入力してください',
        invalid_format: '有効なメールアドレスを入力してください',
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

// 共通バリデーション
export const EmailSchema = v.pipe(
  v.string(spec.validation.email.error_messages.required),
  v.email(spec.validation.email.error_messages.invalid_format),
  v.maxLength(validationSpec.email.max_length, spec.validation.email.error_messages.invalid_format),
  v.regex(new RegExp(validationSpec.email.pattern), spec.validation.email.error_messages.invalid_format)
);

export const PasswordSchema = v.pipe(
  v.string(spec.validation.password.error_messages.required),
  v.minLength(validationSpec.password.min_length, spec.validation.password.error_messages.too_short),
  v.maxLength(validationSpec.password.max_length, spec.validation.password.error_messages.too_long),
  v.regex(new RegExp(validationSpec.password.pattern), spec.validation.password.error_messages.weak)
);

// Login Form Schema
export const LoginSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// Register Form Schema
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

// Forgot Password Form Schema
export const ForgotPasswordSchema = v.object({
  email: EmailSchema,
});

// 型抽出
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
export type RegisterFormData = v.InferOutput<typeof RegisterSchema>;
export type ForgotPasswordFormData = v.InferOutput<typeof ForgotPasswordSchema>;
```

---

## 良い例 / 悪い例

### ✅ 良い例: エラーメッセージの取得

```typescript
// Spec YAMLから取得
export const EmailSchema = v.pipe(
  v.string(spec.validation.email.error_messages.required),
  v.email(spec.validation.email.error_messages.invalid_format)
);
```

### ❌ 悪い例: ハードコーディング

```typescript
// 直接文字列を記述（禁止）
export const EmailSchema = v.pipe(
  v.string('メールアドレスを入力してください'),
  v.email('有効なメールアドレスを入力してください')
);
```

---

### ✅ 良い例: 型の自動生成

```typescript
// InferOutputで型を自動生成
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
```

### ❌ 悪い例: 手書き型

```typescript
// 手動で型を定義（禁止）
export type LoginFormData = {
  email: string;
  password: string;
};
```

---

### ✅ 良い例: .server.ts 拡張子

```typescript
// ファイル名: authentication-schema.server.ts
// クライアントバンドルから除外される
```

### ❌ 悪い例: 通常の拡張子

```typescript
// ファイル名: authentication-schema.ts
// クライアントバンドルに含まれる（Lighthouse score低下）
```

---

### ✅ 良い例: パスワード確認のバリデーション

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

### ❌ 悪い例: 不適切なバリデーション

```typescript
// passwordConfirmのバリデーションなし
export const RegisterSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
  passwordConfirm: v.string(), // 一致チェックなし
});
```

---

## Routeでの使用例

### ✅ 良い例: Action

```typescript
import { parseWithValibot } from '@conform-to/valibot';
import { LoginSchema } from '~/schemas/account/authentication-schema.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Conform + Valibot: Parse and validate
  const submission = parseWithValibot(formData, {
    schema: LoginSchema,
  });

  // Validation failed
  if (submission.status !== 'success') {
    return json(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  // Type-safe data extraction
  const { email, password } = submission.value;

  // ビジネスロジック
  // ...
}
```

### ❌ 悪い例: 手動バリデーション

```typescript
// Valibotを使わない手動バリデーション（非推奨）
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const fieldErrors = {};

  if (typeof email !== 'string' || !email) {
    fieldErrors.email = 'メールアドレスを入力してください';
  }

  if (typeof password !== 'string' || !password) {
    fieldErrors.password = 'パスワードを入力してください';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  // ...
}
```

---

## Componentでの使用例

### ✅ 良い例: useForm + getInputProps

```typescript
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';
import { LoginSchema } from '~/schemas/account/authentication-schema.server';

export default function Login() {
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <input
        {...getInputProps(fields.email, { type: 'email' })}
        placeholder="example@example.com"
      />
      {fields.email.errors && (
        <span id={fields.email.errorId} role="alert">
          {fields.email.errors}
        </span>
      )}
    </Form>
  );
}
```

### ❌ 悪い例: 手動属性設定

```typescript
// 手動でaria属性を設定（非推奨）
export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <input
        id="email"
        name="email"
        type="email"
        aria-invalid={actionData?.fieldErrors?.email ? true : undefined}
        aria-describedby={actionData?.fieldErrors?.email ? 'email-error' : undefined}
      />
      {actionData?.fieldErrors?.email && (
        <span id="email-error" role="alert">
          {actionData.fieldErrors.email}
        </span>
      )}
    </Form>
  );
}
```

---

## カスタムバリデーションの例

### 例: メールアドレスの重複チェック（非同期）

```typescript
// TODO: 将来実装
// 現在は同期バリデーションのみサポート
```

---

## 参照ドキュメント

- [Schema Structure](./schema-structure.md)
- [Troubleshooting](./troubleshooting.md)
- [Valibot + Conform Guide](../../../docs/boilerplate_architecture/VALIBOT_CONFORM_GUIDE.md)
- [Migration Guide](../../../docs/boilerplate_architecture/VALIBOT_CONFORM_MIGRATION_GUIDE.md)
