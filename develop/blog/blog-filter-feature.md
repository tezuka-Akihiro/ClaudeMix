# 【機能修正提案】ブログフィルタ機能の追加（カテゴリ + タグ）

- **サービス**: `blog`
- **セクション**: `posts`（記事一覧ページ）
- **関連ドキュメント**:
  - `develop/blog-metadata-enhancement.md`（前提条件）
  - `app/routes/blog._index.tsx`
  - `app/data-io/blog/posts/fetchPosts.server.ts`
  - `app/lib/blog/posts/filterPosts.ts`（新規作成予定）
  - `app/components/blog/posts/PostsSection.tsx`

---

## 1. 提案概要

記事一覧ページに **カテゴリフィルタ** と **タグフィルタ** を追加し、ユーザーが目的の記事を素早く発見できる検索体験を提供します。

> **前提条件**: この機能は `blog-metadata-enhancement.md` で定義された `tags` フィールドの追加が完了していることを前提とします。

---

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

#### 記事一覧ページ（blog._index.tsx）
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const postsPerPage = 10;
  const { posts, total } = await fetchPosts({
    limit: postsPerPage,
    offset: (page - 1) * postsPerPage
  });
  // ...
}
```

#### fetchPosts（副作用層）
```typescript
export async function fetchPosts(
  options?: FetchPostsOptions
): Promise<FetchPostsResult> {
  const allPosts = getAllPosts();

  const posts: PostSummary[] = allPosts.map(post => ({
    slug: post.slug,
    title: post.frontmatter.title,
    publishedAt: post.frontmatter.publishedAt,
    category: post.frontmatter.category,
  }));

  // ページネーションのみ実装
  const limit = options?.limit ?? posts.length;
  const offset = options?.offset ?? 0;
  const paginatedPosts = posts.slice(offset, offset + limit);

  return { posts: paginatedPosts, total: posts.length };
}
```

#### 問題点
1. **フィルタリング機能がない**: すべての記事が表示され、目的の記事を探すのに時間がかかる
2. **カテゴリが表示されるだけ**: PostCardに`category`が表示されるが、クリックしてもフィルタリングされない
3. **タグの活用不足**: タグフィールドを追加しても、検索に利用されていない
4. **URLクエリパラメータ未対応**: `?category=...&tags=...` のようなフィルタ状態の永続化ができない

---

### 修正後 (To-Be)

#### URL設計
```
# カテゴリでフィルタ
/blog?category=ClaudeMix%20Philosophy

# タグでフィルタ（複数選択可能）
/blog?tags=Remix,Cloudflare

# カテゴリ + タグの複合フィルタ
/blog?category=Tutorials&tags=Remix,AI

# ページネーション + フィルタ
/blog?category=Tutorials&tags=Remix&page=2
```

#### 記事一覧ページ（blog._index.tsx）
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const categoryFilter = url.searchParams.get('category') ?? undefined;
  const tagsFilter = url.searchParams.get('tags')?.split(',') ?? undefined;

  const postsPerPage = 10;
  const { posts, total } = await fetchPosts({
    limit: postsPerPage,
    offset: (page - 1) * postsPerPage,
    category: categoryFilter,    // 追加
    tags: tagsFilter,            // 追加
  });

  // 利用可能なカテゴリとタグの一覧を取得（フィルタUIに使用）
  const { categories, tags } = await fetchAvailableFilters();

  return json({
    posts,
    pagination: { currentPage: page, totalPages: Math.ceil(total / postsPerPage) },
    filters: {
      availableCategories: categories,
      availableTags: tags,
      selectedCategory: categoryFilter,
      selectedTags: tagsFilter,
    },
  });
}
```

