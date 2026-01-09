import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const mockOnClose = vi.fn();
  const availableCategories = ['Tech', 'Design'];
  const availableTags = ['AI', 'Claude', 'TDD'];

  describe('Visibility', () => {
    it('should display panel when isOpen={true}', () => {
      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Assert
      const panel = screen.getByTestId('filter-panel');
      expect(panel).toBeInTheDocument();
    });

    it('should hide panel when isOpen={false}', () => {
      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      // Assert
      const panel = screen.queryByTestId('filter-panel');
      expect(panel).not.toBeInTheDocument();
    });
  });

  describe('Overlay Interaction', () => {
    it('should call onClose when overlay is clicked', () => {
      // Arrange
      const onCloseSpy = vi.fn();

      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={true}
          onClose={onCloseSpy}
        />
      );
      const overlay = screen.getByTestId('filter-overlay');
      fireEvent.click(overlay);

      // Assert
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClose when Escape key is pressed', () => {
      // Arrange
      const onCloseSpy = vi.fn();

      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={true}
          onClose={onCloseSpy}
        />
      );
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when other keys are pressed', () => {
      // Arrange
      const onCloseSpy = vi.fn();

      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={true}
          onClose={onCloseSpy}
        />
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });

      // Assert
      expect(onCloseSpy).not.toHaveBeenCalled();
    });
  });

  describe('Component Composition', () => {
    it('should contain CategorySelector, TagGrid, and FilterSubmitButton', () => {
      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
      expect(screen.getByTestId('tag-grid')).toBeInTheDocument();
      expect(screen.getByTestId('filter-submit-button')).toBeInTheDocument();
    });

    it('should pass selectedCategory to CategorySelector', () => {
      // Act
      const { container } = render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          selectedCategory="Tech"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Assert
      const hiddenInput = container.querySelector('input[name="category"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe('Tech');
    });

    it('should pass selectedTags to TagGrid', () => {
      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={availableTags}
          selectedTags={['AI', 'Claude']}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Assert
      const aiButton = screen.getByRole('button', { name: 'AI' });
      const claudeButton = screen.getByRole('button', { name: 'Claude' });
      expect(aiButton).toHaveAttribute('aria-pressed', 'true');
      expect(claudeButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should pass tagGroups to TagGrid and render grouped tags', () => {
      // Arrange
      const mockTagGroups = [
        { group: 'Remix', tags: ['SSR', 'Vite'] },
        { group: 'Cloudflare', tags: ['Workers'] },
      ];

      // Act
      render(
        <FilterPanel
          availableCategories={availableCategories}
          availableTags={[]} // availableTags is not used when tagGroups is provided
          tagGroups={mockTagGroups}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Assert
      // The effect of passing tagGroups is that TagGrid will render group headers.
      expect(screen.getByText('Remix')).toBeInTheDocument();
      expect(screen.getByText('Cloudflare')).toBeInTheDocument();

      const remixGroup = screen.getByText('Remix').closest('[data-testid="tag-group-container"]');
      expect(within(remixGroup as HTMLElement).getByText('SSR')).toBeInTheDocument();
    });
  });
});
