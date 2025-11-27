# post-detail - 機能設計書

## 📋 機能概要

**機能名**: 記事詳細表示機能

**所属サービス**: **blog** の **post-detail** セクションに配置

**機能の目的・価値**:
- **解決する課題**: ユーザーが興味を持った記事の詳細内容を読みたいというニーズに応える
- **提供する価値**: マークダウン形式で記述された技術記事を、読みやすく整形されたHTML形式で提供し、技術情報の習得体験を向上させる
- **ビジネス効果**: Remixとclaude codeに関する知見を効果的に発信し、コミュニティへの貢献と技術ブランディングを実現する

**実装優先度**: **HIGH** - ブログサービスの主要機能であり、記事一覧と並ぶコア機能のため

## 🎯 機能要件

**目次階層の定義**:
- **抽出対象**: h2の1階層（##）
- **変更管理**: この定義を変更する場合は、このセクションを修正してください。他のドキュメント（data-flow-diagram.md, file-list.md, spec.yaml等）は、この定義を参照しています

**基本機能**:
1. **記事詳細の表示**: URLパラメータ（slug）から記事を特定し、詳細内容を表示する
2. **マークダウン変換**: マークダウン形式の記事本文をHTML形式に変換して表示する
   - **マークダウン内の画像データ**: 画像パス（相対パス・絶対パス）を適切に処理し、画像を表示
   - **Mermaid表記**: マークダウン内のMermaid記法（図表記述）をレンダリング可能な形式で処理
3. **記事メタデータの表示**: タイトル、投稿日、著者などの記事情報を表示する
4. **目次（Table of Contents）の自動生成**:
   - マークダウンの見出し（上記「目次階層の定義」参照）を抽出し、目次として表示
   - 各見出しにID属性を付与し、目次リンクからページ内ナビゲーション可能に
   - 見出しクリックでスムーススクロール
5. **外部マークダウンファイルの参照**: frontmatterに`source`プロパティが指定されている場合、そのパスのマークダウンファイルを読み込み、記事本文として表示する
   - **sourceが指定されていない場合**: 従来通り記事ファイル本文を使用
   - **sourceが指定されている場合**: 指定されたファイルの内容を記事本文として使用（記事ファイル本文は無視）
   - **制約**: 参照元ファイル内の画像（相対パス）は正しく表示されない可能性がある（画像非対応）

**開発戦略: 段階的強化 (Progressive Enhancement)**:
1. **ステップ1: モック実装 (UIの確立)** - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません
2. **ステップ2: 機能強化 (ロジックの接続)** - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

**入力データ**:
~~~typescript
// URLパラメータからslugを受け取る
type LoaderParams = {
  slug: string; // 記事を識別するURL識別子（例: "remix-tips-2024"）
};
~~~

**出力データ**:
~~~typescript
// frontmatterの型定義（参照機能追加により拡張）
type PostFrontmatter = {
  title: string;
  description: string;  // 必須化（SEO対応）
  publishedAt: string;
  author: string;
  tags: string[];       // タグ配列（多次元分類用）
  source?: string;      // 参照元ファイルパス（プロジェクトルートからの相対パス、例: "/README.md"）
};

// loaderがUIに返すデータの型定義
type PostDetailData = {
  title: string;        // 記事タイトル
  description: string;  // 記事の要約（SEO・OGP用）
  content: string;      // マークダウン形式の記事本文
  publishedAt: string;  // 投稿日（ISO 8601形式）
  author: string;       // 著者名
  slug: string;         // URL識別子
  tags: string[];       // タグ配列（カテゴリに対する詳細分類）
};
~~~

**app/components要件（app/routes, app/components）**:

*Route責務* (`app/routes/blog.$slug.tsx`):
- URLパラメータ（slug）を取得し、loaderでデータ取得を実行
- data-io層から記事データ（frontmatter含む）を取得
- frontmatterの`source`プロパティをチェック
  - **sourceが指定されていない場合**: 記事ファイル本文をそのまま使用
  - **sourceが指定されている場合**: data-io層で外部ファイルを読み込む
- lib層でマークダウンをHTMLに変換
- 変換後のデータをComponentに渡す
- **meta関数の実装** (`export const meta: MetaFunction<typeof loader>`):
  - loaderから返された`PostDetailData`を使用してメタデータを生成
  - 返すメタデータ:
    - `title`: `${post.title} | ClaudeMix Blog`
    - `name="description"`: `post.description`
    - `property="og:title"`: `post.title`
    - `property="og:description"`: `post.description`
    - `property="og:type"`: `"article"`
    - `name="twitter:card"`: `"summary_large_image"`
    - `name="twitter:title"`: `post.title`
    - `name="twitter:description"`: `post.description`
  - フォールバック: `data`が存在しない場合（404エラー等）は空配列`[]`を返す
