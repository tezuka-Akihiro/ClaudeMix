import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogFooter, { type FooterLink } from '~/components/blog/common/BlogFooter';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlogFooter', () => {
  const mockFooterLinks: FooterLink[] = [
    { label: '利用規約', href: '/blog/terms', isModal: false },
    { label: 'プライバシーポリシー', href: '/blog/privacy', isModal: false },
    { label: '特定商取引法に基づく表記', isModal: true },
  ];
  const mockLegalContent = '<p>特定商取引法の内容</p>';

  describe('Rendering', () => {
    it('should render copyright text', () => {
      // Arrange
      const copyright = "© 2025 Test Project";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const copyrightElement = screen.getByTestId('copyright');
      expect(copyrightElement).toBeInTheDocument();
      expect(copyrightElement).toHaveTextContent(copyright);
    });

    it('should render footer element', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const footerElement = screen.getByTestId('blog-footer');
      expect(footerElement).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const footerElement = screen.getByTestId('blog-footer');
      expect(footerElement).toHaveClass('blog-footer');
      expect(footerElement).toHaveClass('flex');
      expect(footerElement).toHaveClass('flex-col');
      expect(footerElement).toHaveClass('items-center');
    });

    it('should render footer links', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const footerLinksNav = screen.getByTestId('footer-links');
      expect(footerLinksNav).toBeInTheDocument();

      expect(screen.getByText('利用規約')).toBeInTheDocument();
      expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
      expect(screen.getByText('特定商取引法に基づく表記')).toBeInTheDocument();
    });

    it('should render link elements with correct href', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const termsLink = screen.getByTestId('footer-link-0');
      expect(termsLink).toHaveAttribute('href', '/blog/terms');

      const privacyLink = screen.getByTestId('footer-link-1');
      expect(privacyLink).toHaveAttribute('href', '/blog/privacy');
    });

    it('should render modal trigger as button', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const modalTrigger = screen.getByTestId('footer-link-2');
      expect(modalTrigger.tagName).toBe('BUTTON');
      expect(modalTrigger).toHaveAttribute('type', 'button');
    });

    it('should not render modal initially', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );

      // Assert
      const modalOverlay = screen.queryByTestId('legal-modal-overlay');
      expect(modalOverlay).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should open modal when modal trigger is clicked', () => {
      // Arrange
      const copyright = "© 2025 Test";
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );
      const modalTrigger = screen.getByTestId('footer-link-2');

      // Act
      fireEvent.click(modalTrigger);

      // Assert
      const modalOverlay = screen.getByTestId('legal-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      // Arrange
      const copyright = "© 2025 Test";
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );
      const modalTrigger = screen.getByTestId('footer-link-2');
      fireEvent.click(modalTrigger);

      // Act
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      // Assert
      const modalOverlay = screen.queryByTestId('legal-modal-overlay');
      expect(modalOverlay).not.toBeInTheDocument();
    });

    it('should close modal when Escape key is pressed', () => {
      // Arrange
      const copyright = "© 2025 Test";
      renderWithRouter(
        <BlogFooter
          copyright={copyright}
          footerLinks={mockFooterLinks}
          legalContent={mockLegalContent}
        />
      );
      const modalTrigger = screen.getByTestId('footer-link-2');
      fireEvent.click(modalTrigger);

      // Act
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      const modalOverlay = screen.queryByTestId('legal-modal-overlay');
      expect(modalOverlay).not.toBeInTheDocument();
    });
  });
});
