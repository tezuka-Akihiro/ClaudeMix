// generateOgpImage - 🧠 純粋ロジック層
// OGP画像を生成する純粋関数
// PostMetadataとフォントデータを受け取り、ImageResponseを返す

import { ImageResponse } from 'workers-og';
import type { PostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import { loadSpec } from '~/spec-utils/specLoader.server';
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
 * OGP画像を生成する（純粋関数）
 * @param metadata - 記事のメタデータ（title, description, author）
 * @param fontData - フォントファイルのArrayBuffer
 * @returns ImageResponse
 */
export async function generateOgpImage(metadata: PostMetadata, fontData: ArrayBuffer): Promise<Response> {
  // spec.yamlからOGP設定を読み込む（ビルド時に生成された静的データ）
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpConfig = spec.ogp;

  // テキストを最大長で切り詰め
  const title = truncateText(metadata.title, ogpConfig.title.maxLength);
  const description = truncateText(metadata.description, ogpConfig.description.maxLength);
  const author = `${ogpConfig.author.prefix}${metadata.author}`;
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
