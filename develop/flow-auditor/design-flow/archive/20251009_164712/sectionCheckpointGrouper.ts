// sectionCheckpointGrouper - 🧠 純粋ロジック層
// セクション別にチェックポイントをグルーピングする
// 副作用なし、テスタブルなビジネスロジック

import type { CheckpointWithStatus } from './phaseGroupBuilder';

export interface SectionGroup {
  section: string;
  checkpoints: CheckpointWithStatus[];
}

/**
 * チェックポイントリストをセクション別にグループ化する
 * @param checkpoints - チェックポイントリスト（ステータス付き）
 * @returns セクション別グループ
 */
export function sectionCheckpointGrouper(checkpoints: CheckpointWithStatus[]): SectionGroup[] {
  const sections = ['operation', 'design-flow', 'implementation-flow'];

  return sections.map((section) => ({
    section,
    checkpoints: checkpoints.filter((cp) => cp.section === section),
  }));
}