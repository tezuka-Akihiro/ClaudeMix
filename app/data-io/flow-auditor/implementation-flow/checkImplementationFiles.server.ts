// checkImplementationFiles.server - 🔌 副作用層
// 指定されたファイルパスリストの存在確認（fs.existsSync）
// データベース、API、ファイルシステムなどの外部リソースとの相互作用

import { existsSync } from 'fs';

/**
 * ファイル存在確認結果
 */
export interface FileExistsResult {
  path: string;
  exists: boolean;
}

/**
 * ファイル存在確認を並列実行
 *
 * @param filePaths - 確認対象のファイルパス配列
 * @returns ファイル存在確認結果の配列
 */
export function checkImplementationFiles(filePaths: string[]): FileExistsResult[] {
  try {
    // 各ファイルパスの存在確認
    const results = filePaths.map((path) => ({
      path,
      exists: existsSync(path),
    }));

    return results;
  } catch (error) {
    console.error(`checkImplementationFiles failed:`, error);
    throw new Error(`checkImplementationFiles operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}