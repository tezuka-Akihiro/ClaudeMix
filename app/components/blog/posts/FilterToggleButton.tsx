// FilterToggleButton - Component (components層)
// フィルタパネルを開閉するトグルボタン

import React from 'react';

interface FilterToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      type="button"
      className="filter-toggle-button"
      onClick={onClick}
      aria-label={isOpen ? 'フィルタを閉じる' : 'フィルタを開く'}
      data-testid="filter-toggle-button"
    >
      Filter
    </button>
  );
};
