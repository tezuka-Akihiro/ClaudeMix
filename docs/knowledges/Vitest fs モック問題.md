# 🚨 Vitest fs モック問題 - 解決済みレポート

## 検索キーワード

`vi.mock('fs')`, `vi.mock('node:fs')`, `existsSync`, `モックが効かない`, `Number of calls: 0`, `expected { path:`, `exists: false } to deeply equal`, `exists: true`, `AssertionError`, `vitest mock not working`, `fs.existsSync mock`

---

## 1. エラー概要

| 項目 | 内容 |
| :--- | :--- |
| **エラー種別** | Vitestユニットテスト - モック機能不全 |
| **発生日時** | 2025-10-24 |
| **発生箇所** | `app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts` |
| **影響範囲** | Phase 2.1.1: checkImplementationFiles.server のTDD実装 |
| **ステータス** | ✅ **解決済み** - 実ファイルシステムを使用するテストアプローチに変更 |

---

## 2. 発生したエラーメッセージ（完全版）

### エラー1: exists値の不一致

~~~
FAIL app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts >
  checkImplementationFiles - Side Effects Layer > 正常系テスト >
  ファイルが存在する場合、exists: true を返す

AssertionError: expected { path: 'app/test.ts', exists: false } to deeply equal { path: 'app/test.ts', exists: true }

- Expected
+ Received

  {
-   "exists": true,
+   "exists": false,
    "path": "app/test.ts",
  }

❯ app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts:30:25
~~~

### エラー2: モック関数が呼ばれていない

~~~
FAIL app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts >
  checkImplementationFiles - Side Effects Layer > 正常系テスト >
  ファイルが存在しない場合、exists: false を返す

AssertionError: expected "spy" to be called with arguments: [ 'app/missing.ts' ]

Number of calls: 0

❯ app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts:52:26
~~~

### テスト結果サマリ

~~~
Test Files  1 failed (1)
Tests       3 failed | 1 passed (4)
Duration    1000ms
~~~

---

## 3. 問題の詳細

### 3.1 失敗したテストコード（初期実装）

~~~typescript
// checkImplementationFiles.server.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';

// ❌ このモックが効かない
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

import { checkImplementationFiles } from '~/data-io/service-name/implementation-flow/checkImplementationFiles.server';

describe('checkImplementationFiles - Side Effects Layer', () => {
  const mockExistsSync = vi.mocked(fs.existsSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ファイルが存在する場合、exists: true を返す', () => {
    const filePaths = ['app/test.ts'];
    mockExistsSync.mockReturnValue(true); // ❌ この設定が無視される

    const result = checkImplementationFiles(filePaths);

    expect(result[0]).toEqual({
      path: 'app/test.ts',
      exists: true, // ❌ 実際はfalseが返ってくる
    });
    expect(mockExistsSync).toHaveBeenCalledWith('app/test.ts'); // ❌ 呼び出し回数が0
  });
});
~~~

### 3.2 実装ファイル

~~~typescript
// checkImplementationFiles.server.ts
import { existsSync } from 'node:fs'; // ⚠️ node:fs を使用

export function checkImplementationFiles(filePaths: string[]): FileExistsResult[] {
  try {
    const results = filePaths.map((path) => ({
      path,
      exists: existsSync(path), // ⚠️ ここで実際のfsが呼ばれてしまう
    }));
    return results;
  } catch (error) {
    // ...
  }
}
~~~

---

## 4. 試行錯誤の記録

### 試行1: `vi.mock('node:fs')` のみ

~~~typescript
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));
~~~

**結果**: ❌ `No "default" export is defined on the "node:fs" mock` エラー

### 試行2: `importOriginal` を使用

~~~typescript
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});
~~~

**結果**: ❌ モックが効かない（呼び出し回数0、実際のファイルシステムが使われる）

### 試行3: インポート順序の変更

~~~typescript
import * as fs from 'node:fs';

vi.mock('node:fs', async (importOriginal) => { ... });

import { checkImplementationFiles } from '~/data-io/...';
~~~

**結果**: ❌ 効果なし

### 試行4: `node:fs` → `fs` に変更

~~~typescript
// 実装ファイル
import { existsSync } from 'fs'; // node: プレフィックスを削除

// テストファイル
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});
~~~

**結果**: ❌ モックが効かない

---

## 5. 根本原因の分析

### 5.1 プロジェクト内の既存テストを調査

他のdata-io層のテストファイルを検索して参考パターンを探しました：

~~~bash
# 検索結果
app/data-io/service-name/checkFileExistence.test.ts
app/data-io/service-name/design-flow/checkDesignFiles.test.ts
app/data-io/service-name/common/executeRetry.server.test.ts
~~~

#### 重要な発見

`checkDesignFiles.test.ts` (同じく`fs.existsSync`をモック) も**同様に失敗している**ことを確認：

~~~typescript
// checkDesignFiles.test.ts (lines 7-16, 51)
import * as fs from 'fs'; // ⚠️ 'fs' を使用（node: なし）

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

const mockExistsSync = vi.mocked(fs.existsSync);
~~~

テスト実行結果：

~~~
Test Files  1 failed (1)
Tests       5 failed | 4 passed (9)

