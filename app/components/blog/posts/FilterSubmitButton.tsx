// FilterSubmitButton - Component (components層)
// フィルタ適用ボタン

import React from 'react';

export const FilterSubmitButton: React.FC = () => {
  return (
    <button
      type="submit"
      className="filter-submit-button"
      data-testid="filter-submit-button"
    >
      フィルタ適用
    </button>
  );
};
