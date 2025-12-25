/**
 * AccountNav.tsx - Account Navigation Component
 * Purpose: Display navigation menu for account section
 *
 * @layer UI層 (components)
 * @responsibility アカウントナビゲーションの表示
 */

import React from 'react';
import { Link } from '@remix-run/react';
import type { NavItem } from '~/specs/account/types';

interface AccountNavProps {
  navItems: NavItem[];
  activeNavItem: NavItem | null;
}

/**
 * Account Navigation Component
 *
 * Displays horizontal navigation tabs for account pages
 * Highlights the active page with aria-current attribute
 */
const AccountNav: React.FC<AccountNavProps> = ({ navItems, activeNavItem }) => {
  return (
    <nav
      className="account-nav account-nav-structure"
      aria-label="アカウントナビゲーション"
      data-testid="account-nav"
    >
      {navItems.map((item) => {
        const isActive = activeNavItem?.path === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="account-nav__item"
            aria-current={isActive ? 'page' : undefined}
            data-testid="nav-item"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default AccountNav;
