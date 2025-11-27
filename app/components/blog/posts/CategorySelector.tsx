// CategorySelector - Component (components層)
// カテゴリ選択用のセレクター

import React from 'react';

interface CategorySelectorProps {
  availableCategories: string[];
  selectedCategory?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  availableCategories,
  selectedCategory,
}) => {
  return (
    <select
      name="category"
      className="category-selector"
      defaultValue={selectedCategory || ''}
      data-testid="category-selector"
    >
      <option value="">All Categories</option>
      {availableCategories.map(category => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
};
