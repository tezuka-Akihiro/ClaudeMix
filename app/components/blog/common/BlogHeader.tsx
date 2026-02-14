// BlogHeader - Component (components層)
// ブログヘッダー（タイトル、テーマ切り替えボタン、メニューボタン）

import React from 'react';
import { Link } from '@remix-run/react';
import NavigationMenu from './NavigationMenu';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { MenuItem } from '~/data-io/blog/common/loadBlogConfig.server';
import { data as defaultSpec } from '~/generated/specs/blog/common';
import type { BlogCommonSpec } from '~/specs/blog/types';
import { extractTestId } from '~/lib/blog/common/extractTestId';

interface BlogHeaderProps {
  blogTitle: string;
  logoPath: string;
  menuItems: MenuItem[];
  spec?: BlogCommonSpec;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({
  blogTitle,
  logoPath,
  menuItems,
  spec = defaultSpec
}) => {
  const { ui_selectors, accessibility, navigation } = spec;

  return (
    <header
      className="blog-header blog-header-structure"
      data-testid={extractTestId(ui_selectors.header.blog_header)}
    >
      <Link
        to="/blog"
        className="blog-header__title"
        data-testid={extractTestId(ui_selectors.header.title_link)}
        prefetch="none"
      >
        <img
          src={logoPath}
          alt={blogTitle}
          width={736}
          height={143}
          className="blog-header__logo"
          decoding="async"
          {...{ fetchpriority: "high" }}
        />
      </Link>
      <div
        className="blog-header__actions"
        data-testid={extractTestId(ui_selectors.header.header_actions)}
      >
        <ThemeToggleButton spec={spec} />
        <input type="checkbox" id="menu-toggle" className="u-menu-checkbox" />
        <label
          htmlFor="menu-toggle"
          className="blog-header__menu-button u-menu-open-label"
          data-testid={extractTestId(ui_selectors.header.menu_button)}
          aria-label={accessibility.aria_labels.menu_button}
        >
          <span aria-hidden="true">{navigation.menu_icon}</span>
        </label>
        <label
          htmlFor="menu-toggle"
          className="blog-header__menu-button u-menu-close-label"
          aria-label={accessibility.aria_labels.menu_button_open}
        >
          <span aria-hidden="true">{navigation.menu_icon}</span>
        </label>
        <NavigationMenu
          menuItems={menuItems}
          spec={spec}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                  const cb = document.getElementById('menu-toggle');
                  if (cb) cb.checked = false;
                }
              });
            `
          }}
        />
      </div>
    </header>
  );
};

export default BlogHeader;
