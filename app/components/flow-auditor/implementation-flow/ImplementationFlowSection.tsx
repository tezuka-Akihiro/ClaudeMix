// ImplementationFlowSection - app/components
// implementation-flowセクション全体のコンテナ

import { useState } from 'react';
import { useSearchParams, useNavigate } from '@remix-run/react';
import { findPairFilePath } from '~/lib/flow-auditor/implementation-flow/filePairMatcher';
import { copyToClipboard } from '~/lib/flow-auditor/common/copyToClipboard';
import type { ImplementationFlowOutput } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';
import Toast from '~/components/flow-auditor/common/Toast';
import LayerGroup from './LayerGroup';

export interface ImplementationFlowSectionProps {
  /** buildImplementationFlowから取得したデータ */
  data: ImplementationFlowOutput;
}

/**
 * Implementation Flowセクションのルートコンポーネント
 *
 * - loaderDataからlayerGroupsを取得
 * - LayerGroup（app/lib、app/data-io、app/components）を縦に並べて表示
 * - エラー時のフォールバック表示
 *
 * @example
 * <ImplementationFlowSection data={loaderData} />
 */
export default function ImplementationFlowSection({
  data,
}: ImplementationFlowSectionProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);

  // Toast状態管理
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  const handleFileClick = (clickedPath: string) => {
    const pairPath = findPairFilePath(clickedPath, data.layerGroups);

    setSelectedFilePaths((prev) => {
      const newSelection = new Set(prev);
      const pathsToToggle = [clickedPath, pairPath].filter(
        (p): p is string => !!p
      );

      // クリックされたファイルが既に選択されているか
      const isAlreadySelected = newSelection.has(clickedPath);

      pathsToToggle.forEach((path) => {
        isAlreadySelected ? newSelection.delete(path) : newSelection.add(path);
      });

      const newSelectionArray = Array.from(newSelection);

      // URLパラメータを更新してリトライボタンをアクティブにする
      const params = new URLSearchParams(searchParams);

      // Implementation Flow: 複数選択をカンマ区切りで保存
      if (newSelectionArray.length > 0) {
        params.set('selectedCheckpoint', newSelectionArray.join(','));
      } else {
        params.delete('selectedCheckpoint');
      }

      navigate(`/flow-auditor?${params.toString()}`);

      return newSelectionArray;
    });
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

  // エラーハンドリング: dataが未定義
  if (!data) {
    return (
      <div
        data-testid="implementation-flow-error" // Note: This could also use .error-box
        className="error-box"
      >
        Failed to load implementation flow data.
      </div>
    );
  }

  // エラーハンドリング: layerGroupsが空
  if (!data.layerGroups || data.layerGroups.length === 0) {
    return (
      <div
        data-testid="implementation-flow-error" // Note: This could also use .error-box
        className="error-box"
      >
        No layer groups found.
      </div>
    );
  }

  return (
    <section
      data-testid="implementation-flow-section"
      className="implementation-flow-section"
    >
      {data.layerGroups.map((group) => (
        <LayerGroup
          key={group.layer}
          group={group}
          selectedFilePaths={selectedFilePaths}
          onFileClick={handleFileClick}
          onContextMenu={handleContextMenu}
        />
      ))}

      {/* Toast通知 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          testId="implementation-flow-toast"
        />
      )}
    </section>
  );
}
