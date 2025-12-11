---
slug: "remix-ogp-route-integration"
title: "OGP画像生成をRemixルートに統合した理由 - Next.js的な「機能分離」を捨て、AIに優しい設計を選んだ話"
description: "SNSシェア対策としてOGP画像を動的生成する際、Next.jsのAPIルート的な設計とRemixのルート統合で迷いました。最終的にRemixのルーティングに統合することで、AIが一貫性のあるコードを生成しやすい構造を実現した経緯を解説します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-09"
category: "ClaudeMix Philosophy"
tags: ["architecture", "performance", "OGP", "Loader", "Nested Routing"]
---

SNSでのシェア対策として、動的OGP画像を生成したいと思いました。

しかし、Next.jsのAPIルート的な「機能を分離する設計」とRemixの「Webページと同じルーティング」のどちらを選ぶべきか迷いました。

とりあえずAPIっぽく別ファイルに切り出してみたが、AIに実装を指示すると、データ取得とレンダリングのライフサイクルが分断され、一貫性のないコードが生成されました。

## この記事をお勧めしない人

この記事は、以下のような方には**お勧めしません**。

- OGP画像は事前に静的生成しておけば十分で、動的生成の必要性を感じない人
- 「機能は分離すべき」というNext.js的な設計思想を絶対視し、Remixの統合思想に興味がない人
- AIにコードを書かせる際の「構造的な制約」や「一貫性の担保」に全く関心がない人

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

## 行動しないリスク

従来の「機能分離」思想を無批判に適用し続けることで、あなたのコードベースには「AIが一貫性のないコードを生成する土壌」が静かに蓄積されていきます。

やがて、新しい機能追加や仕様変更をきっかけに、AIが生成するコードの品質が急激に低下し、修正コストが爆発的に増加します。

ついに、「AIで速く作れる」という期待は裏切られ、あなたのプロジェクトは手作業での品質担保に追われる「技術的負債の沼」に沈んでいきます。

## この記事で得られること

この記事を読めば、RemixとCloudflare Edgeを組み合わせた「AIに優しい統合設計」の思想が手に入ります。

具体的には、OGP画像生成を独立したAPIではなくRemixルートとして統合し、データ取得から画像返却までを一貫したライフサイクルで処理する設計図を手に入れられます。

この方法は、机上の空論ではありません。まさにこのブログ自身のアーキテクチャとして実証済みで、Edgeキャッシュにより静的ファイルと同等のパフォーマンスも実現しています。

## なぜこの方法なのか

筆者も過去に同じ設計の迷いで悩み抜き、このブログを「AIによる実装」と「人間による構造設計」で作り上げることで答えを見つけました。

まずはRemixとNext.jsの設計思想の違いと、AIに一貫性のあるコードを書かせるための基本的な考え方から見ていきましょう。

## 開発の進捗

- **Before**：OGP画像生成を別機能として分離すべきか、Remixルートに統合すべきか判断できない状態
- **Current**：RemixのResource Routeとして実装し、Cloudflare Edgeで高速キャッシュを実現
- **Next**：記事メタデータの拡充と、OGP画像のデザインバリエーション追加

## 具体的なタスク

- **Before**：
  - OGP画像生成の要件定義（動的生成の必要性、パフォーマンス要件）
  - Next.jsのAPIルートとRemixのルート統合の比較検討
  - AIに指示する際の設計方針の明確化

- **Current**：
  - `routes/ogp.$slug[.png].tsx`としてResource Routeを実装
  - `satori`と`@resvg/resvg-wasm`を使用した画像生成処理の構築
  - Cloudflare EdgeでのCache-Control設定による高速化

- **Next**：
  - カテゴリごとのOGP画像デザインバリエーション
  - 記事のアイキャッチ画像との連携
  - パフォーマンスモニタリングとキャッシュヒット率の計測

## 課題と解決策

従来の「機能分離」思想を無批判に適用し続けることで、コードベースには「AIが一貫性のないコードを生成する土壌」が静かに蓄積されていきます。

やがて、新しい機能追加や仕様変更をきっかけに、AIが生成するコードの品質が急激に低下し、修正コストが爆発的に増加する可能性があります。最悪の場合、「AIで速く作れる」という期待は裏切られ、プロジェクトは手作業での品質担保に追われる"技術的負債の沼"に沈んでいくことになります。

### 工夫したこと

OGP画像生成を独立したAPIではなく、**RemixのResource Routeとして統合**しました。これにより、データ取得から画像返却までを一貫したライフサイクルで処理できる構造を実現しました。

具体的には、`routes/ogp.$slug[.png].tsx`というファイル名で、RemixのネストルーティングとしてOGP画像生成エンドポイントを定義しました。これにより：

1. **構造的一貫性**：通常のページルートと同じloaderパターンで実装できる
2. **AIの理解しやすさ**：Remixの標準パターンに従うため、AIが一貫したコードを生成しやすい
3. **パフォーマンス**：Cloudflare Edgeでのキャッシュを活用し、2回目以降は静的ファイルと同等の速度

### ぶつかった壁

