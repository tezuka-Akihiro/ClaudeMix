// filePairMatcher - 純粋ロジック層
// ファイル選択時にペアを自動選択する純粋関数（Surgical Retry用）
// 副作用なし、テスタブルなビジネスロジック

import type {
  FileDefinition,
  LayerGroup,
} from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';

/**
 * 選択されたファイルのペアファイルを検索する
 *
 * @param selectedFile - 選択されたファイル
 * @param allFiles - 全てのファイル定義の配列
 * @returns ペアとなるファイル。見つからない場合はundefined
 */
export function findFilePair(
  selectedFile: FileDefinition,
  allFiles: FileDefinition[]
): FileDefinition | undefined {
  // pairIdがない場合はペアなし
  if (!selectedFile.pairId) {
    return undefined;
  }

  // pairIdと一致するidを持つファイルを検索
  const pairFile = allFiles.find((f) => f.id === selectedFile.pairId);

  return pairFile;
}

/**
 * クリックされたファイルのペアとなるファイルのパスを検索する
 *
 * @param clickedPath - クリックされたファイルのパス
 * @param layerGroups - 全ての層グループのデータ
 * @returns ペアとなるファイルのパス。見つからない場合はundefined
 */
export function findPairFilePath(
  clickedPath: string,
  layerGroups: LayerGroup[]
): string | undefined {
  let clickedFile: FileDefinition | undefined;
  let allFiles: FileDefinition[] = [];

  for (const group of layerGroups) {
    const filesInGroup = group.pairs.flatMap((p) => [p.testFile, p.scriptFile]);
    allFiles.push(...filesInGroup, ...group.unpairedFiles);
  }

  clickedFile = allFiles.find((f) => f.path === clickedPath);

  if (!clickedFile) {
    return undefined;
  }

  const pairFile = findFilePair(clickedFile, allFiles);

  return pairFile?.path;
}
