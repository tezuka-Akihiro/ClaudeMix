import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterToggleButton } from './FilterToggleButton';

describe('FilterToggleButton', () => {
  describe('Rendering', () => {
    it('should display filter toggle button', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} />);

      // Assert
      const button = screen.getByTestId('filter-toggle-button');
      expect(button).toBeInTheDocument();
    });

    it('should have filter-toggle-button class', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} />);

      // Assert
      const button = screen.getByTestId('filter-toggle-button');
      expect(button).toHaveClass('filter-toggle-button');
    });
  });

  describe('Interaction', () => {
    it('should call onClick handler when clicked', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} />);
      const button = screen.getByTestId('filter-toggle-button');
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick handler multiple times', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} />);
      const button = screen.getByTestId('filter-toggle-button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label when isOpen is false', () => {
      // Arrange
      const mockOnClick = vi.fn();
      const label = 'Filter';

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} label={label} />);

      // Assert
      const button = screen.getByTestId('filter-toggle-button');
      expect(button).toHaveAttribute('aria-label', `${label} (フィルタを開く)`);
    });

    it('should have correct aria-label when isOpen is true', () => {
      // Arrange
      const mockOnClick = vi.fn();
      const label = 'Filter';

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={true} label={label} />);

      // Assert
      const button = screen.getByTestId('filter-toggle-button');
      expect(button).toHaveAttribute('aria-label', `${label} (フィルタを閉じる)`);
    });

    it('should be a button element with type="button"', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<FilterToggleButton onClick={mockOnClick} isOpen={false} />);

      // Assert
      const button = screen.getByTestId('filter-toggle-button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
