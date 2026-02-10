---
paths:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "tests/**/*.ts"
  - "tests/**/*.tsx"
  - "docs/**/*.md"
  - "app/specs/**/*.yaml"
---

# SsoT（Single Source of Truth）Spec Loader ルール

このルールは実装ファイル、テストファイル、設計ドキュメント、Specファイルに適用されます。

## 目的

プロジェクトの寿命は開発サイクルの高速化によって延びます。この関係は以下のように連鎖しています。

```
プロジェクトの寿命
    ↑
開発サイクルの高速化
    ↑
自動テストの信頼性
    ↑
ドキュメントの鮮度
    ↑
実装 = テスト = ドキュメント の整合性
```

この整合性を保つため、`app/specs/` 配下の `*-spec.yaml` ファイルを**唯一の値の源泉**とし、実装とテストはこのファイルをロードして使用します。

**重要**: テストデータは spec ファイルに含めません。

---

## Spec Loader の使用方法

### サーバー側（実装）

```typescript
// app/spec-utils/specLoader.server.ts を使用
import { loadSpec, loadSharedSpec } from '~/spec-utils/specLoader.server';

// 機能固有のspec
const postsSpec = loadSpec<BlogPostsSpec>('blog/posts');

// 共通spec
const projectSpec = loadSharedSpec<ProjectSpec>('project');
```

### テスト側

```typescript
// tests/utils/loadSpec.ts を使用
import { loadSpec, loadSharedSpec, loadTestArticles } from 'tests/utils/loadSpec';

// 非同期で spec をロード
const spec = await loadSpec('blog', 'posts');

// 共通spec
const sharedSpec = await loadSharedSpec('project');

// テスト専用記事のみ使用
const testArticles = await loadTestArticles();
```

---

## チェック項目

### 1. 設計ドキュメント

| チェック項目 | 推奨 | 禁止 |
|-------------|------|------|
| 数値・具体値の記述 | 「複数の記事」「一定期間」 | 「6件の記事」「30日間」 |
| spec参照の注意書き | 記述しない | 「詳細はspec.yamlを参照」 |
| 抽象的表現 | 「リスト形式で表示」 | 「ul/li タグで表示」 |

**理由**: specファイルを変更しても、設計ドキュメントを更新する必要がない状態を維持するため。

### 2. テスト

| チェック項目 | 推奨 | 禁止 |
|-------------|------|------|
| テストデータ | 原則使用しない | テストデータのハードコード |
| spec loader | `tests/utils/loadSpec.ts` を使用 | 直接YAMLをパース |
| 記事テストデータ | `test-e2e-*.md` のみ使用 | 本番記事をテストデータに |
| CSSアサート | 禁止 | `expect(element).toHaveStyle()` |
| データ検証 | specの存在・構造を確認 | 具体的な値をアサート |

```typescript
// 推奨: specの存在を確認
const spec = await loadSpec('blog', 'posts');
expect(spec.categories).toBeDefined();
expect(spec.categories.length).toBeGreaterThan(0);

// 禁止: 具体的な値をアサート
expect(spec.categories[0].name).toBe('Claude Best Practices');
```

**テストデータが必要な場合**: オペレータの許可を得てハードコードしてください。

### 3. 実装

| チェック項目 | 推奨 | 禁止 |
|-------------|------|------|
| リテラル値 | spec loaderから取得 | ハードコード |
| UIテキスト | `spec.messages.error.xxx` | `"エラーが発生しました"` |
| セレクタ | `spec.ui_selectors.xxx` | `"[data-testid='xxx']"` |
| ビジネスルール | `spec.business_rules.xxx` | マジックナンバー |

```typescript
// 推奨
const spec = loadSpec<BlogPostsSpec>('blog/posts');
const perPage = spec.business_rules.load_more.posts_per_load;

// 禁止
const perPage = 6;
```

**例外**: コードが著しく複雑になる場合はオペレータに相談してください。

### 4. Spec ファイル

| チェック項目 | 推奨 | 禁止 |
|-------------|------|------|
| サービス共通設定 | `common-spec.yaml` に集約 | 各セクションで重複定義 |
| 値の組み合わせ | anchor/alias で表現 | 同じ値を複数箇所に記述 |
| CSS | CSSアーキテクチャで管理 | spec ファイルに記述 |
| anchor命名 | `_` プレフィックス | 短い名前（`&x`） |

```yaml
# 推奨: anchor/alias で再利用
_templates:
  _field_base: &field_base
    required: true
    disabled: false

forms:
  email:
    <<: *field_base
    type: "email"

# 禁止: CSS記述
ui_styles:
  button:
    background: "#007bff"
```

**参考**: `docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md`

---

## よくある違反パターンと修正例

### 1. ハードコードされたメッセージ

```typescript
// 違反
return json({ error: "記事の取得に失敗しました" });

// 修正
const spec = loadSpec<BlogPostsSpec>('blog/posts');
return json({ error: spec.messages.error.fetch_failed });
```

### 2. マジックナンバー

```typescript
// 違反
const items = posts.slice(0, 6);

// 修正
const spec = loadSpec<BlogPostsSpec>('blog/posts');
const items = posts.slice(0, spec.business_rules.load_more.initial_load);
```

### 3. テストでの具体値アサート

```typescript
// 違反
expect(categories).toContain('Claude Best Practices');

// 修正
const spec = await loadSpec('blog', 'posts');
expect(categories).toContain(spec.categories[0].name);
```

---

## AIエージェントへの指示

1. 実装ファイルでは `~/spec-utils/specLoader.server` を使用すること
2. テストファイルでは `tests/utils/loadSpec` を使用すること
3. 日本語文字列、数値リテラル（0, 1以外）、data-testid のハードコードを発見したら、spec loaderへの移行を検討すること
4. テストでの `toHaveStyle()` 使用は禁止
5. 設計ドキュメントには具体的な数値や値を記述しないこと
6. コードが著しく複雑になる場合はオペレータに相談すること
