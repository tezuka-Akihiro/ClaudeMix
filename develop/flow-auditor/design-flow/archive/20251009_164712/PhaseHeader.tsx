// PhaseHeader - フェーズヘッダーコンポーネント

interface PhaseHeaderProps {
  emoji: string;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PhaseHeader({ emoji, title, isExpanded, onToggle }: PhaseHeaderProps) {
  const arrowIcon = isExpanded ? '▼' : '▶';

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded"
      onClick={onToggle}
    >
      <span>{arrowIcon}</span>
      <span>{emoji}</span>
      <span className="font-bold">{title}</span>
    </div>
  );
}