#### fetchPosts（副作用層）
```typescript
export interface FetchPostsOptions {
  limit?: number;
  offset?: number;
  category?: string;   // 追加
  tags?: string[];     // 追加
}

export async function fetchPosts(
  options?: FetchPostsOptions
): Promise<FetchPostsResult> {
  const allPosts = getAllPosts();

  // PostSummary形式に変換
  let posts: PostSummary[] = allPosts.map(post => ({
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    publishedAt: post.frontmatter.publishedAt,
    category: post.frontmatter.category,
    tags: post.frontmatter.tags,
  }));

  // ★ フィルタリング処理（純粋ロジック層に委譲）
  posts = filterPosts(posts, {
    category: options?.category,
    tags: options?.tags,
  });

  // ページネーション処理
  const limit = options?.limit ?? posts.length;
  const offset = options?.offset ?? 0;
  const paginatedPosts = posts.slice(offset, offset + limit);

  return { posts: paginatedPosts, total: posts.length };
}
```

#### filterPosts（純粋ロジック層: lib/blog/posts/filterPosts.ts）
```typescript
export interface FilterOptions {
  category?: string;
  tags?: string[];
}

/**
 * 記事一覧をフィルタリングする純粋関数
 */
export function filterPosts(
  posts: PostSummary[],
  filters: FilterOptions
): PostSummary[] {
  let result = posts;

  // カテゴリフィルタ
  if (filters.category) {
    result = result.filter(post => post.category === filters.category);
  }

  // タグフィルタ（AND条件: 指定されたすべてのタグを含む記事のみ）
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter(post =>
      filters.tags!.every(tag => post.tags.includes(tag))
    );
  }

  return result;
}
```

#### フィルタUIコンポーネント（新規: app/components/blog/posts/FilterPanel.tsx）
```tsx
interface FilterPanelProps {
  availableCategories: string[];
  availableTags: string[];
  selectedCategory?: string;
  selectedTags?: string[];
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  availableCategories,
  availableTags,
  selectedCategory,
  selectedTags = [],
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ背景 */}
      <div className="filter-overlay" onClick={onClose} />

      {/* モーダルパネル */}
      <aside className="filter-panel" data-testid="filter-panel">
        <Form method="get">
          {/* カテゴリセレクター */}
          <section className="filter-section">
            <h3>カテゴリ</h3>
            <select name="category" defaultValue={selectedCategory || ""}>
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </section>

          {/* タググリッド（トグルボタン） */}
          <section className="filter-section">
            <h3>タグ</h3>
            <TagGrid
              availableTags={availableTags}
              selectedTags={selectedTags}
            />
          </section>

          {/* 決定ボタン */}
          <button type="submit" onClick={onClose}>フィルタ適用</button>
        </Form>
      </aside>
    </>
  );
};
```

**TagGridコンポーネント**:
```tsx
const TagGrid: React.FC<{ availableTags: string[]; selectedTags: string[] }> = ({
  availableTags,
  selectedTags,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTags));

  return (
    <div className="tag-grid" data-testid="tag-grid">
      {availableTags.map(tag => (
        <button
          key={tag}
          type="button"
          aria-pressed={selected.has(tag)}
          onClick={() => {
            const newSelected = new Set(selected);
            if (newSelected.has(tag)) {
              newSelected.delete(tag);
            } else {
              newSelected.add(tag);
            }
            setSelected(newSelected);
          }}
        >
          {tag}
        </button>
      ))}
      {/* Hidden inputs for form submission */}
      {Array.from(selected).map(tag => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  );
};
```

#### 期待される効果
1. **記事発見性の向上**: ユーザーが興味のあるカテゴリ/タグで絞り込み、目的の記事にすぐアクセス可能
2. **URLでの状態共有**: フィルタ状態がURLに反映されるため、特定のフィルタ結果をブックマーク・共有可能
3. **段階的な絞り込み**: カテゴリ（大分類）→ タグ（詳細分類）の2段階でスムーズに絞り込める
4. **タグの可視化**: 利用可能なすべてのタグが一覧表示され、コンテンツの全体像が把握しやすい

---

## 3. 背景・目的

### 背景

現在のブログ一覧ページは以下の課題を抱えています：

1. **記事数の増加による発見性の低下**
   現在は13記事ですが、今後記事が50, 100と増えた場合、ページネーションだけでは目的の記事を探すのが困難になります。

2. **カテゴリが機能していない**
   PostCardに`category`が表示されているものの、クリックしても何も起きないため、カテゴリが単なる装飾になっています。

