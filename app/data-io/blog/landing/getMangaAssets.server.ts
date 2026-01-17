// getMangaAssets.server - 🔌 副作用層
// ターゲット別の漫画画像アセットパスを取得する
// ビルド時にバンドルされたアセット情報から読み込む

import { getMangaAssetsBundled } from '~/generated/landing-content';
import type { MangaAsset } from '~/specs/blog/types';

/**
 * ターゲット別の漫画画像アセットパスを取得する
 *
 * @param target - ターゲットスラッグ（例: 'engineer'）
 * @returns 漫画アセット情報の配列（ファイル名、パス、表示順序）
 */
export async function getMangaAssets(target: string): Promise<MangaAsset[]> {
  return getMangaAssetsBundled(target);
}
