# landing - 機能設計書

## 📋 機能概要

### 機能名

Landing Page (ランディングページ)

### 所属サービス

**blog** の **landing** セクションに配置

### 機能の目的・価値

- **解決する課題**: ClaudeMixの技術力を視覚的に証明し、ターゲット別のメッセージングで訴求力を向上させる
- **提供する価値**: スクロール駆動型アニメーション、漫画コンテンツ、CTAボタンを組み合わせた差別化されたLP体験を提供
- **ビジネス効果**: Remix性能のデモンストレーション、独自ブランディング確立、ドキュメント/GitHubへの導線強化

### 実装優先度

**MEDIUM** - 初期は engineer ターゲットのみ実装し、効果検証後に他ターゲットへ拡張

## 🎯 機能要件

### 基本機能

1. **スクロール駆動型アニメーション**: Intersection Observer APIを使用した60fps維持の滑らかなアニメーション
   - ビューポート閾値: 70%で発火
   - アニメーション時間: 800ms
   - イージング: `cubic-bezier(0.4, 0, 0.2, 1)`
   - `data-testid`属性による要素識別

2. **漫画パネル表示**: WebP形式の漫画画像を遅延ロード
   - `<img loading="lazy">`属性使用
   - レスポンシブ対応（モバイル1列/デスクトップ2列）
   - 画像最適化（WebP形式、適切なサイズ）

3. **ターゲット別コンテンツ配信**: URLパラメータ（`/blog/landing/:target`）によるコンテンツ切り替え
   - 初期実装: `engineer`ターゲットのみ
   - 将来拡張: `designer`, `manager`等
   - 不正なターゲット: デフォルトフォールバック（`engineer`）

4. **CTA導線**: ドキュメント、GitHub、デモへのリンクボタン
   - ボタンテキスト: spec.yamlで管理
   - リンク先URL: spec.yamlで管理
   - アクセシビリティ対応（`aria-label`）

5. **レスポンシブ対応**: モバイル/タブレット/デスクトップで最適化されたレイアウト
   - モバイル: 1列レイアウト
   - デスクトップ: 2列レイアウト
   - ブレークポイント: Tailwind CSS標準

### 開発戦略: 段階的強化 (Progressive Enhancement)

1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データやアニメーションロジックを接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 入力データ要件

loaderが受け取るリクエスト情報：

- **ターゲットパラメータ**: URLパラメータ（例: `/blog/landing/engineer`の`engineer`）
- **コンテンツYAML**: `content/blog/landing/{target}/content.yaml`
- **漫画画像アセット**: `content/blog/landing/{target}/manga/*.webp`

### 出力データ要件

loaderがUIに提供すべきデータ：

- **ランディングコンテンツ**: ターゲット別のコンテンツ情報
  - キャッチコピー
  - 説明文
  - CTA文言
  - 漫画パネル数

- **漫画アセット情報**: 画像ファイルパスの配列
  - ファイル名
  - パス
  - 表示順序

- **CTA設定**: CTAボタンの情報
  - ボタンテキスト
  - リンク先URL配列
  - ラベル

> **注意**: 具体的なデータ構造（キー名、型定義など）は`app/specs/blog/types.ts`を参照してください。このドキュメントでは、機能を実現するために「どのようなデータが必要か」という要件のみを記述します。

### app/components要件（app/routes, app/components）

