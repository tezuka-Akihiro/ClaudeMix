import { describe, it, expect } from 'vitest';
import { calculateFileDiff } from '../lib/calculateFileDiff.js';

describe('calculateFileDiff', () => {
  it('未定義ファイルが正しく検出される', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
      'app/components/UnexpectedComponent.tsx', // 未定義
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([
      'app/components/UnexpectedComponent.tsx',
    ]);
    expect(result.missingFiles).toEqual([]);
  });

  it('不足ファイルが正しく検出される', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
      'app/components/ComponentB.tsx', // 定義されているが実在しない
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([
      'app/components/ComponentB.tsx',
    ]);
  });

  it('差分なしの場合は空配列を返す', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([]);
  });

  it('パス正規化が正しく機能する（Windows \\ → / 変換）', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
    ];
    const actualFiles = [
      'app\\components\\ComponentA.tsx', // Windowsスタイル
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([]);
  });

  it('パスの前後の空白をトリムする', () => {
    const definedFiles = [
      '  app/components/ComponentA.tsx  ',
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([]);
  });

  it('複数の未定義ファイルと不足ファイルを検出する', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
      'app/components/ComponentB.tsx', // 不足
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
      'app/components/UnexpectedComponent.tsx', // 未定義
      'app/lib/unexpectedLogic.ts', // 未定義
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([
      'app/components/UnexpectedComponent.tsx',
      'app/lib/unexpectedLogic.ts',
    ]);
    expect(result.missingFiles).toEqual([
      'app/components/ComponentB.tsx',
    ]);
  });

  it('空の配列を渡すと空の結果を返す', () => {
    const result = calculateFileDiff([], []);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([]);
  });

  it('重複したパスが含まれていても正しく処理する', () => {
    const definedFiles = [
      'app/components/ComponentA.tsx',
      'app/components/ComponentA.tsx', // 重複
    ];
    const actualFiles = [
      'app/components/ComponentA.tsx',
    ];

    const result = calculateFileDiff(definedFiles, actualFiles);

    expect(result.undefinedFiles).toEqual([]);
    expect(result.missingFiles).toEqual([]);
  });
});
