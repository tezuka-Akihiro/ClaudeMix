// phaseGroupBuilder - 🧠 純粋ロジック層
// フェーズ別にチェックポイントをグループ化する
// 副作用なし、テスタブルなビジネスロジック

import type { Checkpoint, PhaseDefinition } from './designFlowDefinition';

export interface CheckpointWithStatus extends Checkpoint {
  exists: boolean;
  status: 'completed' | 'pending';
}

export interface PhaseGroup extends PhaseDefinition {
  checkpoints: CheckpointWithStatus[];
}

/**
 * チェックポイントリストをフェーズ別にグループ化する
 * @param checkpoints - チェックポイントリスト（ステータス付き）
 * @param phaseDefinitions - フェーズ定義
 * @returns フェーズ別グループ
 */
export function phaseGroupBuilder(
  checkpoints: CheckpointWithStatus[],
  phaseDefinitions: PhaseDefinition[]
): PhaseGroup[] {
  return phaseDefinitions.map((phaseDef) => ({
    ...phaseDef,
    checkpoints: checkpoints.filter((cp) => cp.phase === phaseDef.phase),
  }));
}