# file-list.md - common Section

## 目的
commonセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| common.spec.ts | tests/e2e/section/blog/common.spec.ts | commonセクション単独のE2Eテスト（OGP画像生成を含む） |

---

## 2. UI層（Phase 3.3 / 3.4）

### 2.1 Routes (common固有)
| ファイル名 | パス | URL | 説明 |
|:---|:---|:---|:---|
| blog._index.tsx | app/routes/blog._index.tsx | /blog | ブログトップページのRoute（BlogLayoutを使用した最小限の実装） |
| ogp.$slug[.png].tsx | app/routes/ogp.$slug[.png].tsx | /ogp/:slug.png | OGP画像生成エンドポイント |

**注**: blog._index.tsxはpostsセクションでも使用されます。commonセクションでは共通レイアウトの統合テスト用として定義しています。

### 2.2 Components (common固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| BlogLayout.tsx | app/components/blog/common/BlogLayout.tsx | ページ全体のレイアウトコンテナ（Header/Footer/Contentエリア） |
| BlogLayout.test.tsx | app/components/blog/common/BlogLayout.test.tsx | ユニットテスト |
| BlogHeader.tsx | app/components/blog/common/BlogHeader.tsx | ブログヘッダー（タイトル、menuボタン） |
| BlogHeader.test.tsx | app/components/blog/common/BlogHeader.test.tsx | ユニットテスト |
| NavigationMenu.tsx | app/components/blog/common/NavigationMenu.tsx | ナビゲーションメニュー（メニュー項目表示） |
| NavigationMenu.test.tsx | app/components/blog/common/NavigationMenu.test.tsx | ユニットテスト |
| BlogFooter.tsx | app/components/blog/common/BlogFooter.tsx | ブログフッター（コピーライト表記） |
| BlogFooter.test.tsx | app/components/blog/common/BlogFooter.test.tsx | ユニットテスト |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| copyrightFormatter.ts | app/lib/blog/common/copyrightFormatter.ts | コピーライト文字列のフォーマット（年の自動更新など） |
| copyrightFormatter.test.ts | app/lib/blog/common/copyrightFormatter.test.ts | ユニットテスト |
| generateOgpImage.ts | app/lib/blog/common/generateOgpImage.ts | OGP画像生成ロジック（SatoriライブラリによるPNG生成） |
| generateOgpImage.test.ts | app/lib/blog/common/generateOgpImage.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| loadBlogConfig.server.ts | app/data-io/blog/common/loadBlogConfig.server.ts | ブログ設定情報の読み込み（タイトル、コピーライト、メニュー項目） |
| loadBlogConfig.server.test.ts | app/data-io/blog/common/loadBlogConfig.server.test.ts | ユニットテスト |
| loadPostMetadata.server.ts | app/data-io/blog/common/loadPostMetadata.server.ts | 記事メタデータの読み込み（MDX Frontmatter取得、OGP画像生成用） |
| loadPostMetadata.server.test.ts | app/data-io/blog/common/loadPostMetadata.server.test.ts | ユニットテスト |