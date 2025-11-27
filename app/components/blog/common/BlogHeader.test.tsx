import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogHeader from '~/components/blog/common/BlogHeader';

const mockMenuItems = [
  { label: '挨拶記事', path: '/blog/greeting' },
  { label: 'Articles', path: '/blog' },
];

describe('BlogHeader', () => {
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
