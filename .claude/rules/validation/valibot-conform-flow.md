---
paths:
  - "app/specs/**/*-spec.yaml"
  - "app/specs/**/*-schema.server.ts"
  - "app/routes/**/*"
---

# Valibot + Conform 開発フローガイド

このルールは、フォームバリデーションに関わるすべてのファイル（Spec, Schema, Route）に適用されます。

## 核心思想

このプロジェクトは「5〜10年死なない」プロダクトを築くための「延命拠点の防衛構造」を採用しています。Valibot（バリデーション）とConform（フォーム状態管理）を用いて、**Spec層 → Schema層 → Route層**の片道切符フローを実現します。

---

## 3レイヤー構造（Single Source of Truth）

開発は必ず以下の「上流から下流へ」の片道切符で行い、不自然な二重管理を禁止します。

```
Spec層 (意思) → Schema層 (防衛) → Route層 (配線)
   YAML            Valibot          Conform
```

---

## Layer 1: Spec層 (意思)

**適用ファイル**: `app/specs/{service}/{section}-spec.yaml`

### 責務

- 全ての仕様、制約（constraints）、エラーメッセージの唯一の正解（SSOT）
- フォームフィールドの定義、バリデーションルール、UIテキスト

### 絶対ルール

- ✅ コードを変更する前に、必ずこのYAMLを更新すること
- ✅ バリデーションルールはここに集約
- ❌ コード内に直接エラーメッセージを書くことは禁止

### 正しい実装例

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
        validation:
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          max_length: 254
          error_messages:
            required: "メールアドレスを入力してください"
            invalid_format: "有効なメールアドレスを入力してください"
            too_long: "メールアドレスは254文字以内で入力してください"
      password:
        name: "password"
        label: "パスワード"
        type: "password"
        required: true
        validation:
          min_length: 8
          max_length: 128
          error_messages:
            required: "パスワードを入力してください"
            too_short: "パスワードは8文字以上で入力してください"
            too_long: "パスワードは128文字以内で入力してください"
```

---

## Layer 2: Schema層 (防衛)

**適用ファイル**: `app/specs/{service}/{section}-schema.server.ts`

### 責務

- Valibotを用いた物理的な検問所
- Spec層から自動生成される型安全なスキーマ
- サーバーサイドバリデーションの実装

### 絶対ルール

- ✅ Spec層からAIまたはジェネレーターによって自動生成される
- ✅ 必ず `.server.ts` として隔離し、Cloudflare Pagesのバンドルサイズを最小化（Tree-shaking徹底）
- ❌ **手書き禁止**（自動生成ツールを使用すること）
- ❌ クライアントバンドルに含めない（`.server.ts` 拡張子を必ず使用）

### 正しい実装例

```typescript
// app/specs/account/authentication-schema.server.ts
import * as v from 'valibot';
import type { AuthenticationSpec } from '~/specs/account/authentication-spec';

// Spec層から型を取得
const spec: AuthenticationSpec = /* load from YAML */;

// Valibotスキーマの生成
export const LoginSchema = v.object({
  email: v.pipe(
    v.string(spec.forms.login.fields.email.validation.error_messages.required),
    v.email(spec.forms.login.fields.email.validation.error_messages.invalid_format),
    v.maxLength(
      spec.forms.login.fields.email.validation.max_length,
      spec.forms.login.fields.email.validation.error_messages.too_long
    )
  ),
  password: v.pipe(
    v.string(spec.forms.login.fields.password.validation.error_messages.required),
    v.minLength(
      spec.forms.login.fields.password.validation.min_length,
      spec.forms.login.fields.password.validation.error_messages.too_short
    ),
    v.maxLength(
      spec.forms.login.fields.password.validation.max_length,
      spec.forms.login.fields.password.validation.error_messages.too_long
    )
  ),
});

