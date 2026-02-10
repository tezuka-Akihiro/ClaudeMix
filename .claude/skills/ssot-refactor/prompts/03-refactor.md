# Phase 3: Spec Loader 導入リファクタリング

## 目的

Phase 2の分析結果に基づき、各ファイルにspec loaderを導入する。

## リファクタリング手順

### 1. 実装ファイル（Route loader/action）

#### Step 1: import追加

```typescript
// ファイル先頭に追加
import { loadSpec, loadSharedSpec } from '~/spec-utils/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';
```

#### Step 2: loader/action内でspec取得

```typescript
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<BlogPostsSpec>('blog/posts');

  // 以降、specを使用
}
```

#### Step 3: ハードコード値を置換

```typescript
// Before
return json({ error: "記事の取得に失敗しました" });

// After
return json({ error: spec.messages.error.fetch_failed });
```

```typescript
// Before
const displayPosts = posts.slice(0, 6);

// After
const displayPosts = posts.slice(0, spec.business_rules.load_more.initial_load);
```

---

### 2. テストファイル（Vitest）

#### Step 1: import追加

```typescript
// ファイル先頭に追加
import { loadSpec, loadTestArticles } from 'tests/utils/loadSpec';
```

#### Step 2: テスト内でspec取得

```typescript
describe('Posts', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadSpec('blog', 'posts');
  });

  test('カテゴリが表示される', () => {
    // specを使用
  });
});
```

#### Step 3: 具体値アサートを置換

```typescript
// Before
expect(screen.getByText('Claude Best Practices')).toBeInTheDocument();

// After
expect(screen.getByText(spec.categories[0].name)).toBeInTheDocument();
```

---

### 3. テストファイル（Playwright E2E）

#### Step 1: import追加

```typescript
import { loadSpec, loadTestArticles } from 'tests/utils/loadSpec';
```

#### Step 2: テスト内でspec取得

```typescript
test.describe('Blog Posts', () => {
  let spec: BlogPostsSpec;
  let testArticles: TestArticleFrontmatter[];

  test.beforeAll(async () => {
    spec = await loadSpec('blog', 'posts');
    testArticles = await loadTestArticles();
  });

  test('記事一覧が表示される', async ({ page }) => {
    // spec, testArticlesを使用
  });
});
```

#### Step 3: テスト記事の使用

```typescript
// Before（本番記事を使用）
await page.goto('/blog/CLAUDEmd-guide');

// After（テスト記事を使用）
const testArticle = testArticles[0];
await page.goto(`/blog/${testArticle.slug}`);
```

---

## リファクタリングチェックリスト

### 実装ファイル
- [ ] `loadSpec` / `loadSharedSpec` をimport
- [ ] 型定義をimport
- [ ] loader/action内でspec取得
- [ ] 日本語文字列をspec参照に置換
- [ ] マジックナンバーをspec参照に置換
- [ ] data-testidをspec参照に置換（該当する場合）

### テストファイル
- [ ] `tests/utils/loadSpec` をimport
- [ ] beforeAll/beforeEachでspec取得
- [ ] 具体値アサートをspec参照に置換
- [ ] 本番記事をテスト記事に置換
- [ ] `toHaveStyle()` を削除（該当する場合）

---

## 次フェーズへの遷移

リファクタリング完了後、自動的に Phase 4: 検証 へ遷移する。
