// DesignFlowSection - 設計フローセクションコンポーネント
import { ProgressHeader } from './ProgressHeader';
import { ProgressBar } from './ProgressBar';
import { PhaseGroup } from './PhaseGroup';
import type { PhaseGroup as PhaseGroupType } from '~/lib/flow-auditor/design-flow/phaseGroupBuilder';

interface DesignFlowSectionProps {
  completedCount: number;
  totalCount: number;
  progressRate: number;
  phaseGroups: PhaseGroupType[];
}

export function DesignFlowSection({
  completedCount,
  totalCount,
  progressRate,
  phaseGroups,
}: DesignFlowSectionProps) {
  const handleCopyPath = (filePath: string) => {
    navigator.clipboard.writeText(filePath);
  };

  return (
    <div data-testid="design-flow-container" className="flow-auditor-flowchart-container text-white">
      <ProgressHeader completedCount={completedCount} totalCount={totalCount} progressRate={progressRate} />
      <div className="my-4">
        <ProgressBar progressRate={progressRate} />
      </div>

      <div className="mt-6">
        <h3 className="text-md font-semibold mb-3">📋 フェーズ別チェックポイント</h3>
        {phaseGroups.map((phaseGroup) => (
          <PhaseGroup key={phaseGroup.phase} phaseGroup={phaseGroup} onCopyPath={handleCopyPath} />
        ))}
      </div>
    </div>
  );
}
