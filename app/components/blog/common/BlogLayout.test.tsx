import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogLayout from '~/components/blog/common/BlogLayout';

const mockConfig = {
  blogTitle: "Test Blog",
  menuItems: [
    { label: '挨拶記事', path: '/blog/greeting' },
    { label: 'Articles', path: '/blog' },
  ],
  copyright: "© 2025 Test Project",
  siteUrl: "https://example.com",
  siteName: "Test Blog",
};

// localStorageとmatchMediaのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('BlogLayout', () => {
  beforeEach(() => {
    // localStorageをモック
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // window.matchMediaをモック
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // localStorageをクリア
    localStorageMock.clear();

    // data-theme属性をリセット
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Rendering', () => {
    it('should render BlogHeader, children, and BlogFooter', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={mockConfig}>
            <div data-testid="test-content">Test Content</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      expect(screen.getByTestId('blog-header')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByTestId('blog-footer')).toBeInTheDocument();
    });

    it('should render layout container', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={mockConfig}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const layoutElement = screen.getByTestId('blog-layout');
      expect(layoutElement).toBeInTheDocument();
      expect(layoutElement).toHaveClass('blog-layout');
      expect(layoutElement).toHaveClass('blog-layout-structure');
    });

    it('should render main content area', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={mockConfig}>
            <div data-testid="test-content">Main Content</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const mainElement = screen.getByTestId('blog-main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toContainElement(screen.getByTestId('test-content'));
    });

    it('should pass blog title to BlogHeader', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={mockConfig}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const titleElement = screen.getByTestId('blog-header-title');
      expect(titleElement).toHaveTextContent(mockConfig.blogTitle);
    });

    it('should pass copyright to BlogFooter', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={mockConfig}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const copyrightElement = screen.getByTestId('copyright');
      expect(copyrightElement).toHaveTextContent(mockConfig.copyright);
    });
  });
});
