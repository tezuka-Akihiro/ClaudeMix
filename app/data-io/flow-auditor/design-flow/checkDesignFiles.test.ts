import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDesignFiles, validateCheckDesignFilesOptions, type CheckDesignFilesOptions } from '~/data-io/flow-auditor/design-flow/checkDesignFiles';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
vi.mock('fs');
vi.mock('path');

// --- Test Constants ---
const MOCK_ROOT = '/mock/project/root';
const MOCK_OPTIONS: CheckDesignFilesOptions = {
  service: 'flow-auditor',
  section: 'design-flow',
};

const COMMON_FILES = [
  'develop/flow-auditor/REQUIREMENTS_ANALYSIS_PIPE.md',
  'develop/flow-auditor/GUIDING_PRINCIPLES.md',
];

const SECTION_FILES = [
  'develop/flow-auditor/design-flow/func-spec.md',
  'develop/flow-auditor/design-flow/uiux-spec.md',
  'develop/flow-auditor/design-flow/spec.yaml',
  'develop/flow-auditor/design-flow/file-list.md',
  'develop/flow-auditor/design-flow/TDD_WORK_FLOW.md',
];

const ALL_FILES = [...COMMON_FILES, ...SECTION_FILES];

// --- Helper Functions ---
const mockExistsSync = vi.mocked(fs.existsSync);

/**
 * Sets up the mock for fs.existsSync.
 * By default, all files are considered to exist.
 * @param missingFiles - An array of file paths that should be considered non-existent.
 */
const setupMockFs = (missingFiles: string[] = []) => {
  // ALL_FILESから完全なパスのセットを作成
  const allFilePaths = new Set(ALL_FILES.map(p => `${MOCK_ROOT}/${p}`));
  const missingSet = new Set(missingFiles.map(p => `${MOCK_ROOT}/${p}`));

  mockExistsSync.mockImplementation((filepath) => {
    const pathStr = String(filepath);
    // 既知のファイルのみをチェック、それ以外はfalse
    if (!allFilePaths.has(pathStr)) {
      return false;
    }
    return !missingSet.has(pathStr);
  });
};

describe('checkDesignFiles - Side Effects Layer', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn(() => MOCK_ROOT);

    // Setup path.join mock
    vi.mocked(path.join).mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('checkDesignFiles function', () => {
    it('should successfully execute with valid options and all files exist', async () => {
      // Arrange
      setupMockFs([]); // All files exist

      // Act
      const result = await checkDesignFiles(MOCK_OPTIONS);

      // Assert
      expect(result).toBeDefined();
      expect(result.allExist).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.commonFiles).toHaveLength(COMMON_FILES.length);
      expect(result.sectionFiles).toHaveLength(SECTION_FILES.length);
      expect(result.commonFiles.every(f => f.exists)).toBe(true);
      expect(result.sectionFiles.every(f => f.exists)).toBe(true);
    });

    it('should detect missing common files', async () => {
      // Arrange
      const missing = [COMMON_FILES[0], COMMON_FILES[1]];
      setupMockFs(missing);

      // Act
      const result = await checkDesignFiles(MOCK_OPTIONS);

      // Assert
      expect(result.allExist).toBe(false);
      expect(result.missingFiles).toEqual(missing);
    });

    it('should detect missing section files', async () => {
      // Arrange
      const missing = [SECTION_FILES[0], SECTION_FILES[2]];
      setupMockFs(missing);

      // Act
      const result = await checkDesignFiles(MOCK_OPTIONS);

      // Assert
      expect(result.allExist).toBe(false);
      expect(result.missingFiles).toEqual(missing);
    });

    it('should handle file system errors gracefully', async () => {
      // Arrange
      mockExistsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      // Act & Assert
      await expect(checkDesignFiles(MOCK_OPTIONS)).rejects.toThrow('checkDesignFiles operation failed');
    });

    it('should return the correct structure and paths for all files', async () => {
      // Arrange
      setupMockFs([]); // All files exist

      // Act
      const result = await checkDesignFiles(MOCK_OPTIONS);

      // Assert
      const commonPaths = result.commonFiles.map(f => f.path);
      const sectionPaths = result.sectionFiles.map(f => f.path);

      expect(commonPaths).toEqual(expect.arrayContaining(COMMON_FILES));
      expect(sectionPaths).toEqual(expect.arrayContaining(SECTION_FILES));
      expect(result.commonFiles).toHaveLength(COMMON_FILES.length);
      expect(result.sectionFiles).toHaveLength(SECTION_FILES.length);
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      // Arrange
      mockExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Act & Assert
      await expect(checkDesignFiles(MOCK_OPTIONS)).rejects.toThrow('checkDesignFiles operation failed');
      await expect(checkDesignFiles(MOCK_OPTIONS)).rejects.toThrow('Permission denied');
    });
  });

  describe('validateCheckDesignFilesOptions function', () => {
    it('should validate correct options structure', () => {
      // Arrange
      // Act
      const isValid = validateCheckDesignFilesOptions(MOCK_OPTIONS);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid options structure', () => {
      // Arrange
      const invalidOptions = [
        null,
        undefined,
        {},
        { service: 'test' }, // missing section
        { section: 'test' }, // missing service
        { service: '', section: 'test' }, // empty service
        { service: 'test', section: '' }, // empty section
        { service: 123, section: 'test' }, // invalid type
        { service: 'test', section: 123 }, // invalid type
      ];

      invalidOptions.forEach((invalidOption) => {
        // Act
        const isValid = validateCheckDesignFilesOptions(invalidOption);

        // Assert
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should complete within acceptable time limits', async () => {
      // Arrange
      setupMockFs([]);

      // Act
      const startTime = Date.now();
      await checkDesignFiles(MOCK_OPTIONS);
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(500); // 500ms以内
    });
  });
});