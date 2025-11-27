# file-list.md - posts Section

## 目的
postsセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| posts.spec.ts | tests/e2e/section/blog/posts.spec.ts | postsセクション単独のE2Eテスト |

---

## 2. Route層（Phase 2.4）

| ファイル名 | パス | URL | 説明 |
|:---|:---|:---|:---|
| blog._index.tsx | app/routes/blog._index.tsx | /blog | 記事一覧ページのRoute。loaderでURLクエリパラメータ（page, category, tags）を取得し、記事データをフィルタリング・ページネーションして取得。PostsSectionをレンダリング |

**注**: Flat Routes規則により、`_index.tsx`でインデックスルート（/blog）を表現します。

---

## 3. UI層（Phase 2.3）

### 3.1 Components (posts固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| PostsSection.tsx | app/components/blog/posts/PostsSection.tsx | 記事一覧のメインコンテナ。ページタイトル、**FilterPanel**、PostCardGrid、**Paginationコンポーネント**を配置 |
| PostsSection.test.tsx | app/components/blog/posts/PostsSection.test.tsx | ユニットテスト |
| PostCard.tsx | app/components/blog/posts/PostCard.tsx | 個別記事の表示カード。タイトル、投稿日、カテゴリバッジ、タグバッジを表示し、クリックで記事詳細へ遷移 |
| PostCard.test.tsx | app/components/blog/posts/PostCard.test.tsx | ユニットテスト |
| Pagination.tsx | app/components/blog/posts/Pagination.tsx | ページネーションUIコンポーネント。「前へ」「次へ」ボタンとページ番号リンクを表示。**フィルタパラメータ（category, tags）を保持**。現在ページをハイライト。アクセシビリティ対応（aria-label、キーボードナビゲーション） |
| Pagination.test.tsx | app/components/blog/posts/Pagination.test.tsx | ユニットテスト |
| FilterPanel.tsx | app/components/blog/posts/FilterPanel.tsx | フィルタUIコンポーネント。カテゴリフィルタ（ラジオボタン、単一選択）とタグフィルタ（チェックボックス、複数選択）を提供。フィルタ適用ボタンとクリアボタンを配置。レスポンシブ対応（モバイル: 折りたたみ可能、デスクトップ: 常時表示） |
| FilterPanel.test.tsx | app/components/blog/posts/FilterPanel.test.tsx | ユニットテスト |
| FilterToggleButton.tsx | app/components/blog/posts/FilterToggleButton.tsx | フィルタパネルの表示/非表示を切り替えるトグルボタン。記事一覧の上部に配置 |
| FilterToggleButton.test.tsx | app/components/blog/posts/FilterToggleButton.test.tsx | ユニットテスト |
| CategorySelector.tsx | app/components/blog/posts/CategorySelector.tsx | カテゴリ選択用のドロップダウンセレクター。単一選択、デフォルトは全カテゴリ表示 |
| CategorySelector.test.tsx | app/components/blog/posts/CategorySelector.test.tsx | ユニットテスト |
| TagGrid.tsx | app/components/blog/posts/TagGrid.tsx | タグ選択用のグリッド表示。複数選択可能、AND条件。列数は調整可能 |
| TagGrid.test.tsx | app/components/blog/posts/TagGrid.test.tsx | ユニットテスト |
| FilterSubmitButton.tsx | app/components/blog/posts/FilterSubmitButton.tsx | 選択されたフィルタ条件を適用する決定ボタン |
| FilterSubmitButton.test.tsx | app/components/blog/posts/FilterSubmitButton.test.tsx | ユニットテスト |

---

## 4. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| formatPublishedDate.ts | app/lib/blog/posts/formatPublishedDate.ts | 投稿日フォーマット処理。ISO形式（"2024-05-01"）を日本語形式（"2024年5月1日"）に変換する純粋関数 |
| formatPublishedDate.test.ts | app/lib/blog/posts/formatPublishedDate.test.ts | ユニットテスト |
| calculatePagination.ts | app/lib/blog/posts/calculatePagination.ts | ページネーション計算処理。総記事数と現在ページから、ページネーション情報（currentPage, totalPages, totalPosts, postsPerPage）を計算する純粋関数。ページ番号のバリデーションとページ番号リスト生成を含む |
| calculatePagination.test.ts | app/lib/blog/posts/calculatePagination.test.ts | ユニットテスト |
| categoryUtils.ts | app/lib/blog/posts/categoryUtils.ts | カテゴリ絵文字マッピング処理。カテゴリ名からカテゴリ絵文字を取得する純粋関数 |
| categoryUtils.test.ts | app/lib/blog/posts/categoryUtils.test.ts | ユニットテスト |
| filterPosts.ts | app/lib/blog/posts/filterPosts.ts | 記事フィルタリング処理。記事一覧を指定された条件（category, tags）でフィルタリングする純粋関数。タグ条件はAND条件（指定されたすべてのタグを含む記事のみ抽出） |
| filterPosts.test.ts | app/lib/blog/posts/filterPosts.test.ts | ユニットテスト |
| groupTagsByCategory.ts | app/lib/blog/posts/groupTagsByCategory.ts | タググループ化処理。利用可能なタグリストとspec.yamlのタグ定義から、グループ別タグ情報（{ group: string; tags: string[] }[]）を生成する純粋関数 |
| groupTagsByCategory.test.ts | app/lib/blog/posts/groupTagsByCategory.test.ts | ユニットテスト |

---

## 5. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| fetchPosts.server.ts | app/data-io/blog/posts/fetchPosts.server.ts | 記事一覧データの取得。ファイルシステムから記事メタデータを読み込み、**category/tagsパラメータによるフィルタリング対応**、**limit/offsetパラメータによるページネーション対応**。FetchPostsResult（posts: PostSummary[], total: number）を返す |
| fetchPosts.server.test.ts | app/data-io/blog/posts/fetchPosts.server.test.ts | ユニットテスト（フィルタリング、limit/offset対応の検証を含む） |
| fetchAvailableFilters.server.ts | app/data-io/blog/posts/fetchAvailableFilters.server.ts | 利用可能なフィルタ情報の取得。すべての記事から利用可能なカテゴリとタグを抽出し、タググループ情報（tagGroups）も生成して返す。AvailableFilters（categories: string[], tags: string[], tagGroups: { group: string; tags: string[] }[]）を返す |
| fetchAvailableFilters.server.test.ts | app/data-io/blog/posts/fetchAvailableFilters.server.test.ts | ユニットテスト（tagGroupsフィールドの検証を含む） |
| loadPostsSpec.ts | app/data-io/blog/posts/loadPostsSpec.ts | spec.yamlからカテゴリ定義を読み込む。PostsSpec（categories: Category[]）を返す |
| loadPostsSpec.test.ts | app/data-io/blog/posts/loadPostsSpec.test.ts | ユニットテスト |

---

## 7. 実装順序（Outside-In TDD）

1. **Phase 1**: E2Eテスト作成（posts.spec.ts）
2. **Phase 2.1**: data-io層実装（fetchPosts.server.ts）
3. **Phase 2.2**: lib層実装（formatPublishedDate.ts）
4. **Phase 2.3**: UI層実装（PostsSection.tsx、PostCard.tsx）
5. **Phase 2.4**: Route層実装（blog._index.tsx）

**注**: Outside-In TDDに従い、E2Eテストから開始し、外側から内側へ順次実装を進めます。
