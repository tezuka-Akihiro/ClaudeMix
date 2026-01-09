# file-list.md - posts Section

## 目的

postsセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| posts.spec.ts | tests/e2e/section/blog/posts.spec.ts | postsセクション単独のE2Eテスト |

---

## 2. Route層（Phase 2.4）

| ファイル名 | パス | URL | 説明 |
| :--- | :--- | :--- | :--- |
| blog._index.tsx | app/routes/blog._index.tsx | /blog | 記事一覧ページのRoute。loaderでURLクエリパラメータ（loaded, category, tags）を取得し、記事データをフィルタリング・追加読み込みして取得。PostsSectionをレンダリング。fetcherリクエストにも対応 |

**注**: Flat Routes規則により、`_index.tsx`でインデックスルート（/blog）を表現します。

---

## 3. UI層（Phase 2.3）

### 3.1 Components (posts固有)

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| PostsSection.tsx | app/components/blog/posts/PostsSection.tsx | 記事一覧のメインコンテナ。ページタイトル、**FilterPanel**、PostCardGrid、**LoadMoreButtonコンポーネント**を配置 |
| PostsSection.test.tsx | app/components/blog/posts/PostsSection.test.tsx | ユニットテスト |
| PostCard.tsx | app/components/blog/posts/PostCard.tsx | 個別記事の表示カード。タイトル、投稿日、カテゴリバッジ、タグバッジを表示し、クリックで記事詳細へ遷移 |
| PostCard.test.tsx | app/components/blog/posts/PostCard.test.tsx | ユニットテスト |
| LoadMoreButton.tsx | app/components/blog/posts/LoadMoreButton.tsx | もっと見るボタンコンポーネント。記事一覧の最下部に配置。クリックでuseFetcherを使用して追加記事を取得し、記事一覧に追加表示。ローディング中はスピナーを表示。全件読み込み済みの場合は非表示。アクセシビリティ対応（aria-label、aria-busy） |
| LoadMoreButton.test.tsx | app/components/blog/posts/LoadMoreButton.test.tsx | ユニットテスト |
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
| :--- | :--- | :--- |
| formatPublishedDate.ts | app/lib/blog/posts/formatPublishedDate.ts | 投稿日フォーマット処理。ISO形式（"2024-05-01"）を日本語形式（"2024年5月1日"）に変換する純粋関数 |
| formatPublishedDate.test.ts | app/lib/blog/posts/formatPublishedDate.test.ts | ユニットテスト |
| calculateLoadMore.ts | app/lib/blog/posts/calculateLoadMore.ts | 追加読み込み情報計算処理。総記事数と現在読み込み済み件数から、追加読み込み可能かを判定（hasMore, loadedCount, totalPosts, postsPerLoad）を計算する純粋関数 |
| calculateLoadMore.test.ts | app/lib/blog/posts/calculateLoadMore.test.ts | ユニットテスト |
| categoryUtils.ts | app/lib/blog/posts/categoryUtils.ts | カテゴリ絵文字マッピング処理。カテゴリ名からカテゴリ絵文字を取得する純粋関数 |
| categoryUtils.test.ts | app/lib/blog/posts/categoryUtils.test.ts | ユニットテスト |
| filterPosts.ts | app/lib/blog/posts/filterPosts.ts | 記事フィルタリング処理。記事一覧を指定された条件（category, tags）でフィルタリングする純粋関数。タグ条件はAND条件（指定されたすべてのタグを含む記事のみ抽出） |
| filterPosts.test.ts | app/lib/blog/posts/filterPosts.test.ts | ユニットテスト |
| groupTagsByCategory.ts | app/lib/blog/posts/groupTagsByCategory.ts | タググループ化処理。利用可能なタグリストとspec.yamlのタグ定義から、グループ別タグ情報（{ group: string; tags: string[] }[]）を生成する純粋関数 |
| groupTagsByCategory.test.ts | app/lib/blog/posts/groupTagsByCategory.test.ts | ユニットテスト |

---

## 5. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| fetchPosts.server.ts | app/data-io/blog/posts/fetchPosts.server.ts | 記事一覧データの取得。ファイルシステムから記事メタデータを読み込み、**category/tagsパラメータによるフィルタリング対応**、**limit/offsetパラメータによる追加読み込み対応**。FetchPostsResult（posts: PostSummary[], total: number）を返す |
| fetchPosts.server.test.ts | app/data-io/blog/posts/fetchPosts.server.test.ts | ユニットテスト（フィルタリング、limit/offset対応の検証を含む） |
| fetchAvailableFilters.server.ts | app/data-io/blog/posts/fetchAvailableFilters.server.ts | 利用可能なフィルタ情報の取得。すべての記事から利用可能なカテゴリとタグを抽出し、タググループ情報（tagGroups）も生成して返す。 |
| fetchAvailableFilters.server.test.ts | app/data-io/blog/posts/fetchAvailableFilters.server.test.ts | ユニットテスト（tagGroupsフィールドの検証を含む） |
| loadPostsSpec.server.ts | app/data-io/blog/posts/loadPostsSpec.server.ts | spec.yamlからカテゴリ定義を読み込む。PostsSpec（categories: Category[]）を返す |
| loadPostsSpec.server.test.ts | app/data-io/blog/posts/loadPostsSpec.server.test.ts | ユニットテスト |

---
