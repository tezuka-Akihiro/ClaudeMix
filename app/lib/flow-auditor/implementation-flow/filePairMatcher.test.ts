import { describe, it, expect } from 'vitest';
import { findFilePair } from '~/lib/flow-auditor/implementation-flow/filePairMatcher';
import type { FileDefinition } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';

describe('filePairMatcher - Pure Logic Layer', () => {
  describe('findFilePair function', () => {
    // テストデータの準備
    const testFile: FileDefinition = {
      id: 'test-1',
      name: 'example.test.ts',
      path: 'app/lib/example.test.ts',
      description: 'Test file',
      layer: 'lib',
      pairId: 'impl-1',
    };

    const implFile: FileDefinition = {
      id: 'impl-1',
      name: 'example.ts',
      path: 'app/lib/example.ts',
      description: 'Implementation file',
      layer: 'lib',
      pairId: 'test-1',
    };

    const testFileWithoutPair: FileDefinition = {
      id: 'test-2',
      name: 'standalone.test.ts',
      path: 'app/lib/standalone.test.ts',
      description: 'Test file without pair',
      layer: 'lib',
    };

    const allFiles: FileDefinition[] = [testFile, implFile, testFileWithoutPair];

    it('should return implementation file when test file is selected', () => {
      // Arrange
      const selectedFile = testFile;

      // Act
      const result = findFilePair(selectedFile, allFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('impl-1');
      expect(result?.name).toBe('example.ts');
      expect(result?.path).toBe('app/lib/example.ts');
    });

    it('should return test file when implementation file is selected', () => {
      // Arrange
      const selectedFile = implFile;

      // Act
      const result = findFilePair(selectedFile, allFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-1');
      expect(result?.name).toBe('example.test.ts');
      expect(result?.path).toBe('app/lib/example.test.ts');
    });

    it('should handle .test.tsx files correctly', () => {
      // Arrange
      const tsxTestFile: FileDefinition = {
        id: 'test-tsx',
        name: 'Component.test.tsx',
        path: 'app/components/Component.test.tsx',
        description: 'TSX test file',
        layer: 'ui',
        pairId: 'impl-tsx',
      };

      const tsxImplFile: FileDefinition = {
        id: 'impl-tsx',
        name: 'Component.tsx',
        path: 'app/components/Component.tsx',
        description: 'TSX implementation file',
        layer: 'ui',
        pairId: 'test-tsx',
      };

      const files = [tsxTestFile, tsxImplFile];

      // Act
      const result = findFilePair(tsxTestFile, files);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('impl-tsx');
      expect(result?.name).toBe('Component.tsx');
    });

    it('should return undefined when pair does not exist', () => {
      // Arrange
      const selectedFile = testFileWithoutPair;

      // Act
      const result = findFilePair(selectedFile, allFiles);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when file has no pairId', () => {
      // Arrange
      const fileWithoutPairId: FileDefinition = {
        id: 'no-pair',
        name: 'nopair.ts',
        path: 'app/lib/nopair.ts',
        description: 'File without pairId',
        layer: 'lib',
      };

      // Act
      const result = findFilePair(fileWithoutPairId, allFiles);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when empty file array is provided', () => {
      // Arrange
      const selectedFile = testFile;
      const emptyFiles: FileDefinition[] = [];

      // Act
      const result = findFilePair(selectedFile, emptyFiles);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should be deterministic (same input, same output)', () => {
      // Arrange
      const selectedFile = testFile;

      // Act
      const result1 = findFilePair(selectedFile, allFiles);
      const result2 = findFilePair(selectedFile, allFiles);

      // Assert
      expect(result1).toEqual(result2);
    });

    it('should maintain data immutability', () => {
      // Arrange
      const selectedFile = { ...testFile };
      const filesCopy = JSON.parse(JSON.stringify(allFiles));

      // Act
      findFilePair(selectedFile, allFiles);

      // Assert: 入力データが変更されていないことを確認
      expect(allFiles).toEqual(filesCopy);
    });

    it('should handle files with same layer correctly', () => {
      // Arrange
      const libTest: FileDefinition = {
        id: 'lib-test',
        name: 'lib.test.ts',
        path: 'app/lib/lib.test.ts',
        description: 'Lib test',
        layer: 'lib',
        pairId: 'lib-impl',
      };

      const libImpl: FileDefinition = {
        id: 'lib-impl',
        name: 'lib.ts',
        path: 'app/lib/lib.ts',
        description: 'Lib impl',
        layer: 'lib',
        pairId: 'lib-test',
      };

      const dataIoTest: FileDefinition = {
        id: 'dataio-test',
        name: 'dataio.test.ts',
        path: 'app/data-io/dataio.test.ts',
        description: 'Data-IO test',
        layer: 'data-io',
        pairId: 'dataio-impl',
      };

      const files = [libTest, libImpl, dataIoTest];

      // Act
      const result = findFilePair(libTest, files);

      // Assert: 同じ層のペアが正しく見つかる
      expect(result).toBeDefined();
      expect(result?.id).toBe('lib-impl');
      expect(result?.layer).toBe('lib');
    });
  });

  describe('Performance', () => {
    it('should execute within reasonable time even with many files', () => {
      // Arrange: 100ファイルのテストデータを生成
      const largeFileSet: FileDefinition[] = [];
      for (let i = 0; i < 100; i++) {
        largeFileSet.push({
          id: `test-${i}`,
          name: `file${i}.test.ts`,
          path: `app/lib/file${i}.test.ts`,
          description: 'Test file',
          layer: 'lib',
          pairId: `impl-${i}`,
        });
        largeFileSet.push({
          id: `impl-${i}`,
          name: `file${i}.ts`,
          path: `app/lib/file${i}.ts`,
          description: 'Implementation file',
          layer: 'lib',
          pairId: `test-${i}`,
        });
      }

      const selectedFile = largeFileSet[0];

      // Act
      const startTime = performance.now();
      findFilePair(selectedFile, largeFileSet);
      const endTime = performance.now();

      // Assert: 実行時間が妥当な範囲内であることを確認
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10); // 10ms以内
    });
  });
});
