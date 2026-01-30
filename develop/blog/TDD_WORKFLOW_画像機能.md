# TDDワークフロー: ブログ画像機能追加

**関連提案書**: `【機能修正提案】ブログ画像機能追加.md`

---

## 実装順序の原則

3大層分離アーキテクチャに基づき、**依存関係の方向（下層 → 上層）**の順で実装します。

```
[Pure Logic層] → [Data-IO層] → [UI層] → [Route層] → [E2Eテスト]
```

各層内では **Red → Green → Refactor** のTDDサイクルを厳守します。

---

## Phase 3.1: Pure Logic層（lib）

### 3.1.1 buildThumbnailUrl.test.ts（テスト先行）

**ファイル**: `app/lib/blog/common/buildThumbnailUrl.test.ts`

```typescript
// テストケース
describe('buildThumbnailUrl', () => {
  describe('サムネイルURL生成', () => {
    it('slugからサムネイルURLを生成する', () => {
      // Input: 'stripe-integration'
      // Expected: 'https://assets.claudemix.dev/blog/stripe-integration/thumbnail.webp'
    });

    it('日本語slugも正しく処理する', () => {
      // Input: 'はじめてのremix'
      // Expected: エンコードされたURL
    });

    it('空文字slugはnullを返す', () => {
      // Input: ''
      // Expected: null
    });
  });

  describe('記事内画像URL生成', () => {
    it('slug + 番号から画像URLを生成する', () => {
      // Input: 'stripe-integration', 1
      // Expected: 'https://assets.claudemix.dev/blog/stripe-integration/1.webp'
    });

    it('番号が1-9の範囲外ならnullを返す', () => {
      // Input: 'slug', 10
      // Expected: null
    });
  });
});
```

### 3.1.2 buildThumbnailUrl.ts（実装）

**ファイル**: `app/lib/blog/common/buildThumbnailUrl.ts`

```typescript
// 実装内容
export function buildThumbnailUrl(slug: string): string | null;
export function buildArticleImageUrl(slug: string, imageNumber: number): string | null;

// spec.yamlから読み込む設定
// - r2_assets.base_url
// - r2_assets.blog_path
// - r2_assets.thumbnail.filename
```

**依存**: `app/specs/blog/common-spec.yaml`

---

## Phase 3.2: CSS実装

### 3.2.1 blog.css（スタイル追加）

**ファイル**: `app/styles/layer2-sections/blog.css`

```css
/* 追加するスタイル */

/* サムネイルコンテナ（CLS対策） */
.thumbnail-container {
  aspect-ratio: 1200 / 630;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
}

.thumbnail-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 記事詳細用サムネイル */
.article-thumbnail-container {
  aspect-ratio: 1200 / 630;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 2rem;
  overflow: hidden;
  border-radius: 8px;
}

.article-thumbnail-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## Phase 3.3: 型定義更新

### 3.3.1 types.ts

**ファイル**: `app/specs/blog/types.ts`

```typescript
// PostSummary型に追加
export interface PostSummary {
  slug: string;
  title: string;
  publishedAt: string;
  category: string;
  tags: string[];
  thumbnailUrl: string | null;  // ← 追加
}

// PostDetail型に追加（必要に応じて）
export interface PostDetail {
  // ... existing fields
  thumbnailUrl: string | null;  // ← 追加
}
```

---

## Phase 3.4: Data-IO層

### 3.4.1 fetchPosts.server.test.ts（テスト追加）

**ファイル**: `app/data-io/blog/posts/fetchPosts.server.test.ts`

```typescript
// 追加テストケース
describe('fetchPosts thumbnailUrl', () => {
  it('各記事にthumbnailUrlを付与する', () => {
    // PostSummary[].thumbnailUrl が正しく設定されていることを確認
  });

  it('thumbnailUrlはbuildThumbnailUrlで生成される', () => {
    // slugに基づいたURLが生成されていることを確認
  });
});
```

### 3.4.2 fetchPosts.server.ts（実装更新）

**ファイル**: `app/data-io/blog/posts/fetchPosts.server.ts`

```typescript
// 変更内容
import { buildThumbnailUrl } from '~/lib/blog/common/buildThumbnailUrl';