// 型の自動抽出（InferOutput）
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
```

### 重要

`.server.ts` ファイルは **Remixのサーバーサイドでのみ実行** され、クライアントバンドルには含まれません。これにより、Lighthouse 100点を維持するための軽量化を実現します。

---

## Layer 3: Route層 (配線)

**適用ファイル**: `app/routes/{path}.tsx`

### 責務

- Conformを用いた神経系の接続
- Schema層を `parseWithValibot` で読み込み、UIに「自動配線」する
- Progressive Enhancement（JavaScript無効時も動作）

### 絶対ルール

- ✅ Schema層を `parseWithValibot` で読み込む
- ✅ 状態管理のための `useState` を極力排除し、Remixの `ActionData` と `submission` に従う
- ✅ HTML5制約も活用してProgressive Enhancementを実現
- ❌ 直接バリデーションロジックを書くことは禁止

### 正しい実装例（Action）

```typescript
// app/routes/login.tsx
import { parseWithValibot } from 'conform-to-valibot';
import { LoginSchema } from '~/specs/account/authentication-schema.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // ConformでValibotスキーマを使用
  const submission = parseWithValibot(formData, {
    schema: LoginSchema,
  });

  // バリデーション失敗時
  if (submission.status !== 'success') {
    return json(
      { lastResult: submission.reply() },
      { status: 400 }
    );
  }

  // 型安全なデータ取得
  const { email, password } = submission.value;

  // ビジネスロジック（Data-IO層の呼び出し）
  const user = await getUserByEmail(email);
  // ...
}
```

### 正しい実装例（Component）

```typescript
// app/routes/login.tsx
import { useForm, getFormProps, getInputProps } from '@conform-to/react';
import { parseWithValibot } from 'conform-to-valibot';
import { LoginSchema } from '~/specs/account/authentication-schema.server';

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    // クライアントサイドではHTML5バリデーションを使用
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginSchema });
    },
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <label htmlFor={fields.email.id}>メールアドレス</label>
        <input
          {...getInputProps(fields.email, { type: 'email' })}
          aria-invalid={fields.email.errors ? true : undefined}
          aria-describedby={fields.email.errors ? 'email-error' : undefined}
        />
        {fields.email.errors && (
          <span id="email-error" role="alert">
            {fields.email.errors}
          </span>
        )}
      </div>

      <div>
        <label htmlFor={fields.password.id}>パスワード</label>
        <input
          {...getInputProps(fields.password, { type: 'password' })}
          aria-invalid={fields.password.errors ? true : undefined}
          aria-describedby={fields.password.errors ? 'password-error' : undefined}
        />
        {fields.password.errors && (
          <span id="password-error" role="alert">
            {fields.password.errors}
          </span>
        )}
      </div>

      <button type="submit">ログイン</button>
    </Form>
  );
}
```

---

## 実装ルール

### Validation

- **サーバーサイド（Valibot）を絶対的正義とする**
  - すべてのバリデーションはサーバーサイドで実行される
  - クライアントサイドはHTML5標準機能で補強（Progressive Enhancement）

- **フロントエンドはConformを通じてHTML5標準機能を活用**
  - `required`, `minLength`, `maxLength`, `pattern` などのHTML属性を自動生成
  - JavaScript無効時も基本的なバリデーションが動作

### Types

- **型は手書きせず、Valibotの `InferOutput` から抽出**
  - スキーマと型の乖離をゼロにする
  - 設計と実装の一致を保証

```typescript
// ✅ 推奨
export type LoginFormData = v.InferOutput<typeof LoginSchema>;

// ❌ 禁止
export type LoginFormData = {
  email: string;
  password: string;
};
```

### Performance

- **Lighthouse 100点を維持**
  - `.server.ts` を使用してサーバーサイド専用コードを分離
  - 不要なライブラリインポートを避ける
  - 常にエッジ（Cloudflare）での実行速度を意識

---

## ベストプラクティス

### DO（推奨）

✅ **常にSpec層から開始する**
- YAMLを更新してからコードを書く

✅ **`.server.ts` を使用する**
- Valibotスキーマはサーバーサイド専用

✅ **`InferOutput` で型を生成する**
- 型とスキーマの乖離を防ぐ

✅ **Progressive Enhancement**
- JavaScript無効時も動作するフォーム

✅ **ARIA属性を活用する**
- `aria-invalid`, `aria-describedby`, `role="alert"`

### DON'T（非推奨）

❌ **Schema層を手書きしない**
- 必ず自動生成ツールを使用

❌ **クライアントサイドにValibotをインポートしない**
- `.server.ts` で分離すること

❌ **useState でフォーム状態を管理しない**
- Conformの `useForm` を使用

❌ **エラーメッセージをコード内に直接書かない**
- 必ずSpec層（YAML）から取得

---

## トラブルシューティング

### エラー: "Module not found: valibot"

**原因**: `.server.ts` でないファイルにValibotをインポートしている

**解決**:
```typescript
// ❌ 禁止（クライアントバンドルに含まれる）
// app/components/LoginForm.tsx
import { LoginSchema } from '~/specs/account/authentication-schema.server';

// ✅ 推奨（サーバーサイドのみ）
// app/routes/login.tsx
import { LoginSchema } from '~/specs/account/authentication-schema.server';
```

### エラー: "Type mismatch in form data"

**原因**: スキーマと実際のフォームデータが一致していない

**解決**:
- Spec層（YAML）のフィールド名を確認
- Schema層の自動生成が正しく行われているか確認
- Route層の `getInputProps` で正しいフィールドを参照しているか確認

---

## AIエージェントへの指示

1. フォーム実装時は、必ず Spec → Schema → Route の順序を守ること
2. Schema層は手書き禁止、必ずSpec層から自動生成すること
3. `.server.ts` 拡張子を必ず使用し、クライアントバンドルからValibotを分離すること
4. エラーメッセージはSpec層（YAML）に定義し、コード内には直接書かないこと
5. 型は `InferOutput` で自動生成し、手書きしないこと
6. Progressive Enhancementを意識し、JavaScript無効時も動作するフォームを実装すること
7. ARIA属性を適切に設定し、アクセシビリティを確保すること