3. **タグの未活用**
   `blog-metadata-enhancement.md`でタグフィールドを追加しますが、検索機能がなければタグの価値が半減します。

4. **ユーザーの目的に応じた閲覧が困難**
   - 「Remixに関する記事だけ読みたい」
   - 「Cloudflare関連のトラブルシューティングを探したい」
   といったニーズに応えられません。

### 目的

- **目的1: 記事発見性の向上**
  カテゴリとタグによる2軸フィルタで、ユーザーが目的の記事を素早く発見できるようにする。

- **目的2: コンテンツの可視化**
  利用可能なカテゴリとタグを一覧表示することで、ブログ全体のコンテンツ構成を把握しやすくする。

- **目的3: URLベースの状態管理**
  フィルタ状態をURLクエリパラメータで管理し、特定のフィルタ結果をブックマーク・共有可能にする。

- **目的4: スケーラビリティの確保**
  記事数が増えても、フィルタ機能により快適な閲覧体験を維持できる基盤を構築する。

---

## 4. 妥当性と影響の評価

### 4.1. 変更の妥当性 (Pros / Cons)

`@ArchitectureGuardian` の視点に基づき、この変更がプロジェクトの設計思想に合致するかを評価します。

**👍 Pros (利点)**
- ✅ **3大層アーキテクチャの遵守**: フィルタロジックを純粋ロジック層（`filterPosts.ts`）に分離し、副作用層（`fetchPosts`）から呼び出す設計
- ✅ **URLベースの状態管理**: Remixの哲学に沿った、ブラウザの標準機能（URLクエリパラメータ）を活用した実装
- ✅ **TDDとの親和性**: `filterPosts`は純粋関数のため、単体テストが容易
- ✅ **段階的な機能拡張**: まずは基本的なANDフィルタを実装し、将来的にOR条件や範囲検索に拡張可能
- ✅ **ユーザー体験の大幅向上**: 記事数が増えても快適な閲覧体験を維持

**👎 Cons (懸念点)**
- ⚠️ **実装の複雑化**: loaderの処理が複雑になり、テストケースが増加
- ✅ **UI配置の決定**: フィルタパネルはモーダル/オーバーレイ形式に決定。FilterToggleButtonで開閉制御
- ⚠️ **パフォーマンス**: 現在はビルド時に生成された記事データをすべて読み込むため、記事数が1000を超えると遅延の可能性（ただし、当面は問題なし）
- ⚠️ **タグの粒度管理**: タグが無秩序に増えると、フィルタUIが煩雑になる可能性（→ `TAG_GUIDELINES.md`で管理）

**総合評価**:

Consは存在するものの、**ユーザー体験の向上**と**スケーラビリティの確保**という点で、この変更は**非常に妥当性が高い**と判断します。特に、純粋ロジック層での`filterPosts`実装により、3大層アーキテクチャを維持しながら機能追加できる点が優れています。

---

### 4.2. 影響範囲と複雑性

- **複雑性**: **中〜高**
  - フィルタロジックの実装自体はシンプルだが、URLクエリパラメータの処理、ページネーションとの連携、UIコンポーネントの配置設計など、考慮事項が多い。
  - 特に「フィルタ適用後もページネーションが正しく動作するか」のテストが重要。

