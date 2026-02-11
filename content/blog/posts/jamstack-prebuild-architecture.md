---
slug: "jamstack-prebuild-architecture"
title: "爆速ブログを実現するJamstackアーキテクチャ：RemixとViteで作るHTMLプレビルドシステム"
description: "TTFBを極限まで短縮し、圧倒的な表示速度を実現するためのHTMLプレビルドシステムを解説。リクエスト時の動的処理を廃し、ビルド時に重い処理を完了させるJamstackのベストプラクティスをRemixとViteで実装します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-03"
category: "ClaudeMix 考察"
tags: ["architecture", "performance", "Vite"]
freeContentHeading: "📝 概要"
---

## はじめに

### Webサイトのパフォーマンスでこんなことありませんか？

- 最新のフレームワークを導入したのに、期待したほどページの表示速度が上がらない。
- サーバー応答時間（TTFB）が長く、ユーザーがコンテンツを目にする前に離脱している。
- アクセスのたびに実行される重い処理が原因だと分かっているが、抜本的な対策が打てていない。

### この記事をお勧めしない人

- Webサイトの表示速度が多少遅くても、ユーザー体験に影響はないと考える人。
- 小手先のテクニックのみを求め、アーキテクチャレベルでの改善に関心がない人。
- AIによるコード生成や、人間とAIの協業モデルに興味がない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### 蓄積される「レンダリングの技術的負債」

- 古いアーキテクチャを使い続けると、サイトには「レンダリング負債」が静かに蓄積されていく。
- GoogleのCore Web Vitals更新をきっかけに検索順位が急落し、これまであった流入が激減する。
- 最終的にユーザーは遅延に耐えきれず離脱し、ビジネス機会を失い、サイトは誰にも見向きもされなくなる。

### HTMLプレビルドという明るい未来

- この記事を読めば、AIと協業し、エッジで超高速に動くWebサイトの設計思想が手に入る。
- 具体的には、RemixとViteで作る「HTMLプレビルドシステム」の設計図を手に入れられる。
- この方法は、本ブログ自身のアーキテクチャとして実証済みであり、極限のパフォーマンスを追求する。
- この情報は、単なる改善案ではなく、AIを"製造ライン"として統制し、品質を担保する未来の開発現場から得られた一次情報である。

### 私も同じでした

筆者も過去に同じパフォーマンス問題で悩み抜き、このブログを「AIによる実装」と「人間による設計」で作り上げることでこの解決策を見つけました。
この記事で、あなたのサイトのボトルネックを発見する基本的な考え方と、明日から試せるTipsを持ち帰れるように書きました。
さらに深掘りして、AIに高品質なコードを生成させるための"ガードレール設計"を知りたい方は、その詳細な実装方法を確認できます。

## 📝 概要

**私が達成した成果:**

- **TTFB（Time To First Byte）の劇的改善** - リクエスト時の重い処理を完全排除し、超高速レスポンスを実現
- **ビルド時処理の完全分離** - Markdown変換、シンタックスハイライトなど全ての重い処理をビルド時に完了
- **Single Source of Truthの維持** - Markdownを唯一の情報源として保ちつつ、パフォーマンスを最大化

この記事では、RemixとViteで作るJamstack型HTMLプレビルドシステムの設計思想と、ビルドプロセスとリクエスト時の責務を完全分離する実装の全詳細を解説します。

## 🔧 実装の全詳細：プレビルドシステムの設計と実装

では、実際にどのようなアーキテクチャでプレビルドシステムを構築したのか、どのライブラリを選定したのか、そしてビルドスクリプトとデータアクセス層の具体的な実装コードを公開します。

### 開発の進捗

- **Before**：アクセスごとにサーバー側でMarkdownをHTMLに変換しており、TTFB（※）が遅延していました。
- **Current**：ビルド時にHTMLへの変換を完了させる「プレビルドシステム」を導入し、TTFBを劇的に改善しました。
- **Next**：このプレビルドの仕組みを、サイトマップやRSSフィードの自動生成にも応用する予定です。

> ※ **TTFB (Time To First Byte)**: ユーザーがリクエストを送ってから、サーバーが最初の1バイトを返すまでの時間。これが短いほど「速いサイト」と感じられます。

### 具体的なタスク

- **Before**：
  パフォーマンス問題を解決するため、Jamstack（※）アーキテクチャの導入を検討し、具体的な設計方針を策定しました。
- **Current**：
  Markdownの解析、HTML変換、シンタックスハイライト適用といった重い処理をビルド時に行うスクリプトを実装しました。
- **Next**：
  ビルド時に生成されたデータバンドルを、Remixのloaderから効率的に読み込むデータアクセス層を実装します。

> ※ **Jamstack**: パフォーマンスとセキュリティを高めるためのモダンなWebサイト構築手法の一つ。

### 課題と解決策

ブログの表示速度、特にTTFBの遅延はユーザー体験を著しく損ないます。この問題は、ユーザーが記事にアクセスするたびに、サーバー側でMarkdownの解析やHTML変換といった重い処理を実行することが原因でした。

#### 工夫したこと

