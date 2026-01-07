// BlogHeader - Component (components層)
// ブログヘッダー（タイトル、テーマ切り替えボタン、メニューボタン）

import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import NavigationMenu from './NavigationMenu';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { MenuItem } from '~/data-io/blog/common/loadBlogConfig.server';

interface BlogHeaderProps {
  blogTitle: string;
  menuItems: MenuItem[];
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ blogTitle, menuItems }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="blog-header blog-header-structure" data-testid="blog-header">
      {/* prefetch="none": 他ルートのバンドルをプリフェッチせず、未使用JSを削減 */}
      <Link to="/blog" className="blog-header__title" data-testid="blog-header-title" prefetch="none">
        {blogTitle}
      </Link>
      <div className="blog-header__actions" data-testid="header-actions">
        <ThemeToggleButton />
        <button
          className="blog-header__menu-button"
          onClick={toggleMenu}
          data-testid="blog-header-menu-button"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
      <NavigationMenu
        menuItems={menuItems}
        isOpen={isMenuOpen}
        onClose={closeMenu}
      />
    </header>
  );
};

export default BlogHeader;
