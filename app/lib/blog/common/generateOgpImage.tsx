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
 * フォントデータを取得（Cache API対応 - 静的ファイル版）
 * public/フォルダの静的TTFをCloudflare Edgeでキャッシュ
 * @param baseUrl - アプリケーションのベースURL
 * @param ctx - Cloudflare ExecutionContext（waitUntilでバックグラウンドキャッシュ用）
 * @returns フォントのArrayBuffer
 */
async function fetchFont(baseUrl: string, ctx?: ExecutionContext): Promise<ArrayBuffer> {
  // 静的フォントファイルのURL（要: public/NotoSansJP-Regular.ttf を配置）
  const fontUrl = `${baseUrl}/NotoSansJP-Regular.ttf`;

  console.log('[OGP/Font] Fetching font from:', fontUrl);

  try {
    // Cache API を開く
    const cache = await caches.open('ogp-fonts-v1');
    const cacheKey = new Request(fontUrl);

    // キャッシュを確認
    const cached = await cache.match(cacheKey);
    if (cached) {
      console.log('[OGP/Font] Font loaded from cache');
      const fontBuffer = await cached.arrayBuffer();
      console.log('[OGP/Font] Cached font size:', fontBuffer.byteLength);
      return fontBuffer;
    }

    // キャッシュミス: 静的ファイルを取得
    console.log('[OGP/Font] Cache miss, fetching from static file...');
    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font: ${fontResponse.status} ${fontResponse.statusText}`);
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
      ctx.waitUntil(cache.put(cacheKey, cacheResponse));
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

  // フォントデータを取得（Cache API経由で静的ファイルをキャッシュ）
  console.log('[OGP/Generate] Fetching font...');
  const fontData = await fetchFont(baseUrl, ctx);

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
