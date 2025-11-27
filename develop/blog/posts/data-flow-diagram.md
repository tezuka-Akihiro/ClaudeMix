# data-flow-diagram.md - posts Section

## 目的
postsセクションのコンポーネント間の依存関係とデータフローをMermaid図で可視化し、設計レビューを容易にする。

---

## データフロー図

```mermaid
graph TD
    subgraph "外部リソース"
        FS["ファイルシステム<br/>(content/posts/*.md)"]
    end

    subgraph "Route層"
        Route["blog._index.tsx<br/>(Route)"]
    end

    subgraph "UI層 - 共通コンポーネント (commonセクション)"
        BlogLayout["BlogLayout<br/>(共通)"]
        BlogHeader["BlogHeader<br/>(共通)"]
        BlogFooter["BlogFooter<br/>(共通)"]
    end

    subgraph "UI層 - postsセクション"
        PostsSection["PostsSection<br/>(記事一覧コンテナ)"]
        FilterPanel["FilterPanel<br/>(フィルタUI)"]
        PostCard["PostCard<br/>(記事カード)"]
        Pagination["Pagination<br/>(ページネーション)"]
    end

    subgraph "純粋ロジック層 (lib)"
        FormatDate["formatPublishedDate<br/>(日付フォーマット)"]
        FilterPosts["filterPosts<br/>(記事フィルタリング)"]
        CalcPagination["calculatePagination<br/>(ページネーション計算)"]
    end

    subgraph "副作用層 (data-io)"
        FetchPosts["fetchPosts.server<br/>(記事データ取得)"]
        FetchFilters["fetchAvailableFilters.server<br/>(フィルタ情報取得)"]
    end

    %% データフロー
    FS -->|マークダウンファイル読み込み| FetchPosts
    FS -->|カテゴリ・タグ抽出| FetchFilters
    FetchPosts -->|PostSummary[]| Route
    FetchFilters -->|AvailableFilters| Route
    Route -->|クエリパラメータ| FilterPosts
    FilterPosts -->|filtered posts| Route
    Route -->|posts, pagination| CalcPagination
    CalcPagination -->|PaginationData| Route
    Route -->|loader data| BlogLayout
    BlogLayout -->|children| PostsSection
    BlogLayout --> BlogHeader
    BlogLayout --> BlogFooter
    PostsSection -->|filters| FilterPanel
    PostsSection -->|posts: PostSummary[]| PostCard
    PostsSection -->|pagination| Pagination
    PostCard -->|publishedAt: string| FormatDate
    FormatDate -->|formatted date| PostCard

    %% スタイル
    classDef routeStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef uiStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef libStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef dataIOStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef externalStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class Route routeStyle
    class BlogLayout,BlogHeader,BlogFooter,PostsSection,FilterPanel,PostCard,Pagination uiStyle
    class FormatDate,FilterPosts,CalcPagination libStyle
    class FetchPosts,FetchFilters dataIOStyle
    class FS externalStyle
```

---

## コンポーネント詳細

### Route層
| コンポーネント | 責務 | 依存先 |
|:---|:---|:---|
| **blog._index.tsx** | 記事一覧ページのRoute。loaderでURLクエリパラメータ（page, category, tags）を取得し、fetchPosts.server、fetchAvailableFilters.serverを呼び出し、フィルタリング・ページネーション処理を実行してUIに渡す | fetchPosts.server, fetchAvailableFilters.server, filterPosts, calculatePagination |

### UI層（共通コンポーネント）
| コンポーネント | 責務 | 依存先 |
|:---|:---|:---|
| **BlogLayout** | ページ全体のレイアウトコンテナ（commonセクション）。Header、Footer、Contentエリアを配置 | BlogHeader, BlogFooter |
| **BlogHeader** | ヘッダーコンポーネント（commonセクション）。ブログタイトルとメニューボタンを表示 | - |
| **BlogFooter** | フッターコンポーネント（commonセクション）。コピーライトを表示 | - |

### UI層（postsセクション固有）
| コンポーネント | 責務 | 依存先 |
|:---|:---|:---|
| **PostsSection** | 記事一覧のメインコンテナ。ページタイトル、FilterPanel、記事カードグリッド、Paginationを配置 | FilterPanel, PostCard, Pagination |
| **FilterPanel** | フィルタUIコンポーネント。カテゴリフィルタ（ラジオボタン）とタグフィルタ（チェックボックス）を提供 | - |
| **PostCard** | 個別記事の表示カード。タイトル、投稿日、カテゴリバッジ、タグバッジを表示し、クリックで記事詳細へ遷移 | formatPublishedDate |
| **Pagination** | ページネーションUIコンポーネント。「前へ」「次へ」ボタンとページ番号リンクを表示。フィルタパラメータを保持 | - |

