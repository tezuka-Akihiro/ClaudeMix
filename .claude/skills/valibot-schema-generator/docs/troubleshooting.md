# Troubleshooting Guide

このドキュメントは、スキーマ生成時に発生する一般的な問題とその解決方法を提供します。

## エラー: "Spec file not found"

### 症状

```
Error: Cannot find module '~/specs/account/authentication-spec'
```

### 原因

- Specファイルが存在しない
- ファイルパスが間違っている
- サービス名またはセクション名が間違っている

### 解決方法

1. **ファイルの存在確認**:
   ```bash
   ls app/specs/account/authentication-spec.yaml
   ```

2. **正しいパス構造**:
   ```
   app/specs/{service}/{section}-spec.yaml
   ```

3. **サービス・セクション名の確認**:
   - サービス名: `account`, `blog` など
   - セクション名: `authentication`, `profile`, `posts` など

---

## エラー: "Missing error messages in spec"

### 症状

```
Error: Cannot read property 'required' of undefined
```

### 原因

- `validation` セクションに `error_messages` が定義されていない
- フィールド固有のエラーメッセージが欠けている

### 解決方法

Spec YAMLに `error_messages` を追加:

```yaml
validation:
  email:
    error_messages:
      required: "メールアドレスを入力してください"
      invalid_format: "有効なメールアドレスを入力してください"
  password:
    error_messages:
      required: "パスワードを入力してください"
      too_short: "パスワードは8文字以上で入力してください"
      too_long: "パスワードは128文字以下で入力してください"
```

---

## エラー: "Type errors in generated schema"

### 症状

```
TS2307: Cannot find module 'valibot' or its corresponding type declarations.
```

### 原因

- Valibotがインストールされていない
- `node_modules/` が壊れている

### 解決方法

1. **Valibotをインストール**:
   ```bash
   npm install valibot @conform-to/react @conform-to/valibot
   ```

2. **依存関係の再インストール**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## エラー: "Module not found: ~/schemas/..."

### 症状

```
Error: Cannot find module '~/schemas/account/authentication-schema.server'
```

### 原因

- スキーマファイルがまだ生成されていない
- ファイル名が間違っている

### 解決方法

1. **スキーマを生成**:
   ```bash
   # このスキルを実行
   "Generate schema for authentication"
   ```

2. **ファイル名を確認**:
   ```bash
   ls app/schemas/account/authentication-schema.server.ts
   ```

---

## エラー: "Client bundle includes Valibot"

### 症状

Lighthouse scoreが低下、バンドルサイズが増加

### 原因

- `.server.ts` 拡張子が使用されていない
- クライアントコンポーネントでスキーマをインポートしている

### 解決方法

1. **拡張子を確認**:
   ```bash
   # 正しい
   app/schemas/account/authentication-schema.server.ts

   # 間違い
   app/schemas/account/authentication-schema.ts
   ```

2. **クライアントコンポーネントでのインポート禁止**:
   ```typescript
   // ❌ 禁止（クライアントコンポーネント）
   // app/components/LoginForm.tsx
   import { LoginSchema } from '~/schemas/account/authentication-schema.server';

   // ✅ 正しい（サーバーサイドのみ）
   // app/routes/login.tsx (action)
   import { LoginSchema } from '~/schemas/account/authentication-schema.server';
   ```

---

## エラー: "Type mismatch in form data"

### 症状

```
TS2339: Property 'email' does not exist on type 'unknown'.
```

### 原因

- `submission.status` を確認せずに `submission.value` にアクセスしている
- 型が正しくエクスポートされていない

### 解決方法

1. **正しいパターン**:
   ```typescript
   // ✅ 正しい
   if (submission.status !== 'success') {
     return json({ lastResult: submission.reply() });
   }
   const { email, password } = submission.value; // 型安全

   // ❌ 間違い
   const { email, password } = submission.value; // undefinedの可能性
   ```

2. **型のエクスポート確認**:
   ```typescript
   export type LoginFormData = v.InferOutput<typeof LoginSchema>;
   ```

---

## エラー: "Hardcoded error messages"

### 症状

ESLintエラー: "Error messages must come from spec YAML"

### 原因

- エラーメッセージを直接文字列で記述している

### 解決方法

**Before**:
```typescript
// ❌ 禁止
v.string('メールアドレスを入力してください')
```

**After**:
```typescript
// ✅ 正しい
v.string(spec.validation.email.error_messages.required)
```

---

## パフォーマンス問題

### 症状

フォームのバリデーションが遅い

### 原因

- 複雑すぎるバリデーションルール
- 非同期バリデーションの過度な使用

### 解決方法

1. **シンプルなルールを維持**:
   - 必要最小限のバリデーションルールのみ使用
   - 複雑な正規表現は避ける

2. **非同期バリデーションの最適化**:
   - デバウンスを使用
   - サーバーサイドでのみ実行

---

## その他の問題

### issue: Conformのエラーが表示されない

**解決**: `lastResult` を `useForm` に渡す

```typescript
const [form, fields] = useForm({
  lastResult: actionData?.lastResult, // 必須
});
```

### issue: ARIA属性が自動設定されない

**解決**: `getInputProps` を使用

```typescript
<input {...getInputProps(fields.email, { type: 'email' })} />
```

---

## サポート

さらにサポートが必要な場合は、以下を参照してください：

- [Valibot + Conform Guide](../../../docs/boilerplate_architecture/VALIBOT_CONFORM_GUIDE.md)
- [Migration Guide](../../../docs/boilerplate_architecture/VALIBOT_CONFORM_MIGRATION_GUIDE.md)
- [Valibot Documentation](https://valibot.dev/)
- [Conform Documentation](https://conform.guide/)
