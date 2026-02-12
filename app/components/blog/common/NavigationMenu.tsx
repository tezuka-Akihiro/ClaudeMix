// NavigationMenu - Component (components層)
// ナビゲーションメニュー（メニュー項目表示）

import React from 'react';
import { Link } from '@remix-run/react';
import type { MenuItem } from '~/data-io/blog/common/loadBlogConfig.server';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

interface NavigationMenuProps {
  menuItems: MenuItem[];
  spec?: BlogCommonSpec;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  menuItems,
  spec = defaultSpec,
}) => {
  const { ui_selectors } = spec;

  return (
    <>
      <label
        htmlFor="menu-toggle"
        className="navigation-menu__overlay"
        data-testid={extractTestId(ui_selectors.navigation.menu_overlay)}
      />
      <nav
        className="navigation-menu navigation-menu-structure"
        data-testid={extractTestId(ui_selectors.navigation.navigation_menu)}
      >
        {menuItems.map((item, index) => (
          <Link
            key={`${item.path}-${index}`}
            to={item.path}
            className="navigation-menu__item"
            data-testid={extractTestId(ui_selectors.navigation.menu_item)}
            prefetch="none"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default NavigationMenu;
