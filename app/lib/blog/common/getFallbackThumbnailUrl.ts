// getFallbackThumbnailUrl - 純粋ロジック層
// カテゴリに応じたデフォルトサムネイルURLを取得する

interface ThumbnailMappingSpec {
  thumbnail: {
    display: {
      default_mapping?: Record<string, string | { lg: string; sm: string }>;
    };
  };
}

/**
 * カテゴリ名からデフォルトのサムネイルURLを取得する
 *
 * @param category - カテゴリ名
 * @param spec - サムネイルマッピングを持つ仕様設定
 * @returns デフォルトサムネイルURL。見つからない場合はnull
 */
export function getFallbackThumbnailUrl(
  category: string,
  spec: ThumbnailMappingSpec
): string | { lg: string; sm: string } | null {
  const mapping = spec.thumbnail.display.default_mapping;

  if (!mapping) {
    return null;
  }

  return mapping[category] || null;
}