// PostSummary生成時にthumbnailUrlを追加
const posts: PostSummary[] = rawPosts.map(post => ({
  ...post,
  thumbnailUrl: buildThumbnailUrl(post.slug),
}));
```

### 3.4.3 fetchPostBySlug.server.test.ts（テスト追加）

**ファイル**: `app/data-io/blog/post-detail/fetchPostBySlug.server.test.ts`

```typescript
// 追加テストケース
describe('fetchPostBySlug thumbnailUrl', () => {
  it('記事詳細にthumbnailUrlを付与する', () => {
    // PostDetail.thumbnailUrl が正しく設定されていることを確認
  });
});
```

### 3.4.4 fetchPostBySlug.server.ts（実装更新）

**ファイル**: `app/data-io/blog/post-detail/fetchPostBySlug.server.ts`

```typescript
// 変更内容
import { buildThumbnailUrl } from '~/lib/blog/common/buildThumbnailUrl';

// PostDetail生成時にthumbnailUrlを追加
return {
  ...postData,
  thumbnailUrl: buildThumbnailUrl(slug),
};
```

---

## Phase 3.5: UI層（Components）

### 3.5.1 PostCard.test.tsx（テスト追加）

**ファイル**: `app/components/blog/posts/PostCard.test.tsx`

```typescript
// 追加テストケース
describe('PostCard thumbnail', () => {
  it('thumbnailUrlがある場合、画像を表示する', () => {
    // <img> タグが存在することを確認
    // src属性が正しいことを確認
    // loading="lazy" が設定されていることを確認
  });

  it('thumbnailUrlがnullの場合、画像を表示しない', () => {
    // <img> タグが存在しないことを確認
  });

  it('画像コンテナにCLS対策のクラスが適用されている', () => {
    // .thumbnail-container クラスが存在することを確認
  });
});
```

### 3.5.2 PostCard.tsx（実装更新）

**ファイル**: `app/components/blog/posts/PostCard.tsx`

```tsx
// 変更内容
interface PostCardProps {
  // ... existing props
  thumbnailUrl: string | null;
}

// JSX追加
{thumbnailUrl && (
  <div className="thumbnail-container" data-testid="thumbnail-container">
    <img
      src={thumbnailUrl}
      alt={`${title}のサムネイル`}
      loading="lazy"
      decoding="async"
      data-testid="thumbnail-image"
    />
  </div>
)}
```

### 3.5.3 PostDetailSection.test.tsx（テスト追加）

**ファイル**: `app/components/blog/post-detail/PostDetailSection.test.tsx`

```typescript
// 追加テストケース
describe('PostDetailSection thumbnail', () => {
  it('thumbnailUrlがある場合、記事ヘッダーに画像を表示する', () => {
    // <img> タグが存在することを確認
  });

  it('thumbnailUrlがnullの場合、画像を表示しない', () => {
    // <img> タグが存在しないことを確認
  });
});
```

### 3.5.4 PostDetailSection.tsx（実装更新）

**ファイル**: `app/components/blog/post-detail/PostDetailSection.tsx`

```tsx
// 変更内容
interface PostDetailSectionProps {
  // ... existing props
  thumbnailUrl: string | null;
}

// JSX追加（記事ヘッダー内）
{thumbnailUrl && (
  <div className="article-thumbnail-container" data-testid="article-thumbnail-container">
    <img
      src={thumbnailUrl}
      alt={`${title}のサムネイル`}
      loading="lazy"
      decoding="async"
      data-testid="article-thumbnail-image"
    />
  </div>
)}
```

---

## Phase 3.6: Route層更新

### 3.6.1 blog._index.tsx

**ファイル**: `app/routes/blog._index.tsx`

```typescript
// loader変更
// fetchPostsの戻り値にthumbnailUrlが含まれるようになるため、
// loaderの変更は不要（自動的に含まれる）

// UIへのprops渡しを確認
// PostCardにthumbnailUrlを渡す
```

### 3.6.2 blog.$slug.tsx

**ファイル**: `app/routes/blog.$slug.tsx`

```typescript
// loader変更
// fetchPostBySlugの戻り値にthumbnailUrlが含まれるようになるため、
// loaderの変更は不要（自動的に含まれる）

// UIへのprops渡しを確認
// PostDetailSectionにthumbnailUrlを渡す
```

---

## Phase 3.7: ビルド・テスト確認

### 3.7.1 実行コマンド

```bash
# 1. 型チェック
npm run typecheck

# 2. ユニットテスト
npm test

# 3. Lint
npm run lint:all

# 4. ビルド確認
npm run build
```

### 3.7.2 成功基準

- [ ] TypeScriptエラーなし
- [ ] 全ユニットテストパス
- [ ] Lint警告・エラーなし
- [ ] ビルド成功

---

## Phase 3.8: E2Eテスト

### 3.8.1 posts.spec.ts（既存ファイルに追加）

**ファイル**: `tests/e2e/blog/posts.spec.ts`

```typescript
// 既存のテストスイート内に追加

