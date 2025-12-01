// CheckpointItem - チェックポイント項目コンポーネント
import type { CheckpointWithStatus } from '~/lib/flow-auditor/design-flow/phaseGroupBuilder';

interface CheckpointItemProps {
  checkpoint: CheckpointWithStatus;
  onCopyPath?: (filePath: string) => void;
}

export function CheckpointItem({ checkpoint, onCopyPath }: CheckpointItemProps) {
  const handleClick = () => {
    // 完了済みのチェックポイントの場合のみ、リトライ用コマンドをコピーする
    // 未作成（pending）の場合は、オペレーターによる介入を防ぐためクリックしても何もしない
    if (onCopyPath && checkpoint.status !== 'pending') {
      onCopyPath(`npm run dev -- --retry-from ${checkpoint.id}`);
    }
  };

  // カスタムCSSクラス使用（Tailwindキャッシュ問題回避 + Application Tokens使用）
  const statusClass = checkpoint.exists ? 'completed' : 'pending';

  return (
    <div
      data-testid={`checkpoint-${checkpoint.id}`}
      // スタイルは globals.css のカスタムクラスで管理
      className={`flow-auditor-checkpoint ${statusClass}`}
      onClick={handleClick}
    >
      <span className="text-lg">{checkpoint.emoji}</span>
      <span className="flex-1">{checkpoint.label}</span>
      {!checkpoint.exists && <span className="text-xs opacity-70">(未作成)</span>}
    </div>
  );
}
