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
6. **サブスクリプション状態に応じたアクセス制御**:
   - **目的**: note型の「導入部分は公開、本編は会員限定」という表示制御を実現し、コンテンツの収益化を支援する
   - **記事の可視範囲制御**: 各記事のfrontmatterで`freeContentHeading`（見出し名）を指定し、未契約ユーザーには指定された見出しの終わりまでのコンテンツを表示
   - **ペイウォール表示**: 未契約ユーザーが制限を超えるコンテンツにアクセスした場合、指定見出しの終わり位置にペイウォール（障壁）を表示
   - **購読促進UI**: ペイウォール内に会員登録・サブスクリプション購入を促すバナーやCTAボタンを配置
   - **契約ユーザーの扱い**: 有効なサブスクリプションを持つユーザーには、記事全文を制限なく表示

**開発戦略: 段階的強化 (Progressive Enhancement)**:

1. **ステップ1: モック実装 (UIの確立)** - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません
2. **ステップ2: 機能強化 (ロジックの接続)** - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます

### 🏛️ アーキテクチャ方針: クロスランタイム対応

- **目的**: Remixの「Write Once, Run Anywhere」の思想に基づき、Node.js環境だけでなく、Cloudflare Workersのようなエッジランタイムでもアプリケーションが動作するよう設計する
- **基本戦略**: 本ブログ機能においては、パフォーマンス最適化のため、マークダウンからHTMLへの変換は**ビルド時（プレビルド）**に実行されることを基本戦略とする。
- **マークダウン変換処理**:
  - マークダウンからHTMLへの変換処理（`app/lib`層）は、特定のランタイム（例: Node.js）に依存しない純粋なJavaScript/TypeScriptで実装する
  - これにより、ビルド時変換、Node.jsサーバーでのリクエスト時レンダリング、エッジでのリクエスト時レンダリングなど、多様なデプロイ戦略に柔軟に対応可能となるが、**本機能ではビルド時変換を主とする**。
  - 使用するライブラリ（例: `shiki`）は、エッジ環境での動作互換性を考慮して選定、または設定を行う

### app/components要件（app/routes, app/components）

*Route責務* (`app/routes/blog.$slug.tsx`):

- URLパラメータ（slug）を取得し、loaderでデータ取得を実行
- data-io層を介して、**ビルド時に生成された記事データ**（HTML変換済みコンテンツ、見出し情報を含む）を取得する
- **認証状態の取得**:
  - リクエストからセッションCookieを読み取り、ユーザーの認証状態を確認（`getSession.server.ts`）
- **カテゴリベースのアクセス制御**:
  - カテゴリが「起業」以外かつ未ログインの場合、`/login?returnTo=...`へリダイレクト
- **サブスクリプション状態の取得**:
  - 認証済みユーザーの場合、accountサービスのdata-io層を介してサブスクリプション状態を取得
  - 未認証ユーザーの場合、サブスクリプション状態は`null`として扱う
- 記事データ + サブスクリプション状態 + 見出し情報を取得し、lib層で可視範囲を判定
- 取得したデータをコンポーネントに渡す
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
  - **ビルド時エラーのハンドリング**: 外部参照ファイルが見つからないなど、コンテンツ生成時の問題はビルドプロセスで検知する。`loader`は、ビルド済みデータが存在しない場合に404を返す責務に集中する

*Component責務* (`app/components/blog/post-detail/PostDetailSection.tsx`):

- **テーマ対応**: commonセクションで管理されるテーマ状態に応じて、コンポーネントの配色が自動的に切り替わります
- 記事詳細情報（タイトル、投稿日、著者、本文）を表示
- **記事メタ情報セクション**: タイトル、著者、投稿日を表示
- マークダウンから変換されたHTMLコンテンツを安全にレンダリング
- **サブスクリプション状態に基づくコンテンツ制御**:
  - サブスクリプション状態とfreeContentHeadingを元に、表示するコンテンツ範囲を判定
  - 契約ユーザー（`hasActiveSubscription: true`）: 記事全文を表示
  - 未契約ユーザー: `freeContentHeading`で指定された見出しの終わりまでのコンテンツを表示し、それ以降にペイウォールを表示
