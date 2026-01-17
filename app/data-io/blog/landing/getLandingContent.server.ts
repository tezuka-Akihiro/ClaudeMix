// getLandingContent.server - 🔌 副作用層
// ターゲット別のランディングページコンテンツを取得する
// ビルド時にバンドルされたコンテンツから読み込む

import { getLandingContentBundled } from '~/generated/landing-content';
import type { LandingContent } from '~/specs/blog/types';

/**
 * ターゲット別のランディングページコンテンツを取得する
 *
 * @param target - ターゲットスラッグ（例: 'engineer'）
 * @returns ランディングページコンテンツ
 * @throws ターゲットが存在しない場合
 */
export async function getLandingContent(target: string): Promise<LandingContent> {
  try {
    return getLandingContentBundled(target);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Landing content not found: ${error.message}`);
    }
    throw new Error(`Landing content not found for target "${target}"`);
  }
}
