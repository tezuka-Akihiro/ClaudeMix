// LayerGroup - app/components
// 層別グループのコンテナ（app/lib、app/data-io、app/components）

import type { LayerGroup as LayerGroupType } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';
import CardItem from '~/components/flow-auditor/common/CardItem';
import GroupHeader from './GroupHeader';

export interface LayerGroupProps {
  /** 層別グループデータ */
  group: LayerGroupType;
  /** 選択されているファイルパスの配列 */
  selectedFilePaths: string[];
  /** ファイルクリック時のハンドラ */
  onFileClick: (path: string) => void;
  /** 右クリック時のハンドラ（パスコピー用） */
  onContextMenu: (path: string) => void;
}

/**
 * 層別グループコンポーネント
 *
 * - 層名（app/lib、app/data-io、app/components）をヘッダーに表示
 * - test-scriptペアを横並びで表示（test → script）
 * - ペアにならなかったファイルは縦に表示
 * - サイバーパンクスタイルのボーダー
 *
 * @example
 * <LayerGroup group={group} />
 */
export default function LayerGroup({ group, selectedFilePaths, onFileClick, onContextMenu }: LayerGroupProps) {
  const MAX_FILENAME_LENGTH = 20;

  // 長いファイル名の省略表示
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength - 3) + '…' : text;
  };

  return (
    <div
      data-testid="layer-group" className="component-group">
      <GroupHeader name={group.displayName} />

      {/* test-scriptペアを横並びで表示 */}
      {group.pairs.map((pair) => (
        <div
          key={`${pair.testFile.id}-${pair.scriptFile.id}`}
          className="test-script-pair"
          data-testid="test-script-pair"
        >
          {/* テストファイル */}
          <CardItem
            text={truncateText(pair.testFile.name, MAX_FILENAME_LENGTH)}
            path={pair.testFile.path}
            status={selectedFilePaths.includes(pair.testFile.path) ? 'selected' : pair.testFile.exists ? 'completed' : 'pending'}
            clickable={true}
            onClick={() => onFileClick(pair.testFile.path)}
            onContextMenu={() => onContextMenu(pair.testFile.path)}
            testId={`file-card-${pair.testFile.id}`}
            className="card-item"
          />

          {/* 矢印 */}
          <span className="text-pair-arrow">→</span>

          {/* 実装ファイル */}
          <CardItem
            text={truncateText(pair.scriptFile.name, MAX_FILENAME_LENGTH)}
            path={pair.scriptFile.path}
            status={selectedFilePaths.includes(pair.scriptFile.path) ? 'selected' : pair.scriptFile.exists ? 'completed' : 'pending'}
            clickable={true}
            onClick={() => onFileClick(pair.scriptFile.path)}
            onContextMenu={() => onContextMenu(pair.scriptFile.path)}
            testId={`file-card-${pair.scriptFile.id}`}
            className="card-item"
          />
        </div>
      ))}

      {/* ペアにならなかったファイルを縦に表示 */}
      {group.unpairedFiles.map((file) => (
        <div key={file.id} className="unpaired-file-wrapper">
          <CardItem
            text={truncateText(file.name, MAX_FILENAME_LENGTH)}
            path={file.path}
            status={selectedFilePaths.includes(file.path) ? 'selected' : file.exists ? 'completed' : 'pending'}
            clickable={true}
            onClick={() => onFileClick(file.path)}
            onContextMenu={() => onContextMenu(file.path)}
            testId={`file-card-${file.id}`}
            className="card-item"
          />
        </div>
      ))}
    </div>
  );
}
