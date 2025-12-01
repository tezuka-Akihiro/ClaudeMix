// ProgressBar - 進捗バーコンポーネント

interface ProgressBarProps {
  progressRate: number; // 0-100
}

export function ProgressBar({ progressRate }: ProgressBarProps) {
  const getColor = () => {
    if (progressRate < 50) return 'bg-red-400';
    if (progressRate < 100) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div data-testid="design-flow-progress-bar" className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${getColor()} transition-all duration-300`}
        style={{ width: `${progressRate}%` }}
      />
    </div>
  );
}
