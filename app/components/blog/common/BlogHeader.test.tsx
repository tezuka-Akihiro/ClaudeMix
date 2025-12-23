import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogHeader from '~/components/blog/common/BlogHeader';

const mockMenuItems = [
  { label: '挨拶記事', path: '/blog/greeting' },
  { label: 'Articles', path: '/blog' },
];

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
    it('should render blog title', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );

      // Assert
      const titleElement = screen.getByTestId('blog-header-title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(blogTitle);
    });

    it('should render menu button', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );

      // Assert
      const menuButton = screen.getByTestId('blog-header-menu-button');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveTextContent('Menu');
    });

    it('should render theme toggle button', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );

      // Assert
      const themeToggleButton = screen.getByTestId('theme-toggle-button');
      expect(themeToggleButton).toBeInTheDocument();
    });

    it('should render header actions container', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );

      // Assert
      const headerActions = screen.getByTestId('header-actions');
      expect(headerActions).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should open menu when menu button is clicked', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );
      const menuButton = screen.getByTestId('blog-header-menu-button');
      fireEvent.click(menuButton);

      // Assert
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });

    it('should close menu when menu button is clicked again', () => {
      // Arrange
      const blogTitle = "Test Blog";

      // Act
      render(
        <BrowserRouter>
          <BlogHeader blogTitle={blogTitle} menuItems={mockMenuItems} />
        </BrowserRouter>
      );
      const menuButton = screen.getByTestId('blog-header-menu-button');

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();

      // Close menu
      fireEvent.click(menuButton);

      // Assert
      expect(screen.queryByTestId('navigation-menu')).not.toBeInTheDocument();
    });
  });
});
