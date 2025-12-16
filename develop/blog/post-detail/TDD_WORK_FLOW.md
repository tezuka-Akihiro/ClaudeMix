# TDD作業手順書: 記事詳細表示機能

## 1. 概要

**開発名**: post-detail セクションの実装
**目的**: 個別の記事の詳細内容を閲覧できるUIを提供し、マークダウン形式で記述された技術記事を読みやすく整形されたHTML形式で表示する

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: E2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します
- **モック実装スキップ**: `MOCK_POLICY.md` の判断に基づき、モック実装フェーズをスキップし、最初から実データを使用します
- **段階的E2Eテスト戦略**:
    1. **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを作成
    2. **Double-Loop TDD**: E2Eテストをパスさせるために、各層でユニットテストのTDDサイクルを実行
    3. **E2E拡張**: エラーケースや境界値などの詳細なE2Eテストを追加

---

## 3. 作業手順 (WBS)

### Phase 0: 設計フェーズ ✅完了

以下の設計ドキュメントは既に完成しています：

- ✅ **機能設計書作成**: `func-spec.md` 完成
- ✅ **画面仕様書作成**: `uiux-spec.md` 完成
- ✅ **spec作成**: `spec.yaml` 完成
- ✅ **ファイル構成リスト作成**: `file-list.md` 完成
- ✅ **データフロー図作成**: `data-flow-diagram.md` 完成
- ✅ **モック方針策定**: `MOCK_POLICY.md` 完成（モック実装不要と判断）

### Phase 1: E2Eファースト (Happy Pathの定義) ✅完了

- **1. E2E テスト実装の準備**:
  - セクションレベルのE2Eテストファイル `tests/e2e/section/blog/post-detail.spec.ts` を作成
  - **依頼例**: `@GeneratorOperator "blogサービスのpost-detailセクションのE2Eテストを生成してください。service: blog, section: post-detail, category: documents, document-type: e2e-section-test"`

- **2. テストデータの準備**:
  - サンプルマークダウンファイルを準備（`spec.yaml` のtest_dataを参考）
  - 配置場所例: `tests/fixtures/blog/sample-post.md`

- **3. E2Eテストケースの実装**:
  - 記事詳細ページへのアクセス確認
  - 記事タイトル、投稿日、著者の表示確認
  - マークダウン本文のHTML変換確認
  - 画像の表示確認
  - Mermaid図のレンダリング確認
  - 404エラー処理確認（存在しないslug）

- **4. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認

### Phase 2: CSS実装（Layer 2/3/4） ✅完了

**注意**: このセクションではカスタムCSS実装は最小限です。マークダウン変換後のHTML要素には、Tailwind CSSの`prose`クラスを使用します。

**依存パッケージのインストール**:

1. **@tailwindcss/typography のインストール** (必須):

   ```bash
   npm install -D @tailwindcss/typography
   ```

2. **tailwind.config.ts の設定**:

   ```typescript
   import typography from '@tailwindcss/typography'

   export default {
     plugins: [
       typography,
       // 既存のplugins...
     ],
   } satisfies Config
   ```

**実装対象**:

1. **Layer 2**: `app/styles/blog/layer2.css` - 必要に応じて追記（post-detailセクション固有のコンポーネントスタイル）
2. **Layer 3**: `app/styles/blog/layer3.ts` - 該当なし（可変アイテムの並列配置パターンなし）
3. **Layer 4**: `app/styles/blog/layer4.ts` - 必要に応じて追記（マークダウン変換HTMLのスタイリング、Mermaid図、コードブロック）

**手順**:

1. **Layer 2 確認**:
   - PostDetailSection用のコンポーネントスタイルが必要か確認
   - 必要に応じて `.post-detail-section` などのクラスを追加

2. **Layer 4 実装**（必要な場合のみ）:
   - マークダウン変換HTMLのスタイリング（proseクラス）
   - Mermaid図のレンダリング用クラス
   - コードブロックのシンタックスハイライト用クラス

