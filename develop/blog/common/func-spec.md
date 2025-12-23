# common - 機能設計書

## 📋 機能概要

### 機能名

Common Components (共通コンポーネント)

### 所属サービス

**blog** の **common** セクションに配置

### 機能の目的・価値

- **解決する課題**: ブログサービス全体で統一されたレイアウトとナビゲーションを提供する
- **提供する価値**: サービス全体のUI一貫性を保ち、ユーザーが迷わず記事を閲覧できる導線を提供する
- **ビジネス効果**: ブランディングの統一、ユーザー体験の向上

### 実装優先度

**HIGH** - 他のセクション（posts、post-detail）が依存するため、最優先で実装する

## 🎯 機能要件

### 基本機能

#### Header Components

1. **BlogHeader**: ブログ全体のヘッダー
   - 左側: ブログタイトル表示（ホームリンク機能付き）
   - 右側: menuボタン
   - 配置: `app/components/blog/common/BlogHeader.tsx`

2. **NavigationMenu**: メニュー表示コンポーネント
   - menuボタンクリック時に表示
   - メニュー項目:
     - 挨拶記事へのリンク
     - Articlesへのリンク
   - 配置: `app/components/blog/common/NavigationMenu.tsx`

3. **ThemeToggleButton**: テーマ（ライト/ダーク）切り替えボタン
   - ヘッダーに配置
   - ボタンは現在のテーマ状態を視覚的に示す（太陽/月アイコン）
   - クリック時に`<html>`タグの`data-theme`属性を切り替え
   - 選択したテーマを`localStorage`に保存し、次回アクセス時に復元
   - 配置: `app/components/blog/common/ThemeToggleButton.tsx`

#### Footer Components

1. **BlogFooter**: ブログ全体のフッター
   - コピーライト表示
   - 配置: `app/components/blog/common/BlogFooter.tsx`

#### Layout Components

1. **BlogLayout**: ページ全体のレイアウトコンテナ
   - ヘッダーとフッターを含む全体構造
   - 子コンポーネント（記事一覧、記事詳細）を表示するエリア
   - 配置: `app/components/blog/common/BlogLayout.tsx`

#### OGP Image Generation

1. **OGP画像生成**: 記事ごとのSNSシェア用画像を動的に生成
   - **エンドポイント**: `/ogp/$slug.png`
   - **機能概要**: 記事のスラッグに基づいてOGP画像を動的に生成し、PNG形式で返す
   - **入力**: URL パラメータ `$slug`（記事の識別子）
   - **出力**: PNG画像（1200x630px）、Content-Type: `image/png`、Cache-Control: `public, max-age=31536000, immutable`
   - **エラーハンドリング**:
     - 記事が存在しない場合: 404エラー
     - 画像生成失敗時: 500エラー
   - **配置**: `app/routes/ogp.$slug[.png].tsx`

### 開発戦略: 段階的強化 (Progressive Enhancement)

1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 必要なデータ要件

loaderがUIに提供すべきデータ：

- **ブログタイトル**: ヘッダーに表示するサイトタイトル
- **メニュー項目**: ナビゲーションメニューに表示するリンク集。各項目は表示ラベルとリンク先パスを持つ
- **コピーライト情報**: フッターに表示する著作権表記

> **注意**: 具体的なデータ構造（キー名、型定義など）は`app/specs/blog/types.ts`を参照してください。このドキュメントでは、機能を実現するために「どのようなデータが必要か」という要件のみを記述します。

### app/components要件（app/routes, app/components）

```text
1. [UI層の責務]
   Header Components:
   - BlogHeader:
     - 左側: ブログタイトルをクリックで `/blog` へ遷移
     - 右側: ThemeToggleButton と menuボタン（横並び配置）
     - レイアウト: 左右配置（justify-between）
     - デザイントークンを使用したスタイリング

   - ThemeToggleButton:
     - 現在のテーマ状態を視覚的に示すアイコン表示
       - ライトモード時: 太陽アイコン
       - ダークモード時: 月アイコン
     - クリック時の処理:
       - `<html>`タグの`data-theme`属性を`light`/`dark`に切り替え
       - 選択したテーマを`localStorage`に保存
     - FOUC対策: ページ読み込み時のちらつきを防ぐため、インラインスクリプトを`<head>`に挿入
     - アクセシビリティ: aria-label="テーマ切り替え"

   - NavigationMenu:
     - menuボタンクリック時に表示されるメニュー
     - メニュー項目は動的に生成（propsから受け取る）
     - 各項目クリックで対応するページへ遷移
     - メニュー外クリックで閉じる
     - モバイル対応（ドロップダウンまたはモーダル形式）

   Footer Components:
   - BlogFooter: コピーライト表記を表示
     - デザイントークンを使用したスタイリング

   Layout Components:
   - BlogLayout: ヘッダー、フッター、メインコンテンツエリアを配置
     - 構造: [BlogHeader] [children] [BlogFooter]
     - レスポンシブ対応
```

### 🧠 純粋ロジック要件（app/lib/blog/common）

```text
2. [純粋ロジック層の責務]
   このセクションには複雑なビジネスロジックは不要です。
   必要に応じて、以下のような軽微な処理のみ実装します：

   - copyrightFormatter.ts: コピーライト文字列のフォーマット
     - 年の自動更新など
```

### 🔌 副作用要件（app/data-io/blog/common）

```text
3. [副作用層の責務]
   このセクションには外部データ取得は不要です。
   必要に応じて、以下のような処理のみ実装します：

   - loadBlogConfig.server.ts: ブログ設定情報の読み込み
     - ブログタイトルやコピーライト情報を定数として管理

   - loadPostMetadata.server.ts: 記事メタデータの読み込み（OGP画像生成用）
     - MDXファイルのFrontmatter（タイトル、説明、著者など）を読み込む
     - 記事が存在しない場合はnullを返す
```

### 🖼️ OGP画像生成のデータフロー

```text
OGP画像生成 (Route: /ogp/$slug.png):
1. [Route層の責務]
   - URLパラメータから記事のslugを取得
   - Data-IO層から記事メタデータを取得
   - Logic層で画像を生成
   - PNG形式でレスポンス（Cache-Controlヘッダー付き）

2. [Data-IO層の責務]
   - loadPostMetadata.server.ts: MDXファイルからFrontmatterを読み込む
   - 記事が存在しない場合はnullを返す

3. [Logic層の責務]
   - generateOgpImage.ts: 記事メタデータからOGP画像（PNG）を生成
   - Satoriライブラリを使用してHTML/CSSから画像を生成
```