/**
 * Posts: サムネイル画像の表示テスト
 * @description
 * R2からのサムネイル画像が正しく表示されることを検証
 */
test('Posts: サムネイル画像が表示される（存在する場合）', async ({ page }) => {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // 1. 記事カードを取得
  const postsSection = page.getByTestId('posts-section');
  const postCards = postsSection.getByTestId('post-card');
  const postCount = await postCards.count();
  expect(postCount).toBeGreaterThan(0);

  // 2. サムネイルコンテナが存在するカードを確認
  for (let i = 0; i < Math.min(postCount, 3); i++) {
    const card = postCards.nth(i);
    const thumbnailContainer = card.getByTestId('thumbnail-container');
    const containerCount = await thumbnailContainer.count();

    if (containerCount > 0) {
      // サムネイルが存在する場合のテスト
      await expect(thumbnailContainer).toBeVisible();

      // 3. 画像要素が正しく設定されている
      const thumbnailImage = card.getByTestId('thumbnail-image');
      await expect(thumbnailImage).toBeVisible();

      // 4. loading="lazy"属性が設定されている（CLS対策）
      await expect(thumbnailImage).toHaveAttribute('loading', 'lazy');

      // 5. src属性がR2のURLパターンに一致
      const src = await thumbnailImage.getAttribute('src');
      expect(src).toMatch(/\/blog\/[^/]+\/thumbnail\.webp$/);
    }
  }
});

/**
 * Posts: サムネイル未設定時の表示テスト
 * @description
 * サムネイルが存在しない記事ではサムネイルコンテナが表示されないことを検証
 */
test('Posts: サムネイル未設定時は画像コンテナが非表示', async ({ page }) => {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // 記事カードを取得
  const postsSection = page.getByTestId('posts-section');
  const postCards = postsSection.getByTestId('post-card');
  const postCount = await postCards.count();

  // サムネイルコンテナがないカードでは、thumbnail-containerが存在しないことを確認
  for (let i = 0; i < Math.min(postCount, 3); i++) {
    const card = postCards.nth(i);
    const thumbnailContainer = card.getByTestId('thumbnail-container');
    const containerCount = await thumbnailContainer.count();

    if (containerCount === 0) {
      // サムネイルがない場合、コンテナ自体が存在しない
      await expect(thumbnailContainer).not.toBeVisible();
    }
  }
});

/**
 * Posts: サムネイル画像のCLS対策確認
 * @description
 * サムネイルコンテナにaspect-ratioが設定されていることを検証
 */
test('Posts: サムネイルコンテナにCLS対策が適用されている', async ({ page }) => {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  const postsSection = page.getByTestId('posts-section');
  const thumbnailContainer = postsSection.getByTestId('thumbnail-container').first();

  if (await thumbnailContainer.count() > 0) {
    // aspect-ratioが設定されていることを確認
    const aspectRatio = await thumbnailContainer.evaluate((el) => {
      return window.getComputedStyle(el).aspectRatio;
    });
    // 1200/630 ≈ 1.905
    expect(aspectRatio).toMatch(/1200\s*\/\s*630|1\.9/);
  }
});
```

### 3.8.2 post-detail.spec.ts（既存ファイルに追加）

**ファイル**: `tests/e2e/blog/post-detail.spec.ts`

```typescript
// 既存のテストスイート内に追加

/**
 * Post Detail: サムネイル画像の表示テスト
 * @description
 * 記事詳細ページでR2からのサムネイル画像が正しく表示されることを検証
 */
test('Post Detail: サムネイル画像が記事ヘッダーに表示される（存在する場合）', async ({ page }) => {
  const TEST_SLUG = testArticleSlug;
  const TARGET_URL = `/blog/${TEST_SLUG}`;

  // 1. 記事詳細ページにアクセス
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // 2. PostDetailSectionが表示されること
  await expect(page.locator('[data-testid="post-detail-section"]')).toBeVisible();

  // 3. サムネイルコンテナを確認
  const thumbnailContainer = page.locator('[data-testid="article-thumbnail-container"]');
  const containerCount = await thumbnailContainer.count();

  if (containerCount > 0) {
    // サムネイルが存在する場合
    await expect(thumbnailContainer).toBeVisible();

    // 4. 画像要素が正しく設定されている
    const thumbnailImage = page.locator('[data-testid="article-thumbnail-image"]');
    await expect(thumbnailImage).toBeVisible();

    // 5. loading="lazy"属性が設定されている
    await expect(thumbnailImage).toHaveAttribute('loading', 'lazy');

    // 6. src属性がR2のURLパターンに一致
    const src = await thumbnailImage.getAttribute('src');
    expect(src).toMatch(/\/blog\/[^/]+\/thumbnail\.webp$/);
  }
});