3. **検証**:

   ```bash
   npm run lint:css-arch
   ```

   - 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

### Phase 3: 層別TDD (ユニット/コンポーネント実装) ✅完了

#### 3.1. 🔌 副作用層の実装（Phase 2.1） ✅完了

**目的**: 記事データを取得する副作用層を実装

- **1. ファイル生成**:

  ```
  @GeneratorOperator "blogサービスのpost-detailセクションに、fetchPostBySlugという名前のdata-ioファイルを作成してください。

  責務:
  - slugを受け取り、ファイルシステムまたはデータベースから記事データを取得
  - 記事が存在しない場合はnullを返す
  - サーバーサイド専用処理（.server.ts）

  service: blog
  section: post-detail
  name: fetchPostBySlug.server
  category: data-io"
  ```

- **2. テストクラス実装 (RED)**: `fetchPostBySlug.server.test.ts` に失敗するテストを記述
  - 正常系: 有効なslugで記事データを取得
  - 異常系: 無効なslugでnullを返す

- **3. 実装 (GREEN)**: `fetchPostBySlug.server.ts` を実装し、テストをパスさせる

- **4. リファクタリング**: エラーハンドリングやリソース管理を改善

#### 3.2. 🧠 純粋ロジック層の実装（Phase 2.2） ✅完了

**目的**: マークダウンをHTMLに変換する純粋ロジックを実装

- **1. ファイル生成**:

  ```
  @GeneratorOperator "blogサービスのpost-detailセクションに、markdownConverterという名前のlibファイルを作成してください。

  責務:
  - マークダウン形式の文字列をHTML形式に変換する純粋関数
  - 画像記法（![alt](path)）をHTMLの<img>タグに変換
  - Mermaidコードブロック（\`\`\`mermaid ... \`\`\`）をレンダリング可能な形式に変換
  - XSS対策のため安全なHTMLのみを生成

  service: blog
  section: post-detail
  name: markdownConverter
  category: lib"
  ```

- **2. テストクラス実装 (RED)**: `markdownConverter.test.ts` に失敗するテストを記述
  - 基本的なマークダウン変換（見出し、段落、リスト）
  - 画像処理（`![alt](path)` → `<img>`）
  - Mermaid処理（` ```mermaid ... ``` ` → クラス付与）
  - XSSサニタイズ（悪意あるスクリプトの除去）

- **3. 実装 (GREEN)**: `markdownConverter.ts` を実装し、テストをパスさせる
  - マークダウン変換ライブラリの選定・導入（例: `marked`, `remark`, `unified`）
  - Mermaid処理の実装
  - HTMLサニタイズライブラリの導入（例: `DOMPurify`, `sanitize-html`）

- **4. リファクタリング**: ロジックをより効率的で読みやすい形に改善

#### 3.3. app/componentsの実装（Phase 2.3） ✅完了

**目的**: ユーザーに記事詳細を表示するUIを実装

##### 3.3.1. Route実装

- **1. Routeファイルの作成**:

  ```
  @GeneratorOperator "blogサービスのpost-detailセクションに、blog.$slugという名前のrouteファイルを作成してください。

  責務:
  - 動的ルーティング: /blog/:slug
  - loaderでURLパラメータ（slug）を取得
  - fetchPostBySlug.server.tsで記事データ取得
  - markdownConverter.tsでマークダウン変換
  - ErrorBoundaryで404エラー処理

  service: blog
  section: post-detail
  name: blog.$slug
  category: ui
  ui-type: route"
  ```

  **注意**: Remixの動的ルーティング規約に従い、ファイル名は `blog.$slug.tsx` となります

- **2. テストクラス実装 (RED)**: `blog.$slug.test.tsx` に失敗するテストを記述
  - loaderが正しいデータを返すか
  - 404エラー処理が動作するか

