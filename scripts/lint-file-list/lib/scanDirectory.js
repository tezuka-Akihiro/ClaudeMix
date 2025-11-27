import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OPTIONS = {
  excludePatterns: ['node_modules', '.git', 'build', 'dist', 'public/build', 'tests'],
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
};

/**
 * 指定ディレクトリを再帰的にスキャンし、ファイルパスの配列を返す
 * @param {string} targetDir - スキャン対象ディレクトリ
 * @param {Object} options - オプション
 * @param {string[]} options.excludePatterns - 除外パターン
 * @param {string[]} options.includeExtensions - 含める拡張子
 * @returns {string[]} - ファイルパスの配列
 */
export function scanDirectory(targetDir, options = {}) {
  const {
    excludePatterns = DEFAULT_OPTIONS.excludePatterns,
    includeExtensions = DEFAULT_OPTIONS.includeExtensions,
  } = options;

  const results = [];

  // ディレクトリが存在しない場合は空配列を返す
  if (!fs.existsSync(targetDir)) {
    return results;
  }

  // 再帰的にスキャンする内部関数
  function scan(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (error) {
      // アクセス権限エラー等でスキャンできない場合はスキップ
      return;
    }

    for (const entry of entries) {
      // パスをUnixスタイル（forward slash）に正規化してクロスプラットフォーム互換性を確保
      const fullPath = path.join(currentDir, entry.name).replace(/\\/g, '/');
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

      // 除外パターンチェック
      const shouldExclude = excludePatterns.some(pattern => {
        // パスの一部に除外パターンが含まれているかチェック
        return relativePath.includes(pattern) || entry.name === pattern;
      });

      if (shouldExclude) {
        continue;
      }

      if (entry.isDirectory()) {
        // ディレクトリの場合は再帰的にスキャン
        scan(fullPath);
      } else if (entry.isFile()) {
        // ファイルの場合は拡張子チェック
        const ext = path.extname(entry.name);
        if (includeExtensions.includes(ext)) {
          // パスをUnixスタイル（forward slash）に正規化してクロスプラットフォーム互換性を確保
          const normalizedPath = fullPath.replace(/\\/g, '/');
          results.push(normalizedPath);
        }
      }
    }
  }

  scan(targetDir);

  return results;
}
