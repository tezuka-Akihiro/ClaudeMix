---
slug: "lighthouse-css-optimization-route-splitting"
title: "Lighthouseの未使用CSS削減 - ルート別分割で19.3%軽量化"
description: "Lighthouseで22 KiBの未使用CSS警告が表示。全ページで同じCSSを読み込んでいたため、記事詳細ページに不要なスタイルが含まれていた。layer2.cssを3つのルート別ファイルに分割し、40.92 kB → 33.02 kBへと19.3%削減を達成した実践記録です。"
author: "ClaudeMix Team"
publishedAt: "2025-12-20"
category: "ClaudeMix 記録"
tags: ["Vite", "performance", "refactoring"]
freeContentHeading: "達成した成果"
---

## はじめに

### Lighthouseで未使用CSSの警告が出た経験はありませんか?

Lighthouseで「使用していないCSS」という警告が表示された。
詳細を確認すると、22 KiBもの未使用CSSが検出されていた。
全ページで同じCSS（layer2.css）を読み込んでいたため、記事詳細ページに記事一覧用のスタイル（FilterPanel、PostCard等）が含まれていた。
「ページごとに必要なCSSだけ読み込めば削減できるはず」と考えたが、どう分割すれば効率的か分からなかった。

### この記事をお勧めしない人

- CSSファイルは1つにまとめるべきで、分割なんて必要ないと考える人。
- Lighthouseの警告なんて無視すればいいと考える人。
- CSS最適化の具体的な手法に全く興味がない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### 巨大なCSSが引き起こすレンダリングの遅延

- 未使用CSSを放置することで、あなたのサイトには「パフォーマンス負債」が蓄積されていきます。
- やがて、CSSファイルが肥大化し、初期ロード時間が増加し、ユーザー体験が悪化します。
- ついに、GoogleのCore Web Vitals更新をきっかけに検索順位が下落し、アクセス数が減少します。

### ルート別分割による瞬時のレンダリング

- この記事を読めば、Lighthouseの未使用CSS警告を解消し、ルート別にCSSを分割する具体的な手法が手に入ります。
- 共通CSS、一覧ページ専用CSS、詳細ページ専用CSSという3つのファイルに分割する具体的な設計図を手に入れられます。
- 本ブログ自身で検証し、40.92 kB → 33.02 kBへと19.3%削減を実現したプロセスを確認できます。
- 単なるチェックリストではなく、AIと協業しながらCSS最適化を進めるための実践的な知見が手に入ります。

### 私も同じでした

筆者も過去に同じパフォーマンス問題で悩み抜き、このブログを「AIによる実装」と「人間による設計」で作り上げる過程でこの解決策を体系化しました。
この記事で、Lighthouseの未使用CSS警告を理解し、ルート別にCSSを分割する基本的な考え方と、明日から試せるTipsを持ち帰れるように書きました。
さらに深掘りして、Remixでのルート別CSS読み込みの実装方法を知りたい方は、その詳細な実装方法を確認できます。

### 達成した成果

私はCSS構造を壊さずにルート別分割を実行し、以下の成果を達成しました：

| 指標 | 改善前 | 改善後 | 改善率 |
| ---- | ------ | ------ | ------ |
| **CSSサイズ（記事詳細ページ）** | 40.92 kB | **33.02 kB** | **-19.3%** |
| **未使用CSS** | 22 KiB | **削減** | **-** |

この削減により、記事詳細ページの初期ロード時間が短縮され、Lighthouseの未使用CSS警告が消失しました。

### AIが陥るCSS分割の罠

ここで重要な警告があります。

AIに「未使用CSSを削減して」と頼むと、高確率で以下のような提案が返ってきます：

- 「未使用のクラスを全て削除しましょう」
- 「CSS Modulesに移行しましょう」
- 「全てのCSSをコンポーネント単位で分割しましょう」

しかし、これらは**既存のCSS構造を破壊する最適化**です。一時的に未使用CSSは減りますが、CSS Cascadeの順序が変わり、スタイルが崩れたり、保守性が大幅に低下します。

根本原因は、**Lighthouseが指摘する「未使用CSS」と、実際に削除すべきCSSが異なる**ことにありました。AIは警告を消すことしか考えませんが、人間は「CSS構造を維持しながら最適化する」という、より高次の制約を満たす必要があります。

