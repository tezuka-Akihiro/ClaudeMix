import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanDirectory } from '../lib/scanDirectory.js';
import fs from 'node:fs';
import path from 'node:path';

// fsモジュールをモック
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));

describe('scanDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('再帰的にファイルをスキャンする', () => {
    // モックファイルシステムのセットアップ
    fs.existsSync.mockReturnValue(true);

    const mockFs = {
      '/test/app': [
        { name: 'components', isDirectory: () => true, isFile: () => false },
        { name: 'lib', isDirectory: () => true, isFile: () => false },
      ],
      '/test/app/components': [
        { name: 'ComponentA.tsx', isDirectory: () => false, isFile: () => true },
        { name: 'nested', isDirectory: () => true, isFile: () => false },
      ],
      '/test/app/components/nested': [
        { name: 'ComponentB.tsx', isDirectory: () => false, isFile: () => true },
      ],
      '/test/app/lib': [
        { name: 'logic.ts', isDirectory: () => false, isFile: () => true },
      ],
    };

    fs.readdirSync.mockImplementation((dir) => mockFs[dir] || []);

    const result = scanDirectory('/test/app', {
      excludePatterns: [],
      includeExtensions: ['.ts', '.tsx'],
    });

    expect(result).toContain('/test/app/components/ComponentA.tsx');
    expect(result).toContain('/test/app/components/nested/ComponentB.tsx');
    expect(result).toContain('/test/app/lib/logic.ts');
  });

  it('除外パターンが機能する（node_modules等）', () => {
    fs.existsSync.mockReturnValue(true);

    const mockFs = {
      '/test/app': [
        { name: 'components', isDirectory: () => true, isFile: () => false },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: '.git', isDirectory: () => true, isFile: () => false },
        { name: 'build', isDirectory: () => true, isFile: () => false },
      ],
      '/test/app/components': [
        { name: 'ComponentA.tsx', isDirectory: () => false, isFile: () => true },
      ],
    };

    fs.readdirSync.mockImplementation((dir) => mockFs[dir] || []);

    const result = scanDirectory('/test/app', {
      excludePatterns: ['node_modules', '.git', 'build'],
      includeExtensions: ['.ts', '.tsx', '.js'],
    });

    expect(result).toEqual(['/test/app/components/ComponentA.tsx']);
  });

  it('拡張子フィルタが機能する（.ts, .tsx等）', () => {
    fs.existsSync.mockReturnValue(true);

    const mockFs = {
      '/test/app': [
        { name: 'ComponentA.tsx', isDirectory: () => false, isFile: () => true },
        { name: 'logic.ts', isDirectory: () => false, isFile: () => true },
        { name: 'data.json', isDirectory: () => false, isFile: () => true },
        { name: 'README.md', isDirectory: () => false, isFile: () => true },
        { name: 'styles.css', isDirectory: () => false, isFile: () => true },
      ],
    };

    fs.readdirSync.mockImplementation((dir) => mockFs[dir] || []);

    const result = scanDirectory('/test/app', {
      excludePatterns: [],
      includeExtensions: ['.ts', '.tsx'],
    });

    expect(result.sort()).toEqual([
      '/test/app/ComponentA.tsx',
      '/test/app/logic.ts',
    ].sort());
  });

  it('testsディレクトリを除外する', () => {
    fs.existsSync.mockReturnValue(true);

    const mockFs = {
      '/test/app': [
        { name: 'components', isDirectory: () => true, isFile: () => false },
      ],
      '/test/app/components': [
        { name: 'ComponentA.tsx', isDirectory: () => false, isFile: () => true },
      ],
    };

    fs.readdirSync.mockImplementation((dir) => mockFs[dir] || []);

    const result = scanDirectory('/test/app', {
      excludePatterns: ['tests'],
      includeExtensions: ['.ts', '.tsx'],
    });

    expect(result).toEqual(['/test/app/components/ComponentA.tsx']);
  });

  it('空のディレクトリの場合は空配列を返す', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);

    const result = scanDirectory('/test/app', {
      excludePatterns: [],
      includeExtensions: ['.ts', '.tsx'],
    });

    expect(result).toEqual([]);
  });

  it('ディレクトリが存在しない場合は空配列を返す', () => {
    fs.existsSync.mockReturnValue(false);

    const result = scanDirectory('/nonexistent', {
      excludePatterns: [],
      includeExtensions: ['.ts', '.tsx'],
    });

    expect(result).toEqual([]);
  });
});
