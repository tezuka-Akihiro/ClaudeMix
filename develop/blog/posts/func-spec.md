# posts - 機能設計書

## 📋 機能概要

### 機能名
**Posts List (記事一覧)**

### 所属サービス
**blog** の **posts** セクションに配置

### 機能の目的・価値
- **解決する課題**: ユーザーが投稿されたブログ記事を一目で把握し、読みたい記事を探せるようにする
- **提供する価値**: 時系列で整理された記事一覧を提供し、各記事へのスムーズなアクセスを実現する
- **ビジネス効果**: コンテンツの可視性向上、ユーザーの回遊性向上、技術情報発信の効率化

### 実装優先度
**HIGH** - ブログの主要機能であり、記事詳細ページへの導線となるため最優先で実装する

## 🎯 機能要件

### 基本機能

1. **記事一覧表示**: 投稿されたブログ記事を時系列で一覧表示
   - 各記事カードに以下の情報を表示:
     - 記事タイトル
     - 投稿日（YYYY-MM-DD形式）
     - カテゴリバッジ
     - タグバッジ（複数）
   - 記事カードクリックで記事詳細ページへ遷移

2. **記事フィルタリング**: カテゴリとタグによる記事の絞り込み
   - **FilterPanel**: モーダル/オーバーレイ形式（初期非表示、FilterToggleButtonで開閉）
   - **カテゴリフィルタ**: ドロップダウンセレクター、単一選択、デフォルト値は全カテゴリ表示（空文字列）
   - **タグフィルタ**: グリッドレイアウトのトグルボタン、複数選択可能、AND条件。列数はspec.yamlで管理
   - **FilterSubmitButton**: 選択されたフィルタ条件を適用する決定ボタン
   - フィルタ状態はURLクエリパラメータで管理（例: `?category=Tutorials&tags=Remix,AI`）
     - カテゴリが全カテゴリ表示の場合、categoryパラメータは省略
   - フィルタ適用後もページネーションが正しく動作すること
   - クライアントサイドの状態管理（useState）でFilterPanelの開閉を制御

3. **レイアウト**: 共通レイアウト（BlogLayout）を使用
   - ヘッダー: BlogHeader（commonセクション）
   - フッター: BlogFooter（commonセクション）
   - メインコンテンツ: FilterPanel + PostsSection

4. **スコープ外機能（明示的に実装しない）**:
   - 記事の作成・編集・削除
   - お気に入り、いいね、コメント
   - 共有ボタン、固定記事

### 開発戦略: 段階的強化 (Progressive Enhancement)
1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ
~~~typescript
// loaderが受け取るデータ（リクエストパラメータ）
interface PostsLoaderRequest {
  request: Request // Remixのloaderリクエスト
  // URLクエリパラメータ:
  // - ?page=2
  // - ?category=Tutorials
  // - ?tags=Remix,Cloudflare
}
~~~

### 出力データ
~~~typescript
// loaderがUIに返すデータの型定義
interface PostsLoaderData {
  posts: PostSummary[] // 現在のページの記事一覧
  pagination: PaginationData // ページネーション情報
  filters: FilterData // フィルタ情報
}

interface PostSummary {
  slug: string // URL識別子（例: "remix-tips-2024"）
  title: string // 記事タイトル
  description: string // 記事の要約
  publishedAt: string // 投稿日（ISO形式: "2024-05-01"）
  category: string // カテゴリ
  tags: string[] // タグ配列
}

interface PaginationData {
  currentPage: number // 現在のページ番号（1始まり）
  totalPages: number // 総ページ数
  totalPosts: number // 総記事数
  postsPerPage: number // 1ページあたりの記事数
}

interface FilterData {
  availableCategories: string[] // 利用可能なカテゴリ一覧
  availableTags: string[] // 利用可能なタグ一覧
  selectedCategory?: string // 現在選択されているカテゴリ（空文字列の場合は全カテゴリ表示）
  selectedTags?: string[] // 現在選択されているタグ
}
~~~

