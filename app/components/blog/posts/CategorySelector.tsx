// CategorySelector - Component (components層)
// カテゴリ選択用のカスタムドロップダウン

import React, { useState, useEffect, useRef } from 'react';

interface CategorySelectorProps {
  availableCategories: string[];
  selectedCategory?: string;
  allCategoriesLabel?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  availableCategories,
  selectedCategory,
  allCategoriesLabel = 'All Categories',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(selectedCategory || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (value: string) => {
    setSelected(value);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    if (!selected) return allCategoriesLabel;
    return selected;
  };

  return (
    <div className="category-selector" ref={dropdownRef}>
      <button
        type="button"
        className="category-selector__button category-selector__button-structure"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid="category-selector"
      >
        <span>{getDisplayLabel()}</span>
        <span className="category-selector__icon">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="category-selector__overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="category-selector__menu" role="listbox">
            <button
              type="button"
              className="category-selector__item category-selector__item-structure"
              role="option"
              aria-selected={selected === ''}
              onClick={() => handleSelect('')}
            >
              {allCategoriesLabel}
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                className="category-selector__item category-selector__item-structure"
                role="option"
                aria-selected={selected === category}
                onClick={() => handleSelect(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="category" value={selected} />
    </div>
  );
};
