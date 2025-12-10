// generateOgpImage - 🧠 純粋ロジック層
// OGP画像を生成する純粋関数
// PostMetadataを受け取り、PNG画像バッファを返す

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
 * フォントデータを取得
 * @returns フォントのArrayBuffer
 */
export async function fetchFont(): Promise<ArrayBuffer> {
  // @fontsource パッケージからフォントファイルを読み込む
  // Node.js環境でのみ動作（サーバーサイド）
  const fs = await import('fs/promises');
  const path = await import('path');

  // @fontsource/noto-sans-jpのフォントファイルパスを解決
  const fontPath = path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'noto-sans-jp',
    'files',
    'noto-sans-jp-japanese-400-normal.woff'
  );

  const buffer = await fs.readFile(fontPath);
  return buffer.buffer;
}

/**
 * OGP画像を生成する
 * @param metadata - 記事のメタデータ（title, description, author）
 * @returns PNG画像のバッファ
 */
export async function generateOgpImage(metadata: PostMetadata): Promise<Buffer> {
  // WASM初期化
  await ensureWasmInitialized();

  // spec.yamlからOGP設定を読み込む（ビルド時に生成された静的データ）
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const ogpConfig = spec.ogp;

  // テキストを最大長で切り詰め
  const title = truncateText(metadata.title, ogpConfig.title.maxLength);
  const description = truncateText(metadata.description, ogpConfig.description.maxLength);
  const author = `${ogpConfig.author.prefix}${metadata.author}`;

  // フォントデータを取得
  const fontData = await fetchFont();

  // Satoriを使ってSVGを生成
  const svg = await satori(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '60px 80px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: ogpConfig.font.family,
      }}
    >
      {/* タイトルと説明のコンテナ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* タイトル */}
        <div
          style={{
            fontSize: ogpConfig.title.fontSize,
            fontWeight: 'bold',
            color: '#ffffff',
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
            color: 'rgba(255, 255, 255, 0.7)',
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
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        {author}
      </div>
    </div>,
    {
      width: ogpConfig.image.width,
      height: ogpConfig.image.height,
      fonts: [
        {
          name: ogpConfig.font.family,
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  // SVGをPNGに変換（WASM版）
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return Buffer.from(pngBuffer);
}
