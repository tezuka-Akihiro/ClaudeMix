// checkpointStatus - 純粋ロジック層
// ステータス判定（pending/completed/selected）
// 副作用なし、テスタブルなビジネスロジック

/**
 * チェックポイントステータス型
 */
export type CheckpointStatus = 'pending' | 'completed' | 'selected';

/**
 * チェックポイントステータスを判定する
 *
 * 優先順位: selected > completed > pending
 *
 * @param exists - ファイルが存在するかどうか
 * @param checkpointId - チェックポイントID
 * @param selectedCheckpointId - 選択中のチェックポイントID（nullの場合は未選択）
 * @returns チェックポイントステータス
 */
export function determineCheckpointStatus(
  exists: boolean,
  checkpointId: string,
  selectedCheckpointId: string | null
): CheckpointStatus {
  // 優先順位1: selected (選択中)
  if (selectedCheckpointId === checkpointId) {
    return 'selected';
  }

  // 優先順位2: completed (完了済み)
  if (exists) {
    return 'completed';
  }

  // 優先順位3: pending (未完了)
  return 'pending';
}