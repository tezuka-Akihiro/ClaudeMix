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
      className="min-h-screen bg-layer-bg flex flex-col"
      data-testid="account-layout"
    >
      {/* Header with user info */}
      <header className="bg-layer-surface border-b border-border-default p-spacing-md">
        <div className="container-max-width mx-auto">
          <h1 className="text-heading-lg font-heading text-text-primary">
            アカウント設定
          </h1>
          <p className="text-body-md text-text-secondary mt-spacing-xs">
            {user.email}
          </p>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-layer-surface border-b border-border-default">
        <div className="container-max-width mx-auto">
          <AccountNav navItems={navItems} activeNavItem={activeNavItem} />
        </div>
      </div>

      {/* Main Content */}
      <main
        className="flex-1 container-max-width mx-auto p-spacing-lg"
        data-testid="main-content"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-layer-surface border-t border-border-default p-spacing-md">
        <div className="container-max-width mx-auto text-center text-body-sm text-text-tertiary">
          © 2025 Account Management System
        </div>
      </footer>
    </div>
  );
};

export default AccountLayout;
