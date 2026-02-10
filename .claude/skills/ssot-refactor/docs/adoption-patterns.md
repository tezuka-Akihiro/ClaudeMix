# Spec Loader 導入パターン

## 概要

このドキュメントは、spec loaderが未導入のファイルを検出し、正しく導入するためのパターン集です。

---

## 導入が必要なファイルの特定

### 実装ファイル（app/routes/）

**導入が必要**:
- loader/action でデータを扱うファイル
- UIテキスト（エラーメッセージ等）を表示するファイル
- ビジネスルール（ページサイズ等）を持つファイル

**導入不要**:
- シンプルなリダイレクト（`_index.tsx`）
- 純粋なレイアウト（`_layout.tsx`）
- 静的コンテンツのみのページ

### テストファイル（tests/）

**導入が必要**:
- specの値を使ってアサートするテスト
- テスト記事を使用するE2Eテスト
- カテゴリ・タグなどの検証テスト

**導入不要**:
- 純粋なユーティリティ関数のテスト
- specと無関係なヘルパーのテスト

---

## 検出コマンド

### spec loaderが未導入の実装ファイル

```bash
# loadSpecをimportしていないrouteファイル
for f in $(find app/routes -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  if [ -f "$f" ] && ! grep -q "loadSpec\|loadSharedSpec" "$f"; then
    echo "$f"
  fi
done
```

### spec loaderが未導入のテストファイル

```bash
# tests/utils/loadSpecをimportしていないテストファイル
for f in $(find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null); do
  if [ -f "$f" ] && ! grep -q "tests/utils/loadSpec" "$f"; then
    echo "$f"
  fi
done
```

### ハードコードされた日本語文字列

```bash
grep -rn '"[^"]*[ぁ-んァ-ン一-龥]' app/routes --include="*.tsx" --include="*.ts"
```

### ハードコードされたマジックナンバー

```bash
grep -rn 'slice(0, [2-9]\|[0-9]\{2,\})' app/routes --include="*.tsx" --include="*.ts"
```

---

## 導入パターン

### 1. Route loader/action への導入

**Before（未導入）**:
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getPosts();
  if (!posts) {
    return json({ error: "記事の取得に失敗しました" });
  }
  return json({ posts: posts.slice(0, 6) });
}
```

**After（導入済み）**:
```typescript
import { loadSpec } from '~/spec-utils/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const spec = loadSpec<BlogPostsSpec>('blog/posts');
  const posts = await getPosts();
  if (!posts) {
    return json({ error: spec.messages.error.fetch_failed });
  }
  return json({ posts: posts.slice(0, spec.business_rules.load_more.initial_load) });
}
```

### 2. Vitest への導入

**Before（未導入）**:
```typescript
describe('Posts', () => {
  test('カテゴリが表示される', () => {
    expect(screen.getByText('Claude Best Practices')).toBeInTheDocument();
  });
});
```

**After（導入済み）**:
```typescript
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogPostsSpec } from '~/specs/blog/types';

describe('Posts', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadSpec('blog', 'posts');
  });

  test('カテゴリが表示される', () => {
    expect(screen.getByText(spec.categories[0].name)).toBeInTheDocument();
  });
});
```

### 3. Playwright E2E への導入

**Before（未導入）**:
```typescript
test('記事詳細が表示される', async ({ page }) => {
  await page.goto('/blog/CLAUDEmd-guide');
  await expect(page.getByText('Claude Best Practices')).toBeVisible();
});
```

**After（導入済み）**:
```typescript
import { loadSpec, loadTestArticles } from 'tests/utils/loadSpec';

test.describe('Blog', () => {
  let spec: BlogPostsSpec;
  let testArticles: TestArticleFrontmatter[];

  test.beforeAll(async () => {
    spec = await loadSpec('blog', 'posts');
    testArticles = await loadTestArticles();
  });

  test('記事詳細が表示される', async ({ page }) => {
    const article = testArticles[0];
    await page.goto(`/blog/${article.slug}`);
    await expect(page.getByText(article.category)).toBeVisible();
  });
});
```

---

## Spec Loader の使い分け

| 場所 | ローダー | import文 |
|-----|---------|----------|
| Route loader/action | `specLoader.server` | `import { loadSpec } from '~/spec-utils/specLoader.server'` |
| lib層 | `specLoader.server` | `import { loadSpec } from '~/spec-utils/specLoader.server'` |
| Vitest | `loadSpec.ts` | `import { loadSpec } from 'tests/utils/loadSpec'` |
| Playwright E2E | `loadSpec.ts` | `import { loadSpec } from 'tests/utils/loadSpec'` |

---

## ファイルパスとSpecの対応

| パス | 使用するspec |
|-----|-------------|
| `app/routes/blog/posts.*` | `blog/posts-spec.yaml` |
| `app/routes/blog/$slug.*` | `blog/post-detail-spec.yaml` |
| `app/routes/blog/_index.*` | `blog/common-spec.yaml` |
| `app/routes/account/login.*` | `account/authentication-spec.yaml` |
| `app/routes/account/profile.*` | `account/profile-spec.yaml` |
| `app/routes/account/subscription.*` | `account/subscription-spec.yaml` |
| `tests/e2e/blog/*` | `blog/posts-spec.yaml` または `blog/post-detail-spec.yaml` |
| `tests/e2e/account/*` | 対応する `account/*-spec.yaml` |

---

## よくある間違い

### 1. テスト側でサーバー用ローダーを使用

```typescript
// ❌ 間違い
import { loadSpec } from '~/spec-utils/specLoader.server';

// ✅ 正しい
import { loadSpec } from 'tests/utils/loadSpec';
```

### 2. 非同期処理の忘れ（テスト側）

```typescript
// ❌ 間違い（awaitなし）
const spec = loadSpec('blog', 'posts');

// ✅ 正しい
const spec = await loadSpec('blog', 'posts');
```

### 3. 型定義の未import

```typescript
// ❌ 間違い（型なし）
const spec = loadSpec('blog/posts');

// ✅ 正しい
import type { BlogPostsSpec } from '~/specs/blog/types';
const spec = loadSpec<BlogPostsSpec>('blog/posts');
```