/**
 * Post Detail: サムネイル画像のCLS対策確認
 * @description
 * サムネイルコンテナにaspect-ratioが設定されていることを検証
 */
test('Post Detail: サムネイルコンテナにCLS対策が適用されている', async ({ page }) => {
  const TEST_SLUG = testArticleSlug;
  const TARGET_URL = `/blog/${TEST_SLUG}`;

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  const thumbnailContainer = page.locator('[data-testid="article-thumbnail-container"]');

  if (await thumbnailContainer.count() > 0) {
    // aspect-ratioが設定されていることを確認
    const aspectRatio = await thumbnailContainer.evaluate((el) => {
      return window.getComputedStyle(el).aspectRatio;
    });
    // 1200/630 ≈ 1.905
    expect(aspectRatio).toMatch(/1200\s*\/\s*630|1\.9/);
  }
});

/**
 * Post Detail: サムネイル未設定時の表示テスト
 * @description
 * サムネイルが存在しない記事ではサムネイルコンテナが表示されないことを検証
 */
test('Post Detail: サムネイル未設定時は画像コンテナが非表示', async ({ page }) => {
  // サムネイルがない記事でテスト（例: test-e2e-no-tags）
  const TEST_SLUG = 'test-e2e-no-tags';
  const TARGET_URL = `/blog/${TEST_SLUG}`;

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // サムネイルコンテナが存在しないことを確認
  const thumbnailContainer = page.locator('[data-testid="article-thumbnail-container"]');
  await expect(thumbnailContainer).not.toBeVisible();
});
```

### 3.8.3 E2Eテスト実行コマンド

```bash
# サムネイル関連のE2Eテストのみ実行
npx playwright test tests/e2e/blog/posts.spec.ts tests/e2e/blog/post-detail.spec.ts --grep "サムネイル"

# ブログ全体のE2Eテスト実行
npx playwright test tests/e2e/blog/
```

### 3.8.4 E2E成功基準

- [ ] posts.spec.ts: サムネイル表示テストパス
- [ ] posts.spec.ts: サムネイル未設定テストパス
- [ ] posts.spec.ts: CLS対策テストパス
- [ ] post-detail.spec.ts: サムネイル表示テストパス
- [ ] post-detail.spec.ts: CLS対策テストパス
- [ ] post-detail.spec.ts: サムネイル未設定テストパス

---

## 実装チェックリスト

| Phase | ファイル | 種別 | ステータス |
|-------|---------|------|-----------|
| 3.1.1 | `buildThumbnailUrl.test.ts` | テスト | ⬜ |
| 3.1.2 | `buildThumbnailUrl.ts` | 実装 | ⬜ |
| 3.2.1 | `blog.css` | CSS | ⬜ |
| 3.3.1 | `types.ts` | 型定義 | ⬜ |
| 3.4.1 | `fetchPosts.server.test.ts` | テスト | ⬜ |
| 3.4.2 | `fetchPosts.server.ts` | 実装 | ⬜ |
| 3.4.3 | `fetchPostBySlug.server.test.ts` | テスト | ⬜ |
| 3.4.4 | `fetchPostBySlug.server.ts` | 実装 | ⬜ |
| 3.5.1 | `PostCard.test.tsx` | テスト | ⬜ |
| 3.5.2 | `PostCard.tsx` | 実装 | ⬜ |
| 3.5.3 | `PostDetailSection.test.tsx` | テスト | ⬜ |
| 3.5.4 | `PostDetailSection.tsx` | 実装 | ⬜ |
| 3.6.1 | `blog._index.tsx` | Route | ⬜ |
| 3.6.2 | `blog.$slug.tsx` | Route | ⬜ |
| 3.7.1 | typecheck / test / lint / build | 確認 | ⬜ |
| 3.8.1 | `posts.spec.ts` | E2E | ⬜ |
| 3.8.2 | `post-detail.spec.ts` | E2E | ⬜ |
| 3.8.3 | E2Eテスト実行 | 確認 | ⬜ |

---

## 注意事項

1. **テスト先行**: 各実装ファイルの前に、必ず対応するテストファイルを作成・更新する
2. **段階的コミット**: 各Phaseが完了したらコミットする
3. **エラー即修正**: テスト失敗やビルドエラーは即座に修正し、次のPhaseに進まない
4. **spec.yaml参照**: ハードコーディング禁止。設定値はspec.yamlから取得する

---

## 承認依頼

上記TDDワークフローの内容を確認いただき、問題なければ実装を開始します。

- 実装順序
- テストケースの網羅性
- ファイル構成

についてご確認ください。
