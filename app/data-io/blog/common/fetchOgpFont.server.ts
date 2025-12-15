// fetchOgpFont.server - 🔌 副作用層
// Google Fonts APIからフォントを取得し、Cache APIでキャッシュ
// Cloudflare Workers環境での動的フォント取得を担当

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

/**
 * フォントデータを取得（Cache API対応 - Google Fonts API版）
 * Google Fonts APIから動的にTTFを取得し、Cloudflare Edgeでキャッシュ
 * @param ctx - Cloudflare ExecutionContext（waitUntilでバックグラウンドキャッシュ用）
 * @returns フォントのArrayBuffer
 */
export async function fetchOgpFont(ctx?: ExecutionContext): Promise<ArrayBuffer> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const fontFetchConfig = spec.ogp.font.fetch;

  try {
    const cssResponse = await fetch(fontFetchConfig.apiUrl, {
      headers: {
        'User-Agent': fontFetchConfig.userAgent,
      },
    });

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.status} ${cssResponse.statusText}`);
    }

    const cssText = await cssResponse.text();

    const urlRegex = new RegExp(fontFetchConfig.urlRegex);
    const urlMatch = cssText.match(urlRegex);
    if (!urlMatch || !urlMatch[1]) {
      throw new Error('Failed to extract font URL from CSS');
    }

    const fontFileUrl = urlMatch[1];

    const cache = await caches.open(fontFetchConfig.cacheName);

    const cached = await cache.match(fontFileUrl);
    if (cached) {
      return await cached.arrayBuffer();
    }

    const fontResponse = await fetch(fontFileUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font file: ${fontResponse.status} ${fontResponse.statusText}`);
    }

    const fontBuffer = await fontResponse.arrayBuffer();

    if (ctx) {
      const cacheResponse = new Response(fontBuffer, {
        headers: {
          'Content-Type': fontFetchConfig.contentType,
          'Cache-Control': fontFetchConfig.cacheControl,
        },
      });
      ctx.waitUntil(cache.put(fontFileUrl, cacheResponse));
    }

    return fontBuffer;
  } catch (error) {
    console.error('[OGP/Font] Error fetching font:', error);
    throw error;
  }
}
