// buildThumbnailUrl - 純粋ロジック層
// R2アセットからサムネイルURLを生成する

import type { R2AssetsConfig } from '~/specs/blog/types';

/**
 * 記事のslugからサムネイルURLを生成する
 *
 * ゼロ設定方式: frontmatterに画像パスを指定せず、slugベースで自動解決
 * パターン: {base_url}{blog_path}/{slug}/{thumbnail.filename}
 *
 * @param slug - 記事のslug
 * @param config - R2アセット設定
 * @returns サムネイルURL。slugが空の場合はnull
 */
export function buildThumbnailUrl(
  slug: string,
  config: R2AssetsConfig
): string | null {
  const trimmedSlug = slug.trim();

  if (trimmedSlug === '') {
    return null;
  }

  return `${config.base_url}${config.blog_path}/${trimmedSlug}/${config.thumbnail.filename}`;
}
