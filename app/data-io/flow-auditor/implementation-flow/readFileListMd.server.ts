// readFileListMd.server - 🔌 副作用層
// file-list.mdを読み込んでマークダウンテキストを返す
// ファイルシステムアクセス（fs.readFileSync）を含む

import * as fs from 'fs';
import * as path from 'path';

/**
 * file-list.mdを読み込んでマークダウンテキストを返す
 *
 * @param service サービス名（例: "flow-auditor"）
 * @param section セクション名（例: "implementation-flow"）
 * @returns file-list.mdの内容（マークダウンテキスト）
 * @throws ファイルが存在しない場合やアクセス権限がない場合にエラー
 */
export function readFileListMd(service: string, section: string): string {
  // file-list.mdのパスを構築
  const fileListPath = path.join(
    process.cwd(),
    'develop',
    service,
    section,
    'file-list.md'
  );

  // ファイルを読み込んで返す
  try {
    return fs.readFileSync(fileListPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `file-list.md not found: ${fileListPath}\n` +
        `Please ensure the file exists at develop/${service}/${section}/file-list.md`
      );
    }
    throw error;
  }
}
