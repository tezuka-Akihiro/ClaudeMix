# YAML参照機能ガイド

## 概要

ClaudeMixのspecファイルでは、YAMLの標準機能である anchor/alias/merge key を使用できます。

これにより、spec内での値の再利用が可能になり、DRY原則をさらに徹底できます。

---

## 基本的な使い方

### Anchor と Alias

**定義**:

```yaml
# anchor定義（&name）
defaults: &defaults
  timeout: 5000
  retry: 3
```

**参照**:

```yaml
# alias参照（*name）
loader:
  <<: *defaults
  # timeout: 5000, retry: 3 が自動的に含まれる
```

---

### Merge Key

**継承**:

```yaml
_field_base: &field_base
  required: true
  disabled: false

email_field:
  <<: *field_base         # 継承
  type: "email"           # 追加
  label: "メールアドレス"
```

**上書き**:

```yaml
password_field:
  <<: *field_base
  required: false         # 上書き
  type: "password"
```

---

## 実践例

### 例1: フォームフィールドの共通化

```yaml
_templates:
  _field_defaults: &field_defaults
    required: true
    disabled: false

  _input_base: &input_base
    <<: *field_defaults
    autocomplete: "off"

forms:
  login:
    email:
      <<: *input_base
      type: "email"
      label: "メールアドレス"
    password:
      <<: *input_base
      type: "password"
      label: "パスワード"
```

### 例2: UIセレクタのパターン化

```yaml
_templates:
  _selector_base: &selector_base
    prefix: "[data-testid='"
    suffix: "']"

ui_selectors:
  buttons:
    submit: "[data-testid='submit-button']"
    cancel: "[data-testid='cancel-button']"
```

---

## ベストプラクティス

### DO（推奨）

✅ anchor名はアンダースコア接頭辞（`_defaults`）

✅ `_templates` セクションにanchor定義を集約

✅ 共通フィールドは再利用する

✅ 上書きは最小限に

### DON'T（非推奨）

❌ anchor名を短くしすぎる（`&x`, `&a`）

❌ 深いネストのanchor定義

❌ 循環参照（将来的にエラーになる可能性）

❌ anchor定義をspecファイル全体に散らばらせる

---

## トラブルシューティング

### ビルドエラー: "unknown anchor"

**原因**: anchorが定義される前に参照している

**解決**:

```yaml
# ❌ NG
forms:
  login:
    <<: *field_base  # field_baseが未定義

_field_base: &field_base
  required: true

# ✅ OK
_field_base: &field_base
  required: true

forms:
  login:
    <<: *field_base
```

### TypeScriptエラー: "_templates does not exist"

**原因**: 型定義に `_templates` が含まれている

**解決**: 型定義から `_templates` を除外

```typescript
// ❌ NG
export interface Spec {
  _templates: {...};  // 不要
  forms: {...};
}

// ✅ OK
export interface Spec {
  // _templates は含めない
  forms: {...};
}
```

---

## 制限事項

1. **spec間の参照は不可**: 同一ファイル内のみ
2. **JSONポインタ形式は未サポート**: `$ref` は Phase 6以降
3. **動的な値生成は不可**: パターン文字列の展開は実装側で行う

---

## 更新履歴

- 2026-01-03: 初版作成（RFC-005）
