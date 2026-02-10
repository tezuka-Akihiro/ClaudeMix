// BlogHeader - Component (components層)
// ブログヘッダー（タイトル、テーマ切り替えボタン、メニューボタン）

import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import NavigationMenu from './NavigationMenu';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { MenuItem } from '~/data-io/blog/common/loadBlogConfig.server';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/spec-utils/extractTestId';

interface BlogHeaderProps {
  blogTitle: string;
  menuItems: MenuItem[];
  spec?: BlogCommonSpec;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({
  blogTitle,
  menuItems,
  spec = defaultSpec
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const { ui_selectors, accessibility, navigation } = spec;

  return (
    <header
      className="blog-header blog-header-structure"
      data-testid={extractTestId(ui_selectors.header.blog_header)}
    >
      {/* prefetch="none": 他ルートのバンドルをプリフェッチせず、未使用JSを削減 */}
      <Link
        to="/blog"
        className="blog-header__title"
        data-testid={extractTestId(ui_selectors.header.title_link)}
        prefetch="none"
      >
        {blogTitle}
      </Link>
      <div
        className="blog-header__actions"
        data-testid={extractTestId(ui_selectors.header.header_actions)}
      >
        <ThemeToggleButton spec={spec} />
        <button
          className="blog-header__menu-button"
          onClick={toggleMenu}
          data-testid={extractTestId(ui_selectors.header.menu_button)}
          aria-label={
            isMenuOpen
              ? accessibility.aria_labels.menu_button_open
              : accessibility.aria_labels.menu_button
          }
        >
          {navigation.menu_icon}
        </button>
      </div>
      <NavigationMenu
        menuItems={menuItems}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        spec={spec}
      />
    </header>
  );
};

export default BlogHeader;
