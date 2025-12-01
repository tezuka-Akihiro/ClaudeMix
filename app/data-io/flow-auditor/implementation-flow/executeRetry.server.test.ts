import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeRetry, type FileArchiveResult } from '~/data-io/flow-auditor/implementation-flow/executeRetry.server';
import { writeFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('executeRetry - Side Effects Layer', () => {
  const TEST_DIR = '_test_temp';
  const TEST_FILES = {
    file1: join(TEST_DIR, 'test-file-1.txt'),
    file2: join(TEST_DIR, 'test-file-2.txt'),
    file3: join(TEST_DIR, 'test-file-3.txt'),
  };

  beforeEach(() => {
    // テスト用ディレクトリとファイルの作成
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }

    // テスト用ファイルを作成
    writeFileSync(TEST_FILES.file1, 'test content 1');
    writeFileSync(TEST_FILES.file2, 'test content 2');
    writeFileSync(TEST_FILES.file3, 'test content 3');
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    // _test_tempディレクトリを削除
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // _archiveディレクトリを削除
    if (existsSync('_archive')) {
      rmSync('_archive', { recursive: true, force: true });
    }
  });

  describe('正常系テスト', () => {
    it('ファイルを _archive/{timestamp}/ に移動できる', () => {
      // Arrange
      const filePaths = [TEST_FILES.file1];

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].path).toBe(TEST_FILES.file1);

      // ファイルが元の場所から消えていることを確認
      expect(existsSync(TEST_FILES.file1)).toBe(false);

      // _archiveディレクトリが作成されていることを確認
      expect(existsSync('_archive')).toBe(true);
    });

    it('アーカイブディレクトリが存在しない場合、自動作成する', () => {
      // Arrange
      const filePaths = [TEST_FILES.file1];

      // _archiveが存在しないことを確認
      expect(existsSync('_archive')).toBe(false);

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results[0].success).toBe(true);
      // _archiveディレクトリが作成されていることを確認
      expect(existsSync('_archive')).toBe(true);
    });

    it('複数ファイルを一括移動できる', () => {
      // Arrange
      const filePaths = [TEST_FILES.file1, TEST_FILES.file2, TEST_FILES.file3];

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);

      // すべてのファイルが元の場所から消えていることを確認
      expect(existsSync(TEST_FILES.file1)).toBe(false);
      expect(existsSync(TEST_FILES.file2)).toBe(false);
      expect(existsSync(TEST_FILES.file3)).toBe(false);
    });
  });

  describe('異常系テスト', () => {
    it('ファイルが存在しない場合、失敗を返す', () => {
      // Arrange
      const filePaths = ['_test_temp/non-existent-file.txt'];

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].path).toBe('_test_temp/non-existent-file.txt');
      expect(results[0].error).toBe('File does not exist');
    });

    it('空配列を渡した場合、空配列を返す', () => {
      // Arrange
      const filePaths: string[] = [];

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results).toEqual([]);
    });

    it('一部のファイルが存在しない場合、存在するファイルのみ移動する', () => {
      // Arrange
      const filePaths = [
        TEST_FILES.file1,
        '_test_temp/non-existent.txt',
        TEST_FILES.file2,
      ];

      // Act
      const results = executeRetry(filePaths);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true); // file1は成功
      expect(results[1].success).toBe(false); // 存在しないファイルは失敗
      expect(results[1].error).toBe('File does not exist');
      expect(results[2].success).toBe(true); // file2は成功

      // 存在したファイルのみ移動されていることを確認
      expect(existsSync(TEST_FILES.file1)).toBe(false);
      expect(existsSync(TEST_FILES.file2)).toBe(false);
    });
  });

});