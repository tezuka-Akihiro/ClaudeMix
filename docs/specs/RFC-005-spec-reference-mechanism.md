# RFC-005: 構成化メカニズムの導入

**ステータス**: 提案
**作成日**: 2026-01-03
**優先度**: 中
**Phase**: 5
**依存**: RFC-004完了（推奨）

---

## 変更の概要

YAML参照機能（anchor/alias、merge key）をサポートし、specファイル間での値の再利用を可能にする。これにより、spec定義の柔軟性が向上し、さらなるDRY原則の徹底が実現する。

---

## 背景と目的

### 現状の問題

RFC-003で重複は大幅に削減されたが、以下の課題が残っている：

1. **spec内の繰り返しパターン**
   ```yaml
   # blog/posts-spec.yaml
   ui_selectors:
     category_1: "[data-testid='category-1']"
     category_2: "[data-testid='category-2']"
     category_3: "[data-testid='category-3']"
     # 同じパターンの繰り返し
   ```

2. **デフォルト値の再利用困難**
   ```yaml
   # 複数のフォームで同じエラーメッセージを使いたい
   forms:
     login:
       error: "入力内容を確認してください"
     register:
       error: "入力内容を確認してください"  # 重複
   ```

3. **spec間の値の連携不可**
   - sharedからの値参照は TypeScript層で実装
   - YAML定義時点では参照できない

### 目的

1. **YAML anchor/aliasのサポート**: spec内での値の再利用
2. **YAML merge keyのサポート**: デフォルト値の継承
3. **将来の拡張準備**: JSONポインタ形式の $ref サポート（optional）

---

## 変更内容

### 1. YAML anchor/alias機能のサポート

#### 機能概要

YAMLの標準機能である anchor (`&name`) と alias (`*name`) をサポートする。

#### 使用例

**変更前**:
```yaml
# blog/posts-spec.yaml
ui_selectors:
  section:
    posts_section: "[data-testid='posts-section']"
    category_section: "[data-testid='category-section']"
    filter_section: "[data-testid='filter-section']"
  button:
    load_more: "[data-testid='load-more-button']"
    reset_filter: "[data-testid='reset-filter-button']"
    apply_filter: "[data-testid='apply-filter-button']"
```

**変更後**:
```yaml
# blog/posts-spec.yaml
ui_selectors:
  _templates: &selector_templates
    section_pattern: "[data-testid='{name}-section']"
    button_pattern: "[data-testid='{name}-button']"

  section:
    posts_section: "[data-testid='posts-section']"
    category_section: "[data-testid='category-section']"
    filter_section: "[data-testid='filter-section']"

  button:
    load_more: "[data-testid='load-more-button']"
    reset_filter: "[data-testid='reset-filter-button']"
    apply_filter: "[data-testid='apply-filter-button']"
```

**注意**: パターン文字列の展開は実装側で行う

---

### 2. YAML merge key機能のサポート

#### 機能概要

YAML merge key (`<<:`) を使用して、オブジェクトの継承・拡張を可能にする。

#### 使用例

**変更前**:
```yaml
# account/authentication-spec.yaml
forms:
  login:
    email:
      label: "メールアドレス"
      placeholder: "example@example.com"
      type: "email"
      required: true
      autocomplete: "email"
    password:
      label: "パスワード"
      placeholder: "8文字以上"
      type: "password"
      required: true
      autocomplete: "current-password"

  register:
    email:
      label: "メールアドレス"
      placeholder: "example@example.com"
      type: "email"
      required: true
      autocomplete: "email"
    password:
      label: "パスワード"
      placeholder: "8文字以上"
      type: "password"
      required: true
      autocomplete: "new-password"
```

**変更後**:
```yaml
# account/authentication-spec.yaml
_field_defaults: &field_defaults
  required: true

_email_field: &email_field
  <<: *field_defaults
  label: "メールアドレス"
  placeholder: "example@example.com"
  type: "email"
  autocomplete: "email"

_password_field: &password_field
  <<: *field_defaults
  label: "パスワード"
  placeholder: "8文字以上"
  type: "password"

forms:
  login:
    email:
      <<: *email_field
      autocomplete: "email"
    password:
      <<: *password_field
      autocomplete: "current-password"

  register:
    email:
      <<: *email_field
    password:
      <<: *password_field
      autocomplete: "new-password"
```

