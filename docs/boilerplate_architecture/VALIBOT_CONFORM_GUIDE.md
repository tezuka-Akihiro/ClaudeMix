# Valibot + Conform 開発フローガイド

## 🎯 核心思想

このプロジェクトは「5〜10年死なない」プロダクトを築くための「延命拠点の防衛構造」を採用しています。
Valibot（バリデーション）とConform（フォーム状態管理）を用いて、**Spec層 → Schema層 → Route層**の片道切符フローを実現します。

---

## 📐 3レイヤー構造（Single Source of Truth）

開発は必ず以下の「上流から下流へ」の片道切符で行い、不自然な二重管理を禁止します。

```
Spec層 (意思) → Schema層 (防衛) → Route層 (配線)
   YAML            Valibot          Conform
```

### Layer 1: Spec層 (意思)

**配置場所**: `app/specs/{service}/{section}-spec.yaml`

**責務**:
- 全ての仕様、制約（constraints）、エラーメッセージの唯一の正解（SSOT）
- フォームフィールドの定義、バリデーションルール、UIテキスト

**ルール**:
- ✅ コードを変更する前に、必ずこのYAMLを更新すること
- ✅ バリデーションルールはここに集約
- ❌ コード内に直接エラーメッセージを書くことは禁止

**例**:
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

### Layer 2: Schema層 (防衛)

**配置場所**: `app/schemas/{service}/{section}-schema.server.ts`

**責務**:
- Valibotを用いた物理的な検問所
- Spec層から自動生成される型安全なスキーマ
- サーバーサイドバリデーションの実装

**ルール**:
- ✅ Spec層からAIまたはジェネレーターによって自動生成される
- ✅ 必ず `.server.ts` として隔離し、Cloudflare Pagesのバンドルサイズを最小化（Tree-shaking徹底）
- ❌ 手書き禁止（自動生成ツールを使用すること）
- ❌ クライアントバンドルに含めない（`.server.ts` 拡張子を必ず使用）

**例**:
```typescript
// app/schemas/account/authentication-schema.server.ts
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

**重要**: `.server.ts` ファイルは **Remixのサーバーサイドでのみ実行** され、クライアントバンドルには含まれません。これにより、Lighthouse 100点を維持するための軽量化を実現します。

---

### Layer 3: Route層 (配線)

**配置場所**: `app/routes/{path}.tsx`

**責務**:
- Conformを用いた神経系の接続
- Schema層を `parseWithValibot` で読み込み、UIに「自動配線」する
- Progressive Enhancement（JavaScript無効時も動作）

**ルール**:
- ✅ Schema層を `parseWithValibot` で読み込む
- ✅ 状態管理のための `useState` を極力排除し、Remixの `ActionData` と `submission` に従う
- ✅ `getZodConstraint` のようなHTML5制約も活用してProgressive Enhancementを実現
- ❌ 直接バリデーションロジックを書くことは禁止

**例（Action）**:
```typescript
// app/routes/login.tsx
import { parseWithValibot } from 'conform-to-valibot';
import { LoginSchema } from '~/schemas/account/authentication-schema.server';

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

**例（Component）**:
```typescript
// app/routes/login.tsx
import { useForm } from '@conform-to/react';
import { parseWithValibot } from 'conform-to-valibot';
import { LoginSchema } from '~/schemas/account/authentication-schema.server';

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

## 🔄 開発フロー（The Single Path）

### 絵文字フロー図との統合

ClaudeMixの標準開発フロー（`docs/boilerplate_architecture/開発フロー簡略図.md`）に統合されます：

```
📋️ section-spec.yaml
  ↓
🔐 Schema層生成 ← ★ Valibot/Conform統合ポイント
  ↓
🗂️ file_list.md & 🧬 data-flow-diagram.md
  ↓
🎭 MOCK_POLICY.md & ⛏️ TDD_WORK_FLOW.md
  ↓
