// ogp.$slug[.png] - Route: OGP画像生成エンドポイント
// 記事のslugを受け取り、OGP画像を動的に生成して返す（Resource Route）

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { loadPostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { fetchOgpFont } from '~/data-io/blog/common/fetchOgpFont.server';
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';
import { loadSpec } from '~/spec-utils/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

/**
 * OGP画像生成のloader
 * @param params.slug - 記事のslug（.png拡張子を含む場合は除去）
 * @returns PNG画像のResponse
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  let { slug } = params;

  // @ts-expect-error - Cloudflare Pages specific context
  const ctx = context?.cloudflare?.ctx as ExecutionContext | undefined;

  if (!slug) {
    throw new Response('Not Found', { status: 404 });
  }

  if (slug.endsWith('.png')) {
    slug = slug.slice(0, -4);
  }

  const metadata = await loadPostMetadata(slug);

  if (!metadata) {
    throw new Response('Not Found', { status: 404 });
  }

  const fontData = await fetchOgpFont(ctx);
  const response = await generateOgpImage(metadata, fontData);

  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const cacheDirective = spec.ogp.cache.directive;

  const imageData = await response.arrayBuffer();

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheDirective);

  return new Response(imageData, {
    status: 200,
    headers,
  });
}
