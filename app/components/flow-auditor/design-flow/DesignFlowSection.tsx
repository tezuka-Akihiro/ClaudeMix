// DesignFlowSection - app/components: コンポーネント
// Design Flowセクション全体のコンテナ、selectedCheckpointId管理

import { useState } from 'react';
import { useSearchParams, useNavigate } from '@remix-run/react';
import type { FlowGroup } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';
import { copyToClipboard } from '~/lib/flow-auditor/common/copyToClipboard';
import Toast from '~/components/flow-auditor/common/Toast';
import CommonFlowContainer from './CommonFlowContainer';
import CommonSectionContainer from './CommonSectionContainer';
import BranchedFlowContainer from './BranchedFlowContainer';

export interface DesignFlowSectionProps {
  checkpoints: FlowGroup;
  sections: Array<{ name: string }>;
  error?: string;
}

export default function DesignFlowSection({ checkpoints, sections, error }: DesignFlowSectionProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCheckpointId = searchParams.get('selectedCheckpoint');

  // Toast状態管理
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  const handleSelect = (checkpointId: string) => {
    const params = new URLSearchParams(searchParams);

    // Implementation Flow由来の複数選択（カンマ区切り）かどうかを判定
    const isMultipleSelection = selectedCheckpointId?.includes(',');

    // トグル動作: 選択済みのチェックポイントをクリックした場合は選択を解除
    // ただし、複数選択の場合は単一選択に置き換える
    if (selectedCheckpointId === checkpointId && !isMultipleSelection) {
      params.delete('selectedCheckpoint');
    } else {
      params.set('selectedCheckpoint', checkpointId);
    }

    navigate(`/flow-auditor?${params.toString()}`);
  };

  // 右クリックでパスをコピー
  const handleContextMenu = async (path: string) => {
    const success = await copyToClipboard(path);
    if (success) {
      setToastMessage(`Copied: ${path}`);
      setToastType('success');
    } else {
      setToastMessage('Failed to copy path');
      setToastType('error');
    }
    setShowToast(true);
  };

  // エラー表示
  if (error) {
    return (
      <div data-testid="design-flow-section" className="design-flow-section">
        <div className="error-box">
          <p>エラーが発生しました:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="design-flow-section"
      className="design-flow-section"
    >
      <div>
        {/* 1. Common Flow Container - 全体設計方針 */}
        <div className="common-flow-wrapper">
          <CommonFlowContainer
            checkpoints={checkpoints.common}
            selectedCheckpointId={selectedCheckpointId}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
          />
        </div>

        {/* 2. Common Section Container - 共通セクション（必須・固定） */}
        <div className="common-section-wrapper">
          <CommonSectionContainer
            checkpoints={checkpoints.commonSection}
            selectedCheckpointId={selectedCheckpointId}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
          />
        </div>

        {/* 3. Branched Flow Container - 機能セクション（動的） */}
        <div className="branched-flow-wrapper">
          <BranchedFlowContainer
            branches={checkpoints.branched}
            selectedCheckpointId={selectedCheckpointId}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
          />
        </div>
      </div>

      {/* Toast通知 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          testId="design-flow-toast"
        />
      )}
    </div>
  );
}
