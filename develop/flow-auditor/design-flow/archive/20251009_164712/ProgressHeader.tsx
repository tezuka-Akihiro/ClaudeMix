// ProgressHeader - 進捗ヘッダーコンポーネント

interface ProgressHeaderProps {
  completedCount: number;
  totalCount: number;
  progressRate: number; // 0-100
}

export function ProgressHeader({ completedCount, totalCount, progressRate }: ProgressHeaderProps) {
  const getColor = () => {
    if (progressRate < 50) return 'text-red-400';
    if (progressRate < 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <h2 data-testid="design-flow-progress-header" className={`text-lg font-bold ${getColor()}`}>
      📊 設計フロー進捗: {progressRate}% ({completedCount}/{totalCount})
    </h2>
  );
}
