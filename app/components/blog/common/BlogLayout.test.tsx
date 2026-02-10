import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogLayout from '~/components/blog/common/BlogLayout';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/utils/extractTestId';

let spec: BlogCommonSpec;

const getMockConfig = (spec: BlogCommonSpec) => ({
  blogTitle: spec.blog_config.title,
  menuItems: spec.navigation.menu_items,
  copyright: "© 2025 Test Project",
  siteUrl: spec.blog_config.site_url,
  siteName: spec.blog_config.title,
  spec,
});

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
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

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
        matches: query === spec.theme.media_query,
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
      const config = getMockConfig(spec);
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={config}>
            <div data-testid="test-content">Test Content</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      expect(
        screen.getByTestId(extractTestId(spec.ui_selectors.header.blog_header))
      ).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(
        screen.getByTestId(extractTestId(spec.ui_selectors.footer.blog_footer))
      ).toBeInTheDocument();
    });

    it('should render layout container', () => {
      const config = getMockConfig(spec);
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={config}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const layoutElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.layout.blog_layout)
      );
      expect(layoutElement).toBeInTheDocument();
      expect(layoutElement).toHaveClass('blog-layout');
      expect(layoutElement).toHaveClass('blog-layout-structure');
    });

    it('should render main content area', () => {
      const config = getMockConfig(spec);
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={config}>
            <div data-testid="test-content">Main Content</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const mainElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.layout.main_content)
      );
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toContainElement(screen.getByTestId('test-content'));
    });

    it('should pass blog title to BlogHeader', () => {
      const config = getMockConfig(spec);
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={config}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const titleElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.title_link)
      );
      expect(titleElement).toHaveTextContent(config.blogTitle);
    });

    it('should pass copyright to BlogFooter', () => {
      const config = getMockConfig(spec);
      // Act
      render(
        <BrowserRouter>
          <BlogLayout config={config}>
            <div>Test</div>
          </BlogLayout>
        </BrowserRouter>
      );

      // Assert
      const copyrightElement = screen.getByTestId(
        extractTestId(spec.ui_selectors.footer.copyright)
      );
      expect(copyrightElement).toHaveTextContent(config.copyright);
    });
  });
});
