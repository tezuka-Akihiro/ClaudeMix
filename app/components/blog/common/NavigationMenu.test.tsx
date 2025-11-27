import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavigationMenu from '~/components/blog/common/NavigationMenu';

const mockMenuItems = [
  { label: '挨拶記事', path: '/blog/greeting' },
  { label: 'Articles', path: '/blog' },
];

describe('NavigationMenu', () => {
  describe('Rendering', () => {
    it('should render menu items when open', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu menuItems={mockMenuItems} isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      // Assert
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
      expect(screen.getByText('挨拶記事')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu menuItems={mockMenuItems} isOpen={false} onClose={onClose} />
        </BrowserRouter>
      );

      // Assert
      expect(screen.queryByTestId('navigation-menu')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when menu item is clicked', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu menuItems={mockMenuItems} isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );
      const menuItems = screen.getAllByTestId('menu-item');
      fireEvent.click(menuItems[0]);

      // Assert
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when Escape key is pressed', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu menuItems={mockMenuItems} isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
