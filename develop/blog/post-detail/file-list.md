# file-list.md - post-detail Section

## 目的

post-detailセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| post-detail.spec.ts | tests/e2e/section/blog/post-detail.spec.ts | post-detailセクション単独のE2Eテスト。記事詳細表示、マークダウン変換、画像・Mermaid図のレンダリング、404エラー処理を検証 |

---

## 2. UI層（Phase 2.3）

### 2.1 Routes

| ファイル名 | パス | URL | 説明 |
| :--- | :--- | :--- | :--- |
| blog.$slug.tsx | app/routes/blog.$slug.tsx | /blog/:slug | 記事詳細ページのRoute。URLパラメータ（slug）から記事データを取得し、マークダウン変換を実行してUIに渡す。**meta関数でOGP/Twitter Cardメタデータを生成し、SEO対応** |
| blog.$slug.test.tsx | app/routes/blog.$slug.test.tsx | - | blog.$slug.tsxのテスト。loaderの動作、エラーハンドリング（404）、meta関数の検証 |

**注**: Flat Routes規則により、`$slug`で動的パラメータを表現します（例: /blog/remix-tips-2024）。

### 2.2 Components (post-detail固有)

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| PostDetailSection.tsx | app/components/blog/post-detail/PostDetailSection.tsx | 記事詳細セクションのメインコンポーネント。記事のメタデータ（タイトル、投稿日、著者、**タグバッジ**）と本文（マークダウン変換後のHTML）を表示。**サブスクリプション状態に基づいてコンテンツの可視範囲を制御し、未契約ユーザーにはPaywallを表示**。useEffectでMermaid.jsを初期化し、クラス付与されたMermaidコードブロックをSVG図表に変換 |
| PostDetailSection.test.tsx | app/components/blog/post-detail/PostDetailSection.test.tsx | PostDetailSection.tsxのテスト。コンポーネントのレンダリング、propsの表示、タグ表示、**サブスクリプション状態に応じたコンテンツ制御**を検証 |
| TableOfContents.tsx | app/components/blog/post-detail/TableOfContents.tsx | 目次コンポーネント。見出し情報を受け取り、アンカーリンク付きリストとして表示。クリックで該当見出しへスクロール |
| TableOfContents.test.tsx | app/components/blog/post-detail/TableOfContents.test.tsx | TableOfContents.tsxのテスト。見出しリストの表示、アンカーリンクの生成を検証 |
| Paywall.tsx | app/components/blog/post-detail/Paywall.tsx | ペイウォールコンポーネント。未契約ユーザーに対して、制限を超えるコンテンツの前に表示される障壁。SubscriptionPromotionBannerを内包し、会員登録を促す |
| Paywall.test.tsx | app/components/blog/post-detail/Paywall.test.tsx | Paywall.tsxのテスト。コンポーネントのレンダリング、表示条件、内包するSubscriptionPromotionBannerの表示を検証 |
| SubscriptionPromotionBanner.tsx | app/components/blog/post-detail/SubscriptionPromotionBanner.tsx | 購読促進バナーコンポーネント。プラン情報（1ヶ月/3ヶ月/6ヶ月）と価格を表示し、CTAボタンで`/account/subscription`へ遷移。`app/specs/account/subscription-spec.yaml`からプラン情報を読み込む |
| SubscriptionPromotionBanner.test.tsx | app/components/blog/post-detail/SubscriptionPromotionBanner.test.tsx | SubscriptionPromotionBanner.tsxのテスト。プラン情報の表示、CTAボタンのリンク先を検証 |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| markdownConverter.ts | app/lib/blog/post-detail/markdownConverter.ts | マークダウン形式の文字列をHTML形式に変換する純粋関数。**Shikiによるシンタックスハイライト統合**、画像記法（`![alt](path)`、遅延読み込み・レスポンシブ対応）、Mermaidコードブロック（` ```mermaid ... ``` `、クラス付与）を適切に処理。**見出しにID属性を自動付与**。XSS対策のため安全なHTMLのみを生成 |
| markdownConverter.test.ts | app/lib/blog/post-detail/markdownConverter.test.ts | markdownConverter.tsのテスト。基本的なマークダウン変換、画像処理、Mermaid処理、XSSサニタイズ、**見出しID付与**を検証 |
| extractHeadings.ts | app/lib/blog/post-detail/extractHeadings.ts | マークダウンから目次用の見出しを抽出する純粋関数（階層定義は `func-spec.md` 参照）。見出しレベル、テキスト、スラグ化されたIDを配列で返す |
| extractHeadings.test.ts | app/lib/blog/post-detail/extractHeadings.test.ts | extractHeadings.tsのテスト。見出し抽出、ネストレベル、日本語見出しの処理を検証 |
| slugify.ts | app/lib/blog/post-detail/slugify.ts | 見出しテキストをURLセーフなスラグに変換する純粋関数。日本語テキスト対応 |
| slugify.test.ts | app/lib/blog/post-detail/slugify.test.ts | slugify.tsのテスト。英数字、日本語、特殊文字のスラグ化を検証 |
| determineContentVisibility.ts | app/lib/blog/post-detail/determineContentVisibility.ts | サブスクリプション状態（`hasActiveSubscription: boolean`）、記事の公開範囲見出し（`freeContentHeading: string | null`）、見出し情報配列（`headings: Heading[]`）を受け取り、コンテンツの可視範囲を判定する純粋関数。`{ showFullContent: boolean, cutoffHeadingId: string | null }` を返す。副作用なし（テスト容易性を確保） |
| determineContentVisibility.test.ts | app/lib/blog/post-detail/determineContentVisibility.test.ts | determineContentVisibility.tsのテスト。サブスクリプションがアクティブな場合（全文表示）、非アクティブな場合（見出しベース部分表示）、見出しが見つからない場合のフォールバックを検証 |
| splitContentByHeading.ts | app/lib/blog/post-detail/splitContentByHeading.ts | HTML文字列とカットオフ見出しID（`cutoffHeadingId: string | null`）を受け取り、指定された見出しの終わり位置でコンテンツを分割する純粋関数。`{ visibleContent: string, hiddenContent: string }` を返す。副作用なし |
| splitContentByHeading.test.ts | app/lib/blog/post-detail/splitContentByHeading.test.ts | splitContentByHeading.tsのテスト。見出しIDでの分割、見出しが見つからない場合のフォールバック、エッジケースを検証 |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| fetchPostBySlug.server.ts | app/data-io/blog/post-detail/fetchPostBySlug.server.ts | slugを受け取り、ファイルシステムから記事データ（frontmatter含む: title, description, publishedAt, author, tags, category, source, **freeContentHeading**）を取得する関数。sourceプロパティがある場合は外部ファイルを読み込む。記事が存在しない場合はnullを返す。**freeContentHeadingフィールドを含むPostDetailDataを返す** |
| fetchPostBySlug.server.test.ts | app/data-io/blog/post-detail/fetchPostBySlug.server.test.ts | fetchPostBySlug.server.tsのテスト。正常系（記事取得成功、参照機能、description/tags/freeContentHeading取得）と異常系（記事が存在しない）を検証 |
| fetchExternalMarkdown.server.ts | app/data-io/blog/post-detail/fetchExternalMarkdown.server.ts | 外部マークダウンファイルのパスを受け取り、ファイルシステムから読み込む関数。パスバリデーション（ディレクトリトラバーサル対策）を実施。ファイルが存在しない場合はエラーをthrow |
| fetchExternalMarkdown.server.test.ts | app/data-io/blog/post-detail/fetchExternalMarkdown.server.test.ts | fetchExternalMarkdown.server.tsのテスト。正常系（ファイル読み込み成功）、異常系（ファイル不存在、不正パス）を検証 |
| getSubscriptionStatus.server.ts | app/data-io/blog/post-detail/getSubscriptionStatus.server.ts | ユーザーIDを受け取り、accountサービスのdata-io層（`app/data-io/account/subscription/getSubscriptionByUserId.server.ts`）を介してサブスクリプション状態を取得し、有効なサブスクリプションが存在するかを判定する関数。`{ hasActiveSubscription: boolean }` を返す。サブスクリプションが存在し、`status === 'active'` かつ `current_period_end` が未来日の場合に`true`。エラー発生時は安全側（`false`）に倒す |
| getSubscriptionStatus.server.test.ts | app/data-io/blog/post-detail/getSubscriptionStatus.server.test.ts | getSubscriptionStatus.server.tsのテスト。正常系（アクティブなサブスクリプション、非アクティブ、サブスクリプションなし）、異常系（accountサービスdata-io層のエラー）を検証 |

---

## 5. リントシステム拡張（scripts層）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| validate-free-content-heading.js | scripts/lint-blog-metadata/rules/validate-free-content-heading.js | frontmatterの`freeContentHeading`で指定された見出しが実際に記事内に存在するかを検証するリントルール。見出しの重複、タイポ、レベル不整合を検出 |
| validate-free-content-heading.test.js | scripts/lint-blog-metadata/rules/validate-free-content-heading.test.js | validate-free-content-heading.jsのテスト。正常系（見出し存在）、異常系（見出し不存在、重複、タイポ）を検証 |
