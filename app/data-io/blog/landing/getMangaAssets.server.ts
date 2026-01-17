// getMangaAssets.server - 🔌 副作用層
// ターゲット別の漫画画像アセットパスを取得する
// content/blog/landing/{target}/manga/ 配下の画像ファイル一覧を返す

import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { MangaAsset } from '~/specs/blog/types';

/**
 * ターゲット別の漫画画像アセットパスを取得する
 *
 * @param target - ターゲットスラッグ（例: 'engineer'）
 * @returns 漫画アセット情報の配列（ファイル名、パス、表示順序）
 * @throws ディレクトリが存在しない場合
 */
export async function getMangaAssets(target: string): Promise<MangaAsset[]> {
  const mangaDir = join(process.cwd(), 'content', 'blog', 'landing', target, 'manga');

  // ディレクトリ存在確認
  if (!existsSync(mangaDir)) {
    // ディレクトリが存在しない場合、空配列を返す（エラーにしない）
    // UI側でプレースホルダーを表示する仕様に基づく
    return [];
  }

  try {
    // ディレクトリ内のファイル一覧を取得
    const files = readdirSync(mangaDir);

    // 画像ファイルのみをフィルタ（.webp, .png, .jpg, .jpeg）
    const imageExtensions = ['.webp', '.png', '.jpg', '.jpeg'];
    const imageFiles = files.filter(file => {
      const ext = file.toLowerCase().slice(file.lastIndexOf('.'));
      return imageExtensions.includes(ext);
    }).filter(file => {
      // ファイルであることを確認（ディレクトリを除外）
      const filePath = join(mangaDir, file);
      return statSync(filePath).isFile();
    });

    // ファイル名でソート（panel-01.webp, panel-02.webp, ... の順序）
    const sortedFiles = imageFiles.sort((a, b) => a.localeCompare(b));

    // MangaAsset型に変換
    const assets: MangaAsset[] = sortedFiles.map((file, index) => ({
      fileName: file,
      path: `/content/blog/landing/${target}/manga/${file}`,
      order: index + 1,
    }));

    return assets;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read manga assets for target "${target}": ${error.message}`);
    }
    throw new Error(`Failed to read manga assets for target "${target}": Unknown error`);
  }
}
