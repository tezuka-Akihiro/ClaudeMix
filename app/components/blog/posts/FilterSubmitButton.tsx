// FilterSubmitButton - Component (components層)
// フィルタ適用ボタン

import React from 'react';

interface FilterSubmitButtonProps {
  label?: string;
}

export const FilterSubmitButton: React.FC<FilterSubmitButtonProps> = ({ label = 'フィルタ適用' }) => {
  return (
    <button
      type="submit"
      className="filter-submit-button"
      data-testid="filter-submit-button"
    >
      {label}
    </button>
  );
};