🪨 route/components/logic/data-io実装
🚧 テスト実装
```

**重要**: Schema層は **📋️ section-spec.yaml完成後、即座に生成** されます。これにより、Route実装時には型安全なスキーマが既に利用可能になります。

---

### ステップ1: Spec層の更新（📋️ section-spec.yaml）

```bash
# 1. YAMLファイルを編集
vim app/specs/account/authentication-spec.yaml
```

フォームの仕様、バリデーションルール、エラーメッセージを定義します。

### ステップ2: Schema層の生成（🔐 自動化）

**方法A: Skillによる自動生成（推奨）**

```bash
# AIに依頼（自動発見で起動）
"Generate Valibot schema from authentication-spec.yaml"
```

**方法B: コマンドによる生成（将来実装）**

```bash
# スキーマ生成ツールを実行
npm run generate:schema -- account/authentication
```

**方法C: 手動生成（非推奨、初期のみ）**

> AIに依頼: "Please generate a Valibot schema for `account/authentication-spec.yaml` in `app/schemas/account/authentication-schema.server.ts`"

### ステップ3: Route層の実装（🪨 実装）

```bash
# 3. Routeファイルを編集
vim app/routes/login.tsx
```

Conformを使用してSchema層と接続し、UIを実装します。

---

## 🛡️ 実装ルール

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

## 🏗️ 3大層分離との統合

Valibot/Conformは、ClaudeMixの3大層分離アーキテクチャと以下のように統合されます：

### 🎨 UI層（routes/ + components/）

- **Route（loader/action）**: Schema層を使用してバリデーション
- **Component**: Conformを使用してフォーム状態を管理

### 🧠 純粋ロジック層（lib/）

- **既存の純粋関数は維持**（`validateEmail`, `validatePassword` 等）
- Valibotスキーマから呼び出される場合もある
- ビジネスロジックの検証に使用

### 🔌 副作用層（data-io/）

- DBアクセス、APIコール
- Schema層で検証されたデータを受け取る
- 純粋ロジック層の関数を呼び出し可能

---

## 🎯 Skillsとしての実装（自動発見）

Valibot/Conformの開発フローは、Claude Skillsとして実装することで自動化されます。

### Skill構成

```text
.claude/skills/
└── valibot-schema-generator/
    ├── SKILL.md           # Schema生成Skill
    ├── templates/
    │   └── schema.server.ts.template
    └── scripts/
        └── generate.js
```

### SKILL.md 例

```yaml
---
name: valibot-schema-generator
description: Generate Valibot schema from section-spec.yaml when user requests schema generation or form validation implementation. Automatically invoked after spec file creation.
allowed-tools: Read, Write, Bash
---

# Valibot Schema Generator

Generates type-safe Valibot schemas from YAML spec files.

## Usage Triggers

- "Generate schema for authentication"
- "Create Valibot schema from spec"
- "Setup form validation"
- After completing section-spec.yaml

## Process

1. Read `app/specs/{service}/{section}-spec.yaml`
2. Extract form field definitions and validation rules
3. Generate `app/schemas/{service}/{section}-schema.server.ts`
4. Include InferOutput type exports
5. Ensure `.server.ts` extension for tree-shaking
```

**利点**:
- 文脈に応じて自動起動
- 一貫したSchema生成パターン
- チーム全体で共有可能（git管理）

詳細は `content/blog/posts/skills-guide.md` を参照してください。

---

## 📦 必要なパッケージ

```bash
npm install valibot @conform-to/react @conform-to/valibot
```

- **valibot**: モジュラーでTree-shakableなバリデーションライブラリ
- **@conform-to/react**: RemixとReactのためのフォーム状態管理
- **@conform-to/valibot**: ConformとValibotの統合

---

## 🚀 移行戦略

### フェーズ1: 開発フローの確立（現在）

- [x] 現状の調査
- [x] 開発フローのドキュメント作成
- [ ] Schema層のテンプレート設計
- [ ] スキーマ生成ツールの作成

### フェーズ2: PoC（Proof of Concept）

- [ ] 1つのフォームを選択（例: login）
- [ ] Spec → Schema → Route の完全な実装
- [ ] テストの実装
- [ ] パフォーマンスの検証

### フェーズ3: 段階的移行

- [ ] 他の認証フォームの移行（register, forgot-password）
- [ ] プロフィールフォームの移行（email change, password change）
- [ ] サブスクリプションフォームの移行

### フェーズ4: ドキュメント化

- [ ] 移行パターンのドキュメント化
- [ ] ベストプラクティスの共有
- [ ] トラブルシューティングガイド

---

## 🎓 ベストプラクティス

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

## 🔍 トラブルシューティング

### エラー: "Module not found: valibot"

**原因**: `.server.ts` でないファイルにValibotをインポートしている

**解決**:
```typescript
// ❌ 禁止（クライアントバンドルに含まれる）
// app/components/LoginForm.tsx
import { LoginSchema } from '~/schemas/account/authentication-schema.server';

// ✅ 推奨（サーバーサイドのみ）
// app/routes/login.tsx
import { LoginSchema } from '~/schemas/account/authentication-schema.server';
```

### エラー: "Type mismatch in form data"

**原因**: スキーマと実際のフォームデータが一致していない

**解決**:
- Spec層（YAML）のフィールド名を確認
- Schema層の自動生成が正しく行われているか確認
- Route層の `getInputProps` で正しいフィールドを参照しているか確認

---

## 📚 参考資料

- [Valibot Documentation](https://valibot.dev/)
- [Conform Documentation](https://conform.guide/)
- [Remix Forms Documentation](https://remix.run/docs/en/main/guides/form-validation)
- [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)

---

## 更新履歴

- 2026-01-23: 初版作成（Valibot + Conform導入計画）