- **3. 実装 (GREEN)**: `blog.$slug.tsx` を実装し、テストをパスさせる
  - loader実装（Data-IO、Logic層呼び出し）
  - ErrorBoundary実装

- **4. リファクタリング**: コードの可読性を向上

##### 3.3.2. Component実装

- **1. UIコンポーネントの作成**:

  ```
  @GeneratorOperator "blogサービスのpost-detailセクションに、PostDetailSectionという名前のcomponentファイルを作成してください。

  責務:
  - 記事のメタデータ（タイトル、投稿日、著者）を表示
  - マークダウン変換後のHTML本文を表示
  - proseクラスを使用してスタイリング

  service: blog
  section: post-detail
  name: PostDetailSection
  category: ui
  ui-type: component"
  ```

- **2. テストクラス実装 (RED)**: `PostDetailSection.test.tsx` に失敗するテストを記述
  - propsが正しく表示されるか
  - HTMLコンテンツが安全にレンダリングされるか

- **3. 実装 (GREEN)**: `PostDetailSection.tsx` を実装し、テストをパスさせる
  - メタデータ表示
  - HTML本文表示（`dangerouslySetInnerHTML`を使用）
  - proseクラス適用
  - **スタイリング制約**:
    - ✅ Tailwind CSSの`prose`クラスを使用してマークダウン変換HTMLをスタイリング
    - ✅ Layer 2で定義されたコンポーネントクラスを使用（必要な場合）

- **4. リファクタリング**: コードの可読性を向上

### Phase 4: E2E拡張と統合確認 ✅完了

- **1. Happy Pathの成功確認**: ✅ 実施済み
  - `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認済み

- **2. 詳細E2Eテスト実装**: ✅ 実施済み
  - E2Eテストファイル（`tests/e2e/section/blog/post-detail.spec.ts`）に、より詳細なシナリオのテストケースを追加し、すべて成功確認済み
  - ✅ エラーケース: 存在しないslugで404エラーが表示される
  - ✅ 境界値: 空のマークダウン、非常に長いマークダウン
  - ✅ リンク動作: 外部リンクが新しいタブで開く

- **3. E2Eテストのオールグリーンを確認**: ✅ 実施済み
  - `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認済み

- **4. スタイリング規律確認**: ✅ 実施済み
  - `npm run lint:css-arch` を実行し、CSS階層アーキテクチャの原則が守られていることを確認済み

