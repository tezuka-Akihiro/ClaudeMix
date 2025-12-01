# MOCK_POLICY.md - Implementation Flow

## ⚠️ モック戦略終了 (2025-10-26)

このモック戦略は完了しました。以下の実装により、file-list.mdベースの正式な実装に移行しました：

- ✅ `parseFileListMarkdown()` 関数を実装（lib層）
- ✅ `readFileListMd.server.ts` を実装（data-io層）
- ✅ ファイルペアリング機能（`setPairIds()`）を実装
- ✅ 3大層分離の原則を遵守（純粋関数とファイルI/Oの分離）
- ✅ 全テスト通過（39件 lib層 + 6件 data-io層）

ハードコード関数（`get*FileDefinitions()`）は後方互換性のために残していますが、`@deprecated` マークを付与し、新規コードでは `parseFileListMarkdown()` + `readFileListMd()` の使用を推奨しています。

---

## 1. モック対象（アーカイブ）

- **UI/UX名**:
  - ImplementationFlowSectionコンポーネントの層別グループ表示
  - ComponentGroupコンポーネントのファイルペア表示
  - FileCardコンポーネントのファイル存在状態表示（緑グロー/デフォルト/青グロー）
  - ノードクリック選択とペア自動選択

- **モック時の挙動**:
  - `implementationFlowDefinition` は、file-list.mdを解析せずにハードコードされたファイル定義配列を返す。
  - `checkImplementationFiles.server` は、ファイルシステムをチェックせずに固定の存在確認結果を返す。
  - すべてのファイルパスは実在しない仮想パスとする。

- **正実装時の挙動**:
  - `implementationFlowDefinition` は、実際に `file-list.md` を読み込み、ファイル定義をパースする。
  - `checkImplementationFiles.server` は、`fs.existsSync` を使用して、各ファイルパスの存在を確認する。
  - `implementationFlowBuilder` は、ファイル定義と存在確認結果から、UI表示用のデータ構造を構築する。

- **目的**:
  - `data-io`層（ファイルシステムアクセス）の実装が完了する前に、UIコンポーネントとlib層のTDDサイクルを先行して進めるため。
  - UIの表示ロジック（層別グループ化、ペアマッチング、選択状態管理）を、ファイルシステムの副作用から切り離してテストする。
  - file-list.mdベースのデータソース統一を前提としたアーキテクチャ検証。

- **寿命**:
  - UI層とlib層のユニットテストが完了し、`data-io`層の実装に着手する時点で、このモックは破棄され、実実装に置き換えられる。

---

## 2. 関連ファイル（アーキテクチャ層別）

| 層 | ファイルパス | 関連メソッド | モック設定 | 実装設定 |
|:---|:---|:---|:---|:---|
| 🧠 **lib層** | `app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts` | `getFileDefinitions` | file-list.mdを読まずに、3層（lib/data-io/ui）× 各2ペアの固定ファイル定義配列を返す。 | file-list.mdを読み込み、正規表現でファイル定義をパースして返す。 |
| 🧠 **lib層** | `app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.ts` | `buildImplementationFlowOutput` | モックのファイル定義と存在確認結果から、LayerGroup配列を構築する（純粋関数のためモック不要）。 | 実データを用いて同じロジックを実行。 |
| 🧠 **lib層** | `app/lib/flow-auditor/implementation-flow/filePairMatcher.ts` | `findPairPath` | ペアマッチングロジックをテストするため、モック不要（純粋関数）。 | 同上。 |
| 🔌 **data-io層** | `app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.ts` | `checkImplementationFiles` | ファイルパス配列を受け取り、すべて `exists: false` の固定結果を返す。 | `fs.existsSync` を使用して実際のファイル存在を確認する。 |

---

## 3. データポリシー

- **静的データ中心**: モックデータは、`func-spec.md` と `file-list.md` に記載されているデータ構造に準拠した固定のJSONオブジェクトを使用する。
- **再現性**: テストの安定性を確保するため、擬似ランダム値は使用しない。
- **file-list.md準拠**: 3層（app/lib、app/data-io、app/components）× 各2ペアの構造を維持する。

