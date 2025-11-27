// PhaseGroup - フェーズグループコンポーネント
import { useState } from 'react';
import { PhaseHeader } from './PhaseHeader';
import { CheckpointItem } from './CheckpointItem';
import type { PhaseGroup as PhaseGroupType } from '~/lib/flow-auditor/design-flow/phaseGroupBuilder';
import { sectionCheckpointGrouper } from '~/lib/flow-auditor/design-flow/sectionCheckpointGrouper';

interface PhaseGroupProps {
  phaseGroup: PhaseGroupType;
  onCopyPath?: (filePath: string) => void;
}

export function PhaseGroup({ phaseGroup, onCopyPath }: PhaseGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 'registration'フェーズは分岐しない
  const shouldBranch = phaseGroup.phase !== 'registration';

  // 分岐する場合、セクションごとにチェックポイントをグループ化
  const sectionGroups = shouldBranch ? sectionCheckpointGrouper(phaseGroup.checkpoints) : [];
  const commonCheckpoints = phaseGroup.checkpoints.filter(cp => !cp.section);

  return (
    <div data-testid={`phase-group-${phaseGroup.phase}`} className="mb-6">
      <PhaseHeader
        emoji={phaseGroup.emoji}
        title={phaseGroup.title}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && (
        <>
          {/* 共通チェックポイント（セクションを持たないもの） */}
          {commonCheckpoints.length > 0 && (
            <div className="ml-6 mt-2 space-y-2">
              {commonCheckpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="flow-auditor-checkpoint-wrapper">
                  <CheckpointItem checkpoint={checkpoint} onCopyPath={onCopyPath} />
                </div>
              ))}
            </div>
          )}
          
          {/* セクション別分岐（3列並列） */}
          {shouldBranch && (
            <div className="ml-6 mt-4 grid grid-cols-3 gap-8">
              {sectionGroups.map((group) => (
                group.checkpoints.length > 0 && (
                  <div key={group.section} className="flow-auditor-branch">
                    <div className="flow-auditor-branch-header">
                      {group.section}
                    </div>
                    <div className="space-y-2 mt-2">
                      {group.checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="flow-auditor-checkpoint-wrapper">
                          <CheckpointItem checkpoint={checkpoint} onCopyPath={onCopyPath} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
