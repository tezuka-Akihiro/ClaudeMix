// readFileListMd.server.test.ts - ユニットテスト
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { readFileListMd } from './readFileListMd.server';

// fsモジュールをモック
vi.mock('fs');

describe('readFileListMd.server - Data-IO Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readFileListMd function', () => {
    it('should read file-list.md and return its content', () => {
      // Arrange
      const mockContent = `# file-list.md - test Section

## 1. E2Eテスト（Phase 1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| test.spec.ts | tests/e2e/section/service/test.spec.ts | テストファイル |
`;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      // Act
      const result = readFileListMd('flow-auditor', 'implementation-flow');

      // Assert
      expect(result).toBe(mockContent);
      const callArgs = vi.mocked(fs.readFileSync).mock.calls[0];
      expect(callArgs[0]).toContain('develop');
      expect(callArgs[0]).toContain('flow-auditor');
      expect(callArgs[0]).toContain('implementation-flow');
      expect(callArgs[0]).toContain('file-list.md');
      expect(callArgs[1]).toBe('utf-8');
    });

    it('should construct correct file path from service and section', () => {
      // Arrange
      const mockContent = '# test content';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      // Act
      readFileListMd('test-service', 'test-section');

      // Assert
      const callArgs = vi.mocked(fs.readFileSync).mock.calls[0];
      expect(callArgs[0]).toContain('develop');
      expect(callArgs[0]).toContain('test-service');
      expect(callArgs[0]).toContain('test-section');
      expect(callArgs[0]).toContain('file-list.md');
      expect(callArgs[1]).toBe('utf-8');
    });

    it('should throw error if file does not exist', () => {
      // Arrange
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => readFileListMd('flow-auditor', 'non-existent')).toThrow();
    });

    it('should handle empty file-list.md', () => {
      // Arrange
      vi.mocked(fs.readFileSync).mockReturnValue('');

      // Act
      const result = readFileListMd('flow-auditor', 'implementation-flow');

      // Assert
      expect(result).toBe('');
    });

    it('should preserve markdown formatting', () => {
      // Arrange
      const mockContent = `# file-list.md

## Section 1
| Col1 | Col2 |
|:---|:---|
| A | B |

## Section 2
- Item 1
- Item 2
`;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      // Act
      const result = readFileListMd('flow-auditor', 'implementation-flow');

      // Assert
      expect(result).toBe(mockContent);
      expect(result).toContain('## Section 1');
      expect(result).toContain('- Item 1');
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error message on file read failure', () => {
      // Arrange
      const error = new Error('Permission denied');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => readFileListMd('flow-auditor', 'implementation-flow')).toThrow();
    });
  });
});
