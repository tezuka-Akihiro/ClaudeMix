# TDD作業手順書: Blog記事一覧のメタデータ拡張とフィルタ機能

## 1. 概要

**開発名**: Blog記事一覧のメタデータ拡張とフィルタ機能の実装
**目的**:

1. **メタデータ拡張**: 記事に `description` と `tags` フィールドを追加し、SEO対策とコンテンツ検索性を向上させる
2. **フィルタ機能**: カテゴリとタグによる記事絞り込み機能を提供し、ユーザーが目的の記事を効率的に探せるようにする

**実装対象機能**:

- `blog-metadata-enhancement.md`: description と tags フィールドの追加
- `blog-filter-feature.md`: モーダル形式のフィルタパネル (CategorySelector + TagGrid)

**実装順序**: メタデータ拡張 → フィルタ機能（依存関係: フィルタ機能は tags フィールドに依存）

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1. **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2. **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3. **E2E拡張**: 最初のE2Eテストが成功した後、エラーケースや境界値などの詳細なE2Eテストを追加し、品質を盤石にします。

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義) ✅完了

**目的**: 実装のゴールを定義するための失敗するE2Eテストを作成

#### 1.1 メタデータ拡張のE2Eテスト作成

- **対象ファイル**: `tests/e2e/screen/blog.screen.spec.ts` (既存ファイルに追記)
- **テストシナリオ**:
  1. **記事一覧画面でのメタデータ表示**:
     - `/blog` ページにアクセス
     - 各記事カードに `description` が表示されること
     - 各記事カードに `tags` がピル型バッジで表示されること
     - タグバッジには `[data-testid='tag-badge']` が付与されていること
  2. **記事詳細画面でのメタデータ表示**:
     - `/blog/remix-tips-2024` にアクセス
     - 記事詳細に `description` が表示されること
     - 記事詳細に `tags` がピル型バッジで表示されること

#### 1.2 フィルタ機能のE2Eテスト作成

- **対象ファイル**: `tests/e2e/screen/blog.screen.spec.ts` (既存ファイルに追記)
- **テストシナリオ** (Happy Path):
  1. **FilterToggleButton表示確認**:
     - `/blog` ページにアクセス
     - `[data-testid='filter-toggle-button']` が記事一覧の一番上に表示されること
  2. **FilterPanel開閉確認**:
     - FilterToggleButton をクリック
     - `[data-testid='filter-panel']` がモーダル形式で表示されること
     - FilterPanel に CategorySelector と TagGrid が含まれること
  3. **カテゴリフィルタ選択**:
     - `[data-testid='category-selector']` で "Tutorials & Use Cases" を選択
     - `[data-testid='filter-submit-button']` をクリック
     - 該当カテゴリの記事のみが表示されること（1件: "remix-tips-2024"）
     - FilterPanel が自動的に閉じること
  4. **タグフィルタ選択 (AND条件)**:
     - FilterToggleButton をクリックしてパネルを再度開く
     - CategorySelector を "All Categories" (空文字列) に設定
     - `[data-testid='tag-button']` で "TypeScript" タグを選択
     - FilterSubmitButton をクリック
     - TypeScript タグを含む記事のみが表示されること（2件: "remix-tips-2024", "typescript-best-practices"）

#### 1.3 テストの失敗を確認

```bash
npm run test:e2e
```

- 実装がまだ存在しないため、このテストが失敗すること（RED）を確認します
- この失敗したテストが、Phase 2以降で実装すべき機能の明確なゴールとなります

---

### Phase 2: CSS実装（Layer 2/3/4） ✅完了

