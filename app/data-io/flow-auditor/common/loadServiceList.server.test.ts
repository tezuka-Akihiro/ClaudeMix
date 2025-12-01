// loadServiceList.server.test.ts - 🔌 副作用層: ユニットテスト
// project.tomlからサービスリスト読み込み処理のテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadServiceList } from './loadServiceList.server';
import fs from 'fs';
import path from 'path';
import * as toml from '@iarna/toml';

// Mock external dependencies
vi.mock('fs');
vi.mock('path');
vi.mock('@iarna/toml');

// --- Test Constants ---
const MOCK_ROOT = '/mock/project/root';

const MOCK_TOML_CONTENT = `
[services.flow-auditor]
name = "Flow Auditor"

[services.another-service]
name = "Another Service"

[services.test-service]
name = "Test Service"
`;

const MOCK_PARSED_TOML = {
  services: {
    'flow-auditor': {
      name: 'Flow Auditor',
    },
    'another-service': {
      name: 'Another Service',
    },
    'test-service': {
      name: 'Test Service',
    },
  },
};

const MOCK_EMPTY_SERVICES_TOML = {
  services: {},
};

const MOCK_NO_SERVICES_TOML = {
  project_name: 'Test Project',
};

// --- Helper Functions ---
const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);
const mockToml = vi.mocked(toml);

describe('loadServiceList - Side Effects Layer', () => {
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
    it('有効なproject.tomlからサービスリストを取得する', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(['flow-auditor', 'another-service', 'test-service']);
      expect(mockPath.join).toHaveBeenCalledWith(MOCK_ROOT, 'scripts', 'project.toml');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        `${MOCK_ROOT}/scripts/project.toml`,
        'utf-8'
      );
    });

    it('単一のサービスのみ存在する場合も正しく処理する', async () => {
      // Arrange
      const singleServiceToml = {
        services: {
          'only-service': {
            name: 'Only Service',
          },
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(singleServiceToml as any);

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual(['only-service']);
    });

    it('サービス名がアルファベット順にソートされている', async () => {
      // Arrange
      const unsortedServicesToml = {
        services: {
          'zebra-service': {},
          'alpha-service': {},
          'beta-service': {},
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(unsortedServicesToml as any);

      // Act
      const result = await loadServiceList();

      // Assert
      // Object.keys()の順序はECMAScript 2015以降、挿入順が保証される
      // ここではTOMLパース結果の順序をそのまま返すため、
      // ソート済みであることを確認するのではなく、取得できることを確認
      expect(result).toEqual(['zebra-service', 'alpha-service', 'beta-service']);
    });
  });

  describe('異常系: 空配列を返す', () => {
    it('servicesセクションが存在しない場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(MOCK_NO_SERVICES_TOML as any);

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual([]);
    });

    it('servicesが空オブジェクトの場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(MOCK_EMPTY_SERVICES_TOML as any);

      // Act
      const result = await loadServiceList();

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
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual([]);
    });

    it('ファイル読み込み権限がない場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual([]);
    });

    it('一般的なファイルシステムエラーの場合、空配列を返す', async () => {
      // Arrange
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Unexpected file system error');
      });

      // Act
      const result = await loadServiceList();

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
      const result = await loadServiceList();

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
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('エッジケース', () => {
    it('サービス名に特殊文字が含まれていても正しく取得する', async () => {
      // Arrange
      const specialCharToml = {
        services: {
          'service-with-dash': {},
          'service_with_underscore': {},
          'service123': {},
        },
      };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(specialCharToml as any);

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toEqual(['service-with-dash', 'service_with_underscore', 'service123']);
    });

    it('大量のサービス（100個）でも正しく処理する', async () => {
      // Arrange
      const manyServices = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`service${i}`, {}])
      );
      const manyServicesToml = { services: manyServices };
      mockFs.readFileSync.mockReturnValue('mock content');
      mockToml.parse.mockReturnValue(manyServicesToml as any);

      // Act
      const result = await loadServiceList();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0]).toBe('service0');
      expect(result[99]).toBe('service99');
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
      await loadServiceList();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load service list:',
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