- **影響範囲**:

    #### 🎨 **UI層 (components)**:
    - `app/components/blog/posts/FilterPanel.tsx`（新規作成）
      → カテゴリとタグのフィルタUIコンポーネント
    - `app/components/blog/posts/PostsSection.tsx`
      → `FilterPanel`を統合し、レイアウトを調整
    - `app/components/blog/posts/Pagination.tsx`
      → ページネーションリンクにフィルタパラメータを保持する処理を追加

    #### 🪨 **Route層 (routes)**:
    - `app/routes/blog._index.tsx`
      → loaderでクエリパラメータを解析し、フィルタオプションを`fetchPosts`に渡す
      → 利用可能なカテゴリ/タグの一覧を取得し、componentに渡す

    #### 🧠 **純粋ロジック層 (lib)**:
    - `app/lib/blog/posts/filterPosts.ts`（新規作成）
      → フィルタリングロジックを実装する純粋関数
    - `app/lib/blog/posts/filterPosts.test.ts`（新規作成）
      → `filterPosts`の単体テスト

    #### 🔌 **副作用層 (data-io)**:
    - `app/data-io/blog/posts/fetchPosts.server.ts`
      → `FetchPostsOptions`に`category`と`tags`を追加
      → `filterPosts`を呼び出してフィルタリングを実行
    - `app/data-io/blog/posts/fetchAvailableFilters.server.ts`（新規作成）
      → 利用可能なカテゴリとタグの一覧を取得する関数

    #### 🎨 **CSS実装**:
    - `app/styles/flow-auditor/layer3.ts`
      → `filter-panel`, `filter-section`のスタイル定義を追加

    #### 📝 **ドキュメント**:
    - `docs/blog/FILTER_FEATURE_SPEC.md`（新規作成推奨）
      → フィルタ機能の仕様書（URL設計、フィルタロジック、UI配置案）

---

## 5 設計フロー
以下の設計ドキュメントを上から順に確認し、編集内容を追記して。

### ✅ 🗾GUIDING_PRINCIPLES.md
**パス**: `develop/blog/GUIDING_PRINCIPLES.md`
**ステータス**: ✅ 完了（blog-metadata-enhancement.md と合わせて編集済み）

**編集内容**:
- **セクション1「目的とスコープ」**:
  - 主要機能に「記事フィルタリング（カテゴリ・タグによる絞り込み）」を追加
  - **範囲外**から「記事一覧のあらゆるフィルターやソート」を削除（カテゴリとタグによるフィルタは範囲内に変更）
- **セクション4「用語集」**: 以下の用語を追加
  - `Filter`: ユーザーが指定した条件に基づいて記事一覧を絞り込む機能
  - `Filter Panel`: カテゴリとタグを選択するためのUIコンポーネント
  - `Query Parameter`: URLの`?category=...&tags=...`のようなパラメータ。フィルタ状態を永続化する

---

### ✅ 📚️func-spec.md

#### ✅ posts（記事一覧）
**パス**: `develop/blog/posts/func-spec.md`
**ステータス**: ✅ 完了（blog-metadata-enhancement.md と合わせて編集済み）

**編集内容**:

1. **「基本機能」セクション**: 以下を追加
   ```markdown
   2. **記事フィルタリング**: カテゴリとタグによる記事の絞り込み
      - **FilterPanel**: モーダル/オーバーレイ形式（初期非表示、FilterToggleButtonで開閉）
      - **カテゴリフィルタ**: ドロップダウンセレクター、単一選択、デフォルト値は "All Categories"（空文字列）
      - **タグフィルタ**: グリッドレイアウトのトグルボタン、複数選択可能、AND条件。列数はspec.yamlで管理
      - **FilterSubmitButton**: 選択されたフィルタ条件を適用する決定ボタン
      - フィルタ状態はURLクエリパラメータで管理（例: ?category=Tutorials&tags=Remix,AI）
        - カテゴリが "All Categories" の場合、categoryパラメータは省略
      - フィルタ適用後もページネーションが正しく動作すること
      - クライアントサイドの状態管理（useState）でFilterPanelの開閉を制御
   ```

2. **「入力データ」セクション**: `PostsLoaderRequest`を拡張
   ```typescript
   interface PostsLoaderRequest {
     request: Request
     // URLクエリパラメータ:
     // - ?page=2
     // - ?category=Tutorials
     // - ?tags=Remix,Cloudflare
   }
   ```

3. **「出力データ」セクション**: `PostsLoaderData`を拡張
   ```typescript
   interface PostsLoaderData {
     posts: PostSummary[]
     pagination: PaginationData
     filters: FilterData // 追加
   }

   interface FilterData {
     availableCategories: string[] // 利用可能なカテゴリ一覧
     availableTags: string[]       // 利用可能なタグ一覧
     selectedCategory?: string     // 現在選択されているカテゴリ
     selectedTags?: string[]       // 現在選択されているタグ
   }
   ```