**目的**: `posts/uiux-spec.md` と `post-detail/uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装

**実装対象**:

1. **Layer 2**: `app/styles/blog/layer2.css` (既存ファイルに追記)
2. **Layer 3**: `app/styles/blog/layer3.ts` (既存ファイルに追記、必要に応じて)
3. **Layer 4**: `app/styles/blog/layer4.ts` (必要な場合のみ)

**段階的更新の運用**:

- **既存サービスへの追加**: blogサービスは既存なので、既存CSS実装ファイルに追記します
- **共通化の検討**: 既存セクションに類似コンポーネントがある場合、必ず共通化を検討してください
- **整合性の確認**: 追加時は、既存実装との整合性（命名規則、トークン使用等）を確認してください

#### 2.1 Layer 2 実装

**追加するコンポーネント** (すべて `app/styles/blog/layer2.css` に追記):

1. **FilterToggleButton** (`.filter-toggle-button`):
   - 記事一覧上部のフィルタ開閉ボタン
   - ホバー状態、フォーカス状態
   - アイコン配置（フィルタアイコン + ラベル）

2. **FilterPanel** (`.filter-panel`, `.filter-overlay`):
   - モーダル/オーバーレイ形式のフィルタパネル
   - z-index で前面表示
   - フェードイン/フェードアウトアニメーション
   - 背景オーバーレイ (`.filter-overlay`)

3. **CategorySelector** (`.category-selector`):
   - ドロップダウンセレクター (`<select>` 要素)
   - デフォルト値 "All Categories" のスタイリング
   - ホバー状態、フォーカス状態

4. **TagGrid** (`.tag-grid`):
   - タググリッドコンテナ
   - グリッドレイアウト（列数は spec.yaml で管理: `responsive.tag_grid_columns.default: 3`）
   - レスポンシブ対応

5. **TagButton** (`.tag-button`, `.tag-button[aria-pressed="true"]`):
   - トグル可能な正方形ボタン (`<button type="button">`)
   - 選択状態/非選択状態の視覚的区別（背景色、ボーダー変化）
   - ホバー状態、フォーカス状態
   - アクセシビリティ対応 (`aria-pressed`)

6. **FilterSubmitButton** (`.filter-submit-button`):
   - フィルタ適用の決定ボタン
   - プライマリボタンスタイル
   - ホバー状態、フォーカス状態

7. **TagBadge** (`.tag-badge`):
   - 記事カード/詳細に表示されるタグバッジ（ピル型）
   - 複数タグの横並び表示
   - 適度な間隔（gap）

8. **PostDescription** (`.post-description`):
   - 記事の要約文
   - 行数制限（2-3行）、ellipsis

#### 2.2 Layer 3 実装 (必要に応じて)

**対象ファイル**: `app/styles/blog/layer3.ts` (既存ファイルに追記)

- FilterPanel 内のレイアウト構造（CategorySelector + TagGrid + SubmitButton の縦並び）
- TagGrid の内部レイアウト（グリッド配置）
- TagBadge の横並びレイアウト

#### 2.3 検証

```bash
npm run lint:css-arch
```

- 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

#### 2.4 確認事項

- ✅ Layer 2で色・サイズ・タイポグラフィが定義されている
- ✅ Layer 3でフレックス・グリッドレイアウトのみが定義されている
- ✅ margin が使用されていない（gap統一の原則）
- ✅ `!important` が使用されていない
- ✅ リント検証に合格している

---

### Phase 3: 層別TDD (ユニット/コンポーネント実装) ✅完了

**実装順序**: 副作用層 → 純粋ロジック層 → UI層 (Inside-Out の順)

#### 3.1. 🔌 副作用層の実装 (app/data-io/blog)

##### 3.1.1 Markdownファイルにメタデータ追加

**対象ファイル**: `content/blog/posts/*.md` (既存記事ファイルに追記)

- **フロントマター追加**:

  ```yaml
  ---
  title: "記事タイトル"
  publishedAt: "2024-05-01"
  category: "Tutorials & Use Cases"
  description: "記事の要約文（100-160文字程度）"  # 新規追加
  tags: ["Remix", "Cloudflare", "TypeScript"]      # 新規追加
  ---
  ```

- **作業内容**:
  1. 既存の3つのテスト記事（`remix-tips-2024.md`, `claude-code-guide.md`, `typescript-best-practices.md`）にメタデータを追加
  2. 各記事に適切な `description` と `tags` を設定（`posts/spec.yaml` の `test_data.posts` を参照）

##### 3.1.2 fetchPosts.server.ts の拡張

**対象ファイル**: `app/data-io/blog/posts/fetchPosts.server.ts` (既存ファイルを編集)

**テスト実装 (RED)**:

- **テストファイル**: `app/data-io/blog/posts/fetchPosts.server.test.ts` (既存ファイルに追記)
- **追加テストケース**:
  1. **メタデータ取得確認**:
     - `fetchPosts()` の返り値に `description` と `tags` が含まれること
  2. **フィルタ機能確認**:
     - `fetchPosts({ category: "Tutorials & Use Cases" })` で該当カテゴリの記事のみ取得
     - `fetchPosts({ tags: ["TypeScript"] })` で該当タグを含む記事のみ取得（AND条件）
     - `fetchPosts({ category: "Claude Best Practices", tags: ["AI"] })` で複合フィルタが機能

**実装 (GREEN)**:

- `FetchPostsOptions` 型に `category?: string` と `tags?: string[]` を追加
- `fetchPosts()` 関数内で:
  1. `getAllPosts()` から全記事を取得
  2. `PostSummary` 型に `description` と `tags` を追加
  3. `filterPosts()` （純粋ロジック層）を呼び出してフィルタリング
  4. 投稿日の降順でソート
  5. limit/offset を適用
  6. `PostSummary[]` と `total` を返す

**リファクタリング**: エラーハンドリングの改善

##### 3.1.3 fetchAvailableFilters.server.ts の新規作成

**対象ファイル**: `app/data-io/blog/posts/fetchAvailableFilters.server.ts` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、fetchAvailableFilters という名前のdata-ioファイルを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/data-io/blog/posts/fetchAvailableFilters.server.test.ts` (自動生成)
- **テストケース**:
  1. **利用可能なカテゴリ一覧の取得**:
     - すべての記事から重複なくカテゴリを抽出
     - アルファベット順にソート
  2. **利用可能なタグ一覧の取得**:
     - すべての記事から重複なくタグを抽出
     - アルファベット順にソート

**実装 (GREEN)**:

- `AvailableFilters` 型を定義:

  ```typescript
  interface AvailableFilters {
    categories: string[]
    tags: string[]
  }
  ```

- `fetchAvailableFilters()` 関数を実装:
  1. `getAllPosts()` から全記事を取得
  2. `Set<string>` を使ってカテゴリとタグを重複なく抽出
  3. アルファベット順にソート
  4. `{ categories, tags }` を返す

**リファクタリング**: 効率的な Set 操作

---

#### 3.2. 🧠 純粋ロジック層の実装 (app/lib/blog/posts)

##### 3.2.1 filterPosts.ts の新規作成

**対象ファイル**: `app/lib/blog/posts/filterPosts.ts` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、filterPosts という名前のlibファイルを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/lib/blog/posts/filterPosts.test.ts` (自動生成)
- **テストケース**:
  1. **カテゴリフィルタ**:
     - `category: "Tutorials & Use Cases"` で該当カテゴリの記事のみ返す
     - `category: ""` (空文字列) または `undefined` の場合、すべての記事を返す（"All Categories"）
  2. **タグフィルタ (AND条件)**:
     - `tags: ["Remix", "Cloudflare"]` で両方のタグを含む記事のみ返す
     - `tags: []` または `undefined` の場合、すべての記事を返す
  3. **複合フィルタ**:
     - `category: "Claude Best Practices", tags: ["AI"]` で両方の条件を満たす記事のみ返す
  4. **境界値**:
     - 空配列の posts に対してフィルタを適用しても空配列を返す
     - 該当する記事が0件の場合、空配列を返す

**実装 (GREEN)**:

- `FilterOptions` 型を定義:

  ```typescript
  interface FilterOptions {
    category?: string
    tags?: string[]
  }
  ```

- `filterPosts(posts: PostSummary[], filters: FilterOptions): PostSummary[]` 関数を実装:
  1. カテゴリフィルタ: `filters.category` が空文字列または `undefined` の場合スキップ、それ以外は `post.category === filters.category`
  2. タグフィルタ: `filters.tags` が空配列または `undefined` の場合スキップ、それ以外は `filters.tags.every(tag => post.tags.includes(tag))`（AND条件）
  3. フィルタ後の配列を返す

**リファクタリング**: 可読性の向上、関数の分割

---

#### 3.3. app/componentsの実装 (app/routes, app/components/blog)

##### 3.3.1 PostCard.tsx の拡張 (メタデータ表示)

**対象ファイル**: `app/components/blog/posts/PostCard.tsx` (既存ファイルを編集)

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/PostCard.test.tsx` (既存ファイルに追記)
- **追加テストケース**:
  1. **description 表示確認**: PostCard に `description` が表示されること
  2. **tags 表示確認**: PostCard に `tags` がピル型バッジで横並びに表示されること
  3. **TagBadge の data-testid**: 各タグに `[data-testid='tag-badge']` が付与されていること

**実装 (GREEN)**:

- `PostCardProps` 型に `description: string` と `tags: string[]` を追加
- PostCard コンポーネントに以下を追加:
  1. `<p className="post-description">{description}</p>`
  2. `<div className="tag-list">{tags.map(tag => <span className="tag-badge" data-testid="tag-badge">{tag}</span>)}</div>`
- スタイリング: Layer 2 で定義した `.post-description` と `.tag-badge` クラスを使用

**リファクタリング**: TagBadge を独立コンポーネント化するか検討

##### 3.3.2 FilterToggleButton.tsx の新規作成

**対象ファイル**: `app/components/blog/posts/FilterToggleButton.tsx` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、FilterToggleButton という名前のUIコンポーネントを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/FilterToggleButton.test.tsx` (自動生成)
- **テストケース**:
  1. **ボタン表示確認**: `[data-testid='filter-toggle-button']` が表示されること
  2. **クリックイベント**: ボタンクリックで `onClick` ハンドラーが呼ばれること
  3. **アクセシビリティ**: `aria-label="フィルタを開く"` が付与されていること

**実装 (GREEN)**:

```typescript
interface FilterToggleButtonProps {
  onClick: () => void
  isOpen: boolean
}

export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      type="button"
      className="filter-toggle-button"
      onClick={onClick}
      aria-label={isOpen ? "フィルタを閉じる" : "フィルタを開く"}
      data-testid="filter-toggle-button"
    >
      Filter
    </button>
  )
}
```

**リファクタリング**: アイコンの SVG 化を検討

##### 3.3.3 CategorySelector.tsx の新規作成

**対象ファイル**: `app/components/blog/posts/CategorySelector.tsx` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、CategorySelector という名前のUIコンポーネントを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/CategorySelector.test.tsx` (自動生成)
- **テストケース**:
  1. **セレクター表示確認**: `[data-testid='category-selector']` が表示されること
  2. **"All Categories" デフォルト確認**: デフォルトオプションが `value=""` で "All Categories" であること
  3. **カテゴリオプション表示**: `availableCategories` の各項目が `<option>` として表示されること

**実装 (GREEN)**:

```typescript
interface CategorySelectorProps {
  availableCategories: string[]
  selectedCategory?: string
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  availableCategories,
  selectedCategory,
}) => {
  return (
    <select
      name="category"
      className="category-selector"
      defaultValue={selectedCategory || ""}
      data-testid="category-selector"
    >
      <option value="">All Categories</option>
      {availableCategories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  )
}
```

**リファクタリング**: カテゴリ絵文字の動的マッピングを検討

##### 3.3.4 TagGrid.tsx の新規作成

**対象ファイル**: `app/components/blog/posts/TagGrid.tsx` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、TagGrid という名前のUIコンポーネントを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/TagGrid.test.tsx` (自動生成)
- **テストケース**:
  1. **グリッド表示確認**: `[data-testid='tag-grid']` が表示されること
  2. **タグボタン表示**: `availableTags` の各タグが `[data-testid='tag-button']` として表示されること
  3. **選択状態**: 選択されたタグボタンに `aria-pressed="true"` が付与されること
  4. **トグル機能**: タグボタンをクリックすると選択/非選択が切り替わること
  5. **hidden input**: 選択されたタグが `<input type="hidden" name="tags" value={tag}>` として追加されること

**実装 (GREEN)**:

```typescript
interface TagGridProps {
  availableTags: string[]
  selectedTags?: string[]
}

export const TagGrid: React.FC<TagGridProps> = ({ availableTags, selectedTags }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTags))

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(tag)) {
      newSelected.delete(tag)
    } else {
      newSelected.add(tag)
    }
    setSelected(newSelected)
  }

  return (
    <div className="tag-grid" data-testid="tag-grid">
      {availableTags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="tag-button"
          aria-pressed={selected.has(tag)}
          onClick={() => toggleTag(tag)}
          data-testid="tag-button"
        >
          {tag}
        </button>
      ))}
      {Array.from(selected).map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  )
}
```

**リファクタリング**: カスタムフックの抽出を検討

##### 3.3.5 FilterSubmitButton.tsx の新規作成

**対象ファイル**: `app/components/blog/posts/FilterSubmitButton.tsx` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、FilterSubmitButton という名前のUIコンポーネントを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/FilterSubmitButton.test.tsx` (自動生成)
- **テストケース**:
  1. **ボタン表示確認**: `[data-testid='filter-submit-button']` が表示されること
  2. **type="submit"**: ボタンが `type="submit"` であること

**実装 (GREEN)**:

```typescript
export const FilterSubmitButton: React.FC = () => {
  return (
    <button
      type="submit"
      className="filter-submit-button"
      data-testid="filter-submit-button"
    >
      フィルタ適用
    </button>
  )
}
```

**リファクタリング**: ラベルの国際化対応を検討

##### 3.3.6 FilterPanel.tsx の新規作成

**対象ファイル**: `app/components/blog/posts/FilterPanel.tsx` (新規作成)

**ファイル生成**:

```text
@GeneratorOperator "blog サービスの posts セクションに、FilterPanel という名前のUIコンポーネントを作成して"
```

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/FilterPanel.test.tsx` (自動生成)
- **テストケース**:
  1. **パネル表示確認**: `isOpen={true}` の場合、`[data-testid='filter-panel']` が表示されること
  2. **パネル非表示確認**: `isOpen={false}` の場合、パネルが表示されないこと
  3. **オーバーレイクリック**: 背景オーバーレイクリックで `onClose` が呼ばれること
  4. **子コンポーネント**: CategorySelector, TagGrid, FilterSubmitButton が含まれること

**実装 (GREEN)**:

```typescript
interface FilterPanelProps {
  availableCategories: string[]
  availableTags: string[]
  selectedCategory?: string
  selectedTags?: string[]
  isOpen: boolean
  onClose: () => void
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  availableCategories,
  availableTags,
  selectedCategory,
  selectedTags,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <>
      <div className="filter-overlay" onClick={onClose} />
      <aside className="filter-panel" data-testid="filter-panel">
        <Form method="get" onSubmit={onClose}>
          <CategorySelector
            availableCategories={availableCategories}
            selectedCategory={selectedCategory}
          />
          <TagGrid availableTags={availableTags} selectedTags={selectedTags} />
          <FilterSubmitButton />
        </Form>
      </aside>
    </>
  )
}
```

**リファクタリング**: アニメーション追加、ESCキーで閉じる機能

##### 3.3.7 PostsSection.tsx の拡張 (FilterPanel統合)

**対象ファイル**: `app/components/blog/posts/PostsSection.tsx` (既存ファイルを編集)

**テスト実装 (RED)**:

- **テストファイル**: `app/components/blog/posts/PostsSection.test.tsx` (既存ファイルに追記)
- **追加テストケース**:
  1. **FilterToggleButton表示**: PostsSection に FilterToggleButton が表示されること
  2. **FilterPanel初期非表示**: 初期状態では FilterPanel が非表示であること
  3. **FilterPanel開閉**: FilterToggleButton クリックで FilterPanel が表示/非表示されること

**実装 (GREEN)**:

- `PostsSectionProps` 型に以下を追加:

  ```typescript
  availableCategories: string[]
  availableTags: string[]
  selectedCategory?: string
  selectedTags?: string[]
  ```

- PostsSection コンポーネントに以下を追加:
  1. `const [isPanelOpen, setIsPanelOpen] = useState(false)` で状態管理
  2. `<FilterToggleButton onClick={() => setIsPanelOpen(!isPanelOpen)} isOpen={isPanelOpen} />`
  3. `<FilterPanel {...filterProps} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />`

**リファクタリング**: フィルタロジックの整理

##### 3.3.8 app/routes/blog._index.tsx の拡張 (loader統合)

**対象ファイル**: `app/routes/blog._index.tsx` (既存ファイルを編集)

**テスト実装 (RED)**:

- **テストファイル**: Remixのloaderは通常E2Eテストでカバー（ユニットテストはスキップ可能）
- E2Eテストで以下を確認:
  1. URLクエリパラメータ `?category=...&tags=...` が正しくパースされること
  2. フィルタされた記事一覧が表示されること

**実装 (GREEN)**:

- `loader` 関数を拡張:
  1. `new URL(request.url).searchParams` から `category` と `tags` を取得
  2. `fetchPosts({ category, tags, limit, offset })` を呼び出し
  3. `fetchAvailableFilters()` を呼び出し
  4. `return json({ posts, pagination, filters: { availableCategories, availableTags, selectedCategory, selectedTags } })`
- コンポーネントレンダリング:

  ```tsx
  <PostsSection
    posts={posts}
    pagination={pagination}
    availableCategories={filters.availableCategories}
    availableTags={filters.availableTags}
    selectedCategory={filters.selectedCategory}
    selectedTags={filters.selectedTags}
  />
  ```

**リファクタリング**: クエリパラメータのバリデーション追加

##### 3.3.9 記事詳細ページの拡張 (app/routes/blog.$slug.tsx)

**対象ファイル**: `app/routes/blog.$slug.tsx` (既存ファイルを編集)

**テスト実装 (RED)**:

- **テストファイル**: E2Eテストでカバー
- E2Eテストで以下を確認:
  1. 記事詳細ページに `description` が表示されること
  2. 記事詳細ページに `tags` がピル型バッジで表示されること

**実装 (GREEN)**:

- コンポーネントに以下を追加:
  1. `<p className="post-description">{post.description}</p>`
  2. `<div className="tag-list">{post.tags.map(tag => <span className="tag-badge" data-testid="tag-badge">{tag}</span>)}</div>`

**リファクタリング**: メタ情報セクションのレイアウト改善

---

### Phase 4: E2E拡張と統合確認 ✅完了

#### 4.1 Happy Pathの成功確認

```bash
npm run test:e2e
```

- Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認

#### 4.2 詳細E2Eテスト実装

**対象ファイル**: `tests/e2e/screen/blog.screen.spec.ts` (既存ファイルに追記)

**追加テストシナリオ**:

1. **複合フィルタ確認**:
   - カテゴリ "Claude Best Practices" + タグ "AI" で1件取得
   - URL: `/blog?category=Claude%20Best%20Practices&tags=AI`
   - 表示される記事: "claude-code-guide" のみ

2. **All Categories + タグフィルタ確認**:
   - CategorySelector を "All Categories" (value="") のまま
   - タグ "TypeScript" を選択
   - 2件の記事が表示されること（"remix-tips-2024", "typescript-best-practices"）

3. **フィルタ結果0件の確認**:
   - 存在しないカテゴリ/タグの組み合わせを選択
   - "記事が見つかりませんでした" メッセージが表示されること

4. **フィルタ + ページネーション確認**:
   - フィルタ適用後にページ遷移
   - URLパラメータが保持されること（`/blog?page=2&category=...&tags=...`）

5. **FilterPanel背景クリックで閉じる確認**:
   - FilterPanel外の背景（オーバーレイ）をクリック
   - パネルが閉じること

6. **FilterPanel適用後閉じる確認**:
   - FilterSubmitButton クリック後、パネルが自動的に閉じること

7. **レスポンシブ確認**:
   - モバイル幅（768px未満）でFilterPanelが全画面表示されること
   - TagGridの列数が適切に調整されること

8. **アクセシビリティ確認**:
   - FilterToggleButton に適切な `aria-label` が付与されていること
   - TagButton に `aria-pressed` が付与されていること
   - キーボードナビゲーション（Tab, Enter, Escape）が機能すること

#### 4.3 E2Eテストのオールグリーンを確認

```bash
npm run test:e2e
```

- すべてのE2Eテストが成功することを確認

#### 4.4 スタイリング規律確認

```bash
npm run lint:css-arch
```

- `globals.css` 内に配置プロパティ（width, height, margin, padding, display, flex, grid など）が含まれていないことを確認
- 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

#### 4.5 表示確認&承認

```bash
npm run dev
```

- ブラウザで以下を最終確認:
  1. `/blog` で記事一覧が正しく表示されること
  2. 各記事カードに description と tags が表示されること
  3. FilterToggleButton をクリックして FilterPanel が開閉すること
  4. CategorySelector で "All Categories" と各カテゴリが選択できること
  5. TagGrid で複数タグを選択/解除できること（視覚的フィードバック確認）
  6. フィルタ適用後、該当する記事のみが表示されること
  7. URLパラメータが正しく反映されること（`?category=...&tags=...`）
  8. `/blog/remix-tips-2024` などの記事詳細ページで description と tags が表示されること

## 🚨 重要: 実装前の必須確認

- **オペレーターの許可を得てから実装を開始すること**
- 各Phase完了後、必ずオペレーターに報告し、承認を得ること

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1. **再現テストの作成 (E2E or ユニット)**: まず、発見された不具合を再現する**失敗するテスト**を記述します。これは多くの場合、E2Eテストか、特定のコンポーネントの統合テストになります。
2. **原因特定とユニットテストの強化**:
    - デバッグを行い、不具合の根本原因となっている純粋ロジック（lib）やコンポーネントを特定します。
    - その原因を最小単位で再現する**失敗するユニットテスト**を追加します。
3. **実装の修正 (GREEN)**: 追加したユニットテストがパスするように、原因となったコードを修正します。
4. **再現テストの成功確認 (GREEN)**: 最初に作成した再現テスト（E2E/統合テスト）を実行し、こちらもパスすることを確認します。
5. **知見の共有**: この経験を「学んだこと・気づき」セクションに記録し、チームの知識として蓄積します。

---

## 5. 進捗ログ

| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|
| 2025-11-25 | TDD_WORK_FLOW.md 統合版作成 | 設計書完成、ワークフロー定義 | Phase 1: E2Eテスト作成 (オペレーター承認待ち) |
| 2025-11-26 | Phase 1-4完全実装 | メタデータ拡張+フィルタ機能実装完了、全E2Eテスト合格(32/32)、設計書更新(記事詳細からタグ/概要表示削除) | 機能完成 ✅ |

## 6. 学んだこと・気づき

- **設計段階での気づき**:
  - モーダル/オーバーレイ形式のFilterPanelは、モバイルファーストで優れたUXを提供する
  - "All Categories" をデフォルト値にすることで、タグのみでのフィルタリングが自然に実現できる
  - spec.yaml に具体的な数値を集約することで、設計書の陳腐化を防止できる
  - トグルボタン (`<button>` + `aria-pressed`) はチェックボックスよりも視覚的で操作しやすい

- **依存関係の明確化**:
  - metadata enhancement (tags) は filter feature の前提条件
  - Outside-In TDD により、両機能を段階的に実装できる

## 7. さらなる改善提案

- **今回のスコープ外**:
  1. **検索機能**: タイトル・本文での全文検索
  2. **ソート機能**: 投稿日の昇順/降順切り替え
  3. **お気に入り機能**: ユーザーごとのブックマーク
  4. **タグクラウド**: タグの人気度を視覚化
  5. **URLショートカット**: タグクリックで即座にフィルタ適用
  6. **フィルタ履歴**: 最近使用したフィルタ条件の保存
  7. **国際化 (i18n)**: 多言語対応（現在は日本語のみ）

- **技術的改善提案**:
  1. **パフォーマンス最適化**: 記事数が多い場合の仮想スクロール対応
  2. **アクセシビリティ強化**: スクリーンリーダーの詳細対応
  3. **アニメーション**: FilterPanelの開閉にスムーズなトランジション追加
