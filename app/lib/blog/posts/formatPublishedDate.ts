/**
 * ISO形式の日付文字列を日本語形式に変換する純粋関数
 *
 * @param isoDate - ISO形式の日付文字列（例: "2024-05-01"）
 * @returns 日本語形式の日付文字列（例: "2024年5月1日"）
 * @throws {Error} 不正な日付形式の場合
 *
 * @example
 * formatPublishedDate("2024-05-01") // => "2024年5月1日"
 * formatPublishedDate("2024-12-25") // => "2024年12月25日"
 */
export function formatPublishedDate(isoDate: string): string {
  // ISO形式（YYYY-MM-DD）のフォーマットチェック
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(isoDate)) {
    throw new Error("Invalid date format");
  }

  // Date型に変換
  const date = new Date(isoDate);

  // 有効な日付かチェック
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  // ISO形式の文字列から年月日を直接パース（タイムゾーンの影響を避ける）
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 日付の妥当性チェック（Date型の正規化による検証）
  const expectedDate = new Date(year, month - 1, day);
  if (
    expectedDate.getFullYear() !== year ||
    expectedDate.getMonth() !== month - 1 ||
    expectedDate.getDate() !== day
  ) {
    throw new Error("Invalid date format");
  }

  // 日本語形式に変換（月と日の0埋めを除去）
  return `${year}年${month}月${day}日`;
}