4. **「🪨Route層」セクション**: loaderでクエリパラメータを解析し、フィルタオプションを`fetchPosts`に渡す処理を追加

5. **「🧠純粋ロジック層」セクション（新規追加）**:
   ```markdown
   #### filterPosts（新規）
   - **ファイルパス**: `app/lib/blog/posts/filterPosts.ts`
   - **責務**: 記事一覧をフィルタリングする純粋関数
   - **入力**: `PostSummary[]`, `FilterOptions`
   - **出力**: フィルタリング後の`PostSummary[]`
   - **ロジック**:
     - カテゴリフィルタ: `post.category === filters.category`
     - タグフィルタ: `filters.tags.every(tag => post.tags.includes(tag))` (AND条件)
   ```

6. **「🔌副作用層」セクション**: `fetchPosts`に`category`と`tags`パラメータを追加し、`filterPosts`を呼び出す処理を追加

---

### ✅ 🖼️uiux-spec.md

#### ✅ posts（記事一覧）
**パス**: `develop/blog/posts/uiux-spec.md`
**ステータス**: ✅ 完了

**編集内容**:

1. **「FilterPanel コンポーネント」セクション（新規追加）**:
   ```markdown
   ### FilterPanel コンポーネント

   **形式**: モーダル/オーバーレイ形式（全画面、z-indexで前面表示）
   **初期状態**: 非表示（FilterToggleButtonで開閉）

   **構成要素**:
   1. **FilterToggleButton**:
      - 記事一覧の一番上に配置
      - クリックでFilterPanelを開閉

   2. **CategorySelector**:
      - `<select>` 要素（ドロップダウンセレクター）
      - デフォルトオプション: `<option value="">All Categories</option>`
      - 単一選択

   3. **TagGrid**:
      - グリッドレイアウト（列数はspec.yamlで管理）
      - タグボタン（`<button type="button">`）でトグル選択
      - 選択/非選択を視覚的に表現（背景色・ボーダー変化）
      - aria-pressed属性でアクセシビリティ対応
      - 複数選択可能、AND条件

   4. **FilterSubmitButton**:
      - 決定ボタン（Formをsubmit）
      - クリック後、パネルを閉じる

   **インタラクション**:
   - オーバーレイ背景クリックでパネルを閉じる
   - フェードイン/フェードアウトアニメーション
   ```

2. **「状態管理」**:
   - PostsSectionでuseStateを使用してFilterPanelの開閉状態を管理
   - `const [isPanelOpen, setIsPanelOpen] = useState(false);`

---

### ✅ 📋️spec.yaml

#### ✅ posts（記事一覧）
**パス**: `develop/blog/posts/spec.yaml`
**ステータス**: ✅ 完了

**編集内容**:

1. **`filters`セクション（新規追加）**: フィルタ関連のテストデータを定義
   ```yaml
   filters:
     availableCategories:
       - "ClaudeMix Philosophy"
       - "Tutorials & Use Cases"
       - "Architecture & Design"
     availableTags:
       - "Remix"
       - "Cloudflare"
       - "AI"
       - "Testing"
       - "Architecture"
       - "TDD"

     # テストケース1: カテゴリフィルタのみ
     testCase1:
       selectedCategory: "Tutorials & Use Cases"
       expectedPostCount: 5

     # テストケース2: タグフィルタのみ（AND条件）
     testCase2:
       selectedTags: ["Remix", "Cloudflare"]
       expectedPostCount: 3

     # テストケース3: カテゴリ + タグの複合フィルタ
     testCase3:
       selectedCategory: "Tutorials & Use Cases"
       selectedTags: ["Remix"]
       expectedPostCount: 2
   ```

2. **`urlPatterns`セクション（新規追加）**: フィルタURLのテストパターンを定義
   ```yaml
   urlPatterns:
     - path: "/blog?category=Tutorials%20%26%20Use%20Cases"
       description: "カテゴリフィルタのみ"
     - path: "/blog?tags=Remix,Cloudflare"
       description: "タグフィルタのみ"
     - path: "/blog?category=Tutorials&tags=Remix&page=2"
       description: "カテゴリ + タグ + ページネーション"
   ```

