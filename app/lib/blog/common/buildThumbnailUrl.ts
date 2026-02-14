// buildThumbnailUrl - 純粋ロジック層
// R2アセットからサムネイルURLを生成する

import type { R2AssetsConfig } from '~/specs/blog/types';

/**
 * 記事のslugからサムネイルURLを生成する
 *
 * ゼロ設定方式: frontmatterに画像パスを指定せず、slugベースで自動解決
 * パターン: {base_url}{blog_path}/{slug}/{variant}.avif
 *
 * @param slug - 記事のslug
 * @param config - R2アセット設定
 * @returns サムネイルURLのセット（lg/sm）。slugが空の場合はnull
 */
export function buildThumbnailUrl(
  slug: string,
  config: R2AssetsConfig
): { lg: string; sm: string } | null {
  const trimmedSlug = slug.trim();

  if (trimmedSlug === '') {
    return null;
  }

  const { base_url, blog_path, variants } = config;

  return {
    lg: `${base_url}${blog_path}/${trimmedSlug}/${variants.lg}.avif`,
    sm: `${base_url}${blog_path}/${trimmedSlug}/${variants.sm}.avif`,
  };
}