この問題を解決するため、私たちは「**ビルド時（※）に全ての重い処理を完了させ、リクエスト時の責務を最小化する**」というアプローチを選択しました。

> ※ **ビルド時**: ウェブサイトを公開する前の準備段階のこと。

このプレビルドシステムの全体像は以下のようになります。ビルドプロセスとリクエスト時で役割が明確に分離されているのが特徴です。

~~~mermaid
graph TD;
    subgraph "ビルドプロセス（npm run build）"
        A[1. content/blog/**/*.md] --> B{2. ビルドスクリプト<br>（scripts/prebuild/...）};
        B -->|front-matter, marked, shiki| C[3. HTML変換 & 見出し抽出];
        C --> D[4. データバンドル生成<br>（app/generated/blog-posts.ts）];
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px
~~~

~~~mermaid
graph TD;
    subgraph "リクエスト時（ランタイム）"
        E[ユーザーアクセス<br>（/blog/:slug）] --> F[Remix Loader];
        F --> G{Data-IO層<br>（fetchPostBySlug.server.ts）};
        G -->|import| H[app/generated/blog-posts.ts];
        H --> I[記事データを即時返却];
        I --> F;
    end

    style H fill:#f9f,stroke:#333,stroke-width:2px
~~~

#### ぶつかった壁

パフォーマンス改善のために事前にHTMLファイルを生成し、それをGitで管理する方法も検討しました。しかし、この方法では元のMarkdownファイルと生成されたHTMLファイルの同期が崩れるリスクがありました。コンテンツの**「信頼できる唯一の情報源（Single Source of Truth）」**が曖昧になり、保守性が著しく低下するため、この案は採用しませんでした。

#### 解決方法

`npm run build` を実行すると、`prebuild` スクリプトが起動し、以下の処理を行います。

1. **Markdownファイルの探索**: `content/blog/posts/` 配下の全ての `.md` ファイルを探索します。
2. **変換処理**: 各ファイルに対して、HTML変換やシンタックスハイライト適用などの重い処理を実行します。
3. **データバンドル生成**: 全ての記事の変換結果を一つのTypeScriptファイル `app/generated/blog-posts.ts` にまとめます。このファイルはGitの管理対象から除外します。

ユーザーが記事ページにアクセスすると、Remixの `loader` はビルド時に生成されたデータバンドルを直接インポートし、瞬時にデータを返します。これにより、リクエスト時にはファイルI/OやCPU負荷の高い変換処理が一切発生しません。

### コード抜粋

実際のビルドプロセスを担うスクリプトと、リクエスト時にデータを取得するコードを見てみましょう。

#### ビルドスクリプトの責務

このスクリプトは、ビルド時にMarkdownの解析、HTML変換、シンタックスハイライト適用といった重い処理をすべて行い、結果を一つのTypeScriptファイル（データバンドル）として出力します。

~~~javascript
// 抜粋：記事データを生成し、ファイルに書き出す部分
import fs from 'fs/promises';
import path from 'path';

async function generateBlogData() {
  // 1. 全てのMarkdownファイルから記事データを生成 (変換処理を含む)
  const allPosts = await processAllMarkdownFiles();

  // 2. データバンドル用のTypeScriptコードを生成
  const dataBundleContent = `
    import type { BlogPost } from '~/specs/blog/types';
    export const posts: BlogPost[] = ${JSON.stringify(allPosts, null, 2)};

    const postsMap = new Map<string, BlogPost>(posts.map(p => [p.slug, p]));

    export function getPostBySlug(slug: string): BlogPost | undefined {
      return postsMap.get(slug);
    }
  `;

  // 3. ファイルに書き出す
  const outputPath = path.resolve('app/generated/blog-posts.ts');
  await fs.writeFile(outputPath, dataBundleContent);
}
~~~

#### データIO層の責務 (`app/data-io/blog/post-detail/fetchPostBySlug.server.ts`)

リクエスト時に記事データを取得するコードは、ビルド時に生成されたデータバンドルをインポートして、そこからデータを取得するだけの驚くほどシンプルなものになります。

~~~typescript
import { getPostBySlug as getFromBundle } from '~/generated/blog-posts';

export function fetchPostBySlug(slug: string) {
  // ビルド済みデータバンドルから関数を呼び出すだけ
  const post = getFromBundle(slug);
  return post;
}
~~~

### 今回の学びと感想

今回のプレビルドシステム導入から得られた最大の学びは、「**責務の分離がパフォーマンスと保守性の両方を向上させる**」という点です。リクエスト時から重い処理を完全に切り離し、ビルドプロセスにその責務を移譲することで、ユーザーには最高の表示速度を提供しつつ、開発者はコンテンツ（Markdown）の管理に集中できる環境が整いました。

記事数が増えることによるビルド時間の増加というトレードオフはありますが、CI/CDによる自動化と、それによって得られるリクエスト時の信頼性とパフォーマンスのメリットは、そのデメリットを遥かに上回ると考えています。

同じようにWebサイトのパフォーマンスで悩んでいる方がいれば、この「プレビルド」という考え方が一つの強力な解決策になるはずです。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
