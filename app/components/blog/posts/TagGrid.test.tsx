import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagGrid } from './TagGrid';

describe('TagGrid', () => {
  describe('Rendering', () => {
    it('should display tag grid', () => {
      // Arrange
      const availableTags = ['AI', 'Claude'];

      // Act
      render(<TagGrid availableTags={availableTags} />);

      // Assert
      const grid = screen.getByTestId('tag-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should display all available tags as buttons', () => {
      // Arrange
      const availableTags = ['AI', 'Claude', 'TDD', 'TypeScript'];

      // Act
      render(<TagGrid availableTags={availableTags} />);

      // Assert
      const tagButtons = screen.getAllByTestId('tag-button');
      expect(tagButtons).toHaveLength(availableTags.length);

      availableTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  describe('Selection State', () => {
    it('should have aria-pressed="false" for unselected tags', () => {
      // Arrange
      const availableTags = ['AI', 'Claude'];

      // Act
      render(<TagGrid availableTags={availableTags} />);

      // Assert
      const tagButtons = screen.getAllByTestId('tag-button');
      tagButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should have aria-pressed="true" for pre-selected tags', () => {
      // Arrange
      const availableTags = ['AI', 'Claude', 'TDD'];
      const selectedTags = ['AI', 'TDD'];

      // Act
      render(<TagGrid availableTags={availableTags} selectedTags={selectedTags} />);

      // Assert
      const aiButton = screen.getByRole('button', { name: 'AI' });
      const tddButton = screen.getByRole('button', { name: 'TDD' });
      const claudeButton = screen.getByRole('button', { name: 'Claude' });

      expect(aiButton).toHaveAttribute('aria-pressed', 'true');
      expect(tddButton).toHaveAttribute('aria-pressed', 'true');
      expect(claudeButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle tag selection on click', () => {
      // Arrange
      const availableTags = ['AI'];

      // Act
      render(<TagGrid availableTags={availableTags} />);
      const button = screen.getByRole('button', { name: 'AI' });

      // Initially unselected
      expect(button).toHaveAttribute('aria-pressed', 'false');

      // Click to select
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');

      // Click again to deselect
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle multiple tags independently', () => {
      // Arrange
      const availableTags = ['AI', 'Claude', 'TDD'];

      // Act
      render(<TagGrid availableTags={availableTags} />);
      const aiButton = screen.getByRole('button', { name: 'AI' });
      const claudeButton = screen.getByRole('button', { name: 'Claude' });

      // Select AI
      fireEvent.click(aiButton);
      expect(aiButton).toHaveAttribute('aria-pressed', 'true');
      expect(claudeButton).toHaveAttribute('aria-pressed', 'false');

      // Select Claude
      fireEvent.click(claudeButton);
      expect(aiButton).toHaveAttribute('aria-pressed', 'true');
      expect(claudeButton).toHaveAttribute('aria-pressed', 'true');

      // Deselect AI
      fireEvent.click(aiButton);
      expect(aiButton).toHaveAttribute('aria-pressed', 'false');
      expect(claudeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Hidden Inputs', () => {
    it('should create hidden input for each selected tag', () => {
      // Arrange
      const availableTags = ['AI', 'Claude'];

      // Act
      render(<TagGrid availableTags={availableTags} />);
      const aiButton = screen.getByRole('button', { name: 'AI' });

      // Initially no hidden inputs
      let hiddenInputs = document.querySelectorAll('input[type="hidden"][name="tags"]');
      expect(hiddenInputs).toHaveLength(0);

      // Click to select AI
      fireEvent.click(aiButton);

      // Should have 1 hidden input
      hiddenInputs = document.querySelectorAll('input[type="hidden"][name="tags"]');
      expect(hiddenInputs).toHaveLength(1);
      expect(hiddenInputs[0]).toHaveAttribute('value', 'AI');
    });

    it('should remove hidden input when tag is deselected', () => {
      // Arrange
      const availableTags = ['AI'];

      // Act
      render(<TagGrid availableTags={availableTags} />);
      const aiButton = screen.getByRole('button', { name: 'AI' });

      // Select
      fireEvent.click(aiButton);
      let hiddenInputs = document.querySelectorAll('input[type="hidden"][name="tags"]');
      expect(hiddenInputs).toHaveLength(1);

      // Deselect
      fireEvent.click(aiButton);
      hiddenInputs = document.querySelectorAll('input[type="hidden"][name="tags"]');
      expect(hiddenInputs).toHaveLength(0);
    });
  });
});