❌ expected false to be true
❌ expected [ …(7) ] to deeply equal [ …(2) ]
~~~

**結論**: このプロジェクトでは`vi.mock('fs')`および`vi.mock('node:fs')`が**システム的に機能していない**。

### 5.2 技術的な原因（推測）

1. **Vitestのモック機構の制限**: ESMモジュールの名前付きインポート(`import { existsSync }`)がモックシステムと相性が悪い
2. **パスエイリアスとの干渉**: `~/data-io/...`のようなパスエイリアスがモジュール解決に影響している可能性
3. **vitest.config.tsの設定不足**: fsモジュールに対する特別な設定が必要な可能性

---

## 6. 採用した解決策 ✅

### 6.1 アプローチ: 実際のファイルシステムを使用

モックを諦め、**実際に存在するファイルをテスト対象にする**アプローチに変更。

#### メリット

- ✅ モック設定の複雑さを回避
- ✅ 実際の動作を確実にテストできる
- ✅ テストの保守性が向上（モックのメンテナンス不要）

#### デメリットと対策

- ⚠️ テストの独立性が低下 → **対策**: `package.json`, `tsconfig.json`など**確実に存在するファイル**を使用
- ⚠️ 存在しないファイルのテストが難しい → **対策**: 明らかに存在しない名前（`THIS_FILE_DOES_NOT_EXIST_FOR_TESTING_12345.ts`）を使用

### 6.2 最終的なテストコード（成功版）

~~~typescript
// checkImplementationFiles.server.test.ts（完全版）
import { describe, it, expect } from 'vitest';
import { checkImplementationFiles, type FileExistsResult } from '~/data-io/service-name/implementation-flow/checkImplementationFiles.server';

describe('checkImplementationFiles - Side Effects Layer', () => {
  describe('正常系テスト', () => {
    it('ファイルが存在する場合、exists: true を返す', () => {
      // Arrange
      // ✅ 実際に存在するファイルを使用
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
~~~

### 6.3 テスト結果（成功）

~~~
✓ app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts (4 tests) 5ms

Test Files  1 passed (1)
Tests       4 passed (4)
Duration    882ms
~~~

---

## 7. 学んだこと・ナレッジ

### 7.1 副作用層のテスト戦略

| アプローチ | メリット | デメリット | 適用場面 |
| :--- | :--- | :--- | :--- |
| **モックを使用** | テストの独立性が高い | 設定が複雑、環境依存の問題 | 外部APIコール、DB操作など |
| **実リソースを使用** | シンプル、実際の動作を保証 | テストの独立性が低い | ファイル存在確認など単純な操作 |

### 7.2 プロジェクト固有の問題

- このプロジェクトでは`vi.mock('fs')`が機能しない
- `checkDesignFiles.test.ts`も同様の問題を抱えている（5 failed tests）
- 今後のdata-io層のテストでは実ファイルシステムを使用するアプローチを推奨

### 7.3 ベストプラクティス

1. **テスト用ファイルの選定**:
   - ✅ `package.json`, `tsconfig.json`, `vite.config.ts` など確実に存在するファイル
   - ✅ 存在しないファイルは明確な命名（`*_DOES_NOT_EXIST_FOR_TESTING_*.ts`）

2. **テストの独立性の担保**:
   - プロジェクトルート直下のファイルのみを使用
   - テスト実行順序に依存しない

3. **将来的な改善提案**:
   - `vitest.config.ts`でfsモジュールのモック設定を調査
   - 依存性注入パターンの導入を検討（`existsSync`を外部から注入可能にする）

---

## 8. 関連ファイル

| ファイル | 役割 | 状態 |
| :--- | :--- | :--- |
| [checkImplementationFiles.server.ts](app/data-io/service-name/implementation-flow/checkImplementationFiles.server.ts) | 実装ファイル | ✅ 完成 |
| [checkImplementationFiles.server.test.ts](app/data-io/service-name/implementation-flow/checkImplementationFiles.server.test.ts) | テストファイル | ✅ 全テストパス |
| [TDD_WORK_FLOW.md](develop/service-name/implementation-flow/TDD_WORK_FLOW.md) | 進捗管理 | ✅ 更新済み |
| [checkDesignFiles.test.ts](app/data-io/service-name/design-flow/checkDesignFiles.test.ts) | 参考（同じ問題あり） | ⚠️ 5 tests failing |

---

## 9. 今後のアクション

- [ ] `checkDesignFiles.test.ts` も同様のアプローチで修正を検討
- [ ] プロジェクト全体でfsモックが必要な箇所をリストアップ
- [ ] vitest.config.tsでfsモジュールの設定を調査
- [ ] 依存性注入パターンの導入を検討（次のリファクタリングフェーズで）

---

## 10. 参考リンク

- [Vitest公式 - Mocking](https://vitest.dev/guide/mocking.html)
- [Vitest公式 - vi.mock](https://vitest.dev/api/vi.html#vi-mock)
- プロジェクト内の関連Issue: なし（新規問題）

---

**作成日**: 2025-10-24
**作成者**: Claude (AI Assistant)
**レビュー**: 未
**カテゴリ**: Testing, Vitest, TDD, Mocking, FileSystem
