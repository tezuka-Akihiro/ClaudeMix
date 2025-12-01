// executeRetry.server.test.ts - 🔌 副作用層: ユニットテスト
// リトライ実行（ファイルアーカイブ）のテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeRetry, type ExecuteRetryInput, type ExecuteRetryResult } from '~/data-io/flow-auditor/common/executeRetry.server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { calculateRetryTargets } from '~/lib/flow-auditor/common/retryTargetCalculator';

// Mock fs/promises
vi.mock('fs/promises');
vi.mock('~/lib/flow-auditor/common/retryTargetCalculator');

describe('executeRetry - Side Effects Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系のテスト', () => {
    it('retryTargetCalculatorから渡されたファイルリストを正しくアーカイブする', async () => {
      // Arrange
      const input: ExecuteRetryInput = {
        checkpointId: 'test-checkpoint',
        allCheckpoints: [],
      };

      // retryTargetCalculatorのモック
      vi.mocked(calculateRetryTargets).mockReturnValue([
        'file1.md',
        'file2.md',
      ]);

      // fs.existsSyncのモック
      vi.mocked(fs.access).mockResolvedValue(undefined);
      // fs.mkdirのモック
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      // fs.renameのモック
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      // Act
      const result = await executeRetry(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.archivedFiles).toHaveLength(2);
      expect(vi.mocked(fs.mkdir)).toHaveBeenCalled(); // アーカイブディレクトリ作成
      expect(vi.mocked(fs.rename)).toHaveBeenCalledTimes(2); // 2ファイル移動
    });

    it('存在しないファイルはエラーなくスキップする', async () => {
      // Arrange
      const input: ExecuteRetryInput = {
        checkpointId: 'test-checkpoint',
        allCheckpoints: [],
      };

      vi.mocked(calculateRetryTargets).mockReturnValue(['non-existent.md']);

      // ファイルが存在しない場合のエラーをシミュレート（code: 'ENOENT' を持つエラー）
      const enoentError = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      vi.mocked(fs.access).mockRejectedValue(enoentError);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      // Act
      const result = await executeRetry(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.archivedFiles).toHaveLength(0); // スキップされたのでアーカイブは0件
      expect(vi.mocked(fs.rename)).not.toHaveBeenCalled(); // ファイル移動は実行されない
    });
  });

  describe('異常系・エッジケースのテスト', () => {
    it('ファイルシステムの操作でエラーが発生した場合、success: falseを返す', async () => {
      // Arrange
      const input: ExecuteRetryInput = {
        checkpointId: 'test-checkpoint',
        allCheckpoints: [],
      };

      vi.mocked(calculateRetryTargets).mockReturnValue(['file1.md']);

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      // ファイル移動時にエラー
      vi.mocked(fs.rename).mockRejectedValue(new Error('Permission denied'));

      // Act
      const result = await executeRetry(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Permission denied');
    });

    it('アーカイブディレクトリの作成に失敗した場合、エラーを返す', async () => {
      // Arrange
      const input: ExecuteRetryInput = {
        checkpointId: 'test-checkpoint',
        allCheckpoints: [],
      };

      vi.mocked(calculateRetryTargets).mockReturnValue(['file1.md']);

      vi.mocked(fs.access).mockResolvedValue(undefined);
      // ディレクトリ作成時にエラー
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('No space left on device'));

      // Act
      const result = await executeRetry(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it('空のファイルリストが渡された場合、何もせずに成功を返す', async () => {
      // Arrange
      const input: ExecuteRetryInput = {
        checkpointId: 'test-checkpoint',
        allCheckpoints: [],
      };

      vi.mocked(calculateRetryTargets).mockReturnValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      // Act
      const result = await executeRetry(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.archivedFiles).toHaveLength(0);
      expect(vi.mocked(fs.mkdir)).toHaveBeenCalled(); // アーカイブディレクトリは作成される
      expect(vi.mocked(fs.rename)).not.toHaveBeenCalled(); // ファイル移動はされない
    });
  });
});