// executeRetry.server - 🔌 副作用層
// 指定されたファイルパス配列を _archive/{timestamp}/ に移動（Surgical Retry用）
// データベース、API、ファイルシステムなどの外部リソースとの相互作用

import { existsSync, mkdirSync, renameSync } from 'fs';
import { join } from 'path';

/**
 * ファイル移動結果
 */
export interface FileArchiveResult {
  path: string;
  success: boolean;
  error?: string;
}

/**
 * Surgical Retry: 指定されたファイルをアーカイブに移動
 *
 * @param filePaths - 移動対象のファイルパス配列
 * @returns ファイル移動結果の配列
 */
export function executeRetry(filePaths: string[]): FileArchiveResult[] {
  try {
    // タイムスタンプ付きアーカイブディレクトリの作成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const archiveDir = join('_archive', timestamp);

    // アーカイブディレクトリが存在しない場合、作成
    if (!existsSync(archiveDir)) {
      mkdirSync(archiveDir, { recursive: true });
    }

    // 各ファイルを移動
    const results: FileArchiveResult[] = filePaths.map((filePath) => {
      try {
        // ファイルが存在しない場合、失敗を記録
        if (!existsSync(filePath)) {
          return {
            path: filePath,
            success: false,
            error: 'File does not exist',
          };
        }

        // アーカイブ先のパスを構築（パス区切り文字を_に置換）
        const fileName = filePath.replace(/[\/\\]/g, '_');
        const archivePath = join(archiveDir, fileName);

        // ファイルを移動
        renameSync(filePath, archivePath);

        return {
          path: filePath,
          success: true,
        };
      } catch (error) {
        return {
          path: filePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    return results;
  } catch (error) {
    console.error(`executeRetry failed:`, error);
    throw new Error(`executeRetry operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}