# file-list.md - post-detail Section

## 目的

post-detailセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| post-detail.spec.ts | tests/e2e/section/blog/post-detail.spec.ts | post-detailセクション単独のE2Eテスト。記事詳細表示、マークダウン変換、画像・Mermaid図のレンダリング、404エラー処理を検証 |

---

## 2. UI層（Phase 2.3）

### 2.1 Routes

| ファイル名 | パス | URL | 説明 |
|:---|:---|:---|:---|
| blog.$slug.tsx | app/routes/blog.$slug.tsx | /blog/:slug | 記事詳細ページのRoute。URLパラメータ（slug）から記事データを取得し、マークダウン変換を実行してUIに渡す。**meta関数でOGP/Twitter Cardメタデータを生成し、SEO対応** |
| blog.$slug.test.tsx | app/routes/blog.$slug.test.tsx | - | blog.$slug.tsxのテスト。loaderの動作、エラーハンドリング（404）、meta関数の検証 |

**注**: Flat Routes規則により、`$slug`で動的パラメータを表現します（例: /blog/remix-tips-2024）。

### 2.2 Components (post-detail固有)

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| PostDetailSection.tsx | app/components/blog/post-detail/PostDetailSection.tsx | 記事詳細セクションのメインコンポーネント。記事のメタデータ（タイトル、投稿日、著者、**タグバッジ**）と本文（マークダウン変換後のHTML）を表示。**useEffectでMermaid.jsを初期化し、クラス付与されたMermaidコードブロックをSVG図表に変換** |
| PostDetailSection.test.tsx | app/components/blog/post-detail/PostDetailSection.test.tsx | PostDetailSection.tsxのテスト。コンポーネントのレンダリング、propsの表示、タグ表示を検証 |
| TableOfContents.tsx | app/components/blog/post-detail/TableOfContents.tsx | 目次コンポーネント。見出し情報を受け取り、アンカーリンク付きリストとして表示。クリックで該当見出しへスクロール |
| TableOfContents.test.tsx | app/components/blog/post-detail/TableOfContents.test.tsx | TableOfContents.tsxのテスト。見出しリストの表示、アンカーリンクの生成を検証 |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| markdownConverter.ts | app/lib/blog/post-detail/markdownConverter.ts | マークダウン形式の文字列をHTML形式に変換する純粋関数。**Shikiによるシンタックスハイライト統合**、画像記法（`![alt](path)`、遅延読み込み・レスポンシブ対応）、Mermaidコードブロック（` ```mermaid ... ``` `、クラス付与）を適切に処理。**見出しにID属性を自動付与**。XSS対策のため安全なHTMLのみを生成 |
| markdownConverter.test.ts | app/lib/blog/post-detail/markdownConverter.test.ts | markdownConverter.tsのテスト。基本的なマークダウン変換、画像処理、Mermaid処理、XSSサニタイズ、**見出しID付与**を検証 |
| extractHeadings.ts | app/lib/blog/post-detail/extractHeadings.ts | マークダウンから目次用の見出しを抽出する純粋関数（階層定義は `func-spec.md` 参照）。見出しレベル、テキスト、スラグ化されたIDを配列で返す |
| extractHeadings.test.ts | app/lib/blog/post-detail/extractHeadings.test.ts | extractHeadings.tsのテスト。見出し抽出、ネストレベル、日本語見出しの処理を検証 |
| slugify.ts | app/lib/blog/post-detail/slugify.ts | 見出しテキストをURLセーフなスラグに変換する純粋関数。日本語テキスト対応 |
| slugify.test.ts | app/lib/blog/post-detail/slugify.test.ts | slugify.tsのテスト。英数字、日本語、特殊文字のスラグ化を検証 |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| fetchPostBySlug.server.ts | app/data-io/blog/post-detail/fetchPostBySlug.server.ts | slugを受け取り、ファイルシステムから記事データ（frontmatter含む: title, description, publishedAt, author, tags, category, source）を取得する関数。sourceプロパティがある場合は外部ファイルを読み込む。記事が存在しない場合はnullを返す。**descriptionとtagsフィールドを含むPostDetailDataを返す** |
| fetchPostBySlug.server.test.ts | app/data-io/blog/post-detail/fetchPostBySlug.server.test.ts | fetchPostBySlug.server.tsのテスト。正常系（記事取得成功、参照機能、description/tags取得）と異常系（記事が存在しない）を検証 |
| fetchExternalMarkdown.server.ts | app/data-io/blog/post-detail/fetchExternalMarkdown.server.ts | 外部マークダウンファイルのパスを受け取り、ファイルシステムから読み込む関数。パスバリデーション（ディレクトリトラバーサル対策）を実施。ファイルが存在しない場合はエラーをthrow |
| fetchExternalMarkdown.server.test.ts | app/data-io/blog/post-detail/fetchExternalMarkdown.server.test.ts | fetchExternalMarkdown.server.tsのテスト。正常系（ファイル読み込み成功）、異常系（ファイル不存在、不正パス）を検証 |
