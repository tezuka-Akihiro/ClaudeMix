// CardItem - app/components: 共有コンポーネント
// flow-auditor内で共通利用されるカードアイテム（ファイル表示用）

export interface CardItemProps {
  /** 表示するテキスト（ファイル名など） */
  text: string;
  /** ファイルパス（tooltip、aria-labelで使用） */
  path: string;
  /** 存在状態（completed: 緑、pending: 赤） */
  status: 'completed' | 'pending' | 'selected' | 'error';
  /** クリック可能かどうか */
  clickable?: boolean;
  /** クリック時のハンドラー */
  onClick?: () => void;
  /** 右クリック時のハンドラー（パスのクリップボードコピー用） */
  onContextMenu?: () => void;
  /** data-testid属性 */
  testId?: string;
  /** data-checkpoint-id属性（design-flow用） */
  checkpointId?: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 汎用カードアイテムコンポーネント
 *
 * - design-flowではCheckpointItemとして使用（チェックポイント表示）
 * - implementation-flowではFileCardとして使用（ファイル表示）
 *
 * @example
 * // CheckpointItem用途
 * <CardItem
 *   text="func-spec.md"
 *   path="develop/flow-auditor/design-flow/func-spec.md"
 *   status="completed"
 *   clickable={true}
 *   onClick={() => handleSelect('design-flow-func-spec')}
 *   testId="checkpoint-item"
 *   checkpointId="design-flow-func-spec"
 * />
 *
 * @example
 * // FileCard用途
 * <CardItem
 *   text="Header.test.tsx"
 *   path="tests/unit/components/Header.test.tsx"
 *   status="error"
 *   clickable={true}
 *   onClick={() => copyToClipboard(path)}
 *   testId="file-card"
 *   className="file-card"
 * />
 */
export default function CardItem({
  text,
  path,
  status,
  clickable = false,
  onClick,
  onContextMenu,
  testId,
  checkpointId,
  className,
}: CardItemProps) {
  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // ブラウザの右クリックメニューを無効化
    if (onContextMenu) {
      onContextMenu();
    }
  };

  return (
    <div
      data-testid={testId}
      data-checkpoint-id={checkpointId}
      className={`${className} ${status} ${clickable ? 'is-clickable' : 'is-disabled'}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={`${text} - ${status}`}
      title={path}
    >
      {text}
    </div>
  );
}