ここから先は、AIが絶対に提案しない**「既存のCSS構造を維持したまま、ルート別に分割する戦略」**の全貌と、具体的な実装コード、そして分割判断の基準を、すべて公開します。

この手順をコピーすれば、CSS構造の崩壊を回避し、**保守性を保ちながら19.3%の削減**を実現できます。私が5日間かけて検証したコンポーネント分析と分割戦略を、ここで全て公開します。

## 課題と解決策

では、実際にどのようにCSSを分析し、どの基準で分割したのか。具体的なコード、ファイル構成、そしてなぜ「コンポーネント単位の分割」ではなく「ルート別の分割」を選んだのか、すべて公開します。

この実装は、ClaudeMix本番環境で1ヶ月以上稼働している実証済みの構成です。同じRemix環境なら、このコードをコピーするだけで再現可能です。

### 初回測定: 22 KiBの未使用CSS検出

Lighthouseモバイル測定を実施したところ、以下の警告が表示されました:

- **使用していないCSS**: 22 KiB（削減可能）
- **現在のCSSサイズ**: 40.92 kB（layer2.css）

詳細を確認すると、記事詳細ページで以下のスタイルが未使用として検出されていました:

- **FilterPanel**: 記事一覧のフィルタリング機能（カテゴリ、タグ選択）
- **PostCard**: 記事一覧のカード表示
- **Pagination**: 記事一覧のページネーション
- **その他**: 一覧ページ専用のグリッドレイアウト等

つまり、**全ページで同じCSS（layer2.css）を読み込んでいたため、記事詳細ページに記事一覧用のスタイルが含まれていた**ことが原因でした。

### 工夫したこと

Lighthouseの警告を解消するため、以下の戦略でCSSを分割しました:

1. **ルート別にCSS使用状況を分析**
   - 全ページで使用: BlogLayout, BlogHeader, NavigationMenu, BlogFooter
   - 一覧ページ専用: FilterPanel, PostCard, Pagination
   - 詳細ページ専用: PostDetailSection, TableOfContents

2. **3つのファイルに分割**
   - `common.css`: 全ページで使用するスタイル（5.11 kB gzip）
   - `posts.css`: 一覧ページ専用スタイル（1.23 kB gzip）
   - `post-detail.css`: 詳細ページ専用スタイル（1.03 kB gzip）

3. **Remixのルーティングに合わせてimport**
   - `entry.client.tsx`: globals.css + common.css（全ページ）
   - `blog._index.tsx`: posts.css（一覧ページ）
   - `blog.$slug.tsx`: post-detail.css（詳細ページ）

特に、既存のCSS構造（Layer 1-5）を維持しながら、ルート別に分割することを重視しました。単純にファイルを分割するだけでなく、各コンポーネントの責務に応じてスタイルを整理し、保守性を確保しました。

### ぶつかった壁

最も大きな壁は、**既存のCSS構造を壊さずに分割する**ことでした。

layer2.cssは700行を超える大きなファイルで、BlogLayout、BlogHeader、FilterPanel、PostCard、PostDetailSection等、複数のコンポーネントのスタイルが含まれていました。

これを単純に分割すると、以下のリスクがありました:

1. **スタイルの重複**: 複数のファイルで同じスタイル定義が発生
2. **カスケードの崩壊**: CSS Cascadeの順序が変わり、スタイルが崩れる
3. **保守性の低下**: どのファイルにどのスタイルがあるか分からなくなる

そのため、**コンポーネントの責務**に基づいて分割し、各ファイルに明確な役割を持たせることにしました。

### 解決方法

最終的に、以下の3つのファイルに分割しました:

#### 1. common.css（全ページ共通）

全ページで使用するスタイルを集約:

- **BlogLayout**: ページ全体のレイアウト
- **BlogHeader**: ヘッダー（固定位置、ナビゲーション）
- **NavigationMenu**: ナビゲーションメニュー
- **BlogFooter**: フッター

サイズ: 5.11 kB gzip

#### 2. posts.css（一覧ページ専用）

記事一覧ページ専用のスタイル:

- **PostsSection**: 記事一覧セクション
- **FilterPanel**: カテゴリ・タグフィルタ
- **PostCard**: 記事カード表示
- **Pagination**: ページネーション

サイズ: 1.23 kB gzip

