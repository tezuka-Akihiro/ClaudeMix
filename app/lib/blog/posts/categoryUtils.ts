// categoryUtils - Logic (lib層)
// カテゴリ名から絵文字を取得する純粋関数

/**
 * カテゴリ名から対応する絵文字を取得する
 * @param categoryName - カテゴリ名
 * @returns カテゴリに対応する絵文字
 */
export function getCategoryEmoji(categoryName: string): string {
  // カテゴリ名と絵文字のマッピング
  const categoryMap: Record<string, string> = {
    'Claude Best Practices': '📚',
    'ClaudeMix Philosophy': '🎨',
    'Tutorials & Use Cases': '🚀',
  };

  // マッピングに存在する場合はそのemoji、存在しない場合はデフォルト
  return categoryMap[categoryName] || '📄';
}
