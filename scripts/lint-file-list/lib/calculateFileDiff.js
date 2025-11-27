/**
 * 2つのファイルパス配列の差分を計算
 * @param {string[]} definedFiles - file-list.mdに定義されたファイル
 * @param {string[]} actualFiles - 実際に存在するファイル
 * @returns {{undefinedFiles: string[], missingFiles: string[]}}
 */
export function calculateFileDiff(definedFiles, actualFiles) {
  // パス正規化関数
  const normalizePath = (path) => {
    return path
      .trim()
      .replace(/\\/g, '/'); // Windowsのバックスラッシュをスラッシュに変換
  };

  // 正規化したパスのセットを作成
  const normalizedDefinedFiles = new Set(
    definedFiles.map(normalizePath)
  );
  const normalizedActualFiles = new Set(
    actualFiles.map(normalizePath)
  );

  // 未定義ファイル（actualFiles - definedFiles）
  const undefinedFiles = actualFiles
    .filter(file => !normalizedDefinedFiles.has(normalizePath(file)))
    .map(normalizePath);

  // 不足ファイル（definedFiles - actualFiles）
  const missingFiles = definedFiles
    .filter(file => !normalizedActualFiles.has(normalizePath(file)))
    .map(normalizePath);

  return {
    undefinedFiles,
    missingFiles,
  };
}
