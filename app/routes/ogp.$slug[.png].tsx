// ogp.$slug[.png] - Route: OGP画像生成エンドポイント
// 記事のslugを受け取り、OGP画像を動的に生成して返す（Resource Route）

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { loadPostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { fetchOgpFont } from '~/data-io/blog/common/fetchOgpFont.server';
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { debugLog, errorLog } from '~/lib/blog/common/logger';

/**
 * OGP画像生成のloader
 * @param params.slug - 記事のslug（.png拡張子を含む場合は除去）
 * @returns PNG画像のResponse
 */
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  let { slug } = params;

  debugLog('[OGP] Starting OGP image generation for slug:', slug);

  // Cloudflare ExecutionContext を取得（キャッシュ用）
  // @ts-expect-error - Cloudflare Pages specific context
  const ctx = context?.cloudflare?.ctx as ExecutionContext | undefined;

  // slugが存在しない場合は404
  if (!slug) {
    errorLog('[OGP] No slug provided', new Error('Slug is undefined'));
    throw new Response('Not Found', { status: 404 });
  }

  // .png拡張子を除去（/ogp/slug.pngの形式で呼ばれる場合に対応）
  if (slug.endsWith('.png')) {
    slug = slug.slice(0, -4);
    debugLog('[OGP] Removed .png extension, slug is now:', slug);
  }

  // 記事のメタデータを取得
  debugLog('[OGP] Loading post metadata for:', slug);
  const metadata = await loadPostMetadata(slug);

  // 記事が存在しない場合は404
  if (!metadata) {
    errorLog('[OGP] Post not found for slug:', slug);
    throw new Response('Not Found', { status: 404 });
  }

  debugLog('[OGP] Metadata loaded:', { title: metadata.title, author: metadata.author });

  try {
    debugLog('[OGP] Fetching font...');
    // フォントデータを取得（Cache API経由でGoogle Fonts APIから動的取得）
    const fontData = await fetchOgpFont(ctx);

    debugLog('[OGP] Starting image generation...');
    // OGP画像を生成（純粋関数）
    const response = await generateOgpImage(metadata, fontData);

    // spec.yamlからキャッシュ設定を取得（ビルド時に生成された静的データ）
    const spec = loadSpec<BlogCommonSpec>('blog/common');
    const cacheDirective = spec.ogp.cache.directive;

    // ImageResponseのbodyを完全に読み取る（ReadableStreamは一度しか読めないため）
    debugLog('[OGP] Reading image data from response...');
    const imageData = await response.arrayBuffer();
    debugLog('[OGP] Image data size:', imageData.byteLength, 'bytes');

    // キャッシュヘッダーを追加してレスポンスを返す
    debugLog('[OGP] Creating response with cache headers');
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', cacheDirective);

    return new Response(imageData, {
      status: 200,
      headers,
    });
  } catch (error) {
    // 画像生成に失敗した場合は500エラー
    errorLog(`[OGP] Failed to generate OGP image for slug "${slug}"`, error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}
