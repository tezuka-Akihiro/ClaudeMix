import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlogFooter from '~/components/blog/common/BlogFooter';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/utils/extractTestId';

let spec: BlogCommonSpec;

describe('BlogFooter', () => {
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  describe('Rendering', () => {
    it('should render copyright text', () => {
      // Arrange
      const copyright = "© 2025 Test Project";

      // Act
      render(<BlogFooter copyright={copyright} spec={spec} />);

      // Assert
      const copyrightElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.footer.copyright)
      );
      expect(copyrightElement).toBeInTheDocument();
      expect(copyrightElement).toHaveTextContent(copyright);
    });

    it('should render footer element', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      render(<BlogFooter copyright={copyright} spec={spec} />);

      // Assert
      const footerElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.footer.blog_footer)
      );
      expect(footerElement).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      // Arrange
      const copyright = "© 2025 Test";

      // Act
      render(<BlogFooter copyright={copyright} spec={spec} />);

      // Assert
      const footerElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.footer.blog_footer)
      );
      expect(footerElement).toHaveClass('blog-footer');
      expect(footerElement).toHaveClass('blog-footer-structure');
    });

    it('should render copyright with correct format', () => {
      // Arrange
      const copyright = "© 2025 ClaudeMix";

      // Act
      render(<BlogFooter copyright={copyright} spec={spec} />);

      // Assert
      const copyrightElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.footer.copyright)
      );
      expect(copyrightElement.textContent).toMatch(/^© \d{4}/);
    });
  });
});