```text
1. [UI層の責務]
   Route:
   - app/routes/blog.landing.$target.tsx:
     - URL: /blog/landing/:target
     - loader:
       - URLパラメータからターゲットを取得・検証
       - data-io層からコンテンツYAMLを読み込み
       - data-io層から漫画画像パスを取得
       - lib層でターゲット検証（不正値はデフォルトフォールバック）
       - HeroSection, ScrollSection, MangaPanelGrid, CTASection, LandingFooterをレンダリング
     - エラーハンドリング: ErrorBoundaryでターゲット不正時のフォールバック表示

   Components:
   - HeroSection.tsx:
     - ファーストビュー表示
     - 漫画パネル1-2枚配置
     - キャッチコピー表示
     - Above-the-fold領域（Critical CSS対象）

   - MangaPanel.tsx:
     - 漫画パネル単体コンポーネント
     - `<img loading="lazy">`属性使用
     - WebP形式画像
     - レスポンシブ対応

   - ScrollSection.tsx:
     - スクロールアニメーション領域
     - AnimatedBlock × N を配置
     - Intersection Observer連携
     - スクロール位置に応じたアニメーション制御

   - AnimatedBlock.tsx:
     - 個別アニメーション要素
     - `data-animation`属性でアニメーションタイプ指定
     - `data-testid`属性付与
     - Intersection Observer連携

   - CTASection.tsx:
     - CTAボタン群
     - ドキュメント、GitHub、デモへのリンク
     - レスポンシブ配置
     - アクセシビリティ対応

   - LandingFooter.tsx:
     - LPフッター
     - 法務リンク（プライバシーポリシー等）
     - シンプルな構成
```

### app/lib要件（純粋ロジック層）

```text
2. [純粋ロジック層の責務]
   - app/lib/blog/landing/scrollAnimation.ts:
     - スクロール位置計算
     - ビューポート閾値判定（70%）
     - アニメーション発火ロジック
     - 純粋関数として実装

   - app/lib/blog/landing/targetValidation.ts:
     - ターゲットパラメータ検証
     - 許可リスト照合（`engineer`等）
     - デフォルト値フォールバック
     - 純粋関数として実装
```

### app/data-io要件（副作用層）

```text
3. [副作用層の責務]
   - app/data-io/blog/landing/getLandingContent.server.ts:
     - `content/blog/landing/{target}/content.yaml`読み込み
     - YAMLパース処理
     - LandingContent型で返却
     - エラーハンドリング

   - app/data-io/blog/landing/getMangaAssets.server.ts:
     - `content/blog/landing/{target}/manga/`配下の画像ファイル一覧取得
     - ファイルパス配列で返却
     - ファイル存在確認
     - エラーハンドリング
```

## 🚫 スコープ外機能（明示的に実装しない）

- フォーム送信機能（問い合わせフォーム等）
- ユーザー登録機能
- 分析トラッキング（GA等）
- A/Bテスト機能
- 動的なコンテンツ生成（初期実装では静的YAML）

## 🎨 スタイリング要件

### CSS戦略

- **Layer 1**: 既存のカラー変数を使用（`--color-interactive-primary`、`--color-surface-dark`、`--color-accent-gold`）
- **Layer 2**: `app/styles/blog/layer2-landing.css`（漫画パネル、CTAボタン、フッターのスタイル）
- **Layer 3**: `app/styles/blog/layer3-landing.ts`（Grid/Flexレイアウト定義）
- **Layer 4**: `app/styles/blog/layer4-landing.ts`（スクロールアニメーション`@keyframes`）

### 性能最適化

- **Critical CSSのインライン化**: Above-the-fold領域のみ`<style>`タグでインライン（妥協点として文書化）
- **画像遅延ロード**: `loading="lazy"`属性使用
- **画像形式**: WebP形式

## 🧪 テスト戦略

### E2Eテスト（最低限のハッピーパス）

- LP表示確認
- ターゲットパラメータ検証
- スクロールアニメーション動作確認
- CTA導線確認

### ユニットテスト（複雑性に応じて）

- スクロール位置計算ロジック
- アニメーション発火判定
- ターゲットパラメータ検証
- コンテンツYAML読み込み
- 漫画画像パス取得

## 📊 性能要件

- **60fps維持**: スクロールアニメーションの滑らかさ
- **初回ロード最適化**: Critical CSSインライン化、WebP画像
- **レスポンシブ性能**: すべてのデバイスで快適な表示速度

## 🔒 セキュリティ要件

- **XSS対策**: ユーザー入力を受け付けないため、最小限
- **パス traversal対策**: ターゲットパラメータの厳格な検証
- **エラーハンドリング**: 不正なターゲットへのフォールバック
