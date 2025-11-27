import { describe, it, expect } from 'vitest';
import { parseFileListMarkdown } from '../lib/parseFileListMarkdown.js';

describe('parseFileListMarkdown', () => {
  it('正常なテーブルからパスを抽出する', () => {
    const markdown = `
# file-list.md

## 1. E2Eテスト
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| test.spec.ts | tests/e2e/test.spec.ts | E2Eテスト |

## 2. UI層
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
| Component.test.tsx | app/components/Component.test.tsx | ユニットテスト |
`;

    const result = parseFileListMarkdown(markdown);

    // tests/配下のファイルは除外される
    expect(result).toEqual([
      'app/components/Component.tsx',
      'app/components/Component.test.tsx',
    ]);
  });

  it('複数のテーブルから全パスを抽出する', () => {
    const markdown = `
## 1. UI層
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| ComponentA.tsx | app/components/ComponentA.tsx | コンポーネントA |

## 2. ロジック層
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| logic.ts | app/lib/logic.ts | ロジック |

## 3. 副作用層
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| api.server.ts | app/data-io/api.server.ts | API |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/ComponentA.tsx',
      'app/lib/logic.ts',
      'app/data-io/api.server.ts',
    ]);
  });

  it('テストファイル（tests/配下）は除外される', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| test.spec.ts | tests/e2e/test.spec.ts | E2Eテスト |
| unit.test.ts | tests/unit/unit.test.ts | ユニットテスト |
| Component.tsx | app/components/Component.tsx | コンポーネント |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/Component.tsx',
    ]);
  });

  it('空のfile-list.mdは空配列を返す', () => {
    const markdown = `
# file-list.md

空のファイルです。
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([]);
  });

  it('テーブルが存在しない場合は空配列を返す', () => {
    const markdown = `ただのテキスト`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([]);
  });

  it('パス列が空の行はスキップする', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
|  |  | 空行 |
| Logic.ts | app/lib/Logic.ts | ロジック |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/Component.tsx',
      'app/lib/Logic.ts',
    ]);
  });

  it('重複したパスは1つにまとめる', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
| Component.tsx | app/components/Component.tsx | 重複 |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/Component.tsx',
    ]);
  });

  it('パスの前後の空白をトリムする', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx |  app/components/Component.tsx  | コンポーネント |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/Component.tsx',
    ]);
  });

  it('空のセルがある行でも正しくパースする（列位置がずれない）', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
|  | app/data-io/dataAccess.ts | データアクセス（ファイル名が空） |
| Logic.ts | app/lib/Logic.ts | ロジック |
`;

    const result = parseFileListMarkdown(markdown);

    // 空のファイル名セルがあっても、パス列の位置はずれない
    expect(result).toEqual([
      'app/components/Component.tsx',
      'app/data-io/dataAccess.ts',
      'app/lib/Logic.ts',
    ]);
  });

  it('複数の空のセルがある行でも正しくパースする', () => {
    const markdown = `
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
|  | app/lib/helper.ts |  |
`;

    const result = parseFileListMarkdown(markdown);

    expect(result).toEqual([
      'app/components/Component.tsx',
      'app/lib/helper.ts',
    ]);
  });
});
