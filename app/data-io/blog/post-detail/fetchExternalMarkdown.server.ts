// fetchExternalMarkdown.server.ts - Data-IO Layer
// 外部マークダウンファイルの読み込み

import { promises as fs } from 'fs';
import path from 'path';

/**
 * 外部マークダウンファイルを読み込む
 * @param filePath - プロジェクトルートからの相対パス（例: "/README.md"）
 * @returns マークダウンファイルの内容
 * @throws エラー（ファイル不存在、不正なパス、不正な拡張子）
 */
export async function fetchExternalMarkdown(filePath: string): Promise<string> {
  // パスバリデーション
  validatePath(filePath);

  // プロジェクトルートの絶対パスを取得
  const projectRoot = process.cwd();

  // 相対パスを絶対パスに変換（先頭の"/"を除去）
  const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const absolutePath = path.join(projectRoot, relativePath);

  // パスがプロジェクトルート配下にあることを確認（正規化後）
  const normalizedPath = path.normalize(absolutePath);
  if (!normalizedPath.startsWith(projectRoot)) {
    throw new Error(`Invalid path: Path must be within project root`);
  }

  // ファイルを読み込む
  try {
    const content = await fs.readFile(normalizedPath, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
    throw new Error('Failed to read file: Unknown error');
  }
}

/**
 * パスのバリデーション
 * @param filePath - 検証対象のパス
 * @throws エラー（不正なパターンが検出された場合）
 */
function validatePath(filePath: string): void {
  // 拡張子チェック: .mdのみ許可
  if (!filePath.endsWith('.md')) {
    throw new Error('Invalid file extension: Only .md files are allowed');
  }

  // 禁止パターンのチェック
  const forbiddenPatterns = [
    '../',   // ディレクトリトラバーサル（Unix）
    '..\\',  // ディレクトリトラバーサル（Windows）
    '/etc/', // Unixシステムパス
    'C:\\',  // Windowsシステムパス
    '\\\\',  // UNCパス
  ];

  for (const pattern of forbiddenPatterns) {
    if (filePath.includes(pattern)) {
      throw new Error(`Invalid path: Path contains forbidden pattern "${pattern}"`);
    }
  }
}
