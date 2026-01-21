import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LegalModal from '~/components/blog/common/LegalModal';

describe('LegalModal', () => {
  const mockOnClose = vi.fn();
  const testContent = '<p>特商法の内容</p>';

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      // Act
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Assert
      const modalOverlay = screen.getByTestId('legal-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      // Act
      render(<LegalModal isOpen={false} onClose={mockOnClose} content={testContent} />);

      // Assert
      const modalOverlay = screen.queryByTestId('legal-modal-overlay');
      expect(modalOverlay).not.toBeInTheDocument();
    });

    it('should render modal title', () => {
      // Act
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Assert
      const title = screen.getByText('特商法');
      expect(title).toBeInTheDocument();
    });

    it('should render content', () => {
      // Act
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Assert
      const content = screen.getByText('特商法の内容');
      expect(content).toBeInTheDocument();
    });

    it('should render close button', () => {
      // Act
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Assert
      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', '閉じる');
    });
  });

  describe('Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      // Arrange
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);
      const closeButton = screen.getByTestId('close-button');

      // Act
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      // Arrange
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);
      const overlay = screen.getByTestId('legal-modal-overlay');

      // Act
      fireEvent.click(overlay);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      // Arrange
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);
      const modalContent = screen.getByText('特商法');

      // Act
      fireEvent.click(modalContent);

      // Assert
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      // Arrange
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Act
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      // Arrange
      render(<LegalModal isOpen={true} onClose={mockOnClose} content={testContent} />);

      // Assert
      const modalDialog = screen.getByRole('dialog');
      expect(modalDialog).toHaveAttribute('aria-modal', 'true');
      expect(modalDialog).toHaveAttribute('aria-labelledby', 'legal-modal-title');
    });
  });
});
