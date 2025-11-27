import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorySelector } from './CategorySelector';

describe('CategorySelector', () => {
  describe('Rendering', () => {
    it('should display category selector', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices', 'ClaudeMix Philosophy'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selector = screen.getByTestId('category-selector');
      expect(selector).toBeInTheDocument();
    });

    it('should have category-selector class', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selector = screen.getByTestId('category-selector');
      expect(selector).toHaveClass('category-selector');
    });
  });

  describe('Options', () => {
    it('should display "All Categories" as default option with empty value', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const allCategoriesOption = screen.getByRole('option', { name: /All Categories/i });
      expect(allCategoriesOption).toBeInTheDocument();
      expect(allCategoriesOption).toHaveValue('');
    });

    it('should display all available categories as options', () => {
      // Arrange
      const availableCategories = [
        'Claude Best Practices',
        'ClaudeMix Philosophy',
        'Tutorials & Use Cases',
      ];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const options = screen.getAllByRole('option');
      // +1 for "All Categories" option
      expect(options).toHaveLength(availableCategories.length + 1);

      availableCategories.forEach(category => {
        const option = screen.getByRole('option', { name: category });
        expect(option).toBeInTheDocument();
        expect(option).toHaveValue(category);
      });
    });

    it('should select the provided selectedCategory', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices', 'ClaudeMix Philosophy'];
      const selectedCategory = 'Claude Best Practices';

      // Act
      render(
        <CategorySelector
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
        />
      );

      // Assert
      const selector = screen.getByTestId('category-selector') as HTMLSelectElement;
      expect(selector.value).toBe(selectedCategory);
    });

    it('should default to empty string when no category is selected', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selector = screen.getByTestId('category-selector') as HTMLSelectElement;
      expect(selector.value).toBe('');
    });
  });

  describe('Attributes', () => {
    it('should have name="category" attribute', () => {
      // Arrange
      const availableCategories = ['Claude Best Practices'];

      // Act
      render(<CategorySelector availableCategories={availableCategories} />);

      // Assert
      const selector = screen.getByTestId('category-selector');
      expect(selector).toHaveAttribute('name', 'category');
    });
  });
});
