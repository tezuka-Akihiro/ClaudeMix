import { describe, it, expect } from 'vitest';
import { checkImplementationFiles, type FileExistsResult } from '~/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server';

describe('checkImplementationFiles - Side Effects Layer', () => {
  describe('正常系テスト', () => {
    it('ファイルが存在する場合、exists: true を返す', () => {
      // Arrange
      // 実際に存在するファイルを使用
      const filePaths = ['package.json'];

      // Act
      const result = checkImplementationFiles(filePaths);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        path: 'package.json',
        exists: true,
      });
    });

    it('ファイルが存在しない場合、exists: false を返す', () => {
      // Arrange
      const filePaths = ['app/THIS_FILE_DOES_NOT_EXIST_FOR_TESTING_12345.ts'];

      // Act
      const result = checkImplementationFiles(filePaths);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        path: 'app/THIS_FILE_DOES_NOT_EXIST_FOR_TESTING_12345.ts',
        exists: false,
      });
    });

    it('複数ファイルを並列チェックできる', () => {
      // Arrange
      const filePaths = [
        'package.json', // 存在する
        'app/THIS_DOES_NOT_EXIST_12345.ts', // 存在しない
        'tsconfig.json', // 存在する
      ];

      // Act
      const result = checkImplementationFiles(filePaths);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ path: 'package.json', exists: true });
      expect(result[1]).toEqual({ path: 'app/THIS_DOES_NOT_EXIST_12345.ts', exists: false });
      expect(result[2]).toEqual({ path: 'tsconfig.json', exists: true });
    });
  });

  describe('異常系テスト', () => {
    it('空配列を渡した場合、空配列を返す', () => {
      // Arrange
      const filePaths: string[] = [];

      // Act
      const result = checkImplementationFiles(filePaths);

      // Assert
      expect(result).toEqual([]);
    });
  });
});