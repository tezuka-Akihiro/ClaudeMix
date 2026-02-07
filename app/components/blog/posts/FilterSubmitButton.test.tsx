import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterSubmitButton } from './FilterSubmitButton';

describe('FilterSubmitButton', () => {
  describe('Rendering', () => {
    it('should display filter submit button', () => {
      // Act
      render(<FilterSubmitButton />);

      // Assert
      const button = screen.getByTestId('filter-submit-button');
      expect(button).toBeInTheDocument();
    });

    it('should have filter-submit-button class', () => {
      // Act
      render(<FilterSubmitButton />);

      // Assert
      const button = screen.getByTestId('filter-submit-button');
      expect(button).toHaveClass('filter-submit-button');
    });

    it('should display the provided label text', () => {
      // Arrange
      const label = 'Apply Filter';

      // Act
      render(<FilterSubmitButton label={label} />);

      // Assert
      const button = screen.getByText(label);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Attributes', () => {
    it('should be a button element with type="submit"', () => {
      // Act
      render(<FilterSubmitButton />);

      // Assert
      const button = screen.getByTestId('filter-submit-button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
