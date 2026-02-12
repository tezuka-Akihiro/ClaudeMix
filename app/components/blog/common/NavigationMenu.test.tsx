import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavigationMenu from '~/components/blog/common/NavigationMenu';
import { loadSpec } from 'tests/utils/loadSpec';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

let spec: BlogCommonSpec;

describe('NavigationMenu', () => {
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  describe('Rendering', () => {
    it('should render menu items', () => {
      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
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

    it('should render menu items as links with correct paths', () => {
      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      spec.navigation.menu_items.forEach(item => {
        const link = screen.getByText(item.label);
        expect(link).toHaveAttribute('href', item.path);
      });
    });

    it('should render overlay label', () => {
      // Act
      render(
        <BrowserRouter>
          <NavigationMenu
            menuItems={spec.navigation.menu_items}
            spec={spec}
          />
        </BrowserRouter>
      );

      // Assert
      expect(
        screen.getByTestId(
          extractTestId(spec.ui_selectors.navigation.menu_overlay)
        )
      ).toBeInTheDocument();
    });
  });
});
