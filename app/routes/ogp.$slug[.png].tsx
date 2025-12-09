// ogp.$slug[.png] - Route: OGP画像生成エンドポイント
// 記事のslugを受け取り、OGP画像を動的に生成して返す（Resource Route）

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { loadPostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

/**
 * OGP画像生成のloader
 * @param params.slug - 記事のslug（.png拡張子を含む場合は除去）
 * @returns PNG画像のResponse
 */
export async function loader({ params }: LoaderFunctionArgs) {
  let { slug } = params;

  // slugが存在しない場合は404
  if (!slug) {
    throw new Response('Not Found', { status: 404 });
  }

  // .png拡張子を除去（/ogp/slug.pngの形式で呼ばれる場合に対応）
  if (slug.endsWith('.png')) {
    slug = slug.slice(0, -4);
  }

  // 記事のメタデータを取得
  const metadata = await loadPostMetadata(slug);

  // 記事が存在しない場合は404
  if (!metadata) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    // OGP画像を生成
    const imageBuffer = await generateOgpImage(metadata);

    // spec.yamlからキャッシュ設定を取得（ビルド時に生成された静的データ）
    const spec = loadSpec<BlogCommonSpec>('blog/common');
    const cacheDirective = spec.ogp.cache.directive;

    // PNG画像としてレスポンスを返す
    // BufferをUint8Arrayに変換してResponseに渡す
    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheDirective,
      },
    });
  } catch (error) {
    // 画像生成に失敗した場合は500エラー
    console.error(`Failed to generate OGP image for slug "${slug}":`, error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}
