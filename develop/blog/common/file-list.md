# file-list.md - common Section

## 目的

commonセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| common.spec.ts | tests/e2e/section/blog/common.spec.ts | commonセクション単独のE2Eテスト（OGP画像生成を含む） |

---

## 2. UI層（Phase 3.3 / 3.4）

### 2.1 Routes (common固有)

| ファイル名 | パス | URL | 説明 |
| :--- | :--- | :--- | :--- |
| blog._index.tsx | app/routes/blog._index.tsx | /blog | ブログトップページのRoute（BlogLayoutを使用した最小限の実装） |
| ogp.$slug[.png].tsx | app/routes/ogp.$slug[.png].tsx | /ogp/:slug.png | OGP画像生成エンドポイント |
| terms.tsx | app/routes/terms.tsx | /terms | `/blog/terms`への301リダイレクト（外部サービス連携用） |
| privacy.tsx | app/routes/privacy.tsx | /privacy | `/blog/privacy`への301リダイレクト（外部サービス連携用） |

**注**: blog._index.tsxはpostsセクションでも使用されます。commonセクションでは共通レイアウトの統合テスト用として定義しています。

### 2.2 Components (common固有)

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| BlogLayout.tsx | app/components/blog/common/BlogLayout.tsx | ページ全体のレイアウトコンテナ（Header/Footer/Contentエリア） |
| BlogLayout.test.tsx | app/components/blog/common/BlogLayout.test.tsx | ユニットテスト |
| BlogHeader.tsx | app/components/blog/common/BlogHeader.tsx | ブログヘッダー（タイトル、menuボタン） |
| BlogHeader.test.tsx | app/components/blog/common/BlogHeader.test.tsx | ユニットテスト |
| NavigationMenu.tsx | app/components/blog/common/NavigationMenu.tsx | ナビゲーションメニュー（メニュー項目表示） |
| NavigationMenu.test.tsx | app/components/blog/common/NavigationMenu.test.tsx | ユニットテスト |
| ThemeToggleButton.tsx | app/components/blog/common/ThemeToggleButton.tsx | テーマ切り替えボタン（ライト/ダークモード） |
| ThemeToggleButton.test.tsx | app/components/blog/common/ThemeToggleButton.test.tsx | ユニットテスト |
| BlogFooter.tsx | app/components/blog/common/BlogFooter.tsx | ブログフッター（法的リンク、コピーライト表記） |
| BlogFooter.test.tsx | app/components/blog/common/BlogFooter.test.tsx | ユニットテスト |
| LegalModal.tsx | app/components/blog/common/LegalModal.tsx | 特定商取引法表示用モーダル（個人情報保護のため検索エンジンから隠蔽） |
| LegalModal.test.tsx | app/components/blog/common/LegalModal.test.tsx | ユニットテスト |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| copyrightFormatter.ts | app/lib/blog/common/copyrightFormatter.ts | コピーライト文字列のフォーマット（年の自動更新など） |
| copyrightFormatter.test.ts | app/lib/blog/common/copyrightFormatter.test.ts | ユニットテスト |
| generateOgpImage.tsx | app/lib/blog/common/generateOgpImage.tsx | OGP画像生成ロジック（SatoriライブラリによるPNG生成） |
| generateOgpImage.test.ts | app/lib/blog/common/generateOgpImage.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| loadBlogConfig.server.ts | app/data-io/blog/common/loadBlogConfig.server.ts | ブログ設定情報の読み込み（タイトル、コピーライト、メニュー項目、フッターリンク） |
| loadBlogConfig.server.test.ts | app/data-io/blog/common/loadBlogConfig.server.test.ts | ユニットテスト |
| loadPostMetadata.server.ts | app/data-io/blog/common/loadPostMetadata.server.ts | 記事メタデータの読み込み（MDX Frontmatter取得、OGP画像生成用） |
| loadPostMetadata.server.test.ts | app/data-io/blog/common/loadPostMetadata.server.test.ts | ユニットテスト |
| fetchOgpFont.server.ts | app/data-io/blog/common/fetchOgpFont.server.ts | OGPの生成 |
| fetchOgpFont.server.test.ts | app/data-io/blog/common/fetchOgpFont.server.test.ts | ユニットテスト |

---

## 5. コンテンツファイル（ブログ記事として実装）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| terms.md | content/blog/posts/terms.md | 利用規約（Frontmatter: `category: "起業"`, `publishedAt: "2020-01-01"`） |
| privacy.md | content/blog/posts/privacy.md | プライバシーポリシー（Frontmatter: `category: "起業"`, `publishedAt: "2020-01-01"`） |

**注**: これらのファイルは既存のブログ記事システムを活用し、`/blog/terms`, `/blog/privacy`でアクセス可能となります。最古の日付を設定することで、記事一覧の最後尾に配置されます。
