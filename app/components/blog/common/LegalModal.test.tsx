import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LegalModal from '~/components/blog/common/LegalModal';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/utils/extractTestId';

let spec: BlogCommonSpec;

describe('LegalModal', () => {
  const mockOnClose = vi.fn();
  const testContent = '<p>特商法の内容</p>';

  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      // Act
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const modalOverlay = screen.getByTestId(
        extractTestId(spec.ui_selectors.legal_modal.modal_overlay)
      );
      expect(modalOverlay).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      // Act
      render(
        <LegalModal
          isOpen={false}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const modalOverlay = screen.queryByTestId(
        extractTestId(spec.ui_selectors.legal_modal.modal_overlay)
      );
      expect(modalOverlay).not.toBeInTheDocument();
    });

    it('should render modal title', () => {
      // Act
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const title = screen.getByText(spec.legal_modal.title);
      expect(title).toBeInTheDocument();
    });

    it('should render content', () => {
      // Act
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const content = screen.getByText('特商法の内容');
      expect(content).toBeInTheDocument();
    });

    it('should render close button', () => {
      // Act
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const closeButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.legal_modal.close_button)
      );
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute(
        'aria-label',
        spec.accessibility.aria_labels.legal_modal_close
      );
    });
  });

  describe('Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      // Arrange
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );
      const closeButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.legal_modal.close_button)
      );

      // Act
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      // Arrange
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );
      const overlay = screen.getByTestId(
        extractTestId(spec.ui_selectors.legal_modal.modal_overlay)
      );

      // Act
      fireEvent.click(overlay);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      // Arrange
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );
      const modalContent = screen.getByText(spec.legal_modal.title);

      // Act
      fireEvent.click(modalContent);

      // Assert
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      // Arrange
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Act
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      // Arrange
      render(
        <LegalModal
          isOpen={true}
          onClose={mockOnClose}
          content={testContent}
          spec={spec}
        />
      );

      // Assert
      const modalDialog = screen.getByRole('dialog');
      expect(modalDialog).toHaveAttribute('aria-modal', 'true');
      expect(modalDialog).toHaveAttribute(
        'aria-labelledby',
        spec.ui_selectors.legal_modal.modal_title.replace('#', '')
      );
    });
  });
});
