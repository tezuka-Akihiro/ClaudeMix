// BranchedFlowContainer - app/components: コンポーネント
// セクション別チェックポイントを動的列数で並列表示

import type { BranchedFlowGroup } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';
import Branch from './Branch';

export interface BranchedFlowContainerProps {
  branches: BranchedFlowGroup[];
  selectedCheckpointId: string | null;
  onSelect: (checkpointId: string) => void;
  onContextMenu: (path: string) => void;
}

export default function BranchedFlowContainer({ branches, selectedCheckpointId, onSelect, onContextMenu }: BranchedFlowContainerProps) {
  return (
    <div data-testid="branched-flow-container">
      {/* 横並びレイアウト（自動折り返し） */}
      <div className="branched-flow-container">
        {branches.map((branch) => (
          <Branch
            key={branch.sectionName}
            sectionName={branch.sectionName}
            checkpoints={branch.checkpoints}
            selectedCheckpointId={selectedCheckpointId}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
}