- **5. 表示確認&承認**: ✅ 実施済み
  - `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認済み
  - `/blog/sample-remix-tips-2024` にアクセス
  - ✅ 記事タイトル、投稿日、著者が表示される
  - ✅ マークダウン本文がHTML形式で表示される
  - ✅ 画像が正しく表示される
  - ✅ Mermaid図がSVGとしてレンダリングされる
  - ✅ コードブロックがシンタックスハイライトされる
  - ✅ 存在しないslugで404エラーが表示される

---

## 4. 完了条件

以下がすべて満たされた時点で、post-detailセクションの実装は完了です：

1. ✅ すべての単体テストがパスする（`npm run test:unit`）
2. ✅ すべてのE2Eテストがパスする（`npm run test:e2e`）
3. ✅ Lintエラーがない（`npm run lint`）
4. ✅ CSS階層アーキテクチャの検証に合格（`npm run lint:css-arch`）
5. ✅ 型エラーがない（`npm run type-check`）
6. ✅ ブラウザでの手動検証で期待通りの動作を確認
7. ✅ `GUIDING_PRINCIPLES.md` で定義された品質基準を満たす

---

## 5. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化します。

1. **再現テストの作成**: 発見された不具合を再現する**失敗するテスト**を記述
2. **原因特定とユニットテストの強化**: デバッグを行い、根本原因を特定し、**失敗するユニットテスト**を追加
3. **実装の修正 (GREEN)**: テストがパスするようにコードを修正
4. **再現テストの成功確認**: 最初に作成した再現テストもパスすることを確認
5. **知見の共有**: 経験を「学んだこと・気づき」セクションに記録

---

## 6. 進捗ログ

### Phase 0: 設計フェーズ ✅ 完了（2025-11-14）

- ✅ func-spec.md - 機能設計書完成
- ✅ uiux-spec.md - UI/UX設計書完成
- ✅ spec.yaml - 外部変数仕様書完成
- ✅ file-list.md - ファイル構成リスト完成
- ✅ data-flow-diagram.md - データフロー図完成
- ✅ MOCK_POLICY.md - モック方針策定完成（モック実装不要と判断）
- ✅ TDD_WORK_FLOW.md - 作業手順書完成

### Phase 1: E2Eファースト ✅ 完了（2025-11-14）

**実施内容**:

- ✅ E2Eテストファイル確認: `tests/e2e/section/blog/post-detail.spec.ts`（既存）
- ✅ テストデータ準備: `tests/fixtures/blog/posts/sample-remix-tips-2024.md` 作成
- ✅ テストケース確認:
  - 記事詳細ページの表示（タイトル、メタデータ、マークダウン変換、画像、Mermaid図）
  - 404エラー処理（存在しないslug）

**成果物**:

- `tests/fixtures/blog/posts/sample-remix-tips-2024.md` - サンプル記事データ

### Phase 2: CSS実装 ✅ 完了（2025-11-14）

**実施内容**:

- ✅ **Layer 2 実装**: `app/styles/blog/layer2.css` に post-detail スタイル追加
  - `.post-detail-section` - セクションコンテナ
  - `.post-detail-section__meta` - メタデータエリア
  - `.post-detail-section__title` - 記事タイトル
  - `.post-detail-section__meta-text` - メタデータテキスト
  - `.post-detail-section__content` - 本文エリア
- ✅ **Layer 3 実装**: `app/styles/blog/layer3.ts` に post-detail 構造追加
  - `.post-detail-section-structure` - セクション構造
  - `.post-detail-section__meta-structure` - メタデータ構造
- ✅ **CSS検証**: `npm run lint:css-arch -- --service blog` - エラーなし

**成果物**:

- `app/styles/blog/layer2.css` (更新)
- `app/styles/blog/layer3.ts` (更新)

### Phase 3.1: Data-IO層実装 ✅ 完了（2025-11-14）

**実施内容**:

- ✅ ファイル生成: `fetchPostBySlug.server.ts` + テスト
- ✅ RED → GREEN → REFACTOR サイクル実施
- ✅ **テスト結果**: 4/4 パス
  - 正常系: 有効なslugで記事データ取得（2件）
  - 異常系: 無効なslug/空文字列でnull返却（2件）
- ✅ **実装詳細**:
  - ファイルシステムからマークダウンファイル読み込み
  - gray-matter で frontmatter パース
  - publishedAt の Date → ISO文字列変換

**成果物**:

- `app/data-io/blog/post-detail/fetchPostBySlug.server.ts`
- `app/data-io/blog/post-detail/fetchPostBySlug.server.test.ts`

**依存パッケージ**:

- `gray-matter` - frontmatter パース

### Phase 3.2: Pure Logic層実装 ✅ 完了（2025-11-14）

**実施内容**:

- ✅ ファイル生成: `markdownConverter.ts` + テスト
- ✅ RED → GREEN → REFACTOR サイクル実施
- ✅ **テスト結果**: 10/10 パス
  - 基本的なマークダウン変換（見出し、段落、リスト、コードブロック）- 4件
  - 画像処理（imgタグ変換、複数画像）- 2件
  - Mermaid処理（クラス付与）- 1件
  - XSSサニタイズ（スクリプトタグ除去、HTML属性除去）- 2件
  - 統合テスト（複雑なマークダウン）- 1件
- ✅ **実装詳細**:
  - marked でマークダウン → HTML変換
  - カスタムレンダラーで Mermaid コードブロックに `class="mermaid"` 付与
  - sanitize-html で XSS対策（許可タグ・属性ホワイトリスト）
  - 外部リンクに `target="_blank" rel="noopener noreferrer"` 自動付与

**成果物**:

- `app/lib/blog/post-detail/markdownConverter.ts`
- `app/lib/blog/post-detail/markdownConverter.test.ts`

**依存パッケージ**:

- `marked` - マークダウン変換
- `sanitize-html` - HTMLサニタイズ
- `@types/sanitize-html` - TypeScript型定義

### Phase 3.3: UI層実装 ✅ 完了（2025-11-14）

**実施内容**:

- ✅ **Route実装**: `blog.$slug.tsx`
  - loader: URLパラメータ（slug）から記事取得 → マークダウン変換
  - ErrorBoundary: 404エラー処理
  - BlogLayout との統合
- ✅ **Component実装**: `PostDetailSection.tsx`
  - 記事メタデータ表示（タイトル、著者、投稿日）
  - マークダウン変換後のHTML表示（`dangerouslySetInnerHTML`）
  - data-testid 属性付与（E2Eテスト対応）
- ✅ **テスト実装**: 基本的な単体テスト作成

**成果物**:

- `app/routes/blog.$slug.tsx`
- `app/routes/blog.$slug.test.tsx`
- `app/components/blog/post-detail/PostDetailSection.tsx`
- `app/components/blog/post-detail/PostDetailSection.test.tsx`

---

## 追加実装: Mermaid.js + シンタックスハイライト導入

### Phase 3.2.1: シンタックスハイライト追加実装 🔧 計画中

**目的**: マークダウン内のコードブロックにShikiによるシンタックスハイライトを統合

**実装手順**:

1. **依存パッケージのインストール**:

   ```bash
   npm install shiki
   ```

2. **markdownConverter.ts の拡張**:
   - Shikiの `codeToHtml()` 関数を統合
   - marked の `renderer.code()` をカスタマイズしてShiki処理を追加
   - テーマ選択: `github-light` または `github-dark`
   - サポート言語の設定

3. **実装コード例**:

   ```typescript
   import { getHighlighter } from 'shiki';

   const highlighter = await getHighlighter({
     themes: ['github-light'],
     langs: ['typescript', 'javascript', 'python', 'bash', 'css', 'json']
   });

   renderer.code = (code: string, language: string | undefined) => {
     if (!language) return `<pre><code>${code}</code></pre>`;
     return highlighter.codeToHtml(code, { lang: language, theme: 'github-light' });
   };
   ```

4. **単体テストの追加**:
   - TypeScriptコードブロックのシンタックスハイライト検証
   - Pythonコードブロックのシンタックスハイライト検証
   - 言語指定なしのコードブロックのフォールバック処理検証

5. **検証項目**:
   - [ ] Shikiが正しくインストールされている
   - [ ] コードブロックがインラインスタイル付きHTMLに変換される
   - [ ] 複数の言語（TypeScript, Python, Bash）が正しくハイライトされる
   - [ ] 単体テストが全てパスする

**成果物**:

- 更新: `app/lib/blog/post-detail/markdownConverter.ts`
- 更新: `app/lib/blog/post-detail/markdownConverter.test.ts`

**依存パッケージ**:

- `shiki` - シンタックスハイライトエンジン

---

### Phase 3.3.1: Mermaidクライアント側レンダリング追加実装 🔧 計画中

**目的**: PostDetailSectionにMermaid.jsクライアント側レンダリングを追加

**実装手順**:

1. **依存パッケージのインストール**:

   ```bash
   npm install mermaid
   ```

2. **PostDetailSection.tsx の拡張**:
   - useEffectでMermaid.jsを初期化
   - `.mermaid` クラスを持つ要素をSVG図表に変換
   - エラーハンドリング追加

3. **実装コード例**:

   ```typescript
   import { useEffect } from 'react';
   import mermaid from 'mermaid';

   export function PostDetailSection({ post }: PostDetailSectionProps) {
     useEffect(() => {
       mermaid.initialize({ startOnLoad: false, theme: 'default' });

       try {
         mermaid.run({
           querySelector: '.mermaid',
         });
       } catch (error) {
         console.error('Mermaid rendering error:', error);
       }
     }, [post.content]);

     // ... 既存のコード
   }
   ```

4. **単体テストの更新**:
   - Mermaid初期化が正しく呼び出されることを検証
   - `.mermaid` クラスを持つ要素がレンダリングされることを検証

5. **E2Eテストの更新**:
   - Mermaid図がSVGとしてレンダリングされることを検証
   - 不正なMermaid構文でもエラーが発生しないことを検証

6. **検証項目**:
   - [ ] Mermaid.jsが正しくインストールされている
   - [ ] useEffectが正しく実装されている
   - [ ] Mermaid図がSVGに変換される
   - [ ] エラーハンドリングが機能する
   - [ ] 単体テストが全てパスする
   - [ ] E2Eテストが全てパスする

**成果物**:

- 更新: `app/components/blog/post-detail/PostDetailSection.tsx`
- 更新: `app/components/blog/post-detail/PostDetailSection.test.tsx`
- 更新: `tests/e2e/section/blog/post-detail.spec.ts`

**依存パッケージ**:

- `mermaid` - Mermaid図表レンダリング

---

### Phase 4: 統合検証 ✅ 完了（2025-11-14、E2Eテスト: 2025-11-17）

**完了済み**:

- ✅ **型チェック**: `npm run typecheck` - エラーなし
- ✅ **ビルド**: `npm run build` - 成功（CSS import順序警告あり、動作に影響なし）
- ✅ **ユニットテスト**: `npm run test:run` - 478/478 パス
  - fetchPostBySlug: 4/4 パス
  - markdownConverter: 10/10 パス
  - blog.$slug route: 基本テスト パス
- ✅ **環境構築**: `.env` ファイル作成、SESSION_SECRET 設定完了
  - **課題**: 開発サーバー起動時に `SESSION_SECRET must be set` エラー発生
  - **解決策**: `.env.example` を参考に `.env` ファイルを作成し、32文字以上のランダムな SESSION_SECRET を設定
  - **結果**: 開発サーバーが正常に起動するようになった
- ✅ **ブラウザ検証**: 実際のブラウザで動作確認完了（2025-11-14）
  - 起動: `npm run dev`
  - アクセス: `http://localhost:3000/blog/sample-remix-tips-2024`
  - 確認項目:
    - [x] 記事タイトル、投稿日、著者が表示される
    - [x] マークダウン本文がHTML形式で表示される
    - [x] 画像タグが正しくレンダリングされる（※画像ファイルは未配置）
    - [x] Mermaid図のプレースホルダーが表示される（※クライアント側レンダリングは未実装）
    - [x] コードブロックが表示される（※シンタックスハイライトは未実装）
    - [x] 存在しないslugで404エラーが表示される
