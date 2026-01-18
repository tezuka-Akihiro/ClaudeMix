import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlogFooter from '~/components/blog/common/BlogFooter';

describe('BlogFooter', () => {
  describe('Rendering', () => {
    it('should render copyright text', () => {
      // Arrange
      const copyright = "© 2025 Test Project";

      // Act
      render(<BlogFooter copyright={copyright} />);

      // Assert
      const copyrightElement = screen.getByTestId('copyright');
      expect(copyrightElement).toBeInTheDocument();
      expect(copyrightElement).toHaveTextContent(copyright);
    });

    it('should render footer element', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      render(<BlogFooter copyright={copyright} />);

      // Assert
      const footerElement = screen.getByTestId('blog-footer');
      expect(footerElement).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      render(<BlogFooter copyright={copyright} />);

      // Assert
      const footerElement = screen.getByTestId('blog-footer');
      expect(footerElement).toHaveClass('blog-footer');
      expect(footerElement).toHaveClass('blog-footer-structure');
    });

    it('should render copyright with correct format', () => {
      // Arrange
      const copyright = "© 2025 ClaudeMix";

      // Act
      render(<BlogFooter copyright={copyright} />);

      // Assert
      const copyrightElement = screen.getByTestId('copyright');
      expect(copyrightElement.textContent).toMatch(/^© \d{4}/);
    });
  });
});
