// FilterToggleButton - Component (components層)
// フィルタパネルを開閉するトグルボタン

import React from 'react';

interface FilterToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
  label?: string;
}

export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({
  onClick,
  isOpen,
  label = 'Filter'
}) => {
  const statusLabel = isOpen ? 'フィルタを閉じる' : 'フィルタを開く';

  return (
    <button
      type="button"
      className="filter-toggle-button"
      onClick={onClick}
      aria-label={`${label} (${statusLabel})`}
      data-testid="filter-toggle-button"
    >
      {label}
    </button>
  );
};