### app/components要件（app/routes, app/components）
~~~
1. [UI層の責務]
   Route:
   - app/routes/blog._index.tsx:
     - URL: /blog または /blog?page=2&category=Tutorials&tags=Remix,AI
     - loader:
       - URLクエリパラメータからページ番号、カテゴリ、タグを取得
       - data-io層から記事一覧を取得（ページネーション + フィルタ対応）
       - data-io層から利用可能なカテゴリ・タグ一覧を取得
       - lib層でページネーション情報を計算
       - BlogLayoutを使用してページ全体の構造を構築
       - FilterPanelとPostsSectionコンポーネントをレンダリング
     - エラーハンドリング: ErrorBoundaryで記事取得失敗時のフォールバック表示

   Components:
   - FilterToggleButton.tsx:
     - フィルタパネルの表示/非表示を切り替えるトグルボタン
     - 配置: 記事一覧の一番上
     - onClick: PostsSectionのuseStateを更新してFilterPanelを開閉
     - アクセシビリティ: aria-label="フィルタを開く/閉じる"

   - FilterPanel.tsx:
     - フィルタUIコンポーネント（モーダル/オーバーレイ形式）
     - 初期状態: 非表示（isOpen={false}）
     - 構成要素:
       - **CategorySelector.tsx**: カテゴリフィルタ（ドロップダウンセレクター、単一選択）
         - `<select>` 要素を使用
         - デフォルトオプション: `<option value="">All Categories</option>`
       - **TagGrid.tsx**: タグフィルタ（グリッドレイアウト）
         - タグボタン（`<button type="button">` × N）
         - 選択/非選択を視覚的に表現（背景色・ボーダー変化）
         - aria-pressed属性でアクセシビリティ対応
         - 複数選択可能、AND条件
         - **列数調整**: propsまたはCSS変数で列数を制御
           - 例: `<TagGrid columns={columns} />` または `--tag-grid-columns: var(--columns);`
           - タグの内容・数に応じて柔軟に調整可能
           - **具体的な列数はspec.yamlで管理**（responsive.tag_grid_columns）
       - **FilterSubmitButton.tsx**: 決定ボタン（Formをsubmit）
     - Form送信: 選択されたフィルタ条件でページを再読み込み
     - パネル閉じる: フィルタ適用後、または背景クリック時
     - z-index: 他の要素より前面に表示
     - アニメーション: フェードイン/フェードアウト

   - PostsSection.tsx:
     - 記事一覧のメインコンテナ
     - FilterPanelの開閉状態を管理（useState）
       - `const [isPanelOpen, setIsPanelOpen] = useState(false);`
     - FilterToggleButtonを表示
     - ページタイトル表示（"Articles"）
     - PostCardコンポーネントを繰り返し表示
     - **Paginationコンポーネントを表示**
     - レスポンシブ対応（モバイル: 1列、タブレット: 2列、デスクトップ: 3列）

   - PostCard.tsx:
     - 個別記事の表示カード
     - 表示内容:
       - タイトル
       - 投稿日
       - カテゴリバッジ
       - タグバッジ（複数、横並び）
     - クリックで記事詳細ページへ遷移（`/blog/${slug}`）
     - ホバー時のスタイル変化（視覚的フィードバック）
     - デザイントークンを使用したスタイリング

   - Pagination.tsx:
     - ページネーションUIコンポーネント
     - 表示内容:
       - 「前へ」ボタン（1ページ目では非表示）
       - ページ番号リンク（現在ページの前後2ページ）
       - 「次へ」ボタン（最終ページでは非表示）
     - クリックで該当ページへ遷移（`/blog?page=N&category=...&tags=...`）
       - **重要**: フィルタパラメータを保持すること
     - 現在のページをハイライト表示
     - アクセシビリティ対応（aria-label、キーボードナビゲーション）
~~~

