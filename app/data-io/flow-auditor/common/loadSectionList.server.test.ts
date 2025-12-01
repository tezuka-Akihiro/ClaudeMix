// loadSectionList.server.test.ts - 🔌 副作用層: ユニットテスト
// project.tomlからセクションリスト読み込み処理のテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadSectionList } from './loadSectionList.server';
import fs from 'fs';
import path from 'path';
import * as toml from '@iarna/toml';

// Mock external dependencies
vi.mock('fs');
vi.mock('path');
vi.mock('@iarna/toml');

// buildSectionListは純粋ロジック層なので、実際の実装を使用
vi.mock('~/lib/flow-auditor/common/sectionListBuilder', async () => {
  const actual = await vi.importActual<typeof import('~/lib/flow-auditor/common/sectionListBuilder')>('~/lib/flow-auditor/common/sectionListBuilder');
  return actual;
});

// --- Test Constants ---
const MOCK_ROOT = '/mock/project/root';

const MOCK_TOML_CONTENT = `
[services.flow-auditor]
name = "Flow Auditor"

[services.flow-auditor.sections.common]
name = "Common Components"

[services.flow-auditor.sections.design-flow]
name = "設計フロービュー"

[services.flow-auditor.sections.implementation-flow]
name = "実装フロービュー"

[services.another-service]
name = "Another Service"

[services.another-service.sections.dashboard]
name = "Dashboard"
`;

const MOCK_PARSED_TOML = {
  services: {
    'flow-auditor': {
      sections: {
        common: {
          name: 'Common Components',
        },
        'design-flow': {
          name: '設計フロービュー',
        },
        'implementation-flow': {
          name: '実装フロービュー',
        },
      },
    },
    'another-service': {
      sections: {
        dashboard: {
          name: 'Dashboard',
        },
      },
    },
  },
};

const MOCK_NO_SECTIONS_TOML = {
  services: {
    'no-sections-service': {},
  },
};

const MOCK_EMPTY_SECTIONS_TOML = {
  services: {
    'empty-sections-service': {
      sections: {},
    },
  },
};

// --- Helper Functions ---
const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);
const mockToml = vi.mocked(toml);

describe('loadSectionList - Side Effects Layer', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn(() => MOCK_ROOT);
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('正常系', () => {
    it('有効なproject.tomlから指定サービスのセクションリストを取得する', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { key: 'common', name: 'Common Components' },
        { key: 'design-flow', name: '設計フロービュー' },
        { key: 'implementation-flow', name: '実装フロービュー' },
      ]);
      expect(mockPath.join).toHaveBeenCalledWith(MOCK_ROOT, 'scripts', 'project.toml');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        `${MOCK_ROOT}/scripts/project.toml`,
        'utf-8'
      );
    });

    it('別のサービス名でも正しくセクションリストを取得する', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadSectionList('another-service');

      // Assert
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ key: 'dashboard', name: 'Dashboard' }]);
    });

    it('単一のセクションのみ存在する場合も正しく処理する', async () => {
      // Arrange
      const singleSectionToml = {
        services: {
          'test-service': {
            sections: {
              only: {
                name: 'Only Section',
              },
            },
          },
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(singleSectionToml as any);

      // Act
      const result = await loadSectionList('test-service');

      // Assert
      expect(result).toEqual([{ key: 'only', name: 'Only Section' }]);
    });
  });

  describe('異常系: 空配列を返す', () => {
    it('存在しないサービス名を指定した場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadSectionList('non-existent-service');

      // Assert
      expect(result).toEqual([]);
    });

    it('空文字列のサービス名の場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadSectionList('');

      // Assert
      expect(result).toEqual([]);
    });

    it('sectionsが存在しないサービスの場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(MOCK_NO_SECTIONS_TOML as any);

      // Act
      const result = await loadSectionList('no-sections-service');

      // Assert
      expect(result).toEqual([]);
    });

    it('sectionsが空オブジェクトの場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(MOCK_EMPTY_SECTIONS_TOML as any);

      // Act
      const result = await loadSectionList('empty-sections-service');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('異常系: ファイル読み込みエラー', () => {
    it('ファイルが存在しない場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toEqual([]);
    });

    it('ファイル読み込み権限がない場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toEqual([]);
    });

    it('一般的なファイルシステムエラーの場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Unexpected file system error');
      });

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('異常系: TOMLパースエラー', () => {
    it('無効なTOML形式の場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('invalid toml content [[[');
      mockToml.parse.mockImplementation(() => {
        throw new Error('TOML parse error');
      });

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toEqual([]);
    });

    it('TOMLパースで予期せぬエラーが発生した場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('some content');
      mockToml.parse.mockImplementation(() => {
        throw new TypeError('Unexpected type error');
      });

      // Act
      const result = await loadSectionList('flow-auditor');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('エッジケース', () => {
    it('セクション名に特殊文字が含まれていても正しく取得する', async () => {
      // Arrange
      const specialCharToml = {
        services: {
          'test-service': {
            sections: {
              'section-with-dash': {
                name: 'セクション名 (括弧付き)',
              },
              'section_with_underscore': {
                name: 'Section / Slash',
              },
            },
          },
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(specialCharToml as any);

      // Act
      const result = await loadSectionList('test-service');

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        key: 'section-with-dash',
        name: 'セクション名 (括弧付き)',
      });
      expect(result).toContainEqual({
        key: 'section_with_underscore',
        name: 'Section / Slash',
      });
    });

    it('大量のセクション（50個）でも正しく処理する', async () => {
      // Arrange
      const manySections = Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`section${i}`, { name: `Section ${i}` }])
      );
      const manySectionsToml = {
        services: {
          'test-service': {
            sections: manySections,
          },
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(manySectionsToml as any);

      // Act
      const result = await loadSectionList('test-service');

      // Assert
      expect(result).toHaveLength(50);
      expect(result[0]).toEqual({ key: 'section0', name: 'Section 0' });
      expect(result[49]).toEqual({ key: 'section49', name: 'Section 49' });
    });
  });

  describe('エラーログ出力の確認', () => {
    it('エラー発生時にconsole.errorが呼ばれる', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      await loadSectionList('flow-auditor');

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load section list:',
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