- **ペイウォール表示**: 未契約ユーザーに対して、制限を超えるコンテンツの前にPaywallコンポーネントを表示
- **購読促進バナー表示**: Paywall内に会員登録・サブスクリプション購入を促すSubscriptionPromotionBannerコンポーネントを配置
- **Mermaidクライアント側レンダリング**: useEffectでMermaid.jsライブラリを初期化し、クラス付与されたMermaidコードブロックをSVG図表に変換
- 共通レイアウト（ヘッダー・フッター）を含む全体構成

### 🧠 純粋ロジック要件（app/lib）

*マークダウン変換処理* (`app/lib/blog/post-detail/markdownConverter.ts`):

- 入力: マークダウン形式の文字列
- 出力: HTML形式の文字列
- **実行タイミング**: 主にビルド時（プレビルド）に実行され、マークダウンファイルをHTMLコンテンツに変換し、永続化されることを想定する。
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

*コンテンツ可視範囲判定処理* (`app/lib/blog/post-detail/determineContentVisibility.ts`):

- 入力: サブスクリプション状態（`hasActiveSubscription: boolean`）、記事の公開範囲見出し（`freeContentHeading: string | null`）、見出し情報配列（`headings: Heading[]`）
- 出力: コンテンツ可視範囲の判定結果 `{ showFullContent: boolean, cutoffHeadingId: string | null }`
- 責務: サブスクリプション状態と指定見出しに基づいて、記事のどの範囲を表示すべきかを判定する純粋関数
- ロジック:
  - `hasActiveSubscription === true`: `showFullContent: true, cutoffHeadingId: null`
  - `hasActiveSubscription === false` かつ `freeContentHeading` が指定: 見出し配列から該当見出しを検索し、その見出しIDを返す `showFullContent: false, cutoffHeadingId: <headingId>`
  - `freeContentHeading` が見つからない、またはnull: `showFullContent: true, cutoffHeadingId: null`（全文公開）
- 副作用なし（テスト容易性を確保）

*見出しベースコンテンツ分割処理* (`app/lib/blog/post-detail/splitContentByHeading.ts`):

- 入力: HTML文字列、カットオフ見出しID（`cutoffHeadingId: string | null`）
- 出力: `{ visibleContent: string, hiddenContent: string }`
- 責務: 指定された見出しIDの終わり位置でHTMLコンテンツを分割する純粋関数
- ロジック:
  - `cutoffHeadingId === null`: 全文を`visibleContent`として返す
  - `cutoffHeadingId`が指定: HTMLをパースし、該当IDを持つ見出しの次の兄弟要素の直前で分割
- 副作用なし

### 🔌 副作用要件（app/data-io）

*記事データ取得処理* (`app/data-io/blog/post-detail/fetchPostBySlug.server.ts`):

- 入力: slug（URL識別子）
- 出力: ビルド済みの記事データ（`Post`型）
- 責務: **ビルド時に生成されたデータバンドル**（例: `~/generated/blog-posts.ts`）から、指定されたslugに一致する記事データを取得する
- **備考**: 外部ファイル参照（`source`プロパティ）やファイルシステムからの直接読み込みは、ビルドスクリプトの責務。この層では、すでに処理済みのデータを安全に取得することに専念する
- エラーハンドリング: ビルド済みデータ内に記事が存在しない場合は`null`を返す

*サブスクリプション状態取得処理* (`app/data-io/blog/post-detail/getSubscriptionStatus.server.ts`):

- 入力: ユーザーID（セッションから取得）
- 出力: サブスクリプション状態 `{ hasActiveSubscription: boolean }`
- 責務: accountサービスのdata-io層（`app/data-io/account/subscription/getSubscriptionByUserId.server.ts`）を介して、ユーザーのサブスクリプション状態を取得し、有効なサブスクリプションが存在するかを判定する
- **サービス間連携**: blogサービスからaccountサービスのdata-io層を直接呼び出す
- ロジック:
  - サブスクリプションが存在し、`status === 'active'` かつ `current_period_end` が未来日: `hasActiveSubscription: true`
  - 上記以外: `hasActiveSubscription: false`
- エラーハンドリング: accountサービスのdata-io層でエラーが発生した場合は、`hasActiveSubscription: false`として安全側に倒す（記事を制限する方向）

---

**Note**: `fetchExternalMarkdown.server.ts` はランタイムでは不要となり、ビルドスクリプトの一部としてその責務が移行するため、設計書から削除します。
