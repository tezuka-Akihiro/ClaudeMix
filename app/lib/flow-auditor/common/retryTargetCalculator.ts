// retryTargetCalculator.ts - 純粋ロジック層
// リトライ時の影響範囲を計算する純粋ロジック

import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

/**
 * リトライ時にアーカイブ対象となるファイルパスのリストを計算する
 *
 * @param checkpointId - リトライ起点のチェックポイントID（単一）
 * @param allCheckpoints - 全チェックポイントの配列（順序保証あり）
 * @returns アーカイブ対象ファイルパスの配列（順序保持）
 *
 * @example
 * ~~~typescript
 * const checkpoints = [
 *   { id: 'cp1', path: 'file1.md', exists: true, ... },
 *   { id: 'cp2', path: 'file2.md', exists: true, ... },
 *   { id: 'cp3', path: 'file3.md', exists: false, ... },
 * ];
 * const targets = calculateRetryTargets('cp1', checkpoints);
 * // => ['file1.md', 'file2.md'] (cp3はexists:falseなのでスキップ)
 * ~~~
 */
export function calculateRetryTargets(
  checkpointId: string,
  allCheckpoints: Checkpoint[]
): string[] {
  // 入力検証
  if (!checkpointId || allCheckpoints.length === 0) {
    return [];
  }

  // 指定されたチェックポイントのインデックスを見つける
  const startIndex = allCheckpoints.findIndex((cp) => cp.id === checkpointId);

  // チェックポイントIDが見つからない場合、空配列を返す
  if (startIndex === -1) {
    return [];
  }

  // 指定されたチェックポイント以降のファイルを抽出
  const affectedCheckpoints = allCheckpoints.slice(startIndex);

  // exists: trueのファイルパスのみを収集（順序保持）
  const affectedFiles = affectedCheckpoints
    .filter((cp) => cp.exists)
    .map((cp) => cp.path);

  return affectedFiles;
}

/**
 * 複数のチェックポイントIDからアーカイブ対象となるファイルパスのリストを計算する
 *
 * Implementation Flow用: 複数選択されたファイルをすべてアーカイブ対象に含める
 *
 * @param checkpointIds - リトライ起点のチェックポイントID配列
 * @param allCheckpoints - 全チェックポイントの配列（順序保証あり）
 * @returns アーカイブ対象ファイルパスの配列（重複なし、順序保持）
 *
 * @example
 * ~~~typescript
 * const checkpoints = [
 *   { id: 'cp1', path: 'file1.md', exists: true, ... },
 *   { id: 'cp2', path: 'file2.md', exists: true, ... },
 *   { id: 'cp3', path: 'file3.md', exists: false, ... },
 * ];
 * const targets = calculateRetryTargetsFromMultiple(['cp1', 'cp2'], checkpoints);
 * // => ['file1.md', 'file2.md'] (cp1とcp2に対応するファイル)
 * ~~~
 */
export function calculateRetryTargetsFromMultiple(
  checkpointIds: string[],
  allCheckpoints: Checkpoint[]
): string[] {
  // 入力検証
  if (!checkpointIds || checkpointIds.length === 0 || allCheckpoints.length === 0) {
    return [];
  }

  // 各checkpointIdに対応するファイルパスを収集
  const filePaths = new Set<string>();

  for (const checkpointId of checkpointIds) {
    const checkpoint = allCheckpoints.find((cp) => cp.id === checkpointId);

    // チェックポイントが見つかり、ファイルが存在する場合のみ追加
    if (checkpoint && checkpoint.exists) {
      filePaths.add(checkpoint.path);
    }
  }

  // Set -> Array変換（重複なし、挿入順序保持）
  return Array.from(filePaths);
}