**効果**:
- 共通フィールド定義の一元管理
- デフォルト値の継承
- 個別の上書きが可能

---

### 3. generate-specs.js の変更

**現状**: `yaml.load()` は既に anchor/alias をサポート

```javascript
// scripts/prebuild/generate-specs.js (行51)
const parsedSpec = yaml.load(yamlString);
```

**変更**: 特になし（js-yamlは標準でサポート）

**確認**:
```javascript
// テストコード
const yaml = require('js-yaml');

const yamlString = `
defaults: &defaults
  timeout: 5000
  retry: 3

loader:
  <<: *defaults
  method: "GET"

action:
  <<: *defaults
  method: "POST"
`;

const parsed = yaml.load(yamlString);
console.log(parsed);
// Output:
// {
//   defaults: { timeout: 5000, retry: 3 },
//   loader: { timeout: 5000, retry: 3, method: 'GET' },
//   action: { timeout: 5000, retry: 3, method: 'POST' }
// }
```

**結論**: js-yaml は既に anchor/alias/merge key をサポートしているため、追加実装不要。

---

### 4. 実装ガイドライン

#### 4.1 anchorの命名規則

**推奨**:
```yaml
_defaults: &defaults        # ✅ アンダースコア接頭辞
_email_field: &email_field  # ✅ 用途が明確
```

**非推奨**:
```yaml
x: &x                       # ❌ 意味不明
DEFAULTS: &DEFAULTS         # ❌ 大文字のみ
```

#### 4.2 anchor定義の配置

**推奨**: specファイルの先頭に `_templates` セクションを設ける

```yaml
metadata:
  feature_name: "..."
  version: "1.0.0"

_templates:               # anchor定義専用セクション
  &default_button:
    type: "button"
    disabled: false

buttons:
  submit:
    <<: *default_button
    label: "送信"
  cancel:
    <<: *default_button
    label: "キャンセル"
```

#### 4.3 型定義との関連

**注意**: TypeScript型定義では `_templates` を除外

```typescript
// blog/types.ts
export interface BlogPostsSpec {
  metadata: {...};
  // _templates は含めない（実行時には存在するが、型には不要）
  ui_selectors: {
    section: {...};
    button: {...};
  };
}
```

---

### 5. JSONポインタ形式の $ref サポート（将来拡張）

**Phase 5では実装しない**が、将来の拡張として設計のみ行う。

#### 想定仕様

```yaml
# account/authentication-spec.yaml
validation:
  email:
    $ref: "shared/validation#/email"  # shared specへの参照

# 展開後（ビルド時）
validation:
  email:
    pattern: "^[a-zA-Z0-9._%+-]+@..."
    max_length: 254
    error_message: "有効なメールアドレスを入力してください"
```

#### 実装方針

1. **カスタムYAMLタグの定義**
   ```javascript
   const RefType = new yaml.Type('!ref', {
     kind: 'scalar',
     resolve: (data) => typeof data === 'string',
     construct: (data) => ({ $ref: data })
   });
   ```

2. **参照解決ロジック**
   ```javascript
   function resolveReferences(spec, allSpecs) {
     // $ref を再帰的に解決
   }
   ```

3. **循環参照の検出**
   ```javascript
   function detectCircular(spec, visited = new Set()) {
     // 循環参照をチェック
   }
   ```

**Phase 5では設計のみ**: 実装はPhase 6以降に持ち越し

---

## 影響範囲

### 直接影響

- **変更**: なし（js-yamlが既にサポート）
- **新規作成**: 1ファイル
  - `docs/specs/YAML_REFERENCE_GUIDE.md`（使用ガイド）

### 間接影響

- **既存spec**: anchor/aliasの活用は任意（段階的に適用）
- **generate-specs.js**: 変更不要

---

## 移行手順

### ステップ1: 使用ガイドの作成

```bash
# docs/specs/YAML_REFERENCE_GUIDE.md を作成
```

### ステップ2: パイロット実装

```bash
# 1つのspecファイルでanchor/aliasを試験的に使用
# 例: account/authentication-spec.yaml のフォーム定義
```

### ステップ3: ビルド確認

```bash
npm run build

# 生成されたspecs.tsを確認
# anchorが正しく展開されているか検証
```

