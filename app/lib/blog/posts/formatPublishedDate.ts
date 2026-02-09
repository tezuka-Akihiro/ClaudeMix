/**
 * ISO形式の日付文字列をドット記法形式に変換する純粋関数
 *
 * @param isoDate - ISO形式の日付文字列（例: "2024-05-01"）
 * @returns ドット記法形式の日付文字列（例: "2024.05.01"）
 * @throws {Error} 不正な日付形式の場合
 *
 * @example
 * formatPublishedDate("2024-05-01") // => "2024.05.01"
 * formatPublishedDate("2024-12-25", "/") // => "2024/12/25"
 */
export function formatPublishedDate(isoDate: string, separator: string = "."): string {
  // ISO形式（YYYY-MM-DD）のフォーマットチェック
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(isoDate)) {
    throw new Error("Invalid date format");
  }

  // ISO形式の文字列から年月日を直接パース（タイムゾーンの影響を避ける）
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 基本的な範囲チェック（簡易的な妥当性検証）
  // Dateオブジェクトを使用しないことで、サーバー/クライアント間の一貫性を保証
  if (
    year < 1900 || year > 2100 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    throw new Error("Invalid date format");
  }

  // 指定されたセパレータ形式に変換（月と日を0埋めして2桁にする）
  return `${year}${separator}${monthStr}${separator}${dayStr}`;
}
