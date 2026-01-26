---
slug: "lighthouse-javascript-optimization-challenges"
title: "Lighthouse JavaScript最適化の壁 - 削減できなかった39 KiBから学んだこと"
description: "CSS削減は46%成功したのに、JavaScript削減は失敗。lazy loading、chunk splitting、prefetch無効化を試したが、39 KiBは減らなかった。Remix/Viteの共有バンドル戦略という壁にぶつかり、フレームワークの制約を受け入れることの重要性を学んだ実践記録です。"
author: "ClaudeMix Team"
publishedAt: "2025-12-19"
category: "ClaudeMix 記録"
tags: ["Vite", "performance", "troubleshooting", "refactoring"]
freeContentHeading: "達成した結果と直面した現実"
---

## はじめに

### Lighthouseの警告を消そうとして詰まった経験はありませんか?

Lighthouseで「使用していないJavaScript」という警告が表示された。
CSS最適化は21.8 KiBから11.8 KiBへと46%削減に成功し、順調だと思った。
次はJavaScript削減だと、lazy loading、manual chunk splitting、prefetch無効化と、あらゆる手法を試した。
しかし、何をやっても39 KiBという数字は変わらなかった。
「なぜ減らないんだ?」というモヤモヤだけが残った。

### この記事をお勧めしない人

- Lighthouseの警告は全て解決できると考える人。
- フレームワークの制約なんて関係ない、力技で解決できると考える人。
- 失敗談や試行錯誤のプロセスに全く興味がない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### このままでは危険です

- フレームワークの設計思想を無視した最適化を続けることで、あなたのコードベースには「設計の歪み」が蓄積されていきます。
- やがて、無理やり実装した最適化がフレームワークのアップデートで破綻し、大規模なリファクタリングを強いられるでしょう。
- ついに、保守性が失われたコードは技術的負債となり、新機能の追加もバグ修正も困難になり、プロジェクトは停滞します。

### こんな未来が手に入ります

- この記事を読めば、Lighthouse最適化の限界点を見極め、フレームワークの制約を理解する視点が手に入ります。
- 具体的には、lazy loading、chunk splitting、prefetch制御という3つの手法を試し、**なぜ失敗したのか**を分析する実践ロードマップを手に入れられます。
- この方法は、机上の空論ではありません。まさに**このブログ自身で検証し、39 KiBのJavaScriptが削減できなかった理由を実証済み**です。
- この情報は、単なるチェックリストではなく、AIと協業しながら最適化の限界を探る**未来の開発現場から得られた一次情報**です。

### 私も同じでした

筆者も過去に同じパフォーマンス最適化で悩み抜き、このブログを「AIによる実装」と「人間による設計」で作り上げる過程で、成功体験だけでなく失敗体験も蓄積してきました。
この記事で、Lighthouseの警告が全て解決できるわけではないこと、フレームワークの制約を受け入れることの重要性、そして失敗から学ぶ姿勢を持ち帰れるように書きました。
さらに深掘りして、Remix/Viteの共有バンドル戦略を理解し、適切なトレードオフを判断する方法を知りたい方は、その詳細な実装方法を確認できます。

### 達成した結果と直面した現実

私は複数の最適化手法を実行し、以下の結果を得ました：

| 指標 | 改善前 | 改善後 | 改善率 |
| ---- | ------ | ------ | ------ |
| **使用していないCSS** | 21.8 KiB | **11.8 KiB** | **-46%** |
| **使用していないJavaScript** | 39 KiB | **39 KiB** | **0%** |

CSS削減は成功しました。しかし、JavaScript削減は**完全に失敗**しました。

### AIが陥る「とにかく削減」の罠

ここで重要な警告があります。

AIに「未使用JavaScriptを削減して」と頼むと、高確率で以下のような提案が返ってきます：

- 「lazy loadingでコンポーネントを遅延読み込みしましょう」
- 「chunk splittingでバンドルを分割しましょう」
- 「prefetchを無効化しましょう」

しかし、これらは**フレームワークの設計思想を無視した最適化**です。一時的に警告を消せるかもしれませんが、フレームワークの自動最適化と競合し、結果的に効果がなかったり、全体的なパフォーマンスが悪化します。

根本原因は、**Lighthouseが評価する「個別ルートの未使用JavaScript」と、Remixが実現する「全体最適化」が異なる目標を持つ**ことにありました。AIは警告を消すことしか考えませんが、人間は「フレームワークの制約を理解し、適切なトレードオフを判断する」という、より高次の判断が必要です。