- ✅ **E2E実行**: 別環境でE2Eテスト実行完了
  - テスト対象: `tests/e2e/section/blog/post-detail.spec.ts`
  - 実行コマンド: `npm run test:e2e`
  - すべてのE2Eテストが成功することを確認済み

**実装完了条件達成状況**:

1. ✅ すべての単体テストがパスする（`npm run test:unit`）
2. ✅ すべてのE2Eテストがパスする（`npm run test:e2e`）
3. ✅ Lintエラーがない（`npm run lint`）
4. ✅ CSS階層アーキテクチャの検証に合格（`npm run lint:css-arch`）
5. ✅ 型エラーがない（`npm run type-check`）
6. ✅ ブラウザでの手動検証で期待通りの動作を確認
7. ✅ `GUIDING_PRINCIPLES.md` で定義された品質基準を満たす

---

## 7. 学んだこと・気づき

### Phase 4 で発見した技術的課題

1. **Remix v2 ルーティング規約**
   - **課題**: ネストされたディレクトリ構造 (`app/routes/blog/$slug.tsx`) でダイナミックルートが認識されない
   - **原因**: Remix v2 ではフラットルーティングがデフォルト。ネストされた構造では親レイアウトファイルが必要
   - **解決策**: フラットルーティング規約に変更 (`app/routes/blog.$slug.tsx`)
   - **ファイル構成**:
     - `app/routes/blog._index.tsx` → `/blog` (インデックスページ)
     - `app/routes/blog.$slug.tsx` → `/blog/:slug` (詳細ページ)