- エラーハンドリング
  - 記事が存在しない場合は404
  - 参照先ファイルが存在しない場合は500エラー

*Component責務* (`app/components/blog/post-detail/PostDetailSection.tsx`):
- 記事詳細情報（タイトル、投稿日、著者、本文）を表示
- **記事メタ情報セクション**: タイトル、著者、投稿日を表示
- マークダウンから変換されたHTMLコンテンツを安全にレンダリング
- **Mermaidクライアント側レンダリング**: useEffectでMermaid.jsライブラリを初期化し、クラス付与されたMermaidコードブロックをSVG図表に変換
- 共通レイアウト（ヘッダー・フッター）を含む全体構成

**🧠 純粋ロジック要件（app/lib）**:

*マークダウン変換処理* (`app/lib/blog/post-detail/markdownConverter.ts`):
- 入力: マークダウン形式の文字列
- 出力: HTML形式の文字列
- 責務: マークダウンをHTMLに変換する純粋な処理（副作用なし）
- XSS対策のため、安全なHTMLのみを生成
- **画像データ処理**: マークダウン内の画像記法（`![alt](path)`）を適切なHTMLの`<img>`タグに変換
  - 遅延読み込み: `loading="lazy"` 属性を付与
  - レスポンシブ対応: `style="max-width: 100%"` を設定
- **シンタックスハイライト処理**: マークダウン内のコードブロック（` ```language code... ``` `）にシンタックスハイライトを適用
  - 技術選定: Shiki（VS Codeのシンタックスハイライトエンジン）
  - サポート言語: TypeScript, JavaScript, Python, Bash, CSS, JSON, Markdown など
  - 出力形式: インラインスタイル付きHTMLとして生成
  - テーマ: VS Code Dark+ または GitHub Light
- **Mermaid表記処理**: マークダウン内のMermaidコードブロック（` ```mermaid ... ``` `）をレンダリング可能な形式に変換
  - サーバー側処理: `<pre class="mermaid">` タグでラップ、Mermaidコードをそのまま保持
  - クライアント側処理: PostDetailSectionのuseEffectでMermaid.jsがSVG図表に変換
  - エラーハンドリング: 不正なMermaid構文の場合はフォールバック表示
- **見出しへのID付与**: 変換時に見出し（h1-h6）にID属性を自動付与
  - ID生成: 見出しテキストをスラグ化（日本語対応）
  - sanitize-html設定: h1-h6タグのid属性を許可

*見出し抽出処理* (`app/lib/blog/post-detail/extractHeadings.ts`):
- 入力: マークダウン形式の文字列
- 出力: 見出し情報の配列 `{ level: number, text: string, id: string }[]`
- 責務: マークダウンから見出し（「目次階層の定義」参照）を抽出し、目次用データを生成

*スラグ化処理* (`app/lib/blog/post-detail/slugify.ts`):
- 入力: 見出しテキスト（日本語含む）
- 出力: URLセーフなスラグ文字列
- 責務: 日本語テキストをそのままIDとして使用可能な形式に変換

**🔌 副作用要件（app/data-io）**:

*記事データ取得処理* (`app/data-io/blog/post-detail/fetchPostBySlug.server.ts`):
- 入力: slug（URL識別子）
- 出力: 記事データ（PostDetailData型）
- 責務: ファイルシステムから記事データ（frontmatter含む）を取得
- **参照機能への対応**:
  - frontmatterパース時に `source` プロパティを取得（gray-matterを使用）
  - sourceが存在する場合、fetchExternalMarkdown.server.tsを呼び出して外部ファイルを読み込む
  - 読み込んだ内容を `content` として返す（記事ファイル本文は無視）
- エラーハンドリング: 記事が存在しない場合はnullを返す

*外部ファイル読み込み処理* (`app/data-io/blog/post-detail/fetchExternalMarkdown.server.ts`):
- 入力: filePath（プロジェクトルートからの相対パス、例: `/README.md`）
- 出力: マークダウンコンテンツ（string）
- 責務: 指定されたパスのファイルをファイルシステムから読み込む
- **セキュリティ（パスバリデーション）**:
  - 許可する拡張子: `.md` のみ
  - 禁止パターン: `../`, `..\\`, `/etc/`, `C:\\` を含むパスは拒否
  - パスはプロジェクトルート（`process.cwd()`）配下に制限
- 依存: Node.js標準モジュール（`fs/promises`, `path`）
- エラーハンドリング: ファイルが存在しない場合、または不正なパスの場合はエラーをthrow