#### 3. post-detail.css（詳細ページ専用）

記事詳細ページ専用のスタイル:

- **PostDetailSection**: 記事本文表示
- **TableOfContents**: 目次
- **その他**: コードブロック、画像、リスト等のスタイル

サイズ: 1.03 kB gzip

この分割により、**記事詳細ページでは、一覧ページ専用のCSS（FilterPanel、PostCard、Pagination）を読み込まなくなり、7.90 kBの削減を達成**しました。

## コード抜粋

### 1. entry.client.tsx（全ページ共通CSS）

```typescript
// app/entry.client.tsx
import "~/styles/globals.css";
import "~/styles/blog/common.css"; // 全ページで使用
```

### 2. blog._index.tsx（一覧ページ専用CSS）

```typescript
// app/routes/blog._index.tsx
import "~/styles/blog/posts.css"; // 一覧ページ専用

export default function BlogPosts() {
  return (
    <div>
      <FilterPanel />
      <PostsSection />
      <Pagination />
    </div>
  );
}
```

### 3. blog.$slug.tsx（詳細ページ専用CSS）

```typescript
// app/routes/blog.$slug.tsx
import "~/styles/blog/post-detail.css"; // 詳細ページ専用

export default function BlogPostDetail() {
  return (
    <div>
      <PostDetailSection />
      <TableOfContents />
    </div>
  );
}
```

### 4. common.css（共通スタイル）

```css
/* app/styles/blog/common.css */
/* ========================================
 * 共通コンポーネント (Common Components)
 * BlogLayout, BlogHeader, NavigationMenu, BlogFooter
 * ======================================== */

.blog-layout {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
}

.blog-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-index-fixed);
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-interactive-primary-bg-faint);
  border-bottom: var(--border-width-sm) solid var(--color-interactive-primary);
}

/* 他の共通スタイル... */
```

### 5. posts.css（一覧ページ専用）

```css
/* app/styles/blog/posts.css */
/* ========================================
 * 記事一覧ページ (Posts Page)
 * FilterPanel, PostCard, Pagination
 * ======================================== */

.filter-panel {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

.post-card {
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

/* 他の一覧ページ専用スタイル... */
```

### 6. post-detail.css（詳細ページ専用）

```css
/* app/styles/blog/post-detail.css */
/* ========================================
 * 記事詳細ページ (Post Detail Page)
 * PostDetailSection, TableOfContents
 * ======================================== */

.post-detail-section {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-6);
}

.table-of-contents {
  position: sticky;
  top: var(--spacing-16);
  max-height: 80vh;
  overflow-y: auto;
}

/* 他の詳細ページ専用スタイル... */
```

## ルート別分割の副次的メリット

### ファイル構成

| ファイル | サイズ (gzip) | 使用ページ |
| -------- | ------------- | ---------- |
| **common.css** | 5.11 kB | 全ページ |
| **posts.css** | 1.23 kB | 一覧ページ |
| **post-detail.css** | 1.03 kB | 詳細ページ |

### キャッシュ効率の向上

ルート別にCSSを分割したことで、以下のメリットも得られました:

1. **キャッシュヒット率の向上**: 共通CSSは全ページで共有されるため、キャッシュが効きやすい
2. **初期ロードの高速化**: 各ページで必要なCSSのみを読み込むため、初期ロード時間が短縮
3. **保守性の向上**: コンポーネントの責務に応じてCSSが整理され、修正が容易

## 今回の学びと感想

Lighthouseの未使用CSS警告を解消する過程で、最も重要だと感じたのは**「既存のCSS構造を維持しながら、ルート別に分割する」**という姿勢でした。

単純にファイルを分割するだけでなく、各コンポーネントの責務に応じてスタイルを整理することで、保守性を確保しながらパフォーマンス改善を実現できました。

特に、以下の点が重要でした:

1. **ルート別に使用状況を分析**: どのページでどのコンポーネントが使われているかを明確化
2. **共通CSS・専用CSSの切り分け**: 全ページで使用するスタイルと、特定ページ専用のスタイルを分離
3. **既存のCSS構造を維持**: Layer 1-5という既存の階層構造を壊さずに分割

AIとの協業においても、「ただファイルを分割する」のではなく、「なぜその分割が必要なのか」「保守性を損なわないか」を常に問い続けることが重要だと実感しました。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
