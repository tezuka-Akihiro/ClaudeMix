# Valibot + Conform 移行ガイド

## 🎯 目的

このガイドは、既存の手動バリデーションフォームを Valibot + Conform に移行するための実践的な手順とパターンを提供します。

---

## 📋 移行前のチェックリスト

### 必須確認事項

- [ ] 対象フォームのSpec YAML が完成している
- [ ] バリデーションルールが `validation` セクションに定義されている
- [ ] エラーメッセージが YAML に記載されている
- [ ] フォームフィールドが `forms.{form_name}.fields` に定義されている

### パッケージインストール

```bash
npm install valibot @conform-to/react @conform-to/valibot
```

---

## 🔄 移行手順（Step by Step）

### ステップ1: Schema層の生成

#### 1.1 Spec YAML の確認

```yaml
# app/specs/account/authentication-spec.yaml
forms:
  login:
    fields:
      email:
        name: "email"
        label: "メールアドレス"
        type: "email"
        required: true
      password:
        name: "password"
        label: "パスワード"
        type: "password"
        required: true

validation:
  email:
    error_messages:
      required: "メールアドレスを入力してください"
      invalid_format: "有効なメールアドレスを入力してください"
  password:
    error_messages:
      required: "パスワードを入力してください"
      too_short: "パスワードは8文字以上で入力してください"
```

#### 1.2 Schema ファイルの作成

`app/schemas/{service}/{section}-schema.server.ts` を作成します。

**重要**: 必ず `.server.ts` 拡張子を使用してください（Tree-shaking）。

```typescript
// app/schemas/account/authentication-schema.server.ts
import * as v from 'valibot';

// 共通バリデーション
export const EmailSchema = v.pipe(
  v.string('メールアドレスを入力してください'),
  v.email('有効なメールアドレスを入力してください'),
  v.maxLength(254, '有効なメールアドレスを入力してください')
);

export const PasswordSchema = v.pipe(
  v.string('パスワードを入力してください'),
  v.minLength(8, 'パスワードは8文字以上で入力してください'),
  v.maxLength(128, 'パスワードは128文字以下で入力してください')
);

// Login Form Schema
export const LoginSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// 型抽出
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
```

---

### ステップ2: Route層のAction移行

#### 2.1 インポートの追加

```typescript
// Before
import { Form, useActionData } from '@remix-run/react';

// After
import { Form, useActionData } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';
import { LoginSchema } from '~/schemas/account/authentication-schema.server';
```

#### 2.2 ActionData型の更新

```typescript
// Before
interface ActionData {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}

// After
interface ActionData {
  error?: string;
  lastResult?: any; // Conform submission result
}
```

#### 2.3 Action関数の移行

**Before（手動バリデーション）**:

```typescript
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const fieldErrors: ActionData['fieldErrors'] = {};

  // 手動バリデーション
  if (typeof email !== 'string' || !email) {
    fieldErrors.email = 'メールアドレスを入力してください';
  } else if (!validateEmail(email)) {
    fieldErrors.email = '有効なメールアドレスを入力してください';
  }

  if (typeof password !== 'string' || !password) {
    fieldErrors.password = 'パスワードを入力してください';
  }

  // エラーチェック
  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  // ビジネスロジック
  // ...
}
```

**After（Valibot + Conform）**:

```typescript
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Conform + Valibot: Parse and validate
  const submission = parseWithValibot(formData, {
    schema: LoginSchema,
  });

  // Validation failed
  if (submission.status !== 'success') {
    return json<ActionData>(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  // Type-safe data extraction
  const { email, password } = submission.value;

  // ビジネスロジック（型安全）
  // ...
}
```

**主な変更点**:

1. `parseWithValibot` でバリデーション実行
2. `submission.status` で成功/失敗を判定
3. `submission.reply()` でエラーを返す
4. `submission.value` で型安全なデータ取得

---

### ステップ3: Component層の移行

#### 3.1 useForm の追加

