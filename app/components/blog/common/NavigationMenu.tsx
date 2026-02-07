// NavigationMenu - Component (components層)
// ナビゲーションメニュー（メニュー項目表示）

import React, { useEffect, useRef } from 'react';
import { Link } from '@remix-run/react';
import type { MenuItem } from '~/data-io/blog/common/loadBlogConfig.server';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

interface NavigationMenuProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  spec?: BlogCommonSpec;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  menuItems,
  isOpen,
  onClose,
  spec = defaultSpec,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const { ui_selectors } = spec;

  return (
    <>
      <div
        className="navigation-menu__overlay"
        data-testid={extractTestId(ui_selectors.navigation.menu_overlay)}
        onClick={onClose}
      />
      <nav
        ref={menuRef}
        className="navigation-menu navigation-menu-structure"
        data-testid={extractTestId(ui_selectors.navigation.navigation_menu)}
      >
        {/* prefetch="none": ルート別バンドルの不要なプリフェッチを防止 */}
        {menuItems.map((item, index) => (
          <Link
            key={`${item.path}-${index}`}
            to={item.path}
            className="navigation-menu__item"
            onClick={onClose}
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
