// CommonFlowContainer - app/components: コンポーネント
// 共通チェックポイントを縦1列表示

import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';
import CardItem from '~/components/flow-auditor/common/CardItem';

export interface CommonFlowContainerProps {
  checkpoints: Checkpoint[];
  selectedCheckpointId: string | null;
  onSelect: (checkpointId: string) => void;
  onContextMenu: (path: string) => void;
}

/**
 * チェックポイント名を個別に短縮処理する関数
 * 特定のファイル名のみ短縮表示を行う
 */
function truncateCheckpointName(name: string): string {
  // .mdを除いた名前を取得
  const nameWithoutExtension = name.replace(/\.md$/, '');

  // 個別の短縮ルール
  if (nameWithoutExtension === 'REQUIREMENTS_ANALYSIS_PIPE') {
    return 'REQUIREMENTS_ANA...';
  }

  if (nameWithoutExtension === 'GUIDING_PRINCIPLES') {
    return 'GUIDING_PRINCIPLES';
  }

  // その他のファイル名はそのまま
  return name;
}

export default function CommonFlowContainer({ checkpoints, selectedCheckpointId, onSelect, onContextMenu }: CommonFlowContainerProps) {
  return (
    <div
      data-testid="common-flow-container"
      className="common-flow-container"
      role="region"
      aria-label="共通フロー"
    >
      <div
        className="card-item-list-vertical"
        role="list"
      >
        {checkpoints.map((checkpoint) => {
          const handleClick = () => {
            // ファイルが存在する時のみクリック可能
            if (checkpoint.exists) {
              onSelect(checkpoint.id);
            }
          };

          const handleContextMenu = () => {
            onContextMenu(checkpoint.path);
          };

          // ファイルが存在する時のみクリック可能
          const isClickable = checkpoint.exists;

          // isSelectedがtrueの場合は'selected'を、そうでなければcheckpoint.statusを使用
          const currentStatus = checkpoint.id === selectedCheckpointId ? 'selected' : checkpoint.status;

          // ファイル名を個別に短縮処理
          const displayName = truncateCheckpointName(checkpoint.name);

          return (
            <div key={checkpoint.id} className="card-item-wrapper">
              <CardItem
                text={displayName}
                path={checkpoint.path}
                status={currentStatus}
                clickable={isClickable}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                testId="checkpoint-item"
                checkpointId={checkpoint.id}
                className="card-item"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