### 🧠 純粋ロジック要件（app/lib/blog/posts）
~~~
2. [純粋ロジック層の責務]
   このセクションには以下の処理を実装します：

   - formatPublishedDate.ts: 投稿日フォーマット処理
     - ISO形式（"2024-05-01"）を日本語形式（"2024年5月1日"）に変換
     - 入力: string (ISO date)
     - 出力: string (formatted date)
     - 純粋関数（副作用なし）

   - calculatePagination.ts: ページネーション計算処理
     - 総記事数と現在ページから、ページネーション情報を計算
     - 入力:
       - totalPosts: number (総記事数)
       - currentPage: number (現在のページ番号、1始まり)
       - postsPerPage: number (1ページあたりの記事数)
     - 出力: PaginationData
       - currentPage: number (現在のページ番号)
       - totalPages: number (総ページ数)
       - totalPosts: number (総記事数)
       - postsPerPage: number (1ページあたりの記事数)
     - ロジック:
       - 総ページ数 = Math.ceil(totalPosts / postsPerPage)
       - 現在ページのバリデーション（1 <= currentPage <= totalPages)
       - ページ番号リスト生成（現在ページの前後2ページ）
     - 純粋関数（副作用なし）

   - filterPosts.ts: 記事フィルタリング処理【新規】
     - 記事一覧を指定された条件でフィルタリング
     - 入力:
       - posts: PostSummary[] (フィルタ対象の記事一覧)
       - filters: FilterOptions
         - category?: string (カテゴリ条件、空文字列または undefined の場合はフィルタしない)
         - tags?: string[] (タグ条件、AND条件)
     - 出力: PostSummary[] (フィルタ後の記事一覧)
     - ロジック:
       - カテゴリフィルタ:
         - filters.category が空文字列または undefined の場合、スキップ（全カテゴリ表示）
         - それ以外: post.category === filters.category
       - タグフィルタ:
         - filters.tags が空配列または undefined の場合、スキップ
         - それ以外: filters.tags.every(tag => post.tags.includes(tag))
           - AND条件: 指定されたすべてのタグを含む記事のみ
     - 純粋関数（副作用なし）
~~~

### 🔌 副作用要件（app/data-io/blog/posts）
~~~
3. [副作用層の責務]
   - fetchPosts.server.ts: 記事一覧データの取得
     - ビルド時に生成されたバンドルから記事メタデータを読み込む
     - **ページネーション対応**: limit/offsetパラメータによる部分取得
     - **フィルタ対応**: category/tagsパラメータによる絞り込み【拡張】
     - 入力:
       - options?: FetchPostsOptions
         - limit?: number (取得件数、デフォルト: 全件)
         - offset?: number (スキップ件数、デフォルト: 0)
         - category?: string (カテゴリフィルタ)【追加】
         - tags?: string[] (タグフィルタ)【追加】
     - 出力: FetchPostsResult
       - posts: PostSummary[] (取得した記事一覧)
       - total: number (総記事数)
     - 処理フロー:
       1. getAllPosts()から全記事を取得
       2. PostSummary[]形式に変換
       3. filterPosts()でフィルタリング【追加】
       4. 投稿日の降順でソート
       5. limit/offsetを適用して部分取得
       6. PostSummary[]とtotalを返す
     - エラーハンドリング: データ取得失敗時はエラーをthrow
     - サーバー専用ファイル（`.server.ts`）

   - fetchAvailableFilters.server.ts: 利用可能なフィルタ情報の取得【新規】
     - すべての記事から利用可能なカテゴリとタグを抽出
     - 入力: なし
     - 出力: AvailableFilters
       - categories: string[] (利用可能なカテゴリ一覧、重複なし、ソート済み)
       - tags: string[] (利用可能なタグ一覧、重複なし、ソート済み)
     - 処理フロー:
       1. getAllPosts()から全記事を取得
       2. Set<string>を使ってカテゴリとタグを重複なく抽出
       3. アルファベット順にソート
       4. categories[]とtags[]を返す
     - サーバー専用ファイル（`.server.ts`）
~~~