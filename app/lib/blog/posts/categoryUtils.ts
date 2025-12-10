// categoryUtils - Logic (lib層)
// カテゴリ名から絵文字を取得する純粋関数

/**
 * カテゴリ名から対応する絵文字を取得する（spec値注入パターン）
 * @param categoryName - カテゴリ名
 * @param categories - spec.yamlから読み込んだカテゴリ定義
 * @param defaultEmoji - 未知のカテゴリの場合のデフォルト絵文字
 * @returns カテゴリに対応する絵文字
 */
export function getCategoryEmoji(
  categoryName: string,
  categories: Array<{ name: string; emoji: string }>,
  defaultEmoji: string
): string {
  const category = categories.find(cat => cat.name === categoryName);
  return category?.emoji || defaultEmoji;
}
