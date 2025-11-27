// executeRetry.server.ts - 🔌 副作用層
// リトライ実行（ファイルアーカイブ）の実装

import * as fs from 'fs/promises';
import * as path from 'path';
import { calculateRetryTargets, calculateRetryTargetsFromMultiple } from '~/lib/flow-auditor/common/retryTargetCalculator';
import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

export interface ExecuteRetryInput {
  checkpointId?: string; // 単一チェックポイントID（Design Flow用）
  checkpointIds?: string[]; // 複数チェックポイントID（Implementation Flow用）
  allCheckpoints: Checkpoint[];
}

export interface ExecuteRetryResult {
  success: boolean;
  archivedFiles: string[];
  errorMessage?: string;
}

/**
 * リトライ実行: 指定されたチェックポイント以降のファイルをアーカイブする
 *
 * @param input - checkpointId(s)と全チェックポイントの配列
 * @returns 成功/失敗、アーカイブされたファイルリスト、エラーメッセージ
 */
export async function executeRetry(input: ExecuteRetryInput): Promise<ExecuteRetryResult> {
  try {
    // 1. retryTargetCalculatorでアーカイブ対象ファイルを計算
    let targetFiles: string[] = [];

    if (input.checkpointIds && input.checkpointIds.length > 0) {
      // Implementation Flow: 複数選択
      targetFiles = calculateRetryTargetsFromMultiple(input.checkpointIds, input.allCheckpoints);
    } else if (input.checkpointId) {
      // Design Flow: 単一選択
      targetFiles = calculateRetryTargets(input.checkpointId, input.allCheckpoints);
    } else {
      return {
        success: false,
        archivedFiles: [],
        errorMessage: 'Either checkpointId or checkpointIds must be provided',
      };
    }

    // 2. アーカイブディレクトリを作成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const archiveDir = path.join(process.cwd(), '_archive', timestamp);
    await fs.mkdir(archiveDir, { recursive: true });

    // 3. 各ファイルをアーカイブディレクトリに移動
    const archivedFiles: string[] = [];

    for (const filePath of targetFiles) {
      const absolutePath = path.join(process.cwd(), filePath);

      try {
        // ファイルの存在確認
        await fs.access(absolutePath);

        // アーカイブ先のパスを構築
        const relativePath = path.relative(process.cwd(), absolutePath);
        const archivePath = path.join(archiveDir, relativePath);
        const archivePathDir = path.dirname(archivePath);

        // アーカイブ先のディレクトリを作成
        await fs.mkdir(archivePathDir, { recursive: true });

        // ファイルを移動
        await fs.rename(absolutePath, archivePath);

        archivedFiles.push(filePath);
      } catch (error) {
        // ファイルが存在しない場合はスキップ
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          continue;
        }
        // その他のエラーは再スロー
        throw error;
      }
    }

    return {
      success: true,
      archivedFiles,
    };
  } catch (error) {
    console.error('executeRetry failed:', error);
    return {
      success: false,
      archivedFiles: [],
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}