```typescript
export default function Login() {
  const actionData = useActionData<typeof action>();

  // Conform: Form state management
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginSchema });
    },
    shouldValidate: 'onBlur',      // Blur時にバリデーション
    shouldRevalidate: 'onInput',   // Input時に再バリデーション
  });

  // ...
}
```

#### 3.2 Form要素の更新

**Before**:

```tsx
<Form method="post" className="auth-form-structure">
  {/* ... */}
</Form>
```

**After**:

```tsx
<Form method="post" className="auth-form-structure" {...getFormProps(form)}>
  {/* ... */}
</Form>
```

#### 3.3 Input要素の移行

**Before（手動属性設定）**:

```tsx
<div className="form-field-structure">
  <label htmlFor="email">メールアドレス</label>
  <input
    className="form-field__input"
    id="email"
    name="email"
    type="email"
    placeholder="example@example.com"
    autoComplete="email"
    required
    aria-invalid={actionData?.fieldErrors?.email ? true : undefined}
    aria-describedby={actionData?.fieldErrors?.email ? 'email-error' : undefined}
    data-testid="email-input"
  />
  {actionData?.fieldErrors?.email && (
    <span id="email-error" className="error-message-structure" role="alert">
      {actionData.fieldErrors.email}
    </span>
  )}
</div>
```

**After（getInputProps）**:

```tsx
<div className="form-field-structure">
  <label htmlFor={fields.email.id}>メールアドレス</label>
  <input
    {...getInputProps(fields.email, { type: 'email' })}
    className="form-field__input"
    placeholder="example@example.com"
    autoComplete="email"
    data-testid="email-input"
  />
  {fields.email.errors && (
    <span id={fields.email.errorId} className="error-message-structure" role="alert">
      {fields.email.errors}
    </span>
  )}
</div>
```

**主な変更点**:

1. `{...getInputProps(fields.email, { type: 'email' })}` で属性自動生成
   - `id`, `name`, `required`, `aria-invalid`, `aria-describedby` が自動設定
2. `fields.email.id` でID取得
3. `fields.email.errors` でエラーメッセージ取得
4. `fields.email.errorId` でエラー要素のID取得

---

## 📊 移行パターン比較表

| 項目 | Before（手動） | After（Conform + Valibot） |
|------|---------------|---------------------------|
| **バリデーション実行** | `if (typeof email !== 'string')` | `parseWithValibot(formData, { schema })` |
| **エラー判定** | `Object.keys(fieldErrors).length > 0` | `submission.status !== 'success'` |
| **エラー返却** | `json({ fieldErrors }, { status: 400 })` | `json({ lastResult: submission.reply() })` |
| **データ取得** | `formData.get('email')` (any型) | `submission.value.email` (型安全) |
| **フォーム状態** | `useActionData()` のみ | `useForm({ lastResult })` |
| **Input属性** | 手動設定（13行） | `getInputProps()` (1行) |
| **ARIA属性** | 手動設定 | 自動生成 |
| **型安全性** | なし | あり（InferOutput） |

---

## 🎓 ベストプラクティス

### DO（推奨）

✅ **常に `.server.ts` 拡張子を使用**
- クライアントバンドルに含めない

✅ **`InferOutput` で型を生成**
- 手書き型は禁止

```typescript
// ✅ 推奨
export type LoginFormData = v.InferOutput<typeof LoginSchema>;

// ❌ 禁止
export type LoginFormData = { email: string; password: string };
```

✅ **`shouldValidate` と `shouldRevalidate` を設定**
- ユーザー体験向上

```typescript
useForm({
  shouldValidate: 'onBlur',      // Blur時
  shouldRevalidate: 'onInput',   // Input時
});
```

✅ **エラーメッセージはSpec YAMLから**
- ハードコーディング禁止

```typescript
// ✅ 推奨
v.string(spec.validation.email.error_messages.required)

// ❌ 禁止
v.string('メールアドレスを入力してください')
```

### DON'T（非推奨）

❌ **クライアントサイドにValibotをインポート**
```typescript
// ❌ 禁止（クライアントバンドルに含まれる）
// app/components/LoginForm.tsx
import { LoginSchema } from '~/schemas/account/authentication-schema.server';
```