---

### ✅ 🗂️file_list.md

#### ✅ posts（記事一覧）
**パス**: `develop/blog/posts/file-list.md`
**ステータス**: ✅ 完了

**編集内容**:

1. **新規ファイル追加**:
   ```markdown
   ## 🎨 UI層（components）
   - `app/components/blog/posts/FilterPanel.tsx` 【新規】
     - カテゴリとタグのフィルタUIコンポーネント
   - `app/components/blog/posts/FilterPanel.test.tsx` 【新規】
     - FilterPanelの単体テスト

   - `app/lib/blog/posts/filterPosts.ts` 【新規】
   ## 🧠 純粋ロジック層（lib）
     - 記事一覧をフィルタリングする純粋関数
   - `app/lib/blog/posts/filterPosts.test.ts` 【新規】
     - filterPosts関数の単体テスト

   ## 🔌 副作用層（data-io）
   - `app/data-io/blog/posts/fetchAvailableFilters.server.ts` 【新規】
     - 利用可能なカテゴリとタグの一覧を取得する関数
   - `app/data-io/blog/posts/fetchAvailableFilters.server.test.ts` 【新規】
     - fetchAvailableFiltersのテスト
   ```

2. **既存ファイルの変更**:
   ```markdown
   ## 変更ファイル
   - `app/routes/blog._index.tsx` 【変更】
     - loaderでクエリパラメータを解析し、フィルタオプションを渡す
     - FilterPanelコンポーネントを統合
   - `app/data-io/blog/posts/fetchPosts.server.ts` 【変更】
     - `FetchPostsOptions`に`category`と`tags`を追加
     - `filterPosts`を呼び出してフィルタリングを実行
   - `app/components/blog/posts/PostsSection.tsx` 【変更】
     - FilterPanelを表示するレイアウト調整
   - `app/components/blog/posts/Pagination.tsx` 【変更】
     - ページネーションリンクにフィルタパラメータを保持
   ```

---

### ✅ 🧬data-flow-diagram.md

#### ✅ posts（記事一覧）
**パス**: `develop/blog/posts/data-flow-diagram.md`
**ステータス**: ✅ 完了（blog-metadata-enhancement.md と合わせて編集済み）

**編集内容**:

**データフロー図**: フィルタリング処理のフローを追加

```mermaid
graph TD
    A[User: フィルタを選択] -->|FormをSubmit| B[blog._index loader]
    B -->|URLクエリパラメータを解析| C{category or tags?}
    C -->|Yes| D[fetchPosts with filters]
    C -->|No| E[fetchPosts without filters]

    D --> F[getAllPosts]
    E --> F

    F --> G[PostSummary[]に変換]
    G --> H[filterPosts lib関数]
    H -->|フィルタ適用| I[フィルタ後のPostSummary[]]
    I --> J[ページネーション処理]
    J --> K[PostsSection Component]

    B --> L[fetchAvailableFilters]
    L --> M[availableCategories, availableTags]
    M --> N[FilterPanel Component]

    K --> O[PostCardを表示]
    N --> P[フィルタUIを表示]
```

**追加する説明**:
1. URLクエリパラメータ（`?category=...&tags=...`）をloaderで解析
2. `fetchPosts`に`category`と`tags`を渡す
3. `getAllPosts()`で全記事を取得後、`filterPosts`（純粋ロジック層）でフィルタリング
4. フィルタ後の結果をページネーション処理
5. FilterPanelには利用可能なカテゴリとタグの一覧を渡す

## 6 TDD_WORK_FLOW.md 簡易版
以下の全項目に対して、実際のパスと編集内容を1行で記載して。
完全な計画ではなく、大枠がわかればよい。
新規ファイル作成は「scripts/generate/README.md」を厳守して作成内容まで固めて。
### 👁️e2e-screen-test
### 👁️e2e-section-test
### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)
### 🪨route
### 🚧components.test
### 🪨components
### 🚧logic.test
### 🪨logic
### 🚧data-io.test
### 🪨data-io
### その他