### ステップ4: 段階的展開

```bash
# 他のspecファイルにも適用
# 特に繰り返しパターンが多いファイルを優先
```

---

## テスト計画

### 単体テスト

**新規テスト**: `scripts/prebuild/generate-specs.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';

describe('YAML anchor/alias support', () => {
  it('anchorとaliasを正しく展開できる', () => {
    const yamlString = `
defaults: &defaults
  timeout: 5000

loader:
  <<: *defaults
  method: GET
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.loader.timeout).toBe(5000);
    expect(parsed.loader.method).toBe('GET');
  });

  it('複数のmerge keyを処理できる', () => {
    const yamlString = `
base: &base
  required: true

email_field: &email
  <<: *base
  type: email

form:
  email:
    <<: *email
    label: "Email"
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.form.email.required).toBe(true);
    expect(parsed.form.email.type).toBe('email');
    expect(parsed.form.email.label).toBe('Email');
  });

  it('上書きが正しく動作する', () => {
    const yamlString = `
defaults: &defaults
  timeout: 5000
  retry: 3

action:
  <<: *defaults
  timeout: 10000  # 上書き
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.action.timeout).toBe(10000);
    expect(parsed.action.retry).toBe(3);
  });
});
```

### 統合テスト

```bash
# 実際のspecファイルでanchorを使用してビルド
npm run build

# TypeScript型チェック
npm run typecheck

# 全テスト実行
npm test
```

---

## 使用ガイドドキュメント

**ファイル**: `docs/specs/YAML_REFERENCE_GUIDE.md`

**内容**:

```markdown
# YAML参照機能ガイド

## 概要

ClaudeMixのspecファイルでは、YAMLの標準機能である anchor/alias/merge key を使用できます。

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
```

---

## ロールバック手順

### 緊急時

```bash
# anchor/aliasを使用したspecファイルを元に戻す
git revert <commit-hash>

# ビルド実行
npm run build
```

### 段階的ロールバック

1. anchor/aliasを使用したspecファイルを特定
2. 展開後の値を直接記述する形に戻す
3. `_templates` セクションを削除
4. ビルド・テスト実行

**注意**: anchor/aliasはYAML標準機能のため、システムへの影響はない

---

## リスクと対策

### リスク1: anchor/aliasの誤用

**確率**: 中
**影響度**: 低

**対策**:
- 使用ガイドの整備
- ベストプラクティスの明示
- コードレビューでの確認

### リスク2: 型定義との不一致

**確率**: 低
**影響度**: 中

**対策**:
- `_templates` セクションを型定義から除外
- TypeScriptコンパイラでの検証
- 単体テストでの確認

### リスク3: ビルド時のエラー

**確率**: 低
**影響度**: 低

**対策**:
- js-yamlは標準でサポート（実績あり）
- エラーハンドリングの強化
- CI/CDでの自動検証

---

## 成功基準

1. **ガイド完成**: YAML_REFERENCE_GUIDE.md が作成される
2. **パイロット成功**: 1つ以上のspecファイルでanchor/aliasが動作
3. **ビルド成功**: anchor/alias使用後もビルドが正常終了
4. **テスト通過**: 単体テスト・統合テストが全て成功

---

## Phase 5の範囲

**実装する**:
- ✅ YAML anchor/aliasのサポート確認
- ✅ merge keyのサポート確認
- ✅ 使用ガイドの作成
- ✅ パイロット実装

**実装しない**（Phase 6以降）:
- ❌ JSONポインタ形式の `$ref`
- ❌ spec間の参照
- ❌ 動的な値生成

---

## 次のステップ

Phase 5完了後:

1. **Phase 6（optional）**: spec間参照機能の実装
   - JSONポインタ形式のサポート
   - 循環参照の検出
   - カスタムYAMLタグの実装

2. **継続的改善**: 既存specへのanchor/alias適用
   - 繰り返しパターンの特定
   - 段階的なリファクタリング
   - 効果測定

---

## 備考

このPhaseは、**既存の機能を活用する**ことが主眼です。js-yamlが標準でサポートする anchor/alias/merge key を使用ガイドとして整備し、開発者が活用できるようにすることが目的です。

新規実装は最小限に抑え、リスクを低く保ちながら、specファイルの柔軟性を向上させます。