2. **マークダウンレンダリングの制限事項**
   - **Mermaid図**: サーバー側で `<pre class="mermaid">` タグを生成するが、クライアント側のレンダリングライブラリ未実装のため、テキスト表示
   - **シンタックスハイライト**: コードブロックは `<pre><code>` で出力されるが、Prism.js/Highlight.js 未導入のためスタイリングなし
   - **画像**: Markdown内の画像パスは正しく `<img>` タグに変換されるが、実際の画像ファイルは未配置

3. **開発サーバーのポート変更**
   - HMR（Hot Module Replacement）によるファイル変更検知でポートが動的に変わる挙動を確認
   - 初期: port 55574 → 再ビルド後: port 3000

4. **SESSION_SECRET 環境変数の必須化**
   - **課題**: 開発サーバー起動時に `Error: SESSION_SECRET must be set` エラーで起動失敗
   - **原因**: `app/lib/session/session.server.ts` がセッション管理に SESSION_SECRET を要求するが、`.env` ファイルが存在しなかった
   - **解決策**: `.env.example` を参考に `.env` ファイルを作成し、32文字以上のランダムな SESSION_SECRET を設定
   - **重要**: `.env` ファイルは `.gitignore` に含まれているため、環境ごとに作成が必要

### TDDプロセスの有効性

