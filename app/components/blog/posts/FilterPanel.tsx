// FilterPanel - Component (components層)
// フィルタパネルの統合コンポーネント

import React, { useEffect } from 'react';
import { CategorySelector } from './CategorySelector';
import { TagGrid } from './TagGrid';
import { FilterSubmitButton } from './FilterSubmitButton';
import type { TagGroup, BlogPostsSpec } from '~/specs/blog/types';

interface FilterPanelProps {
  availableCategories: string[];
  availableTags: string[];
  tagGroups?: TagGroup[];
  selectedCategory?: string;
  selectedTags?: string[];
  isOpen: boolean;
  onClose: () => void;
  filterMessages: BlogPostsSpec['messages']['filter'];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  availableCategories,
  availableTags,
  tagGroups,
  selectedCategory,
  selectedTags,
  isOpen,
  onClose,
  filterMessages,
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
            allCategoriesLabel={filterMessages.all_categories_label}
          />
          <TagGrid
            availableTags={availableTags}
            tagGroups={tagGroups}
            selectedTags={selectedTags}
          />
          <FilterSubmitButton label={filterMessages.submit_label} />
        </form>
      </aside>
    </>
  );
};

export default FilterPanel;
