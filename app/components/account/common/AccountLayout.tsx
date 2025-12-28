/**
 * AccountLayout.tsx - Account Section Layout Component
 * Purpose: Layout wrapper for account pages with navigation
 *
 * @layer UI層 (components)
 * @responsibility アカウントページのレイアウト提供
 */

import React from 'react';
import AccountNav from './AccountNav';
import type { User, NavItem } from '~/specs/account/types';

interface AccountLayoutProps {
  user: User;
  navItems: NavItem[];
  activeNavItem: NavItem | null;
  children: React.ReactNode;
}

/**
 * Account Layout Component
 *
 * Provides consistent layout for all account pages:
 * - User information display
 * - Navigation menu
 * - Content area for child routes
 */
const AccountLayout: React.FC<AccountLayoutProps> = ({
  user,
  navItems,
  activeNavItem,
  children,
}) => {
  return (
    <div
      className="account-layout account-layout-structure"
      data-testid="account-layout"
    >
      {/* Navigation */}
      <AccountNav navItems={navItems} activeNavItem={activeNavItem} />

      {/* Main Content */}
      <main
        className="account-main-content-structure"
        data-testid="main-content"
      >
        {children}
      </main>
    </div>
  );
};

export default AccountLayout;
