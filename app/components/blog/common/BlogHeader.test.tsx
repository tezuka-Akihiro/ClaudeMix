import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogHeader from '~/components/blog/common/BlogHeader';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

let spec: BlogCommonSpec;

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

describe('BlogHeader', () => {
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
    it('should render logo image', () => {
      // Arrange
      const blogTitle = spec.blog_config.title;
      const logoPath = spec.blog_config.logo_path;

      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={blogTitle}
            logoPath={logoPath}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      const titleLink = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.title_link)
      );
      expect(titleLink).toBeInTheDocument();

      const logoImage = screen.getByAltText(blogTitle);
      expect(logoImage).toBeInTheDocument();
      expect(logoImage).toHaveAttribute('src', logoPath);
    });

    it('should render menu button', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={spec.blog_config.title}
            logoPath={spec.blog_config.logo_path}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      const menuButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.menu_button)
      );
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveTextContent(spec.navigation.menu_icon);
    });

    it('should render theme toggle button', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={spec.blog_config.title}
            logoPath={spec.blog_config.logo_path}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      const themeToggleButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.theme_toggle_button)
      );
      expect(themeToggleButton).toBeInTheDocument();
    });

    it('should render header actions container', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={spec.blog_config.title}
            logoPath={spec.blog_config.logo_path}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      const headerActions = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.header_actions)
      );
      expect(headerActions).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle checkbox checked when menu button is clicked', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={spec.blog_config.title}
            logoPath={spec.blog_config.logo_path}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      const menuButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.menu_button)
      );

      // Initially unchecked
      expect(checkbox.checked).toBe(false);

      // Click to open menu
      fireEvent.click(menuButton);
      expect(checkbox.checked).toBe(true);
    });

    it('should uncheck checkbox when menu button is clicked again', () => {
      // Act
      render(
        <BrowserRouter>
          <BlogHeader
            blogTitle={spec.blog_config.title}
            logoPath={spec.blog_config.logo_path}
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      const menuButton = screen.getByTestId(
        extractTestId(spec.ui_selectors.header.menu_button)
      );

      // Open menu
      fireEvent.click(menuButton);
      expect(checkbox.checked).toBe(true);

      // Close menu
      fireEvent.click(menuButton);
      expect(checkbox.checked).toBe(false);
    });
  });
});
