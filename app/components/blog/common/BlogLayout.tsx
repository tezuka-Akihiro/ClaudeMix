// BlogLayout - Component (components層)
// ページ全体のレイアウトコンテナ（Header/Footer/Contentエリア）

import React from 'react';
import BlogHeader from '~/components/blog/common/BlogHeader';
import BlogFooter from '~/components/blog/common/BlogFooter';
import type { BlogConfig } from '~/data-io/blog/common/loadBlogConfig.server';
import { extractTestId } from '~/lib/blog/common/extractTestId';
import { data as defaultSpec } from '~/generated/specs/blog/common';

interface BlogLayoutProps {
  config: BlogConfig;
  children: React.ReactNode;
}

const BlogLayout: React.FC<BlogLayoutProps> = ({ config, children }) => {
  const spec = config.spec || defaultSpec;

  return (
    <div
      className="blog-layout blog-layout-structure"
      data-testid={extractTestId(spec.ui_selectors.layout.blog_layout)}
    >
      <BlogHeader
        blogTitle={config.blogTitle}
        logoPath={config.logoPath}
        menuItems={config.menuItems}
        spec={spec}
      />
      <main
        className="blog-main-content-structure"
        data-testid={extractTestId(spec.ui_selectors.layout.main_content)}
        style={{ marginTop: 'var(--layout-header-height)' }}
      >
        {children}
      </main>
      <BlogFooter
        copyright={config.copyright}
        spec={spec}
      />
    </div>
  );
};

export default BlogLayout;
