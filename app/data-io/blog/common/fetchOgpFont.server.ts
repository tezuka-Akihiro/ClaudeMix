// fetchOgpFont.server - 🔌 副作用層
// Google Fonts APIからフォントを取得し、Cache APIでキャッシュ
// Cloudflare Workers環境での動的フォント取得を担当

import { debugLog, errorLog } from '~/lib/blog/common/logger';
import {
  GOOGLE_FONTS_CSS_URL,
  FONT_FETCH_USER_AGENT,
  OGP_FONT_CACHE_NAME,
  FONT_CONTENT_TYPE,
  FONT_CACHE_CONTROL,
  FONT_URL_REGEX,
} from '~/lib/blog/common/ogp-constants';

/**
 * フォントデータを取得（Cache API対応 - Google Fonts API版）
 * Google Fonts APIから動的にTTFを取得し、Cloudflare Edgeでキャッシュ
 * @param ctx - Cloudflare ExecutionContext（waitUntilでバックグラウンドキャッシュ用）
 * @returns フォントのArrayBuffer
 */
export async function fetchOgpFont(ctx?: ExecutionContext): Promise<ArrayBuffer> {
  debugLog('[OGP/Font] Starting font fetch process');

  try {
    // Google Fonts APIからCSSを取得してフォントURLを抽出
    debugLog('[OGP/Font] Fetching CSS from Google Fonts API...');
    const cssResponse = await fetch(GOOGLE_FONTS_CSS_URL, {
      headers: {
        'User-Agent': FONT_FETCH_USER_AGENT,
      },
    });

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.status} ${cssResponse.statusText}`);
    }

    const cssText = await cssResponse.text();
    debugLog('[OGP/Font] CSS fetched, extracting TTF URL...');

    // CSSからTTFのURLを抽出（url(...)の部分）
    const urlMatch = cssText.match(FONT_URL_REGEX);
    if (!urlMatch || !urlMatch[1]) {
      throw new Error('Failed to extract font URL from CSS');
    }

    const fontFileUrl = urlMatch[1];
    debugLog('[OGP/Font] TTF URL extracted:', fontFileUrl);

    // Cache API を開く（フォントURLをキャッシュキーとして使用）
    const cache = await caches.open(OGP_FONT_CACHE_NAME);

    // キャッシュを確認
    const cached = await cache.match(fontFileUrl);
    if (cached) {
      debugLog('[OGP/Font] Font loaded from cache');
      const fontBuffer = await cached.arrayBuffer();
      debugLog('[OGP/Font] Cached font size:', fontBuffer.byteLength);
      return fontBuffer;
    }

    // キャッシュミス: TTFファイルをダウンロード
    debugLog('[OGP/Font] Cache miss, downloading font file...');
    const fontResponse = await fetch(fontFileUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font file: ${fontResponse.status} ${fontResponse.statusText}`);
    }

    const fontBuffer = await fontResponse.arrayBuffer();
    debugLog('[OGP/Font] Font downloaded, size:', fontBuffer.byteLength);

    // バックグラウンドでキャッシュに保存（レスポンスをブロックしない）
    if (ctx) {
      const cacheResponse = new Response(fontBuffer, {
        headers: {
          'Content-Type': FONT_CONTENT_TYPE,
          'Cache-Control': FONT_CACHE_CONTROL,
        },
      });
      ctx.waitUntil(cache.put(fontFileUrl, cacheResponse));
      debugLog('[OGP/Font] Font will be cached in background');
    }

    return fontBuffer;
  } catch (error) {
    errorLog('[OGP/Font] Error fetching font:', error);
    throw error;
  }
}