ここから先は、AIが絶対に教えてくれない**「失敗から学ぶ最適化の限界点」**の全貌と、具体的に試行錯誤したコード、そしてなぜRemix/Viteの共有バンドル戦略が39 KiBを削減できなかったのか、すべて公開します。

この検証結果をコピーすれば、同じ無駄な試行錯誤を回避し、**フレームワークの制約を受け入れて他の最適化に注力する**という適切な判断ができます。私が2週間かけて検証した失敗事例と判断基準を、ここで全て公開します。

## 課題と解決策

では、実際にどのような手法を試し、なぜ失敗したのか。具体的なコード、ビルドログ、そしてRemix/Viteの共有バンドル戦略という根本原因を、すべて公開します。

この検証は、ClaudeMix本番環境で実際に試行錯誤した実証済みの失敗事例です。同じRemix環境なら、この失敗から学び、無駄な時間を節約できます。

### 初回測定: CSS削減の成功とJavaScript削減の課題

Lighthouseモバイル測定を実施したところ、以下の警告が表示されました:

- **使用していないCSS**: 21.8 KiB（削減可能）
- **使用していないJavaScript**: 39 KiB（削減可能）

CSS最適化では、`layer2.css`（19 KiB）を3つのファイル（`common.css`, `post-detail.css`, `posts.css`）に分割し、**21.8 KiB → 11.8 KiB**（46%削減）を達成しました。

この成功体験から、「同じ手法でJavaScriptも削減できる」と考えました。

### 試行1: lazy loadingでコンポーネントを遅延読み込み

最初に試したのは、React.lazyを使った遅延読み込みです。

```typescript
// app/routes/blog.posts.tsx（修正前）
import { PostsSection } from "~/components/blog/posts/PostsSection";

// 修正後
const PostsSection = lazy(() =>
  import("~/components/blog/posts/PostsSection").then(module => ({
    default: module.PostsSection
  }))
);
```

**結果**: 39 KiB → 39 KiB（変化なし）

Remix DevToolsで確認したところ、lazy loadingは機能しているものの、バンドルサイズは変わりませんでした。

### 試行2: manual chunk splittingでバンドル分割

次に試したのは、vite.config.tsでルートごとに手動でチャンクを分割する方法です。

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/routes/blog.posts')) {
            return 'posts';
          }
          if (id.includes('/routes/blog.$slug')) {
            return 'post-detail';
          }
          if (id.includes('/components/blog/common')) {
            return 'blog-common';
          }
        },
      },
    },
  },
});
```

**結果**: 39 KiB → 39 KiB（変化なし）

ビルドログを確認すると、チャンクは生成されているものの、Lighthouseの「使用していないJavaScript」の数値は変わりませんでした。

### 試行3: prefetch無効化で不要なバンドル読み込みを防ぐ

最後に試したのは、ナビゲーションリンクの`prefetch="none"`設定です。

```typescript
// app/components/blog/common/BlogHeader.tsx
<Link to="/blog/posts" prefetch="none">
  Posts
</Link>
```

**結果**: 39 KiB → 39 KiB（変化なし）

プリフェッチは無効化されましたが、Lighthouseの数値には影響しませんでした。

### ぶつかった壁: Remix/Viteの共有バンドル戦略

複数の手法を試しても39 KiBが削減できなかったのは、**Remix/Viteの共有バンドル戦略**が原因でした。

Remixは、複数のルートで共通のコンポーネント（例: `BlogHeader`, `NavigationMenu`）を自動的に共有バンドルとして生成します。これにより、ルート間でのコード重複を防ぎ、全体的なバンドルサイズを最小化します。

しかし、この戦略には以下のような副作用があります:

1. **特定のルートでは使用していないコンポーネントも、共有バンドルに含まれる**
   例: ブログ一覧ページでは使用していない`PostDetailSection`も、`blog-common`チャンクに含まれる。

2. **lazy loadingやmanual chunk splittingで個別に分割しても、Remixが自動的に共有バンドルにマージする**
   手動で設定したチャンク分割が、Remixのバンドル最適化によって上書きされる。

3. **prefetch無効化は、プリフェッチを防ぐだけで、バンドルサイズには影響しない**
   既に共有バンドルとして読み込まれているため、prefetch設定では削減できない。

### 解決方法: フレームワークの制約を受け入れる

複数の試行錯誤の結果、以下の結論に至りました:

> Remix/Viteの共有バンドル戦略は、全体最適化のための設計であり、個別ルートでの未使用JavaScript削減とはトレードオフの関係にある

つまり、以下の選択肢がありました:

1. **Remixの共有バンドル戦略を無効化する**
   → ルート間でコード重複が発生し、全体的なバンドルサイズが増加するリスク。

2. **フレームワークの制約を受け入れ、他の最適化領域に注力する**
   → JavaScript削減を諦め、画像最適化、フォント最適化、キャッシュ戦略などに注力する。

最終的に、**選択肢2を採用**しました。

理由は以下の通りです:

- Remixの共有バンドル戦略は、長期的な保守性とパフォーマンスのバランスを考慮した設計である。
- 39 KiBという数値は、全体的なバンドルサイズ（約200 KiB）の20%程度であり、致命的な問題ではない。
- 他の最適化領域（画像、フォント、キャッシュ）で、より大きなパフォーマンス改善を期待できる。

## コード抜粋

### 1. lazy loadingの実装（効果なし）

```typescript
// app/routes/blog.posts.tsx
import { lazy, Suspense } from "react";

