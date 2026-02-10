import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavigationMenu from '~/components/blog/common/NavigationMenu';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/spec-utils/extractTestId';

let spec: BlogCommonSpec;

describe('NavigationMenu', () => {
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  describe('Rendering', () => {
    it('should render menu items when open', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            isOpen={true}
            onClose={onClose}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      expect(
        screen.getByTestId(
          extractTestId(spec.ui_selectors.navigation.navigation_menu)
        )
      ).toBeInTheDocument();
      spec.navigation.menu_items.forEach(item => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('should not render when closed', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            isOpen={false}
            onClose={onClose}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      expect(
        screen.queryByTestId(
          extractTestId(spec.ui_selectors.navigation.navigation_menu)
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when menu item is clicked', () => {
      // Arrange
      const onClose = vi.fn();

      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            isOpen={true}
            onClose={onClose}
            spec={spec}
          />
        </BrowserRouter>
      );
      const menuItems = screen.getAllByTestId(
        extractTestId(spec.ui_selectors.navigation.menu_item)
      );
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
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            isOpen={true}
            onClose={onClose}
            spec={spec}
          />
        </BrowserRouter>
      );
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
