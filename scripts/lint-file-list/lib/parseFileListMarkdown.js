/**
 * file-list.mdをパースし、実装ファイルパスの配列を返す
 * @param {string} markdownContent - file-list.mdの内容
 * @returns {string[]} - ファイルパスの配列（3大層アーキテクチャの実装層のみ: app/components, app/lib, app/data-io）
 */
export function parseFileListMarkdown(markdownContent) {
  const filePaths = [];

  // マークダウンテーブルを行ごとに分割
  const lines = markdownContent.split('\n');

  let inTable = false;
  let pathColumnIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // テーブルのヘッダー行を検出（パス列の位置を特定）
    // ヘッダー行は「ファイル名」と「パス」の両方を含むべき
    if (line.includes('|') &&
        line.toLowerCase().includes('パス') &&
        line.toLowerCase().includes('ファイル名')) {
      // slice(1, -1)で先頭と末尾の空要素を削除（空のセルは保持）
      const columns = line.split('|').slice(1, -1).map(col => col.trim());
      pathColumnIndex = columns.findIndex(col => col.toLowerCase().includes('パス'));
      inTable = true;
      continue;
    }

    // 区切り行（| :--- | :--- | :--- |）をスキップ
    if (line.match(/^\|[\s:|-]+\|$/)) {
      continue;
    }

    // テーブルのデータ行を処理
    if (inTable && line.startsWith('|')) {
      // slice(1, -1)で先頭と末尾の空要素を削除（空のセルは保持）
      const columns = line.split('|').slice(1, -1).map(col => col.trim());

      // パス列が存在し、有効なインデックスの場合
      if (pathColumnIndex >= 0 && pathColumnIndex < columns.length) {
        const path = columns[pathColumnIndex].trim();

        // 3大層アーキテクチャの実装層のみを対象とする
        // - tests/配下は除外（テストは別途E2Eでカバー）
        // - app/routes は除外（ルートファイルはE2Eでカバー、3大層の対象外）
        // - app/components, app/lib, app/data-io のみを抽出
        const isImplementationLayer =
          path.startsWith('app/components/') ||
          path.startsWith('app/lib/') ||
          path.startsWith('app/data-io/');

        if (path && isImplementationLayer) {
          filePaths.push(path);
        }
      }
    } else if (inTable && !line.includes('|')) {
      // テーブル終了
      inTable = false;
      pathColumnIndex = -1;
    }
  }

  // 重複を削除して返却
  return [...new Set(filePaths)];
}