### 純粋ロジック層（lib）
| 関数 | 責務 | 依存先 |
|:---|:---|:---|
| **formatPublishedDate** | 投稿日フォーマット処理。ISO形式（"2024-05-01"）を日本語形式（"2024年5月1日"）に変換 | - |
| **filterPosts** | 記事フィルタリング処理。記事一覧を指定された条件（category, tags）でフィルタリング。タグ条件はAND条件 | - |
| **calculatePagination** | ページネーション計算処理。総記事数と現在ページから、ページネーション情報（currentPage, totalPages, totalPosts, postsPerPage）を計算 | - |

### 副作用層（data-io）
| 関数 | 責務 | 依存先 |
|:---|:---|:---|
| **fetchPosts.server** | 記事一覧データの取得。ファイルシステムから記事メタデータを読み込み、category/tagsパラメータによるフィルタリング、limit/offsetパラメータによるページネーション対応。PostSummary[]とtotalを返す | ファイルシステム |
| **fetchAvailableFilters.server** | 利用可能なフィルタ情報の取得。すべての記事から利用可能なカテゴリとタグを抽出し、重複なくソート済みで返す | ファイルシステム |

---

## データフローの説明

### 1. 記事データの取得とフィルタリング（loader）
1. ユーザーが `/blog` または `/blog?page=2&category=Tutorials&tags=Remix,AI` にアクセス
2. `blog._index.tsx` の `loader` が実行される
3. `loader` がURLクエリパラメータ（page, category, tags）を取得
4. `loader` が `fetchPosts.server.ts` を呼び出し
5. `fetchPosts.server.ts` がファイルシステム（`content/posts/*.md`）から記事メタデータを読み込む
6. `fetchPosts.server.ts` が `filterPosts` を呼び出し、category/tagsでフィルタリング
7. フィルタリング後の記事に対してlimit/offsetを適用し、ページネーション
8. `loader` が `fetchAvailableFilters.server.ts` を呼び出し、利用可能なカテゴリ・タグを取得
9. `loader` が `calculatePagination` を呼び出し、ページネーション情報を計算
10. `loader` がUIコンポーネントにデータ（posts, filters, pagination）を渡す

### 2. UIの構築
1. `blog._index.tsx` が `BlogLayout` をレンダリング
2. `BlogLayout` が `BlogHeader`、`PostsSection`（children）、`BlogFooter` を配置
3. `PostsSection` が `FilterPanel` をレンダリング（利用可能なカテゴリ・タグを渡す）
4. `PostsSection` が `PostCard` を繰り返しレンダリング（記事数分）
5. `PostCard` が `formatPublishedDate` を呼び出して投稿日を日本語形式に変換
6. `PostCard` がタイトル、変換済み投稿日、カテゴリバッジ、タグバッジを表示
7. `PostsSection` が `Pagination` をレンダリング（ページネーション情報とフィルタパラメータを渡す）

### 3. ユーザーインタラクション
1. ユーザーが `FilterPanel` でカテゴリ・タグを選択し、「適用」ボタンをクリック
2. `/blog?category=...&tags=...` へ遷移（フィルタ適用）
3. ユーザーが `Pagination` のページ番号リンクをクリック
4. `/blog?page=N&category=...&tags=...` へ遷移（フィルタ状態を保持したままページ移動）
5. ユーザーが `PostCard` をクリック
6. `/blog/${slug}` へ遷移（記事詳細ページ）

---

## 3大層分離の遵守

この設計は、プロジェクトの3大層分離アーキテクチャを厳格に遵守しています：

| 層 | 責務 | 副作用の有無 |
|:---|:---|:---|
| **UI層** | ユーザーインターフェース、表示ロジック | なし（純粋なプレゼンテーション） |
| **純粋ロジック層（lib）** | ビジネスロジック、計算処理 | なし（純粋関数） |
| **副作用層（data-io）** | 外部システムとの通信（ファイルI/O、API） | あり（ファイルシステムアクセス） |

**重要**:
- UI層は副作用を持たず、loaderから受け取ったデータを表示するのみ
- lib層は純粋関数のみで構成され、副作用なし
- data-io層のみが外部リソース（ファイルシステム）にアクセス可能

---

## レビューポイント

この図を用いて、以下の点をレビューしてください：

1. **層の責務分離**: 各コンポーネントが適切な層に配置されているか
2. **依存関係の方向**: データフローが一方向（外部 → data-io → lib → UI）になっているか
3. **副作用の隔離**: 副作用がdata-io層のみに隔離されているか
4. **共通コンポーネントの再利用**: commonセクションのコンポーネントが適切に利用されているか
5. **テスタビリティ**: 各層が独立してテスト可能か