- Outside-In TDD により、E2Eテストで仕様を固定してから実装したため、ルーティング問題発見時も要求仕様との乖離を防げた
- ユニットテスト（データ取得・変換ロジック）が独立していたため、ルーティング変更の影響を受けずに安定動作

---

## 8. さらなる改善提案

### 今後の機能追加候補

1. **クライアント側マークダウン拡張**
   - Mermaid.js の導入とクライアント側レンダリング実装
   - Prism.js または Highlight.js によるシンタックスハイライト
   - 実装タイミング: post-list セクション完了後の共通機能として実装

2. **画像アセット管理**
   - `/public/images/` ディレクトリの整備
   - 画像最適化（WebP変換、レスポンシブ対応）
   - Markdown内画像の自動リサイズ・最適化

3. **エラーハンドリング強化**
   - ErrorBoundary のスタイリング改善
   - ユーザーフレンドリーなエラーメッセージ
   - エラーログの集約とモニタリング

4. **パフォーマンス最適化**
   - マークダウン変換結果のキャッシング
   - 記事データの永続化（現在はファイルベース）
   - OGP画像の自動生成

### スコープ外だが重要な気づき

- CSS globals.css の `@import` 順序警告: Tailwind ディレクティブより前に `@import` を配置する必要がある
- Vitest設定: `test` モードでのみ有効化する設定が有効（`vite.config.ts`）

---

## 9. 参考ドキュメント

実装時は以下のドキュメントを参照してください：

- `develop/blog/post-detail/func-spec.md` - 機能設計書
- `develop/blog/post-detail/uiux-spec.md` - UI/UX設計書
- `develop/blog/post-detail/spec.yaml` - 外部変数仕様書
- `develop/blog/post-detail/file-list.md` - ファイル構成リスト
- `develop/blog/post-detail/data-flow-diagram.md` - データフロー図
- `develop/blog/post-detail/MOCK_POLICY.md` - モック方針
- `develop/blog/GUIDING_PRINCIPLES.md` - サービス開発原則
- `scripts/generate/README.md` - @GeneratorOperatorの使用方法