const PostsSection = lazy(() =>
  import("~/components/blog/posts/PostsSection").then(module => ({
    default: module.PostsSection
  }))
);

export default function BlogPosts() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsSection />
    </Suspense>
  );
}
```

### 2. manual chunk splittingの実装（効果なし）

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ルートごとにチャンクを分割
          if (id.includes('/routes/blog.posts')) {
            return 'posts';
          }
          if (id.includes('/routes/blog.$slug')) {
            return 'post-detail';
          }
          if (id.includes('/components/blog/common')) {
            return 'blog-common';
          }
        },
      },
    },
  },
});
```

### 3. prefetch無効化の実装（効果なし）

```typescript
// app/components/blog/common/BlogHeader.tsx
import { Link } from "@remix-run/react";

export function BlogHeader() {
  return (
    <header className="blog-header">
      <nav>
        <Link to="/blog/posts" prefetch="none">
          Posts
        </Link>
        <Link to="/blog/categories" prefetch="none">
          Categories
        </Link>
      </nav>
    </header>
  );
}
```

### 4. Remixの共有バンドル戦略の確認

```bash
# ビルドログを確認
npm run build

# 出力例（抜粋）
# build/client/assets/blog-common-abc123.js (shared chunk)
# build/client/assets/posts-def456.js (route chunk)
# build/client/assets/post-detail-ghi789.js (route chunk)

# Lighthouseで測定
# 使用していないJavaScript: 39 KiB（変化なし）
```

## 試行した手法と失敗の全記録

### 試行した手法と結果

| 手法 | 期待効果 | 実際の結果 | 原因 |
| ---- | -------- | ---------- | ---- |
| **lazy loading** | 遅延読み込みで初期バンドル削減 | 効果なし | Remixが共有バンドルにマージ |
| **manual chunk splitting** | ルートごとに分割 | 効果なし | Remixが自動最適化で上書き |
| **prefetch無効化** | 不要なプリフェッチ防止 | 効果なし | 既に共有バンドルとして読み込み済み |

## 今回の学びと感想

Lighthouseの警告を一つずつ解消していく過程で、最も重要だと感じたのは**「フレームワークの設計思想を理解し、制約を受け入れる」**という姿勢でした。

CSS削減は成功し、JavaScript削減は失敗しました。この違いは、CSSが静的なファイル分割で対応できるのに対し、JavaScriptはRemix/Viteの共有バンドル戦略という動的な最適化が働くためです。

Remixの共有バンドル戦略は、一見すると「個別ルートでの未使用JavaScript」を増やすように見えますが、実際には**全体的なバンドルサイズを最小化し、ルート間でのコード重複を防ぐ**という長期的な最適化です。

この戦略を無効化することもできますが、それは**短期的な数値改善のために、長期的な保守性を犠牲にする**ことを意味します。

AIとの協業においても、「ただ警告を消す」のではなく、「なぜその警告が表示されるのか」「フレームワークがどのような最適化を行っているのか」を常に問い続けることが重要だと実感しました。

失敗は成功の母です。この39 KiBのJavaScriptが削減できなかった経験は、次の最適化戦略を考える上で貴重な一次情報となりました。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
