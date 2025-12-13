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
export async function loader({ params, request }: LoaderFunctionArgs) {
  let { slug } = params;

  // リクエストURLからベースURLを取得（Cloudflare Workers環境で必要）
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  console.log('[OGP] Starting OGP image generation for slug:', slug, 'baseUrl:', baseUrl);

  // slugが存在しない場合は404
  if (!slug) {
    console.error('[OGP] No slug provided');
    throw new Response('Not Found', { status: 404 });
  }

  // .png拡張子を除去（/ogp/slug.pngの形式で呼ばれる場合に対応）
  if (slug.endsWith('.png')) {
    slug = slug.slice(0, -4);
    console.log('[OGP] Removed .png extension, slug is now:', slug);
  }

  // 記事のメタデータを取得
  console.log('[OGP] Loading post metadata for:', slug);
  const metadata = await loadPostMetadata(slug);

  // 記事が存在しない場合は404
  if (!metadata) {
    console.error('[OGP] Post not found for slug:', slug);
    throw new Response('Not Found', { status: 404 });
  }

  console.log('[OGP] Metadata loaded:', { title: metadata.title, author: metadata.author });

  try {
    console.log('[OGP] Starting image generation...');
    // OGP画像を生成（ImageResponseを返す）
    const response = await generateOgpImage(metadata, baseUrl);

    // spec.yamlからキャッシュ設定を取得（ビルド時に生成された静的データ）
    const spec = loadSpec<BlogCommonSpec>('blog/common');
    const cacheDirective = spec.ogp.cache.directive;

    // キャッシュヘッダーを追加してレスポンスを返す
    console.log('[OGP] Adding cache headers and returning response');
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', cacheDirective);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    // 画像生成に失敗した場合は500エラー
    console.error(`[OGP] Failed to generate OGP image for slug "${slug}":`, error);
    console.error('[OGP] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[OGP] Error cause:', error instanceof Error && 'cause' in error ? error.cause : 'No cause');
    throw new Response('Internal Server Error', { status: 500 });
  }
}
