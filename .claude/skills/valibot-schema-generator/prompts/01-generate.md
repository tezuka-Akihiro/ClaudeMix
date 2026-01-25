# Phase 1: Schema Generation Prompt

## AI役割定義

あなたはValibotスキーマ生成エキスパートです。
YAML spec fileから型安全なValibotバリデーションスキーマを生成してください。

## 思考プロセス（CoT）

以下の順序で段階的に実行してください：

```text
Step 1: サービスとセクション名を特定する
  → ユーザー指示またはコンテキストから抽出

Step 2: Spec YAMLファイルを読み込む
  → app/specs/{service}/{section}-spec.yaml
  → app/specs/shared/validation-spec.yaml

Step 3: フォーム定義を抽出する
  → forms.{form_name}.fields から各フィールドを特定
  → 必須フィールド、型、バリデーションルールを収集

Step 4: バリデーションルールを構築する
  → Shared validationとSection validationを統合
  → エラーメッセージをSpec YAMLから取得

Step 5: スキーマファイルを生成する
  → templates/schema.server.ts.template を使用
  → 共通スキーマ（EmailSchema等）を生成
  → フォーム固有スキーマを生成
  → InferOutput型をエクスポート

Step 6: 出力を検証する
  → .server.ts拡張子を確認
  → 全フォームに対応するスキーマが存在するか確認
  → InferOutput型が全てエクスポートされているか確認
```

## 必須入力

### Option A: ユーザー指定

```xml
<input>
  <service>{service_name}</service>
  <section>{section_name}</section>
</input>
```

### Option B: 自動検出

- ユーザーが "Generate schema for authentication" と言った場合
  - service: "account"（コンテキストから推測）
  - section: "authentication"

- ユーザーが "Create schema from account/profile-spec.yaml" と言った場合
  - service: "account"
  - section: "profile"

## 実行手順

### Step 1: 入力の特定

```xml
<input_detection>
  <user_query>{ユーザーの指示}</user_query>
  <detected_service>{推測されたサービス名}</detected_service>
  <detected_section>{推測されたセクション名}</detected_section>
</input_detection>
```

### Step 2: Spec YAMLの読み込み

```bash
# 読み込むファイル
app/specs/{service}/{section}-spec.yaml
app/specs/shared/validation-spec.yaml
```

### Step 3: フォーム定義の抽出

```xml
<form_analysis>
  <form name="{form_name}">
    <field name="{field_name}" type="{type}" required="{true/false}">
      <validation>
        <rule type="minLength">{value}</rule>
        <rule type="maxLength">{value}</rule>
        <rule type="pattern">{regex}</rule>
        <error_message type="required">{message}</error_message>
        <error_message type="invalid">{message}</error_message>
      </validation>
    </field>
  </form>
</form_analysis>
```

### Step 4: スキーマ生成

#### 共通バリデーションスキーマ

```typescript
// EmailSchema example
export const EmailSchema = v.pipe(
  v.string('{error_messages.required}'),
  v.email('{error_messages.invalid_format}'),
  v.maxLength({max_length}, '{error_messages.too_long}'),
  v.regex(new RegExp('{pattern}'), '{error_messages.invalid_format}')
);
```

#### フォーム固有スキーマ

```typescript
export const {FormName}Schema = v.object({
  {field1}: {Field1Schema},
  {field2}: {Field2Schema},
});
```

#### パスワード確認の例

```typescript
export const RegisterSchema = v.pipe(
  v.object({
    email: EmailSchema,
    password: PasswordSchema,
    passwordConfirm: v.string('{error_messages.required}'),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['passwordConfirm']],
      (input) => input.password === input.passwordConfirm,
      '{error_messages.mismatch}'
    ),
    ['passwordConfirm']
  )
);
```

### Step 5: 型エクスポート

```typescript
export type {FormName}FormData = v.InferOutput<typeof {FormName}Schema>;
```

### Step 6: 検証チェックリスト

- [ ] ファイル名: `app/specs/{service}/{section}-schema.server.ts`
- [ ] 拡張子: `.server.ts` （必須）
- [ ] 全フォームに対応するスキーマが存在する
- [ ] 全スキーマに InferOutput 型がエクスポートされている
- [ ] エラーメッセージが全てSpec YAMLから取得されている
- [ ] ハードコーディングされた値が存在しない

## Output形式

```typescript
/**
 * {Section} Schema Layer (Valibot)
 *
 * このファイルは`app/specs/{service}/{section}-spec.yaml`から生成されます。
 * 手動編集は推奨されません。変更が必要な場合はSpec層を更新してください。
 *
 * 責務:
 * - サーバーサイドバリデーションの物理的な検問所
 * - Spec層の制約をValibotスキーマとして実装
 * - 型安全性を提供（InferOutput）
 *
 * 重要: `.server.ts`拡張子により、クライアントバンドルから除外されます。
 */

import * as v from 'valibot';

// 共通バリデーション（再利用可能）
{共通スキーマの定義}

// Form Schemas
{フォーム固有スキーマの定義}

// 型抽出（InferOutput）
{型エクスポート}
```

## 完了レポート

```xml
<generation_report>
  <status>success</status>
  <output_file>app/specs/{service}/{section}-schema.server.ts</output_file>
  <specs_read>
    <spec>app/specs/{service}/{section}-spec.yaml</spec>
    <spec>app/specs/shared/validation-spec.yaml</spec>
  </specs_read>
  <schemas_generated>
    <common_schema name="EmailSchema" />
    <common_schema name="PasswordSchema" />
    <form_schema name="{Form1}Schema" fields="{field1, field2}" />
    <form_schema name="{Form2}Schema" fields="{field1, field2, field3}" />
  </schemas_generated>
  <types_exported>
    <type name="{Form1}FormData" />
    <type name="{Form2}FormData" />
  </types_exported>
  <message>✅ Schema generation complete!</message>
</generation_report>
```

## エラーハンドリング

### エラー: "Spec file not found"

```xml
<error>
  <type>FileNotFound</type>
  <file>app/specs/{service}/{section}-spec.yaml</file>
  <action>Verify file path and service/section names</action>
  <command>ls app/specs/{service}/</command>
</error>
```

### エラー: "Missing validation error messages"

```xml
<error>
  <type>MissingErrorMessages</type>
  <field>{field_name}</field>
  <missing_messages>
    <message type="required" />
    <message type="invalid_format" />
  </missing_messages>
  <action>Add error_messages to validation section in spec YAML</action>
</error>
```

## 良い例 / 悪い例

### ✅ 良い例

```typescript
// エラーメッセージをSpec YAMLから取得
export const EmailSchema = v.pipe(
  v.string(authSpec.validation.email.error_messages.required),
  v.email(authSpec.validation.email.error_messages.invalid_format)
);

// InferOutputで型を自動生成
export type LoginFormData = v.InferOutput<typeof LoginSchema>;
```

### ❌ 悪い例

```typescript
// ハードコーディング（禁止）
export const EmailSchema = v.pipe(
  v.string('メールアドレスを入力してください'),
  v.email('有効なメールアドレスを入力してください')
);

// 手書き型（禁止）
export type LoginFormData = {
  email: string;
  password: string;
};
```

## 参照ドキュメント

- Schema Structure: `docs/schema-structure.md`
- Troubleshooting: `docs/troubleshooting.md`
- Examples: `docs/examples.md`
- Template: `templates/schema.server.ts.template`
