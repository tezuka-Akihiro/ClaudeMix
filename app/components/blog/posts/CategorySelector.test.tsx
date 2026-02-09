import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySelector } from './CategorySelector';

describe('CategorySelector', () => {
  describe('Rendering', () => {
    it('should display category selector', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド', 'ClaudeMix 考察'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selector = screen.getByTestId('category-selector');
      expect(selector).toBeInTheDocument();
    });

    it('should have category-selector class', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド'];

      // Act
      const { container } = render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selectorContainer = container.querySelector('.category-selector');
      expect(selectorContainer).toBeInTheDocument();
    });
  });

  describe('Options', () => {
    it('should display "All Categories" as default option with empty value', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド'];
      const allCategoriesLabel = 'すべてのカテゴリ';

      // Act
      render(
        <CategorySelector
          availableCategories={availableCategories}
          allCategoriesLabel={allCategoriesLabel}
        />
      );
      const button = screen.getByTestId('category-selector');
      fireEvent.click(button);

      // Assert
      const allCategoriesOption = screen.getByRole('option', { name: allCategoriesLabel });
      expect(allCategoriesOption).toBeInTheDocument();
    });

    it('should display all available categories as options', () => {
      // Arrange
      const availableCategories = [
        'ClaudeMix ガイド',
        'ClaudeMix 考察',
        'ClaudeMix 記録',
      ];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);
      const button = screen.getByTestId('category-selector');
      fireEvent.click(button);

      // Assert
      const options = screen.getAllByRole('option');
      // +1 for "All Categories" option
      expect(options).toHaveLength(availableCategories.length + 1);

      availableCategories.forEach(category => {
        const option = screen.getByRole('option', { name: category });
        expect(option).toBeInTheDocument();
      });
    });

    it('should select the provided selectedCategory', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド', 'ClaudeMix 考察'];
      const selectedCategory = 'ClaudeMix ガイド';

      // Act
      const { container } = render(
        <CategorySelector
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
        />
      );

      // Assert
      const hiddenInput = container.querySelector('input[name="category"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe(selectedCategory);
    });

    it('should default to empty string when no category is selected', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド'];

      // Act
      const { container } = render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const hiddenInput = container.querySelector('input[name="category"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe('');
    });
  });

  describe('Attributes', () => {
    it('should have name="category" attribute', () => {
      // Arrange
      const availableCategories = ['ClaudeMix ガイド'];

      // Act
      const { container } = render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const hiddenInput = container.querySelector('input[name="category"]');
      expect(hiddenInput).toHaveAttribute('name', 'category');
    });
  });
});
