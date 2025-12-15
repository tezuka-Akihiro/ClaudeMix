// generateOgpImage - 🧠 純粋ロジック層
// OGP画像を生成する純粋関数
// PostMetadataを受け取り、ImageResponseを返す

import { ImageResponse } from 'workers-og';
import type { PostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

/**
 * テキストを指定された最大長で切り詰める
 * @param text - 切り詰める文字列
 * @param maxLength - 最大長
 * @returns 切り詰められた文字列（必要に応じて...を付与）
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * フォントデータを取得（Cache API対応 - Google Fonts API版）
 * Google Fonts APIから動的にTTFを取得し、Cloudflare Edgeでキャッシュ
 * @param ctx - Cloudflare ExecutionContext（waitUntilでバックグラウンドキャッシュ用）
 * @returns フォントのArrayBuffer
 */
async function fetchFont(ctx?: ExecutionContext): Promise<ArrayBuffer> {
  const FONT_API_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap';

  console.log('[OGP/Font] Starting font fetch process');

  try {
    // Cache API を開く
    const cache = await caches.open('ogp-fonts-v1');
    const fontCacheKey = new Request('noto-sans-jp-400-font-file');

    // キャッシュを確認
    const cached = await cache.match(fontCacheKey);
    if (cached) {
      console.log('[OGP/Font] Font loaded from cache');
      const fontBuffer = await cached.arrayBuffer();
      console.log('[OGP/Font] Cached font size:', fontBuffer.byteLength);
      return fontBuffer;
    }

    // キャッシュミス: Google Fonts APIからCSSを取得
    console.log('[OGP/Font] Cache miss, fetching from Google Fonts API...');
    const cssResponse = await fetch(FONT_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.status} ${cssResponse.statusText}`);
    }

    const cssText = await cssResponse.text();
    console.log('[OGP/Font] CSS fetched, extracting TTF URL...');

    // CSSからTTFのURLを抽出（url(...)の部分）
    const urlMatch = cssText.match(/url\((https:\/\/[^)]+\.ttf)\)/);
    if (!urlMatch || !urlMatch[1]) {
      throw new Error('Failed to extract font URL from CSS');
    }

    const fontFileUrl = urlMatch[1];
    console.log('[OGP/Font] TTF URL extracted:', fontFileUrl);

    // TTFファイルをダウンロード
    const fontResponse = await fetch(fontFileUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font file: ${fontResponse.status} ${fontResponse.statusText}`);
    }

    const fontBuffer = await fontResponse.arrayBuffer();
    console.log('[OGP/Font] Font downloaded, size:', fontBuffer.byteLength);

    // バックグラウンドでキャッシュに保存（レスポンスをブロックしない）
    if (ctx) {
      const cacheResponse = new Response(fontBuffer, {
        headers: {
          'Content-Type': 'font/ttf',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
      ctx.waitUntil(cache.put(fontCacheKey, cacheResponse));
      console.log('[OGP/Font] Font will be cached in background');
    }

    return fontBuffer;
  } catch (error) {
    console.error('[OGP/Font] Error fetching font:', error);
    throw error;
  }
}

/**
 * OGP画像を生成する
 * @param metadata - 記事のメタデータ（title, description, author）
 * @param baseUrl - アプリケーションのベースURL
 * @param ctx - Cloudflare ExecutionContext（フォントキャッシュ用）
 * @returns ImageResponse
 */
export async function generateOgpImage(metadata: PostMetadata, baseUrl: string, ctx?: ExecutionContext): Promise<Response> {
  console.log('[OGP/Generate] Starting OGP image generation with baseUrl:', baseUrl);

  // spec.yamlからOGP設定を読み込む（ビルド時に生成された静的データ）
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpConfig = spec.ogp;

  // テキストを最大長で切り詰め
  const title = truncateText(metadata.title, ogpConfig.title.maxLength);
  const description = truncateText(metadata.description, ogpConfig.description.maxLength);
  const author = `${ogpConfig.author.prefix}${metadata.author}`;
  console.log('[OGP/Generate] Text prepared:', { title, description, author });

  // フォントデータを取得（Cache API経由でGoogle Fonts APIから動的取得）
  console.log('[OGP/Generate] Fetching font...');
  const fontData = await fetchFont(ctx);

  console.log('[OGP/Generate] Creating ImageResponse...');
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: `${ogpConfig.layout.paddingY} ${ogpConfig.layout.paddingX}`,
          background: `linear-gradient(${ogpConfig.colors.background.gradientAngle}, ${ogpConfig.colors.background.gradientStart} 0%, ${ogpConfig.colors.background.gradientEnd} 100%)`,
          fontFamily: ogpConfig.font.name,
        }}
      >
        {/* タイトルと説明のコンテナ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: ogpConfig.layout.contentGap,
          }}
        >
          {/* タイトル */}
          <div
            style={{
              fontSize: ogpConfig.title.fontSize,
              fontWeight: 'bold',
              color: ogpConfig.colors.text.primary,
              lineHeight: 1.2,
              maxWidth: '100%',
            }}
          >
            {title}
          </div>

          {/* 説明 */}
          <div
            style={{
              fontSize: ogpConfig.description.fontSize,
              color: ogpConfig.colors.text.description,
              lineHeight: 1.5,
              maxWidth: '100%',
            }}
          >
            {description}
          </div>
        </div>

        {/* 著者情報 */}
        <div
          style={{
            fontSize: ogpConfig.author.fontSize,
            color: ogpConfig.colors.text.author,
          }}
        >
          {author}
        </div>
      </div>
    ),
    {
      width: ogpConfig.image.width,
      height: ogpConfig.image.height,
      fonts: [
        {
          name: ogpConfig.font.name,
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );
}