❌ **useState でフォーム状態を管理**
```typescript
// ❌ 禁止
const [email, setEmail] = useState('');

// ✅ 推奨
const [form, fields] = useForm({ ... });
```

❌ **手動で aria-* 属性を設定**
```typescript
// ❌ 禁止
<input aria-invalid={error ? true : undefined} />

// ✅ 推奨
<input {...getInputProps(fields.email, { type: 'email' })} />
```

---

## 🔍 トラブルシューティング

### エラー: "Module not found: valibot"

**原因**: `.server.ts` でないファイルにValibotをインポート

**解決**:
- Schemaファイルを `.server.ts` に変更
- クライアントコンポーネントからインポートしない

### エラー: "submission.value is undefined"

**原因**: バリデーション成功を確認せずに `submission.value` にアクセス

**解決**:
```typescript
// ✅ 正しい
if (submission.status !== 'success') {
  return json({ lastResult: submission.reply() });
}
const { email, password } = submission.value; // 型安全

// ❌ 間違い
const { email, password } = submission.value; // undefinedの可能性
```

### エラー: "fields.email.errors is undefined"

**原因**: `lastResult` を `useForm` に渡していない

**解決**:
```typescript
const [form, fields] = useForm({
  lastResult: actionData?.lastResult, // 必須
  // ...
});
```

---

## 📚 移行チェックリスト

フォーム移行時にこのチェックリストを使用してください：

### Schema層

- [ ] `app/schemas/{service}/{section}-schema.server.ts` を作成
- [ ] `.server.ts` 拡張子を使用
- [ ] 共通バリデーション（EmailSchema等）を定義
- [ ] フォーム固有スキーマを定義
- [ ] `InferOutput` で型をエクスポート
- [ ] エラーメッセージをSpec YAMLから取得

### Action層

- [ ] `parseWithValibot` をインポート
- [ ] Schemaをインポート（`.server.ts`）
- [ ] `ActionData` に `lastResult` を追加
- [ ] `parseWithValibot` でバリデーション実行
- [ ] `submission.status` で成功判定
- [ ] `submission.reply()` でエラー返却
- [ ] `submission.value` で型安全なデータ取得

### Component層

- [ ] `useForm`, `getFormProps`, `getInputProps` をインポート
- [ ] `useForm` でフォーム状態管理
- [ ] `lastResult` を渡す
- [ ] `onValidate` を設定
- [ ] `shouldValidate`, `shouldRevalidate` を設定
- [ ] `getFormProps(form)` でフォーム属性設定
- [ ] 各inputで `getInputProps(fields.{name})` 使用
- [ ] `fields.{name}.errors` でエラー表示
- [ ] `fields.{name}.errorId` でaria連携

### テスト

- [ ] E2Eテストが通過する
- [ ] バリデーションエラーが正しく表示される
- [ ] ARIA属性が正しく設定される
- [ ] 型エラーがない

---

## 🚀 次のステップ

### フェーズ1完了後

1. 他の認証フォームの移行
   - Register Form
   - Forgot Password Form
2. プロフィールフォームの移行
   - Email Change Modal
   - Password Change Modal
   - Delete Account Modal

### 今後の改善

1. Schema生成の完全自動化
   - Skill による自動生成
   - YAML → Schema 変換ツール
2. より高度なバリデーション
   - 非同期バリデーション（メール重複チェック等）
   - カスタムバリデーター
3. パフォーマンス最適化
   - デバウンス設定
   - 部分的バリデーション

---

## 📖 関連ドキュメント

- [Valibot + Conform 開発フローガイド](./VALIBOT_CONFORM_GUIDE.md)
- [開発フロー簡略図](./開発フロー簡略図.md)
- [YAML参照ガイド](./YAML_REFERENCE_GUIDE.md)
- [Skills ガイド](../../content/blog/posts/skills-guide.md)

---

## 更新履歴

- 2026-01-23: 初版作成（Login Form PoC完了後）
