// FilterPanel - Component (components層)
// フィルタパネルの統合コンポーネント

import React, { useEffect } from 'react';
import { CategorySelector } from './CategorySelector';
import { TagGrid } from './TagGrid';
import { FilterSubmitButton } from './FilterSubmitButton';

interface FilterPanelProps {
  availableCategories: string[];
  availableTags: string[];
  selectedCategory?: string;
  selectedTags?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  availableCategories,
  availableTags,
  selectedCategory,
  selectedTags,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="filter-overlay"
        onClick={onClose}
        data-testid="filter-overlay"
      />
      <aside className="filter-panel" data-testid="filter-panel">
        <form method="get">
          <CategorySelector
            availableCategories={availableCategories}
            selectedCategory={selectedCategory}
          />
          <TagGrid
            availableTags={availableTags}
            selectedTags={selectedTags}
          />
          <FilterSubmitButton />
        </form>
      </aside>
    </>
  );
};
