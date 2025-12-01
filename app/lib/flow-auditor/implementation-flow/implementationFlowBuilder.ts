// implementationFlowBuilder - 純粋ロジック層
// ファイル定義+存在確認結果からUI表示用データを構築する純粋関数
// 副作用なし、テスタブルなビジネスロジック

import type { FileDefinition, LayerGroup } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';
import type { FileExistsResult } from '~/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server';

/**
 * buildImplementationFlowの入力型
 */
export interface BuildImplementationFlowInput {
  fileDefinitions: FileDefinition[];
  existsResults: FileExistsResult[];
  layerDisplayNames?: Record<string, string>; // オプショナル: 層の表示名マップ
}

/**
 * buildImplementationFlowの出力型
 */
export interface BuildImplementationFlowOutput {
  layerGroups: LayerGroup[];
}

/**
 * デフォルトの層別表示名マップ（フォールバック用）
 */
const DEFAULT_LAYER_DISPLAY_NAMES: Record<string, string> = {
  lib: 'app/lib',
  'data-io': 'app/data-io',
  ui: 'app/components',
};

/**
 * ファイル定義+存在確認結果からUI表示用データを構築する
 *
 * @param input - ファイル定義と存在確認結果
 * @returns 層別グループの配列
 */
export function buildImplementationFlow(input: BuildImplementationFlowInput): BuildImplementationFlowOutput {
  const { fileDefinitions, existsResults, layerDisplayNames = DEFAULT_LAYER_DISPLAY_NAMES } = input;

  // E2E層を除外
  const targetDefinitions = fileDefinitions.filter(def => def.layer !== 'e2e');

  // 存在確認結果をMapに変換（高速アクセス用）
  const existsMap = new Map(
    existsResults.map(result => [result.path, result.exists])
  );

  // ファイル定義に存在状態を統合
  const enrichedDefinitions = targetDefinitions.map(def => ({
    ...def,
    exists: existsMap.get(def.path) ?? false,
  }));

  // test-scriptペアをマッチング
  const definitionsWithPairs = matchTestScriptPairs(enrichedDefinitions);

  // 層別にグループ化
  const layerGroups = groupByLayer(definitionsWithPairs, layerDisplayNames);

  return { layerGroups };
}

/**
 * test-scriptペアをマッチング
 * テストファイル（.test.ts/.test.tsx）と実装ファイルをペアリング
 */
function matchTestScriptPairs(definitions: FileDefinition[]): FileDefinition[] {
  const result = [...definitions];

  for (let i = 0; i < result.length; i++) {
    const file = result[i];

    // テストファイルの場合、対応する実装ファイルを探す
    if (file.name.includes('.test.')) {
      const implName = file.name.replace('.test.', '.');
      const implFile = result.find(f => f.name === implName && f.layer === file.layer);
      if (implFile) {
        file.pairId = implFile.id;
        implFile.pairId = file.id;
      }
    }
  }

  return result;
}

/**
 * 層別にグループ化し、test-scriptペアを作成
 */
function groupByLayer(definitions: FileDefinition[], layerDisplayNames: Record<string, string>): LayerGroup[] {
  const grouped: Record<string, FileDefinition[]> = {
    lib: [],
    'data-io': [],
    ui: [],
  };

  // 層ごとに分類
  for (const def of definitions) {
    if (grouped[def.layer]) {
      grouped[def.layer].push(def);
    }
  }

  // LayerGroup配列に変換（空でないグループのみ）
  const layerGroups: LayerGroup[] = [];
  for (const layer of ['lib', 'data-io', 'ui'] as const) {
    if (grouped[layer].length > 0) {
      const { pairs, unpairedFiles } = createPairs(grouped[layer]);
      layerGroups.push({
        layer,
        displayName: layerDisplayNames[layer],
        pairs,
        unpairedFiles,
      });
    }
  }

  return layerGroups;
}

/**
 * test-scriptペアを作成
 * テストファイルと実装ファイルをペアリングし、ペアにならなかったファイルも返す
 */
function createPairs(files: FileDefinition[]): {
  pairs: { testFile: FileDefinition; scriptFile: FileDefinition }[];
  unpairedFiles: FileDefinition[];
} {
  const pairs: { testFile: FileDefinition; scriptFile: FileDefinition }[] = [];
  const paired = new Set<string>();

  // テストファイルを見つけて、対応する実装ファイルとペアリング
  for (const file of files) {
    if (file.name.includes('.test.') && !paired.has(file.id)) {
      const implFile = files.find(f => f.id === file.pairId);
      if (implFile) {
        pairs.push({
          testFile: file,
          scriptFile: implFile,
        });
        paired.add(file.id);
        paired.add(implFile.id);
      }
    }
  }

  // ペアにならなかったファイル
  const unpairedFiles = files.filter(f => !paired.has(f.id));

  return { pairs, unpairedFiles };
}
