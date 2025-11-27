// BlogLayout - Component (components層)
// ページ全体のレイアウトコンテナ（Header/Footer/Contentエリア）

import React from 'react';
import BlogHeader from '~/components/blog/common/BlogHeader';
import BlogFooter from '~/components/blog/common/BlogFooter';
import type { BlogConfig } from '~/data-io/blog/common/loadBlogConfig.server';

interface BlogLayoutProps {
  config: BlogConfig;
  children: React.ReactNode;
}

const BlogLayout: React.FC<BlogLayoutProps> = ({ config, children }) => {
  return (
    <div className="blog-layout blog-layout-structure" data-testid="blog-layout">
      <BlogHeader
        blogTitle={config.blogTitle}
        menuItems={config.menuItems}
      />
      <main
        className="blog-main-content-structure"
        data-testid="blog-main"
        style={{ marginTop: 'var(--layout-header-height)' }}
      >
        {children}
      </main>
      <BlogFooter copyright={config.copyright} />
    </div>
  );
};

export default BlogLayout;