---

## 4. 使用ルール

- **適用フェーズ**: `TDD_WORK_FLOW.md` の `Phase 2: 層別TDD` で、lib層とUI層のユニットテストを実装する際に使用する。
- **モックライブラリ**: `vitest` の `vi.mock()` を使用して、`data-io`層のモジュール全体をモックする。
- **品質保証**: このモック自体は品質保証の対象外とする。あくまでlib層とUI層のテストを円滑に進めるための「仮設足場」と位置づける。

### モック実装例 (lib層テストコード内)

~~~typescript
import { vi } from 'vitest';
import type { FileDefinition } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';

// implementationFlowDefinitionのモック
vi.mock('~/lib/flow-auditor/implementation-flow/implementationFlowDefinition', () => ({
  getFileDefinitions: vi.fn().mockReturnValue([
    // app/lib
    { name: 'implementationFlowDefinition.ts', path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts', category: 'lib', layer: 'lib' },
    { name: 'implementationFlowDefinition.test.ts', path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts', category: 'test', layer: 'lib' },
    { name: 'implementationFlowBuilder.ts', path: 'app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.ts', category: 'lib', layer: 'lib' },
    { name: 'implementationFlowBuilder.test.ts', path: 'app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.test.ts', category: 'test', layer: 'lib' },
    // app/data-io
    { name: 'checkImplementationFiles.server.ts', path: 'app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.ts', category: 'data-io', layer: 'data-io' },
    { name: 'checkImplementationFiles.server.test.ts', path: 'app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.test.ts', category: 'test', layer: 'data-io' },
    // app/components
    { name: 'ImplementationFlowSection.tsx', path: 'app/components/flow-auditor/implementation-flow/ImplementationFlowSection.tsx', category: 'ui', layer: 'ui' },
    { name: 'ImplementationFlowSection.test.tsx', path: 'app/components/flow-auditor/implementation-flow/ImplementationFlowSection.test.tsx', category: 'test', layer: 'ui' },
  ] as FileDefinition[]),
}));

// checkImplementationFiles.serverのモック
vi.mock('~/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server', () => ({
  checkImplementationFiles: vi.fn().mockResolvedValue([
    { path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts', exists: false },
    { path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts', exists: false },
    { path: 'app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.ts', exists: false },
    { path: 'app/lib/flow-auditor/implementation-flow/implementationFlowBuilder.test.ts', exists: false },
    { path: 'app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.ts', exists: false },
    { path: 'app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.test.ts', exists: false },
    { path: 'app/components/flow-auditor/implementation-flow/ImplementationFlowSection.tsx', exists: false },
    { path: 'app/components/flow-auditor/implementation-flow/ImplementationFlowSection.test.tsx', exists: false },
  ]),
}));
~~~

---

## 5. モックデータ構造

~~~typescript
// file-list.mdから抽出されるファイル定義
interface FileDefinition {
  name: string; // ファイル名
  path: string; // フルパス（{service}, {section}プレースホルダー含む）
  category: 'lib' | 'data-io' | 'ui' | 'test'; // カテゴリー
  layer: 'lib' | 'data-io' | 'ui'; // アーキテクチャ層
}

// ファイル存在確認結果
interface FileExistsResult {
  path: string; // フルパス
  exists: boolean; // モック時はすべて false
}

// UI表示用のデータ構造（implementationFlowBuilderの出力）
interface ImplementationFlowOutput {
  layerGroups: LayerGroup[];
}

interface LayerGroup {
  layer: 'app/lib' | 'app/data-io' | 'app/components';
  filePairs: FilePairInfo[];
}

interface FilePairInfo {
  testFile: FileInfo;
  scriptFile: FileInfo;
}

interface FileInfo {
  name: string; // ファイル名
  path: string; // フルパス
  exists: boolean; // ファイルが存在するか
}
~~~