当初、Next.jsのAPIルート的な設計を踏襲し、OGP画像生成を別ファイルに分離してAPIとして実装しようとしました。しかし、AIに実装を依頼すると、以下の問題が発生しました：

1. **ライフサイクルの分断**：データ取得とレンダリングが別々のタイミングで処理されるコードが生成された
2. **エラーハンドリングの不一致**：ページルートとAPIルートで異なるエラーハンドリングパターンが混在した
3. **型定義の重複**：同じデータ構造の型定義が複数箇所に散らばった

これらは、AIが「機能の分離」と「一貫性の保持」のバランスを適切に判断できないために発生した問題でした。

### 解決方法

RemixのResource Routeパターンを採用し、通常のページルートと同じ構造で実装することにしました。これにより、AIに対して「Webページと同じパターンで画像を返すルート」という明確な制約を与えることができました。

また、Cloudflare Workers環境での動作を考慮し、以下の技術的な工夫を行いました：

1. **WASMベースのレンダリング**: Node.js環境に依存する`@resvg/resvg-js`ではなく、Cloudflare Workersでも動作する`@resvg/resvg-wasm`を採用しました。
2. **CDN経由のフォント取得**: ファイルシステムアクセスが制限されるCloudflare Workers環境でも動作するよう、`@fontsource/noto-sans-jp`のフォントをCDN（jsDelivr）経由で取得する方式を採用しました。

## コード抜粋

### OGP画像生成ルート

```typescript
// app/routes/ogp.$slug[.png].tsx
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { loadPostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

export async function loader({ params }: LoaderFunctionArgs) {
  let { slug } = params;

  if (!slug) {
    throw new Response('Not Found', { status: 404 });
  }

  // .png拡張子を除去
  if (slug.endsWith('.png')) {
    slug = slug.slice(0, -4);
  }

  // 記事のメタデータを取得
  const metadata = await loadPostMetadata(slug);

  if (!metadata) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    // OGP画像を生成
    const imageBuffer = await generateOgpImage(metadata);

    // spec.yamlからキャッシュ設定を取得
    const spec = loadSpec<BlogCommonSpec>('blog/common');
    const cacheDirective = spec.ogp.cache.directive;

    // PNG画像としてレスポンスを返す
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheDirective,
      },
    });
  } catch (error) {
    console.error(`Failed to generate OGP image for slug "${slug}":`, error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}
```

### OGP画像生成ロジック

```typescript
// app/lib/blog/common/generateOgpImage.tsx
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import type { PostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

// WASM初期化フラグ
let wasmInitialized = false;

/**
 * WASM初期化（初回のみ実行）
 */
async function ensureWasmInitialized(): Promise<void> {
  if (!wasmInitialized) {
    // WASMファイルをfetchしてArrayBufferとして読み込む
    const response = await fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm');
    const wasmBinary = await response.arrayBuffer();
    await initWasm(wasmBinary);
    wasmInitialized = true;
  }
}

/**
 * フォントデータを取得（CDN経由）
 */
export async function fetchFont(): Promise<ArrayBuffer> {
  // CDN経由でフォントを取得（Cloudflare Workers互換）
  const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.8/files/noto-sans-jp-japanese-400-normal.woff';
  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

export async function generateOgpImage(metadata: PostMetadata): Promise<Buffer> {
  // WASM初期化
  await ensureWasmInitialized();

  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpConfig = spec.ogp;

  const title = truncateText(metadata.title, ogpConfig.title.maxLength);
  const description = truncateText(metadata.description, ogpConfig.description.maxLength);

  const fontData = await fetchFont();

  // Satoriを使ってSVGを生成
  const svg = await satori(
    <div style={{
      // 省略
    }}
  );

  // SVGをPNGに変換（WASM版）
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return Buffer.from(pngBuffer);
}
```

## 今回の学びと感想

この経験から、**AIコーディング時代における「良い設計」とは、人間にとって分かりやすいだけでなく、AIにとっても一貫性を理解しやすい構造である**ことを学びました。

Next.jsのAPIルートのような「機能の分離」は、一見すると関心の分離という設計原則に従っているように見えます。しかし、RemixのResource Routeのような「統合されたルーティング」は、AIに対して「このパターンに従えば良い」という明確な制約を与えることができます。

特に印象的だったのは、Remixのloaderパターンに統一することで、AIが生成するコード品質が劇的に向上したことです。データ取得、エラーハンドリング、レスポンス返却という一連の流れが、常に同じパターンで実装されるため、AIが迷うことなく正しいコードを生成できるのです。

また、Cloudflare Workers環境特有の制約に直面し、以下の技術的な学びを得ました：

1. **WASMの活用**: Node.jsのネイティブモジュールに依存する`@resvg/resvg-js`ではなく、`@resvg/resvg-wasm`を採用することで、Cloudflare Workersでも動作する画像生成を実現しました。
2. **CDNベースのリソース取得**: ファイルシステムアクセスが制限されるEdge環境では、フォントなどのリソースをCDN経由で取得する設計が不可欠でした。これにより、環境に依存しない堅牢な実装が可能になりました。

このブログ自身が「AIに実装させ、人間が設計する」というコンセプトで作られているため、この知見は今後の開発にも活かせると確信しています。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
